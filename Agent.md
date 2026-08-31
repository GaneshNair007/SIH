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

---

## 🌐 API Endpoints & Routes Summary

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Rakshak AI Safety Chatbot Interface |
| `POST` | `/api/chat` | Unified multi-turn conversational chat endpoint |
| `GET` | `/manager/scan` or `/scan` | Differential scan submission & interactive triage drawer |
| `POST` | `/api/scan/submit` | Differential scan processing with uncertainty range output |
| `GET` | `/control-room/workers/{id}` | Worker profile insights & longitudinal history |
| `GET` | `/api/control-room/workers/{id}` | JSON payload for worker profile & 90-day lung risk |
| `GET` | `/manager` or `/supervisor` | Shift supervisor portal with 2D leak heatmap |
| `GET` | `/api/supervisor/heatmap` | Spatial 2D fugitive leak interpolation coordinates |
| `GET` | `/api/supervisor/incident-pdf/{id}` | 1-Click downloadable OISD-STD-105 Form-A PDF |
| `POST` | `/api/screener/neuro-test` | Neuro-olfactory fatigue test endpoint |
| `GET` | `/api/workers/{id}/lung-risk` | Chronic lung risk score breakdown |
| `GET` | `/api/health` | System health check & Groq configuration status |
