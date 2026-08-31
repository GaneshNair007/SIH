from typing import Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc)

class BadgeData(BaseModel):
    badge_id: str = Field(..., description="Unique dosimeter wristband barcode/RFID")
    delta_e: float = Field(..., description="Raw optical color difference (delta E) measured by colorimeter")
    shelf_life_status: Literal["VALID", "EXPIRED", "WARNING"] = Field(default="VALID", description="Dosimeter substrate validity")
    raw_optical_dose: float = Field(..., description="Uncompensated raw dose reading in ppm·hr derived from delta E calibration curve")

class EnvironmentalTelemetry(BaseModel):
    latitude: float = Field(default=12.9904, description="Plant latitude")
    longitude: float = Field(default=74.8219, description="Plant longitude")
    temperature_c: float = Field(..., description="Ambient temperature in degrees Celsius")
    relative_humidity_pct: float = Field(..., description="Ambient relative humidity percentage (0-100)")
    pressure_hpa: Optional[float] = Field(default=1013.25, description="Atmospheric pressure in hPa")
    k_factor: float = Field(default=1.0, description="Kinetic Arrhenius & moisture scaling factor k(T, RH)")
    source: str = Field(default="Open-Meteo", description="Source of telemetry: Open-Meteo, DCS-Station-4, Sensor-Mesh")

class ComputedMetrics(BaseModel):
    compensated_dose_ppm_hr: float = Field(..., description="Kinetic-compensated dose in ppm·hr (raw_dose / k_factor)")
    shift_twa_ppm: float = Field(..., description="Time-Weighted Average exposure in ppm over shift duration")
    shift_hours: float = Field(..., description="Duration of exposure shift in hours")
    prior_7day_load: float = Field(default=0.0, description="7-day cumulative load prior to current shift in ppm·hr")
    updated_7day_load: float = Field(..., description="Updated 7-day cumulative load including current shift in ppm·hr")
    statutory_tier: Literal["TIER 1 (NORMAL)", "TIER 2 (CAUTION)", "TIER 3 (CRITICAL)"] = Field(
        ..., description="Statutory compliance and risk classification"
    )
    is_single_shift_critical: bool = Field(default=False, description="Whether single-shift dose exceeded 20.0 ppm·hr")

class ShiftScanPayload(BaseModel):
    scan_id: str = Field(..., description="Unique scan transaction ID, e.g., SCN-89412")
    worker_id: str = Field(..., description="Worker identification ID")
    plant_unit: str = Field(default="CDU-1", description="Refinery unit where shift occurred")
    timestamp: datetime = Field(default_factory=utc_now)
    shift_duration_hours: float = Field(..., ge=0.1, le=24.0, description="Shift length in hours")
    badge_data: BadgeData
    environmental_telemetry: Optional[EnvironmentalTelemetry] = None
    computed_metrics: Optional[ComputedMetrics] = None
