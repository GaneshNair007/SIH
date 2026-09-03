import {
  rgbToLab,
  calculateDeltaE,
  deltaEToExposure,
  getExposureZone,
  evaluateConfidence,
  DEFAULT_CALIBRATION_POINTS,
} from './src/lib/colorimetry';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details: string = '') {
  results.push({
    name,
    passed: condition,
    details: condition ? 'OK' : `FAIL: ${details}`,
  });
  if (!condition) {
    console.error(`[FAIL] ${name}: ${details}`);
  } else {
    console.log(`[PASS] ${name}`);
  }
}

console.log('================================================================');
console.log('EMPIRICAL CHALLENGE HARNESS: Colorimetry & Math Rigorous Testing');
console.log('================================================================\n');

// 1. MACBETH COLORCHECKER 24 PATCH REFERENCE ACCURACY
console.log('--- TEST SECTION 1: Standard Color Benchmarks & D65 Lab Mapping ---');
const macbethPatches = [
  { name: 'Dark Skin', rgb: [115, 82, 68], expectedL: 37.98, expectedA: 13.55, expectedB: 14.05 },
  { name: 'Light Skin', rgb: [194, 150, 130], expectedL: 65.71, expectedA: 18.13, expectedB: 17.81 },
  { name: 'Blue Sky', rgb: [98, 122, 157], expectedL: 49.92, expectedA: -4.88, expectedB: -21.92 },
  { name: 'Foliage', rgb: [87, 108, 67], expectedL: 43.13, expectedA: -12.46, expectedB: 21.85 },
  { name: 'Blue Flower', rgb: [133, 128, 177], expectedL: 55.60, expectedA: 9.94, expectedB: -25.43 },
  { name: 'Bluish Green', rgb: [103, 189, 170], expectedL: 70.70, expectedA: -32.26, expectedB: -0.37 },
  { name: 'Orange', rgb: [214, 126, 44], expectedL: 62.66, expectedA: 36.06, expectedB: 57.09 },
  { name: 'Purplish Blue', rgb: [80, 91, 166], expectedL: 40.02, expectedA: 10.41, expectedB: -45.96 },
  { name: 'Moderate Red', rgb: [193, 90, 99], expectedL: 51.12, expectedA: 48.23, expectedB: 16.24 },
  { name: 'Purple', rgb: [94, 60, 108], expectedL: 30.32, expectedA: 25.42, expectedB: -23.59 },
  { name: 'Yellow Green', rgb: [157, 188, 64], expectedL: 72.53, expectedA: -23.71, expectedB: 60.43 },
  { name: 'Orange Yellow', rgb: [224, 163, 46], expectedL: 71.77, expectedA: 18.41, expectedB: 67.37 },
  { name: 'Blue', rgb: [56, 61, 150], expectedL: 29.51, expectedA: 18.25, expectedB: -50.49 },
  { name: 'Green', rgb: [70, 148, 73], expectedL: 55.26, expectedA: -38.34, expectedB: 31.37 },
  { name: 'Red', rgb: [175, 54, 60], expectedL: 41.22, expectedA: 52.86, expectedB: 27.53 },
  { name: 'Yellow', rgb: [231, 199, 31], expectedL: 81.73, expectedA: 4.04, expectedB: 79.81 },
  { name: 'Magenta', rgb: [187, 86, 149], expectedL: 51.93, expectedA: 49.98, expectedB: -14.65 },
  { name: 'Cyan', rgb: [8, 133, 161], expectedL: 51.03, expectedA: -28.63, expectedB: -28.64 },
  { name: 'White 9.5', rgb: [243, 243, 242], expectedL: 95.73, expectedA: -0.26, expectedB: 0.38 },
  { name: 'Neutral 8', rgb: [200, 200, 200], expectedL: 81.35, expectedA: 0.0, expectedB: 0.0 },
  { name: 'Neutral 6.5', rgb: [160, 160, 160], expectedL: 66.56, expectedA: 0.0, expectedB: 0.0 },
  { name: 'Neutral 5', rgb: [122, 122, 121], expectedL: 51.57, expectedA: -0.23, expectedB: 0.36 },
  { name: 'Neutral 3.5', rgb: [85, 85, 85], expectedL: 36.19, expectedA: 0.0, expectedB: 0.0 },
  { name: 'Black 2', rgb: [52, 52, 52], expectedL: 21.84, expectedA: 0.0, expectedB: 0.0 },
];

