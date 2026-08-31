from typing import List
from backend.schemas.advisory import DosimeterAdvisoryPayload, RecommendationItem

PRIORITY_ORDER = {
    "[LOW / SELF-CARE]": 1,
    "[RECOMMENDED / OPERATIONAL]": 2,
    "[MANDATORY / CLINICAL]": 3,
}

MANDATORY_OHC_ITEM = RecommendationItem(
    priority_level="[MANDATORY / CLINICAL]",
    category="Occupational Health Centre (OHC) Battery",
    action_item="Report immediately to OHC for mandatory pulse oximetry (SpO2), peak-flow spirometry, and slit-lamp ocular exam. 48-hour sour gas stand-down applied.",
    action_item_hi="तत्काल OHC में रिपोर्ट करें: SpO2, स्पायरोमेट्री और आंखों की स्लिट-लैंप जांच अनिवार्य है। 48 घंटे सॉर गैस एरिया में प्रवेश वर्जित।",
    regulatory_reference="DGMS PME Circular 04/2021 & OISD-STD-105 Form-A Mandatory Referral"
)

def enforce_ascending_priority(recommendations: List[RecommendationItem]) -> List[RecommendationItem]:
    """
    Server-side deterministic validation: Enforces that recommendations are strictly
    ordered in ascending priority:
    1. [LOW / SELF-CARE]
    2. [RECOMMENDED / OPERATIONAL]
    3. [MANDATORY / CLINICAL]
    """
    return sorted(recommendations, key=lambda item: PRIORITY_ORDER.get(item.priority_level, 99))

def apply_deterministic_safety_locks(
    advisory: DosimeterAdvisoryPayload,
    deterministic_tier: str
) -> DosimeterAdvisoryPayload:
    """
    Hard backend override lock:
    1. Enforces ascending priority order on all recommendations.
    2. If deterministic statutory tier is TIER 3 (CRITICAL), guarantees that
       a mandatory OHC clinical referral item and supervisor incident filing are present.
    """
    # 1. Enforce ascending order
    sorted_recs = enforce_ascending_priority(advisory.recommendations)
    
    # 2. Hard Tier 3 Override Lock
    override_applied = advisory.mandatory_ohc_override_applied
    if deterministic_tier == "TIER 3 (CRITICAL)":
        has_mandatory_clinical = any(r.priority_level == "[MANDATORY / CLINICAL]" for r in sorted_recs)
        if not has_mandatory_clinical:
            sorted_recs.append(MANDATORY_OHC_ITEM)
            sorted_recs = enforce_ascending_priority(sorted_recs)
            override_applied = True
            
        # Ensure mandatory incident action in supervisor actions
        form_a_action = "File OISD Incident Form-A with Safety and HSE Department within 24 hours."
        if not any("Form-A" in act or "form-a" in act.lower() for act in advisory.supervisor_actions):
            advisory.supervisor_actions.insert(0, form_a_action)
            
    advisory.recommendations = sorted_recs
    advisory.severity_tier = deterministic_tier # type: ignore
    advisory.mandatory_ohc_override_applied = override_applied
    
    return advisory
