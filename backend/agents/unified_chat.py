import re
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional, List
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database.models import WorkerModel, ExposureLedgerModel, ShiftScanModel
from backend.schemas.worker import WorkerProfile, HealthProfile, PPEDetails, ExposureLedger
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
    Acts as a natural, helpful, human-like safety advisor for refinery workers.
    Focuses on worker well-being, triage, first-aid, and actionable safety
    without lecturing on mathematical formulas or internal engine mechanics.
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
        
        # 1. Language Toggle Commands
        if any(w in msg_clean for w in ["hindi", "हिन्दी", "हिंदी"]) or msg_clean == "2":
            session["lang"] = "hi"
            return {
                "reply": "नमस्ते! भाषा को **हिन्दी** में सेट कर दिया गया है। मैं आपकी सुरक्षा के लिए यहाँ हूँ। आपकी आज की शिफ्ट कैसी रही? आप अपनी बैज रीडिंग दर्ज कर सकते हैं या किसी भी लक्षण के बारे में पूछ सकते हैं।",
                "quick_actions": ["बैज रीडिंग दर्ज करें", "मेरा एक्सपोजर स्टेटस", "गंध थकान जांच (Screener)", "सुरक्षा नियम (PPE)"]
            }
        elif any(w in msg_clean for w in ["english", "switch to english"]) or msg_clean == "1":
            session["lang"] = "en"
            return {
                "reply": "Language set to **English**. How can I help you stay safe today? You can log your badge reading, check your exposure status, or ask about safety procedures.",
                "quick_actions": ["Log Badge Reading", "My Exposure Status", "Olfactory Smell Test", "PPE Guidelines"]
            }

        # 2. Shift Badge Scan / Reading Input
        if any(k in msg_clean for k in ["scan", "badge", "delta e", "reading", "shift end", "shift ended", "बैज", "स्कैन", "रीडिंग"]):
            return self._handle_scan_submission(session, message, db, lang)

        # 3. Exposure Status Query
        if any(k in msg_clean for k in ["exposure", "load", "history", "7 day", "90 day", "status", "एक्सपोजर", "लोड", "स्थिति", "इतिहास"]):
            return self._handle_exposure_query(session, db, lang)

        # 4. Olfactory Fatigue / Smell Test
        if any(k in msg_clean for k in ["screener", "smell", "olfactory", "reflex", "थकान", "गंध", "सूंघने"]):
            return self._handle_screener_query(session, lang)

        # 5. Chronic Lung Risk Query
        if any(k in msg_clean for k in ["lung", "chronic", "asthma", "risk score", "फेफड़े", "जोखिम"]):
            return self._handle_lung_risk_query(session, db, lang)

        # 6. General Safety Q&A / RAG Consultation
        return self._handle_general_safety_query(message, session, lang)

    def _handle_scan_submission(self, session: Dict[str, Any], message: str, db: Session, lang: str) -> Dict[str, Any]:
        worker_id = session.get("worker_id", "EMP-1042")
        
        # Extract numerical readings from message
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

        # Look up or create worker
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

        # 1. Deterministic Math
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

        # 3. Ledger Update
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

        # Persist Scan
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

        # Build clean, human, empathetic response without math lectures
        if lang == "hi":
            if tier == "TIER 3 (CRITICAL)":
                status_msg = "🚨 **गंभीर चेतावनी:** आज आपकी शिफ्ट में H2S का स्तर काफी अधिक रहा है। कृपया तुरंत **ऑक्यूपेशनल हेल्थ सेंटर (OHC)** में रिपोर्ट करें और अपनी जांच करवाएं।"
            elif tier == "TIER 2 (CAUTION)":
                status_msg = "⚠️ **सावधानी:** आज आपकी शिफ्ट में हल्का बढ़ा हुआ एक्सपोजर दर्ज हुआ है। कृपया आईवॉश स्टेशन पर आंखों को सेलाइन से धोएं और 15-20 मिनट आराम करें।"
            else:
                status_msg = "✅ **शिफ्ट सुरक्षित:** आज आपकी शिफ्ट सामान्य और सुरक्षित सीमा के भीतर रही। जाने से पहले हाथ-मुंह धो लें और पानी अवश्य पिएं।"

            integrity_note = "\n\n*(नोट: कलाई का बैज अगली शिफ्ट से पहले बदल लें।)*" if diff_res["integrity_warning"] else ""
            triage_prompt = f"\n\n❓ **लक्षण जांच:** {advisory.bilingual_content.triage_question_hi if advisory.bilingual_content else advisory.triage_question}"
            reply = status_msg + integrity_note + triage_prompt
        else:
            if tier == "TIER 3 (CRITICAL)":
                status_msg = "🚨 **Critical Safety Alert:** High H2S exposure detected on your shift. Please proceed immediately to the **Occupational Health Centre (OHC)** for a precautionary medical evaluation."
            elif tier == "TIER 2 (CAUTION)":
                status_msg = "⚠️ **Precautionary Notice:** Moderately elevated exposure detected today. Please flush your eyes with saline at the wash station and rest in a clean shelter for 15–20 minutes."
            else:
                status_msg = "✅ **Shift Logged — Safe & Normal:** Your shift exposure is well within safe limits today. Good job following safety protocols! Please hydrate and wash up before heading out."

            integrity_note = "\n\n*(Note: Your wristband should be replaced before your next shift.)*" if diff_res["integrity_warning"] else ""
            triage_prompt = f"\n\n❓ **Symptom Check:** {advisory.triage_question}"
            reply = status_msg + integrity_note + triage_prompt

        return {
            "reply": reply,
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
            "quick_actions": ["No symptoms (सब ठीक है)", "Mild eye irritation (आंखों में जलन)", "Run Smell Test (गंध जांच)"]
        }

    def _handle_exposure_query(self, session: Dict[str, Any], db: Session, lang: str) -> Dict[str, Any]:
        worker_id = session.get("worker_id", "EMP-1042")
        worker = db.query(WorkerModel).filter(WorkerModel.worker_id == worker_id).first()
        if not worker or not worker.ledger:
            reply = "No previous shift logs found. Would you like to log today's badge reading?" if lang == "en" else "कोई पुराना रिकॉर्ड नहीं मिला। क्या आप आज का बैज दर्ज करना चाहते हैं?"
            return {"reply": reply, "quick_actions": ["Log Badge Reading"]}

        leg = worker.ledger
        load_7d = leg.rolling_7day_ppm_hr
        load_7d_low = round(load_7d * 0.88, 1)
        load_7d_high = round(load_7d * 1.12, 1)
        range_7d = f"{load_7d_low}–{load_7d_high} ppm·h"

        is_safe = load_7d_high < 15.0

        if lang == "hi":
            status_text = "🟢 **सामान्य एवं सुरक्षित** (सीमा: < 15.0 ppm·hr)" if is_safe else "🟡 **मध्यम (सावधानी आवश्यक)**"
            reply = (
                f"📊 **आपकी हालिया एक्सपोजर स्थिति ({worker_id}):**\n\n"
                f"• **7-दिवसीय संचयी स्थिति:** {status_text} (`{range_7d}`)\n"
                f"• **30-दिवसीय लोड:** `{leg.rolling_30day_ppm_hr} ppm·hr`\n"
                f"• **कुल दर्ज शिफ्ट्स:** `{leg.lifetime_shifts_logged}`\n\n"
                f"आपकी स्थिति अच्छी है। अपने रेस्पिरेटर और पीपीई नियमों का पालन करते रहें!"
            )
        else:
            status_text = "🟢 **Safe & On Track** (Permissible: < 15.0 ppm·hr)" if is_safe else "🟡 **Elevated Load (Rotation Advised)**"
            reply = (
                f"📊 **Your Current Exposure Overview ({worker_id}):**\n\n"
                f"• **7-Day Cumulative Status:** {status_text} (`{range_7d}`)\n"
                f"• **30-Day Estimated Load:** `{leg.rolling_30day_ppm_hr} ppm·hr`\n"
                f"• **Total Shifts Logged:** `{leg.lifetime_shifts_logged}`\n\n"
                f"You are doing well! Keep maintaining a good respirator seal and following plant safety guidelines."
            )
        return {
            "reply": reply,
            "quick_actions": ["Log Shift Reading", "Olfactory Smell Test", "PPE Guidelines"]
        }

    def _handle_screener_query(self, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        if lang == "hi":
            reply = (
                "🧪 **गंध थकान व रिफ्लेक्स जांच:**\n\n"
                "1. क्या काम करते समय शुरू में सड़े अंडे जैसी गंध आई थी जो बाद में आनी बंद हो गई?\n"
                "2. क्या आपकी आंखों में जलन या सिर भारी महसूस हो रहा है?\n\n"
                "कृपया बताएं कि आप कैसा महसूस कर रहे हैं।"
            )
        else:
            reply = (
                "🧪 **Quick Olfactory & Symptom Check:**\n\n"
                "1. Did you notice a strong rotten egg smell earlier that seemed to suddenly disappear while working?\n"
                "2. Are you experiencing eye stinging, headache, or dizziness?\n\n"
                "Please let me know how you're feeling right now:"
            )
        return {
            "reply": reply,
            "quick_actions": ["Feeling fine, no symptoms", "Smell disappeared & eye stinging", "Feeling dizzy/headache"]
        }

    def _handle_lung_risk_query(self, session: Dict[str, Any], db: Session, lang: str) -> Dict[str, Any]:
        worker_id = session.get("worker_id", "EMP-1042")
        worker = db.query(WorkerModel).filter(WorkerModel.worker_id == worker_id).first()
        if not worker:
            return {"reply": "Worker profile not found.", "quick_actions": ["Log Shift Reading"]}

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
                f"🫁 **श्वसन स्वास्थ्य सारांश ({worker_profile.full_name}):**\n\n"
                f"• **जोखिम स्तर:** `{res['risk_category']}` (स्कोर: {res['chronic_lung_risk_score']}/100)\n"
                f"• **स्वास्थ्य सलाह:** {res['recommendation_hi']}"
            )
        else:
            reply = (
                f"🫁 **Respiratory Health Summary ({worker_profile.full_name}):**\n\n"
                f"• **Risk Category:** `{res['risk_category']}` (Score: {res['chronic_lung_risk_score']}/100)\n"
                f"• **Health Advice:** {res['recommendation_en']}"
            )
        return {
            "reply": reply,
            "quick_actions": ["Log Shift Reading", "My Exposure Status", "Olfactory Smell Test"]
        }

    def _handle_general_safety_query(self, message: str, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        chunks, conf = retriever.query(message, top_k=2)
        if chunks and conf >= 0.4:
            context = "\n\n".join([f"**[{c['title']}]:**\n{c['content']}" for c in chunks])
            if lang == "hi":
                reply = f"🛡️ **सुरक्षा दिशानिर्देश (OISD / DGMS):**\n\n{context}\n\nयदि आप आज की शिफ्ट का बैज दर्ज करना चाहते हैं या किसी लक्षण के बारे में पूछना चाहते हैं, तो मुझे बताएं।"
            else:
                reply = f"🛡️ **Plant Safety Guidance:**\n\n{context}\n\nLet me know if you would like to log a badge reading or report any symptoms."
        else:
            if lang == "hi":
                reply = "नमस्ते! मैं **रक्षक (Rakshak)** हूँ — आपका रिफाइनरी सुरक्षा साथी। मैं आपकी शिफ्ट का बैज दर्ज करने, लक्षणों की जांच करने और सुरक्षा नियमों में मदद करने के लिए तैयार हूँ। आज मैं आपकी क्या मदद करूँ?"
            else:
                reply = "Hello! I am **Rakshak (रक्षक)**, your plant safety companion. I'm here to help you log your shift badge, check for symptoms, and guide you on plant safety. How can I help you today?"
                
        return {
            "reply": reply,
            "quick_actions": ["Log Badge Reading (4.2)", "My Exposure Status", "Olfactory Smell Test", "OISD Work Permits"]
        }

unified_chat = UnifiedChatAgent()
