# Supabase Database Schema & Integration Specification Report

**Document Version:** 1.0.0  
**Target Platform:** Next.js 14 (App Router) + Supabase (PostgreSQL 15+)  
**Author:** Spec Miner 2 (Supabase & Schema Miner)  
**Date:** 2026-09-01  

---

## 1. Executive Summary

This report specifies the authoritative database architecture, data dictionary, Row-Level Security (RLS) policies, RPC functions, Realtime event channels, and TypeScript definitions for the **H₂S Passive Cumulative Exposure Monitoring Platform**.

The database architecture is designed to capture colorimetric sensor wristband scans, track cumulative workplace hydrogen sulfide ($H_2S$) dose ranges ($ppm \cdot h$), enforce band lifecycle limits (5 working days), manage multi-tenant workforce rosters, and provide role-based dashboards (Shift Manager, Worker, Control Room Manager, Administrator).

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Auth & Tenant | Multi-Tenant Companies | Multi-tenant organization grouping via `companies` table. | `name` (TEXT), `code` (TEXT UNIQUE) | `id` (UUID), `created_at` | Unique violation on duplicate `code` | `20260901000000_initial_schema.sql:4-10` |
| 2 | Auth & Profile | User Profile & Roles | Maps `auth.users(id)` to custom roles (`SHIFT_MANAGER`, `CONTROL_ROOM_MANAGER`, `WORKER`, `ADMIN`) and company. | `id` (UUID PK = auth.uid()), `company_id`, `email`, `name`, `role` | Profile record | CHECK constraint violation on invalid role; FK violation on company | `20260901000000_initial_schema.sql:12-22` |
| 3 | Workforce | Worker Roster | Worker entity profile linked to company, plant, region, and department. | `worker_code`, `full_name`, HR info, department, designation | Worker UUID record | Missing required fields (`full_name`, `worker_code`) | `20260901000000_initial_schema.sql:24-44` |
| 4 | Telemetry/Hardware | Smart Wristband (Sensor) | Passive colorimetric wristband lifecycle tracking (up to 5 working days). | `band_code` (UNIQUE), `worker_id`, `qr_payload`, `status` | Band record with working day count & cumulative doses | Unique violation on `band_code`; invalid status enum check | `20260901000000_initial_schema.sql:46-66` |
| 5 | Operations | Work Shift Lifecycle | Shift management linking worker, band, shift manager, location, start/end readings. | `worker_id`, `band_id`, `manager_user_id`, `started_at`, `ended_at`, `status` | Shift record with computed exposure ranges | Status check constraint violation | `20260901000000_initial_schema.sql:68-91` |
| 6 | Optical Sensing | Colorimetric Readings | Image scan data storing Patch A/B/C RGB and CIE Lab color spaces, $\Delta E$, confidence, and dose range. | Patch RGB/Lab JSONB, $\Delta E$, `reading_type` (START/END), image path | Reading record with calculated `dose_low_ppm_h`, `dose_high_ppm_h` | Confidence enum check; Reading type check | `20260901000000_initial_schema.sql:93-130` |
| 7 | Exposure Tracking | Daily Cumulative Exposure | Aggregated daily exposure per worker (`exposure_daily` / `daily_exposures`). | `worker_id`, `date`, `exposure_low_ppm_h`, `exposure_high_ppm_h` | Daily exposure aggregation row | Unique constraint on `(company_id, worker_id, date)` | `20260901000000_initial_schema.sql:132-149` |
| 8 | Safety & Compliance | Safety Alerts | Real-time threshold breach notifications and acknowledgement workflow. | `worker_id`, `severity`, `rule_id`, `message`, `status` | Alert record | Severity/Status check constraint violations | `20260901000000_initial_schema.sql:151-173` |
| 9 | Calibration | Batch Calibration Curves | Calibration curves and reference lookup points for $\Delta E \to ppm \cdot h$ mapping. | Version label, chemistry version, valid dates, $\Delta E$ points | Calibration dataset | Foreign key cascade on version delete | `20260901000000_initial_schema.sql:175-204` |
| 10 | RPC Analytics | Manager Dashboard Stats | Aggregated counts of active workers, bands, shifts, today's readings, and open alerts. | `company_id` (UUID) | Record: `{ active_workers, active_bands, active_shifts, readings_today, open_alerts }` | Returns 0 counts if no match | `20260901000000_initial_schema.sql:208-225` |
| 11 | RPC Analytics | Worker Cumulative Exposure | Calculates today, 7-day, 30-day, and lifetime dose ranges for a worker. | `target_worker_id` (UUID) | Record: `{ today_low, today_high, week_low, week_high, month_low, month_high, long_term_low, long_term_high }` | Returns 0 for non-existent records | `20260901000000_initial_schema.sql:227-250` |
| 12 | Security | Company Isolation RLS | Dynamic tenant isolation across all tables using security definer company helper. | `auth.uid()` | RLS policy evaluation against `company_id` | PostgREST returns empty set (404/silent filter) or permission denied | `20260901000000_initial_schema.sql:253-312` |
| 13 | Realtime | Realtime Exposure Feeds | Postgres changes publication for live worker exposure updates. | Channel: `worker-exposure`, table: `exposure_daily`, filter: `worker_id=eq.${user.id}` | Realtime payload (INSERT / UPDATE) | Channel disconnect / timeout | `src/app/worker/page.tsx:49-64` |

---

## 3. Edge Cases & Observed Behaviors

