# Milestone M2 Remediation Technical Investigation & Analysis

**Investigator**: Explorer 1 (`explorer_m2_4`)  
**Mission**: Milestone M2 Remediation (Iteration 2) Investigation  
**Scope**: Codebase syntax, type validity, build stability, linting conformance, and exact remediation instructions.

---

## 1. Executive Summary

A comprehensive investigation into the Milestone M2 codebase was performed across TypeScript type checking (`npx tsc --noEmit`), ESLint conformance (`npx eslint src/`), production compilation (`npm run build`), and Jest test execution (`npm test`).

### Diagnostic Status Summary

| Check | Tool / Command | Current Status | Cause / Details |
|---|---|---|---|
| **Jest Test Suite** | `npm test` | **PASS** (104/104 tests) | 8 test suites passing cleanly across colorimetry, mock store, Supabase, auth, adversarial stress tests. |
| **TypeScript Typecheck** | `npx tsc --noEmit` | **FAIL** (8 errors across 2 files) | `src/app/api/scans/route.ts` (7 property/signature mismatches with `colorimetry.ts`) and `src/app/control-room/page.tsx` (1 Date nullable parameter error). |
| **ESLint Validation** | `npx eslint src/` | **FAIL** (20 errors across 5 files) | `@typescript-eslint/no-unused-vars` in `control-room/page.tsx`, `login/page.tsx`, `page.tsx`, `readme/page.tsx`, `worker/page.tsx`. |
| **Next.js Production Build** | `npm run build` | **FAIL** (Exit code 1) | Next.js build invokes `next lint` and type validation, halting on the ESLint and TS errors above. |

---

## 2. Forensic Audit Findings: Status Verification

We independently verified the 4 issues highlighted in the Forensic Auditor report (`auditor_m2_1/handoff.md`):

### 1. `src/app/login/page.tsx`: Cannot find name 'UserRole'
- **Status**: **PARTIALLY REMEDIATED / LINT DEFECT REMAINING**
- **Evidence**: `import type { UserRole } from "@/types/domain";` was added at line 10. However, `ShieldCheck` was imported on line 6 without being used in JSX, creating an ESLint `@typescript-eslint/no-unused-vars` error.

### 2. `src/hooks/useAlerts.ts`: Mutation generic mismatch for `onError` context in TanStack Query v5
- **Status**: **FULLY REMEDIATED**
- **Evidence**: Line 36 now provides the 4th generic parameter:
  ```ts
  return useMutation<
    Alert,
    Error,
    { alertId: string; acknowledgedBy?: string; actionNotes?: string },
    { previousAlerts?: Alert[] }
  >({
  ```
  `npx tsc --noEmit` on `src/hooks/useAlerts.ts` generates 0 errors.

### 3. `src/lib/mockStore.ts`: Module '@types/domain' has no exported member 'Json'
- **Status**: **FULLY REMEDIATED**
- **Evidence**: `src/types/domain.ts` now re-exports `Json` from `./database`. Line 17 of `src/lib/mockStore.ts` imports `Json` cleanly with 0 type errors.

### 4. `src/lib/supabase/mockData.ts`: Unused parameter `_companyId` in `getMockManagerStats`
- **Status**: **FULLY REMEDIATED**
- **Evidence**: `getMockManagerStats(companyId?: string)` on line 894 uses `targetCompanyId = companyId || MOCK_COMPANY.id` across workers, bands, shifts, readings, and alerts. Lint checks pass with 0 errors.

---

## 3. Detailed Root Cause Analysis for Remaining Defects

### 3.1. TypeScript Errors in `src/app/api/scans/route.ts`

**Root Cause**:
- `src/app/api/scans/route.ts` line 47 calls `evaluateConfidence(labA, labC)`. But in `src/lib/colorimetry.ts`, `evaluateConfidence` has the signature `(deltaE: number, patchCStatus?: string, saturationDetected?: boolean): ConfidenceLevel`. Passing `LabColor` objects causes `TS2345: Argument of type 'LabColor' is not assignable to parameter of type 'number'`.
- `deltaEToExposure(deltaE)` in `src/lib/colorimetry.ts` returns `{ minPpmH: number; maxPpmH: number; confidence: ConfidenceLevel }`.
- Lines 53–59 attempt to access `dose.low_ppm_h`, `dose.high_ppm_h`, `dose.nominal_ppm_h`, `dose.is_saturated`, `dose.zone`, none of which exist on the return type of `deltaEToExposure`.

