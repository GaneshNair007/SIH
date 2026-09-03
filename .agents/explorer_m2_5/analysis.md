# Deep Forensic Investigation & Pipeline Analysis: Milestone M2 Remediation

**Explorer**: Explorer 2 (`explorer_m2_5`)  
**Target Milestone**: M2 Remediation (Iteration 2)  
**Investigation Scope**: TypeScript contracts, Next.js 14 App Router production build, ESLint rule enforcement, route handlers, hooks, and mock store integration.

---

## 1. Executive Summary

Empirical testing of the build pipeline reveals:
1. **Unit & Adversarial Tests (`npm test`)**: **100% PASS** (8 test suites, 104 passed tests).
2. **TypeScript Compilation (`npx tsc --noEmit`)**: **FAIL (8 Errors across 2 files)**.
   - `src/app/api/scans/route.ts` (7 errors: mismatch between `deltaEToExposure`/`evaluateConfidence` return types and route response schema).
   - `src/app/control-room/page.tsx` (1 error: `Date` constructor called with nullable `alert.created_at: string | null`).
3. **Next.js Production Build (`npm run build`) & Linter (`npm run lint`)**: **FAIL (16 ESLint errors across 5 files)**.
   - Next.js 14 App Router executes `next lint` during production build. Strict `@typescript-eslint/no-unused-vars` flags unused imports and variables in `control-room/page.tsx`, `login/page.tsx`, `page.tsx`, `readme/page.tsx`, and `worker/page.tsx`.
4. **Prior Audit Findings Status**:
   - `src/app/login/page.tsx` (missing `UserRole` import): **RESOLVED** (`import type { UserRole } from "@/types/domain"` is present).
   - `src/types/domain.ts` (missing `Json` export): **RESOLVED** (`Json` is imported and re-exported).
   - `src/hooks/useAlerts.ts` (`useMutation` 4th generic parameter): **RESOLVED** (`useMutation<Alert, Error, ..., { previousAlerts?: Alert[] }>` is correctly specified).
   - `src/lib/supabase/mockData.ts` (`_companyId` unused param): **RESOLVED** (`companyId` is now consumed in `getMockManagerStats`).

---

## 2. Comprehensive Forensic Diagnosis

### 2.1. TypeScript Compiler Errors (`npx tsc --noEmit`)

#### A. `src/app/api/scans/route.ts`
- **Location**: Lines 47, 53, 54, 55, 57, 58, 59
- **Error Logs**:
  ```
  src/app/api/scans/route.ts(47,43): error TS2345: Argument of type 'LabColor' is not assignable to parameter of type 'number'.
  src/app/api/scans/route.ts(53,30): error TS2339: Property 'low_ppm_h' does not exist on type '{ minPpmH: number; maxPpmH: number; confidence: ConfidenceLevel; }'.
  src/app/api/scans/route.ts(54,31): error TS2339: Property 'high_ppm_h' does not exist on type '{ minPpmH: number; maxPpmH: number; confidence: ConfidenceLevel; }'.
  src/app/api/scans/route.ts(55,34): error TS2339: Property 'nominal_ppm_h' does not exist on type '{ minPpmH: number; maxPpmH: number; confidence: ConfidenceLevel; }'.
  src/app/api/scans/route.ts(57,35): error TS2339: Property 'is_saturated' does not exist on type '{ minPpmH: number; maxPpmH: number; confidence: ConfidenceLevel; }'.
  src/app/api/scans/route.ts(58,20): error TS2339: Property 'zone' does not exist on type '{ minPpmH: number; maxPpmH: number; confidence: ConfidenceLevel; }'.
  src/app/api/scans/route.ts(59,23): error TS2339: Property 'is_saturated' does not exist on type '{ minPpmH: number; maxPpmH: number; confidence: ConfidenceLevel; }'.
  ```
