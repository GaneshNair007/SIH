# Handoff Report: App Router 404 Page (`src/app/not-found.tsx`) Investigation & Design Specification

**Agent**: Explorer M1-Iter2-1  
**Working Directory**: `c:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\explorer_m1_iter2_1`  
**Milestone**: M1-Iter2-1  
**Objective**: Investigate missing App Router 404 page (`src/app/not-found.tsx`) and design a complete, clean, Material Design 3 compliant Not Found page with Google-style styling (`#1a73e8` primary blue, clean typography, return to Home / Dashboard links, friendly industrial safety 404 message) to resolve Next.js prerendering failure on `/404`.  

---

## 1. Observation

1. **Failure Report from Challenger M1-2 (`.agents/challenger_m1_2/handoff.md:77-90`)**:
   During `npm run build`, static optimization crashed with:
   ```
   Error occurred prerendering page "/404". Read more: https://nextjs.org/docs/messages/prerender-error

   Error: Cannot find module 'C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.next\server\pages\_app.js'
   Require stack:
   - C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\node_modules\next\dist\server\require.js
   - C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\node_modules\next\dist\server\load-components.js
   - C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\node_modules\next\dist\build\utils.js

   > Export encountered errors on following paths:
   	/_error: /404
   Exit code: 1
   ```

2. **Absence of App Router 404 Component (`src/app/not-found.tsx`)**:
   - Examination of `src/app/` revealed the directory contains `layout.tsx`, `page.tsx`, `dashboard/`, `employees/`, `history/`, `incidents/`, `login/`, `pipeline/`, `scan/`, and `working/`, but **no `not-found.tsx`**.
   - Because no custom `not-found.tsx` exists in App Router, Next.js 14 defaults to synthesizing a fallback 404 route via Pages Router architecture, which attempts to load non-existent Pages Router bundle `pages/_app.js`.

3. **Material Design 3 & Google-Style Design Tokens (`tailwind.config.ts:11-51` & `src/app/globals.css:11-55`)**:
   - **Primary Palette**: `primary` (`#1a73e8` Google Blue), `primary-hover` (`#174ea6`), `primary-light` (`#e8f0fe`).
   - **Surfaces & Backgrounds**: `surface` (`#ffffff`), `surface-background` (`#f8f9fa`), `surface-hover` (`#f1f3f4`).
   - **Typography Tokens**: `text-primary` (`#202124`), `text-secondary` (`#5f6368`), `text-disabled` (`#9aa0a6`).
   - **Borders**: `border` (`#dadce0`), `border-focus` (`#1a73e8`).
   - **Status Badges**: `badge-success` (`bg-status-successBg text-status-success`), `badge-warning` (`bg-status-warningBg text-status-warning`), `badge-error` (`bg-status-errorBg text-status-error`), `badge-neutral` (`bg-surface-hover text-text-secondary`).
   - **Elevation Shadows**: `shadow-elevation-1`, `shadow-elevation-2`, `shadow-elevation-3`.
   - **Button Utility Classes**: `.btn-primary` (Google Blue filled pill with hover lift), `.btn-secondary` (outlined Google Blue button with soft tint hover), `.btn-ghost`.

4. **Safety Domain & Branding Context (`src/lib/content.ts:1-38`)**:
   - Project: `PROJECT.name` = `"Rakshak AI (H₂S Dose Wristband)"`
   - Purpose: Occupational H₂S exposure monitoring compliant with OISD-STD-105 / DGMS safety standards.
   - Core Navigation Hubs: `/` (Home), `/dashboard` (Manager Safety Dashboard), `/working` (Science Pipeline), `/scan` (Optical Dosimeter Check-In), `/login` (Authentication).

---

## 2. Logic Chain

1. Next.js 14 App Router builds all static routes during `next build`.
2. When an explicit `src/app/not-found.tsx` component is provided:
   - Next.js App Router treats `not-found.tsx` as a standard App Router static route segment rendered inside `src/app/layout.tsx`.
   - Prerendering completes natively within the App Router tree without delegating to Pages Router fallback `pages/_app.js`.
