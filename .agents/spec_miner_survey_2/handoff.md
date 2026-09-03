# Frontend Specification & Architectural Survey Handoff Report

**Agent**: Spec Miner 2  
**Date**: 2026-09-02  
**Target Project**: Passive H₂S Dose Wristband & Digital Monitoring Platform (`sih-1`)  
**Scope**: Frontend Architecture, Next.js / React setups, Tailwind tokens, Public Website (Home & 4-tab Pipeline), Protected Operational Workflows (Manager, Control Room, Employee), Dashboard Assistant, and Material Design 3 / Google-style Design System.

---

## 1. Observation

Direct file inspection of the workspace revealed the following configuration, codebase state, and documentation artifacts:

1. **Framework & Dependencies (`package.json`)**:
   - Next.js: `14.2.35` (App Router)
   - React & React-DOM: `^18`
   - Styling: Tailwind CSS `^3.4.1`, `postcss`, `autoprefixer`, `clsx`, `tailwind-merge`
   - State & Data: `@tanstack/react-query ^5.102.8`, `axios ^1.20.0`, `@supabase/supabase-js ^2.112.4`, `@supabase/ssr ^0.5.1`
   - Visualization & UI: `recharts ^3.10.1`, `lucide-react ^1.38.0`, `framer-motion ^13.1.1`, `sonner ^2.0.8`
   - Forms & Validation: `react-hook-form ^7.87.0`, `zod ^3.23.8`, `@hookform/resolvers ^3.9.0`
   - Test Infrastructure: `jest ^29.7.0`, `ts-jest ^29.2.5`, `@testing-library/react ^15.0.7`, `@testing-library/jest-dom ^6.5.0`

2. **Styling & Design Tokens (`tailwind.config.ts`, `globals.css`, `docs/design-system.md`)**:
   - **Primary Palette**: Google Blue (`#1a73e8`), Hover (`#174ea6`), Light tint (`#e8f0fe`)
   - **Surface & Backgrounds**: Page background (`#f8f9fa`), Surface/Card (`#ffffff`), Hover (`#f1f3f4`)
   - **Text Hierarchy**: High emphasis (`#202124`), Medium emphasis/Muted (`#5f6368`), Disabled (`#9aa0a6`)
   - **Semantic Safety Tiers**:
     - Safe / Tier 1 / Normal: Green (`#1e8e3e`, background `#e6f4ea`)
     - Caution / Tier 2 / Warning: Amber (`#f9ab00`, background `#fef7e0`)
     - Critical / Tier 3 / Breach: Red (`#d93025`, background `#fce8e6`)
   - **Elevation Shadows**:
     - `elevation-1`: `0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)`
     - `elevation-2`: `0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)`
     - `elevation-3`: `0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)`
   - **Typography**: Sans-serif (`Inter, Roboto, system-ui, sans-serif`).

3. **Public Assets (`public/`)**:
   - `public/ganesh_real.jpg`: Lead Engineer portrait (Ganesh Nair)
   - `public/arjit.jpg`: Core Developer portrait (Arjit Ujjawal)
   - `public/sumedh.png`: Core Developer portrait (Sumedh)
   - `public/hero.jpg.jpeg`: Hardware / concept hero graphic
   - `public/og.png`: OpenGraph social preview card

4. **Public Site Routes (`src/app/`)**:
   - `/` (`src/app/page.tsx`): Home page containing sticky navigation, hero section, system overview (Problem, Hardware, Software, Operational Purpose), Research Prototype notice banner, platform access cards, team grid with photos, and footer.
   - `/working` (`src/app/working/page.tsx`): 4-tab interactive pipeline (Flowchart with 8 operational stages and limitations, Images with layout diagrams and prototype notice, Chemistry with SbCl₃–Anthocyanin reaction mechanism and CIE76 $\Delta E$ formula, Comparison matrix with 4 benchmarked materials).
   - `/pipeline` (`src/app/pipeline/page.tsx`): Redirects immediately to `/working`.