| # | Feature | Input / Condition | Observed / Documented Behavior |
|---|---------|-------------------|--------------------------------|
| 1 | Wristband Lifecycle | Band working day count reaches 5 | Status transitions to `RETIRED` or `EXPIRED`; retirement reason logged; app blocks subsequent shift assignment. |
| 2 | Optical Patch Saturation | $\Delta E$ exceeds maximum calibration range | `saturation_detected` flag set to `TRUE`, `confidence` set to `'INVALID'` or `'LOW'`, alert triggered with severity `'ELEVATED'`/`'HIGH'`. |
| 3 | Reference Patch Discrepancy | Patch A / B (control patches) degraded | `measurement_status` set to `'UNCERTAIN'`, confidence lowered, reasons JSONB populated with diagnostic codes. |
| 4 | Daily Exposure Conflict | Multiple readings within same calendar day | `exposure_daily` row is updated via upsert on `(company_id, worker_id, date)` incrementing `reading_count` and cumulative dose values. |
| 5 | Worker Unauthenticated / Demo Mode | User bypasses login without Supabase Auth session | Frontend falls back to simulated/mock data structures while keeping UI reactive. |
| 6 | Unassigned Wristband Scan | Scan of unregistered band code | `shifts.band_id` references `bands.id` with `ON DELETE SET NULL`; band status must be registered prior to shift start. |

---

## 4. Comprehensive Database Schema

### 4.1. Extension Requirements
- `pgcrypto`: Required for `gen_random_uuid()` UUID generation.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

### 4.2. Data Dictionary & Table Definitions

#### 1. `companies`
Represents an industrial employer or operating enterprise (multi-tenant boundary).
- **Primary Key:** `id` (UUID)
- **Columns:**
  - `id` (`UUID`, `DEFAULT gen_random_uuid()`, NOT NULL, PK)
  - `name` (`TEXT`, NOT NULL) — Company legal / display name
  - `code` (`TEXT`, NOT NULL, UNIQUE) — Unique organizational slug/code
  - `created_at` (`TIMESTAMPTZ`, `DEFAULT NOW()`)

#### 2. `users`
User profiles augmenting Supabase `auth.users`.
- **Primary Key:** `id` (UUID, FK $\to$ `auth.users.id`)
- **Foreign Keys:**
  - `id` REFERENCES `auth.users(id)` ON DELETE CASCADE
  - `company_id` REFERENCES `companies(id)` ON DELETE CASCADE
- **Columns:**
  - `id` (`UUID`, PK)
  - `company_id` (`UUID`, FK)
  - `email` (`TEXT`, NOT NULL, UNIQUE)
  - `name` (`TEXT`, NOT NULL)
  - `role` (`TEXT`, NOT NULL) — CHECK: `role IN ('SHIFT_MANAGER', 'CONTROL_ROOM_MANAGER', 'WORKER', 'ADMIN')`
  - `created_at` (`TIMESTAMPTZ`, `DEFAULT NOW()`)
- **Indexes:**
  - `idx_users_company` ON `users(company_id)`

#### 3. `workers`
Individual plant workers subjected to environmental H₂S exposure monitoring.
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `company_id` REFERENCES `companies(id)` ON DELETE CASCADE
- **Columns:**
  - `id` (`UUID`, `DEFAULT gen_random_uuid()`, PK)
  - `company_id` (`UUID`, FK, NOT NULL)
  - `worker_code` (`TEXT`, NOT NULL) — Badge or employee identification code
  - `full_name` (`TEXT`, NOT NULL)
  - `employee_hr_id` (`TEXT`, NULLABLE) — Optional corporate HR system identifier
  - `phone` (`TEXT`, NULLABLE)
  - `email` (`TEXT`, NULLABLE)
  - `department` (`TEXT`, NULLABLE)
  - `designation` (`TEXT`, NULLABLE)
  - `plant_id` (`UUID`, NULLABLE)
  - `default_region_id` (`UUID`, NULLABLE)
  - `default_work_area_id` (`UUID`, NULLABLE)
  - `status` (`TEXT`, `DEFAULT 'ACTIVE'`) — e.g. `'ACTIVE'`, `'INACTIVE'`, `'ON_LEAVE'`
  - `created_at` (`TIMESTAMPTZ`, `DEFAULT NOW()`)
  - `updated_at` (`TIMESTAMPTZ`, `DEFAULT NOW()`)
- **Indexes:**
  - `idx_workers_company` ON `workers(company_id)`

#### 4. `bands`
Physical colorimetric sensor wristbands containing $SbCl_3$ + Purple Cabbage Anthocyanin chemistry.
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `company_id` REFERENCES `companies(id)` ON DELETE CASCADE
  - `worker_id` REFERENCES `workers(id)` ON DELETE SET NULL
- **Columns:**
  - `id` (`UUID`, `DEFAULT gen_random_uuid()`, PK)
  - `company_id` (`UUID`, FK, NOT NULL)
  - `band_code` (`TEXT`, NOT NULL, UNIQUE) — QR code identifier (e.g. `H2S-004-92A`)
  - `worker_id` (`UUID`, FK, NULLABLE) — Assigned worker
  - `batch_id` (`UUID`, NULLABLE) — Manufacturing chemistry batch
  - `qr_payload` (`TEXT`, NULLABLE) — Full raw QR string data
  - `issued_at` (`TIMESTAMPTZ`, NULLABLE)
  - `status` (`TEXT`) — CHECK: `status IN ('UNREGISTERED', 'REGISTERED', 'ACTIVE', 'WARNING', 'RETIRED', 'EXPIRED', 'COMPROMISED')`
  - `retirement_reason` (`TEXT`, NULLABLE)
  - `working_day_count` (`INTEGER`, `DEFAULT 0`) — Enforces 5-working-day maximum lifecycle
  - `current_cumulative_low` (`NUMERIC`, NULLABLE) — Current accumulated lower bound ($ppm \cdot h$)
  - `current_cumulative_high` (`NUMERIC`, NULLABLE) — Current accumulated upper bound ($ppm \cdot h$)
  - `current_confidence` (`TEXT`, NULLABLE) — Measurement confidence level
  - `created_at` (`TIMESTAMPTZ`, `DEFAULT NOW()`)
  - `updated_at` (`TIMESTAMPTZ`, `DEFAULT NOW()`)
