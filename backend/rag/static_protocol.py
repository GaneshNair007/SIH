from typing import Dict, Any, List
from backend.schemas.advisory import DosimeterAdvisoryPayload, RecommendationItem, BilingualContent

STATIC_PROTOCOL_TABLE: Dict[str, Dict[str, Any]] = {
    "TIER 1 (NORMAL)": {
        "summary_banner": "Shift exposure within normal safe statutory limits (< 1.0 ppm TWA). Good adherence to safety standards.",
        "summary_banner_hi": "पाली जोखिम सामान्य वैधानिक सीमा (< 1.0 ppm TWA) के भीतर है। सुरक्षा मानकों का पालन जारी रखें।",
        "triage_question": "Are you currently feeling any slight eye dryness, headache, or throat tickle?",
        "triage_question_hi": "क्या आप आंखों में सूखापन, सिरदर्द या गले में हल्की खराश महसूस कर रहे हैं?",
        "recommendations": [
            {
                "priority_level": "[LOW / SELF-CARE]",
                "category": "Self-Care & Hygiene",
                "action_item": "Wash face and exposed skin with clean water. Rest for 15 minutes in a positive-pressure shelter and maintain good hydration.",
                "action_item_hi": "साफ पानी से चेहरा और खुली त्वचा धोएं। पॉजिटिव-प्रेशर शेल्टर में 15 मिनट आराम करें और पानी पिएं।",
                "regulatory_reference": "ACGIH TLV-TWA 1.0 ppm Best Practice"
            },
            {
                "priority_level": "[RECOMMENDED / OPERATIONAL]",
                "category": "PPE Inspection",
                "action_item": "Inspect respirator exhalation valve and wipe elastomer facepiece clean before storing in your clean locker.",
                "action_item_hi": "लॉकर में रखने से पहले रेस्पिरेटर के वॉल्व का निरीक्षण करें और साफ कपड़े से पोंछें।",
                "regulatory_reference": "OISD-STD-155 Part-I Cl 3.4"
            }
        ],
        "supervisor_actions": [
            "Log shift reading into unit dosimeter ledger.",
            "Maintain standard operating ventilation and routine leak sniffing rounds."
        ],
        "supervisor_actions_hi": [
            "यूनिट डोसीमीटर लेजर में शिफ्ट रीडिंग दर्ज करें।",
            "मानक वेंटिलेशन और नियमित रिसाव जांच जारी रखें।"
        ]
    },
    "TIER 2 (CAUTION)": {
        "summary_banner": "CAUTION: Shift TWA or 7-day cumulative exposure is moderately elevated (1.0–5.0 ppm TWA). Preventive action required.",
        "summary_banner_hi": "सावधानी: शिफ्ट TWA या 7-दिवसीय जोखिम मध्यम स्तर (1.0–5.0 ppm TWA) पर है। निवारक कार्रवाई आवश्यक है।",
        "triage_question": "Do you notice eye stinging, cough, or a reduced ability to smell odors (olfactory fatigue)?",
        "triage_question_hi": "क्या आपको आंखों में जलन, खांसी, या गंध सूंघने की क्षमता में कमी महसूस हो रही है?",
        "recommendations": [
            {
                "priority_level": "[LOW / SELF-CARE]",
                "category": "Decontamination & First Aid",
                "action_item": "Perform continuous 15-minute eye saline flush at emergency station. Rest for minimum 20 minutes in positive-pressure control room.",
                "action_item_hi": "आपातकालीन स्टेशन पर 15 मिनट तक आंखों को सेलाइन से धोएं। कम से कम 20 मिनट कंट्रोल रूम में आराम करें।",
                "regulatory_reference": "OISD-STD-155 Cl. 5.1 & ACGIH Guidelines"
            },
            {
                "priority_level": "[RECOMMENDED / OPERATIONAL]",
                "category": "PPE Replacement & Seal Check",
                "action_item": "Replace respirator chemical cartridges immediately. Perform mandatory positive/negative pressure seal check prior to next shift entry.",
                "action_item_hi": "रेस्पिरेटर के रासायनिक कार्ट्रिज तुरंत बदलें। अगली शिफ्ट से पहले सील टेस्ट अनिवार्य रूप से करें।",
                "regulatory_reference": "OISD-STD-155 Part-II Cl 4.2"
            }
        ],
        "supervisor_actions": [
            "Deploy handheld PID/FID toxic gas sniffer to inspect unit valve packing glands and sample drains in worker's sub-zone.",
            "Flag worker for shift rotation away from sour hydrocarbon units if 7-day load exceeds 25 ppm·hr.",
            "Verify respirator fit-test record and cartridge replacement log."
        ],
        "supervisor_actions_hi": [
            "संबंधित सब-ज़ोन में वाल्व और ड्रेन की हैंडहेल्ड गैस स्निफर से जांच करें।",
            "यदि 7-दिवसीय भार 25 ppm·hr से अधिक हो तो वर्कर को अन्य यूनिट में रोटेट करें।",
            "रेस्पिरेटर फिट-टेस्ट और कार्ट्रिज बदलने का रिकॉर्ड सत्यापित करें।"
        ]
    },
    "TIER 3 (CRITICAL)": {
        "summary_banner": "CRITICAL EXPOSURE ALERT: Shift TWA >= 5.0 ppm or acute threshold exceeded. MANDATORY OHC medical evaluation required.",
        "summary_banner_hi": "गंभीर जोखिम चेतावनी: शिफ्ट TWA >= 5.0 ppm या गंभीर सीमा पार हुई। OHC में तत्काल चिकित्सकीय जांच अनिवार्य है।",
        "triage_question": "Are you experiencing chest tightness, dizziness, shortness of breath, or sudden loss of smell?",
        "triage_question_hi": "क्या आपको सीने में जकड़न, चक्कर आना, सांस लेने में तकलीफ या गंध का अचानक बंद होना महसूस हो रहा है?",
        "recommendations": [
            {
                "priority_level": "[LOW / SELF-CARE]",
                "category": "Immediate Evacuation & Rest",
                "action_item": "Evacuate hazardous zone immediately. Remove contaminated outer workwear and rest in 100% positive-pressure medical air area.",
                "action_item_hi": "खतरनाक क्षेत्र से तुरंत बाहर निकलें। दूषित कपड़े बदलें और स्वच्छ पॉजिटिव-प्रेशर हवा में आराम करें।",
                "regulatory_reference": "OISD-STD-105 Cl. 4.2 / NIOSH REL"
            },
            {
                "priority_level": "[RECOMMENDED / OPERATIONAL]",
                "category": "Unit Isolation & Work Permit Hold",
                "action_item": "Suspend hot work and non-essential activities in current unit. Mark and barrier the suspected release point with danger tape.",
                "action_item_hi": "संबंधित यूनिट में हॉट वर्क और गैर-जरूरी काम तुरंत रोकें। संदिग्ध रिसाव क्षेत्र में डेंजर टेप लगाएं।",
                "regulatory_reference": "OISD-STD-166 Cl. 5.1 / MRPL Unit SOP"
            },
            {
                "priority_level": "[MANDATORY / CLINICAL]",
                "category": "Occupational Health Centre (OHC) Battery",
                "action_item": "Report immediately to OHC for mandatory pulse oximetry (SpO2), peak-flow spirometry vs baseline, and slit-lamp ocular exam. 48-hour sour gas stand-down applied.",
                "action_item_hi": "तत्काल OHC में रिपोर्ट करें: SpO2, स्पायरोमेट्री और आंखों की स्लिट-लैंप जांच अनिवार्य है। 48 घंटे सॉर गैस एरिया में प्रवेश वर्जित।",
                "regulatory_reference": "DGMS PME Circular 04/2021 & OISD-STD-105 Form-A Protocol"
            }
        ],
        "supervisor_actions": [
            "IMMEDIATELY initiate plant fugitive leak isolation protocol and deploy gas sniffing team to pinpoint leak.",
            "File OISD Incident Form-A with Safety and HSE Department within 24 hours.",
            "Enforce mandatory 48-hour sour unit restriction for the exposed worker pending OHC clearance.",
            "Check all co-workers in the same operating zone for badge readings."
        ],
        "supervisor_actions_hi": [
            "तुरंत गैस रिसाव आइसोलेशन प्रोटोकॉल शुरू करें और स्निफर टीम तैनात करें।",
            "24 घंटे के भीतर सुरक्षा और HSE विभाग में OISD फॉर्म-A दर्ज करें।",
            "OHC क्लीयरेंस मिलने तक प्रभावित कर्मी पर 48 घंटे का कार्य प्रतिबंध लागू करें।",
            "उसी क्षेत्र के सभी सहकर्मियों के बैज रीडिंग की तुरंत जांच करें।"
        ]
    }
}

