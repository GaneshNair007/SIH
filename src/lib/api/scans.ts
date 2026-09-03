import { apiClient } from "./client";

export const scanApi = {
  analyzeImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const { data } = await apiClient.post("/scan/analyze-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },
  
  startShift: async (payload: { employee_id: string, plant_unit: string, badge_id: string, band_lifecycle_day: number, start_delta_e: number }) => {
    const { data } = await apiClient.post("/scan/start-shift", payload);
    return data;
  },

  endShift: async (payload: {
    worker_id: string;
    plant_unit: string;
    shift_duration_hours: number;
    badge_id: string;
    band_lifecycle_day: number;
    start_delta_e: number;
    end_delta_e: number;
    patch_b_drift: number;
    patch_c_condition: string;
  }) => {
    const { data } = await apiClient.post("/scan/end-shift", payload);
    return data;
  }
};
