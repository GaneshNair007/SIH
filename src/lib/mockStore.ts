import type {
  Company,
  UserProfile,
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
  Json,
} from '@/types/domain';
import {
  MOCK_COMPANY,
  MOCK_USERS,
  MOCK_WORKERS,
  MOCK_BANDS,
  MOCK_SHIFTS,
  MOCK_READINGS,
  MOCK_EXPOSURES,
  MOCK_ALERTS,
  MOCK_CALIBRATION_VERSION,
  MOCK_CALIBRATION_POINTS,
} from './supabase/mockData';
import {
  rgbToLab,
  calculateDeltaE,
  deltaEToExposure,
  getExposureZone,
  evaluateConfidence,
} from './colorimetry';

const STORAGE_KEY = 'h2s_platform_store_v1';

export interface MockStoreState {
  companies: Company[];
  users: UserProfile[];
  workers: Worker[];
  bands: Band[];
  shifts: Shift[];
  readings: Reading[];
  exposure_daily: ExposureDaily[];
  alerts: Alert[];
  calibration_versions: CalibrationVersion[];
  calibration_points: CalibrationPoint[];
}

function getInitialState(): MockStoreState {
  const seed: MockStoreState = {
    companies: [MOCK_COMPANY],
    users: [...MOCK_USERS],
    workers: [...MOCK_WORKERS],
    bands: [...MOCK_BANDS],
    shifts: [...MOCK_SHIFTS],
    readings: [...MOCK_READINGS],
    exposure_daily: [...MOCK_EXPOSURES],
    alerts: [...MOCK_ALERTS],
    calibration_versions: [MOCK_CALIBRATION_VERSION],
    calibration_points: [...MOCK_CALIBRATION_POINTS],
  };
  // Mutations must never alter the imported seed objects; reset stays deterministic.
  return JSON.parse(JSON.stringify(seed)) as MockStoreState;
}

