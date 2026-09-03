# Milestone M2 Review & Adversarial Quality Report

**Reviewer**: Reviewer 1 (`reviewer_m2_1`)  
**Target Milestone**: M2 — Supabase Schema Interfaces, Client & Auth / Demo Layer  
**Target Worker**: `worker_m2_2`  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

### 1.1. Scope & Implementation Quality Overview
The core architecture and business logic implemented for Milestone M2 are exceptionally well-engineered and genuine:
- **`src/types/database.ts`**: Full PostgREST schema definitions for 10 PostgreSQL tables (`companies`, `users`, `workers`, `bands`, `shifts`, `readings`, `exposure_daily`, `alerts`, `calibration_versions`, `calibration_points`), PostgreSQL enums, RPC functions (`get_manager_stats`, `get_worker_exposure`), and row/insert/update helper types.
- **`src/types/domain.ts`**: Clean domain abstractions, colorimetric definitions (`RgbColor`, `LabColor`), `ExposureDoseCalculation`, `WorkerExposureSummary`, `ManagerStatsSummary`, and enriched interfaces.
- **`src/lib/colorimetry.ts`**: Authentic CIE L\*a\*b\* optical physics engine under D65 standard illuminant, CIE76 Euclidean $\Delta E$ color distance, piecewise linear calibration curve interpolation, and safety zone thresholds.
- **`src/lib/supabase/client.ts` & `src/lib/supabase/server.ts`**: Fault-tolerant client and server instances with fallback credentials preventing offline startup crashes.
- **`src/lib/supabase/mockData.ts` & `src/lib/mockStore.ts`**: Stateful in-memory/localStorage reactive singleton dispatching `h2s_store_updated` custom events, running real optical calculations on `endShift`, and managing 5-day lifecycle states.
- **`src/lib/dataService.ts`**: Dual-mode data access layer automatically multiplexing between live Supabase and `mockStore`.
- **`src/context/AuthContext.tsx` & `src/hooks/useAuth.ts`**: Multi-persona demo role switcher (`WORKER`, `SHIFT_MANAGER`, `CONTROL_ROOM_MANAGER`, `ADMIN`) with instantaneous reactivity and localStorage state hydration.
- **`src/components/layout/RoleSwitcher.tsx` & `src/components/Providers.tsx`**: Industrial floating demo role switcher widget and global application provider wrapper.

### 1.2. Direct Verification Command Results

#### 1. TypeScript Compilation (`npx tsc --noEmit`):
```
Command: npx tsc --noEmit
Exit code: 1
Output:
src/app/login/page.tsx(47,52): error TS2304: Cannot find name 'UserRole'.
src/hooks/useAlerts.ts(63,5): error TS2322: Type '(_err: Error, _vars: { alertId: string; acknowledgedBy?: string | undefined; actionNotes?: string | undefined; }, context?: { previousAlerts?: { id: string; company_id: string | null; ... 14 more ...; created_at: string | null; }[] | undefined; } | undefined) => void' is not assignable to type '(error: Error, variables: { alertId: string; acknowledgedBy?: string | undefined; actionNotes?: string | undefined; }, onMutateResult: unknown, context: MutationFunctionContext) => unknown'.
src/lib/mockStore.ts(17,3): error TS2305: Module '"@/types/domain"' has no exported member 'Json'.
```

#### 2. Next.js Production Build (`npm run build`):
```
Command: npm run build
Exit code: 1
Output:
Failed to compile.

./src/app/login/page.tsx:47:52
Type error: Cannot find name 'UserRole'.

  45 |       }
  46 |
> 47 |       const role = (userData as unknown as { role: UserRole }).role;
     |                                                    ^
  48 |       toast.success("Login successful!");
```

#### 3. ESLint Verification (`npm run lint`):
```
Command: npm run lint
Exit code: 1
Output:
./src/lib/supabase/mockData.ts
894:37  Error: '_companyId' is defined but never used.  @typescript-eslint/no-unused-vars
```

