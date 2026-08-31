import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database.db import get_db, init_db
from backend.database.models import WorkerModel, ExposureLedgerModel, ShiftScanModel
from backend.schemas.worker import WorkerProfile, HealthProfile, PPEDetails, ExposureLedger
from backend.schemas.dosimetry import (
    ShiftScanPayload, BadgeData, ContextualEnvironmentalTelemetry,
    EnvironmentalTelemetry, ComputedMetrics
)
from backend.schemas.advisory import DosimeterAdvisoryPayload
from backend.engine.weather import get_kinetic_weather
from backend.engine.statutory import (
    compute_differential_shift_dose,
    classify_statutory_tier_range,
    evaluate_badge_integrity
)
from backend.engine.ledger import update_worker_exposure_ledger
from backend.agents.onboarding import onboarding_manager
from backend.agents.advisory import generate_dosimeter_advisory
from backend.agents.unified_chat import unified_chat
from backend.intelligence.leak_triangulation import calculate_plant_leak_heatmap
from backend.intelligence.neuro_screener import evaluate_neuro_olfactory_screen, NeuroScreeningResponse
from backend.intelligence.lung_risk import calculate_chronic_lung_risk_score
from backend.intelligence.incident_report import generate_oisd_form_a_pdf

# Initialize Database Schema
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Occupational H2S Exposure Advisory & Plant Safety Intelligence Platform"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Frontend Templates & Static Files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
TEMPLATES_DIR = os.path.join(FRONTEND_DIR, "templates")
STATIC_DIR = os.path.join(FRONTEND_DIR, "static")

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

templates = Jinja2Templates(directory=TEMPLATES_DIR) if os.path.exists(TEMPLATES_DIR) else None

# ----------------- REQUEST / RESPONSE MODELS -----------------

class UnifiedChatRequest(BaseModel):
    session_id: str = "sess_default"
    message: str

class OnboardingChatRequest(BaseModel):
    session_id: str
    message: str

class OnboardingChatResponse(BaseModel):
    session_id: str
    reply: str
    current_step: str
    profile_completed: bool
    worker_profile: Optional[Dict[str, Any]] = None

class ScanSubmissionRequest(BaseModel):
    worker_id: str
    plant_unit: str = "CDU-1"
    shift_duration_hours: float = 8.0
    badge_id: str = "BAND-H2S-01"
    band_lifecycle_day: int = 1
    start_delta_e: float = 0.0
    end_delta_e: float = 4.2
    patch_b_drift: float = 0.1
    patch_c_condition: str = "NORMAL" # NORMAL, WARNING, COMPROMISED

# Seed initial demo worker if DB is empty
def seed_demo_data():
    from backend.database.db import SessionLocal
    db = SessionLocal()
    try:
        if not db.query(WorkerModel).first():
            demo_worker = WorkerModel(
                worker_id="EMP-1042",
                full_name="Rajesh Kumar",
                age=38,
                gender="Male",
                department="Operations",
                plant_unit="CDU-1",
                role="Senior Field Operator",
                preferred_language="en",
                health_profile_json=json.dumps({
                    "smoking_status": "non-smoker",
                    "smoking_pack_years": 0.0,
                    "pre_existing_conditions": ["Mild Allergic Rhinitis"],
                    "baseline_fev1_fvc_ratio": 0.82,
                    "allergies": ["Pollen"],
                    "ocular_sensitivity": True,
                    "historical_symptoms": ["Occasional eye stinging", "Slight sulfur smell perception"]
                }),
                ppe_details_json=json.dumps({
                    "respirator_type": "Half-Mask Air-Purifying",
                    "cartridge_type": "Organic Vapor / Acid Gas (H2S)",
                    "last_fit_test_date": "2026-01-15",
                    "fit_test_passed": True
                })
            )
            db.add(demo_worker)
            db.flush()
            
            ledger = ExposureLedgerModel(
                worker_id="EMP-1042",
                rolling_7day_ppm_hr=16.8,
                rolling_30day_ppm_hr=22.5,
                rolling_90day_ppm_hr=54.0,
                lifetime_shifts_logged=12,
                last_updated=datetime.now(timezone.utc)
            )
            db.add(ledger)
            db.commit()
    finally:
        db.close()

seed_demo_data()

# ----------------- API ENDPOINTS -----------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "Rakshak (रक्षक) H2S Advisory System",
        "version": settings.VERSION,
        "groq_configured": bool(settings.GROQ_API_KEY),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/api/chat")
