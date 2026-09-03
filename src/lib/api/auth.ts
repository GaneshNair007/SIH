import { apiClient } from "./client";

export interface SessionData {
  authenticated: boolean;
  role: string;
  user_id: string;
  employee_id: string;
  full_name: string;
  plant_unit: string;
  active_badge_id: string;
  is_demo: boolean;
}

export const authApi = {
  demoLogin: async (role: "manager" | "hse_officer" | "employee", employee_id?: string) => {
    const { data } = await apiClient.post<SessionData>("/auth/demo-login", { role, employee_id });
    return data;
  },
  
  standardLogin: async (username: string) => {
    const { data } = await apiClient.post<SessionData>("/auth/login", { username, password: "password" });
    return data;
  },
  
  me: async () => {
    const { data } = await apiClient.get<SessionData>("/auth/me");
    return data;
  },
  
  logout: async () => {
    const { data } = await apiClient.post<{ authenticated: boolean; message: string }>("/auth/logout");
    return data;
  }
};
