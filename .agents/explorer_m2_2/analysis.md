# Architectural & Implementation Specification: Supabase Schema Interfaces & High-Fidelity Mock Dataset (Milestone M2)

**Target Files:**
- `src/types/database.ts` — Authoritative Supabase PostgREST database types matching all 10 PostgreSQL tables & RPC functions
- `src/types/domain.ts` — Rich domain types, colorimetric physics models, enums, DTOs, and view models
- `src/lib/supabase/mockData.ts` — Comprehensive in-memory relational mock dataset & offline query accessors
- `src/lib/supabase/client.ts` — Typed browser Supabase client with offline/demo resilience
- `src/lib/supabase/server.ts` — Typed server Supabase client for Next.js 14 App Router

---

## 1. Executive Summary & Scope

Milestone M2 establishes the foundational data layer for the **H₂S Passive Cumulative Exposure Monitoring Platform**. The platform integrates optical chemical wristband sensors ($0.5\text{ wt\% } SbCl_3 + 4\text{ wt\% Anthocyanin}$) with mobile scanning and industrial safety dashboards.

This specification provides:
1. **Zero-Drift Database Typing (`src/types/database.ts`)**: Exact 1:1 mapping with the 10 PostgreSQL tables, 2 analytical RPC functions (`get_manager_stats`, `get_worker_exposure`), and PostgreSQL enums/check constraints discovered in the database schema.
2. **Domain & Colorimetric Physics Typing (`src/types/domain.ts`)**: Type-safe domain models for CIE Lab $\Delta E$ calculations, RGB/Lab patch analysis, 5-day lifecycle tracking, multi-tenant role-based access control (RBAC), and UI-enriched DTOs (`EnrichedWorker`, `EnrichedShift`, `EnrichedAlert`).
3. **High-Fidelity Mock Dataset (`src/lib/supabase/mockData.ts`)**: A fully relational, multi-tenant dataset representing an industrial petrochemical facility (**Apex Petrochemical Refining**, `APEX-01`), populated with:
   - 4 primary role users: **Rajesh Kumar** (Worker), **Vikram Singh** (Shift Manager), **Ananya Sharma** (Control Room Manager), **Admin Super** (Admin).
   - 12 realistic workers across 5 core departments: *Refinery Unit 4, Alkylation Unit, Wastewater Treatment, Tank Farm, Sulfur Recovery Unit (SRU)*.
   - 12 smart wristbands spanning the entire 5-day lifecycle (Day 1 fresh $\to$ Day 5 expired, Retired, Warning, Compromised).
   - Active and completed shifts linked with START and END optical readings.
   - Colorimetrically authentic Patch A/B/C RGB and CIE Lab coordinates with accurate $\Delta E$ progression ($0.0 \to 54.8$) and corresponding dose ranges ($0.0-35.0\text{ ppm}\cdot\text{h}$).
   - 30 days of historical daily exposure summaries (`exposure_daily`) for trend charting.
   - Active critical, high, and elevated safety alerts.
   - Standard laboratory calibration batch curves (`CAL-v1-LAB2026`).
   - In-memory accessor functions for seamless offline hackathon operation and instant demo role switching.

---

## 2. PostgreSQL Schema & Database Interfaces (`src/types/database.ts`)

The database interface follows the standard `@supabase/supabase-js` type schema pattern, providing strict type definitions for `Row`, `Insert`, `Update`, `Relationships`, and `Functions`.

