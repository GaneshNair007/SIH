# Frontend Architecture Specification Report
**Project:** H₂S Monitor Platform  
**Target Branch:** `frontend`  
**Framework:** Next.js 14 App Router (React 18, TypeScript, Tailwind CSS, TanStack Query, Framer Motion, Supabase SSR, Jest)  
**Date:** 2026-09-01  
**Author:** Frontend Architecture Explorer  

---

## 1. Executive Summary

This specification outlines the complete, clean frontend architecture for the **H₂S Monitor Platform** to be built from scratch on the `frontend` branch. 

The application is an industrial safety dashboard designed to track passive cumulative Hydrogen Sulfide ($H_2S$) gas exposure across workforces using colorimetric wristbands (5-day operational lifecycle). It adheres strictly to scientific accuracy principles:
1. **Range-Based Exposure Metrics:** Exposures are presented as ranges (e.g., `4.8–6.2 ppm•h`) rather than misleading single-point numbers.
2. **Measurement Confidence Indices:** Every reading records confidence metrics (`HIGH`, `MEDIUM`, `LOW`, `INVALID`).
3. **Role-Based Workflows:** Distinct, optimized interfaces for Shift Managers, Workers, and Control Room Operators.
4. **Resilient Data Architecture:** Next.js 14 App Router with Server & Client components, TanStack Query for state & cache management, and Supabase Realtime subscriptions for live alerts.

---

## 2. Git Repository & Branching Strategy

### 2.1 Current Repository Status
- Current active branch: `main` (clean working tree, contains initial schema and legacy prototype).
- Untracked artifacts: `.agents/` metadata.

### 2.2 Clean Branch Initialization Procedure
To start fresh on the `frontend` branch without carrying forward technical debt:

```bash
# 1. Ensure working directory is clean
git status

# 2. Create and checkout the frontend branch
git checkout -b frontend

# 3. Structure the clean Next.js 14 App Router repository
# Ensure all files adhere to the /src directory convention
```

---

## 3. Technology Stack & Dependencies

| Layer | Technology | Version / Package | Rationale |
|---|---|---|---|
| **Framework** | Next.js App Router | `14.2.x` | Modern React Server Components (RSC), optimized bundle sizes, route handlers, server actions. |
| **Language** | TypeScript | `5.x` | Strict typing for domain entities, Supabase database types, and component props. |
| **Styling** | Tailwind CSS + PostCSS | `3.4.x` | Utility-first styling with custom industrial color palette and glassmorphic utilities. |
| **Animations** | Framer Motion | `11.x` / `13.x` | Smooth page transitions, live sensor pulse animations, alert tickers, and modal transitions. |
| **Server State & Cache**| TanStack Query (React Query) | `5.x` | Client-side query caching, deduplication, optimistic mutations, and Realtime cache invalidation. |
| **Backend & Auth** | Supabase (@supabase/ssr, @supabase/supabase-js) | `2.x` | Session management, Postgres RLS integration, and Realtime Postgres change subscriptions. |
| **Icons** | Lucide React | `0.4x` / `1.x` | Clean, modern industrial iconography (shields, sensors, alerts, users, telemetry). |
| **Forms & Validation** | React Hook Form + Zod | `7.x` / `3.x` | Form state management with strict schema validation for worker registration and scans. |
| **Data Visualization** | Recharts | `2.x` / `3.x` | High-contrast industrial exposure trend charts and compliance metrics. |
| **Notifications** | Sonner | `1.x` / `2.x` | Dark-themed toast notifications for instant safety alerts. |
| **Unit Testing** | Jest + React Testing Library | `29.x` / `14.x` | Standard unit test suite for core UI components and utility math. |

---

## 4. Directory Structure & File Hierarchy

