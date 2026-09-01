import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_start_shift_checkin():
    payload = {
        "employee_id": "EMP-1042",
        "plant_unit": "CDU-1",
        "badge_id": "BAND-1042-01",
        "start_delta_e": 0.4,
        "band_lifecycle_day": 2
    }
    res = client.post("/api/scan/start-shift", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ACTIVE_SHIFT_STARTED"
    assert "scan_id" in data
    assert data["employee_id"] == "EMP-1042"

def test_end_shift_differential():
    payload = {
        "worker_id": "EMP-1042",
        "employee_id": "EMP-1042",
        "plant_unit": "CDU-1",
        "shift_duration_hours": 8.0,
        "badge_id": "BAND-1042-01",
        "band_lifecycle_day": 2,
        "start_delta_e": 0.4,
        "end_delta_e": 3.8,
        "patch_b_drift": 0.1,
        "patch_c_condition": "NORMAL"
    }
    res = client.post("/api/scan/end-shift", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "scan_id" in data
    assert "computed_metrics" in data
    assert "shift_dose_range_str" in data["computed_metrics"]
    assert "shift_twa_range_str" in data["computed_metrics"]
    assert "updated_7day_range_str" in data["computed_metrics"]
    assert data["computed_metrics"]["statutory_tier"] in ["TIER 1 (NORMAL)", "TIER 2 (CAUTION)", "TIER 3 (CRITICAL)"]

def test_manager_dashboard_kpis():
    res = client.get("/api/manager/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "workforce_kpis" in data
    assert data["workforce_kpis"]["total_active_employees"] >= 1
    assert "unit_breakdown" in data

def test_manager_employee_roster():
    res = client.get("/api/manager/employees")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_manager_employee_dossier():
    res = client.get("/api/manager/employees/EMP-1042")
    assert res.status_code == 200
    data = res.json()
    assert "employee_profile" in data
    assert "chronic_lung_risk" in data
    assert "shift_history" in data
