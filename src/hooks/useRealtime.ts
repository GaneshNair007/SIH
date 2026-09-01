"use client";

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dataService } from '@/lib/dataService';
import { queryKeys } from './queryKeys';
import { toast } from 'sonner';

import type { Alert } from '@/types/domain';

export interface UseRealtimeOptions {
  workerId?: string;
  companyId?: string;
  enableToasts?: boolean;
}

interface StoreUpdateDetail {
  type: string;
  payload?: {
    alert?: Alert;
    band_code?: string;
    full_name?: string;
  };
}

export function useRealtimeSubscriptions(options: UseRealtimeOptions = {}) {
  const { workerId, companyId, enableToasts = true } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Local Mock Store Event Listener
    const handleStoreUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<StoreUpdateDetail>;
      const { type, payload } = customEvent.detail || {};

      queryClient.invalidateQueries({ queryKey: queryKeys.workers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bands.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.exposures.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.manager() });

      if (enableToasts) {
        if (type === 'SHIFT_ENDED' && payload?.alert) {
          const alert = payload.alert;
          if (alert.severity === 'CRITICAL') {
            toast.error(`CRITICAL ALERT: ${alert.message}`);
          } else if (alert.severity === 'HIGH' || alert.severity === 'ELEVATED') {
            toast.warning(`Safety Alert: ${alert.message}`);
          }
        } else if (type === 'BAND_ASSIGNED' && payload?.band_code) {
          toast.success(`Wristband ${payload.band_code} assigned.`);
        } else if (type === 'WORKER_REGISTERED' && payload?.full_name) {
          toast.success(`Worker ${payload.full_name} registered.`);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('h2s_store_updated', handleStoreUpdate);
    }

    // 2. Supabase Realtime Channels (when active)
    let channel: unknown = null;
    if (dataService.isSupabaseActive()) {
      channel = dataService.subscribeRealtime({
        workerId,
        companyId,
        onExposureChange: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.exposures.all });
          if (enableToasts) toast.info('Telemetry data updated from sensor network.');
        },
        onAlertChange: alert => {
          queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.stats.manager() });
          if (enableToasts) {
            if (alert.severity === 'CRITICAL') {
              toast.error(`PLANT ALERT: ${alert.message}`);
            } else {
              toast.warning(`Safety Alert: ${alert.message}`);
            }
          }
        },
        onRosterChange: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.workers.all });
        },
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('h2s_store_updated', handleStoreUpdate);
      }
      if (channel) {
        dataService.unsubscribeRealtime(channel);
      }
    };
  }, [queryClient, workerId, companyId, enableToasts]);
}