```
sih-1/
├── .env.example
├── .env.local
├── jest.config.js
├── jest.setup.ts
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── public/
│   ├── favicon.ico
│   └── images/
└── src/
    ├── app/
    │   ├── layout.tsx                     # Root layout (Inter font, Providers, Sonner Toaster)
    │   ├── page.tsx                       # Public Landing Page (Hero, Value Prop, Team, Mission)
    │   ├── globals.css                    # Tailwind CSS base + industrial custom theme classes
    │   ├── login/
    │   │   └── page.tsx                   # Auth Page (Email/Password + Demo Role Bypass Switcher)
    │   ├── readme/
    │   │   └── page.tsx                   # Science explanation, SbCl3 chemistry, "Why We Are Better"
    │   ├── (dashboard)/                   # Protected route group
    │   │   ├── layout.tsx                 # Authenticated shell layout (Navbar, Status Beacon, Alert Banner)
    │   │   ├── manager/
    │   │   │   └── page.tsx               # Shift Manager Dashboard (Workforce, Add Worker, Band Scanner)
    │   │   ├── worker/
    │   │   │   └── page.tsx               # Worker Dashboard (Cumulative Exposure, Band Health, Shift Log)
    │   │   └── control-room/
    │   │       └── page.tsx               # Control Room Console (Plant Metrics, Exposure Charts, Alert Feeds)
    │   └── api/
    │       └── auth/
    │           └── callback/
    │               └── route.ts           # Supabase auth code exchange route handler
    ├── components/
    │   ├── common/                        # Atomic reusable UI components
    │   │   ├── Badge.tsx                  # Status and severity badge
    │   │   ├── Button.tsx                 # Industrial styled button with loading spinner
    │   │   ├── Card.tsx                   # Glassmorphic card container
    │   │   ├── Modal.tsx                  # Framer Motion animated modal dialog
    │   │   ├── MetricCard.tsx             # KPI stat card with sparkline / trend tag
    │   │   ├── ExposureRangeBadge.tsx     # Scientific range display (e.g. "4.8 – 6.2 ppm•h")
    │   │   └── ConfidenceIndicator.tsx    # High/Medium/Low/Invalid confidence indicator
    │   ├── layout/
    │   │   ├── PublicNav.tsx              # Public header for landing and readme
    │   │   ├── DashboardNav.tsx           # Top navigation bar for logged-in users with role switcher
    │   │   ├── Footer.tsx                 # Standard industrial footer
    │   │   └── LiveAlertsTicker.tsx       # Realtime animated alert ticker for elevated safety incidents
    │   ├── manager/
    │   │   ├── WorkerTable.tsx            # Searchable, filterable workforce table
    │   │   ├── AddWorkerModal.tsx         # Zod-validated worker creation modal
    │   │   ├── BandAssignmentModal.tsx    # Assign QR wristband to active worker
    │   │   └── ShiftScanModal.tsx         # Start/End shift optical scan simulator & ΔE preview
    │   ├── worker/
    │   │   ├── ExposureSummaryCard.tsx    # Today / Week / Month / Lifetime cumulative exposure cards
    │   │   ├── BandStatusCard.tsx         # 5-day lifecycle gauge, expiration alert, day countdown
    │   │   └── ShiftHistoryTimeline.tsx  # Chronological shift list with optical confidence badges
    │   ├── control-room/
    │   │   ├── PlantMetricGrid.tsx        # High-level KPIs (Active Workers, Active Bands, Open Alerts)
    │   │   ├── ExposureTrendChart.tsx     # Recharts multi-shift cumulative exposure curve
    │   │   └── LiveAlertsFeed.tsx         # Actionable alerts feed with Acknowledge/Resolve buttons
    │   └── providers/
    │       ├── QueryProvider.tsx          # TanStack React Query client with hydration support
    │       └── AuthProvider.tsx           # Context provider for user session, active company, and role
    ├── hooks/
    │   ├── useAuth.ts                     # User authentication & role hook
    │   ├── useWorkers.ts                  # React Query hook for workers query & add worker mutation
    │   ├── useBands.ts                    # React Query hook for bands query & assignment mutation
    │   ├── useShifts.ts                   # React Query hook for shifts & shift lifecycle
    │   ├── useReadings.ts                 # React Query hook for scan readings & ΔE calculation
    │   ├── useAlerts.ts                   # React Query hook with Supabase Realtime alerts subscription
    │   └── useWorkerExposure.ts           # React Query hook calling RPC get_worker_exposure
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts                  # Browser Supabase client (createBrowserClient)
    │   │   ├── server.ts                  # Server Supabase client (createServerClient with cookies)
    │   │   └── middleware.ts              # Session refresh helper
    │   ├── utils.ts                       # Tailwind clsx/twMerge class utility, formatters
    │   ├── colorimetry.ts                 # CIE Lab ΔE math and ppm•h conversion models
    │   └── constants.ts                   # Exposure thresholds (OSHA/NIOSH), 5-day lifecycle limit, roles
    ├── types/
    │   ├── database.types.ts              # Strongly-typed schema matching Supabase Postgres
    │   ├── exposure.ts                    # Exposure range, confidence, and reading models
    │   └── app.ts                         # UI filter types, form schemas, navigation items
    └── __tests__/
        ├── components/
        │   ├── ExposureRangeBadge.test.tsx
        │   ├── ConfidenceIndicator.test.tsx
        │   ├── BandStatusCard.test.tsx
        │   ├── MetricCard.test.tsx
        │   └── WorkerTable.test.tsx
        ├── utils/
        │   └── colorimetry.test.ts
        └── hooks/
            └── useAuth.test.ts
```