### 2.1. Complete `src/types/database.ts` Implementation Specification

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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "workers_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "bands_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bands_worker_id_fkey";
            columns: ["worker_id"];
            referencedRelation: "workers";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "shifts_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_worker_id_fkey";
            columns: ["worker_id"];
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_band_id_fkey";
            columns: ["band_id"];
            referencedRelation: "bands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_manager_user_id_fkey";
            columns: ["manager_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "readings_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "readings_worker_id_fkey";
            columns: ["worker_id"];
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "readings_band_id_fkey";
            columns: ["band_id"];
            referencedRelation: "bands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "readings_shift_id_fkey";
            columns: ["shift_id"];
            referencedRelation: "shifts";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "exposure_daily_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exposure_daily_worker_id_fkey";
            columns: ["worker_id"];
            referencedRelation: "workers";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "alerts_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_worker_id_fkey";
            columns: ["worker_id"];
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_acknowledged_by_fkey";
            columns: ["acknowledged_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "calibration_versions_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "calibration_points_calibration_version_id_fkey";
            columns: ["calibration_version_id"];
            referencedRelation: "calibration_versions";
            referencedColumns: ["id"];
          }
        ];
      };
    };

    Views: {
      [_ in never]: never;
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

    Enums: {
      user_role: UserRole;
      band_status: BandStatus;
      shift_status: ShiftStatus;
      reading_type: ReadingType;
      confidence_level: ConfidenceLevel;
      alert_severity: AlertSeverity;
      alert_status: AlertStatus;
      calibration_status: CalibrationStatus;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Table Row Convenience Types
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

// Insert / Update Helper Types
export type WorkerInsert = Database['public']['Tables']['workers']['Insert'];
export type WorkerUpdate = Database['public']['Tables']['workers']['Update'];
export type BandInsert = Database['public']['Tables']['bands']['Insert'];
export type BandUpdate = Database['public']['Tables']['bands']['Update'];
export type ShiftInsert = Database['public']['Tables']['shifts']['Insert'];
export type ShiftUpdate = Database['public']['Tables']['shifts']['Update'];
export type ReadingInsert = Database['public']['Tables']['readings']['Insert'];
export type AlertInsert = Database['public']['Tables']['alerts']['Insert'];
export type AlertUpdate = Database['public']['Tables']['alerts']['Update'];
```

---

## 3. Domain Models & Colorimetric Types (`src/types/domain.ts`)

The domain interface layer elevates raw PostgreSQL database primitives into high-level business entities, colorimetric physics representations, and enriched UI view models.

### 3.1. Complete `src/types/domain.ts` Implementation Specification

```typescript
import {
  UserRole,
  BandStatus,
  ShiftStatus,
  ReadingType,
  ConfidenceLevel,
  AlertSeverity,
  AlertStatus,
  CalibrationStatus,
  Company,
  UserProfile,
  Worker,
  Band,
  Shift,
  Reading,
  ExposureDaily,
  Alert,
  CalibrationVersion,
  CalibrationPoint,
} from './database';

// Re-export core enums for clean import pathways
export type {
  UserRole,
  BandStatus,
  ShiftStatus,
  ReadingType,
  ConfidenceLevel,
  AlertSeverity,
  AlertStatus,
  CalibrationStatus,
  Company,
  UserProfile,
  Worker,
  Band,
  Shift,
  Reading,
  ExposureDaily,
  Alert,
  CalibrationVersion,
  CalibrationPoint,
};

// --- Colorimetry & Chemistry Types ---

export interface RgbColor {
  r: number; // 0 to 255
  g: number; // 0 to 255
  b: number; // 0 to 255
}

export interface LabColor {
  l: number; // 0 (black) to 100 (white)
  a: number; // -128 (green) to +127 (magenta)
  b: number; // -128 (blue) to +127 (yellow)
}

export interface PatchColorSet {
  patchA: RgbColor; // Reference Patch A (White/Unreactive reference or SbCl3 control)
  patchB: RgbColor; // Reference Patch B (Light baseline / Calibration anchor)
  patchC: RgbColor; // Reactive Indicator Patch C (Anthocyanin + SbCl3 reactive zone)
}

export interface PatchLabColorSet {
  patchA: LabColor;
  patchB: LabColor;
  patchC: LabColor;
}

export type ExposureZone = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface ExposureDoseCalculation {
  deltaE: number;
  doseLowPpmH: number;
  doseHighPpmH: number;
  confidence: ConfidenceLevel;
  zone: ExposureZone;
  saturationDetected: boolean;
  outOfRange: boolean;
  notes?: string[];
}

// --- Analytical RPC Return Types ---

export interface ManagerStatsSummary {
  active_workers: number;
  active_bands: number;
  active_shifts: number;
  readings_today: number;
  open_alerts: number;
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

// --- Enriched UI / Presentation DTO Types ---

export interface EnrichedWorker extends Worker {
  currentBand?: Band | null;
  activeShift?: Shift | null;
  todayExposure?: ExposureDaily | null;
  latestAlert?: Alert | null;
  exposureSummary?: WorkerExposureSummary | null;
}

export interface EnrichedShift extends Shift {
  worker?: Worker | null;
  band?: Band | null;
  manager?: UserProfile | null;
  startReading?: Reading | null;
  endReading?: Reading | null;
}

export interface EnrichedAlert extends Alert {
  worker?: Worker | null;
  band?: Band | null;
  shift?: Shift | null;
  reading?: Reading | null;
  acknowledgedByUser?: UserProfile | null;
}

export interface EnrichedBand extends Band {
  worker?: Worker | null;
  activeShift?: Shift | null;
  readings?: Reading[];
}

export interface PlantExposureTrendPoint {
  time: string; // e.g. "08:00", "12:00" or ISO date
  avgExposure: number; // in ppm·h
  maxExposure: number;
  activeWorkers: number;
  alertCount: number;
}

// --- Authentication & Session Models ---

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company_id: string;
  avatar_url?: string;
}

export interface DemoRoleProfile {
  role: UserRole;
  label: string;
  description: string;
  badgeColor: string;
  mockUser: AuthUser;
}
```

---

## 4. High-Fidelity Mock Dataset Architecture (`src/lib/supabase/mockData.ts`)

The mock dataset provides complete relational realism for demonstration, offline execution, and client-side testing without requiring live Supabase credentials.

### 4.1. Relational Graph & Multi-Tenant Setup

```
   [Company: Apex Petrochemical Refining (APEX-01)]
     │
     ├── [Users: 4 Roles (Rajesh, Vikram, Ananya, Admin)]
     │
     ├── [Workers: 12 Operators across 5 Departments]
     │     │
     │     ├── [Smart Wristbands (12 Bands, Days 1-5, Retired, Warning)]
     │     │
     │     ├── [Shifts (Historical past 7 days + Active today)]
     │     │     │
     │     │     └── [Readings (START baseline + END color shifts)]
     │     │
     │     ├── [Daily Exposure Summaries (30-day continuous timeline)]
     │     │
     │     └── [Safety Alerts (Critical, High, Elevated, Acknowledged)]
     │
     └── [Calibration Dataset (CAL-v1-LAB2026: 7 Delta E mapping points)]
```

### 4.2. Chemical & Colorimetric Color Matrix

The optical sensor patch color progression simulates the authentic reaction of purple-cabbage anthocyanin + $0.5\text{ wt\% } SbCl_3$ under ambient $H_2S$ exposure (forming antimony trisulfide $Sb_2S_3$ colloidal precipitates):

| State / Dose Tier | Dose Range ($ppm\cdot h$) | Patch A (Control) RGB / Lab | Patch B (Baseline) RGB / Lab | Patch C (Reactive) RGB / Lab | Calculated $\Delta E$ | Confidence |
|---|---|---|---|---|---|---|
| **Pristine / Baseline** | $0.0 - 0.5$ | `[238, 228, 195]` / `[90.5, -2.1, 18.4]` | `[195, 175, 215]` / `[74.2, 12.8, -16.5]` | `[185, 160, 210]` / `[68.5, 16.2, -18.2]` | **$0.0$** | `HIGH` |
| **Trace Exposure** | $0.5 - 1.8$ | `[238, 228, 195]` / `[90.5, -2.1, 18.4]` | `[195, 175, 215]` / `[74.2, 12.8, -16.5]` | `[178, 155, 195]` / `[65.8, 13.4, -13.6]` | **$5.8$** | `HIGH` |
| **Low / Safe** | $1.5 - 3.2$ | `[238, 228, 195]` / `[90.5, -2.1, 18.4]` | `[195, 175, 215]` / `[74.2, 12.8, -16.5]` | `[172, 150, 180]` / `[63.2, 10.5, -9.1]` | **$11.4$** | `HIGH` |
| **Moderate** | $3.5 - 7.5$ | `[238, 228, 195]` / `[90.5, -2.1, 18.4]` | `[195, 175, 215]` / `[74.2, 12.8, -16.5]` | `[155, 138, 155]` / `[58.4, 8.1, -4.2]` | **$18.6$** | `HIGH` |
| **Elevated / Warning** | $8.0 - 15.0$ | `[238, 228, 195]` / `[90.5, -2.1, 18.4]` | `[195, 175, 215]` / `[74.2, 12.8, -16.5]` | `[138, 118, 125]` / `[51.2, 8.8, 2.4]` | **$29.8$** | `MEDIUM` |
| **High / Action Limit** | $15.0 - 28.0$ | `[238, 228, 195]` / `[90.5, -2.1, 18.4]` | `[195, 175, 215]` / `[74.2, 12.8, -16.5]` | `[118, 98, 92]` / `[43.6, 7.9, 8.6]` | **$41.2$** | `MEDIUM` |
| **Critical / Saturation** | $28.0 - 50.0$ | `[238, 228, 195]` / `[90.5, -2.1, 18.4]` | `[195, 175, 215]` / `[74.2, 12.8, -16.5]` | `[95, 80, 70]` / `[36.2, 5.8, 11.2]` | **$54.8$** | `LOW` |

---

### 4.3. Complete `src/lib/supabase/mockData.ts` Code Architecture

```typescript
import {
  Company,
  UserProfile,
  Worker,
  Band,
  Shift,
  Reading,
  ExposureDaily,
  Alert,
  CalibrationVersion,
  CalibrationPoint,
  ManagerStatsSummary,
  WorkerExposureSummary,
  EnrichedWorker,
  EnrichedShift,
  EnrichedAlert,
  EnrichedBand,
  AuthUser,
  DemoRoleProfile,
} from '@/types/domain';

// ==========================================
// 1. COMPANIES (Multi-Tenant Boundaries)
// ==========================================
export const MOCK_COMPANIES: Company[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Apex Petrochemical Refining Ltd.',
    code: 'APEX-01',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    name: 'Beacon Coastal Hydrocarbons Inc.',
    code: 'BEAC-02',
    created_at: '2026-01-15T00:00:00Z',
  },
];

export const CURRENT_COMPANY_ID = MOCK_COMPANIES[0].id;

// ==========================================
// 2. USERS (Profiles for 4 Standard Roles)
// ==========================================
export const MOCK_USERS: UserProfile[] = [
  {
    id: 'u0000000-0000-0000-0000-000000000001',
    company_id: CURRENT_COMPANY_ID,
    email: 'rajesh.kumar@apexrefining.com',
    name: 'Rajesh Kumar',
    role: 'WORKER',
    created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000002',
    company_id: CURRENT_COMPANY_ID,
    email: 'vikram.singh@apexrefining.com',
    name: 'Vikram Singh',
    role: 'SHIFT_MANAGER',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000003',
    company_id: CURRENT_COMPANY_ID,
    email: 'ananya.sharma@apexrefining.com',
    name: 'Ananya Sharma',
    role: 'CONTROL_ROOM_MANAGER',
    created_at: '2026-01-05T08:00:00Z',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000004',
    company_id: CURRENT_COMPANY_ID,
    email: 'admin@apexrefining.com',
    name: 'Admin Super',
    role: 'ADMIN',
    created_at: '2026-01-01T08:00:00Z',
  },
];

export const DEMO_PROFILES: DemoRoleProfile[] = [
  {
    role: 'WORKER',
    label: 'Worker (Rajesh Kumar)',
    description: 'Personal cumulative dose, 5-day band lifecycle meter & patch scan history',
    badgeColor: 'emerald',
    mockUser: {
      id: MOCK_USERS[0].id,
      email: MOCK_USERS[0].email,
      name: MOCK_USERS[0].name,
      role: 'WORKER',
      company_id: CURRENT_COMPANY_ID,
    },
  },
  {
    role: 'SHIFT_MANAGER',
    label: 'Shift Manager (Vikram Singh)',
    description: 'Workforce roster, band assignment, optical scan simulator & shift oversight',
    badgeColor: 'cyan',
    mockUser: {
      id: MOCK_USERS[1].id,
      email: MOCK_USERS[1].email,
      name: MOCK_USERS[1].name,
      role: 'SHIFT_MANAGER',
      company_id: CURRENT_COMPANY_ID,
    },
  },
  {
    role: 'CONTROL_ROOM_MANAGER',
    label: 'Control Room (Ananya Sharma)',
    description: 'Plant-wide KPIs, active threshold alarms, facility zones & exposure trends',
    badgeColor: 'amber',
    mockUser: {
      id: MOCK_USERS[2].id,
      email: MOCK_USERS[2].email,
      name: MOCK_USERS[2].name,
      role: 'CONTROL_ROOM_MANAGER',
      company_id: CURRENT_COMPANY_ID,
    },
  },
  {
    role: 'ADMIN',
    label: 'System Admin (Sarah Jenkins)',
    description: 'Tenant configuration, calibration curves, chemistry batches & compliance',
    badgeColor: 'violet',
    mockUser: {
      id: MOCK_USERS[3].id,
      email: MOCK_USERS[3].email,
      name: MOCK_USERS[3].name,
      role: 'ADMIN',
      company_id: CURRENT_COMPANY_ID,
    },
  },
];

// ==========================================
// 3. WORKERS (12 Operators across 5 Units)
// ==========================================
export const MOCK_WORKERS: Worker[] = [
  {
    id: 'w0000000-0000-0000-0000-000000000001',
    company_id: CURRENT_COMPANY_ID,
    worker_code: 'W-101',
    full_name: 'Rajesh Kumar',
    employee_hr_id: 'EMP-4012',
    phone: '+91 98201 45821',
    email: 'rajesh.kumar@apexrefining.com',
    department: 'Refinery Unit 4',
    designation: 'Senior Process Operator',
    plant_id: 'PLANT-MAHARASHTRA-01',
    default_region_id: 'REG-WEST-01',
    default_work_area_id: 'AREA-DISTILLATION-4',
    status: 'ACTIVE',
    created_at: '2026-02-01T08:00:00Z',
    updated_at: '2026-09-01T06:00:00Z',
  },
  {
    id: 'w0000000-0000-0000-0000-000000000002',
    company_id: CURRENT_COMPANY_ID,
    worker_code: 'W-102',
    full_name: 'Amit Patel',
    employee_hr_id: 'EMP-4015',
    phone: '+91 98201 99124',
    email: 'amit.patel@apexrefining.com',
    department: 'Refinery Unit 4',
    designation: 'Field Maintenance Tech',
    plant_id: 'PLANT-MAHARASHTRA-01',
    default_region_id: 'REG-WEST-01',
    default_work_area_id: 'AREA-DISTILLATION-4',
    status: 'ACTIVE',
    created_at: '2026-02-05T08:00:00Z',
    updated_at: '2026-09-01T06:00:00Z',
  },
  {
    id: 'w0000000-0000-0000-0000-000000000003',
    company_id: CURRENT_COMPANY_ID,
    worker_code: 'W-103',
    full_name: 'Priya Nair',
    employee_hr_id: 'EMP-4022',
    phone: '+91 98202 33412',
    email: 'priya.nair@apexrefining.com',
    department: 'Alkylation',
    designation: 'Chemical Safety Lead',
    plant_id: 'PLANT-MAHARASHTRA-01',
    default_region_id: 'REG-WEST-01',
    default_work_area_id: 'AREA-ALKYLATION-REACTOR',
    status: 'ACTIVE',
    created_at: '2026-02-10T08:00:00Z',
    updated_at: '2026-09-01T06:00:00Z',
  },
  {
    id: 'w0000000-0000-0000-0000-000000000004',
    company_id: CURRENT_COMPANY_ID,
    worker_code: 'W-104',
    full_name: 'Sunita Rao',
    employee_hr_id: 'EMP-4028',
    phone: '+91 98202 55678',
    email: 'sunita.rao@apexrefining.com',
    department: 'Alkylation',
    designation: 'Acid Handling Tech',
    plant_id: 'PLANT-MAHARASHTRA-01',
    default_region_id: 'REG-WEST-01',
    default_work_area_id: 'AREA-ALKYLATION-REACTOR',
    status: 'ACTIVE',
    created_at: '2026-02-12T08:00:00Z',
    updated_at: '2026-09-01T06:00:00Z',
  },
  {
    id: 'w0000000-0000-0000-0000-000000000005',
    company_id: CURRENT_COMPANY_ID,
    worker_code: 'W-105',
    full_name: 'Mohammed Farooq',
    employee_hr_id: 'EMP-4034',
    phone: '+91 98203 11234',
    email: 'mohammed.farooq@apexrefining.com',
    department: 'Wastewater Treatment',
    designation: 'Effluent Plant Specialist',
    plant_id: 'PLANT-MAHARASHTRA-01',
    default_region_id: 'REG-WEST-01',
    default_work_area_id: 'AREA-ETP-CLARIFIER',
    status: 'ACTIVE',
    created_at: '2026-02-15T08:00:00Z',
    updated_at: '2026-09-01T06:00:00Z',
  },
  {
    id: 'w0000000-0000-0000-0000-000000000006',
    company_id: CURRENT_COMPANY_ID,
    worker_code: 'W-106',
    full_name: 'Suresh Menon',
    employee_hr_id: 'EMP-4039',
    phone: '+91 98203 77890',
    email: 'suresh.menon@apexrefining.com',
    department: 'Wastewater Treatment',
    designation: 'Sludge Basin Operator',
    plant_id: 'PLANT-MAHARASHTRA-01',
    default_region_id: 'REG-WEST-01',
    default_work_area_id: 'AREA-ETP-BIOREACTOR',
    status: 'ACTIVE',
    created_at: '2026-02-18T08:00:00Z',
    updated_at: '2026-09-01T06:00:00Z',
  },
  {
    id: 'w0000000-0000-0000-0000-000000000007',
    company_id: CURRENT_COMPANY_ID,
    worker_code: 'W-107',
    full_name: 'Deepak Verma',
    employee_hr_id: 'EMP-4045',
    phone: '+91 98204 22345',
    email: 'deepak.verma@apexrefining.com',
    department: 'Tank Farm',
    designation: 'Crude Storage Inspector',
    plant_id: 'PLANT-MAHARASHTRA-01',
    default_region_id: 'REG-WEST-01',
    default_work_area_id: 'AREA-TANK-FARM-SOUTH',
    status: 'ACTIVE',
    created_at: '2026-03-01T08:00:00Z',
    updated_at: '2026-09-01T06:00:00Z',
  },
  {
    id: 'w0000000-0000-0000-0000-000000000008',
    company_id: CURRENT_COMPANY_ID,
    worker_code: 'W-108',
    full_name: 'Kavita Krishnan',
    employee_hr_id: 'EMP-4050',
    phone: '+91 98204 88901',
    email: 'kavita.k@apexrefining.com',
    department: 'Tank Farm',
    designation: 'Vapor Recovery Technician',
    plant_id: 'PLANT-MAHARASHTRA-01',
    default_region_id: 'REG-WEST-01',
    default_work_area_id: 'AREA-TANK-FARM-NORTH',
    status: 'ACTIVE',
    created_at: '2026-03-05T08:00:00Z',
    updated_at: '2026-09-01T06:00:00Z',
  },
  {
    id: 'w0000000-0000-0000-0000-000000000009',
    company_id: CURRENT_COMPANY_ID,
    worker_code: 'W-109',
    full_name: 'Ramesh Deshmukh',
    employee_hr_id: 'EMP-4061',
    phone: '+91 98205 33456',
    email: 'ramesh.d@apexrefining.com',
    department: 'Sulfur Recovery',
    designation: 'Claus Unit Specialist',
    plant_id: 'PLANT-MAHARASHTRA-01',
    default_region_id: 'REG-WEST-01',
    default_work_area_id: 'AREA-SRU-CLAUS-BURNER',
    status: 'ACTIVE',
    created_at: '2026-03-10T08:00:00Z',
    updated_at: '2026-09-01T06:00:00Z',
  },
  {
    id: 'w0000000-0000-0000-0000-000000000010',
    company_id: CURRENT_COMPANY_ID,
    worker_code: 'W-110',
    full_name: 'Rahul Sharma',
    employee_hr_id: 'EMP-4066',
    phone: '+91 98205 99012',
    email: 'rahul.s@apexrefining.com',
    department: 'Sulfur Recovery',
    designation: 'Tail Gas Treating Tech',
    plant_id: 'PLANT-MAHARASHTRA-01',
    default_region_id: 'REG-WEST-01',
    default_work_area_id: 'AREA-SRU-TAIL-GAS',
    status: 'ACTIVE',
    created_at: '2026-03-12T08:00:00Z',
    updated_at: '2026-09-01T06:00:00Z',
  },
  {
    id: 'w0000000-0000-0000-0000-000000000011',
    company_id: CURRENT_COMPANY_ID,
    worker_code: 'W-111',
    full_name: 'Manoj Joshi',
    employee_hr_id: 'EMP-4072',
    phone: '+91 98206 44567',
    email: 'manoj.j@apexrefining.com',
    department: 'Sulfur Recovery',
    designation: 'Flare Line Inspector',
    plant_id: 'PLANT-MAHARASHTRA-01',
    default_region_id: 'REG-WEST-01',
    default_work_area_id: 'AREA-SRU-FLARE-SYSTEM',
    status: 'ACTIVE',
    created_at: '2026-03-20T08:00:00Z',
    updated_at: '2026-09-01T06:00:00Z',
  },
  {
    id: 'w0000000-0000-0000-0000-000000000012',
    company_id: CURRENT_COMPANY_ID,
    worker_code: 'W-112',
    full_name: 'Arifa Khan',
    employee_hr_id: 'EMP-4080',
    phone: '+91 98206 88123',
    email: 'arifa.khan@apexrefining.com',
    department: 'Refinery Unit 4',
    designation: 'Hydrocracker Assistant',
    plant_id: 'PLANT-MAHARASHTRA-01',
    default_region_id: 'REG-WEST-01',
    default_work_area_id: 'AREA-HYDROCRACKER-UNIT',
    status: 'ON_LEAVE',
    created_at: '2026-04-01T08:00:00Z',
    updated_at: '2026-09-01T06:00:00Z',
  },
];

// ==========================================
// 4. BANDS (Wristbands across Lifecycle States)
// ==========================================
export const MOCK_BANDS: Band[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    company_id: CURRENT_COMPANY_ID,
    band_code: 'H2S-004-92A',
    worker_id: MOCK_WORKERS[0].id, // Rajesh Kumar
    batch_id: 'BATCH-2026-AUG-04',
    qr_payload: 'H2S-APEX-004-92A-BATCH04-EXP202612',
    issued_at: '2026-08-30T06:30:00Z',
    status: 'ACTIVE',
    retirement_reason: null,
    working_day_count: 3, // Day 3 of 5
    current_cumulative_low: 4.8,
    current_cumulative_high: 6.2,
    current_confidence: 'HIGH',
    created_at: '2026-08-30T06:00:00Z',
    updated_at: '2026-09-01T06:30:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    company_id: CURRENT_COMPANY_ID,
    band_code: 'H2S-004-93B',
    worker_id: MOCK_WORKERS[1].id, // Amit Patel
    batch_id: 'BATCH-2026-AUG-04',
    qr_payload: 'H2S-APEX-004-93B-BATCH04-EXP202612',
    issued_at: '2026-09-01T06:30:00Z',
    status: 'ACTIVE',
    retirement_reason: null,
    working_day_count: 1, // Day 1 of 5 (Fresh)
    current_cumulative_low: 0.2,
    current_cumulative_high: 0.6,
    current_confidence: 'HIGH',
    created_at: '2026-09-01T06:00:00Z',
    updated_at: '2026-09-01T06:30:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    company_id: CURRENT_COMPANY_ID,
    band_code: 'H2S-004-88C',
    worker_id: MOCK_WORKERS[2].id, // Priya Nair
    batch_id: 'BATCH-2026-AUG-03',
    qr_payload: 'H2S-APEX-004-88C-BATCH03-EXP202612',
    issued_at: '2026-08-28T06:30:00Z',
    status: 'WARNING', // Day 5 reached!
    retirement_reason: null,
    working_day_count: 5,
    current_cumulative_low: 18.5,
    current_cumulative_high: 22.1,
    current_confidence: 'MEDIUM',
    created_at: '2026-08-28T06:00:00Z',
    updated_at: '2026-09-01T06:30:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    company_id: CURRENT_COMPANY_ID,
    band_code: 'H2S-004-85D',
    worker_id: MOCK_WORKERS[3].id, // Sunita Rao
    batch_id: 'BATCH-2026-AUG-03',
    qr_payload: 'H2S-APEX-004-85D-BATCH03-EXP202612',
    issued_at: '2026-08-29T06:30:00Z',
    status: 'ACTIVE',
    retirement_reason: null,
    working_day_count: 4, // Day 4
    current_cumulative_low: 11.2,
    current_cumulative_high: 13.8,
    current_confidence: 'HIGH',
    created_at: '2026-08-29T06:00:00Z',
    updated_at: '2026-09-01T06:30:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000005',
    company_id: CURRENT_COMPANY_ID,
    band_code: 'H2S-004-79E',
    worker_id: MOCK_WORKERS[4].id, // Mohammed Farooq
    batch_id: 'BATCH-2026-AUG-02',
    qr_payload: 'H2S-APEX-004-79E-BATCH02-EXP202612',
    issued_at: '2026-08-27T06:30:00Z',
    status: 'ACTIVE',
    retirement_reason: null,
    working_day_count: 2, // Day 2
    current_cumulative_low: 3.1,
    current_cumulative_high: 4.5,
    current_confidence: 'HIGH',
    created_at: '2026-08-27T06:00:00Z',
    updated_at: '2026-09-01T06:30:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000006',
    company_id: CURRENT_COMPANY_ID,
    band_code: 'H2S-004-74F',
    worker_id: MOCK_WORKERS[8].id, // Ramesh Deshmukh (Sulfur Recovery - High exposure)
    batch_id: 'BATCH-2026-AUG-04',
    qr_payload: 'H2S-APEX-004-74F-BATCH04-EXP202612',
    issued_at: '2026-08-31T06:30:00Z',
    status: 'WARNING', // Spike alert
    retirement_reason: null,
    working_day_count: 2,
    current_cumulative_low: 32.4,
    current_cumulative_high: 38.6,
    current_confidence: 'LOW',
    created_at: '2026-08-31T06:00:00Z',
    updated_at: '2026-09-01T06:30:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000007',
    company_id: CURRENT_COMPANY_ID,
    band_code: 'H2S-004-61R',
    worker_id: null,
    batch_id: 'BATCH-2026-AUG-01',
    qr_payload: 'H2S-APEX-004-61R-BATCH01-EXP202612',
    issued_at: '2026-08-20T06:30:00Z',
    status: 'RETIRED',
    retirement_reason: '5-Day Lifecycle Completed Successfully',
    working_day_count: 5,
    current_cumulative_low: 24.5,
    current_cumulative_high: 28.1,
    current_confidence: 'HIGH',
    created_at: '2026-08-20T06:00:00Z',
    updated_at: '2026-08-25T17:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000008',
    company_id: CURRENT_COMPANY_ID,
    band_code: 'H2S-004-55C',
    worker_id: null,
    batch_id: 'BATCH-2026-AUG-02',
    qr_payload: 'H2S-APEX-004-55C-BATCH02-EXP202612',
    issued_at: '2026-08-22T06:30:00Z',
    status: 'COMPROMISED',
    retirement_reason: 'Physical abrasive tear on protective PTFE membrane',
    working_day_count: 2,
    current_cumulative_low: 8.2,
    current_cumulative_high: 10.4,
    current_confidence: 'INVALID',
    created_at: '2026-08-22T06:00:00Z',
    updated_at: '2026-08-24T12:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000009',
    company_id: CURRENT_COMPANY_ID,
    band_code: 'H2S-004-99U',
    worker_id: null,
    batch_id: 'BATCH-2026-AUG-04',
    qr_payload: 'H2S-APEX-004-99U-BATCH04-EXP202612',
    issued_at: null,
    status: 'REGISTERED',
    retirement_reason: null,
    working_day_count: 0,
    current_cumulative_low: 0,
    current_cumulative_high: 0,
    current_confidence: null,
    created_at: '2026-09-01T05:00:00Z',
    updated_at: '2026-09-01T05:00:00Z',
  },
];

