import pytest
from backend.engine.kinetics import compute_kinetic_factor, compensate_dose
from backend.engine.statutory import calculate_twa, classify_statutory_tier

def test_kinetic_factor_reference():
    # At reference condition (25°C, 50% RH), k should equal ~1.0
    k = compute_kinetic_factor(25.0, 50.0)
    assert 0.98 <= k <= 1.02

def test_kinetic_factor_hot_humid():
    # Hot and humid (e.g. Mangalore summer 35°C, 85% RH) -> k > 1.0 (faster color development)
    k = compute_kinetic_factor(35.0, 85.0)
    assert k > 1.0
    
    # Cold and dry (15°C, 30% RH) -> k < 1.0
    k_cold = compute_kinetic_factor(15.0, 30.0)
    assert k_cold < 1.0

def test_dose_compensation():
    raw_dose = 12.0
    k_factor = 1.2
    comp = compensate_dose(raw_dose, k_factor)
    assert comp == 10.0

def test_twa_calculation():
    # 8.0 ppm·hr over 8 hours = 1.0 ppm
    twa = calculate_twa(8.0, 8.0)
    assert twa == 1.0
    
    # 24.0 ppm·hr over 8 hours = 3.0 ppm
    twa2 = calculate_twa(24.0, 8.0)
    assert twa2 == 3.0

def test_statutory_tier_1_normal():
    # TWA < 1.0 and 7-day load < 15.0
    tier, single_crit = classify_statutory_tier(
        twa_ppm=0.85,
        updated_7day_load_ppm_hr=12.0,
        compensated_single_shift_dose=6.8
    )
    assert tier == "TIER 1 (NORMAL)"
    assert not single_crit

def test_statutory_tier_2_caution():
    # TWA in [1.0, 5.0) or 7-day in [15.0, 35.0)
    tier1, _ = classify_statutory_tier(
        twa_ppm=1.5,
        updated_7day_load_ppm_hr=10.0,
        compensated_single_shift_dose=12.0
    )
    assert tier1 == "TIER 2 (CAUTION)"

    tier2, _ = classify_statutory_tier(
        twa_ppm=0.8,
        updated_7day_load_ppm_hr=22.0,
        compensated_single_shift_dose=6.4
    )
    assert tier2 == "TIER 2 (CAUTION)"

def test_statutory_tier_3_critical_by_twa():
    # TWA >= 5.0
    tier, _ = classify_statutory_tier(
        twa_ppm=5.2,
        updated_7day_load_ppm_hr=14.0,
        compensated_single_shift_dose=15.0
    )
    assert tier == "TIER 3 (CRITICAL)"

def test_statutory_tier_3_critical_by_7day():
    # 7-day load >= 35.0
    tier, _ = classify_statutory_tier(
        twa_ppm=2.0,
        updated_7day_load_ppm_hr=36.0,
        compensated_single_shift_dose=16.0
    )
    assert tier == "TIER 3 (CRITICAL)"

def test_statutory_tier_3_critical_by_single_shift():
    # single shift dose > 20.0 ppm·hr
    tier, single_crit = classify_statutory_tier(
        twa_ppm=4.5,
        updated_7day_load_ppm_hr=20.0,
        compensated_single_shift_dose=22.5
    )
    assert tier == "TIER 3 (CRITICAL)"
    assert single_crit is True