- **Indexes:**
  - `idx_bands_company` ON `bands(company_id)`
  - `idx_bands_worker` ON `bands(worker_id)`

#### 5. `shifts`
Operational shift period linking a worker, wristband, shift manager, and location.
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `company_id` REFERENCES `companies(id)` ON DELETE CASCADE
  - `worker_id` REFERENCES `workers(id)` ON DELETE CASCADE
  - `band_id` REFERENCES `bands(id)` ON DELETE SET NULL
  - `manager_user_id` REFERENCES `users(id)` ON DELETE SET NULL
- **Columns:**
  - `id` (`UUID`, `DEFAULT gen_random_uuid()`, PK)
  - `company_id` (`UUID`, FK, NOT NULL)
  - `worker_id` (`UUID`, FK, NOT NULL)
  - `band_id` (`UUID`, FK, NULLABLE)
  - `manager_user_id` (`UUID`, FK, NULLABLE)
  - `plant_id` (`UUID`, NULLABLE)
  - `region_id` (`UUID`, NULLABLE)
  - `work_area_id` (`UUID`, NULLABLE)
  - `started_at` (`TIMESTAMPTZ`, NULLABLE)
  - `ended_at` (`TIMESTAMPTZ`, NULLABLE)
  - `status` (`TEXT`) — CHECK: `status IN ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED')`
  - `working_day_index` (`INTEGER`, NULLABLE) — 1 to 5
  - `start_reading_id` (`UUID`, NULLABLE)
  - `end_reading_id` (`UUID`, NULLABLE)
  - `exposure_low` (`NUMERIC`, NULLABLE) — Shift incremental exposure low ($ppm \cdot h$)
  - `exposure_high` (`NUMERIC`, NULLABLE) — Shift incremental exposure high ($ppm \cdot h$)
  - `confidence` (`TEXT`, NULLABLE)
  - `created_at` (`TIMESTAMPTZ`, `DEFAULT NOW()`)
- **Indexes:**
  - `idx_shifts_company` ON `shifts(company_id)`
  - `idx_shifts_worker` ON `shifts(worker_id)`

#### 6. `readings`
Optical scans captured at shift start or end containing color channel analysis and dose calculations.
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `company_id` REFERENCES `companies(id)` ON DELETE CASCADE
  - `worker_id` REFERENCES `workers(id)` ON DELETE CASCADE
  - `band_id` REFERENCES `bands(id)` ON DELETE SET NULL
  - `shift_id` REFERENCES `shifts(id)` ON DELETE CASCADE
  - `manager_user_id` REFERENCES `users(id)` ON DELETE SET NULL
- **Columns:**
  - `id` (`UUID`, `DEFAULT gen_random_uuid()`, PK)
  - `company_id` (`UUID`, FK, NOT NULL)
  - `worker_id` (`UUID`, FK, NOT NULL)
  - `band_id` (`UUID`, FK, NULLABLE)
  - `shift_id` (`UUID`, FK, NULLABLE)
  - `manager_user_id` (`UUID`, FK, NULLABLE)
  - `reading_type` (`TEXT`) — CHECK: `reading_type IN ('START', 'END')`
  - `captured_at` (`TIMESTAMPTZ`, `DEFAULT NOW()`)
  - `work_date` (`DATE`, NULLABLE)
  - `plant_id` (`UUID`, NULLABLE)
  - `region_id` (`UUID`, NULLABLE)
  - `work_area_id` (`UUID`, NULLABLE)
  - `working_day_index` (`INTEGER`, NULLABLE)
  - `image_storage_path` (`TEXT`, NULLABLE) — Supabase Storage bucket path
  - `patch_a_rgb` (`JSONB`, NULLABLE) — Reference Patch A `{r, g, b}`
  - `patch_b_rgb` (`JSONB`, NULLABLE) — Reference Patch B `{r, g, b}`
  - `patch_c_rgb` (`JSONB`, NULLABLE) — Expiry Patch C `{r, g, b}`
  - `patch_a_lab` (`JSONB`, NULLABLE) — Reference Patch A `{l, a, b}`
  - `patch_b_lab` (`JSONB`, NULLABLE) — Reference Patch B `{l, a, b}`
  - `patch_c_lab` (`JSONB`, NULLABLE) — Expiry Patch C `{l, a, b}`
  - `delta_e` (`NUMERIC`, NULLABLE) — Total color difference $\Delta E$ relative to baseline
  - `patch_c_status` (`TEXT`, NULLABLE) — Expiry patch evaluation (e.g. `'VALID'`, `'EXPIRED'`)
  - `measurement_status` (`TEXT`, NULLABLE) — Scan quality result
  - `confidence` (`TEXT`) — CHECK: `confidence IN ('HIGH', 'MEDIUM', 'LOW', 'INVALID')`
  - `calibration_version_id` (`UUID`, NULLABLE)
  - `dose_low_ppm_h` (`NUMERIC`, NULLABLE) — Lower range estimation
  - `dose_high_ppm_h` (`NUMERIC`, NULLABLE) — Upper range estimation
  - `saturation_detected` (`BOOLEAN`, `DEFAULT FALSE`)
  - `out_of_range` (`BOOLEAN`, `DEFAULT FALSE`)
  - `reasons` (`JSONB`, NULLABLE) — Diagnostic failure / adjustment codes
  - `created_at` (`TIMESTAMPTZ`, `DEFAULT NOW()`)
