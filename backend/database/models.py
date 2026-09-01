import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.db import Base

def utc_now():
    return datetime.now(timezone.utc)

class EmployeeModel(Base):
    """
    Longitudinal Refinery Employee Profile & Operational Status.
    """
    __tablename__ = "workers"  # Retain table name for seamless database compatibility

    worker_id = Column(String(50), primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    age = Column(Integer, default=35)
    gender = Column(String(20), default="Male")
    department = Column(String(100), default="Operations")
    plant_unit = Column(String(100), default="CDU-1")
    role = Column(String(100), default="Plant Technician")
    preferred_language = Column(String(10), default="en")
    
    # Active wristband tracking
    active_badge_id = Column(String(50), default="BAND-01")
    band_lifecycle_day = Column(Integer, default=1)
    
    # Serialized health profile & PPE equipment details
    health_profile_json = Column(Text, default="{}")
    ppe_details_json = Column(Text, default="{}")
    
    # Relationships
    ledger = relationship("ExposureLedgerModel", back_populates="worker", uselist=False, cascade="all, delete-orphan")
    scans = relationship("ShiftScanModel", back_populates="worker", cascade="all, delete-orphan", order_by="desc(ShiftScanModel.timestamp)")
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    @property
    def employee_id(self) -> str:
        return self.worker_id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "employee_id": self.worker_id,
            "worker_id": self.worker_id,
            "full_name": self.full_name,
            "age": self.age,
            "gender": self.gender,
            "department": self.department,
            "plant_unit": self.plant_unit,
            "role": self.role,
            "preferred_language": self.preferred_language,
            "active_badge_id": self.active_badge_id,
            "band_lifecycle_day": self.band_lifecycle_day,
            "health_profile": json.loads(self.health_profile_json or "{}"),
            "ppe_details": json.loads(self.ppe_details_json or "{}"),
            "exposure_ledger": self.ledger.to_dict() if self.ledger else {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

# Alias for backward compatibility
WorkerModel = EmployeeModel

class ExposureLedgerModel(Base):
    """
    Rolling Multi-Window Longitudinal Exposure Accumulator.
    """
    __tablename__ = "exposure_ledgers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    worker_id = Column(String(50), ForeignKey("workers.worker_id"), unique=True, index=True, nullable=False)
    rolling_7day_ppm_hr = Column(Float, default=0.0)
    rolling_30day_ppm_hr = Column(Float, default=0.0)
    rolling_90day_ppm_hr = Column(Float, default=0.0)
    lifetime_shifts_logged = Column(Integer, default=0)
    last_updated = Column(DateTime, default=utc_now, onupdate=utc_now)

    worker = relationship("EmployeeModel", back_populates="ledger")

    def to_dict(self) -> Dict[str, Any]:
        load_7d = round(self.rolling_7day_ppm_hr, 2)
        load_7d_low = round(load_7d * 0.88, 1)
        load_7d_high = round(load_7d * 1.12, 1)
        return {
            "rolling_7day_ppm_hr": load_7d,
            "rolling_7day_low_ppm_hr": load_7d_low,
            "rolling_7day_high_ppm_hr": load_7d_high,
            "rolling_7day_range_str": f"{load_7d_low}–{load_7d_high} ppm·h",
            "rolling_30day_ppm_hr": round(self.rolling_30day_ppm_hr, 2),
            "rolling_90day_ppm_hr": round(self.rolling_90day_ppm_hr, 2),
            "lifetime_shifts_logged": self.lifetime_shifts_logged,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
        }

class ShiftScanModel(Base):
    """
    Active & Completed Differential Shift Dosimetry Records.
    """
    __tablename__ = "shift_scans"

    scan_id = Column(String(50), primary_key=True, index=True)
    worker_id = Column(String(50), ForeignKey("workers.worker_id"), index=True, nullable=False)
    plant_unit = Column(String(100), default="CDU-1")
    timestamp = Column(DateTime, default=utc_now, index=True)
    shift_status = Column(String(20), default="COMPLETED")  # ACTIVE | COMPLETED
    shift_duration_hours = Column(Float, default=8.0)
    
    # Optical Badge telemetry
    badge_id = Column(String(50), default="BAND-01")
    start_delta_e = Column(Float, default=0.0)
    end_delta_e = Column(Float, default=0.0)
    net_delta_e = Column(Float, default=0.0)
    delta_e = Column(Float, default=0.0)
    patch_b_drift = Column(Float, default=0.0)
    patch_c_condition = Column(String(20), default="NORMAL")
    shelf_life_status = Column(String(20), default="VALID")
    raw_optical_dose = Column(Float, default=0.0)
    
    # Environmental telemetry
    temperature_c = Column(Float, default=28.0)
    relative_humidity_pct = Column(Float, default=70.0)
    k_factor = Column(Float, default=1.0)
    telemetry_source = Column(String(50), default="Open-Meteo")
    
    # Computed metrics & uncertainty ranges
    dose_low = Column(Float, default=0.0)
    dose_high = Column(Float, default=0.0)
    twa_low = Column(Float, default=0.0)
    twa_high = Column(Float, default=0.0)
    compensated_dose_ppm_hr = Column(Float, default=0.0)
    shift_twa_ppm = Column(Float, default=0.0)
    updated_7day_load = Column(Float, default=0.0)
    statutory_tier = Column(String(30), default="TIER 1 (NORMAL)")
    measurement_confidence = Column(String(20), default="HIGH")
    is_single_shift_critical = Column(Boolean, default=False)
    
    # Advisory payload result
    advisory_json = Column(Text, default="{}")

    worker = relationship("EmployeeModel", back_populates="scans")

    def to_dict(self) -> Dict[str, Any]:
        dose_low_val = round(self.dose_low or (self.compensated_dose_ppm_hr * 0.88), 1)
        dose_high_val = round(self.dose_high or (self.compensated_dose_ppm_hr * 1.12), 1)
        twa_low_val = round(self.twa_low or (self.shift_twa_ppm * 0.88), 2)
        twa_high_val = round(self.twa_high or (self.shift_twa_ppm * 1.12), 2)
        
        return {
            "scan_id": self.scan_id,
            "employee_id": self.worker_id,
            "worker_id": self.worker_id,
            "plant_unit": self.plant_unit,
            "shift_status": self.shift_status,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "shift_duration_hours": self.shift_duration_hours,
            "badge_data": {
                "badge_id": self.badge_id,
                "start_delta_e": self.start_delta_e,
                "end_delta_e": self.end_delta_e,
                "net_delta_e": round(self.net_delta_e or self.delta_e, 2),
                "delta_e": round(self.delta_e, 2),
                "patch_b_drift": self.patch_b_drift,
                "patch_c_condition": self.patch_c_condition,
                "shelf_life_status": self.shelf_life_status,
                "raw_optical_dose": round(self.raw_optical_dose, 2),
            },
            "environmental_telemetry": {
                "temperature_c": self.temperature_c,
                "relative_humidity_pct": self.relative_humidity_pct,
                "k_factor": self.k_factor,
                "source": self.telemetry_source,
            },
            "computed_metrics": {
                "shift_dose_range_str": f"{dose_low_val}–{dose_high_val} ppm·h",
                "shift_twa_range_str": f"{twa_low_val}–{twa_high_val} ppm",
                "dose_low": dose_low_val,
                "dose_high": dose_high_val,
                "twa_low": twa_low_val,
                "twa_high": twa_high_val,
                "compensated_dose_ppm_hr": round(self.compensated_dose_ppm_hr, 3),
                "shift_twa_ppm": round(self.shift_twa_ppm, 3),
                "shift_hours": self.shift_duration_hours,
                "updated_7day_load": round(self.updated_7day_load, 3),
                "statutory_tier": self.statutory_tier,
                "measurement_confidence": self.measurement_confidence,
                "is_single_shift_critical": self.is_single_shift_critical,
            },
            "advisory": json.loads(self.advisory_json or "{}"),
        }

class IncidentReportModel(Base):
    """
    Statutory Compliance Incident Records (OISD-STD-105 Form-A).
    """
    __tablename__ = "incident_reports"

    incident_id = Column(String(50), primary_key=True, index=True)
    scan_id = Column(String(50), ForeignKey("shift_scans.scan_id"), index=True, nullable=False)
    worker_id = Column(String(50), ForeignKey("workers.worker_id"), index=True, nullable=False)
    plant_unit = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=utc_now, index=True)
    severity_tier = Column(String(30), nullable=False)
    status = Column(String(20), default="OPEN")  # OPEN | INVESTIGATING | CLOSED
    supervisor_notes = Column(Text, default="")
    ohc_clearance = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "incident_id": self.incident_id,
            "scan_id": self.scan_id,
            "employee_id": self.worker_id,
            "worker_id": self.worker_id,
            "plant_unit": self.plant_unit,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "severity_tier": self.severity_tier,
            "status": self.status,
            "supervisor_notes": self.supervisor_notes,
            "ohc_clearance": self.ohc_clearance,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