---

## 5. Industrial Safety Design System & Styling Architecture

### 5.1 Color Palette & Theme Tokens
The theme is designed for **high readability in industrial control rooms and field environments**, using a dark, low-glare canvas with vibrant status accents:

```ts
// tailwind.config.ts theme extension
theme: {
  extend: {
    colors: {
      industrial: {
        bg: '#090d16',        // Deep obsidian background
        card: '#0f172a',      // Slate-900 surface
        cardHover: '#1e293b', // Slate-800 hovered surface
        border: '#334155',    // Slate-700 structural border
        borderFocus: '#06b6d4', // Cyan-500 active border
        muted: '#64748b',     // Slate-500 muted text
        text: '#f8fafc',      // Slate-50 primary text
      },
      hazard: {
        safe: '#10b981',      // Emerald-500: Normal exposure (< 10 ppm•h)
        safeBg: 'rgba(16, 185, 129, 0.12)',
        warning: '#f59e0b',   // Amber-500: Elevated exposure (10–20 ppm•h) or Day 4-5 band
        warningBg: 'rgba(245, 158, 11, 0.12)',
        danger: '#ef4444',    // Red-500: Critical exposure (> 20 ppm•h) or Expired band
        dangerBg: 'rgba(239, 68, 68, 0.12)',
        tech: '#06b6d4',      // Cyan-500: Active sensors & calibration
        techBg: 'rgba(6, 182, 212, 0.12)',
      }
    },
    fontFamily: {
      sans: ['var(--font-inter)', 'sans-serif'],
      mono: ['var(--font-geist-mono)', 'monospace'],
    }
  }
}
```

### 5.2 Visual Accents & UI Patterns
- **Scientific Monospace Readouts:** Exposure values, Delta-E values, and QR IDs are rendered in `font-mono` for crisp tabular alignment.
- **Pulsing Safety Beacons:** Active shifts and live sensor data display small pinging indicator dots (`animate-ping`).
- **Glassmorphism Panels:** Translucent card surfaces (`bg-slate-900/80 backdrop-blur-md border border-slate-800`) with high-contrast text.
- **5-Day Band Lifecycle Progress:** Visual 5-segment stepper or continuous gradient progress bar showing Day 1 through Day 5 (turning Amber on Day 4 and Red on Day 5+).

---

## 6. Page Specifications & Component Workflows

### 6.1 Public Landing Page (`/src/app/page.tsx`)
- **Hero Section:** High-impact heading, animated radar graphic, CTA buttons ("Open Safety Console", "How It Works").
- **Core Pillars:** 3 interactive cards highlighting (1) Colorimetric Passive Badges, (2) Optical Mobile Scanning, (3) Real-Time Control Room Telemetry.
- **Team & Mission Section:** Team credentials, SIH problem statement, and chemical-to-digital bridge explanation.

### 6.2 Science & Specifications Page (`/src/app/readme/page.tsx`)
- **Chemistry & Calibration Breakdown:** Explaining the $SbCl_3$ + Purple-Cabbage Anthocyanin benchmark, CIE Lab $\Delta E$ calculation formula:
  $$\Delta E = \sqrt{(L^* - L_0^*)^2 + (a^* - a_0^*)^2 + (b^* - b_0^*)^2}$$
- **5-Day Reactive Patch Lifecycle Rules:** Explicit breakdown of why reactive patches must be retired after 5 working days.
- **Competitive Advantage Matrix ("Why We Are Better"):** Detailed comparison table demonstrating range-based exposure vs fake single numbers, permanent worker history vs reset devices, and confidence score integrity.

