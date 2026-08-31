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
1. Never invent or alter dosimetry math. Use the provided [Computed Metrics] verbatim.
2. Ground all compliance statements strictly in [Retrieved RAG Context]. Never invent OISD/DGMS clauses.
3. Recommendations MUST be ordered in strict ASCENDING priority:
   - Level 1: [LOW / SELF-CARE] (Skin wash, eye saline flush, rest in positive pressure shelter)
   - Level 2: [RECOMMENDED / OPERATIONAL] (Cartridge change, mask seal check, leak reporting)
   - Level 3: [MANDATORY / CLINICAL] (OHC referral, SpO2, Spirometry, OISD Form-A)
4. NEVER provide medical prescriptions, drug dosages (mg/ml), or diagnoses. Use triage/first-aid language only.
5. Provide high-quality Hindi translations in Devanagari script alongside English text.
"""

def build_user_prompt(
    worker: WorkerProfile,
    scan: ShiftScanPayload,
    rag_context: str
) -> str:
    metrics = scan.computed_metrics
    return f"""
### WORKER PROFILE:
- Worker ID: {worker.worker_id} ({worker.full_name}, Age: {worker.age})
- Unit: {worker.plant_unit} | Role: {worker.role}
- Health Conditions: {', '.join(worker.health_profile.pre_existing_conditions) or 'None reported'}
- Ocular Sensitivity: {worker.health_profile.ocular_sensitivity} | Allergies: {', '.join(worker.health_profile.allergies) or 'None'}
- Smoking Status: {worker.health_profile.smoking_status} ({worker.health_profile.smoking_pack_years} pack-years)
- Respirator: {worker.ppe_details.respirator_type} (Cartridge: {worker.ppe_details.cartridge_type})

### COMPUTED DOSIMETRY METRICS (DETERMINISTIC - DO NOT ALTER):
- Shift Duration: {scan.shift_duration_hours} hours
- Raw Optical Dose: {scan.badge_data.raw_optical_dose} ppm·hr
- Ambient Telemetry: {scan.environmental_telemetry.temperature_c}°C, {scan.environmental_telemetry.relative_humidity_pct}% RH (k-factor: {scan.environmental_telemetry.k_factor})
- Compensated Dose: {metrics.compensated_dose_ppm_hr} ppm·hr
- Shift TWA: {metrics.shift_twa_ppm} ppm
- Updated 7-Day Cumulative Load: {metrics.updated_7day_load} ppm·hr
- Statutory Risk Tier: {metrics.statutory_tier}
- Single-Shift Critical Alert (>20 ppm·hr): {metrics.is_single_shift_critical}

### RETRIEVED REGULATORY RAG CONTEXT:
{rag_context}

Generate the structured DosimeterAdvisoryPayload with plain-language worker guidance, ascending priority recommendations, triage question, and supervisor engineering actions.
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
    twa = metrics.shift_twa_ppm
    load_7d = metrics.updated_7day_load
    
    # 1. Retrieve RAG Context
    query_text = f"H2S exposure {tier} TWA {twa} ppm 7-day load {load_7d} {scan.plant_unit} respirator cartridge first aid"
    chunks, confidence = retriever.query(query_text, top_k=3)
    
    # 2. CRAG Check: If confidence < 0.85, use Static Protocol Table
    if confidence < settings.RAG_CONFIDENCE_THRESHOLD or not settings.GROQ_API_KEY:
        logger.info(f"Using Static Protocol Fallback (Confidence: {confidence:.2f}, Key configured: {bool(settings.GROQ_API_KEY)})")
        advisory = get_static_protocol_advisory(
            tier=tier,
            worker_id=worker.worker_id,
            twa_ppm=twa,
            rolling_7day_load=load_7d
        )
    else:
        # 3. Call Groq with instructor for structured output
        rag_context = "\n\n".join([f"[{c['doc_name']} - {c['title']}]:\n{c['content']}" for c in chunks])
        user_prompt = build_user_prompt(worker, scan, rag_context)
        
        try:
            from groq import Groq
            import instructor
            
            client = instructor.from_groq(Groq(api_key=settings.GROQ_API_KEY))
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
                twa_ppm=twa,
                rolling_7day_load=load_7d
            )

    # 4. Apply Hard Deterministic Guardrails & Safety Locks
    advisory = apply_deterministic_safety_locks(advisory, deterministic_tier=tier)
    
    # 5. Sanitize Clinical Scope
    advisory, _ = sanitize_advisory_payload(advisory)
    
    return advisory
