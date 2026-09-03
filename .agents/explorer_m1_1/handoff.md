# Handoff Report — Explorer M1-1: Frontend ESLint Errors Investigation

## 1. Observation

A full execution of the project linter via `npm run lint` (`next lint`) reported 14 error diagnostics across 8 files (11 error sites):

```
> next lint

./src/app/employees/[id]/page.tsx
112:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/app/history/page.tsx
10:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/app/incidents/page.tsx
8:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/app/login/page.tsx
34:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
54:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/app/scan/page.tsx
15:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
33:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
67:14  Error: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
67:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/app/working/page.tsx
88:102  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities

./src/components/layout/AppShell.tsx
133:33  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
133:47  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities

./src/context/AuthContext.tsx
37:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
50:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
```

---

## 2. Logic Chain

1. **`@typescript-eslint/no-explicit-any` on array maps and state variables**:
   - In `src/app/employees/[id]/page.tsx` line 112 and `src/app/history/page.tsx` line 10, the scan history items rendered in tables use properties `scan_id`, `timestamp`, `shift_status`, `computed_metrics.shift_twa_ppm`, `computed_metrics.compensated_dose_ppm_hr`, and `computed_metrics.statutory_tier`. These exactly match the exported interface `RecentScan` in `src/lib/api/manager.ts`.
   - In `src/app/incidents/page.tsx` line 8, `incidents` is typed as `any[]`. The properties accessed in the table are `incident_id`, `timestamp`, `worker_id`, `plant_unit`, `status`, and `scan_id`. Defining a structured `Incident` interface eliminates `any` while ensuring compile-time safety.
   - In `src/app/scan/page.tsx` line 15, `result` is typed as `any`. The properties accessed are `qr_decoded.badge_barcode`, `qr_decoded.employee_id`, `patch_a_active_delta_e`, `patch_b_drift`, `patch_c_condition`, and `confidence_score`. Defining a `ScanAnalysisResult` interface eliminates `any`.

2. **`@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unused-vars` on catch blocks**:
   - In `src/app/login/page.tsx` (lines 34, 54), `src/app/scan/page.tsx` (line 33), and `src/context/AuthContext.tsx` (lines 37, 50), catch variables are typed as `(err: any)`. In TypeScript, catch variables should be `(err: unknown)` with standard type narrowing (`err instanceof Error ? err.message : ...`) or untyped.
   - In `src/app/scan/page.tsx` line 67, `catch (err: any)` catches an unused `err` variable only to set a generic error message. Using optional catch binding `catch { ... }` resolves both `@typescript-eslint/no-unused-vars` and `@typescript-eslint/no-explicit-any`.

3. **`react/no-unescaped-entities` in JSX text**:
   - In `src/app/working/page.tsx` line 88, `worker's` uses a bare single quote in JSX text. Replacing with `worker&apos;s` satisfies the rule.
   - In `src/components/layout/AppShell.tsx` line 133, `"Scan Check-in"` uses bare double quotes in JSX text. Replacing with `&quot;Scan Check-in&quot;` satisfies the rule.

---

## 3. Caveats

- **Scope Boundary**: This investigation is strictly read-only and does not modify source files directly. Implementation must be carried out by the designated fixer agent.
- **Other TypeScript Diagnostics**: Note that running `npx tsc --noEmit` flags missing test exports in `src/__tests__/auth.test.tsx` and unused `requiredRoles` props in components (`OverviewDashboard.tsx`, etc.), which belong to separate milestone tasks (Feature 2 / Auth test alignment). The changes proposed here specifically resolve 100% of the ESLint issues.

---

## 4. Conclusion

All 14 ESLint error diagnostics across 8 files have been thoroughly investigated, root causes classified, and exact replacement diffs formulated below. Applying these replacements will achieve a clean 0-error pass for `npm run lint`.

### File-by-File Fix Instructions

---

