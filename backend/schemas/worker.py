from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc)

class HealthProfile(BaseModel):
    smoking_status: str = Field(default="non-smoker", description="non-smoker, former-smoker, active-smoker")
    smoking_pack_years: float = Field(default=0.0, description="Calculated pack-years")
    pre_existing_conditions: List[str] = Field(default_factory=list, description="Asthma, COPD, bronchitis, cardiac, etc.")
    baseline_fev1_fvc_ratio: Optional[float] = Field(default=0.80, description="Baseline spirometry FEV1/FVC ratio (0.7-0.85 typical)")
    allergies: List[str] = Field(default_factory=list, description="Allergic rhinitis, skin sensitivities, etc.")
    ocular_sensitivity: bool = Field(default=False, description="History of eye irritation, dry eyes, contact lenses")

class PPEDetails(BaseModel):
    respirator_type: str = Field(default="Half-Mask Air-Purifying", description="Half-Mask, Full-Face, SCBA, Escape Pack")
    cartridge_type: str = Field(default="Organic Vapor/Acid Gas (H2S specific)", description="Cartridge classification")
    last_fit_test_date: Optional[str] = Field(default=None, description="ISO format date YYYY-MM-DD")
    fit_test_passed: bool = Field(default=True, description="Whether the last quantitative/qualitative fit test passed")

class ExposureLedger(BaseModel):
    rolling_7day_ppm_hr: float = Field(default=0.0, description="Rolling 7-day cumulative H2S load in ppm·hr")
    rolling_30day_ppm_hr: float = Field(default=0.0, description="Rolling 30-day cumulative H2S load in ppm·hr")
    rolling_90day_ppm_hr: float = Field(default=0.0, description="Rolling 90-day cumulative H2S load in ppm·hr")
    lifetime_shifts_logged: int = Field(default=0, description="Total number of logged shifts")
    last_updated: datetime = Field(default_factory=utc_now)

class WorkerProfile(BaseModel):
    worker_id: str = Field(..., description="Unique employee badge or identification number, e.g., EMP-1042")
    full_name: str = Field(..., description="Worker's full name")
    age: int = Field(default=35, description="Age in years")
    gender: str = Field(default="Male", description="Gender")
    department: str = Field(default="Operations", description="Operations, Maintenance, Inspection, Safety")
    plant_unit: str = Field(default="CDU-1", description="Assigned unit, e.g., CDU-1, DHDS, SRU, Tank Farm, Flare Header")
    role: str = Field(default="Plant Technician", description="Technician, Field Operator, Safety Marshall, Maintenance Engineer")
    preferred_language: str = Field(default="en", description="Preferred language: 'en' for English, 'hi' for Hindi")
    health_profile: HealthProfile = Field(default_factory=HealthProfile)
    ppe_details: PPEDetails = Field(default_factory=PPEDetails)
    exposure_ledger: ExposureLedger = Field(default_factory=ExposureLedger)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
