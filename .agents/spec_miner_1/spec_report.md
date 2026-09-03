# Comprehensive Specification Report — H₂S Industrial Safety & Exposure Monitoring Platform

**Document Version:** 1.0.0  
**Author:** Spec Miner 1 (Requirements & Spec Miner)  
**Date:** 2026-09-01  
**Project:** H₂S Monitor Platform (SIH-1)

---

## 1. Executive Summary & Problem Space

Hydrogen Sulfide ($\text{H}_2\text{S}$) is a highly toxic, corrosive, and flammable gas commonly encountered in oil and gas refineries, wastewater treatment facilities, chemical processing plants, and mining operations. Traditional electronic personal gas detectors have major drawbacks for large-scale enterprise deployments:
- Prohibitive unit and maintenance costs ($500–$1,500+ per worker).
- Frequent sensor poisoning, calibration drift, and required daily bump testing.
- Poor tracking of long-term chronic, low-level cumulative exposure across changing workforces and temporary contractors.
- Unrealistic single-number precision that masks measurement uncertainty.

The **H₂S Monitor Platform** bridges chemistry and software by leveraging passive colorimetric wristbands (SbCl₃ + anthocyanin indicators) that absorb $\text{H}_2\text{S}$ over a 5-working-day lifecycle. By capturing optical band readings via standard smartphone cameras at shift start and shift end, the platform computes time-integrated cumulative exposure ranges (ppm·h) and confidence levels, logging continuous worker safety profiles into a secure, multi-tenant cloud database (Supabase/PostgreSQL).

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Chemistry & Sensing | Passive Colorimetric Detection | SbCl₃ + Anthocyanin indicator patch reacts optically to ambient $\text{H}_2\text{S}$ gas | Ambient $\text{H}_2\text{S}$ gas over time (1–10 ppm range, 200 ppb limit) | Colorimetric shift from purple/extract baseline to darkened coordination complex | Chemical saturation if exposure exceeds dynamic range | `docs/H2S_Wristband_SbCl3_Anthocyanin_Complete.md` |
| 2 | Optical Processing | CIE Lab $\Delta E$ Calculation | Calculates Euclidean color distance $\Delta E = \sqrt{(\Delta L^*)^2 + (\Delta a^*)^2 + (\Delta b^*)^2}$ between baseline and exposed patches | Patch RGB/Lab values before and after shift | $\Delta E$ scalar value | Rejects invalid lighting or glare with `INVALID` confidence | `docs/H2S_Wristband_SbCl3_Anthocyanin_Complete.md`, `readings` table |
| 3 | Exposure Calculation | Range-Based Dose Estimation | Converts $\Delta E$ into scientific exposure interval $[\text{Dose}_{\text{low}}, \text{Dose}_{\text{high}}]$ (ppm·h) via calibration curve | Start & End Shift Readings, Calibration Points | Dose interval in ppm·h (e.g. 4.8–6.2 ppm·h) | Out-of-range flag and fallback confidence degradation | `README.md`, `shifts` & `readings` tables |
| 4 | Data Integrity | Measurement Confidence Scoring | Evaluates lighting, patch condition, and delta consistency to assign confidence level | Image data, patch status, delta consistency | Confidence enum (`HIGH`, `MEDIUM`, `LOW`, `INVALID`) | `INVALID` marks reading unusable and alerts manager | `README.md`, `readings` schema |
| 5 | Band Lifecycle | 5-Day Active Working Lifecycle | Enforces maximum 5-working-day operational limit on active reactive patches | Band working day index (1 to 5) | Active status, day count counter, retirement prompt | Transitions band status to `RETIRED` or `EXPIRED` | `README.md`, `bands` table |
| 6 | Expiry System | 7-Day Chemical Expiry Patch | Dual expiry verification combining physical visual patch indicator and digital QR expiry date | Chemical patch C color state, QR encoded date | Visual color status, app expiry validation | Flagged as `EXPIRED` if past date or patch C triggers | `docs/H2S_Wristband_SbCl3_Anthocyanin_Complete.md`, `readings.patch_c_status` |
| 7 | Identity & Tracking | Band QR Identification | 2D QR payload encoding Device ID, Batch ID, Mfd Date, Exp Date, Chemistry Version, Calibration Version | QR Code scan payload string | Parsed band entity and calibration profile | Flags `UNREGISTERED` or corrupted payload error | `docs/H2S_Wristband_SbCl3_Anthocyanin_Complete.md`, `bands.qr_payload` |
| 8 | Identity & Access | Multi-Role Authentication | Role-based access control supporting 4 distinct user personas | Email and password credentials via Supabase Auth | Authenticated session with role-specific redirection | Authentication error or "Could not fetch user role" | `src/app/login/page.tsx`, `supabase/migrations` |
| 9 | Multi-Tenancy | Company Tenant Isolation | Enforces strict row-level security (RLS) isolating all data by `company_id` | User auth token with `auth.uid()` | Scoped SQL query results matching user's company | Access denied (empty query or RLS violation) | `supabase/migrations/20260901000000_initial_schema.sql` |
| 10 | Shift Management | Worker Registration | Interface for Shift Managers to register new workers into company roster | Name, Worker ID, HR ID, Phone, Department, Designation | Created `workers` record in database | Schema validation error (Zod validation) | `src/app/manager/page.tsx` |
| 11 | Shift Management | Shift Start & End Scanning | Workflow capturing baseline (START) and final (END) band scans per shift | Worker ID, Band ID, Manager ID, Image data | Shift record with computed cumulative exposure | Disallows invalid shift states or missing start reading | `src/app/readme/page.tsx`, `shifts` table |
| 12 | Worker Safety | Worker Cumulative Exposure | Aggregated view of exposure across Today, Week, Month, and Lifetime intervals | Worker UUID | 4-tier exposure range summary in ppm·h | Returns `0–0 ppm·h` if no readings recorded | `src/app/worker/page.tsx`, `get_worker_exposure` RPC |
| 13 | Worker Safety | Real-Time Exposure Sync | Live WebSocket push notifications updating exposure metrics immediately upon new scan | Supabase `postgres_changes` event on `exposure_daily` | Instant UI refresh and toast notification | Silent reconnect on network drop | `src/app/worker/page.tsx` |
| 14 | Control Room | Plant Safety Dashboard | Executive control room overview with KPI cards and exposure trend charts | Plant-wide aggregated shift and reading metrics | Total workers, daily scans, elevated count, trend chart | Displays empty state if no active telemetry | `src/app/control-room/page.tsx`, `get_manager_stats` RPC |
| 15 | Alerting | Multi-Severity Alert Engine | Safety alert logging with severity classifications and acknowledgment tracking | Reading thresholds, lifecycle triggers | Alert record (`NORMAL`, `ELEVATED`, `HIGH`, `CRITICAL`) | Generates `OPEN` alert requiring managerial action | `alerts` table |
| 16 | Calibration | Calibration Version Management | Versioned calibration curves mapping $\Delta E$ values to dose intervals | Version label, chemistry version, calibration points | Lookup interpolation for dose calculation | Fallback to default calibration version | `calibration_versions`, `calibration_points` tables |
| 17 | Developer / Demo | Demo Mode Role Bypass | One-click bypass buttons allowing instant testing as Manager, Worker, or Control Room | Switch toggle on login screen | Immediate navigation to role dashboard | Disabled in strict production mode | `src/app/login/page.tsx` |

