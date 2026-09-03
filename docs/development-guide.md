# Developer & Extension Guide

Welcome to the engineering guide for extending and contributing to the **H₂S Monitor Platform**.

---

## 1. Project Directory Structure

```
sih-1/
├── docs/                        # Complete architectural and API specs
├── public/                      # Static assets (team portraits, icons)
├── src/
│   ├── app/
│   │   ├── api/                 # Next.js 14 Route Handlers
│   │   │   ├── alerts/route.ts  # Alarms retrieval & acknowledgment
│   │   │   ├── scans/route.ts   # Optical colorimetry ingestion & ΔE math
│   │   │   ├── stats/route.ts   # Plant safety KPI aggregations
│   │   │   └── workers/route.ts # Workforce directory & enrollment
│   │   ├── control-room/        # Control room dashboard
│   │   ├── login/               # Authentication & demo role selector
│   │   ├── manager/             # Shift manager console & scan simulator
│   │   ├── readme/              # Technical spec & comparison matrix
│   │   ├── worker/              # Worker personal exposure profile
│   │   ├── globals.css          # Design system variables & animations
│   │   ├── layout.tsx           # Global root layout & font imports
│   │   └── page.tsx             # Editorial landing page
│   ├── components/              # Shared React components & Providers
│   ├── lib/
│   │   ├── colorimetry.ts       # CIE L*a*b* conversion & ΔE formula
│   │   ├── dataService.ts       # Unified data service (live + offline fallback)
│   │   ├── mockStore.ts         # Reactive relational in-memory store
│   │   └── supabase.ts          # Supabase client instantiation
│   └── types/
│       ├── database.ts          # Supabase PostgreSQL schema interfaces
│       └── domain.ts            # Application domain entities & enums
└── supabase/
    └── migrations/              # PostgreSQL DDL & RLS security policies
```

---

## 2. How to Extend This Project

### Adding a New Toxic Gas Analyte (e.g., Carbon Monoxide $CO$ or Ammonia $NH_3$)
1. **Define the Calibration Curve in `src/lib/colorimetry.ts`**:
   - Add new reference patch RGB baselines and lookup coefficients mapping $\Delta E$ to exposure dose ($ppm \cdot h$).
2. **Update Database Types in `src/types/domain.ts`**:
   - Add the gas enum identifier to the `Reading` and `ExposureDaily` interfaces.
3. **Add Endpoint Support in `src/app/api/scans/route.ts`**:
   - Accept the analyte target parameter and apply the corresponding chemistry curve.

### Adding an Automated Alert Webhook (SMS / PagerDuty / Slack)
1. In `src/app/api/alerts/route.ts` (or Supabase Database Webhooks):
   - Hook into critical threshold events ($> 10.0\text{ ppm}\cdot\text{h}$).
   - Dispatch an HTTP POST payload to the designated alerting endpoint with worker identity, plant zone, and calculated $\Delta E$.

### Adding a Camera QR Code Scanner
1. Install an optical decoding library (e.g., `html5-qrcode` or `@zxing/library`).
2. Integrate a scanner viewfinder into the optical scan modal in `src/app/manager/page.tsx` to automatically populate `worker_code` and `band_code`.
