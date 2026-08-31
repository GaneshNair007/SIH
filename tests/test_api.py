import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Rakshak" in data["system"]

def test_unified_chat_endpoint():
    # Test conversational query
    res = client.post("/api/chat", json={"session_id": "test_sess_chat", "message": "What is the H2S limit under OISD?"})
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert "quick_actions" in data

    # Test conversational scan submission
    res_scan = client.post("/api/chat", json={"session_id": "test_sess_chat", "message": "Shift ended, delta E 4.2 in CDU-1"})
    assert res_scan.status_code == 200
    d_scan = res_scan.json()
    assert "scan_result" in d_scan
    assert d_scan["scan_result"]["tier"] in ["TIER 1 (NORMAL)", "TIER 2 (CAUTION)", "TIER 3 (CRITICAL)"]

def test_onboard_chat_flow():
    session_id = "test_sess_001"
    
    # Step 1: Language
    r1 = client.post("/api/onboard/chat", json={"session_id": session_id, "message": "English"})
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["current_step"] == "IDENTITY"
    
    # Step 2: Identity
    r2 = client.post("/api/onboard/chat", json={"session_id": session_id, "message": "Arjun Sharma, EMP-5050, 32 years, DHDS unit"})
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["current_step"] == "RESPIRATORY_HEALTH"

    # Step 3: Respiratory
    r3 = client.post("/api/onboard/chat", json={"session_id": session_id, "message": "No asthma, slight eye irritation occasionally"})
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["current_step"] == "SMOKING"

    # Step 4: Smoking
    r4 = client.post("/api/onboard/chat", json={"session_id": session_id, "message": "Non-smoker"})
    assert r4.status_code == 200
    d4 = r4.json()
    assert d4["current_step"] == "PPE_DETAILS"

    # Step 5: PPE
    r5 = client.post("/api/onboard/chat", json={"session_id": session_id, "message": "Half-mask, acid gas cartridge, fit test passed"})
    assert r5.status_code == 200
    d5 = r5.json()
    assert d5["current_step"] == "COMPLETED"
    assert d5["profile_completed"] is True
    assert d5["worker_profile"]["worker_id"] == "EMP-5050"

def test_submit_shift_scan():
    payload = {
        "worker_id": "EMP-1042",
        "plant_unit": "CDU-1",
        "shift_duration_hours": 8.0,
        "delta_e": 2.5
    }
    res = client.post("/api/scan/submit", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "scan_id" in data
    assert "computed_metrics" in data
    assert "advisory" in data
    assert len(data["advisory"]["recommendations"]) > 0

def test_supervisor_heatmap():
    res = client.get("/api/supervisor/heatmap")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "suspected_leak" in data
    assert len(data["nodes"]) > 0

def test_download_incident_pdf():
    # First submit a scan to have a scan_id
    scan_res = client.post("/api/scan/submit", json={
        "worker_id": "EMP-1042",
        "plant_unit": "SRU",
        "shift_duration_hours": 8.0,
        "delta_e": 16.0
    })
    scan_data = scan_res.json()
    scan_id = scan_data["scan_id"]

    pdf_res = client.get(f"/api/supervisor/incident-pdf/{scan_id}")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 500

def test_html_pages():
    routes = ["/", "/onboard", "/scan", "/supervisor", "/screener", "/lung-risk"]
    for r in routes:
        res = client.get(r)
        assert res.status_code == 200
        assert "RAKSHAK" in res.text or "Rakshak" in res.text

def test_neuro_screener_endpoint():
    payload = {
        "worker_id": "EMP-1042",
        "can_smell_rotten_egg": True,
        "eye_stinging_severity": 2,
        "headache_dizziness": True,
        "reflex_reaction_time_ms": 520
    }
    res = client.post("/api/screener/neuro-test", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["olfactory_fatigue_index"] > 50
    assert data["screening_status"] in ["HIGH_RISK_FATIGUE", "MODERATE_FATIGUE"]

def test_chronic_lung_risk_endpoint():
    res = client.get("/api/workers/EMP-1042/lung-risk")
    assert res.status_code == 200
    data = res.json()
    assert "chronic_lung_risk_score" in data
    assert 0.0 <= data["chronic_lung_risk_score"] <= 100.0
