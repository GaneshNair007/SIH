import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_demo_login_employee():
    res = client.post("/api/auth/demo-login", json={"role": "employee", "employee_id": "EMP-1042"})
    assert res.status_code == 200
    data = res.json()
    assert data["authenticated"] is True
    assert data["role"] == "EMPLOYEE"
    assert data["employee_id"] == "EMP-1042"
    assert data["full_name"] == "Rajesh Kumar"

def test_demo_login_manager():
    res = client.post("/api/auth/demo-login", json={"role": "manager"})
    assert res.status_code == 200
    data = res.json()
    assert data["authenticated"] is True
    assert data["role"] == "MANAGER"
    assert data["user_id"] == "MGR-01"

def test_standard_login_fallback():
    res = client.post("/api/auth/login", json={"username": "manager_admin", "password": "password123"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "MANAGER"

def test_auth_me():
    res = client.get("/api/auth/me")
    assert res.status_code == 200
    data = res.json()
    assert data["authenticated"] is True
    assert "role" in data

def test_auth_logout():
    res = client.post("/api/auth/logout")
    assert res.status_code == 200
    data = res.json()
    assert data["authenticated"] is False
