import re
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional, List
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database.models import WorkerModel, ExposureLedgerModel, ShiftScanModel
from backend.schemas.worker import WorkerProfile, HealthProfile, PPEDetails, ExposureLedger
from backend.schemas.dosimetry import ShiftScanPayload, BadgeData, EnvironmentalTelemetry, ComputedMetrics
from backend.engine.weather import get_kinetic_weather
from backend.engine.kinetics import compute_kinetic_factor, compensate_dose
from backend.engine.statutory import calculate_twa, classify_statutory_tier
from backend.engine.ledger import update_worker_exposure_ledger
from backend.agents.advisory import generate_dosimeter_advisory
from backend.rag.retriever import retriever
from backend.intelligence.lung_risk import calculate_chronic_lung_risk_score
from backend.intelligence.neuro_screener import evaluate_neuro_olfactory_screen, NeuroScreeningResponse

class UnifiedChatAgent:
    """
    Unified Conversational Agent for Rakshak (रक्षक).
    Handles:
    - Conversational Intake & Onboarding
    - Badge Scan Processing directly from chat
    - Symptom triage & RAG advisory
    - Neuro-olfactory screening in chat
    - Exposure load queries
    """
    def __init__(self):
        # session_id -> { "worker_id": str, "lang": str, "state": str, "scan_draft": dict }
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def get_session(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "worker_id": "EMP-1042",
                "lang": "en",
                "state": "IDLE", # IDLE, ONBOARDING, SCANNING, SCREENING
                "onboarding_step": "IDENTITY",
                "screener_step": 0,
                "screener_answers": {},
                "draft": {}
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
                "reply": "भाषा को **हिन्दी** में सेट कर दिया गया है। मैं आपकी क्या मदद कर सकता हूँ?\n\nआप कह सकते हैं: 'बैज स्कैन करें', 'मेरा एक्सपोजर लोड बताएं', 'गंध थकान टेस्ट', या 'नया पंजीकरण'।",
                "cards": [],
                "quick_actions": ["बैज स्कैन दर्ज करें", "मेरा एक्सपोजर लोड", "गंध थकान जांच (Screener)", "सुरक्षा नियम (PPE)"]
            }
        elif "english" in msg_clean or "switch to english" in msg_clean or msg_clean == "1":
            session["lang"] = "en"
            lang = "en"
            return {
                "reply": "Language set to **English**. How can I assist you today?\n\nYou can say: 'Scan my badge', 'Check exposure load', 'Olfactory test', or 'Onboard new worker'.",
                "cards": [],
                "quick_actions": ["Log Badge Scan", "Check Exposure Load", "Olfactory Screener", "PPE Safety Guidelines"]
            }

        # Intent 1: Badge Scan Intake from Chat
        if any(k in msg_clean for k in ["scan", "badge", "delta e", "reading", "shift end", "बैज", "स्कैन", "रीडिंग"]):
            return self._handle_scan_intent(session, message, db, lang)

        # Intent 2: Check Cumulative Exposure Load
        if any(k in msg_clean for k in ["exposure", "load", "history", "7 day", "90 day", "एक्सपोजर", "लोड", "इतिहास"]):
            return self._handle_exposure_query(session, db, lang)

        # Intent 3: Olfactory / Smell Screener
        if any(k in msg_clean for k in ["screener", "smell", "olfactory", "reflex", "थकान", "गंध", "सूंघने"]):
            return self._handle_screener_start(session, lang)

        # Intent 4: Chronic Lung Risk Query
        if any(k in msg_clean for k in ["lung", "chronic", "asthma", "risk score", "फेफड़े", "जोखिम"]):
            return self._handle_lung_risk_query(session, db, lang)

        # Intent 5: General Q&A / Regulatory RAG consultation
        return self._handle_rag_query(message, session, lang)

    def _handle_scan_intent(self, session: Dict[str, Any], message: str, db: Session, lang: str) -> Dict[str, Any]:
        worker_id = session.get("worker_id", "EMP-1042")
        
        # Extract Delta E from message if present (e.g. "delta e 4.5", "reading 5.2", "4.2")
        delta_e = 4.2
        num_matches = re.findall(r'\b\d+(?:\.\d+)?\b', message)
        for num in num_matches:
            val = float(num)
            if 0.1 <= val <= 30.0:
                delta_e = val
                break
                
        # Extract Plant Unit
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

        # Kinetic Math & Weather
        weather = get_kinetic_weather()
        k_factor = compute_kinetic_factor(weather["temperature_c"], weather["relative_humidity_pct"])
        raw_dose = round(2.15 * delta_e + 0.08 * (delta_e ** 1.5), 3)
        compensated_dose = compensate_dose(raw_dose, k_factor)
        twa_ppm = calculate_twa(compensated_dose, shift_hours)
        
        # Ledger Update
        prior_7d = worker_profile.exposure_ledger.rolling_7day_ppm_hr
        updated_ledger = update_worker_exposure_ledger(db, worker_id, compensated_dose)
        updated_7d = updated_ledger["rolling_7day_ppm_hr"]

        # Statutory Tier
        tier, is_single_crit = classify_statutory_tier(
            twa_ppm=twa_ppm,
            updated_7day_load_ppm_hr=updated_7d,
            compensated_single_shift_dose=compensated_dose
        )

        metrics = ComputedMetrics(
            compensated_dose_ppm_hr=compensated_dose,
            shift_twa_ppm=twa_ppm,
            shift_hours=shift_hours,
            prior_7day_load=prior_7d,
            updated_7day_load=updated_7d,
            statutory_tier=tier,
            is_single_shift_critical=is_single_crit
        )

        scan_id = f"SCN-{uuid.uuid4().hex[:8].upper()}"
        badge_data = BadgeData(
            badge_id="BAND-01",
            delta_e=delta_e,
            shelf_life_status="VALID",
            raw_optical_dose=raw_dose
        )
        telemetry = EnvironmentalTelemetry(
            temperature_c=weather["temperature_c"],
            relative_humidity_pct=weather["relative_humidity_pct"],
            k_factor=k_factor,
            source=weather["source"]
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

        # Generate Structured Advisory
        advisory = generate_dosimeter_advisory(worker_profile, scan_payload)

        # Save to DB
        db_scan = ShiftScanModel(
            scan_id=scan_id,
            worker_id=worker_id,
            plant_unit=unit,
            timestamp=datetime.now(timezone.utc),
            shift_duration_hours=shift_hours,
            badge_id=badge_data.badge_id,
            delta_e=delta_e,
            shelf_life_status="VALID",
            raw_optical_dose=raw_dose,
            temperature_c=weather["temperature_c"],
            relative_humidity_pct=weather["relative_humidity_pct"],
            k_factor=k_factor,
            telemetry_source=weather["source"],
            compensated_dose_ppm_hr=compensated_dose,
            shift_twa_ppm=twa_ppm,
            updated_7day_load=updated_7d,
            statutory_tier=tier,
            is_single_shift_critical=is_single_crit,
            advisory_json=advisory.model_dump_json()
        )
        db.add(db_scan)
        db.commit()

        # Build Friendly Chat Reply
        if lang == "hi":
            reply_title = f"📊 **शिफ्ट डोसीमीटर विश्लेषण पूर्ण — {tier}**\n\n"
            reply_text = (
                f"{advisory.bilingual_content.summary_banner_hi if advisory.bilingual_content else advisory.summary_banner}\n\n"
                f"• **शिफ्ट TWA:** `{twa_ppm} ppm`\n"
                f"• **मुआवजा खुराक:** `{compensated_dose} ppm·hr` (मौसम कारक: {k_factor})\n"
                f"• **7-दिवसीय संचयी भार:** `{updated_7d} ppm·hr`\n\n"
                f"❓ **लक्षण जांच:** {advisory.bilingual_content.triage_question_hi if advisory.bilingual_content else advisory.triage_question}"
            )
        else:
            reply_title = f"📊 **Shift Dosimeter Analysis Complete — {tier}**\n\n"
            reply_text = (
                f"{advisory.summary_banner}\n\n"
                f"• **Shift TWA:** `{twa_ppm} ppm`\n"
                f"• **Compensated Dose:** `{compensated_dose} ppm·hr` (Arrhenius k-factor: {k_factor})\n"
                f"• **7-Day Cumulative Load:** `{updated_7d} ppm·hr`\n\n"
                f"❓ **Symptom Check:** {advisory.triage_question}"
            )

        return {
            "reply": reply_title + reply_text,
            "scan_result": {
                "scan_id": scan_id,
                "tier": tier,
                "twa": twa_ppm,
                "compensated_dose": compensated_dose,
                "updated_7day_load": updated_7d,
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
            return {"reply": reply, "quick_actions": ["Log Badge Scan"]}

        leg = worker.ledger
        if lang == "hi":
            reply = (
                f"📈 **आपका H2S संचयी एक्सपोजर लेजर ({worker_id}):**\n\n"
                f"• **7-दिवसीय भार:** `{leg.rolling_7day_ppm_hr} ppm·hr` (वैधानिक सीमा: 15.0 ppm·hr)\n"
                f"• **30-दिवसीय भार:** `{leg.rolling_30day_ppm_hr} ppm·hr`\n"
                f"• **90-दिवसीय भार:** `{leg.rolling_90day_ppm_hr} ppm·hr`\n"
                f"• **कुल दर्ज पाली:** `{leg.lifetime_shifts_logged}`\n\n"
                f"सुरक्षा सलाह: मानक सुरक्षा नियमों और रेस्पिरेटर सील का पालन करते रहें।"
            )
        else:
            reply = (
                f"📈 **Your Cumulative H2S Exposure Ledger ({worker_id}):**\n\n"
                f"• **7-Day Rolling Load:** `{leg.rolling_7day_ppm_hr} ppm·hr` (Permissible: < 15.0 ppm·hr)\n"
                f"• **30-Day Rolling Load:** `{leg.rolling_30day_ppm_hr} ppm·hr`\n"
                f"• **90-Day Rolling Chronic Load:** `{leg.rolling_90day_ppm_hr} ppm·hr`\n"
                f"• **Lifetime Shifts Logged:** `{leg.lifetime_shifts_logged}`\n\n"
                f"Safety Note: All readings are continuously monitored against OISD-STD-105 statutory limits."
            )
        return {
            "reply": reply,
            "quick_actions": ["Log Today's Scan", "Calculate Lung Risk", "Olfactory Screener"]
        }

    def _handle_screener_start(self, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        if lang == "hi":
            reply = (
                "🧪 **न्यूरो-ऑलफैक्ट्री एवं गंध थकान जांच (30-सेकंड टेस्ट):**\n\n"
                "1. क्या आज काम करते समय शुरुआत में सड़े अंडे जैसी गंध आई थी, जो बाद में अचानक आनी बंद हो गई?\n"
                "2. क्या आपको आंखों में जलन या सिरदर्द/चक्कर आ रहे हैं?\n\n"
                "कृपया उत्तर दें: 'हाँ, गंध गायब हो गई थी' या 'नहीं, सब सामान्य था'। "
            )
        else:
            reply = (
                "🧪 **Neuro-Olfactory & Reflex Screener (30-Second Check):**\n\n"
                "1. Did you notice a strong rotten egg smell earlier that seemed to suddenly disappear while working?\n"
                "2. Are you feeling ocular burning, headache, or lightheadedness?\n\n"
                "Please reply with your symptoms or select a quick option below:"
            )
        return {
            "reply": reply,
            "quick_actions": ["No symptoms, smell constant", "Smell vanished & eye stinging", "Feeling dizzy/headache"]
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
            "quick_actions": ["Log New Shift Scan", "Check Exposure Load", "Olfactory Screener"]
        }

    def _handle_rag_query(self, message: str, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        chunks, conf = retriever.query(message, top_k=2)
        if chunks and conf >= 0.4:
            context = "\n\n".join([f"**[{c['title']} - {c['doc_name']}]:**\n{c['content']}" for c in chunks])
            if lang == "hi":
                reply = f"🛡️ **रक्षक सुरक्षा ज्ञानकोष (OISD / DGMS मानक):**\n\n{context}\n\nयदि आपके कोई विशिष्ट लक्षण हैं या आप अपनी शिफ्ट का बैज दर्ज करना चाहते हैं, तो मुझे बताएं।"
            else:
                reply = f"🛡️ **Rakshak Safety Knowledge Base (OISD / DGMS Guidelines):**\n\n{context}\n\nLet me know if you would like to log a shift dosimeter scan or check your symptoms."
        else:
            if lang == "hi":
                reply = "नमस्ते! मैं **रक्षक (Rakshak-H2S)** हूँ — आपका रिफाइनरी सुरक्षा सहायक। आप मुझसे अपनी शिफ्ट का बैज स्कैन दर्ज करवा सकते हैं, अपना संचयी एक्सपोजर लोड पूछ सकते हैं, या OISD सुरक्षा नियम जान सकते हैं।"
            else:
                reply = "Hello! I am **Rakshak-H2S (रक्षक)** — your refinery occupational safety assistant. You can log your shift dosimeter badge, check cumulative exposure loads, take an olfactory screener, or ask about OISD safety protocols."
                
        return {
            "reply": reply,
            "quick_actions": ["Log Badge Scan (ΔE 4.2)", "Check Exposure Load", "Olfactory Screener", "Supervisor Directives"]
        }

unified_chat = UnifiedChatAgent()
