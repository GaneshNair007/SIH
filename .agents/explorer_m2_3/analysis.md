# Technical Analysis & Architecture Plan: TanStack Query Hooks & Data Access Layer (Milestone M2)

**Document Version:** 1.0.0  
**Project:** H₂S Industrial Safety & Exposure Monitoring Platform  
**Target Milestone:** M2 (Data Access Layer, Query/Mutation Hooks, Mock Store & Realtime Sync)  
**Author:** Explorer M2-3 (Data Layer & Query Architecture)  
**Date:** 2026-09-01  

---

## 1. Executive Overview

This report provides the complete architectural design and implementation specification for the **Data Access Layer & TanStack Query Hooks** for the H₂S Monitoring Platform.

The platform requires seamless dual-mode capability:
1. **Live Production Mode (Supabase Backend)**: Queries and mutations interact directly with PostgreSQL via `@supabase/supabase-js`, enforcing multi-tenant Row Level Security (RLS), calling RPC functions (`get_manager_stats`, `get_worker_exposure`), and subscribing to logical replication channels.
2. **Interactive Demo / Offline Mode (LocalStorage Mock Store)**: For hackathon presentations, test runners, or offline fieldwork, the entire relational dataset resides in a persistent, reactive client-side store (`localStorage`). All mutations (worker registration, band assignments, optical shift scans with $\Delta E$ calculations, and alert acknowledgments) instantly update the state, trigger event-driven cache invalidations, and persist across browser reloads.

To achieve this without duplicating UI logic or introducing conditional spaghetti across components, we design a **Unified Data Access Layer (Service Layer Abstraction)** with typed **TanStack Query v5 Hooks** providing caching, optimistic updates, background refetching, and real-time synchronization.

---

## 2. Architectural Blueprint & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              REACT UI COMPONENTS                                │
│   (Manager Roster, Scan Simulator, Worker Portal, Control Room Console, Toasts) │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                   ┌─────────────────────▼─────────────────────┐
                   │    TANSTACK QUERY HOOKS (React Query v5)  │
                   │  - useWorkers       - useRegisterWorker   │
                   │  - useExposures     - useAssignBand       │
                   │  - useAlerts        - useStartShift       │
                   │  - useManagerStats  - useEndShift         │
                   │  - useRealtime      - useAcknowledgeAlert │
                   └─────────────────────┬─────────────────────┘
                                         │
                   ┌─────────────────────▼─────────────────────┐
                   │        UNIFIED DATA ACCESS SERVICE        │
                   │         (src/lib/dataService.ts)          │
                   │  • Auto-detects Supabase vs Demo Mode     │
                   │  • Encapsulates Colorimetry & Math        │
                   └──────────┬─────────────────────┬──────────┘
                              │                     │
       ┌──────────────────────▼───────┐     ┌───────▼──────────────────────────┐
       │   SUPABASE POSTGRES BACKEND  │     │   REACTIVE LOCAL MOCK STORE      │
       │   • 10 PostgreSQL Tables     │     │   • In-Memory Relational State   │
       │   • RLS Tenant Isolation     │     │   • LocalStorage Persistence     │
       │   • RPCs (stats, exposure)   │     │   • CustomEvent / Broadcast Bus  │
       │   • Realtime Channels        │     │   • Optical Calculation Engine   │
       └──────────────────────────────┘     └──────────────────────────────────┘