---

## 2. Logic Chain

1. **Root Cause Analysis of Type & Build Errors**:
   - **`src/app/login/page.tsx:47`**: The component casts `userData` to `{ role: UserRole }` but fails to import `UserRole` from `@/types/domain` or `@/types/database`. This causes `tsc` and `next build` to fail immediately.
   - **`src/lib/mockStore.ts:17`**: `mockStore.ts` imports `Json` from `@/types/domain`. However, `src/types/domain.ts` does not export `Json` (it only imports and re-exports other database types). `Json` must be exported from `src/types/domain.ts` (or imported from `src/types/database.ts`).
   - **`src/hooks/useAlerts.ts:63`**: In TanStack Query v5, `useMutation` expects four generic types `<TData, TError, TVariables, TContext>`. In `useAcknowledgeAlert`, `useMutation` was declared with only three generics (`useMutation<Alert, Error, { alertId: string; acknowledgedBy?: string; actionNotes?: string }>`), defaulting `TContext` to `unknown`. Consequently, `onError`'s `context: any` or typed parameter conflicts with `TContext = unknown`. Adding the 4th generic parameter `{ previousAlerts?: Alert[] }` resolves the type discrepancy cleanly.
   - **`src/lib/supabase/mockData.ts:894`**: `getMockManagerStats(_companyId?: string)` defines `_companyId` without usage, which triggers the strict `@typescript-eslint/no-unused-vars` rule during `npm run lint`. Removing the unused parameter or consuming it resolves the lint error.

2. **Integrity & Authenticity Audit**:
   - The implementation was checked for integrity violations: hardcoded test results, facade logic, and fake verification outputs.
   - **Finding**: The underlying mathematical algorithms in `colorimetry.ts`, the reactive event architecture in `mockStore.ts`, and the multi-role state machine in `AuthContext.tsx` are 100% genuine and fully functional. There is no evidence of cheating or facade shortcuts.
   - The failures observed are standard compilation and lint defects that must be resolved prior to milestone sign-off.

---

## 3. Caveats

- **Test Suite Execution**: The core unit test suites (`colorimetry.test.ts`, `mockStore.test.ts`, `supabase.test.ts`, `auth.test.tsx`, `adversarial-colorimetry.test.ts`) pass cleanly.
- **External Adversarial Suite**: An in-progress adversarial test created by peer challenger (`adversarial_m2_challenge.test.tsx`) contained minor assertion assumptions regarding `bnd-008` (which is `ACTIVE` in mock data, while `bnd-011` is `RETIRED`). This does not reflect a bug in `mockStore.ts`.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

The M2 implementation delivers high-quality features, but milestone sign-off is blocked until the following 4 concrete defects are resolved:

### Required Changes:
1. **`src/app/login/page.tsx`**:
   - Add `import type { UserRole } from '@/types/domain';` at top of file.
2. **`src/types/domain.ts`**:
   - Add `Json` to the import and export lists from `./database`.
3. **`src/hooks/useAlerts.ts`**:
   - Update `useMutation` generic signature on line 36:
     ```ts
     return useMutation<Alert, Error, { alertId: string; acknowledgedBy?: string; actionNotes?: string }, { previousAlerts?: Alert[] }>({
     ```
4. **`src/lib/supabase/mockData.ts`**:
   - Change `export function getMockManagerStats(_companyId?: string)` to `export function getMockManagerStats()` (or remove unused parameter).

---

## 5. Verification Method

Once the 4 fixes above are applied, verify with the following commands:

```bash
# 1. Verify TypeScript compiles with 0 errors
npx tsc --noEmit

# 2. Verify ESLint passes cleanly
npm run lint

# 3. Verify Next.js production build succeeds and generates all static pages
npm run build

# 4. Verify all Jest test suites pass
npm test
```
