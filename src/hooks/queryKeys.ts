export const queryKeys = {
  // Workers
  workers: {
    all: ['workers'] as const,
    lists: () => [...queryKeys.workers.all, 'list'] as const,
    list: (filters?: { department?: string; status?: string; search?: string }) =>
      [...queryKeys.workers.lists(), { filters }] as const,
    details: () => [...queryKeys.workers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workers.details(), id] as const,
  },

  // Bands
  bands: {
    all: ['bands'] as const,
    lists: () => [...queryKeys.bands.all, 'list'] as const,
    list: (filters?: { status?: string }) => [...queryKeys.bands.lists(), { filters }] as const,
    byWorker: (workerId: string) => [...queryKeys.bands.all, 'worker', workerId] as const,
    byCode: (code: string) => [...queryKeys.bands.all, 'code', code] as const,
  },

  // Shifts
  shifts: {
    all: ['shifts'] as const,
    lists: () => [...queryKeys.shifts.all, 'list'] as const,
    active: (workerId?: string) => [...queryKeys.shifts.all, 'active', { workerId }] as const,
    detail: (id: string) => [...queryKeys.shifts.all, 'detail', id] as const,
    history: (workerId: string) => [...queryKeys.shifts.all, 'history', workerId] as const,
  },

  // Exposures & Readings
  exposures: {
    all: ['exposures'] as const,
    summary: (workerId: string) => [...queryKeys.exposures.all, 'summary', workerId] as const,
    daily: (workerId?: string) => [...queryKeys.exposures.all, 'daily', workerId || 'all'] as const,
    readings: (workerId?: string) => [...queryKeys.exposures.all, 'readings', workerId || 'all'] as const,
    trend: (timeRange?: string) => [...queryKeys.exposures.all, 'trend', { timeRange }] as const,
  },

  // Safety Alerts
  alerts: {
    all: ['alerts'] as const,
    list: (filters?: { status?: string; severity?: string; companyId?: string }) =>
      [...queryKeys.alerts.all, 'list', { filters }] as const,
    detail: (id: string) => [...queryKeys.alerts.all, 'detail', id] as const,
  },

  // Manager & Control Room Statistics
  stats: {
    manager: (companyId?: string) => ['manager-stats', companyId ?? 'default'] as const,
    plant: () => ['plant-kpi-stats'] as const,
  },

  // Calibration Data
  calibration: {
    active: () => ['calibration', 'active'] as const,
    points: (versionId?: string) => ['calibration', 'points', versionId ?? 'active'] as const,
  },
} as const;