```

---

## 3. Query Keys Factory Specification

To eliminate magic strings, prevent stale cache collisions, and standardize invalidation scopes across all hooks, we specify a centralized Query Key Factory (`src/hooks/queryKeys.ts`):

```typescript
export const queryKeys = {
  // Workers
  workers: {
    all: ['workers'] as const,
    lists: () => [...queryKeys.workers.all, 'list'] as const,
    list: (filters?: { department?: string; status?: string; search?: string }) =>
      [...queryKeys.workers.lists(), { filters }] as const,
    details: () => [...queryKeys.workers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workers.details(), id] as const,
  },

  // Bands
  bands: {
    all: ['bands'] as const,
    lists: () => [...queryKeys.bands.all, 'list'] as const,
    list: (filters?: { status?: string }) => [...queryKeys.bands.lists(), { filters }] as const,
    byWorker: (workerId: string) => [...queryKeys.bands.all, 'worker', workerId] as const,
    byCode: (code: string) => [...queryKeys.bands.all, 'code', code] as const,
  },

  // Shifts
  shifts: {
    all: ['shifts'] as const,
    lists: () => [...queryKeys.shifts.all, 'list'] as const,
    active: (workerId?: string) => [...queryKeys.shifts.all, 'active', { workerId }] as const,
    detail: (id: string) => [...queryKeys.shifts.all, 'detail', id] as const,
    history: (workerId: string) => [...queryKeys.shifts.all, 'history', workerId] as const,
  },

  // Exposures & Readings
  exposures: {
    all: ['exposures'] as const,
    summary: (workerId: string) => [...queryKeys.exposures.all, 'summary', workerId] as const,
    daily: (workerId: string) => [...queryKeys.exposures.all, 'daily', workerId] as const,
    readings: (workerId: string) => [...queryKeys.exposures.all, 'readings', workerId] as const,
    trend: (timeRange?: string) => [...queryKeys.exposures.all, 'trend', { timeRange }] as const,
  },

  // Safety Alerts
  alerts: {
    all: ['alerts'] as const,
    list: (filters?: { status?: string; severity?: string; companyId?: string }) =>
      [...queryKeys.alerts.all, 'list', { filters }] as const,
    detail: (id: string) => [...queryKeys.alerts.all, 'detail', id] as const,
  },

  // Manager & Control Room Statistics
  stats: {
    manager: (companyId?: string) => ['manager-stats', companyId ?? 'default'] as const,
    plant: () => ['plant-kpi-stats'] as const,
  },

  // Calibration Data
  calibration: {
    active: () => ['calibration', 'active'] as const,
    points: (versionId?: string) => ['calibration', 'points', versionId ?? 'active'] as const,
  },
} as const;
```

---

## 4. Optical Chemistry & Colorimetric Computation Engine

When a Shift End scan is submitted, the Data Access Layer executes the colorimetric computation pipeline before committing records to the database/mock store:

### 4.1. Color Space Conversion (sRGB $\to$ CIE $L^*a^*b^*$)
1. **Gamma Expansion:** Convert non-linear sRGB values ($[0, 255]$) to linear RGB ($[0, 1]$):
   $$C_{\text{linear}} = \begin{cases} \frac{C_{\text{srgb}}}{12.92} & \text{if } C_{\text{srgb}} \le 0.04045 \\ \left(\frac{C_{\text{srgb}} + 0.055}{1.055}\right)^{2.4} & \text{if } C_{\text{srgb}} > 0.04045 \end{cases}$$
2. **Linear RGB $\to$ CIE XYZ (Standard D65 Illuminant):**
   $$\begin{bmatrix} X \\ Y \\ Z \end{bmatrix} = \begin{bmatrix} 0.4124564 & 0.3575761 & 0.1804375 \\ 0.2126729 & 0.7151522 & 0.0721750 \\ 0.0193339 & 0.1191920 & 0.9503041 \end{bmatrix} \begin{bmatrix} R_{\text{linear}} \\ G_{\text{linear}} \\ B_{\text{linear}} \end{bmatrix}$$
   Using reference white $X_n = 0.95047, Y_n = 1.00000, Z_n = 1.08883$.
3. **CIE XYZ $\to$ CIE $L^*a^*b^*$:**
   $$f(t) = \begin{cases} t^{1/3} & \text{if } t > \left(\frac{6}{29}\right)^3 \\ \frac{1}{3}\left(\frac{29}{6}\right)^2 t + \frac{4}{29} & \text{otherwise} \end{cases}$$
   $$L^* = 116 f(Y / Y_n) - 16, \quad a^* = 500 [f(X / X_n) - f(Y / Y_n)], \quad b^* = 200 [f(Y / Y_n) - f(Z / Z_n)]$$

### 4.2. Color Distance Metric ($\Delta E$)
$$\Delta E_{ab}^* = \sqrt{(L^* - L_0^*)^2 + (a^* - a_0^*)^2 + (b^* - b_0^*)^2}$$
Where $(L_0^*, a_0^*, b_0^*)$ is the baseline reading from Shift Start, and $(L^*, a^*, b^*)$ is the Shift End reading.

### 4.3. Calibration Interpolation ($\Delta E \to [\text{Dose}_{\text{low}}, \text{Dose}_{\text{high}}]$)
Using the active calibration points from `CAL-v1`:
- $\Delta E = 0.0 \to [0.0, 0.0]\text{ ppm}\cdot\text{h}$
- $\Delta E = 3.5 \to [0.5, 1.2]\text{ ppm}\cdot\text{h}$
- $\Delta E = 8.2 \to [2.0, 3.8]\text{ ppm}\cdot\text{h}$
- $\Delta E = 15.0 \to [5.0, 8.5]\text{ ppm}\cdot\text{h}$
- $\Delta E = 25.0 \to [10.0, 18.0]\text{ ppm}\cdot\text{h}$
- $\Delta E = 38.0 \to [20.0, 35.0]\text{ ppm}\cdot\text{h}$

Piecewise linear interpolation yields the exact exposure dose interval. If $\Delta E > 38.0$, `saturation_detected = true`, `out_of_range = true`, and dose is clamped to $[20.0, 35.0+]$.

### 4.4. Confidence & Zone Evaluation
- **Confidence Rating**:
  - `HIGH`: Baseline reference checks within tolerance ($\Delta E_{\text{ref}} < 2.0$), no saturation, valid expiry patch.
  - `MEDIUM`: Slight lighting variance ($\Delta E_{\text{ref}} \in [2.0, 4.0]$).
  - `LOW`: High lighting discrepancy ($\Delta E_{\text{ref}} > 4.0$) or near-saturation ($\Delta E > 35.0$).
  - `INVALID`: Glare/shadow anomaly, patch C expired, or strip contaminated.
- **Exposure Severity & Trigger Thresholds**:
  - `0.0 - 2.0 ppm•h`: `NORMAL` (Safe, green badge)
  - `2.1 - 5.0 ppm•h`: `ELEVATED` (Caution, yellow badge $\to$ triggers `OPEN` Alert: "Elevated H2S Exposure Detected")
  - `5.1 - 10.0 ppm•h`: `HIGH` (Warning, orange badge $\to$ triggers `OPEN` Alert: "High Exposure Ceiling Exceeded - Worker Rotation Required")
  - `> 10.0 ppm•h`: `CRITICAL` (Danger, red badge $\to$ triggers `OPEN` Alert: "CRITICAL H2S OCCUPATIONAL CEILING BREACH - MANDATORY EVACUATION")

---

## 5. Detailed Query Hooks Specification

### 5.1. `useWorkers.ts`
- **Location:** `src/hooks/useWorkers.ts`
- **Exports:**
  - `useWorkers(filters?: { department?: string; status?: string; search?: string })`
  - `useWorker(workerId: string)`
  - `useWorkerOptions()` (formatted for dropdown select)
- **Functionality:**
  - Queries `dataService.getWorkers()`.
  - Filters by department, status, or search query (name/worker_code) with client-side indexing.
  - Returns `{ data: Worker[], isLoading, isError, error, refetch }`.

```typescript
export function useWorkers(filters?: { department?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: queryKeys.workers.list(filters),
    queryFn: async () => {
      const workers = await dataService.getWorkers();
      let filtered = workers;
      if (filters?.department && filters.department !== 'ALL') {
        filtered = filtered.filter(w => w.department === filters.department);
      }
      if (filters?.status && filters.status !== 'ALL') {
        filtered = filtered.filter(w => w.status === filters.status);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          w => w.full_name.toLowerCase().includes(q) || w.worker_code.toLowerCase().includes(q)
        );
      }
      return filtered;
    },
    staleTime: 30 * 1000,
  });
}
```

### 5.2. `useExposures.ts`
- **Location:** `src/hooks/useExposures.ts`
- **Exports:**
  - `useWorkerExposure(workerId?: string)`: Rolling 4-tier exposure range (Today, Week, Month, Lifetime).
  - `useDailyExposures(workerId?: string, limit?: number)`: History of daily records.
  - `useWorkerReadings(workerId?: string)`: Raw optical scan logs.
  - `usePlantExposureTrend()`: Time-series aggregate trend data for Control Room chart.
- **Functionality:**
  - Calls `dataService.getWorkerExposure(workerId)` (executes Supabase RPC `get_worker_exposure` or local aggregation).
  - Returns `WorkerExposureSummary` with default fallback $\{0, 0\}$.

```typescript
export function useWorkerExposure(workerId?: string) {
  return useQuery({
    queryKey: queryKeys.exposures.summary(workerId || ''),
    enabled: !!workerId,
    queryFn: async () => {
      if (!workerId) return null;
      return await dataService.getWorkerExposure(workerId);
    },
    staleTime: 15 * 1000,
  });
}
```

### 5.3. `useAlerts.ts`
- **Location:** `src/hooks/useAlerts.ts`
- **Exports:**
  - `useAlerts(filters?: { status?: AlertStatus; severity?: AlertSeverity })`
  - `useActiveAlertsCount()`
- **Functionality:**
  - Fetches all plant safety alerts, enriched with worker details (`worker_name`, `worker_code`, `department`).
  - Sorts active alerts first (`status = 'OPEN'`), then by `created_at` descending.

```typescript
export function useAlerts(filters?: { status?: AlertStatus; severity?: AlertSeverity }) {
  return useQuery({
    queryKey: queryKeys.alerts.list(filters),
    queryFn: async () => {
      const alerts = await dataService.getAlerts();
      let result = alerts;
      if (filters?.status) {
        result = result.filter(a => a.status === filters.status);
      }
      if (filters?.severity) {
        result = result.filter(a => a.severity === filters.severity);
      }
      return result;
    },
    staleTime: 10 * 1000,
  });
}
```

### 5.4. `useManagerStats.ts`
- **Location:** `src/hooks/useManagerStats.ts`
- **Exports:**
  - `useManagerStats(companyId?: string)`
- **Functionality:**
  - Calls Supabase RPC `get_manager_stats(company_id)` or computes live summary from mock store.
  - Returns `ManagerStatsSummary` (`active_workers`, `active_bands`, `active_shifts`, `readings_today`, `open_alerts`).

```typescript
export function useManagerStats(companyId?: string) {
  return useQuery({
    queryKey: queryKeys.stats.manager(companyId),
    queryFn: async () => {
      return await dataService.getManagerStats(companyId);
    },
    staleTime: 15 * 1000,
  });
}
```

### 5.5. `useRealtime.ts`
- **Location:** `src/hooks/useRealtime.ts`
- **Exports:**
  - `useRealtimeSubscriptions(options: { workerId?: string; companyId?: string })`
- **Functionality:**
  - **Supabase Realtime Mode:** Establishes Postgres logical replication channels on `exposure_daily`, `alerts`, `shifts`, `workers`.
  - **Demo Mock Mode:** Attaches `window.addEventListener('h2s_store_updated')` and `storage` event listeners.
  - Automatically invokes `queryClient.invalidateQueries` for matching keys upon any data change.
  - Automatically triggers `toast.warning()` or `toast.error()` via Sonner for newly received high/critical alerts.

```typescript
export function useRealtimeSubscriptions({ workerId, companyId }: { workerId?: string; companyId?: string } = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Local Mock Store Event Listener
    const handleStoreUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: string; payload?: any }>;
      const { type } = customEvent.detail || {};

      queryClient.invalidateQueries({ queryKey: queryKeys.workers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bands.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.exposures.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.manager() });

      if (type === 'ALERT_TRIGGERED') {
        const alert = customEvent.detail.payload;
        if (alert?.severity === 'CRITICAL') {
          toast.error(`CRITICAL ALERT: ${alert.message}`);
        } else if (alert?.severity === 'HIGH' || alert?.severity === 'ELEVATED') {
          toast.warning(`Safety Alert: ${alert.message}`);
        }
      }
    };

    window.addEventListener('h2s_store_updated', handleStoreUpdate);

    // 2. Supabase Realtime Channels (if Supabase is active)
    let channels: any[] = [];
    if (dataService.isSupabaseActive()) {
      const channel = dataService.subscribeRealtime({
        workerId,
        companyId,
        onExposureChange: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.exposures.all });
          toast.info("New exposure data received");
        },
        onAlertChange: (alert) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.stats.manager() });
          toast.error(`Plant Alert: ${alert.message}`);
        },
        onRosterChange: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.workers.all });
        }
      });
      if (channel) channels.push(channel);
    }

    return () => {
      window.removeEventListener('h2s_store_updated', handleStoreUpdate);
      channels.forEach(ch => dataService.unsubscribeRealtime(ch));
    };
  }, [queryClient, workerId, companyId]);
}
```

---

## 6. Detailed Mutation Hooks Specification

### 6.1. `useRegisterWorker`
- **Hook:** `useRegisterWorker()`
- **Input Type:**
  ```typescript
  export interface RegisterWorkerInput {
    worker_code: string;
    full_name: string;
    department?: string;
    designation?: string;
    phone?: string;
    email?: string;
    employee_hr_id?: string;
    plant_id?: string;
  }
  ```
- **Lifecycle & Execution:**
  1. Validates input via Zod schema.
  2. Dispatches `dataService.registerWorker(input)`.
  3. `onSuccess`: Invalidates `queryKeys.workers.all` and `queryKeys.stats.manager()`.
  4. Triggers `toast.success("Worker registered successfully!")`.

### 6.2. `useAssignBand`
- **Hook:** `useAssignBand()`
- **Input Type:**
  ```typescript
  export interface AssignBandInput {
    worker_id: string;
    band_code: string;
    batch_id?: string;
    qr_payload?: string;
  }
  ```
- **Lifecycle & Execution:**
  1. Verifies band is not already active on another worker or retired.
  2. Links band to worker, sets `status = 'ACTIVE'`, `working_day_count = 1`, `issued_at = NOW()`.
  3. Updates worker profile state.
  4. `onSuccess`: Invalidates `queryKeys.bands.all`, `queryKeys.workers.all`, `queryKeys.stats.manager()`.
  5. Triggers `toast.success("Wristband assigned successfully!")`.

### 6.3. `useStartShift`
- **Hook:** `useStartShift()`
- **Input Type:**
  ```typescript
  export interface StartShiftInput {
    worker_id: string;
    band_id: string;
    manager_user_id?: string;
    plant_id?: string;
    work_area_id?: string;
    baseline_patch_a_rgb: RgbColor; // Reference Patch A (Control)
    baseline_patch_b_rgb: RgbColor; // Reference Patch B (Control)
    baseline_patch_c_rgb: RgbColor; // Active Reactive Patch
    image_storage_path?: string;
  }
  ```
- **Lifecycle & Execution:**
  1. Computes baseline CIE Lab values for Patch A, B, C.
  2. Creates a new START reading (`reading_type = 'START'`).
  3. Creates a new active shift (`status = 'ACTIVE'`, `start_reading_id = reading.id`, `started_at = NOW()`).
  4. `onSuccess`: Invalidates `queryKeys.shifts.all`, `queryKeys.workers.all`, `queryKeys.stats.manager()`.
  5. Triggers `toast.success("Shift started with baseline scan captured.")`.

### 6.4. `useEndShift` (Full Optical Math & Alert Integration)
- **Hook:** `useEndShift()`
- **Input Type:**
  ```typescript
  export interface EndShiftInput {
    shift_id: string;
    final_patch_a_rgb: RgbColor;
    final_patch_b_rgb: RgbColor;
    final_patch_c_rgb: RgbColor;
    image_storage_path?: string;
    notes?: string;
  }
  ```
- **Execution Flow Diagram:**

```
[Scan Camera / Form Input]
            │
            ▼
