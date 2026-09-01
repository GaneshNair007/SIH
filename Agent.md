# 🛡️ Rakshak (रक्षक) — Project Architecture & Agent Specification

**Rakshak-H2S (रक्षक)** is an AI-powered Occupational Health & Safety Advisory and Plant Safety Intelligence platform designed for petroleum refinery workers (pilot: MRPL Mangalore) exposed to Hydrogen Sulfide ($H_2S$) using passive colorimetric dosimeter wristbands.

---

## 📌 MANDATORY MAINTENANCE RULE
> [!IMPORTANT]
> **Strict Agent & Developer Rule:**
> Whenever any update, change, enhancement, or bug fix is made to this codebase, it **MUST** be recorded in this `Agent.md` file under the specific feature name and in the [Change Log & Audit Trail](#-change-log--audit-trail) section. Every modification must document:
> 1. Feature Name
> 2. Specific Changes Made (files affected, equations/logic updated)
> 3. Date & Timestamp
> 4. Verification & Testing Status

---

## 🏗️ System Architecture & Engineering Principles

### 1. Zero-LLM Deterministic Dosimetry Math
* The LLM **never** calculates mathematical doses, TWAs, or assigns statutory risk tiers.
* All mathematical calculations are computed in pure Python prior to structured advisory generation.
* **No Fake Precision:** All doses and TWAs are presented strictly as **Low–High Uncertainty Ranges** (e.g. `12.1–14.8 ppm·h`, `1.5–1.9 ppm TWA`).

### 2. Differential Shift Evaluation (5-Day Band Lifecycle)
* The chemical strip's color darkening ($\Delta E$) is irreversible and cumulative across multiple shifts on a single physical band.
* The system evaluates the differential optical density:
  $$\Delta E_{\text{net}} = \max\left(0.0,\; \Delta E_{\text{end}} - \Delta E_{\text{start}} - \max(0.0, \Delta E_{\text{patch\_b\_drift}} - 0.05)\right)$$
* Nominal calibration curve:
  $$\text{Dose}_{\text{nominal}} = 2.15 \times \Delta E_{\text{net}} + 0.08 \times (\Delta E_{\text{net}}^{1.5})$$
* Uncertainty envelope dynamically adjusted ($\pm 10\%$ to $\pm 25\%$) based on Patch B drift and Patch C state.

### 3. Statutory Regulatory Tiers (Indian Refinery Compliance)
Evaluated deterministically against conservative uncertainty bounds:
* **TIER 1 (NORMAL):** $\text{TWA}_{\text{high}} < 1.0\text{ ppm}$ AND $\text{7-Day Load}_{\text{high}} < 15.0\text{ ppm}\cdot\text{hr}$
* **TIER 2 (CAUTION):** $1.0 \le \text{TWA}_{\text{high}} < 5.0\text{ ppm}$ OR $15.0 \le \text{7-Day Load}_{\text{high}} < 35.0\text{ ppm}\cdot\text{hr}$
* **TIER 3 (CRITICAL):** $\text{TWA}_{\text{high}} \ge 5.0\text{ ppm}$ OR $\text{7-Day Load}_{\text{high}} \ge 35.0\text{ ppm}\cdot\text{hr}$ OR $\text{Single-Shift Dose}_{\text{high}} > 20.0\text{ ppm}\cdot\text{hr}$

### 4. Ascending Priority Action Matrix
Every advisory itemizes actions strictly in ascending priority order:
1. `[LOW / SELF-CARE]` (Eye saline wash, rest in positive-pressure shelter, hydration)
2. `[RECOMMENDED / OPERATIONAL]` (Respirator cartridge swap, fit-test seal check, unit sniffer check, badge replacement)
3. `[MANDATORY / CLINICAL]` (Occupational Health Centre referral, SpO2, Spirometry, 48-hr sour unit stand-down)

### 5. Hard Tier 3 Safety Override Lock
* If Tier 3 is reached, the deterministic engine forces a mandatory OHC medical evaluation item, triggers supervisor OISD Form-A filing, and applies a 48-hour sour gas stand-down regardless of LLM response.

### 6. Corrective RAG (CRAG) with Static Protocol Fallback
* Hybrid Dense/Semantic + BM25 retriever queries OISD-STD-105/155/166, DGMS PME, ACGIH, and MRPL SOPs.
* If retrieval confidence score $< 0.85$ or if LLM service is offline, the system seamlessly uses the authoritative `backend/rag/static_protocol.py` table.

---

## 🚀 Feature Ledger

### Feature 1: AI Advisory Chatbot (Rakshak / रक्षक)
* **Route:** `/`
* **API:** `POST /api/chat`
* **Description:** Unified bilingual multi-turn conversational AI assistant for refinery workers.
* **Capabilities:**
  * Conversational shift badge intake (e.g. *"Shift ended, start reading 0.5, end reading 4.2 in CDU-1"*).
  * Returns structured status pill, dose uncertainty ranges, itemized ascending recommendations, and clinical triage check directly in the chat stream.
  * Multi-window exposure ledger inquiries (*"What is my 7-day exposure range?"*).
  * Patch B/C integrity checks (*"Run patch integrity check"*).
  * Bilingual toggle: Instant English $\leftrightarrow$ हिन्दी (Devanagari) switching.

### Feature 2: Differential Shift Dosimetry & Uncertainty Engine
* **Engine:** `backend/engine/statutory.py`, `backend/engine/ledger.py`
* **Description:** Calculates net optical change ($\Delta E_{\text{end}} - \Delta E_{\text{start}}$), applies measurement confidence envelopes, and manages rolling 7d, 30d, and 90d exposure load ranges in SQLite/PostgreSQL.

### Feature 3: Post-Scan Result & Interactive Advisory Drawer
* **Routes:** `/manager/scan`, `/scan`
* **API:** `POST /api/scan/submit`
* **Description:** Shift Manager input panel for logging worker shifts with immediate sliding Interactive Advisory & Triage Drawer displaying:
  * Low-high uncertainty ranges (`12.1–14.8 ppm·h`, `1.5–1.9 ppm`).
  * Badge integrity alerts (Patch B baseline drift & Patch C condition).
  * Contextual ambient telemetry banner.
  * Ascending priority recommendations with Hindi translations.
  * 1-Click OISD Form-A incident PDF generator.

### Feature 4: Control-Room Worker Profile Insights
* **Routes:** `/control-room/workers/{workerId}`, `/workers/{workerId}`
* **API:** `GET /api/control-room/workers/{workerId}`
* **Description:** Dedicated supervisory portal for plant safety officers providing:
  * Demographic and clinical baseline (FEV1/FVC spirometry, smoking pack-years, allergies).
  * Longitudinal multi-shift dosimeter logs across physical wristbands.
  * 90-Day predictive chronic occupational lung risk score ($0\text{--}100$).
  * Dedicated interactive **Ask Rakshak** query drawer for investigating individual worker health and exposure trends.

### Feature 5: Contextual Environmental Telemetry
* **Engine:** `backend/engine/weather.py`
* **Description:** Real-time atmospheric ingestion (Temperature, Relative Humidity, Pressure) from Open-Meteo (keyless, free default) with optional OpenWeatherMap / WeatherAPI / DCS endpoint configuration. Framed as contextual ambient telemetry.

### Feature 6: Specialized Safety Intelligence Modules
* **2D Fugitive Leak Triangulation (`backend/intelligence/leak_triangulation.py`):** Inverse Distance Weighting (IDW) spatial leak coordinate localization across refinery units (`/supervisor`).
* **Neuro-Olfactory Fatigue Screener (`backend/intelligence/neuro_screener.py`):** 30-second olfactory fatigue and psychomotor reaction latency evaluator (`/screener`).
* **Chronic Occupational Lung-Risk Score (`backend/intelligence/lung_risk.py`):** Multi-factor $0\text{--}100$ chronic respiratory risk index (`/lung-risk`).
* **1-Click OISD Form-A PDF Dossier (`backend/intelligence/incident_report.py`):** Printable compliance incident report generator via ReportLab (`/api/supervisor/incident-pdf/{scan_id}`).

### Feature 7: AI-Enabled Optical Badge Scanner & Neural Network Pipeline
* **Engine:** `backend/engine/vision_scanner.py`, `scanner backend/h2s_strip_model.json`
* **Description:** 
  1. **CIELAB Color Space Transformation:** High-precision sRGB $\to$ linear RGB $\to$ CIE XYZ $\to$ CIELAB ($L^*a^*b^*$).
  2. **Multi-Patch Segmentation:** Segments Patch A (Active Spot $\Delta E$ and orange area fraction), Patch B (Reference Blank Control drift $\Delta E_B$), and Patch C (Integrity Indicator condition).
  3. **Photo Quality Scorecard:** Real-time analysis of brightness, glare %, contrast, and edge sharpness.
  4. **3-Layer MLP Neural Network:** Pure Python/NumPy forward pass loader for `h2s_strip_model.json` (2 inputs $\to$ 12 ReLU $\to$ 6 ReLU $\to$ 1 Linear $\to 10^{\log_{10} s}$ predicted exposure duration) executing in $< 2\text{ ms}$.
  5. **Touchpoints:** Live HTML5 Camera Viewfinder with target alignment guide and photo dropzone on `/manager/scan` (`/scan`) + In-chat photo scanner button in Rakshak Chatbot (`/`).

---

## 📜 Change Log & Audit Trail

### [2026-09-01] — Initial Project Build: Rakshak AI Advisory Platform
* **Scope:** Created full FastAPI backend, SQLAlchemy database schema, deterministic kinetics & statutory engines, hybrid RAG retriever with OISD/DGMS/ACGIH corpus, Groq/Instructor structured output advisory agent, ReportLab PDF generator, leak triangulation, and full 6-view Jinja2 UI.
* **Tests:** 22 automated tests created and passing.

### [2026-09-01] — Unified Chatbot & Navigation Redesign
* **Scope:** Redesigned primary worker entrypoint (`/`) into a dedicated **Rakshak (रक्षक) AI Safety Chatbot**. Separated supervisory functions into the Manager Portal (`/manager`).
* **Backend:** Created `backend/agents/unified_chat.py` and connected `POST /api/chat`.
* **Tests:** 24 automated tests passing.

### [2026-09-01] — Spec Alignment: Uncertainty Ranges, Differential Evaluation, & Touchpoints
* **Scope:** Aligned codebase strictly with the engineering spec constraints:
  1. Replaced all single-number doses with **Low–High Dose Uncertainty Ranges** (e.g. `12.1–14.8 ppm·h`, `1.5–1.9 ppm TWA`).
  2. Implemented **Differential Shift Evaluation** ($\Delta E_{\text{end}} - \Delta E_{\text{start}}$) across 5-day wristband lifecycles.
  3. Reframed weather API data as **Contextual Environmental Telemetry**.
  4. Ingested **Patch B drift and Patch C condition** into deterministic confidence and LLM advisory prompts.
  5. Built the **Post-Scan Result Advisory Drawer** (`/manager/scan`) and **Control-Room Worker Profile Insights** (`/control-room/workers/{workerId}`).
* **Git:** Pushed to `origin/backend` (Commit `2e7d578`).
* **Tests:** 24/24 unit and integration tests passing.

### [2026-09-01] — Conversational Tone Refactor & Math Jargon Elimination
* **Feature:** Feature 1: AI Advisory Chatbot (Rakshak / रक्षक)
* **Scope:** 
  1. Eliminated technical engine mechanics and mathematical formulas (e.g. "using differential scan evaluation (Start vs End ΔE), uncertainty dose ranges, and Patch B/C integrity tracking") from chat dialogue.
  2. Replaced with natural, warm, empathetic safety advice focused on worker health, symptom checks, hydration, and immediate first-aid.
  3. Moved technical statistics and range numbers strictly to the structured UI badge cards rather than text lectures.
* **Files Modified:** `backend/agents/unified_chat.py`, `frontend/templates/index.html`, `Agent.md`.
* **Tests:** 24/24 unit and integration tests passing.

### [2026-09-01] — Groq LLM API Integration & Live Model Alignment
* **Feature:** Hybrid RAG & Zero-Hallucination LLM Structured Advisory
* **Scope:**
  1. Validated live Groq API key authentication and connection.
  2. Configured active model `qwen/qwen3.8-27b` with `instructor` structured Pydantic schema validation (`DosimeterAdvisoryPayload`).
  3. Added timeout (4.0s) and fast fallback to static protocol table in `backend/agents/advisory.py` for resilience.
* **Files Modified:** `backend/config.py`, `backend/agents/advisory.py`, `.env.example`, `Agent.md`.
* **Tests:** 24/24 unit and integration tests passing with live API calls.

### [2026-09-01] — AI-Enabled Optical Badge Scanner & Neural Network Integration
* **Feature:** Feature 7: AI Optical Badge Scanner & Neural Network Pipeline
* **Scope:**
  1. Built `backend/engine/vision_scanner.py` with pure NumPy CIELAB color space transformation, multi-patch segmentation (Patch A spot $\Delta E$, Patch B drift, Patch C integrity), and photo quality grading.
  2. Implemented zero-dependency forward pass for `backend/engine/h2s_strip_model.json` (3-layer MLP predicting exposure duration in $< 2\text{ ms}$).
  3. Added `POST /api/scan/analyze-image` endpoint.
  4. Added live HTML5 camera viewfinder, alignment overlay, dropzone, and AI optical scorecard to `/manager/scan`.
  5. Added camera/photo upload button in Rakshak Chatbot (`/`).
* **Files Created/Modified:** `backend/engine/vision_scanner.py`, `backend/engine/__init__.py`, `backend/main.py`, `frontend/templates/scan.html`, `frontend/templates/index.html`, `tests/test_vision_scanner.py`, `requirements.txt`, `Agent.md`.
* **Tests:** 30/30 unit and integration tests passing.

### [2026-09-01] — Codebase Cleanup & Obsolete Artifact Removal
* **Scope:**
  1. Consolidated production neural network weights to `backend/engine/h2s_strip_model.json`.
  2. Removed legacy training folder `scanner backend/` (synthetic dataset generator, CSV data, training scripts).
  3. Removed legacy unused frontend artifacts (`src/`, `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `.eslintrc.json`, `AGENT_BUILD_SPEC.md`).
* **Tests:** 30/30 unit and integration tests passing.

### [2026-09-01] — Complete Backend Architecture & 1-Click Demo Mode
* **Feature:** Core Architecture, Active Shift Lifecycle & Demo Mode
* **Scope:**
  1. **1-Click Demo Mode & Role Selector:** Built `/login` with 1-click demo buttons for judges (`Employee (EMP-1042 Rajesh Kumar)` and `Shift Manager (Vikram Singh)`).
  2. **Active Dual-Scan Shift Lifecycle:** Added `POST /api/scan/start-shift` for baseline check-in (marking shift `ACTIVE`) and `POST /api/scan/end-shift` for differential calculation, statutory tiering, and rolling ledger updates (marking shift `COMPLETED`).
  3. **Real-Time SSE Event Stream:** Implemented `GET /api/realtime/stream` broadcasting live scans and Tier 3 emergency alerts to manager dashboards.
  4. **Manager Control Room APIs:** Added `GET /api/manager/dashboard` (KPIs), `GET /api/manager/employees` (Roster), `GET /api/manager/employees/{id}` (Longitudinal Dossier & 90-day Trajectory), `GET /api/manager/heatmap`, and `GET /api/manager/incident-pdf/{id}`.
  5. **Auto-Seeded Database:** Pre-populated SQLite database on startup with refinery units (`CDU-1`, `CDU-2`, `DHDS`, `SRU`, `Tank Farm`), employees, ledgers, and initial shift records.
* **Files Modified/Created:** `backend/main.py`, `backend/database/models.py`, `backend/database/db.py`, `backend/engine/event_bus.py`, `backend/schemas/auth.py`, `backend/schemas/dosimetry.py`, `frontend/templates/login.html`, `frontend/templates/base.html`, `tests/test_demo_auth.py`, `tests/test_shift_lifecycle.py`, `Agent.md`.
* **Tests:** 40/40 unit and integration tests passing (100%).

### [2026-09-01] — Blue Dosimeter Strip Verification & QR Code Auto-Fill Pipeline
* **Feature:** Feature 7: AI Optical Badge Scanner & Neural Network Pipeline
* **Scope:**
  1. **Blue Substrate Verification (`verify_blue_strip_substrate`):** Implemented strict chromaticity and HSV/RGB blue wristband substrate validation ($H \in [85, 140]$, $S \ge 35$, $V \ge 30$, blue fraction $\ge 4.5\%$). Rejects human faces, skin, background rooms, walls, or random objects with a clear user prompt: *"❌ No valid Rakshak dosimeter strip detected. Please align the blue wristband within the camera guide."*
  2. **QR Code Employee Auto-Fill (`detect_qr_code` & `jsQR`):** Integrated both OpenCV backend `QRCodeDetector` and client-side `jsQR` real-time tracking in the live webcam stream. Automatically extracts `EMP-1042`, assigned unit `CDU-1`, and badge barcode `BAND-1042-01`, auto-populating form fields with zero latency.
  3. **Interactive Viewfinder Feedback:** Real-time canvas tracking in `frontend/templates/scan.html` with dynamic alignment guide ring: glows red/amber `🔴 ALIGN BLUE WRISTBAND` when only face/room is in frame, and turns glowing emerald/cyan `🟢 BLUE STRIP DETECTED (READY)` when the blue wristband is aligned.
  4. **Test Badge Generator Modal:** Added interactive **"🖨️ View / Test Sample Badge"** modal rendering a full blue wristband with QR code and reactive colorimetric spots for instant phone/screen webcam testing.
* **Files Modified:** `backend/engine/vision_scanner.py`, `backend/main.py`, `frontend/templates/scan.html`, `requirements.txt`, `tests/test_vision_scanner.py`, `Agent.md`.
* **Tests:** 42/42 unit and integration tests passing (100%).

### [2026-09-02] — Hot-Reload Watcher Isolation & Windows Console Signal Hardening
* **Feature:** Application Server & Dev Stability Infrastructure
* **Problem:** 
  1. On Windows, Uvicorn's default reloader (`BaseReload.restart`) calls `os.kill(self.process.pid, signal.CTRL_C_EVENT)`. Under the Win32 subsystem, `GenerateConsoleCtrlEvent(CTRL_C_EVENT, ...)` broadcasts `CTRL_C` to **all processes attached to the terminal/console**, causing the IDE extension host, language servers, and Antigravity AI Agent host to crash / restart whenever code is edited.
  2. Unconstrained root watching previously polled `venv/`, `.git/`, and `rakshak.db`, causing reload loops.
* **Scope:**
  1. **Console Signal Isolation (`run.py` & `venv/.../basereload.py`):** Eliminated `os.kill(pid, signal.CTRL_C_EVENT)` on Windows, replacing it with direct `process.terminate()` via Win32 `TerminateProcess`. This terminates only the child worker process and prevents broadcasting `CTRL_C` events to the terminal console group.
  2. **Hot-Reload Isolation (`run.py`):** Configured explicit `reload_dirs=["backend", "frontend"]`, `reload_includes=["*.py", "*.html", "*.css", "*.js", "*.json"]`, and `reload_excludes` to ignore all `.db`, `.db-journal`, `.db-wal`, `venv/`, `.git/`, `.pytest_cache/`, `*.md`, `*.log`, and temporary files. Added `reload_delay=0.5` debounce.
  3. **High-Performance Watcher (`watchfiles`):** Installed `watchfiles>=1.2.0` (Rust-based `notify` OS event listener) in `requirements.txt` and virtualenv to replace CPU-heavy `StatReload`.
  4. **SQLite WAL Mode & Concurrency (`backend/database/db.py`):** Added `timeout=30.0` and enabled SQLite `PRAGMA journal_mode=WAL` with `PRAGMA busy_timeout=30000` to prevent database lock contention during concurrent queries and server reloads.
  5. **FastAPI Lifespan Integration (`backend/main.py`):** Migrated database initialization from global module import time into `@asynccontextmanager` `lifespan(app: FastAPI)` so database schema operations occur cleanly on startup.
* **Files Modified:** `run.py`, `backend/main.py`, `backend/database/db.py`, `requirements.txt`, `venv/Lib/site-packages/uvicorn/supervisors/basereload.py`, `Agent.md`.
* **Tests:** 42/42 unit and integration tests passing (100%).

### [2026-09-02] — Marked.js Markdown Parser & Chat Bubble Typography
* **Feature:** Feature 1: AI Advisory Chatbot (Rakshak / रक्षक)
* **Problem:** Chatbot responses containing markdown syntax (`### Heading`, `* **Bold Item:**`, `**Text**`, `1. Step`) were being rendered as raw text strings without HTML parsing, causing raw symbols (`***`, `**`, `###`) to appear on screen.
* **Scope:**
  1. **Marked.js Integration (`frontend/templates/base.html` & `frontend/templates/index.html`):** Integrated `marked.js` library to parse markdown into structured, semantic HTML (`<h3>`, `<strong>`, `<ul><li>`, `<ol><li>`, `<p>`, `<code>`).
  2. **Chat Bubble Typography (`frontend/static/css/style.css`):** Added `.chat-markdown` styling rules for clean section headers, bold highlighting, bullet spacing, and code tags.
  3. **Fallback Parser:** Added regex fallback formatting in JavaScript if CDN is delayed.
* **Files Modified:** `frontend/templates/base.html`, `frontend/templates/index.html`, `frontend/static/css/style.css`, `Agent.md`.
* **Tests:** 42/42 unit and integration tests passing (100%).

---

## 🌐 API Endpoints & Routes Summary

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Rakshak AI Safety Chatbot Interface (Employee Portal) |
| `GET` | `/login` | Login Page with 1-Click Instant Demo Role Selectors |
| `POST` | `/api/auth/demo-login` | 1-Click Instant Demo Session Activation |
| `POST` | `/api/auth/login` | Standard credential authentication |
| `GET` | `/api/auth/me` | Current session / user info |
| `POST` | `/api/auth/logout` | Session clear / logout |
| `POST` | `/api/scan/start-shift` | Start-of-shift check-in & baseline optical logging |
| `POST` | `/api/scan/analyze-image` | Optical photo analysis, Blue Substrate verification, QR auto-fill & neural net |
| `POST` | `/api/scan/end-shift` | End-of-shift differential dosimetry calculation & advisory |
| `POST` | `/api/scan/submit` | Differential scan submission (backward-compatible) |
| `GET` | `/api/realtime/stream` | Server-Sent Events (SSE) live control room feed |
| `GET` | `/manager` or `/supervisor` | Shift Manager Control Room Interface |
| `GET` | `/api/manager/dashboard` | Plant safety KPIs, workforce totals & unit breakdown |
| `GET` | `/api/manager/employees` | Full employee roster with 7-day load ranges |
| `GET` | `/api/manager/employees/{id}` | Detailed employee dossier & 90-day trajectory |
| `GET` | `/manager/scan` or `/scan` | AI Optical Scanner Viewfinder & Interactive Triage Drawer |
| `GET` | `/api/manager/heatmap` | Spatial 2D fugitive leak interpolation coordinates |
| `GET` | `/api/manager/incident-pdf/{id}` | 1-Click downloadable OISD-STD-105 Form-A PDF |
| `POST` | `/api/chat` | Multi-turn conversational Rakshak AI safety chatbot |
| `POST` | `/api/screener/neuro-test` | Neuro-olfactory fatigue test endpoint |
| `GET` | `/api/employees/{id}/lung-risk` | Chronic lung risk score breakdown |
| `GET` | `/api/health` | System health check & Groq status |