---

## 3. Edge Cases & Handling

| # | Feature | Input / Condition | Observed / Documented Behavior |
|---|---------|-------------------|--------------------------------|
| 1 | Band Lifecycle | Worker uses band on Day 6 (>5 working days) | Band status changes to `EXPIRED`/`RETIRED`; app prevents starting new shift until replacement band is issued. |
| 2 | Shift Readings | Manager attempts Shift End scan without existing Shift Start scan | Shift cannot compute $\Delta E$; system flags missing baseline and requires supervisor override or re-baselining. |
| 3 | Camera / Optical | Bad lighting, glare, or camera shadow during scan | Color space converter fails reference scale check; reading tagged with confidence `INVALID` and `saturation_detected: true`. |
| 4 | Gas Overexposure | $\text{H}_2\text{S}$ concentration exceeds maximum dynamic range ($\Delta E > \text{max}$) | Strip reaches chemical saturation; `out_of_range: true`, triggers `CRITICAL` severity alert and mandatory evacuation. |
| 5 | Worker Profile | Band is retired and new band is assigned to worker | Worker's historical exposure in `exposure_daily` is preserved; continuous lifetime cumulative dose remains intact. |
| 6 | Network Interruption | Smartphone loses connection during shift scanning in remote field | Scan metadata buffered locally; synced to Supabase when connectivity is restored; timestamps preserved from capture. |
| 7 | Authentication | User authenticated in Supabase Auth but missing record in `public.users` | Login flow catches error with toast "Could not fetch user role" and prevents routing to unauthorized dashboards. |
| 8 | Multi-Tenancy | Shift Manager attempts to query or add worker from different company | Supabase RLS policy `get_auth_company_id()` filters out foreign records; insert check throws permission error. |
| 9 | Exposure Threshold | Worker reaches daily occupational exposure ceiling ($>20\text{ ppm}\cdot\text{h}$) | `exposure_daily` increments `high_event_count`/`critical_event_count`; automated alert dispatched to Control Room. |
| 10 | QR Code Corruption | QR code is scuffed or unreadable | App falls back to manual entry of alphanumeric `band_code` (e.g., `H2S-004-92A`). |

