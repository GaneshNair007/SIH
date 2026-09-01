"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '@/lib/dataService';
import { queryKeys } from './queryKeys';
import type { Worker, WorkerInsert } from '@/types/domain';

export interface WorkerFilterOptions {
  department?: string;
  status?: string;
  search?: string;
}

export function useWorkers(filters?: WorkerFilterOptions) {
  return useQuery<Worker[]>({
    queryKey: queryKeys.workers.list(filters),
    queryFn: async () => {
      const workers = await dataService.getWorkers();
      let result = workers;

      if (filters?.department && filters.department !== 'ALL') {
        result = result.filter(w => w.department === filters.department);
      }
      if (filters?.status && filters.status !== 'ALL') {
        result = result.filter(w => w.status === filters.status);
      }
      if (filters?.search && filters.search.trim() !== '') {
        const query = filters.search.toLowerCase().trim();
        result = result.filter(
          w =>
            w.full_name.toLowerCase().includes(query) ||
            w.worker_code.toLowerCase().includes(query) ||
            (w.email && w.email.toLowerCase().includes(query)) ||
            (w.employee_hr_id && w.employee_hr_id.toLowerCase().includes(query))
        );
      }

      return result;
    },
    staleTime: 30 * 1000,
  });
}

export function useWorker(workerId: string) {
  return useQuery<Worker | null>({
    queryKey: queryKeys.workers.detail(workerId),
    enabled: Boolean(workerId),
    queryFn: async () => {
      if (!workerId) return null;
      return await dataService.getWorker(workerId);
    },
    staleTime: 30 * 1000,
  });
}

export function useRegisterWorker() {
  const queryClient = useQueryClient();

  return useMutation<Worker, Error, WorkerInsert>({
    mutationFn: async (input: WorkerInsert) => {
      return await dataService.registerWorker(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.manager() });
    },
  });
}
