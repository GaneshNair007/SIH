# API Reference — H₂S Wristband & Monitoring Platform

**Base URL:** `http://127.0.0.1:8000/api` (or proxied via `/api` in Next.js)  
**Content-Type:** `application/json` (unless multipart/form-data for image uploads)

---

## 1. Authentication & Session

### `POST /api/auth/demo-login`
Instant 1-click login for demo / judging purposes.

- **Request Body:**
  ```json
  {
    "role": "manager",  // "employee" | "manager" | "hse_officer"
    "employee_id": "EMP-1042" // optional, defaults to EMP-1042 for employee
  }
  ```
- **Response `200 OK`:** Sets `rakshak_session` cookie.
  ```json
  {
    "authenticated": true,
    "role": "MANAGER",
    "user_id": "MGR-01",
    "employee_id": "MGR-01",
    "full_name": "Vikram Singh",
    "plant_unit": "Central Control Room",
    "active_badge_id": "MGR-MASTER",
    "is_demo": true
  }
  ```

### `POST /api/auth/login`
Standard credential authentication (prefixes map to demo roles).

- **Request Body:**
  ```json
  {
    "username": "mgr_vikram",
    "password": "password123"
  }
  ```
- **Response `200 OK`:** Sets `rakshak_session` cookie and returns user session object.

### `GET /api/auth/me`
Fetches current session info from `rakshak_session` cookie.

- **Response `200 OK`:** Session object.

### `POST /api/auth/logout`
Clears session cookie.

- **Response `200 OK`:**
  ```json
  {
    "authenticated": false,
    "message": "Logged out successfully"
  }
  ```

---

## 2. Shift Dosimetry & Scanning

### `POST /api/scan/start-shift`
Registers worker shift check-in and records baseline optical density.

- **Request Body:**
  ```json
  {
    "employee_id": "EMP-1042",
    "plant_unit": "CDU-1",
    "badge_id": "BAND-1042-01",
    "start_delta_e": 0.4,
    "band_lifecycle_day": 1
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "status": "ACTIVE_SHIFT_STARTED",
    "scan_id": "SCN-START-XXXXXX",
    "employee_id": "EMP-1042",
    "employee_name": "Rajesh Kumar",
    "plant_unit": "CDU-1",
    "start_delta_e": 0.4,
    "message": "Start-of-shift baseline ΔE 0.4 logged for Rajesh Kumar."
  }
  ```

### `POST /api/scan/analyze-image`
Analyzes uploaded or camera-captured wristband photo using OpenCV & Neural Network.

- **Request:** `multipart/form-data` with `file: <Image Binary>`
- **Response `200 OK`:**
  ```json
  {
    "status": "SUCCESS",
    "qr_detected": true,
    "qr_data": "EMP-1042:CDU-1:BAND-1042-01",
    "employee_id": "EMP-1042",
    "plant_unit": "CDU-1",
    "badge_id": "BAND-1042-01",
    "is_blue_dosimeter_strip": true,
    "quality_scorecard": {
      "brightness": 142.5,
      "contrast": 64.2,
      "glare_percentage": 1.2,
      "sharpness": 88.4,
      "passed": true
    },
    "optical_measurements": {
      "delta_e": 3.85,
      "patch_b_drift": 0.08,
      "patch_c_condition": "NORMAL"
    },
    "neural_net_prediction": {
      "predicted_exposure_seconds": 1824.5,
      "model": "3-layer MLP forward pass"
    }
  }
  ```

### `POST /api/scan/end-shift` (or `POST /api/scan/submit`)
Completes shift, performs differential calculations, updates ledger, generates RAG advisory.

- **Request Body:**
  ```json
  {
    "worker_id": "EMP-1042",
    "employee_id": "EMP-1042",
    "plant_unit": "CDU-1",
    "shift_duration_hours": 8.0,
    "badge_id": "BAND-1042-01",
    "band_lifecycle_day": 1,
    "start_delta_e": 0.4,
    "end_delta_e": 4.2,
    "patch_b_drift": 0.10,
    "patch_c_condition": "NORMAL"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "scan_id": "SCN-XXXXXXXX",
    "employee_id": "EMP-1042",
    "worker_id": "EMP-1042",
    "plant_unit": "CDU-1",
    "telemetry": {
      "temperature_c": 28.5,
      "relative_humidity_pct": 72.0,
      "source": "Open-Meteo"
    },
    "computed_metrics": {
      "net_delta_e": 3.75,
      "shift_dose_low_ppm_hr": 8.4,
      "shift_dose_high_ppm_hr": 10.2,
      "shift_dose_range_str": "8.4–10.2 ppm·h",
      "shift_twa_low_ppm": 1.05,
      "shift_twa_high_ppm": 1.28,
      "shift_twa_range_str": "1.1–1.3 ppm",
      "shift_hours": 8.0,
      "prior_7day_load_ppm_hr": 7.4,
      "updated_7day_load_low": 15.8,
      "updated_7day_load_high": 17.6,
      "updated_7day_range_str": "15.8–17.6 ppm·h",
      "statutory_tier": "TIER 2 (CAUTION)",
      "measurement_confidence": "HIGH",
      "badge_integrity_warning": null,
      "is_single_shift_critical": false
    },
    "advisory": {
      "summary_banner": "Shift completed with moderate cumulative exposure. Caution tier protocol engaged.",
      "triage_question": "Are you experiencing mild eye stinging or headache?",
      "recommendations": [
        {
          "priority_level": "[LOW / SELF-CARE]",
          "category": "Hydration & Rest",
          "action_item": "Rest in positive-pressure shelter and drink clean water."
        }
      ]
    }
  }
  ```

---

## 3. Manager & Control Room Endpoints

### `GET /api/manager/dashboard`
Returns high-level plant safety KPIs, active incident counts, and unit statistics.

### `GET /api/manager/employees`
Returns complete worker roster with rolling exposure values.

### `GET /api/manager/employees/{employee_id}` (or `GET /api/control-room/workers/{employee_id}`)
Returns full worker profile, health profile, PPE details, 90-day trajectory, and historical shift scans.

### `GET /api/manager/heatmap`
Returns 2D spatial fugitive leak triangulation points across plant units.

### `GET /api/manager/incidents`
Returns list of OISD incident reports triggered by Tier 3 events.

### `GET /api/manager/incident-pdf/{scan_id}`
Streams a formatted OISD-STD-105 Form-A compliance PDF.

---

## 4. Realtime Stream & AI Assistant

### `GET /api/realtime/stream`
Server-Sent Events (SSE) feed for live shift start, scan completion, and safety alerts.

### `POST /api/chat`
Conversational RAG AI Safety Assistant (Rakshak).
- **Request Body:** `{"session_id": "sess_123", "message": "What is my 7-day exposure range?"}`
- **Response `200 OK`:** AI response text with optional markdown recommendations.

### `POST /api/screener/neuro-test`
Evaluates olfactory fatigue and psychomotor reaction latency.

### `GET /api/employees/{employee_id}/lung-risk`
Calculates chronic lung risk index (0–100) based on cumulative load and health history.