**Remediation**:
- Compute `isSaturated = deltaE > 38.0`.
- Compute `confidence = evaluateConfidence(deltaE, 'ACTIVE', isSaturated)`.
- Compute `zone = getExposureZone(dose.maxPpmH)`.
- Compute `nominalPpmH = Number(((dose.minPpmH + dose.maxPpmH) / 2).toFixed(2))`.
- Map response fields directly to `dose.minPpmH`, `dose.maxPpmH`, `nominalPpmH`, `confidence`, `isSaturated`, `zone`.

---

### 3.2. TypeScript Error in `src/app/control-room/page.tsx`

**Root Cause**:
- Line 298: `{new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
- In `src/types/database.ts` / `src/types/domain.ts`, `Alert.created_at` has type `string | null`.
- Passing `null` to `new Date()` causes `TS2769: No overload matches this call` because the `Date` constructor expects `string | number | Date`.

**Remediation**:
- Guard against null:
  ```tsx
  {alert.created_at
    ? new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--"}
  ```

---

### 3.3. ESLint Unused Variable Errors (`@typescript-eslint/no-unused-vars`)

Next.js 14 fails production builds when ESLint rules are violated. The following files contain unused variables/imports:

1. **`src/app/login/page.tsx`**:
   - Line 6: `ShieldCheck` imported from `"lucide-react"` is never used.
2. **`src/app/control-room/page.tsx`**:
   - Line 6, 14, 15: `ShieldCheck`, `Flame`, `ArrowUpRight` imported from `"lucide-react"` are never used.
   - Line 49: `const [selectedZone, setSelectedZone] = useState<string | null>(null);` is defined but never used in JSX.
3. **`src/app/page.tsx`**:
   - Line 8, 11, 19: `Activity`, `CheckCircle2`, `Search` imported from `"lucide-react"` are never used.
   - Line 26: `const [cursorHovered, setCursorHovered] = useState(false);` is defined but never used.
   - Line 47: `const scene01 = document.getElementById("scene-01");` is assigned but never used.
   - Line 500: `const Icon = item.icon;` is defined in `analysisItems.map` but never used.
4. **`src/app/readme/page.tsx`**:
   - Line 2: `CheckCircle2`, `XCircle`, `ShieldCheck`, `FileText` imported from `"lucide-react"` are never used.
5. **`src/app/worker/page.tsx`**:
   - Line 7, 8, 14: `User`, `ShieldAlert`, `Flame` imported from `"lucide-react"` are never used.
   - Line 24: `const [selectedRange, setSelectedRange] = useState<"7d" | "30d" | "all">("7d");` is defined but never used.

---

## 4. Exact Remediation Instructions (Code Changes)

Below are the exact before $\rightarrow$ after code snippets for the implementing worker:

### Target File 1: `src/app/api/scans/route.ts`

**Lines 1–66**:
```ts
// BEFORE (Lines 1-66)
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rgbToLab, calculateDeltaE, deltaEToExposure, evaluateConfidence } from '@/lib/colorimetry';

const rgbSchema = z.object({
  r: z.number().min(0).max(255),
  g: z.number().min(0).max(255),
  b: z.number().min(0).max(255),
});

