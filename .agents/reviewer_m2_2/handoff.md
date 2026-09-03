# Milestone M2 Review & Adversarial Critic Report (TanStack Query, State Management & SSR)

## Review Summary

**Verdict**: **REQUEST_CHANGES**

**Overall Risk Assessment**: **HIGH** (Broken TypeScript compilation preventing Next.js production build, despite all 104 Jest unit/adversarial tests passing).

---

## 1. Observation

### 1.1. Verification Commands & Independent Execution Outputs

1. **TypeScript Type Safety Check (`npx tsc --noEmit`)**:
   - **Exit code**: `1` (FAILED)
   - **Verbatim compiler errors**:
     ```
     src/app/login/page.tsx(47,52): error TS2304: Cannot find name 'UserRole'.
     src/hooks/useAlerts.ts(63,5): error TS2322: Type '(_err: Error, _vars: { alertId: string; acknowledgedBy?: string | undefined; actionNotes?: string | undefined; }, context?: { previousAlerts?: { id: string; company_id: string | null; ... 14 more ...; created_at: string | null; }[] | undefined; } | undefined) => void' is not assignable to type '(error: Error, variables: { alertId: string; acknowledgedBy?: string | undefined; actionNotes?: string | undefined; }, onMutateResult: unknown, context: MutationFunctionContext) => unknown'.
       Types of parameters 'context' and 'onMutateResult' are incompatible.
         Type 'unknown' is not assignable to type '{ previousAlerts?: { id: string; company_id: string | null; worker_id: string; band_id: string | null; shift_id: string | null; reading_id: string | null; severity: AlertSeverity | null; ... 9 more ...; created_at: string | null; }[] | undefined; } | undefined'.
     src/lib/mockStore.ts(17,3): error TS2305: Module '"@/types/domain"' has no exported member 'Json'.
     ```

2. **Next.js Production Build (`npm run build`)**:
   - **Exit code**: `1` (FAILED)
   - **Failure Point**:
     ```
     Failed to compile.
     ./src/hooks/useAlerts.ts:63:5
     Type error: Type '(_err: Error, _vars: { alertId: string; acknowledgedBy?: string | undefined; actionNotes?: string | undefined; }, context?: { previousAlerts?: Alert[] }) => void' is not assignable to type '(error: Error, variables: { alertId: string; acknowledgedBy?: string | undefined; actionNotes?: string | undefined; }, onMutateResult: unknown, context: MutationFunctionContext) => unknown'.
     ```

3. **Jest Test Suite (`npm test`)**:
   - **Exit code**: `0` (ALL PASS)
   - **Summary**: `8 passed, 8 total` test suites, `104 passed, 104 total` tests in 20.4s.
     - `src/__tests__/colorimetry.test.ts` (19 tests) — PASS
     - `src/__tests__/smoke.test.ts` (2 tests) — PASS
     - `src/__tests__/mockStore.test.ts` (8 tests) — PASS
     - `src/__tests__/supabase.test.ts` (11 tests) — PASS
     - `src/__tests__/components/SmokeComponent.test.tsx` (1 test) — PASS
     - `src/__tests__/auth.test.tsx` (6 tests) — PASS
     - `src/__tests__/adversarial_m2_challenge.test.tsx` (22 tests) — PASS
     - `src/__tests__/adversarial-colorimetry.test.ts` (35 tests) — PASS

4. **ESLint (`npm run lint`)**:
   - **Exit code**: `0` (No ESLint errors, only standard Next.js image warnings).

---

## 2. Findings & Quality Review

### [Critical] Finding 1: TypeScript Strictness Violations Breaking Production Build
- **Where**:
  - `src/hooks/useAlerts.ts`, line 63
  - `src/lib/mockStore.ts`, line 17
  - `src/app/login/page.tsx`, line 47
- **Why**:
  1. In `src/hooks/useAlerts.ts`, `useAcknowledgeAlert` declares `useMutation<Alert, Error, { alertId: string; acknowledgedBy?: string; actionNotes?: string }>` omitting the 4th generic type parameter `TContext`. In TanStack Query v5, `TContext` defaults to `unknown`. Consequently, TypeScript rejects `onError: (_err, _vars, context: { previousAlerts?: Alert[] })` because `unknown` cannot be narrowed without explicit generic definition (`useMutation<Alert, Error, { alertId: string; acknowledgedBy?: string; actionNotes?: string }, { previousAlerts?: Alert[] }>`).
  2. In `src/lib/mockStore.ts:17`, `import type { ..., Json } from '@/types/domain'` attempts to import `Json`, but `src/types/domain.ts` does not export `Json` (it is only exported in `src/types/database.ts`).
  3. In `src/app/login/page.tsx:47`, `as UserRole` is used without importing `UserRole` from `@/types/domain`.
- **Impact**: Upstream worker handoff claimed clean `npx tsc --noEmit` and successful `npm run build`. In reality, both fail compilation.
- **Suggested Fix**:
  1. Add `TContext` generic in `useAlerts.ts`:
     ```ts
     export function useAcknowledgeAlert() {
       const queryClient = useQueryClient();
       return useMutation<
         Alert,
         Error,
         { alertId: string; acknowledgedBy?: string; actionNotes?: string },
         { previousAlerts?: Alert[] }
       >({ ... });
     }
     ```
  2. Export `Json` from `src/types/domain.ts` (`export type { Json, ... } from './database';`).
  3. Import `UserRole` in `src/app/login/page.tsx`.

