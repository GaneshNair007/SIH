"use client";

import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/lib/dataService';
import { queryKeys } from './queryKeys';
import type { WorkerExposureSummary, ExposureDaily, Reading } from '@/types/domain';

export function useWorkerExposure(workerId?: string) {
  return useQuery<WorkerExposureSummary>({
    queryKey: queryKeys.exposures.summary(workerId || 'default'),
    enabled: Boolean(workerId),
    queryFn: async () => {
      if (!workerId) {
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
      return await dataService.getWorkerExposure(workerId);
    },
    staleTime: 15 * 1000,
  });
}

export function useDailyExposures(workerId?: string) {
  return useQuery<ExposureDaily[]>({
    queryKey: queryKeys.exposures.daily(workerId),
    queryFn: async () => {
      return await dataService.getDailyExposures(workerId);
    },
    staleTime: 30 * 1000,
  });
}

export function useWorkerReadings(workerId?: string) {
  return useQuery<Reading[]>({
    queryKey: queryKeys.exposures.readings(workerId),
    queryFn: async () => {
      return await dataService.getReadings(workerId);
    },
    staleTime: 30 * 1000,
  });
}

export function usePlantExposureTrend(timeRange: string = '30d') {
  return useQuery({
    queryKey: queryKeys.exposures.trend(timeRange),
    queryFn: async () => {
      const exposures = await dataService.getDailyExposures();
      // Group by date and calculate average daily low/high
      const dateMap = new Map<string, { totalLow: number; totalHigh: number; count: number }>();

      for (const item of exposures) {
        const current = dateMap.get(item.date) || { totalLow: 0, totalHigh: 0, count: 0 };
        current.totalLow += item.exposure_low_ppm_h || 0;
        current.totalHigh += item.exposure_high_ppm_h || 0;
        current.count += 1;
        dateMap.set(item.date, current);
      }

      return Array.from(dateMap.entries())
        .map(([date, val]) => ({
          date,
          avgLow: Number((val.totalLow / val.count).toFixed(2)),
          avgHigh: Number((val.totalHigh / val.count).toFixed(2)),
          count: val.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    staleTime: 30 * 1000,
  });
}