### 6.3 Authentication & Demo Mode Switcher (`/src/app/login/page.tsx`)
- **Real Supabase Auth:** Form with email/password connected to `supabase.auth.signInWithPassword`.
- **Demo Mode Quick-Bypass:** One-click instant role shortcuts allowing evaluators to bypass authentication and preview the application as:
  - **Shift Manager** (`/manager`)
  - **Worker** (`/worker`)
  - **Control Room Manager** (`/control-room`)

### 6.4 Shift Manager Dashboard (`/src/app/(dashboard)/manager/page.tsx`)
- **Manager KPI Metrics:** Active workers count, registered wristbands, active shifts in progress, and unacknowledged alerts.
- **Workforce Registry Table (`WorkerTable.tsx`):** List of workers with status badges, search filter, and "Assign Band" / "Start Shift" actions.
- **Worker Registration Modal (`AddWorkerModal.tsx`):** Form with Zod validation (`full_name`, `worker_code`, `department`, `designation`, `phone`).
- **Shift Scan Simulator Modal (`ShiftScanModal.tsx`):** Interface to simulate optical scanning at Shift Start and Shift End, calculating $\Delta E$, reading status, and computed dose ranges.

### 6.5 Worker Dashboard (`/src/app/(dashboard)/worker/page.tsx`)
- **Worker Profile Header:** Worker name, employee code, active plant/work area, and live on-shift status.
- **Cumulative Exposure Cards (`ExposureSummaryCard.tsx`):** 4 KPI tiles displaying:
  - **Today:** e.g., `1.2 – 2.5 ppm•h`
  - **This Week:** e.g., `8.4 – 10.1 ppm•h`
  - **This Month:** e.g., `32.0 – 41.5 ppm•h`
  - **Lifetime:** e.g., `145.0 – 180.0 ppm•h`
- **Current Band Status Card (`BandStatusCard.tsx`):** Active band ID (e.g. `H2S-004-92A`), working day gauge (`3 / 5 days`), latest scan reading, and confidence indicator (`HIGH`).
- **Shift History Log (`ShiftHistoryTimeline.tsx`):** Chronological shift records with start/end timestamps, recorded exposure delta, and confidence ratings.

### 6.6 Control Room Console (`/src/app/(dashboard)/control-room/page.tsx`)
- **Live Plant Safety Telemetry (`PlantMetricGrid.tsx`):** Total workforce on site, active wristbands, average plant exposure, and critical exposure count.
- **Exposure Trend Analytics (`ExposureTrendChart.tsx`):** Recharts multi-point time series showing plant-wide exposure progression against safe threshold lines ($10\text{ ppm}\cdot\text{h}$ warning threshold, $20\text{ ppm}\cdot\text{h}$ hazard limit).
- **Real-Time Alert Feed (`LiveAlertsFeed.tsx`):** Live stream of high/critical exposure alerts with instant "Acknowledge" and "Resolve" action triggers.

---

## 7. Data Layer & Supabase Integration Architecture

### 7.1 Client & Server Supabase Client Setup
Using the official `@supabase/ssr` package:

