import pytest
from backend.schemas.advisory import DosimeterAdvisoryPayload, RecommendationItem
from backend.guardrails.safety_lock import enforce_ascending_priority, apply_deterministic_safety_locks
from backend.guardrails.clinical_filter import check_clinical_scope_violations, sanitize_advisory_payload

def test_ascending_priority_enforcement():
    items = [
        RecommendationItem(
            priority_level="[MANDATORY / CLINICAL]",
            category="Clinical",
            action_item="Report to OHC"
        ),
        RecommendationItem(
            priority_level="[LOW / SELF-CARE]",
            category="Self-Care",
            action_item="Wash face"
        ),
        RecommendationItem(
            priority_level="[RECOMMENDED / OPERATIONAL]",
            category="PPE",
            action_item="Replace cartridge"
        )
    ]
    
    sorted_items = enforce_ascending_priority(items)
    
    assert sorted_items[0].priority_level == "[LOW / SELF-CARE]"
    assert sorted_items[1].priority_level == "[RECOMMENDED / OPERATIONAL]"
    assert sorted_items[2].priority_level == "[MANDATORY / CLINICAL]"

def test_tier_3_hard_override_lock():
    advisory = DosimeterAdvisoryPayload(
        summary_banner="Critical level detected",
        worker_id="EMP-1042",
        shift_dose_range="21.5–26.2 ppm·h",
        shift_twa_range="2.7–3.3 ppm",
        rolling_7day_range="36.0–42.0 ppm·h",
        severity_tier="TIER 3 (CRITICAL)",
        recommendations=[
            RecommendationItem(
                priority_level="[LOW / SELF-CARE]",
                category="Rest",
                action_item="Rest in shelter"
            )
        ],
        triage_question="Are you dizzy?",
        supervisor_actions=["Log incident"]
    )
    
    locked_advisory = apply_deterministic_safety_locks(advisory, deterministic_tier="TIER 3 (CRITICAL)")
    
    assert locked_advisory.mandatory_ohc_override_applied is True
    assert any(r.priority_level == "[MANDATORY / CLINICAL]" for r in locked_advisory.recommendations)
    assert any("Form-A" in a for a in locked_advisory.supervisor_actions)

def test_clinical_scope_sanitizer():
    bad_text = "Take 500 mg salbutamol bronchodilator for diagnosed asthma."
    violations = check_clinical_scope_violations(bad_text)
    assert len(violations) > 0
    assert any("mg" in v.lower() for v in violations)

    advisory = DosimeterAdvisoryPayload(
        summary_banner="Prescribe 10 mg dexamethasone immediately.",
        worker_id="EMP-1042",
        shift_dose_range="12.1–14.8 ppm·h",
        shift_twa_range="1.5–1.9 ppm",
        rolling_7day_range="18.0–22.0 ppm·h",
        severity_tier="TIER 2 (CAUTION)",
        recommendations=[
            RecommendationItem(
                priority_level="[RECOMMENDED / OPERATIONAL]",
                category="Medication",
                action_item="Take 200 mg antibiotic tablet."
            )
        ],
        triage_question="Feeling okay?",
        supervisor_actions=["Check valves"]
    )

    clean_advisory, was_sanitized = sanitize_advisory_payload(advisory)
    assert was_sanitized is True
    assert "mg" not in clean_advisory.summary_banner
    assert "mg" not in clean_advisory.recommendations[0].action_item