5. **Operational Dashboard & Workflows (`src/app/`)**:
   - `/login` (`src/app/login/page.tsx`): Standard login + 1-click Quick Demo Access for `Shift Manager` and `Field Employee`.
   - `/dashboard` (`src/app/dashboard/page.tsx`): Safety dashboard showing 5 top KPIs (Active Employees, Shifts Logged, Tier 2, Tier 3, Open Incidents), Plant Unit Breakdown, and Recent Scans table with live polling.
   - `/scan` (`src/app/scan/page.tsx`): Dosimeter image capture/upload, optical density extraction ($\Delta E$, patch C condition, confidence score), and shift-end submission to ledger.
   - `/employees` (`src/app/employees/page.tsx`): Roster table with live search filtering, active badge ID, 7-day load badges, and links to employee profiles.
   - `/employees/[id]` (`src/app/employees/[id]/page.tsx`): Employee details, active badge metadata, 5-day lifecycle counter, and longitudinal shift history table.
   - `/incidents` (`src/app/incidents/page.tsx`): Incident log for Tier 3 breaches requiring OISD-STD-105 Form-A compliance with PDF download integration.
   - `/history` (`src/app/history/page.tsx`): Worker personal longitudinal dosimetry record ledger.

6. **Dashboard Assistant (`src/components/layout/AppShell.tsx`)**:
   - Floating action button in bottom right triggering a slide-over drawer (`AssistantDrawer`).
   - Guided Help fallback when live AI model is unconfigured with documented FAQs (Scanning guide, Invalid readings rationale, Band retirement criteria).

7. **Backend API Client Layer (`src/lib/api/`)**:
   - `client.ts`: Axios client configured with `baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"` and `withCredentials: true` (`rakshak_session` cookie).
   - `auth.ts`: `demoLogin`, `standardLogin`, `me`, `logout`.
   - `manager.ts`: `getDashboard`, `getEmployees`, `getEmployee`.
   - `scans.ts`: `analyzeImage`, `startShift`, `endShift`.

8. **Colorimetric & Science Engine (`src/lib/colorimetry.ts`)**:
   - RGB to linear RGB to CIE XYZ (D65 illuminant) to CIE $L^*a^*b^*$.
   - Euclidean CIE76 $\Delta E = \sqrt{(L_2-L_1)^2 + (a_2-a_1)^2 + (b_2-b_1)^2}$.
   - Piecewise linear calibration curve interpolation with confidence classification (`HIGH`, `MEDIUM`, `LOW`, `INVALID`) and saturation boundary checks.

---

## 2. Logic Chain

1. **Requirement Alignment (R1 - Frontend Architecture & Integration)**:
   - The workspace uses Next.js 14 App Router, React 18, and Tailwind CSS.
   - The backend API client in `src/lib/api/` matches FastAPI endpoints with proper cookie forwarding (`withCredentials: true`).
   - Query caching is implemented with TanStack React Query v5.

2. **Requirement Alignment (R2 - Public Website)**:
   - The Home page (`/`) fulfills all structural requirements: Hero, System Overview, Research Prototype limitation banner, Platform Access cards, and Team Showcase with authentic member portraits.
   - The Pipeline/Working page (`/working`) fulfills the 4 interactive tabs requirement (`flowchart`, `images`, `chemistry`, `comparison`), maintains query string state (`?tab=...`), and provides clear operational limitation notices.
   - Clean Material Design 3 / Google-style tokens are implemented consistently.

3. **Requirement Alignment (R3 - Protected Operational Workflows)**:
   - Role-based authentication routes users based on role (`MANAGER` / `HSE_OFFICER` $\to$ `/dashboard`, `WORKER` / `EMPLOYEE` $\to$ `/scan`).
   - The Manager workspace includes a scan-first workflow (`/scan`), workforce roster (`/employees`), profile deep-dive (`/employees/[id]`), safety dashboard (`/dashboard`), and statutory incident log (`/incidents`).
   - Exposure dose calculation communicates uncertainty via ranges and confidence levels rather than misleading single numbers.

4. **Requirement Alignment (R4 - Dashboard Assistant)**:
   - A floating action button opens a slide-out assistant drawer with a Guided Help fallback mode that serves approved static answers for scanning, invalid readings, and band replacement.

5. **Acceptance Criteria Verification**:
   - Route accessibility: All requested routes (`/`, `/working`, `/login`, `/dashboard`, `/employees`, `/scan`, `/incidents`, `/history`, and `/pipeline`) are defined and correctly mapped.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Public | Home Page (`/`) | Public introduction, system overview, team showcase, and platform entry point | HTTP GET `/` | HTML/React Page with hero, overview grid, team cards | Renders fallback initial if member image missing | `src/app/page.tsx`, `lib/content.ts` |