const scanPayloadSchema = z.object({
  worker_id: z.string(),
  band_id: z.string().optional(),
  shift_id: z.string().optional(),
  reading_type: z.enum(['START', 'END']),
  patch_a_rgb: rgbSchema,
  patch_b_rgb: rgbSchema,
  patch_c_rgb: rgbSchema,
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = scanPayloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid optical scan payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { patch_a_rgb, patch_b_rgb, patch_c_rgb } = parsed.data;

    // Convert to CIE L*a*b*
    const labA = rgbToLab(patch_a_rgb);
    const labB = rgbToLab(patch_b_rgb);
    const labC = rgbToLab(patch_c_rgb);

    // Calculate Delta E colorimetric shift between unexposed baseline (A) and exposed reactive patch (B)
    const deltaE = calculateDeltaE(labA, labB);

    // Convert Delta E to exposure dosage ranges
    const dose = deltaEToExposure(deltaE);

    // Evaluate confidence based on patch C (7-day chemical expiry reference)
    const confidence = evaluateConfidence(labA, labC);

    return NextResponse.json(
      {
        success: true,
        delta_e: parseFloat(deltaE.toFixed(2)),
        dose_low_ppm_h: dose.low_ppm_h,
        dose_high_ppm_h: dose.high_ppm_h,
        dose_nominal_ppm_h: dose.nominal_ppm_h,
        confidence,
        saturation_detected: dose.is_saturated,
        zone: dose.zone,
        message: dose.is_saturated
          ? 'Sensor patch saturation detected! Mandatory band retirement triggered.'
          : 'Optical reading processed successfully.',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Optical calculation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

```ts
// AFTER (Lines 1-68)
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rgbToLab, calculateDeltaE, deltaEToExposure, evaluateConfidence, getExposureZone } from '@/lib/colorimetry';

const rgbSchema = z.object({
  r: z.number().min(0).max(255),
  g: z.number().min(0).max(255),
  b: z.number().min(0).max(255),
});

const scanPayloadSchema = z.object({
  worker_id: z.string(),
  band_id: z.string().optional(),
  shift_id: z.string().optional(),
  reading_type: z.enum(['START', 'END']),
  patch_a_rgb: rgbSchema,
  patch_b_rgb: rgbSchema,
  patch_c_rgb: rgbSchema,
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = scanPayloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid optical scan payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { patch_a_rgb, patch_b_rgb } = parsed.data;

    // Convert to CIE L*a*b*
    const labA = rgbToLab(patch_a_rgb);
    const labB = rgbToLab(patch_b_rgb);

    // Calculate Delta E colorimetric shift between unexposed baseline (A) and exposed reactive patch (B)
    const deltaE = calculateDeltaE(labA, labB);

    // Convert Delta E to exposure dosage ranges
    const dose = deltaEToExposure(deltaE);

    // Evaluate confidence and saturation
    const isSaturated = deltaE > 38.0;
    const confidence = evaluateConfidence(deltaE, 'ACTIVE', isSaturated);
    const zone = getExposureZone(dose.maxPpmH);
    const nominalPpmH = Number(((dose.minPpmH + dose.maxPpmH) / 2).toFixed(2));

    return NextResponse.json(
      {
        success: true,
        delta_e: parseFloat(deltaE.toFixed(2)),
        dose_low_ppm_h: dose.minPpmH,
        dose_high_ppm_h: dose.maxPpmH,
        dose_nominal_ppm_h: nominalPpmH,
        confidence,
        saturation_detected: isSaturated,
        zone: zone,
        message: isSaturated
          ? 'Sensor patch saturation detected! Mandatory band retirement triggered.'
          : 'Optical reading processed successfully.',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Optical calculation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

---

### Target File 2: `src/app/control-room/page.tsx`

**Lines 1–20 (Imports)**:
```tsx
// BEFORE
import {
  ShieldCheck,
  LogOut,
  Activity,
  Users,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Loader2,
  Flame,
  ArrowUpRight,
} from "lucide-react";
```
```tsx
// AFTER
import {
  LogOut,
  Activity,
  Users,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Loader2,
} from "lucide-react";
```

**Lines 48–52**:
```tsx
// BEFORE
export default function ControlRoom() {
  const queryClient = useQueryClient();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
```
```tsx
// AFTER
export default function ControlRoom() {
  const queryClient = useQueryClient();
```

**Lines 295–302**:
```tsx
// BEFORE
<span className="text-[10px] font-mono text-slate-500">
  {new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
</span>
```
```tsx
// AFTER
<span className="text-[10px] font-mono text-slate-500">
  {alert.created_at
    ? new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--"}
</span>
```

---

### Target File 3: `src/app/login/page.tsx`

**Lines 4–8 (Imports)**:
```tsx
// BEFORE
import { ShieldCheck, ArrowRight, User, Briefcase, Loader2, KeyRound, Activity } from "lucide-react";
```
```tsx
// AFTER
import { ArrowRight, User, Briefcase, Loader2, KeyRound, Activity } from "lucide-react";
```

---

### Target File 4: `src/app/page.tsx`

**Lines 4–22 (Imports)**:
```tsx
// BEFORE
import {
  ArrowRight,
  ShieldCheck,
  Activity,
  ChevronRight,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Database,
  Layers,
  Cpu,
  Eye,
  Users,
  Search,
  Code2,
} from "lucide-react";
```
```tsx
// AFTER
import {
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Zap,
  AlertTriangle,
  FileText,
  Database,
  Layers,
  Cpu,
  Eye,
  Users,
  Code2,
} from "lucide-react";
```

**Lines 24–28**:
```tsx
// BEFORE
  const [activeScene, setActiveScene] = useState("scene-01");
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [cursorHovered, setCursorHovered] = useState(false);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<number>(0);
```
```tsx
// AFTER
  const [activeScene, setActiveScene] = useState("scene-01");
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<number>(0);
```

**Lines 44–56 (Scroll Spy)**:
```tsx
// BEFORE
  useEffect(() => {
    const handleScroll = () => {
      const scene01 = document.getElementById("scene-01");
      const sceneAnalysis = document.getElementById("scene-analysis");
      const scene02 = document.getElementById("scene-02");
      const scrollY = window.scrollY + window.innerHeight / 3;

      if (scene02 && scrollY >= scene02.offsetTop) {
        setActiveScene("scene-02");
      } else if (sceneAnalysis && scrollY >= sceneAnalysis.offsetTop) {
        setActiveScene("scene-analysis");
      } else {
        setActiveScene("scene-01");
      }
```
```tsx
// AFTER
  useEffect(() => {
    const handleScroll = () => {
      const sceneAnalysis = document.getElementById("scene-analysis");
      const scene02 = document.getElementById("scene-02");
      const scrollY = window.scrollY + window.innerHeight / 3;

      if (scene02 && scrollY >= scene02.offsetTop) {
        setActiveScene("scene-02");
      } else if (sceneAnalysis && scrollY >= sceneAnalysis.offsetTop) {
        setActiveScene("scene-analysis");
      } else {
        setActiveScene("scene-01");
      }
```

**Lines 498–505**:
```tsx
// BEFORE
              <div className="lg:col-span-4 space-y-2.5">
                {analysisItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = activeAnalysisTab === idx;
                  return (
```
```tsx
// AFTER
              <div className="lg:col-span-4 space-y-2.5">
                {analysisItems.map((item, idx) => {
                  const isActive = activeAnalysisTab === idx;
                  return (
```

---

### Target File 5: `src/app/readme/page.tsx`

**Lines 1–3**:
```tsx
// BEFORE
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, ShieldCheck, FileText, ArrowRight } from "lucide-react";
```
```tsx
// AFTER
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
```

---

### Target File 6: `src/app/worker/page.tsx`

**Lines 4–15 (Imports)**:
```tsx
// BEFORE
import {
  LogOut,
  User,
  ShieldAlert,
  CheckCircle2,
  Activity,
  Calendar,
  AlertCircle,
  Download,
  Flame,
} from "lucide-react";
```
```tsx
// AFTER
import {
  LogOut,
  CheckCircle2,
  Activity,
  Calendar,
  AlertCircle,
  Download,
} from "lucide-react";
```

**Lines 22–26**:
```tsx
// BEFORE
export default function WorkerDashboard() {
  const queryClient = useQueryClient();
  const [selectedRange, setSelectedRange] = useState<"7d" | "30d" | "all">("7d");
```
```tsx
// AFTER
export default function WorkerDashboard() {
  const queryClient = useQueryClient();
```

---

## 5. Verification Plan

Once the above changes are applied by the worker:
1. `npx tsc --noEmit` $\rightarrow$ Exit code 0 (0 errors)
2. `npx eslint src/` $\rightarrow$ Exit code 0 (0 errors)
3. `npm run build` $\rightarrow$ Exit code 0 (Successful static page build of `/`, `/login`, `/manager`, `/worker`, `/control-room`, `/readme`)
4. `npm test` $\rightarrow$ Exit code 0 (104 tests passing across 8 suites)
