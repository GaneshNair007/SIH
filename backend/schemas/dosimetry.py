from typing import Optional, Literal, Tuple
from pydantic import BaseModel, Field
from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc)

PatchCondition = Literal["NORMAL", "WARNING", "COMPROMISED"]
MeasurementConfidence = Literal["HIGH", "MEDIUM", "LOW", "INVALID"]

class StartShiftRequest(BaseModel):
    employee_id: str = Field(default="EMP-1042", description="Employee ID, e.g. EMP-1042")
    plant_unit: str = Field(default="CDU-1", description="Refinery operating unit")
    badge_id: str = Field(default="BAND-1042-01", description="Wristband Barcode/RFID")
    start_delta_e: float = Field(default=0.4, ge=0.0, description="Start-of-shift optical baseline ΔE_start")
    band_lifecycle_day: int = Field(default=1, ge=1, le=5, description="Day of band rotation (1-5)")

class EndShiftRequest(BaseModel):
    employee_id: str = Field(default="EMP-1042", description="Employee ID")
    plant_unit: Optional[str] = Field(default=None, description="Refinery unit (defaults to start shift unit)")
    end_delta_e: float = Field(..., ge=0.0, description="End-of-shift optical density ΔE_end")
    start_delta_e: Optional[float] = Field(default=None, description="Start-of-shift baseline (optional if active shift exists)")
    patch_b_drift: float = Field(default=0.10, ge=0.0, description="Patch B control drift")
    patch_c_condition: PatchCondition = Field(default="NORMAL", description="Patch C indicator condition")
    shift_duration_hours: float = Field(default=8.0, ge=0.1, le=24.0, description="Shift duration in hours")

class BadgeData(BaseModel):
    badge_id: str = Field(..., description="Unique dosimeter wristband barcode/RFID, e.g., BAND-H2S-0842")
    band_lifecycle_day: int = Field(default=1, ge=1, le=5, description="Day of band deployment (max 5-day lifecycle)")
    
    # Differential Exposure Readings (Irreversible chemical darkening)
    start_optical_density: float = Field(default=0.0, ge=0.0, description="Optical density at start of shift (ΔE_start)")
    end_optical_density: float = Field(..., ge=0.0, description="Optical density at end of shift (ΔE_end)")
    
    # Integrity & Tamper Checks
    patch_b_drift: float = Field(default=0.1, ge=0.0, description="Control patch B reading for baseline drift / seal tamper")
    patch_c_condition: PatchCondition = Field(default="NORMAL", description="Chemical interferent / humidity indicator condition")
    
    shelf_life_status: Literal["VALID", "EXPIRED", "WARNING"] = Field(default="VALID", description="Dosimeter substrate validity")

class ContextualEnvironmentalTelemetry(BaseModel):
    latitude: float = Field(default=12.9904, description="Plant latitude (MRPL Mangalore)")
    longitude: float = Field(default=74.8219, description="Plant longitude")
    temperature_c: float = Field(..., description="Ambient temperature in degrees Celsius")
    relative_humidity_pct: float = Field(..., description="Ambient relative humidity percentage (0-100)")
    pressure_hpa: Optional[float] = Field(default=1013.25, description="Atmospheric pressure in hPa")
    source: str = Field(default="Open-Meteo Environmental Station", description="Contextual telemetry source")
    framing_notice: str = Field(
        default="Contextual environmental telemetry for ambient shift normalization",
        description="Explicit notice framing telemetry contextually without unverified kinetic claims"
    )

# Backwards compatibility alias
EnvironmentalTelemetry = ContextualEnvironmentalTelemetry

class ComputedMetrics(BaseModel):
    # Differential Shift Calculation
    net_delta_e: float = Field(..., description="Differential shift optical change: max(0, end_delta_e - start_delta_e - patch_b_drift)")
    
    # Dose Uncertainty Ranges (No fake precision)
    shift_dose_low_ppm_hr: float = Field(..., description="Lower bound of estimated shift dose in ppm·hr")
    shift_dose_high_ppm_hr: float = Field(..., description="Upper bound of estimated shift dose in ppm·hr")
    shift_dose_range_str: str = Field(..., description="Formatted uncertainty range, e.g., '12.1–14.8 ppm·h'")
    
    shift_twa_low_ppm: float = Field(..., description="Lower bound of shift TWA in ppm")
    shift_twa_high_ppm: float = Field(..., description="Upper bound of shift TWA in ppm")
    shift_twa_range_str: str = Field(..., description="Formatted TWA range, e.g., '1.5–1.9 ppm'")
    
    shift_hours: float = Field(..., description="Duration of exposure shift in hours")
    
    # Cumulative Rolling Loads
    prior_7day_load_ppm_hr: float = Field(default=0.0, description="7-day cumulative load prior to current shift")
    updated_7day_load_low: float = Field(..., description="Lower bound of updated 7-day cumulative load")
    updated_7day_load_high: float = Field(..., description="Upper bound of updated 7-day cumulative load")
    updated_7day_range_str: str = Field(..., description="Formatted 7-day range, e.g., '24.5–28.2 ppm·h'")
    
    statutory_tier: Literal["TIER 1 (NORMAL)", "TIER 2 (CAUTION)", "TIER 3 (CRITICAL)"] = Field(
        ..., description="Statutory compliance and risk classification"
    )
    hazard_score_5pt: float = Field(default=0.0, description="Intuitive 0.0 to 5.0 daily hazard score")
    hazard_level_simple: str = Field(default="SAFE / NORMAL", description="Simplified status tag: SAFE / NORMAL, MODERATE / CAUTION, or DANGEROUS / CRITICAL")
    measurement_confidence: MeasurementConfidence = Field(default="HIGH", description="Confidence metric based on Patch B/C integrity")
    badge_integrity_warning: Optional[str] = Field(default=None, description="Warning if Patch B drift or Patch C compromised")
    is_single_shift_critical: bool = Field(default=False, description="Whether single-shift dose exceeded 20.0 ppm·hr upper bound")

class ShiftScanPayload(BaseModel):
    scan_id: str = Field(..., description="Unique scan transaction ID, e.g., SCN-89412")
    worker_id: str = Field(..., description="Worker identification ID")
    plant_unit: str = Field(default="CDU-1", description="Refinery unit where shift occurred")
    timestamp: datetime = Field(default_factory=utc_now)
    shift_duration_hours: float = Field(..., ge=0.1, le=24.0, description="Shift length in hours")
    badge_data: BadgeData
    environmental_telemetry: Optional[ContextualEnvironmentalTelemetry] = None
    computed_metrics: Optional[ComputedMetrics] = None
