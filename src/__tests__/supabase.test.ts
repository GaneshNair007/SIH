import { isSupabaseConfigured, getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  MOCK_COMPANY,
  MOCK_WORKERS,
  MOCK_BANDS,
  MOCK_CALIBRATION_POINTS,
  getMockManagerStats,
  getMockWorkerExposure,
} from '@/lib/supabase/mockData';
import {
  rgbToLab,
  calculateDeltaE,
  deltaEToExposure,
  getExposureZone,
  evaluateConfidence,
} from '@/lib/colorimetry';

describe('Supabase Client & Config Verification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('isSupabaseConfigured returns false when env variables are missing or dummy', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(isSupabaseConfigured()).toBe(false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder-instance.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_placeholder_dummy_key_for_offline_and_testing';
    expect(isSupabaseConfigured()).toBe(false);
  });

  test('isSupabaseConfigured returns true when genuine credentials are provided', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://xyzcompany.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.genuine_token';
    expect(isSupabaseConfigured()).toBe(true);
  });

  test('getSupabaseBrowserClient initializes client without throwing even if env vars are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const client = getSupabaseBrowserClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
  });
});

describe('Database Schema & Mock Data Conformance', () => {
  test('MOCK_COMPANY matches company schema contract', () => {
    expect(MOCK_COMPANY.id).toBeDefined();
    expect(MOCK_COMPANY.name).toBe('Apex Petrochemical Refining Ltd.');
    expect(MOCK_COMPANY.code).toBe('APEX-REF');
  });

  test('MOCK_WORKERS contains 12 workers with valid departments', () => {
    expect(MOCK_WORKERS.length).toBe(12);
    const departments = new Set(MOCK_WORKERS.map(w => w.department));
    expect(departments.has('Coker Unit')).toBe(true);
    expect(departments.has('Sulfur Recovery Unit')).toBe(true);
    expect(departments.has('Alkylation Unit')).toBe(true);
    expect(departments.has('Wastewater Treatment')).toBe(true);
    expect(departments.has('Tank Farm & Loading')).toBe(true);
  });

  test('MOCK_BANDS covers 5-day lifecycle statuses', () => {
    expect(MOCK_BANDS.length).toBe(12);
    const statuses = new Set(MOCK_BANDS.map(b => b.status));
    expect(statuses.has('ACTIVE')).toBe(true);
    expect(statuses.has('WARNING')).toBe(true);
    expect(statuses.has('EXPIRED')).toBe(true);
    expect(statuses.has('RETIRED')).toBe(true);
  });

  test('MOCK_CALIBRATION_POINTS is non-empty and monotonically increasing in Delta E', () => {
    expect(MOCK_CALIBRATION_POINTS.length).toBeGreaterThan(3);
    for (let i = 1; i < MOCK_CALIBRATION_POINTS.length; i++) {
      expect(MOCK_CALIBRATION_POINTS[i].delta_e).toBeGreaterThan(MOCK_CALIBRATION_POINTS[i - 1].delta_e);
      expect(MOCK_CALIBRATION_POINTS[i].dose_high_ppm_h).toBeGreaterThanOrEqual(MOCK_CALIBRATION_POINTS[i - 1].dose_high_ppm_h);
    }
  });

  test('getMockManagerStats calculates KPIs accurately', () => {
    const stats = getMockManagerStats();
    expect(stats.active_workers).toBeGreaterThan(0);
    expect(stats.active_bands).toBeGreaterThan(0);
    expect(stats.active_shifts).toBeGreaterThan(0);
    expect(stats.readings_today).toBeGreaterThan(0);
    expect(typeof stats.open_alerts).toBe('number');
  });

  test('getMockWorkerExposure returns consistent exposure tiers', () => {
    const exposure = getMockWorkerExposure('w-001');
    expect(exposure.today_low).toBeLessThanOrEqual(exposure.today_high);
    expect(exposure.week_low).toBeLessThanOrEqual(exposure.week_high);
    expect(exposure.month_low).toBeLessThanOrEqual(exposure.month_high);
    expect(exposure.long_term_low).toBeLessThanOrEqual(exposure.long_term_high);
  });
});

describe('Colorimetry & Exposure Mathematical Engine', () => {
  test('rgbToLab converts white (255,255,255) to L* ~100, a* ~0, b* ~0', () => {
    const lab = rgbToLab({ r: 255, g: 255, b: 255 });
    expect(lab.l).toBeCloseTo(100, 0);
    expect(lab.a).toBeCloseTo(0, 0);
    expect(lab.b).toBeCloseTo(0, 0);
  });

  test('calculateDeltaE returns 0 for identical colors', () => {
    const deltaE = calculateDeltaE({ r: 100, g: 150, b: 200 }, { r: 100, g: 150, b: 200 });
    expect(deltaE).toBe(0);
  });

  test('calculateDeltaE correctly detects color distance between disparate colors', () => {
    const deltaE = calculateDeltaE({ r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 });
    expect(deltaE).toBeGreaterThan(50);
  });

  test('deltaEToExposure interpolates dose accurately', () => {
    const resZero = deltaEToExposure(0);
    expect(resZero.minPpmH).toBe(0);
    expect(resZero.maxPpmH).toBe(0);
    expect(resZero.confidence).toBe('HIGH');

    const resMid = deltaEToExposure(15.0);
    expect(resMid.minPpmH).toBe(5.0);
    expect(resMid.maxPpmH).toBe(8.5);

    const resInterpolated = deltaEToExposure(5.85); // Between 3.5 and 8.2
    expect(resInterpolated.minPpmH).toBeGreaterThan(0.5);
    expect(resInterpolated.maxPpmH).toBeLessThan(3.8);
  });

  test('getExposureZone classifies safety thresholds correctly', () => {
    expect(getExposureZone(1.5)).toBe('NORMAL');
    expect(getExposureZone(3.5)).toBe('ELEVATED');
    expect(getExposureZone(7.5)).toBe('HIGH');
    expect(getExposureZone(15.0)).toBe('CRITICAL');
  });

  test('evaluateConfidence assigns appropriate confidence ratings', () => {
    expect(evaluateConfidence(5.0, 'ACTIVE', false)).toBe('HIGH');
    expect(evaluateConfidence(28.0, 'ACTIVE', false)).toBe('MEDIUM');
    expect(evaluateConfidence(40.0, 'ACTIVE', true)).toBe('LOW');
    expect(evaluateConfidence(5.0, 'EXPIRED', false)).toBe('INVALID');
    expect(evaluateConfidence(5.0, 'COMPROMISED', false)).toBe('INVALID');
  });
});
