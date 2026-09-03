# API Reference

## Base URL
All API endpoints are prefixed with `/api`. Assuming the backend runs locally on port 8000: `http://localhost:8000/api`.

---

## 1. Authentication
### `POST /api/auth/demo-login`
Authenticates a user via demo mode.
- **Payload:** `{ "role": "manager" | "hse_officer" | "employee", "employee_id": "EMP-1042" }`
- **Response:** Sets `rakshak_session` cookie. Returns JSON session data.

### `POST /api/auth/login`
Standard login wrapper.
- **Payload:** `{ "username": "MGR-01", "password": "..." }`
- **Response:** Maps to demo session based on username keyword (`mgr`, `hse`, `EMP-`). Sets cookie.

### `GET /api/auth/me`
Retrieves the current authenticated session.
- **Response:** Session JSON. Defaults to "Rajesh Kumar" if no cookie is set.

### `POST /api/auth/logout`
Logs the user out.
- **Response:** `{ "authenticated": false, "message": "Logged out successfully" }` (Clears cookie).

---

## 2. Shift Scanning
### `POST /api/scan/start-shift`
Starts a new shift and logs baseline ΔE.
- **Payload:** 
  ```json
  {
    "employee_id": "EMP-1042",
    "plant_unit": "CDU-1",
    "badge_id": "BAND-1042-01",
    "band_lifecycle_day": 1,
    "start_delta_e": 0.0
  }
  ```
- **Response:** `200 OK` with `scan_id` and confirmation message.

### `POST /api/scan/analyze-image` (Multipart Form)
Analyzes an uploaded dosimeter image.
- **Body:** `multipart/form-data` containing `file` (image).
- **Response:** Visual analysis result including patch data and AI decoding.

### `POST /api/scan/end-shift` (or `/api/scan/submit`)
Ends a shift, calculates differential exposure, and updates ledgers.
- **Payload:**
  ```json
  {
    "worker_id": "EMP-1042",
    "plant_unit": "CDU-1",
    "shift_duration_hours": 8.0,
    "badge_id": "BAND-1042-01",
    "band_lifecycle_day": 1,
    "start_delta_e": 0.0,
    "end_delta_e": 4.2,
    "patch_b_drift": 0.10,
    "patch_c_condition": "NORMAL"
  }
  ```
- **Response:** Full dosimetry report including telemetry, computed metrics, and advisory.

---

## 3. Manager & Analytics
### `GET /api/manager/dashboard`
Fetches aggregate KPIs for the control room.
- **Response:** Object containing `workforce_kpis`, `unit_breakdown`, and `recent_scans`.

### `GET /api/manager/employees`
Lists all employees.
- **Response:** Array of employee profile objects.

### `GET /api/manager/employees/{employee_id}`
Detailed employee insights, shift history, and trajectory.
- **Response:** Employee dossier, recent scans, and lung risk profile.

### `GET /api/manager/heatmap`
Returns 2D spatial fugitive leak triangulation coordinates.
- **Response:** Array of heatmap data points.

### `GET /api/manager/incidents`
Lists statutory compliance incident records (Tier 3 critical breaches).
- **Response:** Array of incident objects.

### `GET /api/manager/incident-pdf/{scan_id}`
Downloads OISD-STD-105 Form-A PDF for a given incident.
- **Response:** `application/pdf` binary stream.

---

## 4. Live Events
### `GET /api/realtime/stream`
Server-Sent Events (SSE) connection for live updates.
- **Events emitted:** `shift_started`, `scan_completed`.

---

## 5. Chat & Risk Advisory
### `POST /api/chat`
Multi-turn conversational chatbot.
- **Payload:** `{ "session_id": "string", "message": "string" }`
- **Response:** AI reply.

### `GET /api/employees/{employee_id}/lung-risk`
Calculates chronic occupational lung-risk index.
- **Response:** JSON with lung risk metrics.