- **Indexes:**
  - `idx_readings_company` ON `readings(company_id)`
  - `idx_readings_worker` ON `readings(worker_id)`
  - `idx_readings_shift` ON `readings(shift_id)`

#### 7. `exposure_daily` (Daily Exposures)
Aggregated daily exposure records per worker per day for long-term health tracking.
- **Primary Key:** `id` (UUID)
- **Unique Constraint:** `UNIQUE(company_id, worker_id, date)`
- **Foreign Keys:**
  - `company_id` REFERENCES `companies(id)` ON DELETE CASCADE
  - `worker_id` REFERENCES `workers(id)` ON DELETE CASCADE
- **Columns:**
  - `id` (`UUID`, `DEFAULT gen_random_uuid()`, PK)
  - `company_id` (`UUID`, FK, NOT NULL)
  - `worker_id` (`UUID`, FK, NOT NULL)
  - `date` (`DATE`, NOT NULL)
  - `exposure_low_ppm_h` (`NUMERIC`) — Daily cumulative lower bound
  - `exposure_high_ppm_h` (`NUMERIC`) — Daily cumulative upper bound
  - `reading_count` (`INTEGER`)
  - `shift_count` (`INTEGER`)
  - `high_event_count` (`INTEGER`)
  - `critical_event_count` (`INTEGER`)
  - `updated_at` (`TIMESTAMPTZ`, `DEFAULT NOW()`)
- **Indexes:**
  - `idx_exposure_daily_company` ON `exposure_daily(company_id)`
  - `idx_exposure_daily_worker` ON `exposure_daily(worker_id)`

#### 8. `alerts`
Industrial safety notifications, exposure ceiling alerts, and incident tickets.
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `company_id` REFERENCES `companies(id)` ON DELETE CASCADE
  - `worker_id` REFERENCES `workers(id)` ON DELETE CASCADE
  - `band_id` REFERENCES `bands(id)` ON DELETE SET NULL
  - `shift_id` REFERENCES `shifts(id)` ON DELETE SET NULL
  - `reading_id` REFERENCES `readings(id)` ON DELETE SET NULL
  - `acknowledged_by` REFERENCES `users(id)` ON DELETE SET NULL
- **Columns:**
  - `id` (`UUID`, `DEFAULT gen_random_uuid()`, PK)
  - `company_id` (`UUID`, FK, NOT NULL)
  - `worker_id` (`UUID`, FK, NOT NULL)
  - `band_id` (`UUID`, FK, NULLABLE)
  - `shift_id` (`UUID`, FK, NULLABLE)
  - `reading_id` (`UUID`, FK, NULLABLE)
  - `severity` (`TEXT`) — CHECK: `severity IN ('NORMAL', 'ELEVATED', 'HIGH', 'CRITICAL')`
  - `rule_id` (`TEXT`, NULLABLE) — Safety rule ID (e.g. `'RULE_DAILY_LIMIT_EXCEEDED'`)
  - `message` (`TEXT`, NULLABLE)
  - `status` (`TEXT`) — CHECK: `status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ESCALATED')`
  - `requires_ack` (`BOOLEAN`, NULLABLE)
  - `requires_action` (`BOOLEAN`, NULLABLE)
  - `acknowledged_by` (`UUID`, FK, NULLABLE)
  - `acknowledged_at` (`TIMESTAMPTZ`, NULLABLE)
  - `action_type` (`TEXT`, NULLABLE)
  - `action_notes` (`TEXT`, NULLABLE)
  - `created_at` (`TIMESTAMPTZ`, `DEFAULT NOW()`)
- **Indexes:**
  - `idx_alerts_company` ON `alerts(company_id)`
  - `idx_alerts_worker` ON `alerts(worker_id)`

#### 9. `calibration_versions`
Manufacturing and chemical calibration records for colorimetric batches.
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `company_id` REFERENCES `companies(id)` ON DELETE CASCADE
  - `created_by` REFERENCES `users(id)` ON DELETE SET NULL
- **Columns:**
  - `id` (`UUID`, `DEFAULT gen_random_uuid()`, PK)
  - `company_id` (`UUID`, FK, NOT NULL)
  - `version_label` (`TEXT`, NOT NULL) — e.g. `CAL-v1`, `CAL-2026-Q3`
  - `chemistry_version` (`TEXT`, NULLABLE) — e.g. `0.5% SbCl3 + 4% Anthocyanin`
  - `batch_scope` (`TEXT`, NULLABLE)
  - `status` (`TEXT`) — CHECK: `status IN ('DRAFT', 'ACTIVE', 'RETIRED')`
  - `valid_from` (`DATE`, NULLABLE)
  - `valid_until` (`DATE`, NULLABLE)
  - `created_by` (`UUID`, FK, NULLABLE)
  - `created_at` (`TIMESTAMPTZ`, `DEFAULT NOW()`)
  - `notes` (`TEXT`, NULLABLE)
  - `metadata` (`JSONB`, NULLABLE)