def chat_endpoint(payload: UnifiedChatRequest, db: Session = Depends(get_db)):
    result = unified_chat.process_message(payload.session_id, payload.message, db)
    return result

@app.post("/api/onboard/chat", response_model=OnboardingChatResponse)
def onboard_chat(payload: OnboardingChatRequest, db: Session = Depends(get_db)):
    reply, profile, step = onboarding_manager.process_turn(payload.session_id, payload.message)
    
    profile_dict = None
    if profile:
        # Save to database
        db_worker = db.query(WorkerModel).filter(WorkerModel.worker_id == profile.worker_id).first()
        if not db_worker:
            db_worker = WorkerModel(
                worker_id=profile.worker_id,
                full_name=profile.full_name,
                age=profile.age,
                gender=profile.gender,
                department=profile.department,
                plant_unit=profile.plant_unit,
                role=profile.role,
                preferred_language=profile.preferred_language,
                health_profile_json=profile.health_profile.model_dump_json(),
                ppe_details_json=profile.ppe_details.model_dump_json()
            )
            db.add(db_worker)
            db.flush()
            
            db_ledger = ExposureLedgerModel(
                worker_id=profile.worker_id,
                rolling_7day_ppm_hr=0.0,
                rolling_30day_ppm_hr=0.0,
                rolling_90day_ppm_hr=0.0,
                lifetime_shifts_logged=0
            )
            db.add(db_ledger)
        else:
            db_worker.full_name = profile.full_name
            db_worker.plant_unit = profile.plant_unit
            db_worker.role = profile.role
            db_worker.preferred_language = profile.preferred_language
            db_worker.health_profile_json = profile.health_profile.model_dump_json()
            db_worker.ppe_details_json = profile.ppe_details.model_dump_json()
            
        db.commit()
        profile_dict = profile.model_dump()

    return OnboardingChatResponse(
        session_id=payload.session_id,
        reply=reply,
        current_step=step,
        profile_completed=(profile is not None),
        worker_profile=profile_dict
    )

@app.get("/api/workers")
def list_workers(db: Session = Depends(get_db)):
    workers = db.query(WorkerModel).all()
    return [w.to_dict() for w in workers]

@app.get("/api/workers/{worker_id}")
@app.get("/api/control-room/workers/{worker_id}")
def get_worker(worker_id: str, db: Session = Depends(get_db)):
    worker = db.query(WorkerModel).filter(WorkerModel.worker_id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail=f"Worker {worker_id} not found")
    
    recent_scans = [s.to_dict() for s in worker.scans[:10]]
    res = worker.to_dict()
    res["recent_scans"] = recent_scans
    
    # Calculate 90-day risk profile
    worker_profile = WorkerProfile(
        worker_id=worker.worker_id,
        full_name=worker.full_name,
        age=worker.age,
        gender=worker.gender,
        department=worker.department,
        plant_unit=worker.plant_unit,
        role=worker.role,
        preferred_language=worker.preferred_language,
        health_profile=HealthProfile(**json.loads(worker.health_profile_json or "{}")),
        ppe_details=PPEDetails(**json.loads(worker.ppe_details_json or "{}")),
        exposure_ledger=ExposureLedger(**(worker.ledger.to_dict() if worker.ledger else {}))
    )
    res["lung_risk_profile"] = calculate_chronic_lung_risk_score(worker_profile)
    return res

