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
from backend.schemas.dosimetry import ShiftScanPayload, BadgeData, EnvironmentalTelemetry, ComputedMetrics
from backend.schemas.advisory import DosimeterAdvisoryPayload
from backend.engine.weather import get_kinetic_weather
from backend.engine.kinetics import compute_kinetic_factor, compensate_dose
from backend.engine.statutory import calculate_twa, classify_statutory_tier
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
    delta_e: float = 4.2  # Optical color change ΔE
    raw_optical_dose: Optional[float] = None  # If None, calculated from delta_e
    override_temp_c: Optional[float] = None
    override_rh_pct: Optional[float] = None

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
                    "ocular_sensitivity": True
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
                rolling_7day_ppm_hr=6.4,
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
def get_worker(worker_id: str, db: Session = Depends(get_db)):
    worker = db.query(WorkerModel).filter(WorkerModel.worker_id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail=f"Worker {worker_id} not found")
    
    recent_scans = [s.to_dict() for s in worker.scans[:10]]
    res = worker.to_dict()
    res["recent_scans"] = recent_scans
    return res

@app.post("/api/scan/submit")
def submit_shift_scan(payload: ScanSubmissionRequest, db: Session = Depends(get_db)):
    # 1. Fetch or create worker profile
    db_worker = db.query(WorkerModel).filter(WorkerModel.worker_id == payload.worker_id).first()
    if not db_worker:
        # Create default on-the-fly worker profile
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

    # 2. Derive raw optical dose from delta E if not explicitly supplied
    # Calibration Curve: Dose (ppm·hr) = 2.15 * delta_E + 0.08 * (delta_E ^ 1.5)
    if payload.raw_optical_dose is not None:
        raw_dose = payload.raw_optical_dose
    else:
        raw_dose = round(2.15 * payload.delta_e + 0.08 * (payload.delta_e ** 1.5), 3)

    # 3. Fetch Environmental Telemetry & Arrhenius factor
    weather = get_kinetic_weather()
    temp_c = payload.override_temp_c if payload.override_temp_c is not None else weather["temperature_c"]
    rh_pct = payload.override_rh_pct if payload.override_rh_pct is not None else weather["relative_humidity_pct"]
    
    k_factor = compute_kinetic_factor(temp_c, rh_pct)
    telemetry = EnvironmentalTelemetry(
        temperature_c=temp_c,
        relative_humidity_pct=rh_pct,
        pressure_hpa=weather.get("pressure_hpa", 1013.25),
        k_factor=k_factor,
        source=weather.get("source", "Telemetry Station")
    )

    # 4. Pure Deterministic Dosimetry Math (Zero LLM)
    compensated_dose = compensate_dose(raw_dose, k_factor)
    twa_ppm = calculate_twa(compensated_dose, payload.shift_duration_hours)
    
    # 5. Ledger Recomputation & Statutory Tiering
    prior_7d = worker_profile.exposure_ledger.rolling_7day_ppm_hr
    updated_ledger = update_worker_exposure_ledger(db, payload.worker_id, compensated_dose)
    updated_7d = updated_ledger["rolling_7day_ppm_hr"]
    
    statutory_tier, is_single_critical = classify_statutory_tier(
        twa_ppm=twa_ppm,
        updated_7day_load_ppm_hr=updated_7d,
        compensated_single_shift_dose=compensated_dose
    )

    metrics = ComputedMetrics(
        compensated_dose_ppm_hr=compensated_dose,
        shift_twa_ppm=twa_ppm,
        shift_hours=payload.shift_duration_hours,
        prior_7day_load=prior_7d,
        updated_7day_load=updated_7d,
        statutory_tier=statutory_tier,
        is_single_shift_critical=is_single_critical
    )

    scan_id = f"SCN-{uuid.uuid4().hex[:8].upper()}"
    badge_data = BadgeData(
        badge_id=payload.badge_id,
        delta_e=payload.delta_e,
        shelf_life_status="VALID",
        raw_optical_dose=raw_dose
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

    # 6. Generate Advisory with Hybrid RAG & Safety Locks
    advisory = generate_dosimeter_advisory(worker_profile, scan_payload)

    # 7. Persist Shift Scan to Database
    db_scan = ShiftScanModel(
        scan_id=scan_id,
        worker_id=payload.worker_id,
        plant_unit=payload.plant_unit,
        timestamp=datetime.now(timezone.utc),
        shift_duration_hours=payload.shift_duration_hours,
        badge_id=badge_data.badge_id,
        delta_e=badge_data.delta_e,
        shelf_life_status=badge_data.shelf_life_status,
        raw_optical_dose=badge_data.raw_optical_dose,
        temperature_c=telemetry.temperature_c,
        relative_humidity_pct=telemetry.relative_humidity_pct,
        k_factor=telemetry.k_factor,
        telemetry_source=telemetry.source,
        compensated_dose_ppm_hr=metrics.compensated_dose_ppm_hr,
        shift_twa_ppm=metrics.shift_twa_ppm,
        updated_7day_load=metrics.updated_7day_load,
        statutory_tier=metrics.statutory_tier,
        is_single_shift_critical=metrics.is_single_shift_critical,
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
def scan_page(request: Request):
    if templates:
        return templates.TemplateResponse(request=request, name="scan.html")
    return HTMLResponse("<h1>Dosimeter Badge Scan Page</h1>")

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