---

## 4. Core H2S Monitoring Features & Thresholds

### 4.1 Chemical Sensing Mechanism
- **Active Indicator Formula:** $0.5\text{ wt\% }\text{SbCl}_3 + 4\text{ wt\% Purple-Cabbage Anthocyanin Extract}$ coated on $2\times 5\text{ cm}$ cellulose paper ($1.0\text{ mL}$ total coating).
- **Reaction Principle:** Antimony trichloride ($\text{SbCl}_3$) and natural anthocyanin molecules react with $\text{H}_2\text{S}$ gas to form antimony sulfide complexes and anthocyanin structural color transitions.
- **Detection Limit:** $200\text{ ppb}$ ($0.2\text{ ppm}$).
- **Linear / Measurable Range:** $1\text{ to }10\text{ ppm}$ instantaneous / $0\text{ to }120\text{ Exposure Index}$.

### 4.2 Reference Scale & Color Metric
- **Physical Reference Scale Print:** $0\ |\ 10\ |\ 30\ |\ 60\ |\ 120$ Exposure Index on the wristband border.
- **Color Distance Metric (CIE Lab $\Delta E$):**
  $$\Delta E = \sqrt{(L^* - L_0^*)^2 + (a^* - a_0^*)^2 + (b^* - b_0^*)^2}$$
  Where $(L_0^*, a_0^*, b_0^*)$ is the baseline pre-exposure reading at Shift Start, and $(L^*, a^*, b^*)$ is the Shift End reading.

### 4.3 Occupational Exposure Standards & Zone Thresholds
The platform maps cumulative exposure doses ($\text{ppm}\cdot\text{h}$) against international occupational safety limits (OSHA, NIOSH, ACGIH):

| Exposure Zone | Cumulative Dose Range ($8\text{-h Shift}$) | Severity Level | Operational Action Required |
|---------------|---------------------------------------------|----------------|------------------------------|
| **Safe (Green)** | $0.0\text{ to }2.0\text{ ppm}\cdot\text{h}$ | `NORMAL` | Normal operations; routine shift scan logging. |
| **Caution (Yellow)** | $2.1\text{ to }5.0\text{ ppm}\cdot\text{h}$ | `ELEVATED` | Monitor worker; inspect local ventilation and flanges. |
| **Warning (Orange)** | $5.1\text{ to }10.0\text{ ppm}\cdot\text{h}$ | `HIGH` | Rotate worker out of high-risk zone; shift manager notified. |
| **Critical (Red)** | $>10.0\text{ ppm}\cdot\text{h}$ | `CRITICAL` | Immediate evacuation, medical check, mandatory incident log. |

### 4.4 Measurement Confidence Criteria
To eliminate false precision, every reading is assigned a Confidence Rating:
- **`HIGH`:** Reference scale matched, uniform illumination, $\Delta E$ within calibrated range.
- **`MEDIUM`:** Minor lighting variance, slight paper angle, high signal-to-noise ratio.
- **`LOW`:** Poor contrast, non-standard ambient lighting, borderline saturation.
- **`INVALID`:** Glare reflection, damaged patch window, expired chemical patch, or complete saturation.

---

## 5. User Roles, Personas & Access Control

The application enforces 4 primary user roles:

```
                  ┌───────────────────────┐
                  │         ADMIN         │
                  │  System Configuration │
                  │ Calibration Management│
                  └───────────┬───────────┘
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
┌─────────▼─────────────┐               ┌─────────▼─────────────┐
│ CONTROL ROOM MANAGER  │               │     SHIFT MANAGER     │
│ Plant-Wide Telemetry  │               │ Roster & Registration │
│ Incident Alerts & KPIs│               │ Start/End Shift Scans │
└───────────────────────┘               └─────────┬─────────────┘
                                                  │
                                        ┌─────────▼─────────────┐
                                        │        WORKER         │
                                        │ Personal Dose History │
                                        │ Live Band Lifecycle   │
                                        └───────────────────────┘
```

