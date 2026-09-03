## 2026-09-01T10:55:33Z

You are the Worker for Milestone M2 (Supabase Schema Interfaces, Client & Auth / Demo Layer).
Your working directory is: C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\worker_m2_1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: Read the original user request at:
C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\ORIGINAL_REQUEST.md

Also read the Explorer blueprints:
- C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\explorer_m2_1\analysis.md
- C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\explorer_m2_2\analysis.md
- C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\explorer_m2_3\analysis.md
- C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\PROJECT.md

Scope of Files You Own and Must Implement:
1. `src/types/database.ts`: Complete TypeScript Database definition for all 10 PostgreSQL tables (`companies`, `users`, `workers`, `bands`, `shifts`, `readings`, `exposure_daily`, `alerts`, `calibration_versions`, `calibration_points`), 2 RPC functions (`get_manager_stats`, `get_worker_exposure`), and check-constrained enums.
2. `src/types/domain.ts`: Complete domain models (`RgbColor`, `LabColor`, `ConfidenceLevel`, `AlertSeverity`, `ExposureZone`, `EnrichedWorker`, `EnrichedShift`, `EnrichedAlert`, `DemoUser`, `DemoRoleProfile`, `ExposureDoseCalculation`, `ManagerStatsSummary`, `WorkerExposureSummary`).
3. `src/lib/supabase/client.ts` & `src/lib/supabase/server.ts`: Resilient Supabase browser/SSR clients with `isSupabaseConfigured()` and fallback handling.
4. `src/lib/supabase.ts`: Re-export backward compatibility.
5. `src/lib/supabase/mockData.ts`: Realistic 12-worker multi-department dataset, 12 wristbands across 5-day lifecycle, historical/active shifts, optical readings, 30-day exposure records, alerts, calibration lookup points, and mock RPC implementations.
6. `src/lib/mockStore.ts`: In-memory & `localStorage` reactive data store with custom event notification for UI synchronization in demo mode.
7. `src/lib/dataService.ts`: Unified service layer routing queries and mutations between Supabase and `mockStore`.
8. `src/context/AuthContext.tsx` & `src/hooks/useAuth.ts`: Unified Auth context supporting real Supabase auth and instant Demo Role Switching (`WORKER`, `SHIFT_MANAGER`, `CONTROL_ROOM_MANAGER`, `ADMIN`) with `localStorage` persistence.
9. `src/hooks/queryKeys.ts`, `src/hooks/useWorkers.ts`, `src/hooks/useExposures.ts`, `src/hooks/useAlerts.ts`, `src/hooks/useManagerStats.ts`, `src/hooks/useShiftOperations.ts`, `src/hooks/useRealtime.ts`: Typed TanStack Query & Mutation hooks.
10. `src/components/layout/RoleSwitcher.tsx`: Interactive floating demo role switcher widget.
11. `src/components/Providers.tsx`: Updating root providers to wrap `AuthProvider`, `QueryClientProvider`, and `Toaster`.
12. Unit tests: Create `src/__tests__/supabase.test.ts`, `src/__tests__/auth.test.ts`, and `src/__tests__/mockStore.test.ts` to test schema structures, mock RPC calculations, and auth role switching.

## 2026-09-02T01:00:40Z

Identity: You are Worker M2.
Working directory: c:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\worker_m2_1
Original request: c:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\ORIGINAL_REQUEST.md (read this first).
Project spec: c:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\PROJECT.md

Explorer findings to read and execute:
- c:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\spec_miner_m2_2\handoff.md (Complete Science Pipeline 4-Tab Specification & Recommendations)
- c:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\explorer_m2_1\handoff.md
- c:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\explorer_m2_3\handoff.md

Write Ownership (You exclusively own these files):
- src/app/page.tsx
- src/app/working/page.tsx
- src/app/pipeline/page.tsx
- src/lib/content.ts
- src/components/public/ (if creating/updating modular public components)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective:
1. Polish `src/app/page.tsx` (Home page):
   - Verify Hero section, 4-pillar overview (Problem Statement, Hardware Dosimeter, Software Platform, Operational Purpose), Research Prototype limitation banner, Platform Access workspace cards (Shift Manager, Control Room, Field Employee) linking to `/login`, and Team Showcase with authentic member portraits (`ganesh_real.jpg`, `arjit.jpg`, `sumedh.png`), roles, and initial fallbacks.
2. Polish `src/app/working/page.tsx` (Pipeline/Working page) across all 4 interactive tabs per spec_miner_m2_2/handoff.md:
   - Tab 1 (Flowchart): 8 operational stages organized into 4 sequential phases (Shift Check-in, Operational Shift, Post-shift Colorimetry, Ledger Commit) with individual limitation notices and OISD compliance banner.
   - Tab 2 (Images): Rich vector SVG diagrams for Multi-Layer Dosimeter Architecture (PTFE membrane, reagent matrix, TiO2 white ring, QR fiducial, skin-safe carrier) + Optical Substrate Geometry (Patch A, Patch B, Patch C), plus structured technical specifications card.
   - Tab 3 (Chemistry): Chemical reaction equation block (2SbCl3 + 3H2S -> Sb2S3 + 6HCl), CIELAB D65 conversion pipeline, CIE76 Euclidean formula, and full Piecewise Linear Calibration Curve lookup table (ΔE 0 to 38 -> 0 to 35 ppm·h) with saturation clamping.
   - Tab 4 (Comparison): 4-modality benchmark matrix comparing SbCl3–Anthocyanin composite, Lead Acetate paper, WO3 thin films, and Electronic Electrochemical Sensors across Selectivity, Toxicity, Drift, and Cost.
   - URL State & Routing: Sanitize `?tab=` query parameter (fallback to 'flowchart' on invalid values), WAI-ARIA tab semantics, and preserve searchParams during `/pipeline` redirect.
3. Verify Material Design 3 / Google-style styling consistency (Google Blue #1a73e8, elevation shadows, typography, status badges).
4. Run full verification commands:
   - npx tsc --noEmit
   - npm run lint
   - npm test
   - npm run build
   - npm run verify:server
5. Write a comprehensive 5-component handoff report to c:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\worker_m2_1\handoff.md documenting all changes, exact command outputs, and send completion message to parent.
Completion criteria: All 5 verification commands pass cleanly with 100% test success, 0 lint/type errors, and verified live 15-route matrix.