@app.post("/api/scan/submit")
def submit_shift_scan(payload: ScanSubmissionRequest, db: Session = Depends(get_db)):
    # 1. Fetch or create worker profile
    db_worker = db.query(WorkerModel).filter(WorkerModel.worker_id == payload.worker_id).first()
    if not db_worker:
        db_worker = WorkerModel(
            worker_id=payload.worker_id,
            full_name=f"Worker {payload.worker_id}",
            plant_unit=payload.plant_unit,
            health_profile_json="{}",
            ppe_details_json="{}"
        )
        db.add(db_worker)
        db.commit()
        db.refresh(db_worker)

    worker_dict = db_worker.to_dict()
    worker_profile = WorkerProfile(
        worker_id=db_worker.worker_id,
        full_name=db_worker.full_name,
        age=db_worker.age,
        gender=db_worker.gender,
        department=db_worker.department,
        plant_unit=payload.plant_unit,
        role=db_worker.role,
        preferred_language=db_worker.preferred_language,
        health_profile=HealthProfile(**worker_dict["health_profile"]),
        ppe_details=PPEDetails(**worker_dict["ppe_details"]),
        exposure_ledger=ExposureLedger(**worker_dict.get("exposure_ledger", {}))
    )

    # 2. Differential Shift Exposure Math & Uncertainty Ranges
    diff_res = compute_differential_shift_dose(
        start_delta_e=payload.start_delta_e,
        end_delta_e=payload.end_delta_e,
        patch_b_drift=payload.patch_b_drift,
        patch_c_condition=payload.patch_c_condition, # type: ignore
        shift_hours=payload.shift_duration_hours
    )

    # 3. Contextual Environmental Telemetry
    weather = get_kinetic_weather()
    telemetry = ContextualEnvironmentalTelemetry(
        temperature_c=weather["temperature_c"],
        relative_humidity_pct=weather["relative_humidity_pct"],
        source=weather["source"]
    )

    # 4. Ledger Recomputation (Uncertainty Ranges)
    prior_7d = worker_profile.exposure_ledger.rolling_7day_high_ppm_hr
    updated_ledger = update_worker_exposure_ledger(
        db, payload.worker_id, diff_res["dose_low"], diff_res["dose_high"]
    )

    # 5. Statutory Tier Classification on Exposure Range
    tier, is_single_crit = classify_statutory_tier_range(
        twa_low=diff_res["twa_low"],
        twa_high=diff_res["twa_high"],
        updated_7day_high=updated_ledger["load_7d_high"],
        dose_high=diff_res["dose_high"]
    )

    metrics = ComputedMetrics(
        net_delta_e=diff_res["net_delta_e"],
        shift_dose_low_ppm_hr=diff_res["dose_low"],
        shift_dose_high_ppm_hr=diff_res["dose_high"],
        shift_dose_range_str=diff_res["dose_range_str"],
        shift_twa_low_ppm=diff_res["twa_low"],
        shift_twa_high_ppm=diff_res["twa_high"],
        shift_twa_range_str=diff_res["twa_range_str"],
        shift_hours=payload.shift_duration_hours,
        prior_7day_load_ppm_hr=prior_7d,
        updated_7day_load_low=updated_ledger["load_7d_low"],
        updated_7day_load_high=updated_ledger["load_7d_high"],
        updated_7day_range_str=updated_ledger["range_7d_str"],
        statutory_tier=tier, # type: ignore
        measurement_confidence=diff_res["confidence"],
        badge_integrity_warning=diff_res["integrity_warning"],
        is_single_shift_critical=is_single_crit
    )

    scan_id = f"SCN-{uuid.uuid4().hex[:8].upper()}"
    badge_data = BadgeData(
        badge_id=payload.badge_id,
        band_lifecycle_day=payload.band_lifecycle_day,
        start_optical_density=payload.start_delta_e,
        end_optical_density=payload.end_delta_e,
        patch_b_drift=payload.patch_b_drift,
        patch_c_condition=payload.patch_c_condition, # type: ignore
        shelf_life_status="VALID"
    )

    scan_payload = ShiftScanPayload(
        scan_id=scan_id,
        worker_id=payload.worker_id,
        plant_unit=payload.plant_unit,
        timestamp=datetime.now(timezone.utc),
        shift_duration_hours=payload.shift_duration_hours,
        badge_data=badge_data,
        environmental_telemetry=telemetry,
        computed_metrics=metrics
    )

    # 6. Generate Advisory with Uncertainty Ranges & Safety Locks
    advisory = generate_dosimeter_advisory(worker_profile, scan_payload)

    # 7. Persist Shift Scan to Database
    db_scan = ShiftScanModel(
        scan_id=scan_id,
        worker_id=payload.worker_id,
        plant_unit=payload.plant_unit,
        timestamp=datetime.now(timezone.utc),
        shift_duration_hours=payload.shift_duration_hours,
        badge_id=badge_data.badge_id,
        delta_e=diff_res["net_delta_e"],
        shelf_life_status="VALID",
        raw_optical_dose=diff_res["nominal_dose"],
        temperature_c=telemetry.temperature_c,
        relative_humidity_pct=telemetry.relative_humidity_pct,
        k_factor=1.0,
        telemetry_source=telemetry.source,
        compensated_dose_ppm_hr=diff_res["nominal_dose"],
        shift_twa_ppm=(diff_res["twa_low"] + diff_res["twa_high"]) / 2.0,
        updated_7day_load=updated_ledger["load_7d_high"],
        statutory_tier=tier,
        is_single_shift_critical=is_single_crit,
        advisory_json=advisory.model_dump_json()
    )
    db.add(db_scan)
    db.commit()

    return {
        "scan_id": scan_id,
        "worker_id": payload.worker_id,
        "plant_unit": payload.plant_unit,
        "telemetry": telemetry.model_dump(),
        "computed_metrics": metrics.model_dump(),
        "advisory": advisory.model_dump()
    }