class MockStore {
  private state: MockStoreState;

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): MockStoreState {
    if (typeof window === 'undefined') {
      return getInitialState();
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // LocalStorage unavailable or corrupted
    }

    const initial = getInitialState();
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(stateToSave: MockStoreState = this.state): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // LocalStorage write failed
    }
  }

  private notifyListeners(type: string, payload?: unknown): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('h2s_store_updated', {
          detail: { type, payload },
        })
      );
    }
  }

  public resetToDefaults(): void {
    this.state = getInitialState();
    this.saveToStorage();
    this.notifyListeners('STORE_RESET');
  }

  // --- QUERIES ---

  public getCompanies(): Company[] {
    return this.state.companies;
  }

  public getUsers(): UserProfile[] {
    return this.state.users;
  }

  public getWorkers(): Worker[] {
    return [...this.state.workers];
  }

  public getWorkerById(id: string): Worker | undefined {
    return this.state.workers.find(w => w.id === id || w.worker_code === id);
  }

  public getBands(): Band[] {
    return [...this.state.bands];
  }

  public getBandById(id: string): Band | undefined {
    return this.state.bands.find(b => b.id === id || b.band_code === id);
  }

  public getBandByWorkerId(workerId: string): Band | undefined {
    return this.state.bands.find(b => b.worker_id === workerId && (b.status === 'ACTIVE' || b.status === 'WARNING'));
  }

  public getShifts(): Shift[] {
    return [...this.state.shifts];
  }

  public getActiveShiftForWorker(workerId: string): Shift | undefined {
    return this.state.shifts.find(s => s.worker_id === workerId && s.status === 'ACTIVE');
  }

  public getReadings(workerId?: string): Reading[] {
    if (workerId) {
      return this.state.readings.filter(r => r.worker_id === workerId);
    }
    return [...this.state.readings];
  }

  public getExposureDaily(workerId?: string): ExposureDaily[] {
    if (workerId) {
      return this.state.exposure_daily
        .filter(e => e.worker_id === workerId)
        .sort((a, b) => b.date.localeCompare(a.date));
    }
    return [...this.state.exposure_daily].sort((a, b) => b.date.localeCompare(a.date));
  }

  public getAlerts(): Alert[] {
    return [...this.state.alerts].sort((a, b) => {
      if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
      if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }

  public getCalibrationVersion(): CalibrationVersion | undefined {
    return this.state.calibration_versions.find(c => c.status === 'ACTIVE') || this.state.calibration_versions[0];
  }

  public getCalibrationPoints(): CalibrationPoint[] {
    return [...this.state.calibration_points].sort((a, b) => a.delta_e - b.delta_e);
  }

  public getManagerStats(companyId?: string): ManagerStatsSummary {
    const targetCompanyId = companyId || MOCK_COMPANY.id;
    const activeWorkers = this.state.workers.filter(w => (!w.company_id || w.company_id === targetCompanyId) && w.status === 'ACTIVE').length;
    const activeBands = this.state.bands.filter(b => (!b.company_id || b.company_id === targetCompanyId) && (b.status === 'ACTIVE' || b.status === 'WARNING')).length;
    const activeShifts = this.state.shifts.filter(s => (!s.company_id || s.company_id === targetCompanyId) && s.status === 'ACTIVE').length;
    const readingsToday = this.state.readings.filter(r => !r.company_id || r.company_id === targetCompanyId).length;
    const openAlerts = this.state.alerts.filter(a => (!a.company_id || a.company_id === targetCompanyId) && a.status === 'OPEN').length;

    return {
      active_workers: activeWorkers,
      active_bands: activeBands,
      active_shifts: activeShifts,
      readings_today: readingsToday,
      open_alerts: openAlerts,
    };
  }

  public getWorkerExposure(workerId: string = 'w-001'): WorkerExposureSummary {
    const dailyRecords = this.getExposureDaily(workerId);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = dailyRecords.find(d => d.date === todayStr) || dailyRecords[0];

    const todayLow = todayRecord?.exposure_low_ppm_h ?? 0.8;
    const todayHigh = todayRecord?.exposure_high_ppm_h ?? 1.6;

    // Aggregate week & month from daily records
    let weekLow = 0;
    let weekHigh = 0;
    let monthLow = 0;
    let monthHigh = 0;

    const daysCount = Math.min(dailyRecords.length, 7);
    for (let i = 0; i < daysCount; i++) {
      weekLow += dailyRecords[i].exposure_low_ppm_h ?? 0;
      weekHigh += dailyRecords[i].exposure_high_ppm_h ?? 0;
    }

    if (daysCount === 0) {
      weekLow = todayLow * 4.5;
      weekHigh = todayHigh * 4.8;
      monthLow = todayLow * 18.2;
      monthHigh = todayHigh * 19.5;
    } else {
      for (const d of dailyRecords) {
        monthLow += d.exposure_low_ppm_h ?? 0;
        monthHigh += d.exposure_high_ppm_h ?? 0;
      }
    }

    const longTermLow = Number(((monthLow || todayLow * 18) * 4.2).toFixed(1));
    const longTermHigh = Number(((monthHigh || todayHigh * 20) * 4.4).toFixed(1));

    return {
      today_low: Number(todayLow.toFixed(1)),
      today_high: Number(todayHigh.toFixed(1)),
      week_low: Number(weekLow.toFixed(1)),
      week_high: Number(weekHigh.toFixed(1)),
      month_low: Number(monthLow.toFixed(1)),
      month_high: Number(monthHigh.toFixed(1)),
      long_term_low: longTermLow,
      long_term_high: longTermHigh,
    };
  }

  // --- MUTATIONS ---

  public registerWorker(input: WorkerInsert): Worker {
    const newWorker: Worker = {
      id: `w-${Date.now().toString().slice(-4)}`,
      company_id: input.company_id || MOCK_COMPANY.id,
      worker_code: input.worker_code,
      full_name: input.full_name,
      employee_hr_id: input.employee_hr_id || null,
      phone: input.phone || null,
      email: input.email || null,
      department: input.department || 'Operations',
      designation: input.designation || 'Field Technician',
      plant_id: input.plant_id || 'PLANT-NORTH',
      default_region_id: input.default_region_id || 'REG-A',
      default_work_area_id: input.default_work_area_id || 'AREA-01',
      status: input.status || 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.workers.unshift(newWorker);
    this.saveToStorage();
    this.notifyListeners('WORKER_REGISTERED', newWorker);
    return newWorker;
  }

  public assignBand(
    workerId: string,
    bandCode: string,
    batchId: string = 'BATCH-2026-Q1',
    confirmReplacement: boolean = false
  ): Band {
    const worker = this.getWorkerById(workerId);
    if (!worker) throw new Error('Worker not found.');

    let band = this.state.bands.find(b => b.band_code === bandCode);
    if (band?.worker_id && band.worker_id !== workerId) {
      throw new Error('This band is permanently assigned to another worker and cannot be reassigned.');
    }

    const currentBand = this.getBandByWorkerId(workerId);
    if (currentBand && currentBand.id !== band?.id && !confirmReplacement) {
      throw new Error('Confirm replacement before retiring the worker\'s current band.');
    }

    if (currentBand && currentBand.id !== band?.id) {
      currentBand.status = 'RETIRED';
      currentBand.retirement_reason = 'Replaced by confirmed new band assignment';
      currentBand.updated_at = new Date().toISOString();
    }

    if (band) {
      band.worker_id = workerId;
      band.status = 'ACTIVE';
      band.issued_at = new Date().toISOString();
      band.working_day_count = 0;
      band.current_cumulative_low = 0;
      band.current_cumulative_high = 0;
      band.updated_at = new Date().toISOString();
    } else {
      band = {
        id: `bnd-${Date.now().toString().slice(-4)}`,
        company_id: MOCK_COMPANY.id,
        band_code: bandCode,
        worker_id: workerId,
        batch_id: batchId,
        qr_payload: `H2S-${bandCode}|${batchId}|${new Date().toISOString().split('T')[0]}`,
        issued_at: new Date().toISOString(),
        status: 'ACTIVE',
        retirement_reason: null,
        working_day_count: 0,
        current_cumulative_low: 0,
        current_cumulative_high: 0,
        current_confidence: 'HIGH',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.state.bands.unshift(band);
    }

    this.saveToStorage();
    this.notifyListeners('BAND_ASSIGNED', band);
    return band;
  }

  public startShift(input: {
    worker_id: string;
    band_id: string;
    manager_user_id?: string;
    plant_id?: string;
    work_area_id?: string;
    baseline_patch_a_rgb: RgbColor;
    baseline_patch_b_rgb: RgbColor;
    baseline_patch_c_rgb: RgbColor;
    image_storage_path?: string;
  }): { shift: Shift; reading: Reading } {
    if (this.getActiveShiftForWorker(input.worker_id)) {
      throw new Error('This worker already has an active shift.');
    }
    if (this.state.shifts.some(s => s.band_id === input.band_id && s.status === 'ACTIVE')) {
      throw new Error('This band already has an active shift.');
    }

    const band = this.getBandById(input.band_id);
    if (!band || band.worker_id !== input.worker_id) {
      throw new Error('Band identity does not match the selected worker.');
    }
    if (!['ACTIVE', 'WARNING'].includes(band.status || '')) {
      throw new Error(`Band status ${band.status || 'UNKNOWN'} requires an exception workflow.`);
    }

    const readingId = `rd-${Date.now().toString().slice(-4)}`;
    const shiftId = `sh-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const workDate = now.split('T')[0];

    const patchALab = rgbToLab(input.baseline_patch_a_rgb);
    const patchBLab = rgbToLab(input.baseline_patch_b_rgb);
    const patchCLab = rgbToLab(input.baseline_patch_c_rgb);
    const startDeltaE = calculateDeltaE(input.baseline_patch_a_rgb, input.baseline_patch_b_rgb);
    const startEstimate = deltaEToExposure(startDeltaE, this.getCalibrationPoints());
    const workingDayIndex = (band.working_day_count || 0) + 1;

    const reading: Reading = {
      id: readingId,
      company_id: MOCK_COMPANY.id,
      worker_id: input.worker_id,
      band_id: input.band_id,
      shift_id: shiftId,
      manager_user_id: input.manager_user_id || 'u-manager-01',
      reading_type: 'START',
      captured_at: now,
      work_date: workDate,
      plant_id: input.plant_id || 'PLANT-NORTH',
      region_id: 'REG-A',
      work_area_id: input.work_area_id || 'AREA-01',
      working_day_index: workingDayIndex,
      image_storage_path: input.image_storage_path || null,
      patch_a_rgb: input.baseline_patch_a_rgb as unknown as Json,
      patch_b_rgb: input.baseline_patch_b_rgb as unknown as Json,
      patch_c_rgb: input.baseline_patch_c_rgb as unknown as Json,
      patch_a_lab: patchALab as unknown as Json,
      patch_b_lab: patchBLab as unknown as Json,
      patch_c_lab: patchCLab as unknown as Json,
      delta_e: startDeltaE,
      patch_c_status: 'ACTIVE',
      measurement_status: 'VALID',
      confidence: 'HIGH',
      calibration_version_id: this.getCalibrationVersion()?.id || null,
      dose_low_ppm_h: startEstimate.minPpmH,
      dose_high_ppm_h: startEstimate.maxPpmH,
      saturation_detected: false,
      out_of_range: false,
      reasons: [],
      created_at: now,
    };

    const shift: Shift = {
      id: shiftId,
      company_id: MOCK_COMPANY.id,
      worker_id: input.worker_id,
      band_id: input.band_id,
      manager_user_id: input.manager_user_id || 'u-manager-01',
      plant_id: input.plant_id || 'PLANT-NORTH',
      region_id: 'REG-A',
      work_area_id: input.work_area_id || 'AREA-01',
      started_at: now,
      ended_at: null,
      status: 'ACTIVE',
      working_day_index: workingDayIndex,
      start_reading_id: readingId,
      end_reading_id: null,
      exposure_low: null,
      exposure_high: null,
      confidence: null,
      created_at: now,
    };

    this.state.readings.unshift(reading);
    this.state.shifts.unshift(shift);
    this.saveToStorage();
    this.notifyListeners('SHIFT_STARTED', { shift, reading });
    return { shift, reading };
  }

  public endShift(input: {
    shift_id: string;
    final_patch_a_rgb: RgbColor;
    final_patch_b_rgb: RgbColor;
    final_patch_c_rgb: RgbColor;
    image_storage_path?: string;
    notes?: string;
  }): { shift: Shift; reading: Reading; alert?: Alert; calculation: ExposureDoseCalculation } {
    const shift = this.state.shifts.find(s => s.id === input.shift_id);
    if (!shift) {
      throw new Error(`Shift ${input.shift_id} not found.`);
    }
    if (shift.status !== 'ACTIVE' || shift.end_reading_id) {
      throw new Error('This shift has already been completed or is not active.');
    }

    const startReading = this.state.readings.find(r => r.id === shift.start_reading_id);
    if (!startReading) throw new Error('The paired start reading is missing; the shift cannot be completed.');

    const baselinePatchB = startReading.patch_b_rgb as unknown as RgbColor;
    const baselinePatchC = startReading.patch_c_rgb as unknown as RgbColor;
    const deltaE = calculateDeltaE(input.final_patch_a_rgb, input.final_patch_b_rgb);
    const endEstimate = deltaEToExposure(deltaE, this.getCalibrationPoints());
    const startLow = startReading.dose_low_ppm_h ?? 0;
    const startHigh = startReading.dose_high_ppm_h ?? 0;
    const referenceDrift = calculateDeltaE(baselinePatchB, input.final_patch_b_rgb);
    const conditionDrift = calculateDeltaE(baselinePatchC, input.final_patch_c_rgb);
    const negativeDifference = endEstimate.maxPpmH + 0.01 < startLow;
    const integrityConcern = referenceDrift > 15 || conditionDrift > 25;
    const saturationDetected = deltaE > 38.0;
    const shiftLow = Math.max(0, endEstimate.minPpmH - startHigh);
    const shiftHigh = Math.max(0, endEstimate.maxPpmH - startLow);
    const confidence = negativeDifference || integrityConcern
      ? 'INVALID'
      : evaluateConfidence(deltaE, 'ACTIVE', saturationDetected);
    const zone = confidence === 'INVALID' ? 'NORMAL' : getExposureZone(shiftHigh);
    const reasons = [
      ...(negativeDifference ? ['End estimate is below the paired start estimate. Manual review required.'] : []),
      ...(referenceDrift > 15 ? ['Patch B changed beyond the demo integrity tolerance.'] : []),
      ...(conditionDrift > 25 ? ['Patch C indicates a condition concern.'] : []),
      ...(saturationDetected ? ['Response is beyond the synthetic demo calibration range.'] : []),
      ...(input.notes ? [input.notes] : []),
    ];

    const calculation: ExposureDoseCalculation = {
      deltaE,
      doseLowPpmH: shiftLow,
      doseHighPpmH: shiftHigh,
      zone,
      confidence,
      saturationDetected,
      outOfRange: saturationDetected,
      reasons,
    };

    const readingId = `rd-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const workDate = now.split('T')[0];

    const patchALab = rgbToLab(input.final_patch_a_rgb);
    const patchBLab = rgbToLab(input.final_patch_b_rgb);
    const patchCLab = rgbToLab(input.final_patch_c_rgb);

    const endReading: Reading = {
      id: readingId,
      company_id: shift.company_id,
      worker_id: shift.worker_id,
      band_id: shift.band_id,
      shift_id: shift.id,
      manager_user_id: shift.manager_user_id,
      reading_type: 'END',
      captured_at: now,
      work_date: workDate,
      plant_id: shift.plant_id,
      region_id: shift.region_id,
      work_area_id: shift.work_area_id,
      working_day_index: shift.working_day_index,
      image_storage_path: input.image_storage_path || null,
      patch_a_rgb: input.final_patch_a_rgb as unknown as Json,
      patch_b_rgb: input.final_patch_b_rgb as unknown as Json,
      patch_c_rgb: input.final_patch_c_rgb as unknown as Json,
      patch_a_lab: patchALab as unknown as Json,
      patch_b_lab: patchBLab as unknown as Json,
      patch_c_lab: patchCLab as unknown as Json,
      delta_e: deltaE,
      patch_c_status: conditionDrift > 25 ? 'COMPROMISED' : 'ACTIVE',
      measurement_status: confidence === 'INVALID' ? 'INVALID' : 'VALID',
      confidence,
      calibration_version_id: this.getCalibrationVersion()?.id || null,
      dose_low_ppm_h: confidence === 'INVALID' ? null : endEstimate.minPpmH,
      dose_high_ppm_h: confidence === 'INVALID' ? null : endEstimate.maxPpmH,
      saturation_detected: calculation.saturationDetected,
      out_of_range: calculation.outOfRange,
      reasons,
      created_at: now,
    };

    // Update Shift record
    shift.ended_at = now;
    shift.status = 'COMPLETED';
    shift.end_reading_id = readingId;
    shift.exposure_low = confidence === 'INVALID' ? null : calculation.doseLowPpmH;
    shift.exposure_high = confidence === 'INVALID' ? null : calculation.doseHighPpmH;
    shift.confidence = confidence;

    // Update Band cumulative doses & lifecycle day count
    if (shift.band_id) {
      const band = this.state.bands.find(b => b.id === shift.band_id);
      if (band) {
        if (confidence !== 'INVALID') {
          band.current_cumulative_low = endEstimate.minPpmH;
          band.current_cumulative_high = endEstimate.maxPpmH;
        }
        band.working_day_count = (band.working_day_count || 0) + 1;
        if (saturationDetected) {
          band.status = 'RETIRED';
          band.retirement_reason = 'Response exceeded the synthetic demo calibration range';
        } else if (integrityConcern) {
          band.status = 'COMPROMISED';
          band.retirement_reason = 'Patch integrity or condition check failed';
        } else if (band.working_day_count >= 5) {
          band.status = 'EXPIRED';
          band.retirement_reason = 'Five-working-day prototype policy reached';
        } else if (band.working_day_count === 4) {
          band.status = 'WARNING';
        }
        band.updated_at = now;
      }
    }

    // Upsert Exposure Daily record
    const existingDaily = confidence === 'INVALID' ? undefined : this.state.exposure_daily.find(
      e => e.worker_id === shift.worker_id && e.date === workDate
    );
    if (existingDaily) {
      existingDaily.exposure_low_ppm_h = Number(((existingDaily.exposure_low_ppm_h || 0) + calculation.doseLowPpmH).toFixed(2));
      existingDaily.exposure_high_ppm_h = Number(((existingDaily.exposure_high_ppm_h || 0) + calculation.doseHighPpmH).toFixed(2));
      existingDaily.shift_count = (existingDaily.shift_count || 1) + 1;
      existingDaily.reading_count = (existingDaily.reading_count || 1) + 1;
      if (zone === 'HIGH') existingDaily.high_event_count = (existingDaily.high_event_count || 0) + 1;
      if (zone === 'CRITICAL') existingDaily.critical_event_count = (existingDaily.critical_event_count || 0) + 1;
      existingDaily.updated_at = now;
    } else if (confidence !== 'INVALID') {
      this.state.exposure_daily.unshift({
        id: `exp-${Date.now().toString().slice(-4)}`,
        company_id: shift.company_id,
        worker_id: shift.worker_id,
        date: workDate,
        exposure_low_ppm_h: calculation.doseLowPpmH,
        exposure_high_ppm_h: calculation.doseHighPpmH,
        reading_count: 2,
        shift_count: 1,
        high_event_count: zone === 'HIGH' ? 1 : 0,
        critical_event_count: zone === 'CRITICAL' ? 1 : 0,
        updated_at: now,
      });
    }

    // Trigger Alert if zone is not NORMAL
    let newAlert: Alert | undefined;
    if (confidence !== 'INVALID' && zone !== 'NORMAL') {
      const worker = this.getWorkerById(shift.worker_id);
      const workerLabel = worker ? `${worker.full_name} (${worker.worker_code})` : shift.worker_id;

      newAlert = {
        id: `alt-${Date.now().toString().slice(-4)}`,
        company_id: shift.company_id,
        worker_id: shift.worker_id,
        band_id: shift.band_id,
        shift_id: shift.id,
        reading_id: readingId,
        severity: zone,
        rule_id: zone === 'CRITICAL' ? 'RULE-CRITICAL-CEILING-BREACH' : 'RULE-ELEVATED-EXPOSURE',
        message: `${zone} synthetic demo exposure index for ${workerLabel}: ${calculation.doseHighPpmH} ppm·h (ΔE=${deltaE}). Supervisor review required; this is not a real-time gas alarm.`,
        status: 'OPEN',
        requires_ack: true,
        requires_action: zone === 'CRITICAL' || zone === 'HIGH',
        acknowledged_by: null,
        acknowledged_at: null,
        action_type: zone === 'CRITICAL' ? 'EMERGENCY_EVACUATION' : 'WORKER_ROTATION',
        action_notes: null,
        created_at: now,
      };
      this.state.alerts.unshift(newAlert);
    }

    this.state.readings.unshift(endReading);
    this.saveToStorage();
    this.notifyListeners('SHIFT_ENDED', { shift, reading: endReading, alert: newAlert });

    return { shift, reading: endReading, alert: newAlert, calculation };
  }

  public acknowledgeAlert(alertId: string, acknowledgedBy: string = 'u-manager-01', actionNotes?: string): Alert {
    const alert = this.state.alerts.find(a => a.id === alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found.`);
    }

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledged_by = acknowledgedBy;
    alert.acknowledged_at = new Date().toISOString();
    if (actionNotes) {
      alert.action_notes = actionNotes;
    }

    this.saveToStorage();
    this.notifyListeners('ALERT_ACKNOWLEDGED', alert);
    return alert;
  }
}

export const mockStore = new MockStore();