### 5.1 Role Definitions
1. **Worker (`WORKER`)**:
   - Views personal cumulative exposure (Today, Week, Month, Lifetime).
   - Views current assigned band ID, working day count ($X/5$), and latest scan confidence.
   - Receives real-time exposure updates during active shifts.
2. **Shift Manager (`SHIFT_MANAGER`)**:
   - Manages shift roster and worker check-ins.
   - Registers new workers (Name, Code, Department, Phone, Designation).
   - Performs mobile camera scans of worker bands at Shift Start and Shift End.
   - Acknowledges minor alerts and reviews shift summaries.
3. **Control Room Manager (`CONTROL_ROOM_MANAGER`)**:
   - Monitors facility-wide safety overview and active headcount.
   - Tracks live cumulative exposure trends over time (Recharts line chart).
   - Receives real-time alerts for elevated and critical gas exposures.
   - Dispatches emergency teams and safety officers upon threshold breaches.
4. **Administrator (`ADMIN`)**:
   - Manages company tenants, user accounts, and role assignments.
   - Configures calibration curves (`calibration_versions`, `calibration_points`).
   - Audits system logs, data exports, and compliance reports.

---

## 6. Database Schema & Relational Specifications

The backend is built on PostgreSQL via Supabase with Row Level Security (RLS) enabled on all tables.

### 6.1 Core Tables Summary
1. `companies`: Multi-tenant organization records (`id`, `name`, `code`, `created_at`).
2. `users`: Linked to `auth.users(id)` with `company_id`, `name`, `email`, `role` (`ADMIN`, `SHIFT_MANAGER`, `CONTROL_ROOM_MANAGER`, `WORKER`).
3. `workers`: Workforce master catalog (`id`, `company_id`, `worker_code`, `full_name`, `employee_hr_id`, `phone`, `email`, `department`, `designation`, `status`).
4. `bands`: Physical wristband tracking (`id`, `company_id`, `band_code`, `worker_id`, `batch_id`, `qr_payload`, `issued_at`, `status`, `working_day_count`, `current_cumulative_low`, `current_cumulative_high`, `current_confidence`).
5. `shifts`: Shift records (`id`, `company_id`, `worker_id`, `band_id`, `manager_user_id`, `started_at`, `ended_at`, `status`, `working_day_index`, `exposure_low`, `exposure_high`, `confidence`).
6. `readings`: Individual camera optical scans (`id`, `company_id`, `worker_id`, `band_id`, `shift_id`, `reading_type` ['START', 'END'], `captured_at`, `patch_a_rgb`, `patch_b_rgb`, `patch_c_rgb`, `delta_e`, `confidence`, `dose_low_ppm_h`, `dose_high_ppm_h`, `saturation_detected`, `out_of_range`).
7. `exposure_daily`: Aggregated daily worker exposure summary (`id`, `company_id`, `worker_id`, `date`, `exposure_low_ppm_h`, `exposure_high_ppm_h`, `reading_count`, `shift_count`, `high_event_count`, `critical_event_count`).
8. `alerts`: Safety incident logs (`id`, `company_id`, `worker_id`, `band_id`, `severity`, `rule_id`, `message`, `status`, `requires_ack`, `acknowledged_by`, `acknowledged_at`, `action_notes`).
9. `calibration_versions` & `calibration_points`: Calibration models mapping $\Delta E$ to $[\text{dose\_low}, \text{dose\_high}]$.

### 6.2 Database RPC Functions
- `get_manager_stats(company_id UUID)`: Returns active workers, active bands, active shifts, readings today, and open alerts count.
- `get_worker_exposure(target_worker_id UUID)`: Computes rolling aggregations for `today`, `week` (7 days), `month` (30 days), and `long_term` (lifetime) in `[low, high]` ppm·h.

---

## 7. Telemetry, Tracking & Exposure Algorithm Pipeline