@app.get("/api/supervisor/heatmap")
def get_supervisor_heatmap(db: Session = Depends(get_db)):
    scans = db.query(ShiftScanModel).order_by(ShiftScanModel.timestamp.desc()).limit(50).all()
    scan_dicts = [s.to_dict() for s in scans]
    heatmap_data = calculate_plant_leak_heatmap(scan_dicts)
    return heatmap_data

@app.get("/api/supervisor/incident-pdf/{scan_id}")
def download_incident_pdf(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(ShiftScanModel).filter(ShiftScanModel.scan_id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
    
    worker = scan.worker
    worker_dict = worker.to_dict() if worker else {}
    scan_dict = scan.to_dict()
    
    pdf_buffer = generate_oisd_form_a_pdf(scan_dict, worker_dict)
    
    filename = f"OISD_Form_A_{scan_id}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.post("/api/screener/neuro-test")
def run_neuro_test(response: NeuroScreeningResponse):
    result = evaluate_neuro_olfactory_screen(response)
    return result

@app.get("/api/workers/{worker_id}/lung-risk")
def get_worker_lung_risk(worker_id: str, db: Session = Depends(get_db)):
    worker = db.query(WorkerModel).filter(WorkerModel.worker_id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail=f"Worker {worker_id} not found")
    
    worker_dict = worker.to_dict()
    worker_profile = WorkerProfile(
        worker_id=worker.worker_id,
        full_name=worker.full_name,
        age=worker.age,
        gender=worker.gender,
        department=worker.department,
        plant_unit=worker.plant_unit,
        role=worker.role,
        preferred_language=worker.preferred_language,
        health_profile=HealthProfile(**worker_dict["health_profile"]),
        ppe_details=PPEDetails(**worker_dict["ppe_details"]),
        exposure_ledger=ExposureLedger(**worker_dict.get("exposure_ledger", {}))
    )
    
    risk_result = calculate_chronic_lung_risk_score(worker_profile)
    return risk_result

# ----------------- WEB UI ROUTES -----------------

@app.get("/", response_class=HTMLResponse)
def index_page(request: Request):
    if templates:
        return templates.TemplateResponse(request=request, name="index.html")
    return HTMLResponse("<h1>Rakshak H2S System Backend Online. Templates loading...</h1>")

@app.get("/onboard", response_class=HTMLResponse)
def onboard_page(request: Request):
    if templates:
        return templates.TemplateResponse(request=request, name="onboard.html")
    return HTMLResponse("<h1>Onboarding Page</h1>")

@app.get("/scan", response_class=HTMLResponse)
@app.get("/manager/scan", response_class=HTMLResponse)
def scan_page(request: Request):
    if templates:
        return templates.TemplateResponse(request=request, name="scan.html")
    return HTMLResponse("<h1>Dosimeter Badge Scan & Triage Drawer</h1>")

@app.get("/control-room/workers/{worker_id}", response_class=HTMLResponse)
@app.get("/workers/{worker_id}", response_class=HTMLResponse)
def worker_insights_page(request: Request, worker_id: str):
    if templates:
        return templates.TemplateResponse(request=request, name="worker_insights.html")
    return HTMLResponse(f"<h1>Worker Insights: {worker_id}</h1>")

@app.get("/supervisor", response_class=HTMLResponse)
@app.get("/manager", response_class=HTMLResponse)
def supervisor_page(request: Request):
    if templates:
        return templates.TemplateResponse(request=request, name="supervisor.html")
    return HTMLResponse("<h1>Shift Supervisor / Manager Portal</h1>")

@app.get("/screener", response_class=HTMLResponse)
def screener_page(request: Request):
    if templates:
        return templates.TemplateResponse(request=request, name="screener.html")
    return HTMLResponse("<h1>Neuro-Olfactory Screener</h1>")

@app.get("/lung-risk", response_class=HTMLResponse)
def lung_risk_page(request: Request):
    if templates:
        return templates.TemplateResponse(request=request, name="lung_risk.html")
    return HTMLResponse("<h1>Chronic Lung Risk Assessment</h1>")