| 2 | Public | Pipeline / Working Page (`/working`) | 4-tab interactive explorer (Flowchart, Images, Chemistry, Comparison) | Tab selection, `?tab=` query param | Tab content panel, synced URL query state | Defaults to `flowchart` tab on invalid param | `src/app/working/page.tsx` |
| 3 | Public | Pipeline Redirect (`/pipeline`) | Route alias redirecting to `/working` | HTTP GET `/pipeline` | 307 Redirect to `/working` | N/A | `src/app/pipeline/page.tsx` |
| 4 | Auth | Standard Sign-In | Login via employee ID or username | Employee ID string (e.g. `EMP-1042`, `MGR-01`) | Session cookie & redirection | Displays red error banner on invalid credentials | `src/app/login/page.tsx`, `lib/api/auth.ts` |
| 5 | Auth | 1-Click Demo Login | Hackathon judge role switcher for Shift Manager & Employee | Role button click (`manager`, `employee`) | Authenticated session with demo persona | Displays error banner on network failure | `src/app/login/page.tsx`, `lib/api/auth.ts` |
| 6 | Auth | Session Verification | Auth context hook verifying session on app load | Cookie / API `/auth/me` | User profile & role state | Redirects unauthenticated users to `/login` | `src/context/AuthContext.tsx` |
| 7 | Manager | Safety Dashboard (`/dashboard`) | Plant-wide exposure KPIs, unit status breakdown, and recent scans table | Query params / Polling (15s) | KPI cards, Unit list, Recent scans table | Shows error notice if API connection fails | `src/app/dashboard/page.tsx`, `lib/api/manager.ts` |
| 8 | Manager | Scan Workflow (`/scan`) | Optical dosimeter image upload, patch gradient analysis, and ledger submission | Image file (camera/upload) | $\Delta E$, Patch C status, Confidence score, statutory tier | Rejects non-image files; displays error if analysis fails | `src/app/scan/page.tsx`, `lib/api/scans.ts` |
| 9 | Manager | Workforce Roster (`/employees`) | List of all monitored workers with search filtering and 7-day load badges | Text search query (name, ID, unit) | Filtered tabular workforce roster | Displays "No employees match your search" empty state | `src/app/employees/page.tsx`, `lib/api/manager.ts` |
| 10 | Manager | Worker Profile (`/employees/[id]`) | Detailed worker profile, active band metadata, lifecycle day, shift history | Route param `workerId` | Profile card & longitudinal shift table | Shows error card and link back to roster on failure | `src/app/employees/[id]/page.tsx` |
| 11 | Manager | Incident Log (`/incidents`) | Tier 3 critical exposure breaches requiring OISD-STD-105 Form-A filing | API `/manager/incidents` | Incident list with PDF download actions | Shows empty state if zero critical incidents exist | `src/app/incidents/page.tsx` |
| 12 | Worker | Exposure History (`/history`) | Worker's personal longitudinal exposure record | Authenticated worker ID | Table of historical shifts, TWA, and doses | Shows empty state if no prior shifts recorded | `src/app/history/page.tsx` |
| 13 | Assistant | Floating Assistant Drawer | Slide-over drawer with Guided Help fallback mode | Trigger click, topic selection | Accordion FAQ answers for field operations | Disables text input when live AI is unavailable | `src/components/layout/AppShell.tsx` |
| 14 | Science | CIE Lab Colorimetry Engine | Client-side sRGB $\to$ linear RGB $\to$ CIE XYZ $\to$ CIE $L^*a^*b^*$ conversion | RGB tuple `[r, g, b]` | `LabColor { l, a, b }` | Validates RGB range $[0, 255]$ | `src/lib/colorimetry.ts` |
| 15 | Science | $\Delta E$ Distance & Dose Interpolation | Calculates CIE76 $\Delta E$ and maps to calibration dose range ($ppm\cdot h$) | $\Delta E$ float, Calibration points | `{ minPpmH, maxPpmH, confidence, calibrated }` | Returns `NaN` / `INVALID` on negative or out-of-range $\Delta E$ | `src/lib/colorimetry.ts` |
| 16 | Design | Material 3 Design System | Google-style clean UI tokens, elevations, typography, and status badges | Tailwind classes (`.card`, `.btn-primary`, `.badge-...`) | Rendered enterprise-grade UI | N/A | `tailwind.config.ts`, `globals.css`, `docs/design-system.md` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Colorimetry Engine | Negative or `NaN` $\Delta E$ | Returns `{ minPpmH: NaN, maxPpmH: NaN, confidence: 'INVALID', calibrated: false }` without throwing. |
| 2 | Colorimetry Engine | $\Delta E$ exceeding maximum calibration point ($> 38.0$) | Returns upper bound range with `confidence: 'LOW'` and `outOfRange: true` instead of extrapolating invalid numbers. |
| 3 | Band Lifecycle | Compromised Patch C indicator (`COMPROMISED` or `EXPIRED`) | Immediately forces confidence to `INVALID`, flagging the reading and requiring badge replacement. |
| 4 | Working Page Tab Navigation | Invalid or unrecognized `?tab=unknown` query parameter | Falls back gracefully to `flowchart` default tab. |
| 5 | Workforce Search | Search query with no matching workers | Displays friendly empty state "No employees match your search." without crashing. |
| 6 | Unauthenticated Access | Direct URL navigation to protected route (`/dashboard`, `/employees`, `/scan`) | `AppShell` detects unauthenticated state and redirects to `/login`. |
| 7 | Guided Help Assistant | User attempts to submit arbitrary text query in Guided Help mode | Input is disabled with clear placeholder informing user that Guided Help mode uses static approved documentation. |

