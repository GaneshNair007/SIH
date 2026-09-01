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
            isOneToOne: false;
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
            isOneToOne: false;
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
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bands_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
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
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_band_id_fkey";
            columns: ["band_id"];
            isOneToOne: false;
            referencedRelation: "bands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_manager_user_id_fkey";
            columns: ["manager_user_id"];
            isOneToOne: false;
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
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "readings_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "readings_band_id_fkey";
            columns: ["band_id"];
            isOneToOne: false;
            referencedRelation: "bands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "readings_shift_id_fkey";
            columns: ["shift_id"];
            isOneToOne: false;
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
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exposure_daily_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
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
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_acknowledged_by_fkey";
            columns: ["acknowledged_by"];
            isOneToOne: false;
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
            isOneToOne: false;
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
            isOneToOne: false;
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
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];
export type UserProfileInsert = Database['public']['Tables']['users']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['users']['Update'];
export type WorkerInsert = Database['public']['Tables']['workers']['Insert'];
export type WorkerUpdate = Database['public']['Tables']['workers']['Update'];
export type BandInsert = Database['public']['Tables']['bands']['Insert'];
export type BandUpdate = Database['public']['Tables']['bands']['Update'];
export type ShiftInsert = Database['public']['Tables']['shifts']['Insert'];
export type ShiftUpdate = Database['public']['Tables']['shifts']['Update'];
export type ReadingInsert = Database['public']['Tables']['readings']['Insert'];
export type ReadingUpdate = Database['public']['Tables']['readings']['Update'];
export type ExposureDailyInsert = Database['public']['Tables']['exposure_daily']['Insert'];
export type ExposureDailyUpdate = Database['public']['Tables']['exposure_daily']['Update'];
export type AlertInsert = Database['public']['Tables']['alerts']['Insert'];
export type AlertUpdate = Database['public']['Tables']['alerts']['Update'];
export type CalibrationVersionInsert = Database['public']['Tables']['calibration_versions']['Insert'];
export type CalibrationVersionUpdate = Database['public']['Tables']['calibration_versions']['Update'];
export type CalibrationPointInsert = Database['public']['Tables']['calibration_points']['Insert'];
export type CalibrationPointUpdate = Database['public']['Tables']['calibration_points']['Update'];