```
┌────────────────────────────────────────────────────────┐
│ 1. BAND INITIALIZATION & ISSUANCE                      │
│ - New band registered with QR payload                  │
│ - Assigned to Worker; working_day_count = 1            │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 2. SHIFT START SCAN (Baseline Reading)                 │
│ - Manager scans band QR + patches at shift begin       │
│ - Computes Patch A/B/C initial Lab values (L0, a0, b0) │
│ - Records reading_type = 'START', starts shift clock   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 3. PASSIVE EXPOSURE PERIOD (4 to 12 Hours)             │
│ - Worker conducts field operations                     │
│ - SbCl3/anthocyanin complex reacts to ambient H2S      │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 4. SHIFT END SCAN (Delta Calculation)                  │
│ - Manager scans band at shift conclusion               │
│ - Computes final Lab (L, a, b) & Delta E               │
│ - Calibrates to Dose Range [Dose_low, Dose_high] ppm·h │
│ - Computes Confidence (HIGH/MEDIUM/LOW/INVALID)        │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 5. DATABASE UPDATE & REALTIME DISPATCH                 │
│ - Closes shift (status = 'COMPLETED')                  │
│ - Upserts into exposure_daily table                    │
│ - Updates bands.working_day_count & cumulative dose    │
│ - Triggers alerts if Dose > Threshold                  │
│ - Broadcasts via Supabase Realtime to Worker Dashboard │
└────────────────────────────────────────────────────────┘
```

---

## 8. UI/UX Specifications & Page Architecture

### 8.1 Visual Theme & Style Guide
- **Color Palette:**
  - Background: Slate 900 (`#0f172a`), Dark Navy
  - Card Surfaces: Slate 800 (`#1e293b`) with Slate 700 borders (`#334155`)
  - Primary Accent: Cyan 400 (`#22d3ee`) / Cyan 500 (`#06b6d4`)
  - Status Safe: Emerald / Green 400 (`#4ade80`)
  - Status Warning / Caution: Amber / Yellow 400 (`#facc15`)
  - Status Danger / Critical: Rose / Red 400 (`#f87171`)
- **Typography:** Inter / Clean Sans-Serif with Geist Mono for numbers and IDs.
- **Micro-Interactions:** Framer Motion spring entries, glowing pulse indicators for active shifts, smooth tab switching.

### 8.2 Application Routes & Screen Breakdown
1. **`/` (Landing Page)**:
   - Hero section with animated badge, compelling headline, and CTA buttons.
   - 3-pillar feature grid (Colorimetric Band, Camera Scanning, Digital Dashboard).
   - "About Our Mission" narrative explaining problem, solution, and enterprise value.
   - "Meet the Team" showcase grid with member avatars and roles.
2. **`/readme` (How It Works & Comparison)**:
   - 5-step visual workflow architecture from band distribution to continuous worker history.
   - "Why We Are Better" comparison table contrasting old electronic gas detectors against the passive colorimetric wristband platform across 6 key axes.
3. **`/login` (Authentication & Demo Portal)**:
   - Supabase Auth email/password login form with loading spinners.
   - "Demo Mode" toggle with one-click role bypass buttons (`Bypass as Manager`, `Bypass as Worker`, `Bypass as Control Room`).
4. **`/manager` (Shift Manager Dashboard)**:
   - Header with active company context and logout.
   - Tab switch: "View Workers" (searchable roster, status pills) vs "Add New Worker" (Zod-validated registration form).
5. **`/worker` (Worker Personal Portal)**:
   - Worker profile header with "Currently on shift" live pulse indicator.
   - 4-metric cumulative exposure grid (Today, This Week, This Month, Lifetime).
   - Current Band Status card displaying Band ID, Active status badge, working day progress ($3/5$), and latest scan confidence.
   - Real-time Supabase subscription listening for instant scan updates.
6. **`/control-room` (Control Room Analytics Dashboard)**:
   - High-level KPI metric cards: Active Workers, Total Daily Scans, Elevated Exposures.
   - Responsive Recharts line chart showing plant-wide average cumulative exposure trends ($08{:}00\text{ to }18{:}00$).

---

## 9. Next Steps for Implementation on `frontend` Branch

1. Create and checkout git branch `frontend`.
2. Initialize fresh Next.js 14 App Router project with modern configuration (`package.json`, `tsconfig.json`, `tailwind.config.ts`).
3. Implement reusable UI components, navigation, and page layouts.
4. Integrate Supabase Client (`@supabase/supabase-js`), Auth helpers, and TanStack React Query hooks.
5. Set up comprehensive Jest / React Testing Library suite for unit and integration testing of core components.