```ts
// src/lib/supabase/client.ts (Browser Client)
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```ts
// src/lib/supabase/server.ts (Server Component / Action Client)
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handled for Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handled for Server Components
          }
        },
      },
    }
  );
}
```

### 7.2 TanStack Query Integration & Realtime Sync
TanStack Query manages client cache, while Supabase Realtime invalidates active query keys whenever Postgres database changes occur:

```ts
// Example: Realtime Alert Sync in useAlerts hook
export function useAlerts() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  // 1. Standard cached query
  const query = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*, workers(full_name, worker_code)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 10000,
  });

  // 2. Realtime listener that invalidates the query
  useEffect(() => {
    const channel = supabase
      .channel('realtime-alerts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
          if (payload.eventType === 'INSERT') {
            toast.error(`Safety Alert: ${payload.new.message}`, { duration: 6000 });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  return query;
}
```

---

## 8. Unit Testing Strategy & Test Plan

### 8.1 Testing Stack
- **Test Runner:** Jest (`jest`, `ts-jest` or `babel-jest` via Next.js `next/jest`).
- **DOM Testing:** `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- **Environment:** `jest-environment-jsdom`.

### 8.2 Test Suite Matrix

| Component | Target File | Test Scenarios |
|---|---|---|
| `ExposureRangeBadge` | `src/components/common/ExposureRangeBadge.tsx` | 1. Correctly formats low and high bounds (e.g. `4.8 – 6.2 ppm•h`).<br/>2. Applies emerald tint for normal range ($<10$), amber for elevated ($10-20$), rose for critical ($>20$).<br/>3. Handles zero and undefined edge cases safely. |
| `ConfidenceIndicator` | `src/components/common/ConfidenceIndicator.tsx` | 1. Renders HIGH, MEDIUM, LOW, INVALID status with distinct colors and icons.<br/>2. Displays accessible aria-labels and descriptions. |
| `BandStatusCard` | `src/components/worker/BandStatusCard.tsx` | 1. Shows correct working day fraction (e.g. `Day 3 of 5`).<br/>2. Shows warning tag on Day 4 and critical expiration badge on Day 5+.<br/>3. Renders band identifier and QR code badge. |
| `MetricCard` | `src/components/common/MetricCard.tsx` | 1. Renders title, value, and icon correctly.<br/>2. Renders trend change indicator (e.g. `+12% vs last shift`). |
| `WorkerTable` | `src/components/manager/WorkerTable.tsx` | 1. Filters worker rows based on search input.<br/>2. Displays empty state message when no workers match query.<br/>3. Triggers action callback when action button is clicked. |
| `colorimetry` | `src/lib/colorimetry.ts` | 1. Correctly computes CIE Lab $\Delta E$ given two RGB/Lab points.<br/>2. Correctly translates $\Delta E$ to low/high exposure range using calibration version lookup. |

### 8.3 Test Runner Configuration & Commands

```json
// package.json test scripts
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

```js
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
};

module.exports = createJestConfig(customJestConfig);
```

```ts
// jest.setup.ts
import '@testing-library/jest-dom';
```

---

## 9. Implementation Roadmap & Milestones

1. **Milestone 1: Clean Foundation on `frontend` Branch**
   - Checkout branch `frontend`.
   - Setup `package.json` with Next.js 14, Tailwind, Framer Motion, TanStack Query, Supabase SSR, Jest, RTL, Lucide.
   - Configure `tailwind.config.ts`, `globals.css`, `tsconfig.json`, and `jest.config.js`.

2. **Milestone 2: Core Atoms & Design System Implementation**
   - Build common components: `Badge`, `Button`, `Card`, `Modal`, `MetricCard`, `ExposureRangeBadge`, `ConfidenceIndicator`.
   - Configure Providers (`QueryProvider`, `AuthProvider`, `Toaster`).
   - Implement unit tests for core atomic components.

3. **Milestone 3: Public Views & Authentication Experience**
   - Build Public Landing Page (`/src/app/page.tsx`) with Hero, Feature Pillars, and Team Section.
   - Build Science & Comparison Page (`/src/app/readme/page.tsx`).
   - Build Login Page (`/src/app/login/page.tsx`) with Supabase Auth and Demo Role Switcher.

4. **Milestone 4: Shift Manager & Worker Dashboards**
   - Build Shift Manager Console (`/src/app/(dashboard)/manager/page.tsx`) with workforce table, add worker form, and shift scan simulation.
   - Build Worker Dashboard (`/src/app/(dashboard)/worker/page.tsx`) with 4-tier cumulative exposure metrics, 5-day band lifecycle status, and shift history.

5. **Milestone 5: Control Room Console & Realtime Telemetry**
   - Build Control Room Console (`/src/app/(dashboard)/control-room/page.tsx`) with Recharts exposure curves and realtime safety alert feed.
   - Implement Supabase Realtime subscriptions with instant toast notifications.

6. **Milestone 6: Verification & Test Execution**
   - Run full Jest unit test suite (`npm test`).
   - Run full production build check (`npm run build`).

---

## 10. Conclusion
This frontend architecture provides a robust, scalable, and scientifically rigorous foundation for the H₂S Monitor Platform. It decouples client-side presentation from backend state, guarantees type safety across the entire application, and delivers an intuitive, high-contrast user interface tailored for industrial safety operations.
