import { rgbToLab } from './src/lib/colorimetry';

// Mathematical Reference Implementation according to CIE 15:2004 & IEC 61966-2-1
function mathRefRgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  const toLin = (c: number) => {
    const v = Math.max(0, Math.min(255, c)) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const rLin = toLin(r);
  const gLin = toLin(g);
  const bLin = toLin(b);

  const x = rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375;
  const y = rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.0721750;
  const z = rLin * 0.0193339 + gLin * 0.1191920 + bLin * 0.9503041;

  const xn = 0.95047;
  const yn = 1.0;
  const zn = 1.08883;

  const f = (t: number) => {
    const d = 6 / 29;
    return t > d * d * d ? Math.cbrt(t) : t / (3 * d * d) + 4 / 29;
  };

  const fx = f(x / xn);
  const fy = f(y / yn);
  const fz = f(z / zn);

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return { l, a, b: bVal };
}

// Compare across 10,000 random RGB triplets
let maxDiff = 0;
for (let i = 0; i < 10000; i++) {
  const r = Math.random() * 255;
  const g = Math.random() * 255;
  const b = Math.random() * 255;

  const actual = rgbToLab({ r, g, b });
  const expected = mathRefRgbToLab(r, g, b);

  const diffL = Math.abs(actual.l - expected.l);
  const diffA = Math.abs(actual.a - expected.a);
  const diffB = Math.abs(actual.b - expected.b);

  const totalDiff = Math.max(diffL, diffA, diffB);
  if (totalDiff > maxDiff) maxDiff = totalDiff;
}

console.log(`Max difference between lib implementation and CIE 15:2004 standard math: ${maxDiff.toFixed(8)}`);
if (maxDiff < 0.0001) {
  console.log('PERFECT MATHEMATICAL IDENTITY VERIFIED!');
} else {
  console.error('MATHEMATICAL DIVERGENCE FOUND!');
}
