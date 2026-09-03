# Milestone M2: Supabase Schema Interfaces, Client & Auth / Demo Layer
## Architectural Design & Implementation Blueprint

**Document Version:** 1.0.0  
**Target Milestone:** M2 (Supabase Data Models, Query Layer & Demo Auth)  
**Author:** Explorer M2 (Architecture & Systems Analysis)  
**Status:** READY FOR IMPLEMENTATION  

---

## 1. Executive Summary & Architectural Scope

Milestone M2 establishes the foundational data, telemetry, and authentication infrastructure for the **H₂S Industrial Safety & Exposure Monitoring Platform**. It bridges the raw Next.js 14 App Router bootstrap (M1) with the subsequent UI and Chemistry engines (M3, M4, M5).

### Core Responsibilities of M2:
1. **Authoritative Type Contracts (`src/types/database.ts`, `src/types/domain.ts`)**: Exact TypeScript definitions for all 10 PostgreSQL tables, custom enums, and database RPC stored procedures (`get_manager_stats`, `get_worker_exposure`).
2. **Resilient Supabase Client Layer (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`)**: Zero-crash browser and server client initialization that gracefully handles missing environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) or offline execution.
3. **High-Fidelity Mock & Demo Layer (`src/lib/supabase/mockData.ts`)**: Complete, realistic seed datasets for multi-tenant organizations (`Apex Refining Ltd.`), wristbands across 5-day lifecycle stages, optical readings with CIE Lab / $\Delta E$ calculations, active safety alerts, and simulation RPCs.
4. **Auth Context & Instant Demo Role Switcher (`src/context/AuthContext.tsx`, `src/hooks/useAuth.ts`, `src/components/layout/RoleSwitcher.tsx`)**: Unified authentication state machine supporting real Supabase JWT sessions and instant zero-latency role switching (`WORKER`, `SHIFT_MANAGER`, `CONTROL_ROOM_MANAGER`, `ADMIN`) with `localStorage` persistence.
5. **Next.js 14 App Router Provider Integration (`src/app/layout.tsx`, `src/components/providers/QueryProvider.tsx`)**: Clean provider hierarchy uniting TanStack Query v5, AuthContext, and Sonner dark-themed industrial toast notifications.

---

## 2. Comprehensive Type Definitions

### 2.1. `src/types/database.ts` (PostgreSQL / Supabase Schema)
This file represents the exact database schema contract matching Supabase PostgreSQL 15+.

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
```

### 2.2. `src/types/domain.ts` (Domain Entities & Enums)

```typescript
import { Database, UserRole, BandStatus, ShiftStatus, ReadingType, ConfidenceLevel, AlertSeverity, AlertStatus, CalibrationStatus } from './database';

export * from './database';

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

export type ExposureZone = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

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

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  workerId?: string;
  workerCode?: string;
  department?: string;
  designation?: string;
  avatarInitials: string;
  defaultRoute: string;
  description: string;
}
```

---

## 3. Resilient Supabase Client & Server Initialization

### 3.1. Browser Client (`src/lib/supabase/client.ts`)
A browser-side client that does NOT throw errors if environment variables are missing during automated test runs or build time.

```typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

const DEFAULT_DUMMY_URL = 'https://placeholder-instance.supabase.co';
const DEFAULT_DUMMY_KEY = 'sb_publishable_placeholder_dummy_key_for_offline_and_testing';

export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    url.trim() !== '' &&
    !url.includes('placeholder') &&
    key.trim() !== '' &&
    !key.includes('placeholder')
  );
};

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_DUMMY_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_DUMMY_KEY;

  browserClient = createBrowserClient<Database>(url, anonKey);
  return browserClient;
}

export const supabase = getSupabaseBrowserClient();
```

### 3.2. Server Client (`src/lib/supabase/server.ts`)
For Server Components, Route Handlers, and Server Actions with cookies integration:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

const DEFAULT_DUMMY_URL = 'https://placeholder-instance.supabase.co';
const DEFAULT_DUMMY_KEY = 'sb_publishable_placeholder_dummy_key_for_offline_and_testing';

export async function createSupabaseServerClient() {
  const cookieStore = cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_DUMMY_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_DUMMY_KEY;

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Component read-only cookie context: safely ignored
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        } catch {
          // Server Component read-only cookie context: safely ignored
        }
      },
    },
  });
}
```

### 3.3. Legacy Alias File (`src/lib/supabase.ts`)
Re-export from `src/lib/supabase/client.ts` to ensure 100% backward compatibility for all existing imports.

```typescript
export * from './supabase/client';
```

---

## 4. Comprehensive Mock Dataset & Simulated RPC Layer

File: `src/lib/supabase/mockData.ts`

### 4.1. Structure of Mock Data
1. **Mock Company:** `MOCK_COMPANY` (Apex Refining Ltd., code `APEX-REF`)
2. **Demo Profiles (`MOCK_DEMO_USERS`):**
   - `WORKER`: "Rajesh Kumar", ID `w-001`, `worker@apexrefining.com`, Coker Unit Field Tech.
   - `SHIFT_MANAGER`: "Sarah Jenkins", `manager@apexrefining.com`, Shift Lead - Coker & Sulfur Units.
   - `CONTROL_ROOM_MANAGER`: "Vikram Patel", `control@apexrefining.com`, Plant Operations Safety Officer.
   - `ADMIN`: "Dr. Elena Rostova", `admin@apexrefining.com`, Chief Safety Officer & Chemist.
3. **Mock Workforce (`MOCK_WORKERS`):** 10 active/on-leave workers across Coker, Sulfur Recovery, Hydrocracker, Alkylation, Flare Header departments.
4. **Mock Smart Bands (`MOCK_BANDS`):** 8 bands covering Day 1, Day 3, Day 5 (Warning/Expiry), and Retired states with realistic cumulative doses ($0.4 \dots 14.8\text{ ppm}\cdot\text{h}$).
5. **Mock Shifts (`MOCK_SHIFTS`):** Active and completed shifts linked to workers and shift managers.
6. **Mock Readings (`MOCK_READINGS`):** Optical scans with Patch A (control reference), Patch B (blank control), Patch C (expiry anthocyanin), calculated $\Delta E$ values ($4.2 \dots 28.5$), and confidence levels.
7. **Mock Daily Exposures (`MOCK_EXPOSURES`):** Historical 30-day exposure records.
8. **Mock Alerts (`MOCK_ALERTS`):** Real-time alerts (CRITICAL, HIGH, ELEVATED, NORMAL) with acknowledged/open statuses.
9. **Mock Calibration Data (`MOCK_CALIBRATION_VERSION`, `MOCK_CALIBRATION_POINTS`):** 12 interpolation reference points mapping $\Delta E \to ppm\cdot h$.

### 4.2. Simulated RPC Functions
- `getMockManagerStats(companyId?: string): ManagerStatsSummary`
  - Returns `{ active_workers: 8, active_bands: 6, active_shifts: 5, readings_today: 14, open_alerts: 2 }`
- `getMockWorkerExposure(workerId?: string): WorkerExposureSummary`
  - Returns realistic exposure ranges:
    - Today: `1.2 – 2.8 ppm·h`
    - Week: `8.5 – 12.4 ppm·h`
    - Month: `32.0 – 44.5 ppm·h`
    - Long-Term: `148.0 – 192.0 ppm·h`

---

## 5. Auth Context & Demo Mode Layer

### 5.1. `src/context/AuthContext.tsx`
Unified State Machine for Live Supabase Auth + Instant Role Switching Demo Mode.

#### State Signature:
```typescript
interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: UserProfile | null;
  worker: Worker | null;
  company: Company | null;
  role: UserRole | null;
  isDemoMode: boolean;
  demoRole: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Actions
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  toggleDemoMode: (enabled?: boolean) => void;
  loginWithDemo: (role: UserRole) => void;
}
```

#### Core Logic Features:
1. **Hydration & Persistence**:
   - Reads `localStorage.getItem('h2s_demo_mode')` and `localStorage.getItem('h2s_demo_role')` on client mount.
   - If not authenticated and Supabase is not configured or in demo mode, initializes immediately with `MOCK_DEMO_USERS['SHIFT_MANAGER']` or `WORKER`.
2. **Instant Role Switching**:
   - `switchDemoRole(newRole)` updates `demoRole`, `user`, `profile`, `worker`, and stores `h2s_demo_role = newRole` synchronously.
   - Zero network delay.
3. **Live Supabase Sync**:
   - In Live Mode (`isDemoMode === false`), listens to `supabase.auth.onAuthStateChange`.
   - Fetches user profile from `public.users` and linked worker record from `public.workers`.
4. **Seamless Logout**:
   - Signs out of Supabase auth and resets session state safely.

### 5.2. `src/hooks/useAuth.ts`
Custom hook providing role checks and access helpers:

```typescript
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import type { UserRole } from '@/types/database';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }

  const isWorker = context.role === 'WORKER';
  const isManager = context.role === 'SHIFT_MANAGER';
  const isControlRoom = context.role === 'CONTROL_ROOM_MANAGER';
  const isAdmin = context.role === 'ADMIN';

  const hasRole = (allowedRoles: UserRole[]) => {
    if (!context.role) return false;
    return allowedRoles.includes(context.role);
  };

  return {
    ...context,
    isWorker,
    isManager,
    isControlRoom,
    isAdmin,
    hasRole,
  };
}
```

### 5.3. `src/components/layout/RoleSwitcher.tsx`
A floating UI widget allowing hackathon evaluators / users to toggle roles and see changes in real-time across any page.

Features:
- Pill indicator: `Demo Mode: ON / OFF`
- Role badge selector: `[Worker] [Manager] [Control Room] [Admin]`
- Instant dashboard navigation button: `Go to Dashboard →` (routes to `/worker`, `/manager`, `/control-room`)

---

## 6. Provider Hierarchy & Layout Integration

### 6.1. `src/components/providers/QueryProvider.tsx` / `src/components/Providers.tsx`
Unify provider setup with:
1. `QueryClientProvider` (configured with `staleTime: 30_000`, `retry: 1`, `refetchOnWindowFocus: false`)
2. `AuthProvider`
3. `Toaster` from `sonner` with dark industrial styling
4. Optional persistent `RoleSwitcher` floating widget

```tsx
"use client";

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster position="top-right" theme="dark" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### 6.2. `src/app/layout.tsx`
RootLayout encapsulates `<Providers>` cleanly with dark mode class and Inter font variables.

