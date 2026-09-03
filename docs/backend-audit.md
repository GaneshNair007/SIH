# Backend Audit

## High-Level Architecture
- **Framework & Language:** Python 3 + FastAPI.
- **Database & ORM:** SQLite (via SQLAlchemy ORM).
- **Authentication Method:** Session-based (cookie `rakshak_session`) with 1-Click Demo Login (`/api/auth/demo-login`).
- **Real-Time Engine:** Server-Sent Events (SSE) via `event_bus.py` for live control room monitoring.
- **AI Integrations:** Vision scanner (`vision_scanner`), language model chatbot (`unified_chat`, `onboarding_manager`), and LLM-driven advisories.
- **Routing Structure:** A monolithic FastAPI application serving both HTML templates and REST APIs (`main.py`).

## Data Models and Relationships
1. **`EmployeeModel` (workers)**
   - Core entity representing an employee.
   - Relationships: `1:1` with `ExposureLedgerModel`, `1:N` with `ShiftScanModel`.
   - Fields: `worker_id`, `full_name`, `plant_unit`, `health_profile_json`, `ppe_details_json`.
2. **`ExposureLedgerModel` (exposure_ledgers)**
   - Rolling multi-window (7-day, 30-day, 90-day) exposure accumulator for each employee.
3. **`ShiftScanModel` (shift_scans)**
   - Records of active & completed differential shift dosimetry (badge data, environmental telemetry, computed metrics).
   - Relationship: `N:1` with `EmployeeModel`.
4. **`IncidentReportModel` (incident_reports)**
   - Statutory compliance incident records.
   - Relationship: `N:1` with `ShiftScanModel` and `EmployeeModel`.

## Authentication Flow
1. **Login:** A user calls `POST /api/auth/login` with their username. This acts as a wrapper that invokes `POST /api/auth/demo-login`.
2. **Demo Login:** Creates a session dict and sets it in the `rakshak_session` cookie (max_age 24 hours).
3. **Session Retrieval:** Protected routes rely on `GET /api/auth/me`, which parses the `rakshak_session` cookie and returns the active user context (defaults to an employee if no cookie is found).
4. **Logout:** `POST /api/auth/logout` deletes the `rakshak_session` cookie.

## Key APIs (Overview)
- **Auth:** `/api/auth/login`, `/api/auth/demo-login`, `/api/auth/me`, `/api/auth/logout`
- **Scans:** `/api/scan/start-shift`, `/api/scan/analyze-image`, `/api/scan/end-shift`
- **Dashboard:** `/api/manager/dashboard`, `/api/manager/employees`, `/api/manager/heatmap`, `/api/manager/incidents`
- **Reports:** `/api/manager/incident-pdf/{scan_id}`
- **Chatbot & Risk:** `/api/chat`, `/api/onboarding/chat`, `/api/employees/{employee_id}/lung-risk`
- **Live Event Stream:** `/api/realtime/stream`

## Recommendations / Proposed Changes
- The backend currently serves HTML templates for the frontend. We will decouple this by building a standalone Next.js frontend that communicates exclusively via the JSON API endpoints.
- No changes to core backend logic are strictly necessary. The API shapes are comprehensive.
