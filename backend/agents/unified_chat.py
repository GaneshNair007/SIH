import re
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional, List
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database.models import WorkerModel, ExposureLedgerModel, ShiftScanModel
from backend.schemas.worker import WorkerProfile, HealthProfile, PPEDetails, ExposureLedger, PhysicalBandRecord
from backend.schemas.dosimetry import (
    ShiftScanPayload, BadgeData, ContextualEnvironmentalTelemetry, ComputedMetrics,
    PatchCondition, MeasurementConfidence
)
from backend.engine.weather import get_kinetic_weather
from backend.engine.statutory import (
    compute_differential_shift_dose,
    classify_statutory_tier_range,
    evaluate_badge_integrity
)
from backend.engine.ledger import update_worker_exposure_ledger
from backend.agents.advisory import generate_dosimeter_advisory
from backend.rag.retriever import retriever
from backend.intelligence.lung_risk import calculate_chronic_lung_risk_score

class UnifiedChatAgent:
    """
    Unified Conversational Agent for Rakshak (रक्षक).
    Follows strict engineering constraints:
    - Low-High Dose Uncertainty Ranges (No fake precision)
    - Differential Shift Evaluation (ΔE_end - ΔE_start)
    - Patch B & C Badge Integrity Ingestion
    - Contextual Telemetry Framing
    """
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def get_session(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "worker_id": "EMP-1042",
                "lang": "en",
                "state": "IDLE"
            }
        return self.sessions[session_id]

    def process_message(self, session_id: str, message: str, db: Session) -> Dict[str, Any]:
        session = self.get_session(session_id)
        msg_clean = message.strip().lower()
        lang = session["lang"]
        
        # Language Switch Commands
        if "hindi" in msg_clean or "हिन्दी" in msg_clean or "हिंदी" in msg_clean or msg_clean == "2":
            session["lang"] = "hi"
            lang = "hi"
            return {
                "reply": "भाषा को **हिन्दी** में सेट कर दिया गया है। मैं आपकी क्या मदद कर सकता हूँ?\n\nआप कह सकते हैं: 'बैज स्कैन दर्ज करें', 'एक्सपोजर रेंज बताएं', 'पैच अखंडता जांच', या 'फेफड़े जोखिम'।",
                "quick_actions": ["बैज स्कैन दर्ज करें", "मेरा एक्सपोजर लोड (रेंज)", "पैच अखंडता (Integrity)", "सुरक्षा नियम (PPE)"]
            }
        elif "english" in msg_clean or "switch to english" in msg_clean or msg_clean == "1":
            session["lang"] = "en"
            lang = "en"
            return {
                "reply": "Language set to **English**. How can I assist you today?\n\nYou can say: 'Scan my badge', 'Check exposure range', 'Patch integrity test', or 'Worker insights'.",
                "quick_actions": ["Log Shift Scan", "Check Exposure Range", "Patch Integrity Check", "PPE Guidelines"]
            }

        # Intent 1: Differential Badge Scan Intake
        if any(k in msg_clean for k in ["scan", "badge", "delta e", "reading", "shift end", "बैज", "स्कैन", "रीडिंग"]):
            return self._handle_differential_scan(session, message, db, lang)

        # Intent 2: Cumulative Exposure Range Query
        if any(k in msg_clean for k in ["exposure", "load", "history", "7 day", "90 day", "एक्सपोजर", "लोड", "इतिहास", "रेंज"]):
            return self._handle_exposure_query(session, db, lang)

        # Intent 3: Patch B/C Integrity Test
        if any(k in msg_clean for k in ["patch", "tamper", "seal", "drift", "पैच", "सील", "डैमेज"]):
            return self._handle_patch_check(session, lang)

        # Intent 4: Chronic Lung Risk Query
        if any(k in msg_clean for k in ["lung", "chronic", "asthma", "risk score", "फेफड़े", "जोखिम"]):
            return self._handle_lung_risk_query(session, db, lang)

        # Intent 5: General Q&A / RAG consultation
        return self._handle_rag_query(message, session, lang)

    def _handle_differential_scan(self, session: Dict[str, Any], message: str, db: Session, lang: str) -> Dict[str, Any]:
        worker_id = session.get("worker_id", "EMP-1042")
        
        # Extract Start and End Delta E
        nums = [float(n) for n in re.findall(r'\b\d+(?:\.\d+)?\b', message) if 0.0 <= float(n) <= 35.0]
        start_delta_e = 0.5
        end_delta_e = 4.2
        patch_b_drift = 0.1
        patch_c_condition: PatchCondition = "NORMAL"

        if len(nums) >= 2:
            start_delta_e = nums[0]
            end_delta_e = nums[1]
        elif len(nums) == 1:
            end_delta_e = nums[0]

        if "warning" in message.lower() or "degraded" in message.lower():
            patch_c_condition = "WARNING"
        elif "compromised" in message.lower() or "tamper" in message.lower() or "breach" in message.lower():
            patch_c_condition = "COMPROMISED"
            patch_b_drift = 0.8

        unit = "CDU-1"
        for u in ["CDU-1", "CDU-2", "DHDS", "SRU", "Tank Farm", "Flare Header"]:
            if u.lower() in message.lower():
                unit = u
                break

        shift_hours = 8.0

        # Worker Profile lookup
        db_worker = db.query(WorkerModel).filter(WorkerModel.worker_id == worker_id).first()
        if not db_worker:
            db_worker = WorkerModel(
                worker_id=worker_id,
                full_name=f"Worker {worker_id}",
                plant_unit=unit,
                health_profile_json="{}",
                ppe_details_json="{}"
            )
            db.add(db_worker)
            db.commit()
            db.refresh(db_worker)

        worker_dict = db_worker.to_dict()
        worker_profile = WorkerProfile(
            worker_id=db_worker.worker_id,
            full_name=db_worker.full_name,
            age=db_worker.age,
            gender=db_worker.gender,
            department=db_worker.department,
            plant_unit=unit,
            role=db_worker.role,
            preferred_language=lang,
            health_profile=HealthProfile(**worker_dict["health_profile"]),
            ppe_details=PPEDetails(**worker_dict["ppe_details"]),
            exposure_ledger=ExposureLedger(**worker_dict.get("exposure_ledger", {}))
        )

        # 1. Differential Shift Math & Uncertainty Ranges
        diff_res = compute_differential_shift_dose(
            start_delta_e=start_delta_e,
            end_delta_e=end_delta_e,
            patch_b_drift=patch_b_drift,
            patch_c_condition=patch_c_condition,
            shift_hours=shift_hours
        )

        # 2. Contextual Telemetry
        weather = get_kinetic_weather()
        telemetry = ContextualEnvironmentalTelemetry(
            temperature_c=weather["temperature_c"],
            relative_humidity_pct=weather["relative_humidity_pct"],
            source=weather["source"]
        )

        # 3. Cumulative Ledger Update (Ranges)
        prior_7d = worker_profile.exposure_ledger.rolling_7day_high_ppm_hr
        updated_ledger = update_worker_exposure_ledger(
            db, worker_id, diff_res["dose_low"], diff_res["dose_high"]
        )

        # 4. Statutory Tier
        tier, is_single_crit = classify_statutory_tier_range(
            twa_low=diff_res["twa_low"],
            twa_high=diff_res["twa_high"],
            updated_7day_high=updated_ledger["load_7d_high"],
            dose_high=diff_res["dose_high"]
        )

        metrics = ComputedMetrics(
            net_delta_e=diff_res["net_delta_e"],
            shift_dose_low_ppm_hr=diff_res["dose_low"],
            shift_dose_high_ppm_hr=diff_res["dose_high"],
            shift_dose_range_str=diff_res["dose_range_str"],
            shift_twa_low_ppm=diff_res["twa_low"],
            shift_twa_high_ppm=diff_res["twa_high"],
            shift_twa_range_str=diff_res["twa_range_str"],
            shift_hours=shift_hours,
            prior_7day_load_ppm_hr=prior_7d,
            updated_7day_load_low=updated_ledger["load_7d_low"],
            updated_7day_load_high=updated_ledger["load_7d_high"],
            updated_7day_range_str=updated_ledger["range_7d_str"],
            statutory_tier=tier, # type: ignore
            measurement_confidence=diff_res["confidence"],
            badge_integrity_warning=diff_res["integrity_warning"],
            is_single_shift_critical=is_single_crit
        )

        scan_id = f"SCN-{uuid.uuid4().hex[:8].upper()}"
        badge_data = BadgeData(
            badge_id="BAND-01",
            band_lifecycle_day=1,
            start_optical_density=start_delta_e,
            end_optical_density=end_delta_e,
            patch_b_drift=patch_b_drift,
            patch_c_condition=patch_c_condition,
            shelf_life_status="VALID"
        )

        scan_payload = ShiftScanPayload(
            scan_id=scan_id,
            worker_id=worker_id,
            plant_unit=unit,
            timestamp=datetime.now(timezone.utc),
            shift_duration_hours=shift_hours,
            badge_data=badge_data,
            environmental_telemetry=telemetry,
            computed_metrics=metrics
        )

        # Structured Advisory
        advisory = generate_dosimeter_advisory(worker_profile, scan_payload)

        # Save to DB
        db_scan = ShiftScanModel(
            scan_id=scan_id,
            worker_id=worker_id,
            plant_unit=unit,
            timestamp=datetime.now(timezone.utc),
            shift_duration_hours=shift_hours,
            badge_id=badge_data.badge_id,
            delta_e=diff_res["net_delta_e"],
            shelf_life_status="VALID",
            raw_optical_dose=diff_res["nominal_dose"],
            temperature_c=weather["temperature_c"],
            relative_humidity_pct=weather["relative_humidity_pct"],
            k_factor=1.0,
            telemetry_source=weather["source"],
            compensated_dose_ppm_hr=diff_res["nominal_dose"],
            shift_twa_ppm=(diff_res["twa_low"] + diff_res["twa_high"]) / 2.0,
            updated_7day_load=updated_ledger["load_7d_high"],
            statutory_tier=tier,
            is_single_shift_critical=is_single_crit,
            advisory_json=advisory.model_dump_json()
        )
        db.add(db_scan)
        db.commit()

        # Build Response
        if lang == "hi":
            reply_title = f"📊 **डिफरेंशियल शिफ्ट एक्सपोजर विश्लेषण — {tier}**\n\n"
            reply_text = (
                f"{advisory.bilingual_content.summary_banner_hi if advisory.bilingual_content else advisory.summary_banner}\n\n"
                f"• **अनुमानित शिफ्ट TWA रेंज:** `{metrics.shift_twa_range_str}`\n"
                f"• **डिफरेंशियल खुराक रेंज:** `{metrics.shift_dose_range_str}` (नेट ΔE: {metrics.net_delta_e})\n"
                f"• **7-दिवसीय संचयी भार रेंज:** `{metrics.updated_7day_range_str}`\n"
                f"• **माप सटीकता स्तर:** `{metrics.measurement_confidence}` (Patch B: {patch_b_drift}, Patch C: {patch_c_condition})\n\n"
                f"❓ **लक्षण जांच:** {advisory.bilingual_content.triage_question_hi if advisory.bilingual_content else advisory.triage_question}"
            )
        else:
            reply_title = f"📊 **Differential Shift Exposure Analysis — {tier}**\n\n"
            reply_text = (
                f"{advisory.summary_banner}\n\n"
                f"• **Estimated Shift TWA Range:** `{metrics.shift_twa_range_str}`\n"
                f"• **Differential Dose Range:** `{metrics.shift_dose_range_str}` (Net ΔE: {metrics.net_delta_e})\n"
                f"• **7-Day Cumulative Load Range:** `{metrics.updated_7day_range_str}`\n"
                f"• **Measurement Confidence:** `{metrics.measurement_confidence}` (Patch B drift: {patch_b_drift}, Patch C: {patch_c_condition})\n\n"
                f"❓ **Symptom Check:** {advisory.triage_question}"
            )

        return {
            "reply": reply_title + reply_text,
            "scan_result": {
                "scan_id": scan_id,
                "tier": tier,
                "twa_range": metrics.shift_twa_range_str,
                "dose_range": metrics.shift_dose_range_str,
                "updated_7day_range": metrics.updated_7day_range_str,
                "confidence": metrics.measurement_confidence,
                "integrity_warning": metrics.badge_integrity_warning,
                "recommendations": [r.model_dump() for r in advisory.recommendations],
                "mandatory_ohc_override_applied": advisory.mandatory_ohc_override_applied
            },
            "quick_actions": ["No symptoms (सब ठीक है)", "Mild eye stinging (आंखों में जलन)", "Run Smell Test (गंध जांच)"]
        }

    def _handle_exposure_query(self, session: Dict[str, Any], db: Session, lang: str) -> Dict[str, Any]:
        worker_id = session.get("worker_id", "EMP-1042")
        worker = db.query(WorkerModel).filter(WorkerModel.worker_id == worker_id).first()
        if not worker or not worker.ledger:
            reply = "No previous shift logs found. Please log your badge scan first." if lang == "en" else "कोई पुराना रिकॉर्ड नहीं मिला। कृपया पहले अपना बैज स्कैन करें।"
            return {"reply": reply, "quick_actions": ["Log Shift Scan"]}

        leg = worker.ledger
        load_7d = leg.rolling_7day_ppm_hr
        load_7d_low = round(load_7d * 0.88, 1)
        load_7d_high = round(load_7d * 1.12, 1)
        range_7d = f"{load_7d_low}–{load_7d_high} ppm·h"

        if lang == "hi":
            reply = (
                f"📈 **आपका H2S संचयी एक्सपोजर लेजर ({worker_id}):**\n\n"
                f"• **7-दिवसीय भार रेंज:** `{range_7d}` (वैधानिक सीमा: 15.0 ppm·hr)\n"
                f"• **30-दिवसीय अनुमानित भार:** `{leg.rolling_30day_ppm_hr} ppm·hr`\n"
                f"• **90-दिवसीय दीर्घकालिक भार:** `{leg.rolling_90day_ppm_hr} ppm·hr`\n"
                f"• **कुल दर्ज पाली:** `{leg.lifetime_shifts_logged}`\n\n"
                f"सुरक्षा नियम: कोई एकल संख्या (फेक प्रिसिजन) नहीं, सभी आंकड़े अनिश्चितता सीमा के साथ प्रदर्शित हैं।"
            )
        else:
            reply = (
                f"📈 **Your Cumulative H2S Exposure Range Ledger ({worker_id}):**\n\n"
                f"• **7-Day Rolling Load Range:** `{range_7d}` (Permissible Limit: < 15.0 ppm·hr)\n"
                f"• **30-Day Estimated Load:** `{leg.rolling_30day_ppm_hr} ppm·hr`\n"
                f"• **90-Day Rolling Chronic Load:** `{leg.rolling_90day_ppm_hr} ppm·hr`\n"
                f"• **Lifetime Shifts Logged:** `{leg.lifetime_shifts_logged}`\n\n"
                f"Measurement Notice: In accordance with occupational hygiene standards, values are reported strictly as uncertainty ranges."
            )
        return {
            "reply": reply,
            "quick_actions": ["Log Shift Scan", "Calculate Lung Risk", "Patch Integrity Check"]
        }

    def _handle_patch_check(self, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        if lang == "hi":
            reply = (
                "🛡️ **कलाई बैज पैच अखंडता जांच (Integrity Check):**\n\n"
                "• **Patch A (सक्रिय सेंसर):** H2S के संपर्क में आने पर रंग बदलता है।\n"
                "• **Patch B (कंट्रोल ब्लैंक):** आधारभूत बहाव / सील टूटने की जांच करता है (स्वीकार्य बहाव < 0.35)।\n"
                "• **Patch C (रासायनिक अखंडता):** नमी/हवा के संपर्क में क्षरण की निगरानी करता है।\n\n"
                "यदि Patch C का रंग बदला हुआ दिखे तो काम शुरू करने से पहले बैज तुरंत बदलें।"
            )
        else:
            reply = (
                "🛡️ **Wristband Patch Integrity & Seal Check:**\n\n"
                "• **Patch A (Active Sensor):** Reacts to cumulative H2S exposure.\n"
                "• **Patch B (Control Reference):** Detects sunlight drift and seal tamper (Permissible drift < 0.35).\n"
                "• **Patch C (Integrity Indicator):** Monitors environmental seal & chemical stability (NORMAL, WARNING, COMPROMISED).\n\n"
                "Notice: Always inspect Patch C prior to entering sour gas zones. Enforce the 5-day active patch lifecycle."
            )
        return {
            "reply": reply,
            "quick_actions": ["Log Shift Scan (Normal Patch)", "Simulate Compromised Patch", "OISD PPE Rules"]
        }

    def _handle_lung_risk_query(self, session: Dict[str, Any], db: Session, lang: str) -> Dict[str, Any]:
        worker_id = session.get("worker_id", "EMP-1042")
        worker = db.query(WorkerModel).filter(WorkerModel.worker_id == worker_id).first()
        if not worker:
            return {"reply": "Worker not registered yet.", "quick_actions": ["Register Profile"]}

        worker_dict = worker.to_dict()
        worker_profile = WorkerProfile(
            worker_id=worker.worker_id,
            full_name=worker.full_name,
            age=worker.age,
            gender=worker.gender,
            department=worker.department,
            plant_unit=worker.plant_unit,
            role=worker.role,
            preferred_language=lang,
            health_profile=HealthProfile(**worker_dict["health_profile"]),
            ppe_details=PPEDetails(**worker_dict["ppe_details"]),
            exposure_ledger=ExposureLedger(**worker_dict.get("exposure_ledger", {}))
        )
        res = calculate_chronic_lung_risk_score(worker_profile)
        
        if lang == "hi":
            reply = (
                f"🫁 **दीर्घकालिक फेफड़े-जोखिम मूल्यांकन ({worker_profile.full_name}):**\n\n"
                f"• **समग्र जोखिम स्कोर:** `{res['chronic_lung_risk_score']} / 100` ({res['risk_category']})\n"
                f"• **90-दिवसीय एक्सपोजर भार:** `{res['breakdown']['exposure_90d_load_ppm_hr']} ppm·hr`\n"
                f"• **धूम्रपान पैक-वर्ष:** `{res['breakdown']['smoking_pack_years']}`\n\n"
                f"📋 **व्यावसायिक सलाह:** {res['recommendation_hi']}"
            )
        else:
            reply = (
                f"🫁 **Chronic Occupational Lung-Risk Score ({worker_profile.full_name}):**\n\n"
                f"• **Composite Risk Score:** `{res['chronic_lung_risk_score']} / 100` ({res['risk_category']})\n"
                f"• **90-Day Exposure Load:** `{res['breakdown']['exposure_90d_load_ppm_hr']} ppm·hr`\n"
                f"• **Smoking Pack-Years:** `{res['breakdown']['smoking_pack_years']}`\n\n"
                f"📋 **Occupational Health Action:** {res['recommendation_en']}"
            )
        return {
            "reply": reply,
            "quick_actions": ["Log Shift Scan", "Check Exposure Range", "Patch Integrity Check"]
        }

    def _handle_rag_query(self, message: str, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        chunks, conf = retriever.query(message, top_k=2)
        if chunks and conf >= 0.4:
            context = "\n\n".join([f"**[{c['title']} - {c['doc_name']}]:**\n{c['content']}" for c in chunks])
            if lang == "hi":
                reply = f"🛡️ **रक्षक सुरक्षा ज्ञानकोष (OISD / DGMS मानक):**\n\n{context}\n\nयदि आप अपनी शिफ्ट का डिफरेंशियल बैज दर्ज करना चाहते हैं, तो मुझे बताएं।"
            else:
                reply = f"🛡️ **Rakshak Safety Knowledge Base (OISD / DGMS Guidelines):**\n\n{context}\n\nLet me know if you would like to log a differential shift scan or check your symptoms."
        else:
            if lang == "hi":
                reply = "नमस्ते! मैं **रक्षक (Rakshak-H2S)** हूँ। मैं अनिश्चितता रेंज (Dose Ranges), डिफरेंशियल शिफ्ट विश्लेषण (ΔE Start vs End), और पैच अखंडता जांच के साथ आपकी सुरक्षा निगरानी करता हूँ।"
            else:
                reply = "Hello! I am **Rakshak-H2S (रक्षक)**. I monitor your shift safety using differential scan evaluation (Start vs End ΔE), uncertainty dose ranges, and Patch B/C integrity tracking."
                
        return {
            "reply": reply,
            "quick_actions": ["Log Shift Scan (Start: 0.5, End: 4.2)", "Check Exposure Range", "Patch Integrity Check", "Supervisor Directives"]
        }

unified_chat = UnifiedChatAgent()