---

## 7. Data Access & Query Hooks Design (M2 Foundation for M4/M5)

To prepare for subsequent milestones, the query hooks should automatically switch between live Supabase queries and fallback mock datasets:

1. **`useWorkers(companyId?: string)`**:
   - Checks `isDemoMode` or `!isSupabaseConfigured()`.
   - If demo: returns `MOCK_WORKERS`.
   - If live: queries `supabase.from('workers').select('*').order('created_at', { ascending: false })`.
2. **`useWorkerExposure(workerId?: string)`**:
   - If demo: returns `getMockWorkerExposure(workerId)`.
   - If live: calls `supabase.rpc('get_worker_exposure', { target_worker_id: workerId })`.
3. **`useManagerStats(companyId?: string)`**:
   - If demo: returns `getMockManagerStats(companyId)`.
   - If live: calls `supabase.rpc('get_manager_stats', { company_id: companyId })`.
4. **`useAlerts(companyId?: string)`**:
   - If demo: returns `MOCK_ALERTS`.
   - If live: queries `supabase.from('alerts').select('*')` + subscribes to Supabase Realtime channel.

---

## 8. Step-by-Step Implementation Roadmap for Implementer

| Step | Target File | Action | Rationale |
|------|-------------|--------|-----------|
| 1 | `src/types/database.ts` | Create file with full Database schema types | Required by `@supabase/supabase-js` and query hooks |
| 2 | `src/types/domain.ts` | Create domain entities & enum aliases | Clean developer ergonomics |
| 3 | `src/lib/supabase/client.ts` | Create browser client with fallback safety | Zero crash when env vars missing |
| 4 | `src/lib/supabase/server.ts` | Create server client with cookie safety | Next.js 14 SSR readiness |
| 5 | `src/lib/supabase.ts` | Re-export client.ts | Backward compatibility |
| 6 | `src/lib/supabase/mockData.ts` | Author rich seed data & mock RPCs | Seamless offline & demo operation |
| 7 | `src/context/AuthContext.tsx` | Implement unified Auth + Demo Provider | Instant role switching & session sync |
| 8 | `src/hooks/useAuth.ts` | Implement auth helper hook | Role checks & actions |
| 9 | `src/components/layout/RoleSwitcher.tsx` | Create floating demo role switcher widget | Easy evaluator exploration |
| 10 | `src/components/Providers.tsx` | Wrap with AuthProvider & QueryClient | App-wide availability |
| 11 | `src/__tests__/auth/useAuth.test.tsx` | Unit tests for AuthContext and Role Switcher | Test suite verification |