def get_static_protocol_advisory(
    tier: str,
    worker_id: str,
    twa_ppm: float,
    rolling_7day_load: float
) -> DosimeterAdvisoryPayload:
    """
    Returns an authoritative, deterministic DosimeterAdvisoryPayload strictly adhering
    to statutory guidelines without any LLM hallucination risk.
    """
    protocol = STATIC_PROTOCOL_TABLE.get(tier, STATIC_PROTOCOL_TABLE["TIER 1 (NORMAL)"])
    
    recs: List[RecommendationItem] = []
    for item in protocol["recommendations"]:
        recs.append(RecommendationItem(
            priority_level=item["priority_level"],
            category=item["category"],
            action_item=item["action_item"],
            action_item_hi=item.get("action_item_hi"),
            regulatory_reference=item.get("regulatory_reference")
        ))
        
    bilingual = BilingualContent(
        summary_banner_hi=protocol["summary_banner_hi"],
        triage_question_hi=protocol["triage_question_hi"],
        supervisor_actions_hi=protocol.get("supervisor_actions_hi", [])
    )
    
    return DosimeterAdvisoryPayload(
        summary_banner=protocol["summary_banner"],
        worker_id=worker_id,
        shift_twa_ppm=twa_ppm,
        rolling_7day_ppm_hr=rolling_7day_load,
        severity_tier=tier, # type: ignore
        recommendations=recs,
        triage_question=protocol["triage_question"],
        supervisor_actions=protocol["supervisor_actions"],
        bilingual_content=bilingual,
        mandatory_ohc_override_applied=(tier == "TIER 3 (CRITICAL)"),
        rag_retrieval_mode="STATIC_PROTOCOL_FALLBACK"
    )
