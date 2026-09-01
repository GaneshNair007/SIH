import { supabase, isSupabaseConfigured } from './supabase/client';
import { mockStore } from './mockStore';
import type {
  Worker,
  Band,
  Shift,
  Reading,
  ExposureDaily,
  Alert,
  CalibrationVersion,
  CalibrationPoint,
  WorkerInsert,
  ManagerStatsSummary,
  WorkerExposureSummary,
  RgbColor,
  ExposureDoseCalculation,
} from '@/types/domain';

interface SupabaseInsertCaller<T, R> {
  insert: (row: T) => { select: () => { single: () => Promise<{ data: R | null; error: Error | null }> } };
}

interface SupabaseUpdateCaller<T, R> {
  update: (row: T) => { eq: (col: string, val: string) => { select: () => { single: () => Promise<{ data: R | null; error: Error | null }> } } };
}

interface SupabaseRpcCaller {
  rpc: <T = unknown>(name: string, args?: Record<string, unknown>) => Promise<{ data: T | null; error: Error | null }>;
}

export class DataService {
  /**
   * Returns true if live Supabase client is connected and ready.
   */
  public isSupabaseActive(): boolean {
    return isSupabaseConfigured();
  }

  // --- WORKERS ---

  public async getWorkers(): Promise<Worker[]> {
    if (this.isSupabaseActive()) {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data as Worker[];
    }
    return mockStore.getWorkers();
  }

  public async getWorker(workerId: string): Promise<Worker | null> {
    if (this.isSupabaseActive()) {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('id', workerId)
        .single();
      if (!error && data) return data as Worker;
    }
    return mockStore.getWorkerById(workerId) || null;
  }

  public async registerWorker(input: WorkerInsert): Promise<Worker> {
    if (this.isSupabaseActive()) {
      const caller = supabase.from('workers') as unknown as SupabaseInsertCaller<WorkerInsert, Worker>;
      const { data, error } = await caller
        .insert(input)
        .select()
        .single();
      if (!error && data) return data as Worker;
    }
    return mockStore.registerWorker(input);
  }

  // --- BANDS ---

  public async getBands(): Promise<Band[]> {
    if (this.isSupabaseActive()) {
      const { data, error } = await supabase
        .from('bands')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data as Band[];
    }
    return mockStore.getBands();
  }

  public async getBand(bandId: string): Promise<Band | null> {
    if (this.isSupabaseActive()) {
      const { data, error } = await supabase
        .from('bands')
        .select('*')
        .eq('id', bandId)
        .single();
      if (!error && data) return data as Band;
    }
    return mockStore.getBandById(bandId) || null;
  }

  public async getBandForWorker(workerId: string): Promise<Band | null> {
    if (this.isSupabaseActive()) {
      const { data, error } = await supabase
        .from('bands')
        .select('*')
        .eq('worker_id', workerId)
        .in('status', ['ACTIVE', 'WARNING'])
        .single();
      if (!error && data) return data as Band;
    }
    return mockStore.getBandByWorkerId(workerId) || null;
  }