3. Designing `src/app/not-found.tsx` with Google MD3 design tokens and an industrial safety motif ensures:
   - Complete visual and structural harmony with the rest of Rakshak AI.
   - Informative guidance for users who land on broken or unmapped industrial sector URLs.
   - Direct 1-click links to the 4 primary platform workspaces (Home, Safety Dashboard, Science Pipeline, Dosimeter Check-In).
4. Pure server/client static compatibility: Using standard Next.js `Link` elements and lightweight inline SVGs avoids runtime hydration errors or external icon library import friction.

---

## 3. Caveats

- **Read-Only Explorer Role**: This report specifies the exact implementation. As Explorer, code files in `src/app/` were not modified directly.
- **Windows / OneDrive Build Tracing**: In addition to `src/app/not-found.tsx`, Windows OneDrive filesystem locking can occasionally cause `ENOENT` on `.next/server/app/_not-found/page.js.nft.json` if output file tracing is enabled. Setting `outputFileTracing: false` in `next.config.mjs` is recommended as an accompanying safeguard.

---

## 4. Conclusion & Component Code Specification

### 4.1 Target File: `src/app/not-found.tsx`

The implementer should write the following complete, clean component to `src/app/not-found.tsx`:

```tsx
import Link from "next/link";
import { PROJECT } from "@/lib/content";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-background text-text-primary">
      {/* Top Header / Brand Bar */}
      <header className="bg-surface border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold text-xs shadow-elevation-1 transition-transform group-hover:scale-105">
                H₂S
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-text-primary text-sm sm:text-base leading-tight">
                  {PROJECT.name}
                </span>
                <span className="text-[10px] text-text-secondary hidden sm:block">
                  Industrial Dosimetry & Workplace Safety
                </span>
              </div>
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link
                href="/"
                className="text-text-secondary hover:text-text-primary transition-colors hidden sm:inline-block"
              >
                Home
              </Link>
              <Link
                href="/working"
                className="text-text-secondary hover:text-text-primary transition-colors hidden sm:inline-block"
              >
                Pipeline
              </Link>
              <Link
                href="/dashboard"
                className="btn-secondary text-xs sm:text-sm py-1.5 px-3"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main 404 Hero & Navigation Hub */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
        <div className="w-full card p-6 sm:p-10 border border-border shadow-elevation-2 bg-surface">
          {/* Header Status & Icon */}
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Status Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="badge-warning">
                <svg
                  className="w-3.5 h-3.5 mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Error 404 • Unmapped Sector
              </span>
              <span className="badge-neutral">
                <svg
                  className="w-3.5 h-3.5 mr-1 text-status-success"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Safety Systems Active
              </span>
            </div>

            {/* Industrial Safety SVG Illustration */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-28 h-28 rounded-2xl bg-primary-light/60 border border-primary/20 flex items-center justify-center shadow-elevation-1">
                <svg
                  className="w-14 h-14 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <circle cx="12" cy="11" r="3" />
                  <line x1="12" y1="5" x2="12" y2="7" />
                  <line x1="12" y1="15" x2="12" y2="17" />
                  <line x1="6" y1="11" x2="8" y2="11" />
                  <line x1="16" y1="11" x2="18" y2="11" />
                </svg>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-status-warningBg border border-status-warning flex items-center justify-center text-status-warning font-mono text-xs font-bold shadow-sm">
                404
              </div>
            </div>

            {/* Typography */}
            <h1 className="text-3xl sm:text-4xl font-medium text-text-primary tracking-tight">
              Monitoring Zone Not Found
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl leading-relaxed">
              The requested safety route, dosimetry ledger, or telemetry parameter does not exist in the plant registry. You may have entered an uncharted sector or followed an expired shift link.
            </p>

            {/* Plant Safety Status Notice */}
            <div className="w-full max-w-2xl bg-surface-background border border-border rounded-lg p-4 text-left flex items-start gap-3 mt-2">
              <div className="w-5 h-5 rounded-full bg-status-successBg text-status-success flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-xs sm:text-sm text-text-secondary">
                <span className="font-medium text-text-primary">Safety Perimeter Maintained: </span>
                Active dosimeter badge synchronization, ΔE optical calibration pipelines, and plant hazard logs remain operational. Select an authorized navigation zone below to resume monitoring.
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/" className="btn-secondary px-5 py-2.5">
                <svg
                  className="w-4 h-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Return to Home
              </Link>
              <Link href="/dashboard" className="btn-primary px-5 py-2.5">
                <svg
                  className="w-4 h-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="7" height="9" x="3" y="3" rx="1" />
                  <rect width="7" height="5" x="14" y="3" rx="1" />
                  <rect width="7" height="9" x="14" y="12" rx="1" />
                  <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
                Open Safety Dashboard
              </Link>
            </div>
          </div>

          {/* Quick Route Directory Hub */}
          <div className="mt-10 pt-8 border-t border-border">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4 text-center sm:text-left">
              Verified Navigation Hubs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/"
                className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover hover:border-primary/40 transition-all group shadow-sm flex flex-col"
              >
                <div className="w-8 h-8 rounded bg-primary-light text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                </div>
                <div className="font-medium text-sm text-text-primary group-hover:text-primary transition-colors">
                  Public Home
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  System architecture, 4-pillar overview & team credentials.
                </div>
              </Link>

              <Link
                href="/dashboard"
                className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover hover:border-primary/40 transition-all group shadow-sm flex flex-col"
              >
                <div className="w-8 h-8 rounded bg-primary-light text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                  </svg>
                </div>
                <div className="font-medium text-sm text-text-primary group-hover:text-primary transition-colors">
                  Shift Dashboard
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  Plant unit breakdown, live KPIs & worker exposure summaries.
                </div>
              </Link>

              <Link
                href="/working"
                className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover hover:border-primary/40 transition-all group shadow-sm flex flex-col"
              >
                <div className="w-8 h-8 rounded bg-primary-light text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 2v7.31M14 9.3V1.99M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
                  </svg>
                </div>
                <div className="font-medium text-sm text-text-primary group-hover:text-primary transition-colors">
                  Science Pipeline
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  Interactive chemical reaction matrix, ΔE flow & calibration.
                </div>
              </Link>

              <Link
                href="/scan"
                className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover hover:border-primary/40 transition-all group shadow-sm flex flex-col"
              >
                <div className="w-8 h-8 rounded bg-primary-light text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <rect x="7" y="7" width="10" height="10" rx="1" />
                  </svg>
                </div>
                <div className="font-medium text-sm text-text-primary group-hover:text-primary transition-colors">
                  Dosimeter Check-In
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  Optical patch image analysis & QR identity verification.
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-success inline-block"></span>
            <span>OISD-STD-105 & DGMS Industrial Workplace Safety Protocol</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-text-primary transition-colors">
              Home
            </Link>
            <Link href="/working" className="hover:text-text-primary transition-colors">
              Pipeline
            </Link>
            <Link href="/login" className="hover:text-text-primary transition-colors">
              Authentication
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

### 4.2 Recommended Build Hardening: `next.config.mjs`

To completely eliminate Windows OneDrive trace contention (`.nft.json` file locking), configure `outputFileTracing: false`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracing: false,
};

export default nextConfig;
```

---

## 5. Verification Method

Once implemented:

1. **Type & Lint Verification**:
   ```powershell
   npx tsc --noEmit
   npm run lint
   ```
   *Expected*: Zero errors.

2. **Clean Production Build Verification**:
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   npm run build
   ```
   *Expected*: Next.js build finishes with exit code `0`, generating all static routes including `/_not-found` without Pages Router errors.

3. **Production Server Startup**:
   ```powershell
   npx next start -p 3891
   ```
   *Expected*: Server boots immediately and serves `http://localhost:3891/non-existent-page` with the custom Material Design 3 404 page.
