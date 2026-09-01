import {
  rgbToLab,
  calculateDeltaE,
  deltaEToExposure,
  getExposureZone,
  evaluateConfidence,
  normalizeRgb,
} from '@/lib/colorimetry';

describe('Colorimetry & CIE L*a*b* Physics Engine', () => {
  describe('normalizeRgb', () => {
    test('normalizes [r, g, b] array to RgbColor object', () => {
      const result = normalizeRgb([255, 128, 64]);
      expect(result).toEqual({ r: 255, g: 128, b: 64 });
    });

    test('returns existing RgbColor object unchanged', () => {
      const input = { r: 100, g: 150, b: 200 };
      expect(normalizeRgb(input)).toBe(input);
    });
  });

  describe('rgbToLab', () => {
    test('converts pure white (255, 255, 255) to D65 reference white L* ~100, a* ~0, b* ~0', () => {
      const lab = rgbToLab({ r: 255, g: 255, b: 255 });
      expect(lab.l).toBeCloseTo(100, 0);
      expect(lab.a).toBeCloseTo(0, 0);
      expect(lab.b).toBeCloseTo(0, 0);
    });

    test('converts pure black (0, 0, 0) to L* ~0, a* ~0, b* ~0', () => {
      const lab = rgbToLab({ r: 0, g: 0, b: 0 });
      expect(lab.l).toBeCloseTo(0, 0);
      expect(lab.a).toBeCloseTo(0, 0);
      expect(lab.b).toBeCloseTo(0, 0);
    });

    test('converts pure red (255, 0, 0) with strong positive a*', () => {
      const lab = rgbToLab({ r: 255, g: 0, b: 0 });
      expect(lab.l).toBeGreaterThan(40);
      expect(lab.a).toBeGreaterThan(70); // Red has high positive a*
    });

    test('converts pure green (0, 255, 0) with negative a*', () => {
      const lab = rgbToLab({ r: 0, g: 255, b: 0 });
      expect(lab.a).toBeLessThan(-50); // Green has negative a*
    });

    test('converts pure blue (0, 0, 255) with negative b*', () => {
      const lab = rgbToLab({ r: 0, g: 0, b: 255 });
      expect(lab.b).toBeLessThan(-50); // Blue has negative b*
    });

    test('handles array notation [r, g, b]', () => {
      const lab = rgbToLab([255, 255, 255]);
      expect(lab.l).toBeCloseTo(100, 0);
    });
  });

  describe('calculateDeltaE', () => {
    test('returns 0 for identical colors', () => {
      const deltaE = calculateDeltaE({ r: 120, g: 140, b: 160 }, { r: 120, g: 140, b: 160 });
      expect(deltaE).toBe(0);
    });

    test('computes Euclidean distance between LabColor inputs directly', () => {
      const lab1 = { l: 50, a: 10, b: 20 };
      const lab2 = { l: 54, a: 7, b: 20 }; // dL = 4, da = -3, db = 0 => sqrt(16 + 9) = 5
      const deltaE = calculateDeltaE(lab1, lab2);
      expect(deltaE).toBe(5);
    });

    test('computes distance between array RGB coordinates', () => {
      const deltaE = calculateDeltaE([255, 0, 0], [0, 255, 0]);
      expect(deltaE).toBeGreaterThan(50);
    });
  });

  describe('deltaEToExposure interpolation', () => {
    test('returns 0 dose for Delta E = 0', () => {
      const res = deltaEToExposure(0);
      expect(res.minPpmH).toBe(0);
      expect(res.maxPpmH).toBe(0);
      expect(res.confidence).toBe('HIGH');
    });

    test('returns exact point for exact calibration keypoints', () => {
      const resPoint = deltaEToExposure(3.5);
      expect(resPoint.minPpmH).toBe(0.5);
      expect(resPoint.maxPpmH).toBe(1.2);

      const resMidPoint = deltaEToExposure(15.0);
      expect(resMidPoint.minPpmH).toBe(5.0);
      expect(resMidPoint.maxPpmH).toBe(8.5);
    });

    test('linearly interpolates between calibration intervals', () => {
      // 3.5 (0.5..1.2) to 8.2 (2.0..3.8) -> midpoint deltaE = (3.5 + 8.2) / 2 = 5.85
      const res = deltaEToExposure(5.85);
      expect(res.minPpmH).toBeCloseTo(1.25, 1);
      expect(res.maxPpmH).toBeCloseTo(2.5, 1);
      expect(res.confidence).toBe('HIGH');
    });

    test('handles out-of-range / saturation without extrapolation', () => {
      const resSaturated = deltaEToExposure(50.0);
      expect(resSaturated.minPpmH).toBe(20.0);
      expect(resSaturated.maxPpmH).toBe(35.0);
      expect(resSaturated.confidence).toBe('LOW');
      expect(resSaturated.outOfRange).toBe(true);
    });

    test('handles negative or invalid Delta E', () => {
      const resNeg = deltaEToExposure(-5);
      expect(resNeg.confidence).toBe('INVALID');
      expect(Number.isNaN(resNeg.minPpmH)).toBe(true);

      const resNaN = deltaEToExposure(NaN);
      expect(resNaN.confidence).toBe('INVALID');
    });
  });

  describe('getExposureZone safety thresholds', () => {
    test('0..2.0 ppm·h is NORMAL', () => {
      expect(getExposureZone(0)).toBe('NORMAL');
      expect(getExposureZone(1.5)).toBe('NORMAL');
      expect(getExposureZone(2.0)).toBe('NORMAL');
    });

    test('2.1..5.0 ppm·h is ELEVATED', () => {
      expect(getExposureZone(2.1)).toBe('ELEVATED');
      expect(getExposureZone(4.0)).toBe('ELEVATED');
      expect(getExposureZone(5.0)).toBe('ELEVATED');
    });

    test('5.1..10.0 ppm·h is HIGH', () => {
      expect(getExposureZone(5.1)).toBe('HIGH');
      expect(getExposureZone(8.5)).toBe('HIGH');
      expect(getExposureZone(10.0)).toBe('HIGH');
    });

    test('>10.0 ppm·h is CRITICAL', () => {
      expect(getExposureZone(10.1)).toBe('CRITICAL');
      expect(getExposureZone(25.0)).toBe('CRITICAL');
    });
  });

  describe('evaluateConfidence', () => {
    test('returns HIGH for normal scans with deltaE <= 25', () => {
      expect(evaluateConfidence(10.0, 'ACTIVE', false)).toBe('HIGH');
    });

    test('returns MEDIUM for higher deltaE (25 < deltaE <= 38)', () => {
      expect(evaluateConfidence(30.0, 'ACTIVE', false)).toBe('MEDIUM');
    });

    test('returns LOW when saturation detected or deltaE > 38', () => {
      expect(evaluateConfidence(40.0, 'ACTIVE', false)).toBe('LOW');
      expect(evaluateConfidence(10.0, 'ACTIVE', true)).toBe('LOW');
    });

    test('returns INVALID when patch status is EXPIRED or COMPROMISED', () => {
      expect(evaluateConfidence(5.0, 'EXPIRED', false)).toBe('INVALID');
      expect(evaluateConfidence(5.0, 'COMPROMISED', false)).toBe('INVALID');
    });
  });
});