- **Indexes:**
  - `idx_cal_versions_company` ON `calibration_versions(company_id)`

#### 10. `calibration_points`
Lookup interpolation points mapping $\Delta E$ values to $ppm \cdot h$ dose ranges.
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `calibration_version_id` REFERENCES `calibration_versions(id)` ON DELETE CASCADE
- **Columns:**
  - `id` (`UUID`, `DEFAULT gen_random_uuid()`, PK)
  - `calibration_version_id` (`UUID`, FK, NOT NULL)
  - `delta_e` (`NUMERIC`, NOT NULL) — Color difference magnitude
  - `dose_low_ppm_h` (`NUMERIC`, NOT NULL)
  - `dose_high_ppm_h` (`NUMERIC`, NOT NULL)
  - `sequence` (`INTEGER`, NULLABLE)
  - `metadata` (`JSONB`, NULLABLE)
- **Indexes:**
  - `idx_cal_points_version` ON `calibration_points(calibration_version_id)`

---

## 5. Enum & Constrained Types

| Type Domain | Allowed String Values | Constraints / Notes |
|-------------|-----------------------|---------------------|
| `UserRole` | `'SHIFT_MANAGER'`, `'CONTROL_ROOM_MANAGER'`, `'WORKER'`, `'ADMIN'` | Checked on `users.role` |
| `BandStatus` | `'UNREGISTERED'`, `'REGISTERED'`, `'ACTIVE'`, `'WARNING'`, `'RETIRED'`, `'EXPIRED'`, `'COMPROMISED'` | Checked on `bands.status` |
| `ShiftStatus` | `'PLANNED'`, `'ACTIVE'`, `'COMPLETED'`, `'CANCELLED'` | Checked on `shifts.status` |
| `ReadingType` | `'START'`, `'END'` | Checked on `readings.reading_type` |
| `ConfidenceLevel` | `'HIGH'`, `'MEDIUM'`, `'LOW'`, `'INVALID'` | Checked on `readings.confidence` |
| `AlertSeverity` | `'NORMAL'`, `'ELEVATED'`, `'HIGH'`, `'CRITICAL'` | Checked on `alerts.severity` |
| `AlertStatus` | `'OPEN'`, `'ACKNOWLEDGED'`, `'RESOLVED'`, `'ESCALATED'` | Checked on `alerts.status` |
| `CalibrationStatus`| `'DRAFT'`, `'ACTIVE'`, `'RETIRED'` | Checked on `calibration_versions.status` |

---

## 6. Stored Procedures & Database RPC Functions

### 6.1. `get_manager_stats`
Provides fast aggregated key performance indicators for the Shift Manager / Control Room dashboard without executing 5 separate network roundtrips.

```sql
CREATE OR REPLACE FUNCTION get_manager_stats(company_id UUID)
RETURNS TABLE (
  active_workers INTEGER,
  active_bands INTEGER,
  active_shifts INTEGER,
  readings_today INTEGER,
  open_alerts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM workers WHERE workers.company_id = $1 AND workers.status = 'ACTIVE') as active_workers,
    (SELECT COUNT(*)::INTEGER FROM bands WHERE bands.company_id = $1 AND bands.status = 'ACTIVE') as active_bands,
    (SELECT COUNT(*)::INTEGER FROM shifts WHERE shifts.company_id = $1 AND shifts.status = 'ACTIVE') as active_shifts,
    (SELECT COUNT(*)::INTEGER FROM readings WHERE readings.company_id = $1 AND readings.work_date = CURRENT_DATE) as readings_today,
    (SELECT COUNT(*)::INTEGER FROM alerts WHERE alerts.company_id = $1 AND alerts.status = 'OPEN') as open_alerts;
END;
$$ LANGUAGE plpgsql;
```

### 6.2. `get_worker_exposure`
Computes rolling time-window exposure totals (Today, Past 7 Days, Past 30 Days, Lifetime) for personal worker dashboards.

```sql
CREATE OR REPLACE FUNCTION get_worker_exposure(target_worker_id UUID)
RETURNS TABLE (
  today_low NUMERIC,
  today_high NUMERIC,
  week_low NUMERIC,
  week_high NUMERIC,
  month_low NUMERIC,
  month_high NUMERIC,
  long_term_low NUMERIC,
  long_term_high NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT SUM(exposure_low_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id AND date = CURRENT_DATE), 0) as today_low,
    COALESCE((SELECT SUM(exposure_high_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id AND date = CURRENT_DATE), 0) as today_high,
    COALESCE((SELECT SUM(exposure_low_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id AND date >= CURRENT_DATE - INTERVAL '7 days'), 0) as week_low,
    COALESCE((SELECT SUM(exposure_high_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id AND date >= CURRENT_DATE - INTERVAL '7 days'), 0) as week_high,
    COALESCE((SELECT SUM(exposure_low_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id AND date >= CURRENT_DATE - INTERVAL '30 days'), 0) as month_low,
    COALESCE((SELECT SUM(exposure_high_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id AND date >= CURRENT_DATE - INTERVAL '30 days'), 0) as month_high,
    COALESCE((SELECT SUM(exposure_low_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id), 0) as long_term_low,
    COALESCE((SELECT SUM(exposure_high_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id), 0) as long_term_high;
END;
$$ LANGUAGE plpgsql;
```

---

## 7. Supabase Auth & Role-Based Access Control (RBAC)