- **Root Cause**:
  1. `src/lib/colorimetry.ts` defines:
     - `deltaEToExposure(deltaE: number)` returning `{ minPpmH: number; maxPpmH: number; confidence: ConfidenceLevel }`.
     - `evaluateConfidence(deltaE: number, patchCStatus?: string, saturationDetected?: boolean)` returning `ConfidenceLevel`.
     - `getExposureZone(ppmHours: number)` returning `ExposureZone`.
  2. `src/app/api/scans/route.ts` called `evaluateConfidence(labA, labC)` (passing `LabColor` instead of `number`), and accessed properties (`low_ppm_h`, `high_ppm_h`, `nominal_ppm_h`, `is_saturated`, `zone`) directly on the object returned by `deltaEToExposure`, which actually returns `{ minPpmH, maxPpmH, confidence }`.

#### B. `src/app/control-room/page.tsx`
- **Location**: Line 298
- **Error Log**:
  ```
  src/app/control-room/page.tsx(298,35): error TS2769: No overload matches this call.
    Overload 1 of 4, '(value: string | number | Date): Date', gave the following error.
      Argument of type 'string | null' is not assignable to parameter of type 'string | number | Date'.
        Type 'null' is not assignable to type 'string | number | Date'.
  ```
- **Root Cause**:
  `alert.created_at` in the Supabase schema interface (`src/types/database.ts`) is typed as `string | null`. The call `new Date(alert.created_at)` fails strict null checks because `new Date(null)` is not permitted under TypeScript strict mode.

---

### 2.2. ESLint Violations (`npm run lint` & `npm run build`)

During `npm run build`, Next.js invokes `next lint`. The build immediately terminates due to the following 16 `@typescript-eslint/no-unused-vars` errors:

| File | Line:Col | Identifier | Cause |
|---|---|---|---|
| `src/app/control-room/page.tsx` | 6:3 | `ShieldCheck` | Unused icon import |
| `src/app/control-room/page.tsx` | 14:3 | `Flame` | Unused icon import |
| `src/app/control-room/page.tsx` | 15:3 | `ArrowUpRight` | Unused icon import |
| `src/app/control-room/page.tsx` | 49:10 | `selectedZone` | State declared and set, but never evaluated |
| `src/app/login/page.tsx` | 6:10 | `ShieldCheck` | Unused icon import |
| `src/app/page.tsx` | 8:3 | `Activity` | Unused icon import |
| `src/app/page.tsx` | 11:3 | `CheckCircle2` | Unused icon import |
| `src/app/page.tsx` | 19:3 | `Search` | Unused icon import |
| `src/app/page.tsx` | 26:25 | `setCursorHovered` | Unused state setter |
| `src/app/page.tsx` | 47:13 | `scene01` | DOM element retrieved but unused in scrollspy conditions |
| `src/app/page.tsx` | 500:25 | `Icon` | Variable assigned from `item.icon` inside `.map` but not rendered |
| `src/app/readme/page.tsx` | 2:21 | `CheckCircle2` | Unused icon import |
| `src/app/readme/page.tsx` | 2:35 | `XCircle` | Unused icon import |
| `src/app/readme/page.tsx` | 2:44 | `ShieldCheck` | Unused icon import |
| `src/app/readme/page.tsx` | 2:57 | `FileText` | Unused icon import |
| `src/app/worker/page.tsx` | 7:3 | `User` | Unused icon import |
| `src/app/worker/page.tsx` | 8:3 | `ShieldAlert` | Unused icon import |
| `src/app/worker/page.tsx` | 14:3 | `Flame` | Unused icon import |
| `src/app/worker/page.tsx` | 24:10 | `selectedRange` | State variable unused |
| `src/app/worker/page.tsx` | 24:25 | `setSelectedRange` | State setter unused |

---

## 3. Concrete Remediation Proposals

### 3.1. Proposed Patch for `src/app/api/scans/route.ts`

