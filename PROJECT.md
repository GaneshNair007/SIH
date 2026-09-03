# Project: Passive H₂S Wristband & Digital Monitoring Platform

## Architecture
The platform is an industrial safety monitoring system combining passive colorimetric chemical dosimeters (SbCl₃–Anthocyanin reaction matrix) with a modern web dashboard. The system features a public-facing informational portal and role-based operational workspaces (Shift Manager, Control Room, Employee) integrated with a Python FastAPI backend.

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS (Material Design 3 / Google-style tokens)
- **Data & State**: TanStack React Query v5 + Axios Client Layer + Reactive Offline Relational MockStore (`h2s_store_updated` events)
- **Backend Bridge**: Dual-mode FastAPI client with cookie-based auth (`rakshak_session`) and offline continuity
- **Science Engine**: CIELAB D65 color space conversion + CIE76 Euclidean $\Delta E$ + piecewise linear exposure dose range interpolation + statutory safety tier classification (OISD-STD-105 / DGMS)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Quality Gates & Build Cleanliness | Clean build/lint/typecheck pass with zero errors (`npm run build`, `npm run lint`) | M1 | Survey (Explorer 3) |
| 2 | Auth Test Suite Alignment | Fix `src/__tests__/auth.test.tsx` and `AuthContext.tsx` exports to achieve 100% test pass | M1 | Survey (Explorer 3) |
| 3 | Public Home Page (`/`) | Hero, 4-pillar overview (Problem, Hardware, Software, Purpose), prototype notice, access cards, team grid | M2 | Survey (Spec Miner 2) |
| 4 | Interactive Pipeline (`/working`) | 4 interactive tabs (Flowchart, Images, Chemistry, Comparison) with `?tab=` URL state | M2 | Survey (Spec Miner 2) |
| 5 | Pipeline Route Alias (`/pipeline`) | 307 server redirect to `/working` | M2 | Survey (Spec Miner 2) |
| 6 | Material Design 3 Design System | Google Blue `#1a73e8`, elevation shadows, high-contrast typography, status badges | M2 | Survey (Spec Miner 2) |
| 7 | Full Backend API Client Layer | Complete wrappers for all 20 FastAPI endpoints in `src/lib/api/` (SSE, heatmap, incidents, chat, screener, lung-risk) | M3 | Survey (Spec Miner 1) |
| 8 | SSE Real-Time Event Stream | Hook for live check-in and scan event streaming (`/api/realtime/stream`) | M3 | Survey (Spec Miner 1) |
| 9 | Dual-Mode Authentication (`/login`) | Standard credential login + 1-click Demo quick access for Manager & Employee | M4 | Survey (Spec Miner 2) |
| 10 | Shift Manager Safety Dashboard (`/dashboard`) | 5 KPI metrics, Plant Unit Breakdown, Recent Scans table with live polling | M4 | Survey (Spec Miner 2) |
| 11 | Scan-First Stepper Workflow (`/scan`) | 8-step dosimeter optical capture, multi-patch analysis ($\Delta E$), confidence grading, submission | M4 | Survey (Spec Miner 2) |
| 12 | Workforce Roster (`/employees`) | Searchable employee table with active badge IDs and 7-day cumulative load badges | M4 | Survey (Spec Miner 2) |
| 13 | Worker Dossier (`/employees/[id]`) | Employee profile, active badge metadata, 5-day lifecycle counter, longitudinal shift table | M4 | Survey (Spec Miner 2) |
| 14 | Incident Log & PDF Report (`/incidents`) | Tier 3 statutory breach table with OISD-STD-105 Form-A PDF download integration | M4 | Survey (Spec Miner 1, 2) |
| 15 | Personal Exposure History (`/history`) | Worker longitudinal ledger with shift timestamps, TWA, dose ranges, and statutory tiers | M4 | Survey (Spec Miner 2) |
| 16 | Dashboard Assistant Drawer | Slide-over drawer with Guided Help fallback mode serving 6 verified operational FAQs | M4 | Survey (Spec Miner 2, Explorer 3) |
| 17 | CIELAB Colorimetry & Dose Engine | D65 illuminant conversion, CIE76 $\Delta E$, confidence classification, saturation clamping | M4 | Survey (Spec Miner 1, 2) |
| 18 | E2E System Test Suite & Adversarial Hardening | Comprehensive 4-tier test coverage + Tier 5 adversarial stress testing | M5 | Survey (Project Pattern) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Quality Gates & Type Cleanliness | Fix ESLint issues, align AuthContext tests, achieve clean `npm run build` and `npm test` pass | none | DONE |
| M2 | Public Website & Science Pipeline | Polish `/`, `/working` (4 tabs), `/pipeline`, verify team showcase & MD3 design tokens | M1 | PLANNED |
| M3 | Backend API Bridge & Live Streaming | Implement complete FastAPI client wrappers (`src/lib/api/`) with offline mock fallback | M1 | PLANNED |
| M4 | Protected Operational Workflows | Polish `/login`, `/dashboard`, `/scan`, `/employees`, `/employees/[id]`, `/incidents`, `/history`, and `AssistantDrawer` | M2, M3 | PLANNED |
| M5 | E2E Testing Pass & Adversarial Hardening | Pass 100% of E2E test suite (Tiers 1-4) and Tier 5 adversarial coverage hardening | M4 | PLANNED |

