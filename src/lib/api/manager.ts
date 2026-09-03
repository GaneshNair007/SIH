import { apiClient } from "./client";

export interface WorkforceKPIs {
  total_active_employees: number;
  recent_shifts_logged: number;
  tier2_caution_warnings: number;
  tier3_critical_breaches: number;
  open_oisd_incidents: number;
}

export interface UnitBreakdown {
  unit: string;
  total_scans: number;
  average_twa_ppm: number;
  status: "NORMAL" | "ALERT";
}

export interface RecentScan {
  scan_id: string;
  employee_id: string;
  plant_unit: string;
  shift_status: string;
  timestamp: string;
  shift_duration_hours: number;
  computed_metrics: {
    statutory_tier: string;
    shift_twa_ppm: number;
    compensated_dose_ppm_hr: number;
  }
}

export interface DashboardData {
  workforce_kpis: WorkforceKPIs;
  unit_breakdown: UnitBreakdown[];
  recent_scans: RecentScan[];
}

export interface Employee {
  employee_id: string;
  full_name: string;
  plant_unit: string;
  role: string;
  active_badge_id: string;
  exposure_ledger: {
    rolling_7day_ppm_hr: number;
    rolling_7day_range_str: string;
  };
}

export const managerApi = {
  getDashboard: async () => {
    const { data } = await apiClient.get<DashboardData>("/manager/dashboard");
    return data;
  },
  
  getEmployees: async () => {
    const { data } = await apiClient.get<Employee[]>("/manager/employees");
    return data;
  },
  
  getEmployee: async (id: string) => {
    const { data } = await apiClient.get(`/manager/employees/${id}`);
    return data;
  }
};
