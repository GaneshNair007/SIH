from typing import Tuple, Literal
from backend.config import settings

TierType = Literal["TIER 1 (NORMAL)", "TIER 2 (CAUTION)", "TIER 3 (CRITICAL)"]

def calculate_twa(compensated_dose_ppm_hr: float, shift_duration_hours: float) -> float:
    """
    Computes Time-Weighted Average (TWA) in ppm:
    TWA = Compensated Dose (ppm·hr) / Shift Duration (hr)
    """
    safe_hours = max(0.1, shift_duration_hours)
    twa = compensated_dose_ppm_hr / safe_hours
    return round(twa, 4)

def classify_statutory_tier(
    twa_ppm: float,
    updated_7day_load_ppm_hr: float,
    compensated_single_shift_dose: float
) -> Tuple[TierType, bool]:
    """
    Deterministic Statutory Classification per Indian OISD & DGMS Regulations:
    
    TIER 3 (CRITICAL):
        TWA >= 5.0 ppm  OR  7-day load >= 35.0 ppm·hr  OR  single-shift dose > 20.0 ppm·hr
    TIER 2 (CAUTION):
        1.0 ppm <= TWA < 5.0 ppm  OR  15.0 <= 7-day load < 35.0 ppm·hr
    TIER 1 (NORMAL):
        TWA < 1.0 ppm  AND  7-day load < 15.0 ppm·hr
    
    Returns (StatutoryTier, is_single_shift_critical)
    """
    is_single_shift_critical = compensated_single_shift_dose > settings.SINGLE_SHIFT_CRITICAL_DOSE
    
    # Tier 3 (Critical) evaluation
    if (
        twa_ppm >= settings.TIER2_TWA_MAX  # >= 5.0
        or updated_7day_load_ppm_hr >= settings.TIER2_7DAY_MAX  # >= 35.0
        or is_single_shift_critical  # > 20.0
    ):
        return "TIER 3 (CRITICAL)", is_single_shift_critical
    
    # Tier 2 (Caution) evaluation
    if (
        twa_ppm >= settings.TIER1_TWA_MAX  # >= 1.0
        or updated_7day_load_ppm_hr >= settings.TIER1_7DAY_MAX  # >= 15.0
    ):
        return "TIER 2 (CAUTION)", is_single_shift_critical
    
    # Tier 1 (Normal)
    return "TIER 1 (NORMAL)", is_single_shift_critical