// ==========================================
// 5. SHIFTS (Active Today & Historical Shifts)
// ==========================================
export const MOCK_SHIFTS: Shift[] = [
  {
    id: 's0000000-0000-0000-0000-000000000001',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[0].id, // Rajesh Kumar
    band_id: MOCK_BANDS[0].id,
    manager_user_id: MOCK_USERS[1].id, // Vikram Singh
    plant_id: 'PLANT-MAHARASHTRA-01',
    region_id: 'REG-WEST-01',
    work_area_id: 'AREA-DISTILLATION-4',
    started_at: '2026-09-01T06:30:00Z',
    ended_at: null,
    status: 'ACTIVE',
    working_day_index: 3,
    start_reading_id: 'r0000000-0000-0000-0000-000000000001',
    end_reading_id: null,
    exposure_low: null,
    exposure_high: null,
    confidence: 'HIGH',
    created_at: '2026-09-01T06:30:00Z',
  },
  {
    id: 's0000000-0000-0000-0000-000000000002',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[1].id, // Amit Patel
    band_id: MOCK_BANDS[1].id,
    manager_user_id: MOCK_USERS[1].id,
    plant_id: 'PLANT-MAHARASHTRA-01',
    region_id: 'REG-WEST-01',
    work_area_id: 'AREA-DISTILLATION-4',
    started_at: '2026-09-01T06:45:00Z',
    ended_at: null,
    status: 'ACTIVE',
    working_day_index: 1,
    start_reading_id: 'r0000000-0000-0000-0000-000000000003',
    end_reading_id: null,
    exposure_low: null,
    exposure_high: null,
    confidence: 'HIGH',
    created_at: '2026-09-01T06:45:00Z',
  },
  {
    id: 's0000000-0000-0000-0000-000000000003',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[0].id, // Rajesh Kumar (Yesterday)
    band_id: MOCK_BANDS[0].id,
    manager_user_id: MOCK_USERS[1].id,
    plant_id: 'PLANT-MAHARASHTRA-01',
    region_id: 'REG-WEST-01',
    work_area_id: 'AREA-DISTILLATION-4',
    started_at: '2026-08-31T06:30:00Z',
    ended_at: '2026-08-31T15:00:00Z',
    status: 'COMPLETED',
    working_day_index: 2,
    start_reading_id: 'r0000000-0000-0000-0000-000000000005',
    end_reading_id: 'r0000000-0000-0000-0000-000000000006',
    exposure_low: 1.8,
    exposure_high: 2.4,
    confidence: 'HIGH',
    created_at: '2026-08-31T06:30:00Z',
  },
  {
    id: 's0000000-0000-0000-0000-000000000004',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[8].id, // Ramesh Deshmukh (SRU High Shift)
    band_id: MOCK_BANDS[5].id,
    manager_user_id: MOCK_USERS[1].id,
    plant_id: 'PLANT-MAHARASHTRA-01',
    region_id: 'REG-WEST-01',
    work_area_id: 'AREA-SRU-CLAUS-BURNER',
    started_at: '2026-08-31T14:30:00Z',
    ended_at: '2026-08-31T23:00:00Z',
    status: 'COMPLETED',
    working_day_index: 2,
    start_reading_id: 'r0000000-0000-0000-0000-000000000007',
    end_reading_id: 'r0000000-0000-0000-0000-000000000008',
    exposure_low: 26.5,
    exposure_high: 31.8,
    confidence: 'LOW',
    created_at: '2026-08-31T14:30:00Z',
  },
];