  public async assignBand(workerId: string, bandCode: string, batchId?: string): Promise<Band> {
    if (this.isSupabaseActive()) {
      const caller = supabase.from('bands') as unknown as SupabaseInsertCaller<Record<string, unknown>, Band>;
      const { data, error } = await caller
        .insert({
          band_code: bandCode,
          worker_id: workerId,
          batch_id: batchId || 'BATCH-2026-Q1',
          status: 'ACTIVE',
          working_day_count: 1,
          issued_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (!error && data) return data as Band;
    }
    return mockStore.assignBand(workerId, bandCode, batchId);
  }

  // --- SHIFTS ---

  public async getShifts(): Promise<Shift[]> {
    if (this.isSupabaseActive()) {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('started_at', { ascending: false });
      if (!error && data) return data as Shift[];
    }
    return mockStore.getShifts();
  }

  public async getActiveShift(workerId: string): Promise<Shift | null> {
    if (this.isSupabaseActive()) {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('worker_id', workerId)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      if (!error && data) return data as Shift;
    }
    return mockStore.getActiveShiftForWorker(workerId) || null;
  }

  public async startShift(input: {
    worker_id: string;
    band_id: string;
    manager_user_id?: string;
    plant_id?: string;
    work_area_id?: string;
    baseline_patch_a_rgb: RgbColor;
    baseline_patch_b_rgb: RgbColor;
    baseline_patch_c_rgb: RgbColor;
    image_storage_path?: string;
  }): Promise<{ shift: Shift; reading: Reading }> {
    return mockStore.startShift(input);
  }

  public async endShift(input: {
    shift_id: string;
    final_patch_a_rgb: RgbColor;
    final_patch_b_rgb: RgbColor;
    final_patch_c_rgb: RgbColor;
    image_storage_path?: string;
    notes?: string;
  }): Promise<{ shift: Shift; reading: Reading; alert?: Alert; calculation: ExposureDoseCalculation }> {
    return mockStore.endShift(input);
  }

  // --- READINGS & EXPOSURES ---

  public async getReadings(workerId?: string): Promise<Reading[]> {
    if (this.isSupabaseActive()) {
      let query = supabase.from('readings').select('*').order('captured_at', { ascending: false });
      if (workerId) query = query.eq('worker_id', workerId);
      const { data, error } = await query;
      if (!error && data) return data as Reading[];
    }
    return mockStore.getReadings(workerId);
  }

  public async getDailyExposures(workerId?: string): Promise<ExposureDaily[]> {
    if (this.isSupabaseActive()) {
      let query = supabase.from('exposure_daily').select('*').order('date', { ascending: false });
      if (workerId) query = query.eq('worker_id', workerId);
      const { data, error } = await query;
      if (!error && data) return data as ExposureDaily[];
    }
    return mockStore.getExposureDaily(workerId);
  }

  public async getWorkerExposure(workerId: string): Promise<WorkerExposureSummary> {
    if (this.isSupabaseActive()) {
      const rpcCaller = supabase as unknown as SupabaseRpcCaller;
      const { data, error } = await rpcCaller.rpc<WorkerExposureSummary[]>('get_worker_exposure', { target_worker_id: workerId });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        return data[0];
      }
    }
    return mockStore.getWorkerExposure(workerId);
  }

  // --- ALERTS ---

  public async getAlerts(): Promise<Alert[]> {
    if (this.isSupabaseActive()) {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data as Alert[];
    }
    return mockStore.getAlerts();
  }

  public async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string = 'u-manager-01',
    actionNotes?: string
  ): Promise<Alert> {
    if (this.isSupabaseActive()) {
      const caller = supabase.from('alerts') as unknown as SupabaseUpdateCaller<Record<string, unknown>, Alert>;
      const { data, error } = await caller
        .update({
          status: 'ACKNOWLEDGED',
          acknowledged_by: acknowledgedBy,
          acknowledged_at: new Date().toISOString(),
          action_notes: actionNotes || null,
        })
        .eq('id', alertId)
        .select()
        .single();
      if (!error && data) return data as Alert;
    }
    return mockStore.acknowledgeAlert(alertId, acknowledgedBy, actionNotes);
  }

  // --- STATS & CALIBRATION ---

  public async getManagerStats(companyId?: string): Promise<ManagerStatsSummary> {
    if (this.isSupabaseActive()) {
      const rpcCaller = supabase as unknown as SupabaseRpcCaller;
      const { data, error } = await rpcCaller.rpc<ManagerStatsSummary[]>('get_manager_stats', {
        target_company_id: companyId || 'c-apex-01',
      });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        return data[0];
      }
    }
    return mockStore.getManagerStats(companyId);
  }

  public async getCalibration(): Promise<{ version?: CalibrationVersion; points: CalibrationPoint[] }> {
    return {
      version: mockStore.getCalibrationVersion(),
      points: mockStore.getCalibrationPoints(),
    };
  }

  public resetDemoData(): void {
    mockStore.resetToDefaults();
  }

  // --- REALTIME SUBSCRIPTION STUBS ---

  public subscribeRealtime(callbacks: {
    workerId?: string;
    companyId?: string;
    onExposureChange?: () => void;
    onAlertChange?: (alert: Alert) => void;
    onRosterChange?: () => void;
  }) {
    if (!this.isSupabaseActive()) return null;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        (payload: { new: unknown }) => {
          if (callbacks.onAlertChange) callbacks.onAlertChange(payload.new as Alert);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exposure_daily' },
        () => {
          if (callbacks.onExposureChange) callbacks.onExposureChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workers' },
        () => {
          if (callbacks.onRosterChange) callbacks.onRosterChange();
        }
      )
      .subscribe();

    return channel;
  }

  public unsubscribeRealtime(channel: unknown) {
    if (channel && this.isSupabaseActive()) {
      const client = supabase as unknown as { removeChannel: (ch: unknown) => void };
      client.removeChannel(channel);
    }
  }
}

export const dataService = new DataService();
