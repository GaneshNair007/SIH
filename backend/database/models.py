import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.db import Base

def utc_now():
    return datetime.now(timezone.utc)

class WorkerModel(Base):
    __tablename__ = "workers"

    worker_id = Column(String(50), primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    age = Column(Integer, default=35)
    gender = Column(String(20), default="Male")
    department = Column(String(100), default="Operations")
    plant_unit = Column(String(100), default="CDU-1")
    role = Column(String(100), default="Plant Technician")
    preferred_language = Column(String(10), default="en")
    
    # Serialized JSON fields for flexible and fast querying
    health_profile_json = Column(Text, default="{}")
    ppe_details_json = Column(Text, default="{}")
    
    # Relationships
    ledger = relationship("ExposureLedgerModel", back_populates="worker", uselist=False, cascade="all, delete-orphan")
    scans = relationship("ShiftScanModel", back_populates="worker", cascade="all, delete-orphan", order_by="desc(ShiftScanModel.timestamp)")
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    def to_dict(self):
        return {
            "worker_id": self.worker_id,
            "full_name": self.full_name,
            "age": self.age,
            "gender": self.gender,
            "department": self.department,
            "plant_unit": self.plant_unit,
            "role": self.role,
            "preferred_language": self.preferred_language,
            "health_profile": json.loads(self.health_profile_json or "{}"),
            "ppe_details": json.loads(self.ppe_details_json or "{}"),
            "exposure_ledger": self.ledger.to_dict() if self.ledger else {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class ExposureLedgerModel(Base):
    __tablename__ = "exposure_ledgers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    worker_id = Column(String(50), ForeignKey("workers.worker_id"), unique=True, index=True, nullable=False)
    rolling_7day_ppm_hr = Column(Float, default=0.0)
    rolling_30day_ppm_hr = Column(Float, default=0.0)
    rolling_90day_ppm_hr = Column(Float, default=0.0)
    lifetime_shifts_logged = Column(Integer, default=0)
    last_updated = Column(DateTime, default=utc_now, onupdate=utc_now)

    worker = relationship("WorkerModel", back_populates="ledger")

    def to_dict(self):
        return {
            "rolling_7day_ppm_hr": round(self.rolling_7day_ppm_hr, 3),
            "rolling_30day_ppm_hr": round(self.rolling_30day_ppm_hr, 3),
            "rolling_90day_ppm_hr": round(self.rolling_90day_ppm_hr, 3),
            "lifetime_shifts_logged": self.lifetime_shifts_logged,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
        }

class ShiftScanModel(Base):
    __tablename__ = "shift_scans"

    scan_id = Column(String(50), primary_key=True, index=True)
    worker_id = Column(String(50), ForeignKey("workers.worker_id"), index=True, nullable=False)
    plant_unit = Column(String(100), default="CDU-1")
    timestamp = Column(DateTime, default=utc_now, index=True)
    shift_duration_hours = Column(Float, nullable=False)
    
    # Badge telemetry
    badge_id = Column(String(50), nullable=False)
    delta_e = Column(Float, nullable=False)
    shelf_life_status = Column(String(20), default="VALID")
    raw_optical_dose = Column(Float, nullable=False)
    
    # Environmental telemetry
    temperature_c = Column(Float, nullable=False)
    relative_humidity_pct = Column(Float, nullable=False)
    k_factor = Column(Float, default=1.0)
    telemetry_source = Column(String(50), default="Open-Meteo")
    
    # Computed metrics
    compensated_dose_ppm_hr = Column(Float, nullable=False)
    shift_twa_ppm = Column(Float, nullable=False)
    updated_7day_load = Column(Float, nullable=False)
    statutory_tier = Column(String(30), nullable=False)
    is_single_shift_critical = Column(Boolean, default=False)
    
    # Advisory payload result
    advisory_json = Column(Text, default="{}")

    worker = relationship("WorkerModel", back_populates="scans")

    def to_dict(self):
        return {
            "scan_id": self.scan_id,
            "worker_id": self.worker_id,
            "plant_unit": self.plant_unit,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "shift_duration_hours": self.shift_duration_hours,
            "badge_data": {
                "badge_id": self.badge_id,
                "delta_e": self.delta_e,
                "shelf_life_status": self.shelf_life_status,
                "raw_optical_dose": self.raw_optical_dose,
            },
            "environmental_telemetry": {
                "temperature_c": self.temperature_c,
                "relative_humidity_pct": self.relative_humidity_pct,
                "k_factor": self.k_factor,
                "source": self.telemetry_source,
            },
            "computed_metrics": {
                "compensated_dose_ppm_hr": round(self.compensated_dose_ppm_hr, 3),
                "shift_twa_ppm": round(self.shift_twa_ppm, 3),
                "shift_hours": self.shift_duration_hours,
                "updated_7day_load": round(self.updated_7day_load, 3),
                "statutory_tier": self.statutory_tier,
                "is_single_shift_critical": self.is_single_shift_critical,
            },
            "advisory": json.loads(self.advisory_json or "{}"),
        }