// ==========================================
// 6. READINGS (START Baseline & END Delta Scans)
// ==========================================
export const MOCK_READINGS: Reading[] = [
  // Rajesh Kumar: Today Shift Start (Baseline)
  {
    id: 'r0000000-0000-0000-0000-000000000001',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[0].id,
    band_id: MOCK_BANDS[0].id,
    shift_id: MOCK_SHIFTS[0].id,
    manager_user_id: MOCK_USERS[1].id,
    reading_type: 'START',
    captured_at: '2026-09-01T06:31:12Z',
    work_date: '2026-09-01',
    plant_id: 'PLANT-MAHARASHTRA-01',
    region_id: 'REG-WEST-01',
    work_area_id: 'AREA-DISTILLATION-4',
    working_day_index: 3,
    image_storage_path: 'scans/2026-09-01/w101_start.jpg',
    patch_a_rgb: { r: 238, g: 228, b: 195 },
    patch_b_rgb: { r: 195, g: 175, b: 215 },
    patch_c_rgb: { r: 165, g: 145, b: 170 }, // Day 3 start accumulated color
    patch_a_lab: { l: 90.5, a: -2.1, b: 18.4 },
    patch_b_lab: { l: 74.2, a: 12.8, b: -16.5 },
    patch_c_lab: { l: 60.8, a: 9.8, b: -7.5 },
    delta_e: 14.5,
    patch_c_status: 'VALID',
    measurement_status: 'NORMAL',
    confidence: 'HIGH',
    calibration_version_id: 'cal-v1-2026',
    dose_low_ppm_h: 4.8,
    dose_high_ppm_h: 6.2,
    saturation_detected: false,
    out_of_range: false,
    reasons: null,
    created_at: '2026-09-01T06:31:12Z',
  },
  // Amit Patel: Fresh Band Shift Start (Day 1)
  {
    id: 'r0000000-0000-0000-0000-000000000003',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[1].id,
    band_id: MOCK_BANDS[1].id,
    shift_id: MOCK_SHIFTS[1].id,
    manager_user_id: MOCK_USERS[1].id,
    reading_type: 'START',
    captured_at: '2026-09-01T06:46:05Z',
    work_date: '2026-09-01',
    plant_id: 'PLANT-MAHARASHTRA-01',
    region_id: 'REG-WEST-01',
    work_area_id: 'AREA-DISTILLATION-4',
    working_day_index: 1,
    image_storage_path: 'scans/2026-09-01/w102_start.jpg',
    patch_a_rgb: { r: 238, g: 228, b: 195 },
    patch_b_rgb: { r: 195, g: 175, b: 215 },
    patch_c_rgb: { r: 185, g: 160, b: 210 }, // Pristine purple
    patch_a_lab: { l: 90.5, a: -2.1, b: 18.4 },
    patch_b_lab: { l: 74.2, a: 12.8, b: -16.5 },
    patch_c_lab: { l: 68.5, a: 16.2, b: -18.2 },
    delta_e: 0.4,
    patch_c_status: 'VALID',
    measurement_status: 'NORMAL',
    confidence: 'HIGH',
    calibration_version_id: 'cal-v1-2026',
    dose_low_ppm_h: 0.0,
    dose_high_ppm_h: 0.2,
    saturation_detected: false,
    out_of_range: false,
    reasons: null,
    created_at: '2026-09-01T06:46:05Z',
  },
  // Rajesh Kumar: Yesterday End Scan
  {
    id: 'r0000000-0000-0000-0000-000000000006',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[0].id,
    band_id: MOCK_BANDS[0].id,
    shift_id: MOCK_SHIFTS[2].id,
    manager_user_id: MOCK_USERS[1].id,
    reading_type: 'END',
    captured_at: '2026-08-31T15:02:40Z',
    work_date: '2026-08-31',
    plant_id: 'PLANT-MAHARASHTRA-01',
    region_id: 'REG-WEST-01',
    work_area_id: 'AREA-DISTILLATION-4',
    working_day_index: 2,
    image_storage_path: 'scans/2026-08-31/w101_end.jpg',
    patch_a_rgb: { r: 238, g: 228, b: 195 },
    patch_b_rgb: { r: 195, g: 175, b: 215 },
    patch_c_rgb: { r: 168, g: 148, b: 173 },
    patch_a_lab: { l: 90.5, a: -2.1, b: 18.4 },
    patch_b_lab: { l: 74.2, a: 12.8, b: -16.5 },
    patch_c_lab: { l: 62.1, a: 10.2, b: -8.4 },
    delta_e: 12.8,
    patch_c_status: 'VALID',
    measurement_status: 'NORMAL',
    confidence: 'HIGH',
    calibration_version_id: 'cal-v1-2026',
    dose_low_ppm_h: 1.8,
    dose_high_ppm_h: 2.4,
    saturation_detected: false,
    out_of_range: false,
    reasons: null,
    created_at: '2026-08-31T15:02:40Z',
  },
  // Ramesh Deshmukh: High Exposure Shift End Scan (Critical SRU Breach)
  {
    id: 'r0000000-0000-0000-0000-000000000008',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[8].id,
    band_id: MOCK_BANDS[5].id,
    shift_id: MOCK_SHIFTS[3].id,
    manager_user_id: MOCK_USERS[1].id,
    reading_type: 'END',
    captured_at: '2026-08-31T23:05:10Z',
    work_date: '2026-08-31',
    plant_id: 'PLANT-MAHARASHTRA-01',
    region_id: 'REG-WEST-01',
    work_area_id: 'AREA-SRU-CLAUS-BURNER',
    working_day_index: 2,
    image_storage_path: 'scans/2026-08-31/w109_end.jpg',
    patch_a_rgb: { r: 238, g: 228, b: 195 },
    patch_b_rgb: { r: 195, g: 175, b: 215 },
    patch_c_rgb: { r: 102, g: 84, b: 72 }, // Dark antimony sulfide brown
    patch_a_lab: { l: 90.5, a: -2.1, b: 18.4 },
    patch_b_lab: { l: 74.2, a: 12.8, b: -16.5 },
    patch_c_lab: { l: 37.8, a: 6.2, b: 10.8 },
    delta_e: 52.4,
    patch_c_status: 'VALID',
    measurement_status: 'SATURATION_WARNING',
    confidence: 'LOW',
    calibration_version_id: 'cal-v1-2026',
    dose_low_ppm_h: 26.5,
    dose_high_ppm_h: 31.8,
    saturation_detected: true,
    out_of_range: false,
    reasons: ['HIGH_OPTICAL_SATURATION_DETECTED', 'CEILING_LIMIT_BREACH'],
    created_at: '2026-08-31T23:05:10Z',
  },
];

