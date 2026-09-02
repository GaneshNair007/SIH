import os
import json
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import settings

# SQLite needs check_same_thread=False and timeout for async/multithreaded FastAPI & hot reload
connect_args = {"check_same_thread": False, "timeout": 30.0} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=30000")
            cursor.close()
        except Exception:
            pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def seed_default_data(db):
    from backend.database.models import EmployeeModel, ExposureLedgerModel, ShiftScanModel, IncidentReportModel
    
    if db.query(EmployeeModel).count() > 0:
        return  # Already seeded

    print("🌱 Seeding initial refinery workforce and shift history...")
    now = datetime.now(timezone.utc)

    employees_data = [
        {
            "worker_id": "EMP-1042",
            "full_name": "Sumedh Kulkarni",
            "age": 25,
            "gender": "Male",
            "department": "Operations",
            "plant_unit": "CDU-1",
            "role": "Senior Panel Operator",
            "preferred_language": "en",
            "active_badge_id": "BAND-1042-01",
            "band_lifecycle_day": 2,
            "health_profile_json": json.dumps({
                "smoking_status": "Non-smoker",
                "pre_existing_conditions": ["None"],
                "fev1_baseline_liters": 3.8,
                "fvc_baseline_liters": 4.6,
                "baseline_heart_rate_bpm": 72
            }),
            "ppe_details_json": json.dumps({
                "respirator_type": "3M Half-Face 6200 with 6006 Cartridge",
                "cartridge_install_date": (now - timedelta(days=12)).strftime("%Y-%m-%d"),
                "fit_test_date": (now - timedelta(days=45)).strftime("%Y-%m-%d"),
                "fit_test_passed": True
            }),
            "ledger": {
                "rolling_7day_ppm_hr": 7.4,
                "rolling_30day_ppm_hr": 24.1,
                "rolling_90day_ppm_hr": 68.5,
                "lifetime_shifts_logged": 142
            }
        },
        {
            "worker_id": "EMP-1043",
            "full_name": "Sunil Verma",
            "age": 44,
            "gender": "Male",
            "department": "Maintenance",
            "plant_unit": "DHDS",
            "role": "Mechanical Technician",
            "preferred_language": "hi",
            "active_badge_id": "BAND-1043-03",
            "band_lifecycle_day": 3,
            "health_profile_json": json.dumps({
                "smoking_status": "Former smoker",
                "pre_existing_conditions": ["Mild occupational asthma"],
                "fev1_baseline_liters": 3.1,
                "fvc_baseline_liters": 4.0,
                "baseline_heart_rate_bpm": 78
            }),
            "ppe_details_json": json.dumps({
                "respirator_type": "Honeywell North 7700 Half-Mask",
                "cartridge_install_date": (now - timedelta(days=5)).strftime("%Y-%m-%d"),
                "fit_test_date": (now - timedelta(days=30)).strftime("%Y-%m-%d"),
                "fit_test_passed": True
            }),
            "ledger": {
                "rolling_7day_ppm_hr": 16.8,
                "rolling_30day_ppm_hr": 42.0,
                "rolling_90day_ppm_hr": 115.2,
                "lifetime_shifts_logged": 210
            }
        },
        {
            "worker_id": "EMP-1044",
            "full_name": "Amit Patel",
            "age": 29,
            "gender": "Male",
            "department": "Operations",
            "plant_unit": "SRU",
            "role": "Sulfur Recovery Operator",
            "preferred_language": "en",
            "active_badge_id": "BAND-1044-01",
            "band_lifecycle_day": 1,
            "health_profile_json": json.dumps({
                "smoking_status": "Active smoker (5-10/day)",
                "pre_existing_conditions": ["None"],
                "fev1_baseline_liters": 3.6,
                "fvc_baseline_liters": 4.4,
                "baseline_heart_rate_bpm": 80
            }),
            "ppe_details_json": json.dumps({
                "respirator_type": "Dräger X-plore 5500 Full-Face",
                "cartridge_install_date": (now - timedelta(days=2)).strftime("%Y-%m-%d"),
                "fit_test_date": (now - timedelta(days=20)).strftime("%Y-%m-%d"),
                "fit_test_passed": True
            }),
            "ledger": {
                "rolling_7day_ppm_hr": 26.5,
                "rolling_30day_ppm_hr": 58.4,
                "rolling_90day_ppm_hr": 145.0,
                "lifetime_shifts_logged": 88
            }
        },
        {
            "worker_id": "EMP-1045",
            "full_name": "Priya Nair",
            "age": 34,
            "gender": "Female",
            "department": "Inspection & HSE",
            "plant_unit": "Tank Farm",
            "role": "Corrosion & Asset Inspector",
            "preferred_language": "en",
            "active_badge_id": "BAND-1045-02",
            "band_lifecycle_day": 4,
            "health_profile_json": json.dumps({
                "smoking_status": "Non-smoker",
                "pre_existing_conditions": ["None"],
                "fev1_baseline_liters": 3.2,
                "fvc_baseline_liters": 3.9,
                "baseline_heart_rate_bpm": 68
            }),
            "ppe_details_json": json.dumps({
                "respirator_type": "3M 7502 Silicone Half-Face",
                "cartridge_install_date": (now - timedelta(days=15)).strftime("%Y-%m-%d"),
                "fit_test_date": (now - timedelta(days=60)).strftime("%Y-%m-%d"),
                "fit_test_passed": True
            }),
            "ledger": {
                "rolling_7day_ppm_hr": 4.2,
                "rolling_30day_ppm_hr": 14.5,
                "rolling_90day_ppm_hr": 38.0,
                "lifetime_shifts_logged": 95
            }
        }
    ]

    for data in employees_data:
        ledger_data = data.pop("ledger")
        emp = EmployeeModel(**data)
        db.add(emp)
        db.commit()
        db.refresh(emp)

        ledger = ExposureLedgerModel(
            worker_id=emp.worker_id,
            **ledger_data
        )
        db.add(ledger)
        db.commit()

        # Seed sample completed shift scan
        scan = ShiftScanModel(
            scan_id=f"SCN-{emp.worker_id}-01",
            worker_id=emp.worker_id,
            plant_unit=emp.plant_unit,
            timestamp=now - timedelta(hours=4),
            shift_status="COMPLETED",
            shift_duration_hours=8.0,
            badge_id=emp.active_badge_id,
            start_delta_e=0.4,
            end_delta_e=3.6,
            net_delta_e=3.1,
            delta_e=3.1,
            patch_b_drift=0.1,
            patch_c_condition="NORMAL",
            shelf_life_status="VALID",
            raw_optical_dose=6.8,
            temperature_c=28.5,
            relative_humidity_pct=72.0,
            k_factor=1.0,
            telemetry_source="Open-Meteo",
            dose_low=6.2,
            dose_high=7.8,
            twa_low=0.78,
            twa_high=0.98,
            compensated_dose_ppm_hr=7.0,
            shift_twa_ppm=0.88,
            updated_7day_load=ledger_data["rolling_7day_ppm_hr"],
            statutory_tier="TIER 1 (NORMAL)" if ledger_data["rolling_7day_ppm_hr"] < 15.0 else "TIER 2 (CAUTION)",
            measurement_confidence="HIGH",
            is_single_shift_critical=False,
            advisory_json=json.dumps({
                "summary_banner": "Shift exposure within normal limits. Safe baseline maintained.",
                "triage_question": "Are you feeling any slight eye dryness or throat tickle?",
                "recommendations": [
                    {
                        "priority_level": "[LOW / SELF-CARE]",
                        "category": "Self-Care & Hygiene",
                        "action_item": "Wash face and exposed skin with clean water. Rest for 15 minutes and hydrate."
                    }
                ]
            })
        )
        db.add(scan)
        db.commit()

    print("✅ Seeded 4 refinery employees with ledgers and shift scans.")

def init_db():
    from backend.database import models  # noqa
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_default_data(db)
    finally:
        db.close()
