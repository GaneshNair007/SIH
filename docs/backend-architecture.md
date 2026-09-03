# Backend Architecture & Data Layer Specification

---

## 1. Architectural Overview

The H₂S Monitoring Platform implements a **Hybrid Serverless & Backend-as-a-Service (BaaS) Architecture**:

```
 ┌─────────────────────────────────────────────────────────────┐
 │                     Next.js 14 Frontend                     │
 │      (App Router, React 18, TanStack Query, Framer Motion)   │
 └──────────────┬──────────────────────────────┬───────────────┘
                │ Client BaaS                  │ Serverless
                │ Realtime WS                  │ REST Routes
                ▼                              ▼
 ┌─────────────────────────────┐    ┌──────────────────────────┐
 │    Supabase PostgreSQL      │    │    Next.js API Layer     │
 │  - Row Level Security (RLS) │    │   `src/app/api/*`        │
 │  - PL/pgSQL RPC Functions   │    │  - Zod Request Validation│
 │  - Realtime Subscriptions   │    │  - Rate Limiting / Auth  │
 └──────────────▲──────────────┘    └──────────┬───────────────┘
                │                              │
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │ Unified Data Service Layer   │
                │     `src/lib/dataService.ts` │
                │  - Live Supabase Driver      │
                │  - Reactive Offline Store    │
                └──────────────────────────────┘
```

---

## 2. Core Entities & Database Schema (10 Relational Models)

1. **`companies`**: Multi-tenant isolation boundary (`id`, `name`, `code`, `created_at`).
2. **`users`**: Platform actors linked to `auth.users` (`id`, `company_id`, `email`, `name`, `role`).
3. **`workers`**: Industrial personnel tracked for cumulative exposure (`worker_code`, `full_name`, `department`, `status`).
4. **`bands`**: Colorimetric wearable wristbands with strict 5-working-day lifecycle tracking (`band_code`, `working_day_count`, `current_cumulative_low`, `current_cumulative_high`, `status`).
5. **`shifts`**: Active and completed work shifts linking workers, wristbands, and managers.
6. **`readings`**: Start/end optical camera readings with RGB/Lab coordinates and computed color difference $\Delta E$.
7. **`exposure_daily`**: Aggregated daily cumulative exposure dose ranges ($ppm \cdot h$).
8. **`alerts`**: Real-time safety hazard alarms (`NORMAL`, `ELEVATED`, `HIGH`, `CRITICAL`).
9. **`calibration_versions`**: Active optical spectroscopy curves and chemistry versions.
10. **`calibration_points`**: $\Delta E \to ppm \cdot h$ dose range interpolation pairs.

---

## 3. High-Performance RPC Functions

### `get_manager_stats(company_id UUID)`
Aggregates active workforce, active wristbands, active shifts, daily scans, and open alarms in a single network roundtrip to minimize latency on manager and control room dashboards.

### `get_worker_exposure(target_worker_id UUID)`
Computes historical exposure aggregates across 4 standard industrial time horizons:
- `today`: Daily shift cumulative dose ($ppm \cdot h$).
- `week`: 7-day rolling exposure sum.
- `month`: 30-day chronic accumulation.
- `long_term`: Worker career cumulative lifetime exposure across all band replacements.

---

## 4. Resilience & Offline Mode Strategy

For industrial environments with spotty connectivity and hackathon demonstrations:
- **`src/lib/dataService.ts`** intercepts data requests.
- When Supabase credentials or network connections are unavailable, it smoothly falls back to **`src/lib/mockStore.ts`**, which provides a fully reactive in-memory relational graph supporting all CRUD operations, optical scan calculations, and alert acknowledgments.
