import pytest
from backend.engine.statutory import (
    compute_differential_shift_dose,
    classify_statutory_tier_range,
    evaluate_badge_integrity
)

def test_badge_integrity_normal():
    conf, warning, margin = evaluate_badge_integrity(patch_b_drift=0.1, patch_c_condition="NORMAL")
    assert conf == "HIGH"
    assert warning is None
    assert margin == 0.10

def test_badge_integrity_warning():
    conf, warning, margin = evaluate_badge_integrity(patch_b_drift=0.45, patch_c_condition="WARNING")
    assert conf == "MEDIUM"
    assert "Notice" in warning or "margin" in warning or "drift" in warning
    assert margin == 0.15

def test_badge_integrity_compromised():
    conf, warning, margin = evaluate_badge_integrity(patch_b_drift=0.85, patch_c_condition="COMPROMISED")
    assert conf == "LOW"
    assert "ALERT" in warning or "breach" in warning
    assert margin == 0.25

def test_differential_shift_dose_evaluation():
    # Differential optical change: start ΔE=0.5, end ΔE=4.2 -> Net ΔE ~ 3.65
    res = compute_differential_shift_dose(
        start_delta_e=0.5,
        end_delta_e=4.2,
        patch_b_drift=0.1,
        patch_c_condition="NORMAL",
        shift_hours=8.0
    )
    assert res["net_delta_e"] > 0.0
    assert res["dose_low"] < res["nominal_dose"] < res["dose_high"]
    assert "–" in res["dose_range_str"]
    assert "–" in res["twa_range_str"]
    assert res["confidence"] == "HIGH"

def test_statutory_tier_1_normal():
    tier, single_crit = classify_statutory_tier_range(
        twa_low=0.5,
        twa_high=0.9,
        updated_7day_high=12.0,
        dose_high=7.2
    )
    assert tier == "TIER 1 (NORMAL)"
    assert not single_crit

def test_statutory_tier_2_caution():
    tier, single_crit = classify_statutory_tier_range(
        twa_low=1.2,
        twa_high=2.1,
        updated_7day_high=18.0,
        dose_high=16.8
    )
    assert tier == "TIER 2 (CAUTION)"

def test_statutory_tier_3_critical_by_twa():
    tier, _ = classify_statutory_tier_range(
        twa_low=4.8,
        twa_high=5.4,
        updated_7day_high=22.0,
        dose_high=18.0
    )
    assert tier == "TIER 3 (CRITICAL)"

def test_statutory_tier_3_critical_by_single_shift_upper_bound():
    tier, single_crit = classify_statutory_tier_range(
        twa_low=2.1,
        twa_high=2.8,
        updated_7day_high=22.0,
        dose_high=22.5
    )
    assert tier == "TIER 3 (CRITICAL)"
    assert single_crit is True