```typescript
// Target: src/app/api/scans/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  rgbToLab,
  calculateDeltaE,
  deltaEToExposure,
  evaluateConfidence,
  getExposureZone,
} from '@/lib/colorimetry';

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

    // Evaluate confidence based on patch C (chemical expiry reference) and saturation threshold (38.0)
    const deltaEC = calculateDeltaE(labA, labC);
    const isPatchCExpired = deltaEC > 10.0;
    const isSaturated = deltaE >= 38.0;
    const confidence = evaluateConfidence(deltaE, isPatchCExpired ? 'EXPIRED' : 'ACTIVE', isSaturated);

    const zone = getExposureZone(dose.maxPpmH);
    const doseNominal = Number(((dose.minPpmH + dose.maxPpmH) / 2).toFixed(2));

    return NextResponse.json(
      {
        success: true,
        delta_e: parseFloat(deltaE.toFixed(2)),
        dose_low_ppm_h: dose.minPpmH,
        dose_high_ppm_h: dose.maxPpmH,
        dose_nominal_ppm_h: doseNominal,
        confidence: confidence || dose.confidence,
        saturation_detected: isSaturated,
        zone,
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

### 3.2. Proposed Fix for `src/app/control-room/page.tsx`

1. **Remove unused imports**:
   ```typescript
   // BEFORE:
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

   // AFTER:
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

2. **Fix timestamp null safety (Line 298)**:
   ```typescript
   // BEFORE:
   <span className="text-[10px] font-mono text-slate-500">
     {new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
   </span>

   // AFTER:
   <span className="text-[10px] font-mono text-slate-500">
     {alert.created_at ? new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : 'N/A'}
   </span>
   ```

3. **Utilize `selectedZone` in row highlight**:
   ```typescript
   <tr
     key={zone.zone}
     onClick={() => setSelectedZone(selectedZone === zone.zone ? null : zone.zone)}
     className={`hover:bg-[#1E2536]/60 transition cursor-pointer ${
       selectedZone === zone.zone ? "bg-[#1E2536] ring-1 ring-[#E3262E]/50" : ""
     }`}
   >
   ```

---

### 3.3. Proposed Fix for `src/app/login/page.tsx`

Remove `ShieldCheck` from `lucide-react` import on line 6:
```typescript
// BEFORE:
import { ShieldCheck, ArrowRight, User, Briefcase, Loader2, KeyRound, Activity } from "lucide-react";

// AFTER:
import { ArrowRight, User, Briefcase, Loader2, KeyRound, Activity } from "lucide-react";
```

---

### 3.4. Proposed Fix for `src/app/page.tsx`

1. **Remove unused imports**:
   ```typescript
   // BEFORE:
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

   // AFTER:
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

2. **Clean up unused state and variables**:
   - Remove `const [cursorHovered, setCursorHovered] = useState(false);` (or simplify custom cursor).
   - In scrollspy: remove `const scene01 = document.getElementById("scene-01");`.
   - In `analysisItems.map`: render `<Icon size={16} className="text-[#E3262E] flex-shrink-0" />` or remove `const Icon = item.icon;`.

---

### 3.5. Proposed Fix for `src/app/readme/page.tsx`

Clean up `lucide-react` import on line 2:
```typescript
// BEFORE:
import { ArrowLeft, CheckCircle2, XCircle, ShieldCheck, FileText, ArrowRight } from "lucide-react";

// AFTER:
import { ArrowLeft, ArrowRight } from "lucide-react";
```

---

### 3.6. Proposed Fix for `src/app/worker/page.tsx`

1. **Clean up unused imports**:
   ```typescript
   // BEFORE:
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

   // AFTER:
   import {
     LogOut,
     CheckCircle2,
     Activity,
     Calendar,
     AlertCircle,
     Download,
   } from "lucide-react";
   ```

2. **Remove unused state**:
   - Remove `const [selectedRange, setSelectedRange] = useState<"7d" | "30d" | "all">("7d");`.

---

## 4. Verification Check Matrix

| Verification Target | Command | Pre-Remediation Status | Expected Post-Remediation Status |
|---|---|---|---|
| TypeScript Typecheck | `npx tsc --noEmit` | **FAIL (8 TS errors)** | **PASS (0 errors, exit 0)** |
| ESLint Check | `npm run lint` | **FAIL (16 errors)** | **PASS (0 errors, exit 0)** |
| Production Build | `npm run build` | **FAIL (Build crashed)** | **PASS (All static/dynamic routes compiled)** |
| Unit & Integration Tests | `npm test` | **PASS (104/104 passed)** | **PASS (104/104 passed)** |