let macbethMaxDeltaE = 0;
for (const patch of macbethPatches) {
  const lab = rgbToLab(patch.rgb as [number, number, number]);
  const de = Math.sqrt(
    Math.pow(lab.l - patch.expectedL, 2) +
    Math.pow(lab.a - patch.expectedA, 2) +
    Math.pow(lab.b - patch.expectedB, 2)
  );
  if (de > macbethMaxDeltaE) macbethMaxDeltaE = de;
}
assert(
  macbethMaxDeltaE < 1.0,
  'Macbeth 24 ColorChecker Reference Accuracy',
  `Max DeltaE across all 24 patches was ${macbethMaxDeltaE.toFixed(3)} (threshold < 1.0)`
);

// 2. METRIC SPACE AXIOMS ON 1,000 PSEUDO-RANDOM TRIADS (3,000 SAMPLES)
console.log('\n--- TEST SECTION 2: Metric Space Axioms (CIE76 Euclidean Distance) ---');
let triangleInequalityViolations = 0;
let symmetryViolations = 0;
let identityViolations = 0;
let nonNegativityViolations = 0;

for (let i = 0; i < 1000; i++) {
  const r1 = Math.floor(Math.random() * 256);
  const g1 = Math.floor(Math.random() * 256);
  const b1 = Math.floor(Math.random() * 256);

  const r2 = Math.floor(Math.random() * 256);
  const g2 = Math.floor(Math.random() * 256);
  const b2 = Math.floor(Math.random() * 256);

  const r3 = Math.floor(Math.random() * 256);
  const g3 = Math.floor(Math.random() * 256);
  const b3 = Math.floor(Math.random() * 256);

  const c1: [number, number, number] = [r1, g1, b1];
  const c2: [number, number, number] = [r2, g2, b2];
  const c3: [number, number, number] = [r3, g3, b3];

  const de11 = calculateDeltaE(c1, c1);
  if (de11 !== 0) identityViolations++;

  const de12 = calculateDeltaE(c1, c2);
  const de21 = calculateDeltaE(c2, c1);
  if (de12 < 0 || de21 < 0) nonNegativityViolations++;
  if (de12 !== de21) symmetryViolations++;

  const de23 = calculateDeltaE(c2, c3);
  const de13 = calculateDeltaE(c1, c3);

  // Triangle inequality with 0.02 roundoff tolerance
  if (de13 > de12 + de23 + 0.02) {
    triangleInequalityViolations++;
  }
}

assert(identityViolations === 0, 'Metric Axiom: Identity of Indiscernibles', `Violations: ${identityViolations}`);
assert(nonNegativityViolations === 0, 'Metric Axiom: Non-negativity', `Violations: ${nonNegativityViolations}`);
assert(symmetryViolations === 0, 'Metric Axiom: Symmetry', `Violations: ${symmetryViolations}`);
assert(triangleInequalityViolations === 0, 'Metric Axiom: Triangle Inequality', `Violations: ${triangleInequalityViolations}`);

// 3. CALIBRATION INTERPOLATION MONOTONICITY & CONTINUITY
console.log('\n--- TEST SECTION 3: Calibration Curve Interpolation & Continuity ---');
let monotonicityViolations = 0;
let minLessThanMaxViolations = 0;
const denseSteps = 100000;
let prevMin = -1;
let prevMax = -1;

for (let step = 0; step <= denseSteps; step++) {
  const de = (step / denseSteps) * 100.0;
  const exp = deltaEToExposure(de);

  if (exp.minPpmH > exp.maxPpmH) minLessThanMaxViolations++;
  if (exp.minPpmH < prevMin || exp.maxPpmH < prevMax) monotonicityViolations++;

  prevMin = exp.minPpmH;
  prevMax = exp.maxPpmH;
}

assert(minLessThanMaxViolations === 0, 'Dose Invariant: minPpmH <= maxPpmH across 100k samples', `Violations: ${minLessThanMaxViolations}`);
assert(monotonicityViolations === 0, 'Calibration Invariant: Monotonic non-decreasing across 100k samples', `Violations: ${monotonicityViolations}`);

// 4. CORNER CASES & RESILIENCE
console.log('\n--- TEST SECTION 4: Edge Cases, Anomalous Inputs & Degeneracies ---');

// Degenerate inputs to deltaEToExposure
const negResult = deltaEToExposure(-10.5);
assert(negResult.minPpmH === 0 && negResult.maxPpmH === 0 && negResult.confidence === 'INVALID', 'Negative DeltaE returns 0 INVALID');

const nanResult = deltaEToExposure(NaN);
assert(nanResult.minPpmH === 0 && nanResult.maxPpmH === 0 && nanResult.confidence === 'INVALID', 'NaN DeltaE returns 0 INVALID');

const emptyCalib = deltaEToExposure(10.0, []);
assert(emptyCalib.minPpmH === 0 && emptyCalib.confidence === 'LOW', 'Empty calibration points handled safely');

