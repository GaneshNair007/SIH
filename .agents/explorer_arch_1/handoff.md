# Handoff Report: Frontend Architecture Specification

## 1. Observation
- **Git State & Repository Layout:**
  - `git branch -a` shows only `* main` and `remotes/origin/main`. Working directory is clean with untracked `.agents/` directory.
  - Branch `frontend` needs to be created cleanly using `git checkout -b frontend`.
- **Domain & Scientific Specifications:**
  - `docs/H2S_Wristband_SbCl3_Anthocyanin_Complete.md`: Documents SbCl3 + purple cabbage anthocyanin benchmark chemistry, CIE Lab $\Delta E$ formula ($\Delta E = \sqrt{(L^* - L_0^*)^2 + (a^* - a_0^*)^2 + (b^* - b_0^*)^2}$), 5-working-day reactive strip lifecycle constraint, and Exposure Index scale (`0 | 10 | 30 | 60 | 120`).
- **Database Schema & RPC Functions:**
  - `supabase/migrations/20260901000000_initial_schema.sql` lines 4–204: 10 tables defined (`companies`, `users`, `workers`, `bands`, `shifts`, `readings`, `exposure_daily`, `alerts`, `calibration_versions`, `calibration_points`).
  - Lines 208–250: RPC functions `get_manager_stats(company_id UUID)` and `get_worker_exposure(target_worker_id UUID)`.
  - Lines 253–312: RLS company-isolation policies on all public tables.
- **Frontend Dependencies (`package.json`):**
  - Current root `package.json` contains Next.js `14.2.35`, React `18`, `@tanstack/react-query` `^5.102.8`, `framer-motion` `^13.1.1`, `@supabase/supabase-js` `^2.112.4`, `lucide-react` `^1.38.0`, `recharts` `^3.10.1`, `sonner` `^2.0.8`, `zod` `^4.5.4`.
  - Need addition of `@supabase/ssr`, `@testing-library/react`, `@testing-library/jest-dom`, and Jest configuration for unit testing.

---

## 2. Logic Chain
1. **Observation Reference:** The system requires real-time safety monitoring, role segregation (Shift Manager, Worker, Control Room), and scientific range reporting (`4.8–6.2 ppm•h`) with confidence indicators.
2. **Architecture Decision (Next.js 14 App Router):**
   - Use React Server Components for root layout, static documentation (`/readme`), and initial page shells.
   - Use Client Components (`"use client"`) for interactive data tables (`WorkerTable`), modals (`ShiftScanModal`, `AddWorkerModal`), animated KPI badges (`ExposureRangeBadge`), charts (`ExposureTrendChart`), and realtime subscriptions (`useAlerts`).
3. **Data Fetching & State Layer:**
   - TanStack Query provides client-side caching, loading states, and deduplication.
   - Supabase Realtime listens to `postgres_changes` on `alerts` and `exposure_daily`, triggering `queryClient.invalidateQueries(...)` to push live updates to the UI without aggressive polling.
   - `@supabase/ssr` handles cookie-based authentication sessions across Server and Client components.
4. **Industrial Safety Design System:**
   - Dark canvas (`#090d16` / `slate-950`), high-contrast text (`slate-50`), and hazard-specific color tokens (Emerald for safe $<10\text{ ppm}\cdot\text{h}$, Amber for elevated $10–20\text{ ppm}\cdot\text{h}$ and Day 4-5 lifecycle, Crimson for critical $>20\text{ ppm}\cdot\text{h}$ and expired bands).
5. **Testing Strategy:**
   - Unit tests focusing on pure rendering and domain math (Exposure range formatting, confidence score badges, 5-day lifecycle progress, and worker table filtering).

---

## 3. Caveats
- **Supabase Credentials:** A live Supabase instance requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. For evaluation environments without active keys, the architecture includes a Demo Mode bypass on `/login` and mock fallback data in query hooks.
- **Camera Scanning in Browser:** Physical camera optical scanning requires device camera permissions or simulated scan inputs. The architecture includes a dedicated `ShiftScanModal` supporting both file upload and simulated $\Delta E$ inputs.

---

## 4. Conclusion
The frontend architecture specification in `architecture_report.md` provides an exhaustive, production-grade roadmap to construct the H₂S Monitor Platform on the `frontend` branch from scratch. It directly addresses all 4 key requirements in `ORIGINAL_REQUEST.md`.

---

## 5. Verification Method
1. **Inspect Architecture Spec:**
   - View `C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\explorer_arch_1\architecture_report.md`
2. **Git Branch Readiness:**
   - Verify branch status: `git status`
   - Command to initialize branch: `git checkout -b frontend`
3. **Implementation Verification Commands (Once Implemented):**
   - Unit tests: `npm test`
   - Production build: `npm run build`
