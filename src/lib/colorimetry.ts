import type { RgbColor, LabColor, ConfidenceLevel, ExposureZone } from '@/types/domain';

export const DEFAULT_CALIBRATION_POINTS = [
  { delta_e: 0.0, dose_low_ppm_h: 0.0, dose_high_ppm_h: 0.0 },
  { delta_e: 3.5, dose_low_ppm_h: 0.5, dose_high_ppm_h: 1.2 },
  { delta_e: 8.2, dose_low_ppm_h: 2.0, dose_high_ppm_h: 3.8 },
  { delta_e: 15.0, dose_low_ppm_h: 5.0, dose_high_ppm_h: 8.5 },
  { delta_e: 25.0, dose_low_ppm_h: 10.0, dose_high_ppm_h: 18.0 },
  { delta_e: 38.0, dose_low_ppm_h: 20.0, dose_high_ppm_h: 35.0 },
];

/**
 * Normalizes input RGB to an RgbColor object.
 */
export function normalizeRgb(rgb: RgbColor | [number, number, number]): RgbColor {
  if (Array.isArray(rgb)) {
    return { r: rgb[0], g: rgb[1], b: rgb[2] };
  }
  return rgb;
}

/**
 * Converts sRGB [0..255] component to linear RGB [0..1]
 */
function srgbToLinear(c: number): number {
  const val = Math.max(0, Math.min(255, c)) / 255;
  return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
}

/**
 * Converts sRGB color to CIE L*a*b* under D65 standard illuminant.
 */
export function rgbToLab(rgb: RgbColor | [number, number, number]): LabColor {
  const { r, g, b } = normalizeRgb(rgb);

  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);

  // Linear RGB to CIE XYZ (D65)
  const x = (rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375);
  const y = (rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.0721750);
  const z = (rLin * 0.0193339 + gLin * 0.1191920 + bLin * 0.9503041);

  // D65 reference white coordinates
  const xn = 0.95047;
  const yn = 1.00000;
  const zn = 1.08883;

  const f = (t: number): number => {
    const delta = 6 / 29;
    return t > Math.pow(delta, 3) ? Math.cbrt(t) : (t / (3 * delta * delta)) + (4 / 29);
  };

  const fx = f(x / xn);
  const fy = f(y / yn);
  const fz = f(z / zn);

  const l = 116 * fy - 16;
  const aLab = 500 * (fx - fy);
  const bLab = 200 * (fy - fz);

  return {
    l: Number(l.toFixed(4)),
    a: Number(aLab.toFixed(4)),
    b: Number(bLab.toFixed(4)),
  };
}

/**
 * Calculates Euclidean CIE Delta E (CIE76) between two colors (RGB or Lab).
 */
export function calculateDeltaE(
  c1: RgbColor | LabColor | [number, number, number],
  c2: RgbColor | LabColor | [number, number, number]
): number {
  let lab1: LabColor;
  let lab2: LabColor;

  if (Array.isArray(c1) || ('r' in c1 && 'g' in c1 && 'b' in c1)) {
    lab1 = rgbToLab(c1 as RgbColor | [number, number, number]);
  } else {
    lab1 = c1 as LabColor;
  }

  if (Array.isArray(c2) || ('r' in c2 && 'g' in c2 && 'b' in c2)) {
    lab2 = rgbToLab(c2 as RgbColor | [number, number, number]);
  } else {
    lab2 = c2 as LabColor;
  }

  const dL = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;

  const deltaE = Math.sqrt(dL * dL + da * da + db * db);
  return Number(deltaE.toFixed(2));
}

/**
 * Interpolates Delta E against calibration lookup points to determine dose range in ppm·h.
 */
export function deltaEToExposure(
  deltaE: number,
  calibrationPoints: Array<{ delta_e: number; dose_low_ppm_h: number; dose_high_ppm_h: number }> = DEFAULT_CALIBRATION_POINTS
): { minPpmH: number; maxPpmH: number; confidence: ConfidenceLevel; calibrated: boolean; outOfRange: boolean } {
  if (deltaE < 0 || isNaN(deltaE)) {
    return { minPpmH: Number.NaN, maxPpmH: Number.NaN, confidence: 'INVALID', calibrated: false, outOfRange: false };
  }

  const sortedPoints = [...calibrationPoints].sort((p1, p2) => p1.delta_e - p2.delta_e);

  if (sortedPoints.length === 0) {
    return { minPpmH: Number.NaN, maxPpmH: Number.NaN, confidence: 'INVALID', calibrated: false, outOfRange: false };
  }

  if (deltaE <= sortedPoints[0].delta_e) {
    return {
      minPpmH: sortedPoints[0].dose_low_ppm_h,
      maxPpmH: sortedPoints[0].dose_high_ppm_h,
      confidence: 'HIGH',
      calibrated: true,
      outOfRange: false,
    };
  }

  const lastPoint = sortedPoints[sortedPoints.length - 1];
  if (deltaE >= lastPoint.delta_e) {
    // Never extrapolate a quantitative dose beyond the eligible range.
    return {
      minPpmH: lastPoint.dose_low_ppm_h,
      maxPpmH: lastPoint.dose_high_ppm_h,
      confidence: 'LOW',
      calibrated: true,
      outOfRange: deltaE > lastPoint.delta_e,
    };
  }

  // Piecewise linear interpolation
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const p1 = sortedPoints[i];
    const p2 = sortedPoints[i + 1];

    if (deltaE >= p1.delta_e && deltaE <= p2.delta_e) {
      const span = p2.delta_e - p1.delta_e;
      const fraction = span === 0 ? 0 : (deltaE - p1.delta_e) / span;

      const minPpmH = p1.dose_low_ppm_h + fraction * (p2.dose_low_ppm_h - p1.dose_low_ppm_h);
      const maxPpmH = p1.dose_high_ppm_h + fraction * (p2.dose_high_ppm_h - p1.dose_high_ppm_h);

      return {
        minPpmH: Number(minPpmH.toFixed(2)),
        maxPpmH: Number(maxPpmH.toFixed(2)),
        confidence: deltaE > 30.0 ? 'MEDIUM' : 'HIGH',
        calibrated: true,
        outOfRange: false,
      };
    }
  }

  return { minPpmH: Number.NaN, maxPpmH: Number.NaN, confidence: 'INVALID', calibrated: false, outOfRange: false };
}

/**
 * Classifies exposure dose into industrial safety zones.
 */
export function getExposureZone(ppmHours: number): ExposureZone {
  if (ppmHours <= 2.0) return 'NORMAL';
  if (ppmHours <= 5.0) return 'ELEVATED';
  if (ppmHours <= 10.0) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Evaluates scan confidence based on optical criteria.
 */
export function evaluateConfidence(
  deltaE: number,
  patchCStatus: string = 'ACTIVE',
  saturationDetected: boolean = false
): ConfidenceLevel {
  if (patchCStatus === 'EXPIRED' || patchCStatus === 'COMPROMISED') {
    return 'INVALID';
  }
  if (saturationDetected || deltaE > 38.0) {
    return 'LOW';
  }
  if (deltaE > 25.0) {
    return 'MEDIUM';
  }
  return 'HIGH';
}