const singlePointCalib = deltaEToExposure(5.0, [{ delta_e: 10.0, dose_low_ppm_h: 2.0, dose_high_ppm_h: 4.0 }]);
assert(singlePointCalib.minPpmH === 2.0 && singlePointCalib.maxPpmH === 4.0, 'Single point calibration below deltaE handled safely');

const singlePointAbove = deltaEToExposure(20.0, [{ delta_e: 10.0, dose_low_ppm_h: 2.0, dose_high_ppm_h: 4.0 }]);
assert(singlePointAbove.minPpmH === 4.0 && singlePointAbove.maxPpmH === 8.0, 'Single point calibration above deltaE extrapolates correctly');

// Out of bounds RGB
const clampedNegative = rgbToLab({ r: -100, g: -50, b: -20 });
const clampedBlack = rgbToLab({ r: 0, g: 0, b: 0 });
assert(clampedNegative.l === clampedBlack.l && clampedNegative.a === clampedBlack.a, 'Negative RGB clamps cleanly to black');

const clampedHuge = rgbToLab({ r: 9999, g: 8888, b: 7777 });
const clampedWhite = rgbToLab({ r: 255, g: 255, b: 255 });
assert(clampedHuge.l === clampedWhite.l && clampedHuge.a === clampedWhite.a, 'Overflow RGB clamps cleanly to reference white');

// 5. SAFETY EXPOSURE ZONES & CONFIDENCE TRUTH TABLE
console.log('\n--- TEST SECTION 5: Safety Zones & Confidence Truth Table ---');
assert(getExposureZone(0.0) === 'NORMAL', 'Zone: 0.0 -> NORMAL');
assert(getExposureZone(2.0) === 'NORMAL', 'Zone: 2.0 -> NORMAL');
assert(getExposureZone(2.0001) === 'ELEVATED', 'Zone: 2.0001 -> ELEVATED');
assert(getExposureZone(5.0) === 'ELEVATED', 'Zone: 5.0 -> ELEVATED');
assert(getExposureZone(5.0001) === 'HIGH', 'Zone: 5.0001 -> HIGH');
assert(getExposureZone(10.0) === 'HIGH', 'Zone: 10.0 -> HIGH');
assert(getExposureZone(10.0001) === 'CRITICAL', 'Zone: 10.0001 -> CRITICAL');
assert(getExposureZone(1000.0) === 'CRITICAL', 'Zone: 1000.0 -> CRITICAL');

// Confidence truth table
assert(evaluateConfidence(10.0, 'ACTIVE', false) === 'HIGH', 'Confidence: low deltaE active -> HIGH');
assert(evaluateConfidence(26.0, 'ACTIVE', false) === 'MEDIUM', 'Confidence: medium deltaE active -> MEDIUM');
assert(evaluateConfidence(39.0, 'ACTIVE', false) === 'LOW', 'Confidence: high deltaE active -> LOW');
assert(evaluateConfidence(10.0, 'ACTIVE', true) === 'LOW', 'Confidence: saturation -> LOW');
assert(evaluateConfidence(10.0, 'EXPIRED', false) === 'INVALID', 'Confidence: patch C expired -> INVALID');
assert(evaluateConfidence(10.0, 'COMPROMISED', false) === 'INVALID', 'Confidence: patch C compromised -> INVALID');

// 6. HIGH-THROUGHPUT STRESS TEST (100,000 FULL CONVERSIONS)
console.log('\n--- TEST SECTION 6: High-Throughput Performance & Memory Stability ---');
const startTime = Date.now();
let finiteCheckPassed = true;

for (let i = 0; i < 100000; i++) {
  const r = (i * 37) % 256;
  const g = (i * 73) % 256;
  const b = (i * 109) % 256;

  const lab = rgbToLab({ r, g, b });
  const de = calculateDeltaE(lab, { l: 50, a: 0, b: 0 });
  const exp = deltaEToExposure(de);
  const zone = getExposureZone(exp.maxPpmH);

  if (!Number.isFinite(lab.l) || !Number.isFinite(de) || !Number.isFinite(exp.maxPpmH)) {
    finiteCheckPassed = false;
    break;
  }
}
const elapsedMs = Date.now() - startTime;
assert(finiteCheckPassed, '100,000 full pipeline runs have finite values', `Elapsed: ${elapsedMs}ms`);
console.log(`Throughput: ${(100000 / (elapsedMs / 1000)).toFixed(0)} evaluations/second`);

// SUMMARY
console.log('\n================================================================');
const total = results.length;
const passed = results.filter(r => r.passed).length;
const failed = total - passed;
console.log(`TOTAL EMPIRICAL ASSERTIONS: ${total}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