## Interface Contracts
### Frontend API Layer (`src/lib/api/`) ↔ FastAPI Backend (`http://localhost:8000/api`)
- **Authentication**: `POST /api/auth/demo-login`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`. Session stored via `rakshak_session` HTTP-only cookie.
- **Scanning**:
  - `POST /api/scan/start-shift`: `{ employee_id, plant_unit, badge_id, start_delta_e, band_lifecycle_day }`
  - `POST /api/scan/analyze-image`: Multipart image file upload $\to$ `{ success, delta_e, patch_b_drift, patch_c_condition, confidence, ... }`
  - `POST /api/scan/end-shift`: `{ worker_id, plant_unit, shift_duration_hours, badge_id, band_lifecycle_day, start_delta_e, end_delta_e, ... }`
- **Manager & HSE**:
  - `GET /api/manager/dashboard`: Returns KPI object + unit breakdown + recent scans.
  - `GET /api/manager/employees`: Returns array of employee records.
  - `GET /api/manager/employees/{id}`: Returns worker dossier with shift history.
  - `GET /api/manager/incidents`: Returns array of incident reports.
  - `GET /api/manager/incident-pdf/{scan_id}`: Binary PDF download.
  - `GET /api/manager/heatmap`: 2D spatial triangulation nodes.
- **Real-Time Stream**: `GET /api/realtime/stream` (SSE EventSource).
- **AI Chat & Intelligence**: `POST /api/chat`, `POST /api/screener/neuro-test`, `GET /api/employees/{id}/lung-risk`.

### Auth Context Contract (`src/context/AuthContext.tsx`)
- Exports: `useAuth()`, `AuthProvider`, `getDemoUser(role)`, `getDefaultRoute(role)`, `isDemo(user)`, `login(user)`.
- State: `{ user: UserProfile | null, loading: boolean, login: Function, logout: Function, demoLogin: Function }`.

## Code Layout
```
src/
├── app/
│   ├── layout.tsx              # Root HTML wrapper with providers & AppShell
│   ├── page.tsx                # Public Landing Page (/)
│   ├── working/page.tsx        # Science Pipeline 4-Tab Page (/working)
│   ├── pipeline/page.tsx       # Redirect to /working (/pipeline)
│   ├── login/page.tsx          # Dual-Mode Authentication (/login)
│   ├── dashboard/page.tsx      # Manager Safety Dashboard (/dashboard)
│   ├── employees/page.tsx      # Workforce Roster (/employees)
│   ├── employees/[id]/page.tsx # Worker Dossier (/employees/[id])
│   ├── scan/page.tsx           # Optical Dosimeter Scan Stepper (/scan)
│   ├── incidents/page.tsx      # Critical Incidents Log (/incidents)
│   ├── history/page.tsx        # Personal Exposure History (/history)
│   └── api/                    # Next.js Server Route Handlers
├── components/
│   ├── layout/                 # AppShell, Navbar, Footer, AssistantDrawer
│   ├── ui/                     # Reusable UI primitives (Button, Card, Badge, Modal)
│   ├── public/                 # Home, Flowchart, Chemistry, Image, Comparison components
│   ├── dashboard/              # KPI Cards, Plant Breakdown, Recent Scans, Heatmap
│   └── scan/                   # ScanWorkflow, PatchSampler, OpticalPreview
├── context/                    # AuthContext, ThemeContext, RealtimeContext
├── lib/
│   ├── api/                    # client.ts, auth.ts, manager.ts, scans.ts, intelligence.ts
│   ├── colorimetry.ts          # CIELAB & ΔE calculation engine
│   ├── dataService.ts          # Unified data access layer
│   ├── mockStore.ts            # Reactive in-memory state store with event bus
│   └── types.ts                # Shared TypeScript interface definitions
└── __tests__/                  # Unit, integration, and adversarial test suites
```
