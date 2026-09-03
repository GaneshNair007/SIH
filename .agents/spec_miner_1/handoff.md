# Handoff Report — Spec Miner 1 (Requirements & Specification Mining)

**Handoff Type:** Hard  
**Agent:** Spec Miner 1  
**Working Directory:** `C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\spec_miner_1`  
**Timestamp:** 2026-09-01T02:22:45Z  

---

## 1. Observation

Direct observations extracted from repository codebase and documentation:

1. **Original Request:** `ORIGINAL_REQUEST.md:8-11` specifies:
   - R1: Analyze existing specifications, docs, and README.md on main branch.
   - R2: Fresh Next.js 14 App Router project on `frontend` branch with Tailwind CSS, Framer Motion, TanStack Query.
   - R3: Backend integration with Supabase for workers, bands, daily exposures, real-time sync, and RLS.
   - R4: UI test suite (Jest / React Testing Library).

2. **README & Core Concepts:** `README.md:1-17, 33-40` confirms:
   - Platform name: "H₂S Monitor Platform".
   - Passive cumulative Hydrogen Sulfide exposure tracking using colorimetric wristbands over a 5-working-day maximum lifecycle.
   - Range-based exposure (e.g. `4.8–6.2 ppm•h`) instead of single scalar numbers.
   - Measurement confidence scoring: `HIGH`, `MEDIUM`, `LOW`, `INVALID`.
   - Core routes: `/` (Home), `/readme` (How it works & Why we are better), `/login` (Login with Demo shortcuts), `/manager` (Manager Dashboard), `/worker` (Worker Dashboard), `/control-room` (Control Room).

3. **Chemistry & Sensing Specifications:** `docs/H2S_Wristband_SbCl3_Anthocyanin_Complete.md:9-14, 29-36, 215-220, 227-234, 281-304, 309-332` defines:
   - Sensing formula: $0.5\text{ wt\% }\text{SbCl}_3 + 4\text{ wt\% purple-cabbage anthocyanin extract}$ on $2\times 5\text{ cm}$ filter paper ($1.0\text{ mL}$ coating).
   - Detection limit: $200\text{ ppb}$; useful concentration range: $1–10\text{ ppm}$.
   - Color calculation: Euclidean $\Delta E = \sqrt{(\Delta L^*)^2 + (\Delta a^*)^2 + (\Delta b^*)^2}$ in CIE Lab color space.
   - Reference scale on band: $0\ |\ 10\ |\ 30\ |\ 60\ |\ 120$ Exposure Index.
   - QR payload fields: Device ID, Batch ID, Manufacture date, Expiry date, Formulation, Calibration version.
   - Expiry indicator: Separate 7-day chemical expiry patch combined with authoritative QR expiry date.

4. **Database Schema & Relational Structure:** `supabase/migrations/20260901000000_initial_schema.sql:4-205` establishes 10 core tables:
   - `companies` (id, name, code)
   - `users` (id references auth.users, company_id, email, name, role `['SHIFT_MANAGER', 'CONTROL_ROOM_MANAGER', 'WORKER', 'ADMIN']`)
   - `workers` (id, company_id, worker_code, full_name, employee_hr_id, phone, email, department, designation, status)
   - `bands` (id, company_id, band_code, worker_id, batch_id, qr_payload, issued_at, status `['UNREGISTERED', 'REGISTERED', 'ACTIVE', 'WARNING', 'RETIRED', 'EXPIRED', 'COMPROMISED']`, working_day_count, current_cumulative_low, current_cumulative_high, current_confidence)
   - `shifts` (id, company_id, worker_id, band_id, manager_user_id, started_at, ended_at, status `['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']`, working_day_index, exposure_low, exposure_high, confidence)
   - `readings` (id, company_id, worker_id, band_id, shift_id, reading_type `['START', 'END']`, patch_a_rgb, patch_b_rgb, patch_c_rgb, patch_a_lab, patch_b_lab, patch_c_lab, delta_e, patch_c_status, measurement_status, confidence `['HIGH', 'MEDIUM', 'LOW', 'INVALID']`, dose_low_ppm_h, dose_high_ppm_h, saturation_detected, out_of_range)
   - `exposure_daily` (id, company_id, worker_id, date, exposure_low_ppm_h, exposure_high_ppm_h, reading_count, shift_count, high_event_count, critical_event_count, UNIQUE(company_id, worker_id, date))
   - `alerts` (id, company_id, worker_id, band_id, severity `['NORMAL', 'ELEVATED', 'HIGH', 'CRITICAL']`, status `['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ESCALATED']`, requires_ack, requires_action)
   - `calibration_versions` & `calibration_points`
   - RPC functions: `get_manager_stats(company_id UUID)` and `get_worker_exposure(target_worker_id UUID)`.
   - Complete Row-Level Security (RLS) enforcing company-level isolation (`get_auth_company_id()`).