### 7.1. Authentication Architecture
1. **Supabase Auth Engine**: `auth.users` handles user credential storage, JWT generation, password hashing, and token refresh.
2. **Profile / Role Synchronization**:
   - The `public.users` table contains the authoritative user record (`id = auth.users.id`).
   - Role definitions:
     - `SHIFT_MANAGER`: Assigns bands, performs start/end scans, registers workers, manages shifts.
     - `WORKER`: Views personal cumulative exposure, active band status, scan history.
     - `CONTROL_ROOM_MANAGER`: Plant-wide oversight, incident triage, global exposure trend monitoring.
     - `ADMIN`: Tenant configuration, calibration dataset authoring, organizational settings.

### 7.2. Multi-Tenant Security & RLS Helper
To enforce strict multi-tenant isolation without query overhead or security bypasses, a security-definer helper extracts the company ID of the authenticated caller:

```sql
CREATE OR REPLACE FUNCTION get_auth_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT company_id FROM public.users WHERE id = (SELECT auth.uid());
$$;
```

### 7.3. Row Level Security Policies Summary
- **Companies:** Authenticated users can select only their own company record (`id = get_auth_company_id()`).
- **Users:** Users can view colleagues within their company (`company_id = get_auth_company_id()`) and update their own profile (`id = auth.uid()`).
- **Workers, Bands, Shifts, Readings, Exposure Daily, Alerts:** Full tenant isolation via `company_id = get_auth_company_id()`.

---

## 8. Real-time Channels & Event Subscriptions

The platform utilizes Supabase Realtime (PostgreSQL Logical Replication publication) for instant UI reactivity.

### 8.1. Channel Specifications

#### Channel 1: `worker-exposure`
- **Topic:** `worker-exposure`
- **Postgres Table:** `public.exposure_daily`
- **Filter:** `worker_id=eq.<CURRENT_USER_ID>`
- **Events:** `*` (`INSERT`, `UPDATE`)
- **Client Handler:** Invalidates TanStack Query `['worker-exposure', user.id]`, triggers toast alert on new reading.

```typescript
const channel = supabase
  .channel('worker-exposure')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'exposure_daily',
      filter: `worker_id=eq.${user.id}`,
    },
    (payload) => {
      // Invalidate cache & update UI
    }
  )
  .subscribe();
```

#### Channel 2: `plant-alerts`
- **Topic:** `plant-alerts`
- **Postgres Table:** `public.alerts`
- **Filter:** `company_id=eq.<COMPANY_ID>`
- **Events:** `INSERT`, `UPDATE`
- **Client Handler:** Appends new alert to Control Room and Shift Manager alert feeds.

#### Channel 3: `manager-roster-updates`
- **Topic:** `manager-roster-updates`
- **Postgres Table:** `public.workers`
- **Events:** `INSERT`, `UPDATE`
- **Client Handler:** Invalidates `['workers']` query key to refresh workforce roster.

---

## 9. Full TypeScript Definitions (`database.types.ts` & Domain Interfaces)

