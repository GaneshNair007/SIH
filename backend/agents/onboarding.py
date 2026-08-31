import json
import re
from typing import Dict, Any, Tuple, Optional
from backend.schemas.worker import WorkerProfile, HealthProfile, PPEDetails, ExposureLedger
from backend.config import settings

ONBOARDING_STEPS = [
    "LANGUAGE",
    "IDENTITY",
    "RESPIRATORY_HEALTH",
    "SMOKING",
    "PPE_DETAILS",
    "COMPLETED"
]

ONBOARDING_PROMPTS = {
    "en": {
        "LANGUAGE": "Namaste! Welcome to **Rakshak (रक्षक)** — your H2S Occupational Safety Companion.\n\nPlease select your preferred language / अपनी पसंदीदा भाषा चुनें:\n1. English\n2. हिन्दी (Hindi)",
        "IDENTITY": "Thank you! Please share your **Full Name**, **Employee ID** (e.g., EMP-1042), **Age**, and assigned **Plant Unit** (e.g., CDU-1, DHDS, SRU, Tank Farm).",
        "RESPIRATORY_HEALTH": "Understood. Do you have any history of **asthma, chronic bronchitis, ocular (eye) sensitivities**, or any known allergies?",
        "SMOKING": "Thanks for sharing. What is your **smoking status**? (Non-smoker, former smoker, or active smoker? If active, roughly how many cigarettes/bidis per day and for how many years?)",
        "PPE_DETAILS": "Almost done! What type of **respirator mask** do you wear (Half-mask, Full-face, SCBA)? What is your cartridge type, and do you know your last fit-test date or if it was passed?",
        "COMPLETED": "🎉 **Onboarding Complete!** Your baseline clinical and occupational profile has been securely registered in Rakshak. You can now log your shift dosimeter scans."
    },
    "hi": {
        "LANGUAGE": "नमस्ते! **रक्षक (Rakshak)** — आपके H2S व्यावसायिक सुरक्षा साथी में आपका स्वागत है।\n\nकृपया अपनी पसंदीदा भाषा चुनें:\n1. English\n2. हिन्दी (Hindi)",
        "IDENTITY": "धन्यवाद! कृपया अपना **पूरा नाम**, **कर्मचारी आईडी** (जैसे EMP-1042), **उम्र**, और अपना **प्लांट यूनिट** (जैसे CDU-1, DHDS, SRU, टैंक फार्म) बताएं।",
        "RESPIRATORY_HEALTH": "धन्यवाद। क्या आपको पहले कभी **अस्थमा, ब्रोंकाइटिस, आंखों में जलन/संवेदनशीलता**, या कोई एलर्जी की समस्या रही है?",
        "SMOKING": "आपकी **धूम्रपान (Smoking) स्थिति** क्या है? (अधूम्रपानकर्ता/Non-smoker, पूर्व धूम्रपानकर्ता, या सक्रिय धूम्रपानकर्ता? यदि सक्रिय हैं, तो प्रतिदिन लगभग कितनी सिगरेट/बीड़ी और कितने वर्षों से?)",
        "PPE_DETAILS": "अंतिम चरण: आप किस प्रकार का **रेस्पिरेटर मास्क** उपयोग करते हैं (हाफ-मास्क, फुल-फेस, SCBA)? आपका कार्ट्रिज प्रकार क्या है और क्या आपका अंतिम फिट-टेस्ट पास था?",
        "COMPLETED": "🎉 **पंजीकरण पूर्ण हुआ!** आपकी आधारभूत प्रोफ़ाइल रक्षक सिस्टम में सुरक्षित रूप से दर्ज कर ली गई है। अब आप अपनी शिफ्ट डोसीमीटर स्कैन दर्ज कर सकते हैं।"
    }
}

