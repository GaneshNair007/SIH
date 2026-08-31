from typing import Tuple, Dict, Any, Optional
from backend.config import settings
from backend.schemas.dosimetry import PatchCondition, MeasurementConfidence

TierType = str

def evaluate_badge_integrity(
    patch_b_drift: float,
    patch_c_condition: PatchCondition
) -> Tuple[MeasurementConfidence, Optional[str], float]:
    """
    Evaluates physical dosimeter wristband integrity from control patches:
    - Patch B: Reference blank strip (detects chemical baseline drift, sunlight degradation, or seal tamper)
    - Patch C: Humidity / chemical interferent strip (NORMAL, WARNING, COMPROMISED)
    
    Returns: (MeasurementConfidence, IntegrityWarningNotice, UncertaintyMarginFraction)
    """
    warning = None
    
    if patch_c_condition == "COMPROMISED" or patch_b_drift > 0.7:
        confidence = "LOW"
        margin = 0.25 # +/- 25% uncertainty
        warning = f"⚠️ BADGE INTEGRITY ALERT: Control Patch B drift ({patch_b_drift:.2f}) or Patch C ({patch_c_condition}) indicates potential seal breach. Reading has wider uncertainty bounds."
    elif patch_c_condition == "WARNING" or patch_b_drift > 0.35:
        confidence = "MEDIUM"
        margin = 0.15 # +/- 15% uncertainty
        warning = f"Notice: Minor baseline drift on Patch B ({patch_b_drift:.2f}). Evaluated with +/- 15% measurement envelope."
    else:
        confidence = "HIGH"
        margin = 0.10 # +/- 10% standard optical calibration envelope
        
    return confidence, warning, margin

def compute_differential_shift_dose(
    start_delta_e: float,
    end_delta_e: float,
    patch_b_drift: float = 0.1,
    patch_c_condition: PatchCondition = "NORMAL",
    shift_hours: float = 8.0
) -> Dict[str, Any]:
    """
    Evaluates differential shift exposure:
    The chemical strip's darkening is irreversible and cumulative across multiple shifts on a 5-day band.
    Net Shift Optical Change: Delta_E_net = max(0, Delta_E_end - Delta_E_start - Delta_E_patch_b_drift)
    
    Calculates low–high uncertainty bounds (no fake precision single numbers).
    """
    safe_hours = max(0.1, shift_hours)
    
    # 1. Differential Net Optical Density Change
    net_delta_e = max(0.0, end_delta_e - start_delta_e - max(0.0, patch_b_drift - 0.05))
    
    # 2. Calibration Curve (Nominal)
    # Dose (ppm·hr) = 2.15 * net_delta_e + 0.08 * (net_delta_e ^ 1.5)
    nominal_dose = 2.15 * net_delta_e + 0.08 * (net_delta_e ** 1.5) if net_delta_e > 0 else 0.0
    
    # 3. Assess Patch Integrity & Uncertainty Margins
    confidence, integrity_warning, margin = evaluate_badge_integrity(patch_b_drift, patch_c_condition)
    
    dose_low = round(max(0.0, nominal_dose * (1.0 - margin)), 1)
    dose_high = round(nominal_dose * (1.0 + margin), 1)
    
    twa_low = round(dose_low / safe_hours, 1)
    twa_high = round(dose_high / safe_hours, 1)
    
    dose_range_str = f"{dose_low:.1f}–{dose_high:.1f} ppm·h"
    twa_range_str = f"{twa_low:.1f}–{twa_high:.1f} ppm"
    
    return {
        "net_delta_e": round(net_delta_e, 3),
        "nominal_dose": round(nominal_dose, 3),
        "dose_low": dose_low,
        "dose_high": dose_high,
        "dose_range_str": dose_range_str,
        "twa_low": twa_low,
        "twa_high": twa_high,
        "twa_range_str": twa_range_str,
        "confidence": confidence,
        "integrity_warning": integrity_warning,
        "shift_hours": safe_hours
    }

def classify_statutory_tier_range(
    twa_low: float,
    twa_high: float,
    updated_7day_high: float,
    dose_high: float
) -> Tuple[str, bool]:
    """
    Deterministic Statutory Classification evaluated against dose uncertainty range:
    
    TIER 3 (CRITICAL):
        TWA_high >= 5.0 ppm  OR  7-day_high >= 35.0 ppm·hr  OR  single-shift dose_high > 20.0 ppm·hr
    TIER 2 (CAUTION):
        TWA_high >= 1.0 ppm  OR  7-day_high >= 15.0 ppm·hr
    TIER 1 (NORMAL):
        TWA_high < 1.0 ppm  AND  7-day_high < 15.0 ppm·hr
    """
    is_single_critical = dose_high > settings.SINGLE_SHIFT_CRITICAL_DOSE
    
    if (
        twa_high >= settings.TIER2_TWA_MAX
        or updated_7day_high >= settings.TIER2_7DAY_MAX
        or is_single_critical
    ):
        return "TIER 3 (CRITICAL)", is_single_critical
        
    if (
        twa_high >= settings.TIER1_TWA_MAX
        or updated_7day_high >= settings.TIER1_7DAY_MAX
    ):
        return "TIER 2 (CAUTION)", is_single_critical
        
    return "TIER 1 (NORMAL)", is_single_critical