Below is the complete, exact TypeScript interface contract for frontend integration with `@supabase/supabase-js`.

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'SHIFT_MANAGER' | 'CONTROL_ROOM_MANAGER' | 'WORKER' | 'ADMIN';
export type BandStatus = 'UNREGISTERED' | 'REGISTERED' | 'ACTIVE' | 'WARNING' | 'RETIRED' | 'EXPIRED' | 'COMPROMISED';
export type ShiftStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type ReadingType = 'START' | 'END';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INVALID';
export type AlertSeverity = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ESCALATED';
export type CalibrationStatus = 'DRAFT' | 'ACTIVE' | 'RETIRED';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface LabColor {
  l: number;
  a: number;
  b: number;
}

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          created_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          company_id: string | null;
          email: string;
          name: string;
          role: UserRole;
          created_at: string | null;
        };
        Insert: {
          id: string;
          company_id?: string | null;
          email: string;
          name: string;
          role: UserRole;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          email?: string;
          name?: string;
          role?: UserRole;
          created_at?: string | null;
        };
      };
      workers: {
        Row: {
          id: string;
          company_id: string | null;
          worker_code: string;
          full_name: string;
          employee_hr_id: string | null;
          phone: string | null;
          email: string | null;
          department: string | null;
          designation: string | null;
          plant_id: string | null;
          default_region_id: string | null;
          default_work_area_id: string | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          worker_code: string;
          full_name: string;
          employee_hr_id?: string | null;
          phone?: string | null;
          email?: string | null;
          department?: string | null;
          designation?: string | null;
          plant_id?: string | null;
          default_region_id?: string | null;
          default_work_area_id?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          worker_code?: string;
          full_name?: string;
          employee_hr_id?: string | null;
          phone?: string | null;
          email?: string | null;
          department?: string | null;
          designation?: string | null;
          plant_id?: string | null;
          default_region_id?: string | null;
          default_work_area_id?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      bands: {
        Row: {
          id: string;
          company_id: string | null;
          band_code: string;
          worker_id: string | null;
          batch_id: string | null;
          qr_payload: string | null;
          issued_at: string | null;
          status: BandStatus | null;
          retirement_reason: string | null;
          working_day_count: number | null;
          current_cumulative_low: number | null;
          current_cumulative_high: number | null;
          current_confidence: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          band_code: string;
          worker_id?: string | null;
          batch_id?: string | null;
          qr_payload?: string | null;
          issued_at?: string | null;
          status?: BandStatus | null;
          retirement_reason?: string | null;
          working_day_count?: number | null;
          current_cumulative_low?: number | null;
          current_cumulative_high?: number | null;
          current_confidence?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          band_code?: string;
          worker_id?: string | null;
          batch_id?: string | null;
          qr_payload?: string | null;
          issued_at?: string | null;
          status?: BandStatus | null;
          retirement_reason?: string | null;
          working_day_count?: number | null;
          current_cumulative_low?: number | null;
          current_cumulative_high?: number | null;
          current_confidence?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      shifts: {
        Row: {
          id: string;
          company_id: string | null;
          worker_id: string;
          band_id: string | null;
          manager_user_id: string | null;
          plant_id: string | null;
          region_id: string | null;
          work_area_id: string | null;
          started_at: string | null;
          ended_at: string | null;
          status: ShiftStatus | null;
          working_day_index: number | null;
          start_reading_id: string | null;
          end_reading_id: string | null;
          exposure_low: number | null;
          exposure_high: number | null;
          confidence: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          worker_id: string;
          band_id?: string | null;
          manager_user_id?: string | null;
          plant_id?: string | null;
          region_id?: string | null;
          work_area_id?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          status?: ShiftStatus | null;
          working_day_index?: number | null;
          start_reading_id?: string | null;
          end_reading_id?: string | null;
          exposure_low?: number | null;
          exposure_high?: number | null;
          confidence?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          worker_id?: string;
          band_id?: string | null;
          manager_user_id?: string | null;
          plant_id?: string | null;
          region_id?: string | null;
          work_area_id?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          status?: ShiftStatus | null;
          working_day_index?: number | null;
          start_reading_id?: string | null;
          end_reading_id?: string | null;
          exposure_low?: number | null;
          exposure_high?: number | null;
          confidence?: string | null;
          created_at?: string | null;
        };
      };
      readings: {
        Row: {
          id: string;
          company_id: string | null;
          worker_id: string;
          band_id: string | null;
          shift_id: string | null;
          manager_user_id: string | null;
          reading_type: ReadingType | null;
          captured_at: string | null;
          work_date: string | null;
          plant_id: string | null;
          region_id: string | null;
          work_area_id: string | null;
          working_day_index: number | null;
          image_storage_path: string | null;
          patch_a_rgb: Json | null;
          patch_b_rgb: Json | null;
          patch_c_rgb: Json | null;
          patch_a_lab: Json | null;
          patch_b_lab: Json | null;
          patch_c_lab: Json | null;
          delta_e: number | null;
          patch_c_status: string | null;
          measurement_status: string | null;
          confidence: ConfidenceLevel | null;
          calibration_version_id: string | null;
          dose_low_ppm_h: number | null;
          dose_high_ppm_h: number | null;
          saturation_detected: boolean | null;
          out_of_range: boolean | null;
          reasons: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          worker_id: string;
          band_id?: string | null;
          shift_id?: string | null;
          manager_user_id?: string | null;
          reading_type?: ReadingType | null;
          captured_at?: string | null;
          work_date?: string | null;
          plant_id?: string | null;
          region_id?: string | null;
          work_area_id?: string | null;
          working_day_index?: number | null;
          image_storage_path?: string | null;
          patch_a_rgb?: Json | null;
          patch_b_rgb?: Json | null;
          patch_c_rgb?: Json | null;
          patch_a_lab?: Json | null;
          patch_b_lab?: Json | null;
          patch_c_lab?: Json | null;
          delta_e?: number | null;
          patch_c_status?: string | null;
          measurement_status?: string | null;
          confidence?: ConfidenceLevel | null;
          calibration_version_id?: string | null;
          dose_low_ppm_h?: number | null;
          dose_high_ppm_h?: number | null;
          saturation_detected?: boolean | null;
          out_of_range?: boolean | null;
          reasons?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          worker_id?: string;
          band_id?: string | null;
          shift_id?: string | null;
          manager_user_id?: string | null;
          reading_type?: ReadingType | null;
          captured_at?: string | null;
          work_date?: string | null;
          plant_id?: string | null;
          region_id?: string | null;
          work_area_id?: string | null;
          working_day_index?: number | null;
          image_storage_path?: string | null;
          patch_a_rgb?: Json | null;
          patch_b_rgb?: Json | null;
          patch_c_rgb?: Json | null;
          patch_a_lab?: Json | null;
          patch_b_lab?: Json | null;
          patch_c_lab?: Json | null;
          delta_e?: number | null;
          patch_c_status?: string | null;
          measurement_status?: string | null;
          confidence?: ConfidenceLevel | null;
          calibration_version_id?: string | null;
          dose_low_ppm_h?: number | null;
          dose_high_ppm_h?: number | null;
          saturation_detected?: boolean | null;
          out_of_range?: boolean | null;
          reasons?: Json | null;
          created_at?: string | null;
        };
      };
      exposure_daily: {
        Row: {
          id: string;
          company_id: string | null;
          worker_id: string;
          date: string;
          exposure_low_ppm_h: number | null;
          exposure_high_ppm_h: number | null;
          reading_count: number | null;
          shift_count: number | null;
          high_event_count: number | null;
          critical_event_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          worker_id: string;
          date: string;
          exposure_low_ppm_h?: number | null;
          exposure_high_ppm_h?: number | null;
          reading_count?: number | null;
          shift_count?: number | null;
          high_event_count?: number | null;
          critical_event_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          worker_id?: string;
          date?: string;
          exposure_low_ppm_h?: number | null;
          exposure_high_ppm_h?: number | null;
          reading_count?: number | null;
          shift_count?: number | null;
          high_event_count?: number | null;
          critical_event_count?: number | null;
          updated_at?: string | null;
        };
      };
      alerts: {
        Row: {
          id: string;
          company_id: string | null;
          worker_id: string;
          band_id: string | null;
          shift_id: string | null;
          reading_id: string | null;
          severity: AlertSeverity | null;
          rule_id: string | null;
          message: string | null;
          status: AlertStatus | null;
          requires_ack: boolean | null;
          requires_action: boolean | null;
          acknowledged_by: string | null;
          acknowledged_at: string | null;
          action_type: string | null;
          action_notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          worker_id: string;
          band_id?: string | null;
          shift_id?: string | null;
          reading_id?: string | null;
          severity?: AlertSeverity | null;
          rule_id?: string | null;
          message?: string | null;
          status?: AlertStatus | null;
          requires_ack?: boolean | null;
          requires_action?: boolean | null;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          action_type?: string | null;
          action_notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          worker_id?: string;
          band_id?: string | null;
          shift_id?: string | null;
          reading_id?: string | null;
          severity?: AlertSeverity | null;
          rule_id?: string | null;
          message?: string | null;
          status?: AlertStatus | null;
          requires_ack?: boolean | null;
          requires_action?: boolean | null;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          action_type?: string | null;
          action_notes?: string | null;
          created_at?: string | null;
        };
      };
      calibration_versions: {
        Row: {
          id: string;
          company_id: string | null;
          version_label: string;
          chemistry_version: string | null;
          batch_scope: string | null;
          status: CalibrationStatus | null;
          valid_from: string | null;
          valid_until: string | null;
          created_by: string | null;
          created_at: string | null;
          notes: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          version_label: string;
          chemistry_version?: string | null;
          batch_scope?: string | null;
          status?: CalibrationStatus | null;
          valid_from?: string | null;
          valid_until?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          notes?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          version_label?: string;
          chemistry_version?: string | null;
          batch_scope?: string | null;
          status?: CalibrationStatus | null;
          valid_from?: string | null;
          valid_until?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          notes?: string | null;
          metadata?: Json | null;
        };
      };
      calibration_points: {
        Row: {
          id: string;
          calibration_version_id: string;
          delta_e: number;
          dose_low_ppm_h: number;
          dose_high_ppm_h: number;
          sequence: number | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          calibration_version_id: string;
          delta_e: number;
          dose_low_ppm_h: number;
          dose_high_ppm_h: number;
          sequence?: number | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          calibration_version_id?: string;
          delta_e?: number;
          dose_low_ppm_h?: number;
          dose_high_ppm_h?: number;
          sequence?: number | null;
          metadata?: Json | null;
        };
      };
    };
    Functions: {
      get_manager_stats: {
        Args: {
          company_id: string;
        };
        Returns: {
          active_workers: number;
          active_bands: number;
          active_shifts: number;
          readings_today: number;
          open_alerts: number;
        }[];
      };
      get_worker_exposure: {
        Args: {
          target_worker_id: string;
        };
        Returns: {
          today_low: number;
          today_high: number;
          week_low: number;
          week_high: number;
          month_low: number;
          month_high: number;
          long_term_low: number;
          long_term_high: number;
        }[];
      };
    };
  };
}

// Domain Entity Convenience Types
export type Company = Database['public']['Tables']['companies']['Row'];
export type UserProfile = Database['public']['Tables']['users']['Row'];
export type Worker = Database['public']['Tables']['workers']['Row'];
export type Band = Database['public']['Tables']['bands']['Row'];
export type Shift = Database['public']['Tables']['shifts']['Row'];
export type Reading = Database['public']['Tables']['readings']['Row'];
export type ExposureDaily = Database['public']['Tables']['exposure_daily']['Row'];
export type Alert = Database['public']['Tables']['alerts']['Row'];
export type CalibrationVersion = Database['public']['Tables']['calibration_versions']['Row'];
export type CalibrationPoint = Database['public']['Tables']['calibration_points']['Row'];

export interface WorkerExposureSummary {
  today_low: number;
  today_high: number;
  week_low: number;
  week_high: number;
  month_low: number;
  month_high: number;
  long_term_low: number;
  long_term_high: number;
}

export interface ManagerStatsSummary {
  active_workers: number;
  active_bands: number;
  active_shifts: number;
  readings_today: number;
  open_alerts: number;
}
```

---

## 10. Frontend Client Integration Guidelines

1. **Client Initialization:**
   - In Next.js 14 App Router, initialize typed client using `createClient<Database>(supabaseUrl, supabaseAnonKey)`.
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_` env vars.
2. **TanStack Query Setup:**
   - Use declarative query keys matching resources: `['workers']`, `['bands']`, `['worker-exposure', workerId]`, `['manager-stats', companyId]`.
   - On mutations (e.g. creating worker, issuing band, recording scan), trigger `queryClient.invalidateQueries`.
3. **Realtime Channels:**
   - Subscribe within `useEffect` or custom React hooks with proper cleanup (`supabase.removeChannel(channel)`).
   - Filter real-time streams by tenant `company_id` or user `worker_id` to minimize client message traffic.
4. **Offline / Demo Mode Compatibility:**
   - Provide graceful fallback mocks if `process.env.NEXT_PUBLIC_SUPABASE_URL` is unconfigured or offline during initial UI development, maintaining type safety with the `Database` interfaces.

---
