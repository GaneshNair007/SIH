import json
import logging
from typing import List, Dict, Any, Optional
from backend.config import settings
from backend.schemas.worker import WorkerProfile
from backend.schemas.dosimetry import ShiftScanPayload
from backend.schemas.advisory import DosimeterAdvisoryPayload, RecommendationItem, BilingualContent
from backend.rag.retriever import retriever
from backend.rag.static_protocol import get_static_protocol_advisory
from backend.guardrails.safety_lock import apply_deterministic_safety_locks
from backend.guardrails.clinical_filter import sanitize_advisory_payload

logger = logging.getLogger(__name__)

ADVISORY_SYSTEM_PROMPT = """
You are Rakshak-H2S (रक्षक), an expert AI Occupational Health and Safety Advisor for petroleum refineries (MRPL Mangalore).
Your duty is to generate empathetic, strictly grounded, bilingual post-scan exposure guidance for refinery workers and shift supervisors.

STRICT NON-NEGOTIABLE PRINCIPLES:
1. NEVER USE SINGLE-NUMBER FAKE PRECISION DOSES. Present all exposure strictly as the computed uncertainty range (e.g. '12.1–14.8 ppm·h', TWA '1.5–1.9 ppm').
2. Ingest Patch B drift and Patch C condition to inform the worker if their physical badge experienced baseline drift or seal degradation.
3. Treat environmental weather data strictly as contextual ambient telemetry.
4. Ground all compliance statements strictly in [Retrieved RAG Context]. Never invent OISD/DGMS clauses.
5. Recommendations MUST be ordered in strict ASCENDING priority:
   - Level 1: [LOW / SELF-CARE] (Skin wash, eye saline flush, rest in positive pressure shelter)
   - Level 2: [RECOMMENDED / OPERATIONAL] (Cartridge change, mask seal check, badge swap, leak reporting)
   - Level 3: [MANDATORY / CLINICAL] (OHC referral, SpO2, Spirometry, OISD Form-A)
6. NEVER provide medical prescriptions, drug dosages (mg/ml), or diagnoses. Use triage/first-aid language only.
7. Provide high-quality Hindi translations in Devanagari script alongside English text.
"""

def build_user_prompt(
    worker: WorkerProfile,
    scan: ShiftScanPayload,
    rag_context: str
) -> str:
    metrics = scan.computed_metrics
    b_data = scan.badge_data
    e_data = scan.environmental_telemetry

    return f"""
### WORKER PROFILE:
- Worker ID: {worker.worker_id} ({worker.full_name}, Age: {worker.age})
- Unit: {worker.plant_unit} | Role: {worker.role}
- Health Conditions: {', '.join(worker.health_profile.pre_existing_conditions) or 'None reported'}
- Ocular Sensitivity: {worker.health_profile.ocular_sensitivity} | Allergies: {', '.join(worker.health_profile.allergies) or 'None'}
- Smoking Status: {worker.health_profile.smoking_status} ({worker.health_profile.smoking_pack_years} pack-years)
- Known Historical Symptoms: {', '.join(worker.health_profile.historical_symptoms) or 'None logged'}

### BADGE INTEGRITY & DIFFERENTIAL DOSIMETRY (DETERMINISTIC - DO NOT ALTER):
- Band ID: {b_data.badge_id} (Day {b_data.band_lifecycle_day} of 5-day lifecycle)
- Differential Optical Density: Start ΔE={b_data.start_optical_density} -> End ΔE={b_data.end_optical_density} (Net ΔE: {metrics.net_delta_e})
- Patch B Control Drift: {b_data.patch_b_drift} | Patch C State: {b_data.patch_c_condition}
- Measurement Confidence: {metrics.measurement_confidence}
- Badge Integrity Warning: {metrics.badge_integrity_warning or 'None (Normal substrate integrity)'}

### COMPUTED EXPOSURE UNCERTAINTY RANGES:
- Shift Duration: {scan.shift_duration_hours} hours
- Shift Dose Range: {metrics.shift_dose_range_str}
- Shift TWA Range: {metrics.shift_twa_range_str}
- Updated 7-Day Cumulative Load Range: {metrics.updated_7day_range_str}
- Statutory Risk Tier: {metrics.statutory_tier}

### CONTEXTUAL ENVIRONMENTAL TELEMETRY:
- Ambient Conditions: {e_data.temperature_c}°C, {e_data.relative_humidity_pct}% RH ({e_data.source})

### RETRIEVED REGULATORY RAG CONTEXT:
{rag_context}

Generate the structured DosimeterAdvisoryPayload with plain-language worker guidance reflecting the dose uncertainty range, badge integrity status, and ascending-priority recommendations.
"""

def generate_dosimeter_advisory(
    worker: WorkerProfile,
    scan: ShiftScanPayload
) -> DosimeterAdvisoryPayload:
    """
    Orchestrates RAG retrieval, CRAG confidence gating, LLM structured generation,
    safety locks, and clinical scope sanitation.
    """
    metrics = scan.computed_metrics
    tier = metrics.statutory_tier
    dose_range = metrics.shift_dose_range_str
    twa_range = metrics.shift_twa_range_str
    load_7d_range = metrics.updated_7day_range_str
    confidence = metrics.measurement_confidence
    integrity_notice = metrics.badge_integrity_warning
    
    # 1. Retrieve RAG Context
    query_text = f"H2S exposure {tier} TWA {twa_range} 7-day load {load_7d_range} {scan.plant_unit} respirator cartridge first aid badge patch"
    chunks, rag_conf = retriever.query(query_text, top_k=3)
    
    # 2. CRAG Check: If confidence < 0.85, use Static Protocol Table
    if rag_conf < settings.RAG_CONFIDENCE_THRESHOLD or not settings.GROQ_API_KEY:
        logger.info(f"Using Static Protocol Fallback (RAG Score: {rag_conf:.2f}, Key configured: {bool(settings.GROQ_API_KEY)})")
        advisory = get_static_protocol_advisory(
            tier=tier,
            worker_id=worker.worker_id,
            shift_dose_range=dose_range,
            shift_twa_range=twa_range,
            rolling_7day_range=load_7d_range,
            confidence=confidence,
            badge_integrity_notice=integrity_notice
        )
    else:
        # 3. Call Groq with instructor for structured output
        rag_context = "\n\n".join([f"[{c['doc_name']} - {c['title']}]:\n{c['content']}" for c in chunks])
        user_prompt = build_user_prompt(worker, scan, rag_context)
        
        try:
            from groq import Groq
            import instructor
            
            raw_groq = Groq(api_key=settings.GROQ_API_KEY, timeout=4.0, max_retries=1)
            client = instructor.from_groq(raw_groq)
            advisory = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                response_model=DosimeterAdvisoryPayload,
                temperature=0.1,
                messages=[
                    {"role": "system", "content": ADVISORY_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ]
            )
            advisory.rag_retrieval_mode = "HYBRID_RAG"
        except Exception as e:
            logger.warning(f"Groq LLM call failed ({e}), falling back to static protocol table.")
            advisory = get_static_protocol_advisory(
                tier=tier,
                worker_id=worker.worker_id,
                shift_dose_range=dose_range,
                shift_twa_range=twa_range,
                rolling_7day_range=load_7d_range,
                confidence=confidence,
                badge_integrity_notice=integrity_notice
            )

    # 4. Apply Hard Deterministic Guardrails & Safety Locks
    advisory = apply_deterministic_safety_locks(advisory, deterministic_tier=tier)
    
    # 5. Sanitize Clinical Scope
    advisory, _ = sanitize_advisory_payload(advisory)
    
    return advisory