---

### [Major] Finding 2: Optimistic Mutation Query Key Desynchronization in `useAlerts.ts`
- **Where**: `src/hooks/useAlerts.ts`, lines 42-66
- **Why**:
  In `useAcknowledgeAlert.onMutate`, the hook queries:
  ```ts
  const previousAlerts = queryClient.getQueryData<Alert[]>(queryKeys.alerts.list());
  ```
  `queryKeys.alerts.list()` evaluates to `['alerts', 'list', { filters: undefined }]`.
  However, in real UI usage, components query alerts with filters, such as `useAlerts({ status: 'OPEN' })`, which generates key `['alerts', 'list', { filters: { status: 'OPEN' } }]`.
  Because the optimistic update only modifies the cache for `{ filters: undefined }`, any component viewing filtered active alerts will NOT reflect the optimistic status transition until `onSettled` invalidates.
- **Suggested Fix**:
  Use `queryClient.setQueriesData({ queryKey: queryKeys.alerts.all }, (old: Alert[] | undefined) => ...)` or iterate across matching query cache entries.

---

### [Minor] Finding 3: Orphaned Duplicate Query Provider
- **Where**: `src/components/providers/QueryProvider.tsx` vs `src/components/Providers.tsx`
- **Why**: `src/components/Providers.tsx` is the real active root provider included in `src/app/layout.tsx` (containing `QueryClientProvider`, `AuthProvider`, `RoleSwitcher`, and `Toaster`). `src/components/providers/QueryProvider.tsx` is an orphaned duplicate with differing config (`staleTime: 60s` vs `30s`).
- **Suggested Fix**: Remove the redundant file `src/components/providers/QueryProvider.tsx` or re-export `Providers` from it to avoid confusion.

---

## 3. Adversarial Challenges & Stress-Testing

### Challenge 1: LocalStorage Corrupted Payload & Schema Drift
- **Assumption Challenged**: `mockStore.ts` assumes `localStorage` either holds valid JSON conforming to `MockStoreState` or is empty.
- **Attack Scenario**: If a previous version stored a different schema or corrupted JSON, does the application crash on startup?
- **Result**: **PASS (ROBUST)**. `mockStore.ts` wraps `JSON.parse` in a `try/catch` block and falls back to `getInitialState()`.

### Challenge 2: Concurrent Shift & Optical Calibration Edge Cases
- **Assumption Challenged**: When ending a shift, Delta E calculation with extreme values (e.g. saturation $\Delta E > 38$) or negative inputs must not throw `NaN` or unhandled exceptions.
- **Attack Scenario**: Tested Delta E values from $-10$, $0$, $5.85$, $38.0$, to $100.0$.
- **Result**: **PASS (ROBUST)**. `colorimetry.ts` gracefully extrapolates saturated color shifts with `LOW` confidence and classifies safety zones strictly.

### Challenge 3: SSR Hydration Safety & Role Switching
- **Assumption Challenged**: Browser globals (`window`, `localStorage`) accessed during SSR will crash Next.js Node server execution.
- **Attack Scenario**: Inspected `mockStore.ts`, `dataService.ts`, `AuthContext.tsx`, `client.ts`, `server.ts`.
- **Result**: **PASS**. All browser-only APIs are guarded with `typeof window !== 'undefined'` or executed inside `useEffect`/`useCallback`. `createSupabaseServerClient` uses `@supabase/ssr` with Next.js 14 `cookies()` correctly.

---

## 4. Logic Chain

1. **Observations**:
   - `npx tsc --noEmit` fails with 3 errors in `useAlerts.ts`, `mockStore.ts`, and `login/page.tsx`.
   - `npm run build` fails during type validation at `useAlerts.ts:63`.
   - `npm test` passes all 104 unit & adversarial tests across 8 suites.
2. **Inferences**:
   - The algorithmic implementation of colorimetry, domain models, mockStore business logic, and AuthContext is sound and passes tests.
   - However, the TypeScript compiler checks and Next.js production compilation fail due to missing type imports and omitted mutation context generic parameters.
3. **Assessment**:
   - In accordance with the Reviewer & Critic instructions, a build failure prevents milestone sign-off.
   - Therefore, the required verdict is `REQUEST_CHANGES`.

---

## 5. Caveats

- All unit tests pass cleanly (104/104). The failure is strictly at the TypeScript compilation / Next.js production build boundary.
- Once the three minor TypeScript type annotations and imports are updated, the build should complete cleanly.

---

## 6. Conclusion

Milestone M2 implementation is structurally and logically high quality, with genuine colorimetric physics, robust reactive mock storage, and effective role switching. However, due to the **3 TypeScript compilation errors and production build failure**, the review verdict is **REQUEST_CHANGES**.

---

## 7. Verification Method

To independently verify the fixes:

1. **Verify TypeScript Compilation**:
   ```bash
   npx tsc --noEmit
   ```
   *Target: 0 errors, exit code 0.*

2. **Verify Next.js Production Build**:
   ```bash
   npm run build
   ```
   *Target: Successful build of all static routes.*

3. **Verify Full Jest Test Suite**:
   ```bash
   npm test
   ```
   *Target: 8 test suites passed, 104 tests passed.*