[Convert RGB -> CIE Lab for Patches A, B, C]
            │
            ▼
[Retrieve Shift's Baseline START Reading]
            │
            ▼
[Calculate Delta E: sqrt((L - L0)^2 + (a - a0)^2 + (b - b0)^2)]
            │
            ▼
[Interpolate Delta E against CAL-v1 Curve -> [dose_low, dose_high] ppm·h]
            │
            ▼
[Evaluate Patch C Degradation & Control Patches -> Confidence (HIGH/MED/LOW/INV)]
            │
            ▼
[Determine Exposure Zone: NORMAL | ELEVATED | HIGH | CRITICAL]
            │
            ▼
[Execute Atomic Updates:]
  1. Insert END Reading in `readings` table
  2. Update `shifts` record (ended_at, status='COMPLETED', doses, confidence)
  3. Update `bands` record (working_day_count++, accumulate doses, retire if >=5)
  4. Upsert `exposure_daily` record for worker on today's date
  5. If Zone != NORMAL: Insert new record into `alerts` table (status='OPEN')
            │
            ▼
[Invalidate TanStack Caches: shifts, workers, bands, exposures, alerts, stats]
            │
            ▼
[Display Visual Scan Results Modal & Toast Alert]
```

### 6.5. `useAcknowledgeAlert`
- **Hook:** `useAcknowledgeAlert()`
- **Input Type:**
  ```typescript
  export interface AcknowledgeAlertInput {
    alert_id: string;
    acknowledged_by?: string;
    action_type?: string;
    action_notes?: string;
  }
  ```
- **Lifecycle & Execution:**
  - Optimistic Update: Immediately changes alert `status = 'ACKNOWLEDGED'` in TanStack cache so button disables instantly without UI lag.
  - Commits change via `dataService.acknowledgeAlert()`.
  - On error: rolls back to previous cache snapshot and alerts user.
  - `onSuccess`: Invalidates `queryKeys.alerts.all` and `queryKeys.stats.manager()`.
  - Triggers `toast.success("Alert marked as acknowledged.")`.

---

## 7. Reactive Mock Store Architecture & LocalStorage Persistence

To provide instant reactivity without a running PostgreSQL backend, we design the **In-Memory & LocalStorage Mock State Store (`src/lib/mockStore.ts`)**.

### 7.1. Storage Keys & Initialization
- **LocalStorage Key:** `h2s_platform_store_v1`
- On startup, `mockStore` checks if `localStorage` contains saved state.
  - If present: Deserializes the JSON data into active memory.
  - If absent: Seeds the store from `mockData.ts` (12 realistic workers across 5 plant units, wristbands across all 5 lifecycle days, historical start/end scans, daily summaries, active alerts, and calibration points).

### 7.2. State Structure
```typescript
export interface MockStoreState {
  companies: Company[];
  users: UserProfile[];
  workers: Worker[];
  bands: Band[];
  shifts: Shift[];
  readings: Reading[];
  exposure_daily: ExposureDaily[];
  alerts: Alert[];
  calibration_versions: CalibrationVersion[];
  calibration_points: CalibrationPoint[];
}
```

### 7.3. Event-Driven Cache Synchronization
Whenever any mutation executes on `mockStore`:
1. The internal state is updated.
2. The entire state is serialized to `localStorage.setItem('h2s_platform_store_v1', JSON.stringify(state))`.
3. An event is dispatched:
   ```typescript
   if (typeof window !== 'undefined') {
     window.dispatchEvent(
       new CustomEvent('h2s_store_updated', {
         detail: { type: actionType, payload },
       })
     );
   }
   ```
4. All mounted `useRealtime` listeners across the browser tab receive the notification and immediately invalidate their TanStack Query caches, guaranteeing instantaneous UI updates.

---

## 8. Directory & File Implementation Map

| File Path | Purpose | Key Exports |
|---|---|---|
| `src/types/database.ts` | Complete Supabase database schema interfaces | `Database`, `Json`, `UserRole`, `BandStatus`, `ShiftStatus`, `ReadingType`, `ConfidenceLevel`, `AlertSeverity`, `AlertStatus` |
| `src/types/domain.ts` | Domain entity shortcuts & UI view models | `Worker`, `Band`, `Shift`, `Reading`, `ExposureDaily`, `Alert`, `WorkerExposureSummary`, `ManagerStatsSummary` |
| `src/lib/colorimetry.ts` | CIE Lab, $\Delta E$, interpolation, and confidence math | `calculateDeltaE()`, `rgbToLab()`, `deltaEToExposure()`, `getExposureZone()`, `evaluateConfidence()` |
| `src/lib/supabase/mockData.ts` | High-fidelity seed dataset | `seedCompanies`, `seedUsers`, `seedWorkers`, `seedBands`, `seedShifts`, `seedReadings`, `seedExposureDaily`, `seedAlerts`, `seedCalibration` |
| `src/lib/mockStore.ts` | Reactive local storage mock store | `mockStore` singleton (`getWorkers`, `registerWorker`, `startShift`, `endShift`, `acknowledgeAlert`, `resetToDefaults`) |
| `src/lib/dataService.ts` | Unified access layer routing between Supabase and Mock Store | `dataService` facade (`getWorkers`, `registerWorker`, `startShift`, `endShift`, `acknowledgeAlert`, etc.) |
| `src/hooks/queryKeys.ts` | Standardized query key factory | `queryKeys` |
| `src/hooks/useWorkers.ts` | Workforce query & registration mutations | `useWorkers`, `useWorker`, `useRegisterWorker` |
| `src/hooks/useExposures.ts` | Exposure ranges, daily logs & scan history | `useWorkerExposure`, `useDailyExposures`, `useWorkerReadings` |
| `src/hooks/useAlerts.ts` | Safety alerts query & acknowledge mutation | `useAlerts`, `useAcknowledgeAlert` |
| `src/hooks/useManagerStats.ts`| KPI aggregation queries | `useManagerStats` |
| `src/hooks/useShiftOperations.ts`| Band assignment, start & end shift optical scans | `useAssignBand`, `useStartShift`, `useEndShift` |
| `src/hooks/useRealtime.ts` | Realtime Supabase + Mock Store sync hook | `useRealtimeSubscriptions` |

---

## 9. Verification & Unit Testing Strategy

To ensure zero regressions and robust behavior across both Supabase and Mock modes:

1. **Colorimetry Math Tests (`src/__tests__/utils/colorimetry.test.ts`)**:
   - Verify $\text{RGB}(255, 255, 255) \to \text{Lab}(100, 0, 0)$.
   - Verify $\Delta E$ of identical colors is $0.0$.
   - Verify $\Delta E = 15.0$ interpolates to $[5.0, 8.5]\text{ ppm}\cdot\text{h}$.
   - Verify saturation detection when $\Delta E > 38.0$.
2. **Mock Store Mutation Tests (`src/__tests__/utils/mockStore.test.ts`)**:
   - Register worker $\to$ verify stored and returned in `getWorkers()`.
   - Start shift $\to$ end shift with $\Delta E = 18.0 \to$ verify shift completed, daily exposure updated, and `HIGH` alert created.
   - Acknowledge alert $\to$ verify status transitions to `ACKNOWLEDGED`.
3. **Hook Rendering Tests (`src/__tests__/hooks/useWorkers.test.tsx`, `useShiftOperations.test.tsx`)**:
   - Render hooks wrapped in `QueryClientProvider` and test data retrieval and optimistic mutations.

---

## 10. Summary & Implementer Action Plan

1. **Step 1:** Establish `src/types/database.ts` and `src/types/domain.ts` matching 10 tables and colorimetric types.
2. **Step 2:** Implement `src/lib/colorimetry.ts` containing pure mathematical color conversions, $\Delta E$, curve interpolation, and exposure zone classifiers.
3. **Step 3:** Implement `src/lib/supabase/mockData.ts` with complete realistic multi-department plant records.
4. **Step 4:** Implement `src/lib/mockStore.ts` with `localStorage` synchronization and event dispatching.
5. **Step 5:** Implement `src/lib/dataService.ts` bridging Supabase and Mock Store.
6. **Step 6:** Implement `src/hooks/queryKeys.ts` and all hook modules (`useWorkers.ts`, `useExposures.ts`, `useAlerts.ts`, `useManagerStats.ts`, `useShiftOperations.ts`, `useRealtime.ts`).
7. **Step 7:** Verify test suite passes with `npm test`.
