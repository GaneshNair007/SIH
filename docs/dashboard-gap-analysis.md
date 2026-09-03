# Dashboard & Workflow Gap Analysis

## Executive Summary
This document provides a gap analysis comparing the existing implementation in `sih-1` and `sih-backend` against the requirements in `h2s_platform_spec.md` and the user's handwritten sketch.

---

## 1. Route & Navigation Contracts
| Required Route | Current Status | Action / Fix Plan |
|---|---|---|
| `/` (Home) | Implemented (`src/app/page.tsx`) | Retain. Ensure header nav has links to Home, Pipeline, Login. |
| `/working` (Pipeline) | Implemented (`src/app/working/page.tsx`) | Retain with 4 tabs (Flowchart, Images, Chemistry, Comparison). |
| `/login` | Implemented (`src/app/login/page.tsx`) | Retain 1-Click Demo and standard login. |
| `/manager` | Missing (currently `/dashboard`) | Create `/manager/page.tsx` with scan-first workspace, summary metrics, and links. |
| `/workers/[workerId]` | Missing (currently `/employees/[id]`) | Create `/workers/[workerId]/page.tsx` with H₂S exposure graph, history, and chatbot drawer. |
| `/control-room` | Missing | Create `/control-room/page.tsx` overview page. |
| Top-bar Navigation | Partial | Add explicit Home (`/`), Pipeline (`/working`), Dashboard (`/manager`), and Logout links across all protected headers. |

---

## 2. Scanner & Band Resolution Flow
- **Spec Requirement:** Scanner card at top left of Manager workspace (`/manager`). On QR scan or manual input, calls backend to resolve worker/band ID. If valid, navigates to `/workers/[workerId]`.
- **Current State:** `/scan` exists as a standalone photo analysis page. `/dashboard` has no scanner card.
- **Fix Plan:** Add a prominent "Scan band / Quick Lookup" card at top-left of `/manager`. Wire manual entry and camera scanning to backend band lookup (`GET /api/manager/employees/{workerId}`) and navigate to `/workers/[workerId]`.

---

## 3. Worker Profile & H₂S Exposure Graph
- **Spec Requirement:** Profile page at `/workers/[workerId]` featuring:
  1. Worker header (name, ID, role, region, active badge).
  2. H₂S exposure graph with discrete readings/points (not continuous traces), daily/weekly/monthly toggles, units (ppm·h), and empty state.
  3. Context-aware chatbot drawer targeting `/api/chat` with "Guided Help" fallback.
  4. Shift history table, band history, and alert flags pulling from backend.
- **Current State:** `/employees/[id]/page.tsx` renders a basic profile table without a visual exposure chart or direct chatbot trigger.
- **Fix Plan:** Implement `/workers/[workerId]/page.tsx` using `recharts` to render a clean discrete point/line exposure graph. Connect to backend employee history API. Include docked chatbot drawer with worker-specific prompt suggestions.

---

## 4. Chatbot Integration
- **Backend Capability:** `POST /api/chat` exists in FastAPI (`main.py` lines 654-672) accepting `{ "session_id": string, "message": string }`.
- **Frontend Capability:** Currently uses static "Guided Help" mode.
- **Fix Plan:** Connect the assistant drawer in `AppShell` and Worker profile to hit `POST /api/chat` when available, falling back gracefully to Guided Help if model keys are unconfigured.

---

## 5. Summary of Files to Create / Modify
1. `docs/dashboard-gap-analysis.md` [NEW]
2. `src/components/layout/AppShell.tsx` [MODIFY] - Ensure top nav contains Home, Pipeline, Workspace, Logout.
3. `src/app/manager/page.tsx` [NEW] - Scan-first Shift Manager workspace with top-left scanner card.
4. `src/app/workers/[workerId]/page.tsx` [NEW] - Worker profile page with Recharts H₂S graph, shift history, and chatbot drawer.
5. `src/app/control-room/page.tsx` [NEW] - Control Room overview layout.
6. `docs/implementation-notes.md` [NEW] - Instructions on local execution, backend integrations, and demo vs production state.
