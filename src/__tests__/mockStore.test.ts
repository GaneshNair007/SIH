import { mockStore } from '@/lib/mockStore';

describe('Reactive MockStore Operations', () => {
  beforeEach(() => {
    mockStore.resetToDefaults();
  });

  test('getWorkers returns the initial set of 12 workers', () => {
    const workers = mockStore.getWorkers();
    expect(workers.length).toBe(12);
  });

  test('getWorkerById returns correct worker or undefined', () => {
    const worker = mockStore.getWorkerById('w-001');
    expect(worker).toBeDefined();
    expect(worker?.full_name).toBe('Rajesh Kumar');

    const notFound = mockStore.getWorkerById('w-9999');
    expect(notFound).toBeUndefined();
  });

  test('registerWorker adds new worker to store', () => {
    const newWorker = mockStore.registerWorker({
      worker_code: 'WK-NEW-99',
      full_name: 'Anil Kapoor',
      department: 'Flare Header',
      designation: 'Safety Tech',
    });

    expect(newWorker.id).toBeDefined();
    expect(newWorker.worker_code).toBe('WK-NEW-99');

    const workers = mockStore.getWorkers();
    expect(workers.length).toBe(13);
    expect(mockStore.getWorkerById(newWorker.id)).toBeDefined();
  });

  test('assignBand binds wristband to worker and updates stats', () => {
    const band = mockStore.assignBand('w-003', 'BND-9999', 'BATCH-TEST', true);
    expect(band.worker_id).toBe('w-003');
    expect(band.band_code).toBe('BND-9999');
    expect(band.status).toBe('ACTIVE');

    const workerBand = mockStore.getBandByWorkerId('w-003');
    expect(workerBand?.band_code).toBe('BND-9999');
  });

  test('startShift creates active shift and start reading', () => {
    const result = mockStore.startShift({
      worker_id: 'w-003',
      band_id: 'bnd-003',
      baseline_patch_a_rgb: { r: 235, g: 220, b: 185 },
      baseline_patch_b_rgb: { r: 240, g: 225, b: 190 },
      baseline_patch_c_rgb: { r: 178, g: 150, b: 72 },
    });

    expect(result.shift.id).toBeDefined();
    expect(result.shift.status).toBe('ACTIVE');
    expect(result.reading.reading_type).toBe('START');

    const activeShift = mockStore.getActiveShiftForWorker('w-003');
    expect(activeShift?.id).toBe(result.shift.id);
  });

  test('endShift computes Delta E, updates doses, creates end reading, and triggers alert on elevated exposure', () => {
    // Start shift
    const startRes = mockStore.startShift({
      worker_id: 'w-003',
      band_id: 'bnd-003',
      baseline_patch_a_rgb: { r: 235, g: 220, b: 185 },
      baseline_patch_b_rgb: { r: 240, g: 225, b: 190 },
      baseline_patch_c_rgb: { r: 178, g: 150, b: 72 },
    });

    // End shift with significant colour shift on reactive Patch A.
    const endRes = mockStore.endShift({
      shift_id: startRes.shift.id,
      final_patch_a_rgb: { r: 176, g: 132, b: 102 },
      final_patch_b_rgb: { r: 240, g: 225, b: 190 },
      final_patch_c_rgb: { r: 178, g: 150, b: 72 },
    });

    expect(endRes.shift.status).toBe('COMPLETED');
    expect(endRes.shift.end_reading_id).toBe(endRes.reading.id);
    expect(endRes.reading.delta_e).toBeGreaterThan(0);
    expect(endRes.calculation.doseHighPpmH).toBeGreaterThan(0);

    // If exposure zone is not NORMAL, alert is generated
    if (endRes.calculation.zone !== 'NORMAL') {
      expect(endRes.alert).toBeDefined();
      expect(endRes.alert?.status).toBe('OPEN');
    }
  });

  test('prevents duplicate active shifts and duplicate end submissions', () => {
    const input = {
      worker_id: 'w-003',
      band_id: 'bnd-003',
      baseline_patch_a_rgb: { r: 235, g: 220, b: 185 },
      baseline_patch_b_rgb: { r: 240, g: 225, b: 190 },
      baseline_patch_c_rgb: { r: 178, g: 150, b: 72 },
    };
    const started = mockStore.startShift(input);
    expect(() => mockStore.startShift(input)).toThrow(/already has an active shift/i);
    const endInput = {
      shift_id: started.shift.id,
      final_patch_a_rgb: { r: 176, g: 132, b: 102 },
      final_patch_b_rgb: { r: 240, g: 225, b: 190 },
      final_patch_c_rgb: { r: 178, g: 150, b: 72 },
    };
    mockStore.endShift(endInput);
    expect(() => mockStore.endShift(endInput)).toThrow(/already been completed/i);
  });

  test('never reassigns a band already owned by another worker', () => {
    expect(() => mockStore.assignBand('w-003', 'BND-1001', 'BATCH-TEST', true)).toThrow(/permanently assigned/i);
  });

  test('band cumulative estimate is replaced by latest end estimate, not summed', () => {
    const started = mockStore.startShift({
      worker_id: 'w-003', band_id: 'bnd-003',
      baseline_patch_a_rgb: { r: 235, g: 220, b: 185 },
      baseline_patch_b_rgb: { r: 240, g: 225, b: 190 },
      baseline_patch_c_rgb: { r: 178, g: 150, b: 72 },
    });
    const ended = mockStore.endShift({
      shift_id: started.shift.id,
      final_patch_a_rgb: { r: 176, g: 132, b: 102 },
      final_patch_b_rgb: { r: 240, g: 225, b: 190 },
      final_patch_c_rgb: { r: 178, g: 150, b: 72 },
    });
    const band = mockStore.getBandById('bnd-003');
    expect(band?.current_cumulative_high).toBe(ended.reading.dose_high_ppm_h);
  });

  test('acknowledgeAlert transitions alert status to ACKNOWLEDGED', () => {
    const alerts = mockStore.getAlerts();
    const openAlert = alerts.find(a => a.status === 'OPEN');
    expect(openAlert).toBeDefined();

    if (openAlert) {
      const acked = mockStore.acknowledgeAlert(openAlert.id, 'u-manager-01', 'Inspected ventilation');
      expect(acked.status).toBe('ACKNOWLEDGED');
      expect(acked.acknowledged_by).toBe('u-manager-01');
      expect(acked.action_notes).toBe('Inspected ventilation');
    }
  });

  test('getManagerStats reflects state updates accurately', () => {
    const initialStats = mockStore.getManagerStats();
    expect(initialStats.active_workers).toBe(11);

    mockStore.registerWorker({
      worker_code: 'WK-EXTRA',
      full_name: 'Extra Worker',
    });

    const updatedStats = mockStore.getManagerStats();
    expect(updatedStats.active_workers).toBe(12);
  });
});