### File 1: `src/app/employees/[id]/page.tsx`
- **Error**: Line 112:43 — `Unexpected any. Specify a different type. (@typescript-eslint/no-explicit-any)`
- **Existing Code (Lines 4-5)**:
```tsx
import { managerApi } from "@/lib/api/manager";
import AppShell from "@/components/layout/AppShell";
```
- **Replacement Code (Lines 4-5)**:
```tsx
import { managerApi, RecentScan } from "@/lib/api/manager";
import AppShell from "@/components/layout/AppShell";
```
- **Existing Code (Line 112)**:
```tsx
                {recent_scans?.map((scan: any) => (
```
- **Replacement Code (Line 112)**:
```tsx
                {recent_scans?.map((scan: RecentScan) => (
```
- **Explanation**: Imports `RecentScan` interface from `@/lib/api/manager` and types the `scan` parameter in `.map()`.

---

### File 2: `src/app/history/page.tsx`
- **Error**: Line 10:38 — `Unexpected any. Specify a different type. (@typescript-eslint/no-explicit-any)`
- **Existing Code (Lines 3-6)**:
```tsx
import AppShell from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
```
- **Replacement Code (Lines 3-7)**:
```tsx
import AppShell from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { RecentScan } from "@/lib/api/manager";
```
- **Existing Code (Line 10)**:
```tsx
  const [scans, setScans] = useState<any[]>([]);
```
- **Replacement Code (Line 10)**:
```tsx
  const [scans, setScans] = useState<RecentScan[]>([]);
```
- **Explanation**: Types `scans` state with `RecentScan[]` imported from `@/lib/api/manager`.

---

### File 3: `src/app/incidents/page.tsx`
- **Error**: Line 8:46 — `Unexpected any. Specify a different type. (@typescript-eslint/no-explicit-any)`
- **Existing Code (Lines 7-9)**:
```tsx
export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
```
- **Replacement Code (Lines 7-17)**:
```tsx
interface Incident {
  incident_id: string;
  timestamp: string;
  worker_id: string;
  plant_unit: string;
  status: string;
  scan_id: string;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
```
- **Explanation**: Defines the `Incident` interface matching the incident schema and replaces `useState<any[]>` with `useState<Incident[]>`.

---

### File 4: `src/app/login/page.tsx`
- **Errors**:
  - Line 34:19 — `Unexpected any. Specify a different type. (@typescript-eslint/no-explicit-any)`
  - Line 54:19 — `Unexpected any. Specify a different type. (@typescript-eslint/no-explicit-any)`
- **Existing Code (Lines 34-37)**:
```tsx
    } catch (err: any) {
      setError(err.message || "Login failed");
      setIsSubmitting(false);
    }
```
- **Replacement Code (Lines 34-37)**:
```tsx
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
      setIsSubmitting(false);
    }
```
- **Existing Code (Lines 54-57)**:
```tsx
    } catch (err: any) {
      setError(err.message || "Login failed");
      setIsSubmitting(false);
    }
```
- **Replacement Code (Lines 54-57)**:
```tsx
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
      setIsSubmitting(false);
    }
```
- **Explanation**: Changes catch parameter type to `unknown` and narrows using `err instanceof Error ? err.message : "Login failed"`.

---

### File 5: `src/app/scan/page.tsx`
- **Errors**:
  - Line 15:40 — `Unexpected any. Specify a different type. (@typescript-eslint/no-explicit-any)`
  - Line 33:19 — `Unexpected any. Specify a different type. (@typescript-eslint/no-explicit-any)`
  - Line 67:14 — `'err' is defined but never used. (@typescript-eslint/no-unused-vars)`
  - Line 67:19 — `Unexpected any. Specify a different type. (@typescript-eslint/no-explicit-any)`
- **Existing Code (Lines 8-17)**:
```tsx
export default function ScanPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
```
- **Replacement Code (Lines 8-27)**:
```tsx
interface ScanAnalysisResult {
  qr_decoded?: {
    badge_barcode?: string;
    employee_id?: string;
  };
  patch_a_active_delta_e?: number;
  patch_b_drift?: number;
  patch_c_condition?: string;
  confidence_score?: number;
}

export default function ScanPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
```
- **Existing Code (Lines 33-36)**:
```tsx
    } catch (err: any) {
      console.error(err);
      setError("Failed to analyze image. Ensure it is a valid photo of the wristband.");
    }
```
- **Replacement Code (Lines 33-36)**:
```tsx
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to analyze image. Ensure it is a valid photo of the wristband.");
    }
```
- **Existing Code (Lines 67-69)**:
```tsx
    } catch (err: any) {
      setError("Failed to submit scan to the ledger.");
    }
```
- **Replacement Code (Lines 67-69)**:
```tsx
    } catch {
      setError("Failed to submit scan to the ledger.");
    }
```
- **Explanation**: Defines `ScanAnalysisResult` interface, replaces `useState<any>` with `useState<ScanAnalysisResult | null>`, uses `catch (err: unknown)` for the logging catch block, and uses optional catch binding `catch {` for the unused-error catch block.