class OnboardingSessionManager:
    def __init__(self):
        # In-memory active onboarding sessions: session_id -> state dict
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def get_or_create_session(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "step": "LANGUAGE",
                "lang": "en",
                "data": {
                    "worker_id": f"EMP-{hash(session_id) % 9000 + 1000}",
                    "full_name": "Refinery Worker",
                    "age": 35,
                    "gender": "Male",
                    "department": "Operations",
                    "plant_unit": "CDU-1",
                    "role": "Plant Technician",
                    "preferred_language": "en",
                    "health_profile": {
                        "smoking_status": "non-smoker",
                        "smoking_pack_years": 0.0,
                        "pre_existing_conditions": [],
                        "baseline_fev1_fvc_ratio": 0.80,
                        "allergies": [],
                        "ocular_sensitivity": False
                    },
                    "ppe_details": {
                        "respirator_type": "Half-Mask Air-Purifying",
                        "cartridge_type": "Acid Gas (H2S specific)",
                        "last_fit_test_date": "2026-01-15",
                        "fit_test_passed": True
                    }
                }
            }
        return self.sessions[session_id]

    def process_turn(self, session_id: str, user_message: str) -> Tuple[str, Optional[WorkerProfile], str]:
        """
        Processes a multi-turn conversation step.
        Returns: (bot_reply, completed_worker_profile_or_none, current_step)
        """
        session = self.get_or_create_session(session_id)
        current_step = session["step"]
        lang = session["lang"]
        data = session["data"]
        
        msg_clean = user_message.strip().lower()

        if current_step == "LANGUAGE":
            if "2" in msg_clean or "hindi" in msg_clean or "हिन्दी" in msg_clean or "हिंदी" in msg_clean:
                lang = "hi"
            else:
                lang = "en"
            session["lang"] = lang
            data["preferred_language"] = lang
            session["step"] = "IDENTITY"
            reply = ONBOARDING_PROMPTS[lang]["IDENTITY"]
            return reply, None, "IDENTITY"

        elif current_step == "IDENTITY":
            # Extract worker ID, name, age, unit
            # Look for EMP-xxxx
            id_match = re.search(r'\b(emp[-_]?\d{3,6})\b', user_message, re.IGNORECASE)
            if id_match:
                data["worker_id"] = id_match.group(1).upper()
                
            # Look for unit
            unit_match = re.search(r'\b(cdu-?1|cdu-?2|dhds|sru|tank\s*farm|flare\s*header)\b', user_message, re.IGNORECASE)
            if unit_match:
                data["plant_unit"] = unit_match.group(0).upper()
                
            # Look for age
            age_match = re.search(r'\b(\d{2})\s*(?:years?|yrs?|yr|साल)?\b', user_message, re.IGNORECASE)
            if age_match:
                data["age"] = int(age_match.group(1))
                
            # Name heuristics
            parts = [p.strip() for p in re.split(r'[,;\n]', user_message) if p.strip()]
            if parts and len(parts[0].split()) <= 4 and not any(k in parts[0].lower() for k in ["emp", "unit", "age", "i am", "my"]):
                data["full_name"] = parts[0].title()
            elif "name is " in user_message.lower():
                name_part = user_message.lower().split("name is ")[1].split()[0:2]
                data["full_name"] = " ".join(name_part).title()

            session["step"] = "RESPIRATORY_HEALTH"
            reply = ONBOARDING_PROMPTS[lang]["RESPIRATORY_HEALTH"]
            return reply, None, "RESPIRATORY_HEALTH"

        elif current_step == "RESPIRATORY_HEALTH":
            conditions = []
            if "asthma" in msg_clean or "दमा" in msg_clean:
                conditions.append("Asthma")
            if "bronchitis" in msg_clean or "ब्रोंकाइटिस" in msg_clean:
                conditions.append("Chronic Bronchitis")
            if "copd" in msg_clean:
                conditions.append("COPD")
            if "eye" in msg_clean or "आंख" in msg_clean or "irritation" in msg_clean or "जलन" in msg_clean:
                data["health_profile"]["ocular_sensitivity"] = True
            if "rhinitis" in msg_clean or "allergy" in msg_clean or "एलर्जी" in msg_clean:
                data["health_profile"]["allergies"].append("Allergic Rhinitis")
                
            data["health_profile"]["pre_existing_conditions"] = conditions
            
            session["step"] = "SMOKING"
            reply = ONBOARDING_PROMPTS[lang]["SMOKING"]
            return reply, None, "SMOKING"

        elif current_step == "SMOKING":
            if "non" in msg_clean or "no" in msg_clean or "नहीं" in msg_clean or "never" in msg_clean:
                data["health_profile"]["smoking_status"] = "non-smoker"
                data["health_profile"]["smoking_pack_years"] = 0.0
            elif "former" in msg_clean or "quit" in msg_clean or "छोड़" in msg_clean:
                data["health_profile"]["smoking_status"] = "former-smoker"
                data["health_profile"]["smoking_pack_years"] = 2.5
            else:
                data["health_profile"]["smoking_status"] = "active-smoker"
                # Estimate pack years
                cigs = 10
                years = 5
                nums = re.findall(r'\b\d+\b', user_message)
                if len(nums) >= 2:
                    cigs, years = int(nums[0]), int(nums[1])
                elif len(nums) == 1:
                    cigs = int(nums[0])
                pack_years = round((cigs / 20.0) * years, 1)
                data["health_profile"]["smoking_pack_years"] = pack_years

            session["step"] = "PPE_DETAILS"
            reply = ONBOARDING_PROMPTS[lang]["PPE_DETAILS"]
            return reply, None, "PPE_DETAILS"

        elif current_step == "PPE_DETAILS":
            if "full" in msg_clean or "फुल" in msg_clean:
                data["ppe_details"]["respirator_type"] = "Full-Face Air-Purifying"
            elif "scba" in msg_clean:
                data["ppe_details"]["respirator_type"] = "SCBA Self-Contained"
            else:
                data["ppe_details"]["respirator_type"] = "Half-Mask Air-Purifying"

            if "passed" in msg_clean or "yes" in msg_clean or "हाँ" in msg_clean or "हां" in msg_clean:
                data["ppe_details"]["fit_test_passed"] = True
            elif "fail" in msg_clean or "no" in msg_clean or "नहीं" in msg_clean:
                data["ppe_details"]["fit_test_passed"] = False

            session["step"] = "COMPLETED"
            
            # Construct final Pydantic model
            profile = WorkerProfile(
                worker_id=data["worker_id"],
                full_name=data["full_name"],
                age=data["age"],
                gender=data["gender"],
                department=data["department"],
                plant_unit=data["plant_unit"],
                role=data["role"],
                preferred_language=data["preferred_language"],
                health_profile=HealthProfile(**data["health_profile"]),
                ppe_details=PPEDetails(**data["ppe_details"]),
                exposure_ledger=ExposureLedger()
            )
            
            reply = ONBOARDING_PROMPTS[lang]["COMPLETED"]
            return reply, profile, "COMPLETED"

        else:
            reply = ONBOARDING_PROMPTS[lang]["COMPLETED"]
            return reply, None, "COMPLETED"

onboarding_manager = OnboardingSessionManager()
