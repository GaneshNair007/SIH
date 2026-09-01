"use client";

import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/lib/dataService';
import { queryKeys } from './queryKeys';
import type { ManagerStatsSummary } from '@/types/domain';

export function useManagerStats(companyId?: string) {
  return useQuery<ManagerStatsSummary>({
    queryKey: queryKeys.stats.manager(companyId),
    queryFn: async () => {
      return await dataService.getManagerStats(companyId);
    },
    staleTime: 15 * 1000,
  });
}