---

### File 6: `src/app/working/page.tsx`
- **Error**: Line 88:102 — `'\'' can be escaped with &apos;, &lsquo;, &#39;, &rsquo;. (react/no-unescaped-entities)`
- **Existing Code (Lines 87-89)**:
```tsx
      <p className="text-text-secondary max-w-3xl leading-relaxed">
        This flowchart outlines the software and operational journey of a single band during a worker's shift.
      </p>
```
- **Replacement Code (Lines 87-89)**:
```tsx
      <p className="text-text-secondary max-w-3xl leading-relaxed">
        This flowchart outlines the software and operational journey of a single band during a worker&apos;s shift.
      </p>
```
- **Explanation**: Escapes the single quote in `worker's` with `worker&apos;s`.

---

### File 7: `src/components/layout/AppShell.tsx`
- **Errors**:
  - Line 133:33 — `'"' can be escaped with &quot;, &ldquo;, &#34;, &rdquo;. (react/no-unescaped-entities)`
  - Line 133:47 — `'"' can be escaped with &quot;, &ldquo;, &#34;, &rdquo;. (react/no-unescaped-entities)`
- **Existing Code (Lines 132-134)**:
```tsx
                  <div className="p-3 pt-0 text-sm text-text-secondary border-t border-border mt-2 leading-relaxed">
                    Navigate to "Scan Check-in". Tap the capture area to take a photo of the band. Ensure lighting is even and all three patches (A, B, C) are visible. The system will extract the ΔE automatically.
                  </div>
```
- **Replacement Code (Lines 132-134)**:
```tsx
                  <div className="p-3 pt-0 text-sm text-text-secondary border-t border-border mt-2 leading-relaxed">
                    Navigate to &quot;Scan Check-in&quot;. Tap the capture area to take a photo of the band. Ensure lighting is even and all three patches (A, B, C) are visible. The system will extract the ΔE automatically.
                  </div>
```
- **Explanation**: Escapes double quotes around `"Scan Check-in"` with `&quot;Scan Check-in&quot;`.

---

### File 8: `src/context/AuthContext.tsx`
- **Errors**:
  - Line 37:19 — `Unexpected any. Specify a different type. (@typescript-eslint/no-explicit-any)`
  - Line 50:19 — `Unexpected any. Specify a different type. (@typescript-eslint/no-explicit-any)`
- **Existing Code (Lines 37-41)**:
```tsx
    } catch (err: any) {
      console.error("Failed to fetch session:", err);
      setError(err.message || "Session error");
      setUser(null);
    }
```
- **Replacement Code (Lines 37-41)**:
```tsx
    } catch (err: unknown) {
      console.error("Failed to fetch session:", err);
      setError(err instanceof Error ? err.message : "Session error");
      setUser(null);
    }
```
- **Existing Code (Lines 50-52)**:
```tsx
    } catch (err: any) {
      console.error("Logout failed:", err);
    }
```
- **Replacement Code (Lines 50-52)**:
```tsx
    } catch (err: unknown) {
      console.error("Logout failed:", err);
    }
```
- **Explanation**: Replaces `(err: any)` with `(err: unknown)` and applies type narrowing on `err instanceof Error ? err.message : "Session error"`.

---

## 5. Verification Method

To independently verify the fixes:

1. Apply the code modifications above to the 8 files.
2. Run the project lint command:
   ```bash
   npm run lint
   ```
3. Expected result:
   ```
   > sih-1@0.1.0 lint
   > next lint

   ✔ No ESLint warnings or errors
   ```
4. Invalidation conditions: Any reintroduction of bare `any` annotations, unescaped quote characters in JSX, or unused catch variables will fail `next lint`.