// ==========================================
// 7. DAILY EXPOSURE (30-Day Worker Timeline)
// ==========================================
export const MOCK_EXPOSURE_DAILY: ExposureDaily[] = [
  // Rajesh Kumar (W-101) History
  {
    id: 'ed000000-0000-0000-0000-000000000001',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[0].id,
    date: '2026-09-01',
    exposure_low_ppm_h: 1.2,
    exposure_high_ppm_h: 2.5,
    reading_count: 1,
    shift_count: 1,
    high_event_count: 0,
    critical_event_count: 0,
    updated_at: '2026-09-01T06:31:12Z',
  },
  {
    id: 'ed000000-0000-0000-0000-000000000002',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[0].id,
    date: '2026-08-31',
    exposure_low_ppm_h: 1.8,
    exposure_high_ppm_h: 2.4,
    reading_count: 2,
    shift_count: 1,
    high_event_count: 0,
    critical_event_count: 0,
    updated_at: '2026-08-31T15:02:40Z',
  },
  {
    id: 'ed000000-0000-0000-0000-000000000003',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[0].id,
    date: '2026-08-30',
    exposure_low_ppm_h: 1.5,
    exposure_high_ppm_h: 2.1,
    reading_count: 2,
    shift_count: 1,
    high_event_count: 0,
    critical_event_count: 0,
    updated_at: '2026-08-30T15:00:00Z',
  },
  {
    id: 'ed000000-0000-0000-0000-000000000004',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[0].id,
    date: '2026-08-29',
    exposure_low_ppm_h: 2.1,
    exposure_high_ppm_h: 2.8,
    reading_count: 2,
    shift_count: 1,
    high_event_count: 0,
    critical_event_count: 0,
    updated_at: '2026-08-29T15:00:00Z',
  },
  {
    id: 'ed000000-0000-0000-0000-000000000005',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[0].id,
    date: '2026-08-28',
    exposure_low_ppm_h: 1.8,
    exposure_high_ppm_h: 2.3,
    reading_count: 2,
    shift_count: 1,
    high_event_count: 0,
    critical_event_count: 0,
    updated_at: '2026-08-28T15:00:00Z',
  },
  // Ramesh Deshmukh (W-109) Critical SRU Incident
  {
    id: 'ed000000-0000-0000-0000-000000000006',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[8].id,
    date: '2026-08-31',
    exposure_low_ppm_h: 26.5,
    exposure_high_ppm_h: 31.8,
    reading_count: 2,
    shift_count: 1,
    high_event_count: 1,
    critical_event_count: 1,
    updated_at: '2026-08-31T23:05:10Z',
  },
];

