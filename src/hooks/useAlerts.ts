"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '@/lib/dataService';
import { queryKeys } from './queryKeys';
import type { Alert, AlertStatus, AlertSeverity } from '@/types/domain';

export interface AlertFilterOptions {
  status?: AlertStatus;
  severity?: AlertSeverity;
}

export function useAlerts(filters?: AlertFilterOptions) {
  return useQuery<Alert[]>({
    queryKey: queryKeys.alerts.list(filters),
    queryFn: async () => {
      const alerts = await dataService.getAlerts();
      let result = alerts;

      if (filters?.status) {
        result = result.filter(a => a.status === filters.status);
      }
      if (filters?.severity) {
        result = result.filter(a => a.severity === filters.severity);
      }

      return result;
    },
    staleTime: 10 * 1000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation<
    Alert,
    Error,
    { alertId: string; acknowledgedBy?: string; actionNotes?: string },
    { previousAlerts?: Alert[] }
  >({
    mutationFn: async ({ alertId, acknowledgedBy, actionNotes }) => {
      return await dataService.acknowledgeAlert(alertId, acknowledgedBy, actionNotes);
    },
    onMutate: async ({ alertId, acknowledgedBy, actionNotes }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.alerts.all });
      const previousAlerts = queryClient.getQueryData<Alert[]>(queryKeys.alerts.list());

      if (previousAlerts) {
        queryClient.setQueryData<Alert[]>(
          queryKeys.alerts.list(),
          previousAlerts.map(a =>
            a.id === alertId
              ? {
                  ...a,
                  status: 'ACKNOWLEDGED' as AlertStatus,
                  acknowledged_by: acknowledgedBy || 'u-manager-01',
                  acknowledged_at: new Date().toISOString(),
                  action_notes: actionNotes || a.action_notes,
                }
              : a
          )
        );
      }

      return { previousAlerts };
    },
    onError: (_err, _vars, context?: { previousAlerts?: Alert[] }) => {
      if (context?.previousAlerts) {
        queryClient.setQueryData(queryKeys.alerts.list(), context.previousAlerts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.manager() });
    },
  });
}
