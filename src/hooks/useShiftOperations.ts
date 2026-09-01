"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '@/lib/dataService';
import { queryKeys } from './queryKeys';
import type {
  Band,
  Shift,
  Reading,
  Alert,
  RgbColor,
  ExposureDoseCalculation,
} from '@/types/domain';

export function useBands(filters?: { status?: string }) {
  return useQuery<Band[]>({
    queryKey: queryKeys.bands.list(filters),
    queryFn: async () => {
      const bands = await dataService.getBands();
      if (filters?.status && filters.status !== 'ALL') {
        return bands.filter(b => b.status === filters.status);
      }
      return bands;
    },
    staleTime: 30 * 1000,
  });
}

export function useBandForWorker(workerId: string) {
  return useQuery<Band | null>({
    queryKey: queryKeys.bands.byWorker(workerId),
    enabled: Boolean(workerId),
    queryFn: async () => {
      if (!workerId) return null;
      return await dataService.getBandForWorker(workerId);
    },
    staleTime: 30 * 1000,
  });
}

export function useShifts() {
  return useQuery<Shift[]>({
    queryKey: queryKeys.shifts.lists(),
    queryFn: async () => {
      return await dataService.getShifts();
    },
    staleTime: 30 * 1000,
  });
}

export function useActiveShift(workerId: string) {
  return useQuery<Shift | null>({
    queryKey: queryKeys.shifts.active(workerId),
    enabled: Boolean(workerId),
    queryFn: async () => {
      if (!workerId) return null;
      return await dataService.getActiveShift(workerId);
    },
    staleTime: 15 * 1000,
  });
}

export function useAssignBand() {
  const queryClient = useQueryClient();

  return useMutation<
    Band,
    Error,
    { workerId: string; bandCode: string; batchId?: string }
  >({
    mutationFn: async ({ workerId, bandCode, batchId }) => {
      return await dataService.assignBand(workerId, bandCode, batchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bands.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.manager() });
    },
  });
}

export function useStartShift() {
  const queryClient = useQueryClient();

  return useMutation<
    { shift: Shift; reading: Reading },
    Error,
    {
      worker_id: string;
      band_id: string;
      manager_user_id?: string;
      plant_id?: string;
      work_area_id?: string;
      baseline_patch_a_rgb: RgbColor;
      baseline_patch_b_rgb: RgbColor;
      baseline_patch_c_rgb: RgbColor;
      image_storage_path?: string;
    }
  >({
    mutationFn: async input => {
      return await dataService.startShift(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.manager() });
    },
  });
}

export function useEndShift() {
  const queryClient = useQueryClient();

  return useMutation<
    { shift: Shift; reading: Reading; alert?: Alert; calculation: ExposureDoseCalculation },
    Error,
    {
      shift_id: string;
      final_patch_a_rgb: RgbColor;
      final_patch_b_rgb: RgbColor;
      final_patch_c_rgb: RgbColor;
      image_storage_path?: string;
      notes?: string;
    }
  >({
    mutationFn: async input => {
      return await dataService.endShift(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bands.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.exposures.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.manager() });
    },
  });
}