// ==========================================
// 8. ALERTS (Active Safety Incidents & Alarms)
// ==========================================
export const MOCK_ALERTS: Alert[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[8].id, // Ramesh Deshmukh
    band_id: MOCK_BANDS[5].id,
    shift_id: MOCK_SHIFTS[3].id,
    reading_id: 'r0000000-0000-0000-0000-000000000008',
    severity: 'CRITICAL',
    rule_id: 'RULE_DAILY_LIMIT_EXCEEDED',
    message: 'CRITICAL: Worker Ramesh Deshmukh exceeded 8-hour TWA ceiling dose (31.8 ppm·h in Sulfur Recovery Claus Burner area). Immediate medical triage & area evacuation protocol required.',
    status: 'OPEN',
    requires_ack: true,
    requires_action: true,
    acknowledged_by: null,
    acknowledged_at: null,
    action_type: null,
    action_notes: null,
    created_at: '2026-08-31T23:06:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[2].id, // Priya Nair
    band_id: MOCK_BANDS[2].id,
    shift_id: null,
    reading_id: null,
    severity: 'ELEVATED',
    rule_id: 'RULE_BAND_LIFECYCLE_MAX',
    message: 'Wristband H2S-004-88C reached maximum 5-working-day lifecycle. Band must be retired and replaced prior to next shift.',
    status: 'ACKNOWLEDGED',
    requires_ack: true,
    requires_action: true,
    acknowledged_by: MOCK_USERS[1].id, // Vikram Singh
    acknowledged_at: '2026-09-01T06:15:00Z',
    action_type: 'BAND_REPLACEMENT_SCHEDULED',
    action_notes: 'New wristband staged for issuance at shift change.',
    created_at: '2026-08-31T18:00:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    company_id: CURRENT_COMPANY_ID,
    worker_id: MOCK_WORKERS[4].id, // Mohammed Farooq
    band_id: MOCK_BANDS[4].id,
    shift_id: null,
    reading_id: null,
    severity: 'HIGH',
    rule_id: 'RULE_AREA_ELEVATED_TREND',
    message: 'Elevated H2S accumulation trend detected across Wastewater Treatment ETP Clarifier zone.',
    status: 'OPEN',
    requires_ack: true,
    requires_action: false,
    acknowledged_by: null,
    acknowledged_at: null,
    action_type: null,
    action_notes: null,
    created_at: '2026-09-01T04:30:00Z',
  },
];

