import {
  rgbToLab,
  calculateDeltaE,
  deltaEToExposure,
  getExposureZone,
  evaluateConfidence,
  DEFAULT_CALIBRATION_POINTS,
} from '@/lib/colorimetry';
import type { RgbColor, LabColor } from '@/types/domain';

describe('Adversarial & Empirical Colorimetry Stress Suite', () => {
  // =========================================================================
  // 1. CIE Lab D65 Reference White & Chromaticity Benchmarking
  // =========================================================================
  describe('CIE Lab D65 Conversion Accuracy & Standard Color Benchmarks', () => {
    test('D65 Standard Reference White (255, 255, 255) maps exactly to L*=100, a*=0, b*=0', () => {
      const white = rgbToLab({ r: 255, g: 255, b: 255 });
      expect(white.l).toBeCloseTo(100.0, 1);
      expect(Math.abs(white.a)).toBeLessThan(0.01);
      expect(Math.abs(white.b)).toBeLessThan(0.01);
    });

    test('Standard Reference Black (0, 0, 0) maps to L*=0, a*=0, b*=0', () => {
      const black = rgbToLab({ r: 0, g: 0, b: 0 });
      expect(black.l).toBeCloseTo(0.0, 1);
      expect(Math.abs(black.a)).toBeLessThan(0.01);
      expect(Math.abs(black.b)).toBeLessThan(0.01);
    });

    test('Achromatic Neutral Gray Scale maintains a* = 0, b* = 0 across full luminance ramp', () => {
      const grays = [16, 32, 64, 96, 128, 160, 192, 224, 240];
      let previousL = 0;

      for (const val of grays) {
        const lab = rgbToLab({ r: val, g: val, b: val });
        // Luminance must be strictly monotonically increasing
        expect(lab.l).toBeGreaterThan(previousL);
        previousL = lab.l;
        // Chromaticity coordinates on neutral axis must be virtually 0
        expect(Math.abs(lab.a)).toBeLessThan(0.05);
        expect(Math.abs(lab.b)).toBeLessThan(0.05);
      }
    });

    test('Primary and Secondary Colors match known standard CIE L*a*b* ground truths', () => {
      // Ground truth sRGB to Lab (D65 illuminant, standard IEC 61966-2-1)
      const testVectors: Array<{ rgb: [number, number, number]; expected: { l: number; a: number; b: number }; tol: number }> = [
        { rgb: [255, 0, 0], expected: { l: 53.24, a: 80.09, b: 67.20 }, tol: 0.1 },
        { rgb: [0, 255, 0], expected: { l: 87.73, a: -86.18, b: 83.18 }, tol: 0.1 },
        { rgb: [0, 0, 255], expected: { l: 32.30, a: 79.19, b: -107.86 }, tol: 0.1 },
        { rgb: [255, 255, 0], expected: { l: 97.14, a: -21.55, b: 94.48 }, tol: 0.1 },
        { rgb: [0, 255, 255], expected: { l: 91.11, a: -48.09, b: -14.13 }, tol: 0.1 },
        { rgb: [255, 0, 255], expected: { l: 60.32, a: 98.23, b: -60.82 }, tol: 0.1 },
        { rgb: [128, 128, 128], expected: { l: 53.59, a: 0.0, b: 0.0 }, tol: 0.1 },
      ];

      for (const vector of testVectors) {
        const lab = rgbToLab(vector.rgb);
        expect(lab.l).toBeCloseTo(vector.expected.l, 0);
        expect(lab.a).toBeCloseTo(vector.expected.a, 0);
        expect(lab.b).toBeCloseTo(vector.expected.b, 0);
      }
    });
  });

  // =========================================================================
  // 2. Input Boundary Clamping & Malformed RGB Robustness
  // =========================================================================
  describe('Input Boundary Clamping & Malformed RGB Robustness', () => {
    test('Negative RGB values clamp cleanly to black (0, 0, 0) without throwing or NaN', () => {
      const negativeRgb = rgbToLab({ r: -50, g: -100, b: -999 });
      expect(negativeRgb.l).toBeCloseTo(0, 0);
      expect(negativeRgb.a).toBeCloseTo(0, 0);
      expect(negativeRgb.b).toBeCloseTo(0, 0);
    });

    test('Overflow RGB values (> 255) clamp cleanly to white (255, 255, 255) without distortion', () => {
      const overflowRgb = rgbToLab({ r: 300, g: 1000, b: 65535 });
      expect(overflowRgb.l).toBeCloseTo(100, 0);
      expect(overflowRgb.a).toBeCloseTo(0, 0);
      expect(overflowRgb.b).toBeCloseTo(0, 0);
    });

    test('Floating point RGB coordinates interpolate smoothly', () => {
      const floatLab1 = rgbToLab([127.5, 127.5, 127.5]);
      const intLab127 = rgbToLab([127, 127, 127]);
      const intLab128 = rgbToLab([128, 128, 128]);

      expect(floatLab1.l).toBeGreaterThan(intLab127.l);
      expect(floatLab1.l).toBeLessThan(intLab128.l);
    });

    test('Array vs Object notation produces identical Lab and DeltaE results', () => {
      const arr: [number, number, number] = [180, 92, 45];
      const obj: RgbColor = { r: 180, g: 92, b: 45 };

      const labFromArr = rgbToLab(arr);
      const labFromObj = rgbToLab(obj);

      expect(labFromArr).toEqual(labFromObj);
    });

    test('Fuzz test: 20,000 random out-of-gamut and arbitrary RGB inputs remain mathematically bounded', () => {
      for (let i = 0; i < 20000; i++) {
        const r = (Math.random() - 0.5) * 1000;
        const g = (Math.random() - 0.5) * 1000;
        const b = (Math.random() - 0.5) * 1000;

        const lab = rgbToLab({ r, g, b });
        expect(Number.isFinite(lab.l)).toBe(true);
        expect(Number.isFinite(lab.a)).toBe(true);
        expect(Number.isFinite(lab.b)).toBe(true);
        expect(lab.l).toBeGreaterThanOrEqual(0);
        expect(lab.l).toBeLessThanOrEqual(100.0001);
      }
    });
  });

  // =========================================================================
  // 3. Metric Space Axioms of Delta E (CIE76 Euclidean Distance)
  // =========================================================================
  describe('Euclidean Delta E Metric Space Axioms', () => {
    const samples: Array<RgbColor | LabColor | [number, number, number]> = [
      { r: 255, g: 255, b: 255 },
      { r: 0, g: 0, b: 0 },
      { r: 240, g: 180, b: 60 },
      { r: 80, g: 120, b: 200 },
      { l: 45.2, a: -12.4, b: 35.8 },
      [100, 150, 200],
    ];

    test('Axiom 1: Non-negativity (Delta E >= 0 for any pair of colors)', () => {
      for (const c1 of samples) {
        for (const c2 of samples) {
          const de = calculateDeltaE(c1, c2);
          expect(de).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('Axiom 2: Identity of Indiscernibles (Delta E(c, c) === 0)', () => {
      for (const c of samples) {
        const de = calculateDeltaE(c, c);
        expect(de).toBe(0);
      }
    });

    test('Axiom 3: Symmetry (Delta E(c1, c2) === Delta E(c2, c1))', () => {
      for (let i = 0; i < samples.length; i++) {
        for (let j = i + 1; j < samples.length; j++) {
          const de12 = calculateDeltaE(samples[i], samples[j]);
          const de21 = calculateDeltaE(samples[j], samples[i]);
          expect(de12).toBe(de21);
        }
      }
    });

    test('Axiom 4: Triangle Inequality (Delta E(a, c) <= Delta E(a, b) + Delta E(b, c) + rounding error)', () => {
      for (let i = 0; i < samples.length; i++) {
        for (let j = 0; j < samples.length; j++) {
          for (let k = 0; k < samples.length; k++) {
            const de_ac = calculateDeltaE(samples[i], samples[k]);
            const de_ab = calculateDeltaE(samples[i], samples[j]);
            const de_bc = calculateDeltaE(samples[j], samples[k]);
            // Allow small epsilon 0.02 due to Number.toFixed(2) rounding
            expect(de_ac).toBeLessThanOrEqual(de_ab + de_bc + 0.02);
          }
        }
      }
    });
  });

  // =========================================================================
  // 4. Calibration Curve: Boundary Conditions, Zero Exposure & Extreme Delta E
  // =========================================================================
  describe('Calibration Interpolation & Boundary Conditions', () => {
    test('Zero exposure (Delta E = 0.0) yields [0.0, 0.0] ppm·h with HIGH confidence', () => {
      const exp = deltaEToExposure(0.0);
      expect(exp.minPpmH).toBe(0.0);
      expect(exp.maxPpmH).toBe(0.0);
      expect(exp.confidence).toBe('HIGH');
    });

    test('Sub-first-keypoint micro-exposure (Delta E in [0.001, 3.499]) is strictly bounded', () => {
      const exp1 = deltaEToExposure(0.001);
      const exp2 = deltaEToExposure(1.75); // midpoint of [0, 3.5]
      const exp3 = deltaEToExposure(3.5);

      expect(exp1.minPpmH).toBeGreaterThanOrEqual(0);
      expect(exp1.minPpmH).toBeLessThanOrEqual(exp2.minPpmH);
      expect(exp2.minPpmH).toBeLessThanOrEqual(exp3.minPpmH);

      // At 1.75 (half of 3.5): dose_low = 0.5 * (1.75 / 3.5) = 0.25, dose_high = 1.2 * 0.5 = 0.6
      expect(exp2.minPpmH).toBeCloseTo(0.25, 2);
      expect(exp2.maxPpmH).toBeCloseTo(0.60, 2);
    });

    test('Delta E above the calibration maximum is clamped and marked out of range, never extrapolated', () => {
      const extremeValues = [54.8, 60.0, 75.0, 100.0, 250.0, 1000.0];

      for (const de of extremeValues) {
        const res = deltaEToExposure(de);
        expect(res.minPpmH).toBe(20.0);
        expect(res.maxPpmH).toBe(35.0);
        expect(res.confidence).toBe('LOW');
        expect(res.outOfRange).toBe(true);
        expect(getExposureZone(res.maxPpmH)).toBe('CRITICAL');
      }
    });

    test('Negative and NaN inputs return unavailable dose with INVALID confidence', () => {
      const neg = deltaEToExposure(-0.001);
      expect(Number.isNaN(neg.minPpmH)).toBe(true);
      expect(Number.isNaN(neg.maxPpmH)).toBe(true);
      expect(neg.confidence).toBe('INVALID');

      const nanRes = deltaEToExposure(NaN);
      expect(Number.isNaN(nanRes.minPpmH)).toBe(true);
      expect(Number.isNaN(nanRes.maxPpmH)).toBe(true);
      expect(nanRes.confidence).toBe('INVALID');
    });

    test('Empty calibration array reports dose calibration unavailable', () => {
      const emptyRes = deltaEToExposure(10.0, []);
      expect(Number.isNaN(emptyRes.minPpmH)).toBe(true);
      expect(Number.isNaN(emptyRes.maxPpmH)).toBe(true);
      expect(emptyRes.confidence).toBe('INVALID');
      expect(emptyRes.calibrated).toBe(false);
    });

    test('Unsorted calibration points array is sorted automatically without error', () => {
      const unsorted = [
        { delta_e: 38.0, dose_low_ppm_h: 20.0, dose_high_ppm_h: 35.0 },
        { delta_e: 0.0, dose_low_ppm_h: 0.0, dose_high_ppm_h: 0.0 },
        { delta_e: 15.0, dose_low_ppm_h: 5.0, dose_high_ppm_h: 8.5 },
      ];

      const res = deltaEToExposure(7.5, unsorted);
      // Midpoint between 0 and 15 -> [2.5, 4.25]
      expect(res.minPpmH).toBeCloseTo(2.5, 1);
      expect(res.maxPpmH).toBeCloseTo(4.25, 1);
    });
  });

  // =========================================================================
  // 5. Piecewise Linearity & Monotonic Continuity Stress Verification
  // =========================================================================
  describe('Piecewise Linearity & Monotonic Continuity Stress Verification', () => {
    test('Dose calculation is strictly monotonic non-decreasing over 5,000 dense Delta E steps', () => {
      const steps = 5000;
      const maxDeltaE = 100.0;
      let lastMin = -1;
      let lastMax = -1;

      for (let i = 0; i <= steps; i++) {
        const de = (i / steps) * maxDeltaE;
        const res = deltaEToExposure(de);

        // Invariant 1: minPpmH <= maxPpmH
        expect(res.minPpmH).toBeLessThanOrEqual(res.maxPpmH);

        // Invariant 2: Monotonic non-decreasing
        expect(res.minPpmH).toBeGreaterThanOrEqual(lastMin);
        expect(res.maxPpmH).toBeGreaterThanOrEqual(lastMax);

        lastMin = res.minPpmH;
        lastMax = res.maxPpmH;
      }
    });

    test('Every calibration interval satisfies exact linear equation y = m*x + c', () => {
      for (let i = 0; i < DEFAULT_CALIBRATION_POINTS.length - 1; i++) {
        const p1 = DEFAULT_CALIBRATION_POINTS[i];
        const p2 = DEFAULT_CALIBRATION_POINTS[i + 1];

        // Sample 10 points within interval (p1.delta_e, p2.delta_e)
        for (let step = 1; step < 10; step++) {
          const fraction = step / 10;
          const de = p1.delta_e + fraction * (p2.delta_e - p1.delta_e);
          const res = deltaEToExposure(de);

          const expectedMin = p1.dose_low_ppm_h + fraction * (p2.dose_low_ppm_h - p1.dose_low_ppm_h);
          const expectedMax = p1.dose_high_ppm_h + fraction * (p2.dose_high_ppm_h - p1.dose_high_ppm_h);

          expect(res.minPpmH).toBeCloseTo(expectedMin, 2);
          expect(res.maxPpmH).toBeCloseTo(expectedMax, 2);
        }
      }
    });
  });

  // =========================================================================
  // 6. Safety Exposure Zone Classification & Boundaries
  // =========================================================================
  describe('Safety Exposure Zone Classification Boundaries', () => {
    test('Boundary test at 2.0 ppm·h boundary (NORMAL vs ELEVATED)', () => {
      expect(getExposureZone(1.999)).toBe('NORMAL');
      expect(getExposureZone(2.000)).toBe('NORMAL');
      expect(getExposureZone(2.001)).toBe('ELEVATED');
    });

    test('Boundary test at 5.0 ppm·h boundary (ELEVATED vs HIGH)', () => {
      expect(getExposureZone(4.999)).toBe('ELEVATED');
      expect(getExposureZone(5.000)).toBe('ELEVATED');
      expect(getExposureZone(5.001)).toBe('HIGH');
    });

    test('Boundary test at 10.0 ppm·h boundary (HIGH vs CRITICAL)', () => {
      expect(getExposureZone(9.999)).toBe('HIGH');
      expect(getExposureZone(10.000)).toBe('HIGH');
      expect(getExposureZone(10.001)).toBe('CRITICAL');
      expect(getExposureZone(100.0)).toBe('CRITICAL');
    });
  });

  // =========================================================================
  // 7. Simulated Optical Chemistry Patch Scenarios
  // =========================================================================
  describe('Simulated Optical Chemistry Patch Scenarios (SbCl3 + Anthocyanin)', () => {
    test('Realistic unexposed baseline to exposed dark brown patch transition', () => {
      // Fresh unexposed patch: pale yellow/pink tint
      const unexposed = { r: 235, g: 220, b: 185 };
      // Exposed patch: darkening towards brown precipitate
      const exposed = { r: 125, g: 90, b: 65 };

      const deltaE = calculateDeltaE(unexposed, exposed);
      expect(deltaE).toBeGreaterThan(20.0);

      const dose = deltaEToExposure(deltaE);
      expect(dose.minPpmH).toBeGreaterThan(5.0);
      expect(dose.maxPpmH).toBeGreaterThan(8.0);

      const zone = getExposureZone(dose.maxPpmH);
      expect(['HIGH', 'CRITICAL']).toContain(zone);
    });

    test('evaluateConfidence handles all permutations of status and saturation', () => {
      expect(evaluateConfidence(12.0, 'ACTIVE', false)).toBe('HIGH');
      expect(evaluateConfidence(26.0, 'ACTIVE', false)).toBe('MEDIUM');
      expect(evaluateConfidence(39.0, 'ACTIVE', false)).toBe('LOW');
      expect(evaluateConfidence(12.0, 'ACTIVE', true)).toBe('LOW');
      expect(evaluateConfidence(12.0, 'EXPIRED', false)).toBe('INVALID');
      expect(evaluateConfidence(12.0, 'COMPROMISED', false)).toBe('INVALID');
      expect(evaluateConfidence(50.0, 'EXPIRED', true)).toBe('INVALID');
    });
  });
});