---

## 9. Edge Cases & Resilience Strategies

| Scenario | Risk | Mitigation |
|----------|------|------------|
| Missing `.env.local` or invalid URL | App crashes during build or initial page load | `client.ts` falls back to placeholder URL and mock anon key without throwing |
| Unauthenticated user opens `/manager` in demo mode | Empty page or crash | AuthContext automatically supplies `SHIFT_MANAGER` mock identity |
| Offline / Network disconnection | RPC fails | Query hooks catch Supabase network error and seamlessly return mock stats with warning toast |
| Role switch during active form edit | State mismatch | Context cleanly updates `user`, `role`, and `worker` synchronously, triggering re-render without page reload |
| LocalStorage disabled (incognito / restrictions) | Exception on `localStorage.setItem` | Safe try/catch wrappers around all `localStorage` access |

---

## 10. Verification & Test Plan

1. **Type Checking**:
   - Run `npx tsc --noEmit` to verify type safety of all 10 tables, RPC definitions, and domain entities.
2. **Jest Unit Tests**:
   - `src/__tests__/auth/AuthContext.test.tsx`: Test `loginWithDemo`, `switchDemoRole`, `toggleDemoMode`, and `useAuth` hook.
   - `src/__tests__/supabase/client.test.ts`: Verify `isSupabaseConfigured()` and fallback client initialization.
   - `src/__tests__/supabase/mockData.test.ts`: Validate mock datasets adhere to TypeScript domain types.
3. **Browser Smoke Check**:
   - Verify role switching updates UI across `/worker`, `/manager`, and `/control-room`.