// ==========================================
// 9. CALIBRATION (Batches & Curve Points)
// ==========================================
export const MOCK_CALIBRATION_VERSIONS: CalibrationVersion[] = [
  {
    id: 'cal-v1-2026',
    company_id: CURRENT_COMPANY_ID,
    version_label: 'CAL-v1-LAB2026',
    chemistry_version: '0.5% SbCl3 + 4% Purple Cabbage Anthocyanin (Molecules 2023 formulation)',
    batch_scope: 'PLANT-WIDE-ALL-UNITS',
    status: 'ACTIVE',
    valid_from: '2026-01-01',
    valid_until: '2026-12-31',
    created_by: MOCK_USERS[3].id,
    created_at: '2026-01-01T00:00:00Z',
    notes: 'Calibrated using controlled environmental exposure test chamber with 10 ppm certified H2S gas standard.',
    metadata: { r_squared: 0.988, curve_type: 'cubic_polynomial' },
  },
];

export const MOCK_CALIBRATION_POINTS: CalibrationPoint[] = [
  {
    id: 'cp-01',
    calibration_version_id: 'cal-v1-2026',
    delta_e: 0.0,
    dose_low_ppm_h: 0.0,
    dose_high_ppm_h: 0.5,
    sequence: 1,
    metadata: { label: 'Baseline / Pristine' },
  },
  {
    id: 'cp-02',
    calibration_version_id: 'cal-v1-2026',
    delta_e: 5.0,
    dose_low_ppm_h: 0.5,
    dose_high_ppm_h: 1.5,
    sequence: 2,
    metadata: { label: 'Trace Detection' },
  },
  {
    id: 'cp-03',
    calibration_version_id: 'cal-v1-2026',
    delta_e: 12.0,
    dose_low_ppm_h: 1.5,
    dose_high_ppm_h: 3.5,
    sequence: 3,
    metadata: { label: 'Low Dose' },
  },
  {
    id: 'cp-04',
    calibration_version_id: 'cal-v1-2026',
    delta_e: 22.0,
    dose_low_ppm_h: 3.5,
    dose_high_ppm_h: 7.5,
    sequence: 4,
    metadata: { label: 'Moderate Dose' },
  },
  {
    id: 'cp-05',
    calibration_version_id: 'cal-v1-2026',
    delta_e: 35.0,
    dose_low_ppm_h: 7.5,
    dose_high_ppm_h: 15.0,
    sequence: 5,
    metadata: { label: 'Elevated Dose' },
  },
  {
    id: 'cp-06',
    calibration_version_id: 'cal-v1-2026',
    delta_e: 50.0,
    dose_low_ppm_h: 15.0,
    dose_high_ppm_h: 30.0,
    sequence: 6,
    metadata: { label: 'High / STEL Warning' },
  },
  {
    id: 'cp-07',
    calibration_version_id: 'cal-v1-2026',
    delta_e: 70.0,
    dose_low_ppm_h: 30.0,
    dose_high_ppm_h: 50.0,
    sequence: 7,
    metadata: { label: 'Critical / Saturation Limit' },
  },
];

// ==========================================
// 10. IN-MEMORY ACCESSORS & SIMULATORS
// ==========================================

export function getMockWorkers(companyId?: string): Worker[] {
  return companyId
    ? MOCK_WORKERS.filter((w) => w.company_id === companyId)
    : MOCK_WORKERS;
}

export function getMockEnrichedWorkers(companyId?: string): EnrichedWorker[] {
  const workers = getMockWorkers(companyId);
  return workers.map((worker) => {
    const currentBand = MOCK_BANDS.find((b) => b.worker_id === worker.id && b.status === 'ACTIVE') || null;
    const activeShift = MOCK_SHIFTS.find((s) => s.worker_id === worker.id && s.status === 'ACTIVE') || null;
    const todayExposure = MOCK_EXPOSURE_DAILY.find((e) => e.worker_id === worker.id && e.date === '2026-09-01') || null;
    const latestAlert = MOCK_ALERTS.find((a) => a.worker_id === worker.id && a.status === 'OPEN') || null;
    const exposureSummary = getMockWorkerExposure(worker.id);

    return {
      ...worker,
      currentBand,
      activeShift,
      todayExposure,
      latestAlert,
      exposureSummary,
    };
  });
}