---

## 3. Caveats

1. **FastAPI Backend Liveness**: The frontend code is configured to connect to `http://localhost:8000/api`. If the FastAPI backend is not running during local evaluation, Next.js internal API routes (`/api/stats`, `/api/workers`, `/api/scans`, `/api/alerts`) and mock data fallback (`src/lib/mockStore.ts`) provide offline continuity.
2. **Team Member Photos**: Photos for Ganesh Nair (`ganesh_real.jpg`), Arjit Ujjawal (`arjit.jpg`), and Sumedh (`sumedh.png`) reside in `public/`. If loaded via external paths or if image loading fails, the UI renders initial-letter avatar fallbacks.
3. **Band Lifecycle 5-Day Threshold**: Physical band lifecycle is strictly capped at 5 working days per the chemical specification before requiring replacement.

---

## 4. Conclusion

The frontend specification for the H₂S Dose Wristband platform is fully comprehensive, well-structured, and ready for end-to-end integration and verification:
- **Routes**: All 8 user-facing routes (`/`, `/working`, `/login`, `/dashboard`, `/employees`, `/employees/[id]`, `/scan`, `/incidents`, `/history`) plus the `/pipeline` redirect are fully defined.
- **Public Experience**: Home page and the 4-tab Working page adhere to the Material Design 3 / Google-style design system with authentic team details and scientific disclosures.
- **Operational Workflows**: Shift Manager, Control Room, and Worker flows are cleanly separated, with scan-first capture, $\Delta E$ optical calculation, and exposure range tracking.
- **Safety Assistant**: Guided Help drawer is implemented with documented FAQ answers.

---

## 5. Verification Method

To independently verify the frontend specification and implementation:

1. **Verify Build & Typecheck**:
   ```bash
   npm run build
   ```
   *Expected result*: Next.js build succeeds with 0 errors across all App Router routes.

2. **Verify Route Inventory**:
   Run the development server (`npm run dev`) and navigate to each route:
   - `http://localhost:3000/` (Home page)
   - `http://localhost:3000/working` (4-tab pipeline)
   - `http://localhost:3000/pipeline` (Redirects to `/working`)
   - `http://localhost:3000/login` (Auth & 1-click Demo)
   - `http://localhost:3000/dashboard` (Manager Safety Dashboard)
   - `http://localhost:3000/employees` (Workforce Roster)
   - `http://localhost:3000/scan` (Optical Dosimeter Scan)
   - `http://localhost:3000/incidents` (Critical Incidents Log)
   - `http://localhost:3000/history` (Longitudinal Exposure History)

3. **Verify Colorimetry & Unit Tests**:
   ```bash
   npm test
   ```
   *Expected result*: Jest test suite passes for CIE Lab colorimetry, $\Delta E$ calculation, and component rendering.