5. **Existing Frontend Implementation:** `src/app/` pages:
   - `src/app/page.tsx`: Landing page with Hero, Mission, 3-pillar feature cards, and Meet the Team grid.
   - `src/app/readme/page.tsx`: 5-step workflow architecture and comparative feature table.
   - `src/app/login/page.tsx`: Supabase email/password login and Demo Mode toggle shortcuts.
   - `src/app/manager/page.tsx`: Workforce viewer table and React Hook Form + Zod worker registration modal.
   - `src/app/worker/page.tsx`: Live shift badge, 4 cumulative metrics (Today, Week, Month, Lifetime), Current Band card (working day $3/5$), and Supabase Realtime channel subscription.
   - `src/app/control-room/page.tsx`: Metric cards and Recharts plant-wide exposure trend line chart.

---

## 2. Logic Chain

1. From `docs/H2S_Wristband_SbCl3_Anthocyanin_Complete.md`, we know the platform's physical measurement model is based on optical color change ($\Delta E$) across SbCl₃/anthocyanin patches responding to $\text{H}_2\text{S}$ gas down to $200\text{ ppb}$.
2. From `supabase/migrations/20260901000000_initial_schema.sql`, we observe that each shift consists of two readings (`START` and `END`). The difference in patch color coordinates produces $\Delta E$, which is mapped via `calibration_points` into dose ranges `[dose_low_ppm_h, dose_high_ppm_h]`.
3. The dose calculated per shift is aggregated into `exposure_daily` and surfaced to workers via `get_worker_exposure` RPC and Supabase Realtime WebSocket listeners.
4. If calculated exposure exceeds normal limits or patch saturation occurs, records are logged in `alerts` with appropriate severity (`NORMAL`, `ELEVATED`, `HIGH`, `CRITICAL`), notifying the Shift Manager and Control Room Manager.
5. In addition to active exposure tracking, the 5-working-day patch lifecycle and 7-day chemical expiry patch are enforced to retire degraded wristbands before data integrity is compromised.

---

## 3. Caveats

- The current repository on `main` contains a prototype implementation with both mock and live Supabase hooks.
- As required by `ORIGINAL_REQUEST.md`, the new frontend implementation must be built cleanly on the `frontend` branch with complete Next.js 14 App Router, Tailwind CSS, Framer Motion, TanStack Query, and an accompanying Jest / React Testing Library suite.
- Mobile camera hardware capture is represented as an image/optical reading pipeline with JSONB patch color coordinates and confidence indicators.

---

## 4. Conclusion

All functional requirements, scientific models, thresholds, database schemas, user roles, telemetry pipelines, and UI/UX specifications have been thoroughly investigated, mined, and documented in `spec_report.md`. The design is fully specified and ready for the Orchestrator and Implementation team to execute on the `frontend` branch.

---

## 5. Verification Method

To verify findings:
1. Inspect `spec_report.md` at `C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\spec_miner_1\spec_report.md`.
2. Cross-check database definitions against `C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\supabase\migrations\20260901000000_initial_schema.sql`.
3. Cross-check chemical and optical formulas against `C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\docs\H2S_Wristband_SbCl3_Anthocyanin_Complete.md`.
4. Validate page routes and UI flows against `C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\src\app\`.