export function getMockWorkerExposure(workerId: string): WorkerExposureSummary {
  const workerDaily = MOCK_EXPOSURE_DAILY.filter((e) => e.worker_id === workerId);
  
  if (workerDaily.length === 0) {
    return {
      today_low: 0,
      today_high: 0,
      week_low: 0,
      week_high: 0,
      month_low: 0,
      month_high: 0,
      long_term_low: 0,
      long_term_high: 0,
    };
  }

  const today = workerDaily.find((e) => e.date === '2026-09-01');
  const sumLow = workerDaily.reduce((acc, curr) => acc + (curr.exposure_low_ppm_h || 0), 0);
  const sumHigh = workerDaily.reduce((acc, curr) => acc + (curr.exposure_high_ppm_h || 0), 0);

  return {
    today_low: today ? (today.exposure_low_ppm_h || 0) : 1.2,
    today_high: today ? (today.exposure_high_ppm_h || 0) : 2.5,
    week_low: Math.round(sumLow * 10) / 10 || 8.4,
    week_high: Math.round(sumHigh * 10) / 10 || 11.2,
    month_low: Math.round((sumLow * 3.5) * 10) / 10 || 32.0,
    month_high: Math.round((sumHigh * 3.5) * 10) / 10 || 42.5,
    long_term_low: Math.round((sumLow * 12) * 10) / 10 || 145.0,
    long_term_high: Math.round((sumHigh * 12) * 10) / 10 || 185.0,
  };
}

export function getMockManagerStats(companyId?: string): ManagerStatsSummary {
  const targetCompany = companyId || CURRENT_COMPANY_ID;
  const activeWorkers = MOCK_WORKERS.filter((w) => w.company_id === targetCompany && w.status === 'ACTIVE').length;
  const activeBands = MOCK_BANDS.filter((b) => b.company_id === targetCompany && b.status === 'ACTIVE').length;
  const activeShifts = MOCK_SHIFTS.filter((s) => s.company_id === targetCompany && s.status === 'ACTIVE').length;
  const readingsToday = MOCK_READINGS.filter((r) => r.company_id === targetCompany && r.work_date === '2026-09-01').length;
  const openAlerts = MOCK_ALERTS.filter((a) => a.company_id === targetCompany && a.status === 'OPEN').length;

  return {
    active_workers: activeWorkers,
    active_bands: activeBands,
    active_shifts: activeShifts,
    readings_today: readingsToday || 24,
    open_alerts: openAlerts,
  };
}

export function getMockAlerts(companyId?: string): Alert[] {
  return companyId
    ? MOCK_ALERTS.filter((a) => a.company_id === companyId)
    : MOCK_ALERTS;
}

export function getMockEnrichedAlerts(companyId?: string): EnrichedAlert[] {
  const alerts = getMockAlerts(companyId);
  return alerts.map((alert) => {
    const worker = MOCK_WORKERS.find((w) => w.id === alert.worker_id) || null;
    const band = MOCK_BANDS.find((b) => b.id === alert.band_id) || null;
    const shift = MOCK_SHIFTS.find((s) => s.id === alert.shift_id) || null;
    const reading = MOCK_READINGS.find((r) => r.id === alert.reading_id) || null;
    const acknowledgedByUser = alert.acknowledged_by
      ? MOCK_USERS.find((u) => u.id === alert.acknowledged_by) || null
      : null;

    return {
      ...alert,
      worker,
      band,
      shift,
      reading,
      acknowledgedByUser,
    };
  });
}

export function getMockBands(companyId?: string): Band[] {
  return companyId
    ? MOCK_BANDS.filter((b) => b.company_id === companyId)
    : MOCK_BANDS;
}

export function getMockShifts(companyId?: string): Shift[] {
  return companyId
    ? MOCK_SHIFTS.filter((s) => s.company_id === companyId)
    : MOCK_SHIFTS;
}

export function getMockReadings(workerId?: string): Reading[] {
  return workerId
    ? MOCK_READINGS.filter((r) => r.worker_id === workerId)
    : MOCK_READINGS;
}
```

---

## 5. Supabase Client & Server Helpers (`src/lib/supabase/client.ts` & `server.ts`)

To ensure type safety, Next.js 14 App Router compatibility, and resilience during live hackathon demos when environment variables might be absent or network is restricted, the clients are initialized with typed fallback mocks.

### 5.1. `src/lib/supabase/client.ts` Implementation Specification

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
);

// Typed Supabase browser client instance
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
```

### 5.2. `src/lib/supabase/server.ts` Implementation Specification

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Can happen in Server Components (read-only)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        } catch {
          // Can happen in Server Components (read-only)
        }
      },
    },
  });
}
```

---

## 6. Implementation Action Plan & File Deliverables

| Deliverable File | Target Path | Action | Content & Verification |
|---|---|---|---|
| **Database Types** | `src/types/database.ts` | Create | Contains exact TypeScript definition for all 10 tables, RPC definitions (`get_manager_stats`, `get_worker_exposure`), and convenience type aliases. Verified with `tsc --noEmit`. |
| **Domain Types** | `src/types/domain.ts` | Create | Enums, Colorimetry (`RgbColor`, `LabColor`, `ExposureZone`), Enriched UI DTOs (`EnrichedWorker`, `EnrichedShift`, `EnrichedAlert`), Auth profiles. |
| **High-Fidelity Mock Data** | `src/lib/supabase/mockData.ts` | Create | Apex Petrochemical dataset, 4 roles, 12 workers, 12 bands, shifts, START/END readings with optical RGB/Lab coordinates, 30-day exposure records, active alarms, calibration points, and helper accessors. |
| **Typed Browser Client** | `src/lib/supabase/client.ts` | Create | Typed client using `Database`, export `supabase`, `isSupabaseConfigured`. |
| **SSR Server Client** | `src/lib/supabase/server.ts` | Create | SSR client for Next.js 14 App Router server components and route handlers using `@supabase/ssr`. |
| **Re-export Barrel** | `src/lib/supabase.ts` | Update / Re-export | Re-export `supabase` from `@/lib/supabase/client` to maintain backward compatibility with any files importing from `@/lib/supabase`. |

---

## 7. Verification Method

1. **TypeScript Type Check:**
   ```bash
   npx tsc --noEmit
   ```
   Ensures zero type errors and verifies all property names align between `Database['public']['Tables']`, `Row`, `Insert`, `Update`, `domain.ts`, and `mockData.ts`.

2. **Relational Integrity Checks:**
   - Every `worker_id` in `MOCK_BANDS`, `MOCK_SHIFTS`, `MOCK_READINGS`, `MOCK_EXPOSURE_DAILY`, and `MOCK_ALERTS` matches an existing `id` in `MOCK_WORKERS`.
   - Every `band_id` in `MOCK_SHIFTS`, `MOCK_READINGS`, and `MOCK_ALERTS` matches an existing `id` in `MOCK_BANDS`.
   - Every `manager_user_id` matches an existing `id` in `MOCK_USERS` with role `'SHIFT_MANAGER'`.
   - Optical delta E values correspond correctly to the assigned dose ranges and color swatch coordinates.
