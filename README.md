# H₂S Monitor — Industrial Spatial Telemetry & Gas Dosimetry Platform

> **Smart India Hackathon (SIH)** · Next-Generation Workplace Safety Platform  
> An end-to-end industrial health and safety system bridging passive colorimetric chemical sensing ($SbCl_3$ & purple cabbage anthocyanin) with smartphone camera optical spectroscopy and real-time cloud telemetry.

---

## 🏆 Key Features

- **Continuous Range-Based Exposure Dosimetry**: Expresses cumulative worker exposure as honest scientific ranges (e.g., `4.8–6.2 ppm•h`) rather than misleading single-point values.
- **5-Working-Day Band Lifecycle Management**: Automated tracking and enforcement of the 5-day active cartridge window and 7-day chemical expiry.
- **Spider-Man / Reconnaissance Editorial UI**: High-contrast, dark-mode design system with 3D perspective grid, laser scanner, and scroll-scrubbing text animations.
- **Role-Based Access Control**: Dedicated, security-isolated consoles for **Shift Managers**, **Workers**, and **Control Room Operators**.
- **Optical Scan Simulator**: Ingests reference color patches ($A, B, C$), computes CIE $L^*a^*b^*$ color difference ($\Delta E$), and automatically flags confidence levels (`HIGH`, `MEDIUM`, `LOW`, `INVALID`).
- **Hybrid Serverless & BaaS Backend**: Next.js 14 Route Handlers backed by Supabase PostgreSQL (with Row Level Security and PL/pgSQL RPC functions) with an automatic offline fallback store for 100% demo uptime.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **npm** or **yarn**

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/GaneshNair007/SIH.git
cd sih-1

# Install project dependencies
npm install
```

### 3. Environment Setup
Copy `.env.example` (or set up `.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Running the Test Suite
```bash
npm test
```

---

## 🧭 Application Routes

| Route | View | Description |
| :--- | :--- | :--- |
| **`/`** | **Home / Landing** | Editorial hero with 3D grid floor, scroll-scrubbing intro, expertise pillars, team showcase, and footer transition. |
| **`/login`** | **Authentication Portal** | Supabase email/password login with instant demo role-bypass buttons. |
| **`/manager`** | **Shift Manager Console** | Workforce roster table, worker registration form, and optical scan simulator modal. |
| **`/worker`** | **Worker Personal Portal** | Cumulative exposure ranges (today, week, month, lifetime), band status ($3/5$ days), and Realtime alerts. |
| **`/control-room`** | **Control Room Overview** | Plant-wide safety KPIs, elevated exposure counters, and Recharts telemetry trends. |
| **`/readme`** | **Architecture & Matrix** | 5-step operational workflow and "Why We Are Better" competitive comparison matrix. |

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS, CSS Keyframes (`grid-move`, `laserScan`, `float-slow`)
- **Typography**: Bodoni Moda, Space Grotesk, Inter
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Data Layer**: TanStack React Query v5, Supabase JS Client (`@supabase/supabase-js`)
- **Data Visualization**: Recharts
- **Validation**: Zod + React Hook Form
- **Testing**: Jest + React Testing Library (32/32 tests passing)

---

## 📚 Documentation

Detailed documentation is available in the [`/docs`](./docs) directory:
- [Website & Repository Audit (`/docs/audit.md`)](./docs/audit.md)
- [Design System Specification (`/docs/design-system.md`)](./docs/design-system.md)
- [Backend Architecture (`/docs/backend-architecture.md`)](./docs/backend-architecture.md)
- [REST API Reference (`/docs/api-reference.md`)](./docs/api-reference.md)
- [Chemical Benchmark Spec (`/docs/H2S_Wristband_SbCl3_Anthocyanin_Complete.md`)](./docs/H2S_Wristband_SbCl3_Anthocyanin_Complete.md)
- [Page Redesign Changelog (`/docs/page-changes.md`)](./docs/page-changes.md)

---

## 📄 License
MIT License · Developed for the Smart India Hackathon.
