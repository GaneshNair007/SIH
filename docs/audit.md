# Full Website & Repository Audit Report

**Date**: September 2026  
**System**: H₂S Monitor Platform  
**Target Quality Bar**: Production-Ready / Hackathon Evaluation Standard  

---

## 1. Executive Summary

This audit examines all 6 application routes, UI components, backend data services, state management, and documentation in the repository. The audit evaluates four core dimensions:
1. **User Experience (UX) & Design Consistency**: Uniformity across dark-mode palettes, component libraries, typography, and responsive layouts.
2. **Accessibility (a11y) & SEO**: Semantic HTML, ARIA attributes, contrast ratios, meta titles/descriptions, and keyboard navigation.
3. **Backend & Architecture**: Data validation, error handling, API encapsulation, and resilience against offline network drops.
4. **Code Quality & Maintainability**: Type safety, elimination of dead code, test coverage, and documentation accuracy.

---

## 2. Page-by-Page Audit & Issue Matrix

| Route | Main Findings & Gaps | UX / Visual Issues | Code & Architecture Issues | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **`/` (Landing)** | High-contrast editorial style (`#050505` + `#E3262E`). Excellent animations (laser scan, 3D grid, scroll-scrubbing text). | Custom cursor needs fallback on touch devices. Header links need smooth scrolling anchors. | Needs strict TypeScript types for scroll triggers; ensure images load asynchronously with priority tags. | **P1** |
| **`/login`** | Functional auth form with demo bypass buttons. | Currently uses outdated `slate-900` background and cyan buttons, clashing with the new editorial theme. | Lacks server-side credential sanitization and comprehensive form state error boundaries. | **P0** |
| **`/manager`** | Contains workforce table and Add Worker modal. | Uses legacy `slate-900` + `cyan` design. Table lacks responsive card fallback on mobile devices. | Workforce search is in-memory only; lacks server pagination and optical scan simulator described in product specs. | **P0** |
| **`/worker`** | Displays cumulative exposure numbers and 5-day band counter with Supabase Realtime subscription. | Legacy styling clashing with home page. Exposure units and confidence badges need high-contrast formatting. | Realtime listener does not cleanly reconnect on network drop; fallback data is static. | **P0** |
| **`/control-room`** | Displays telemetry metrics and Recharts line chart. | Outdated color palette; chart tooltips use default styling rather than custom dark theme. | Chart data is hardcoded instead of dynamically queried from the backend / Supabase RPC functions. | **P0** |
| **`/readme`** | Documents 5-step operational workflow and comparison table. | Typography does not match `Space Grotesk` and `Bodoni Moda`; lacks visual diagrams. | Static markup without link back to developer API reference. | **P1** |

---

## 3. Prioritized Remediation Roadmap

### P0 (Critical — Immediate Fixes)
- **Design System Harmonization**: Migrate `/login`, `/manager`, `/worker`, `/control-room`, and `/readme` to the unified `#050505` Void Canvas, `#141924` Surface, and `#E3262E` Signal Accent design system.
- **Backend API Routes**: Build standard Next.js route handlers (`/api/stats`, `/api/workers`, `/api/scans`, `/api/alerts`) to decouple client UI from direct database queries and provide Zod validation on incoming payloads.
- **Optical Scan Simulator**: Integrate an interactive optical scan simulator into `/manager` to test shift start and shift end calculations.

### P1 (High Priority)
- **Documentation Overhaul**: Publish `/docs/design-system.md`, `/docs/backend-architecture.md`, `/docs/api-reference.md`, `/docs/page-changes.md`, and complete `/README.md`.
- **Dynamic Control Room Telemetry**: Bind control room charts to real aggregated exposure data from the data service layer.

### P2 (Medium Priority)
- **Accessibility & Contrast**: Ensure all text elements meet WCAG 2.1 AA contrast requirements ($> 4.5:1$ ratio).
- **Responsive Mobile Layouts**: Add collapsible sidebar / bottom drawer navigation for small screens ($< 768px$).

### P3 (Low Priority)
- **Repository Hygiene**: Clean up redundant files, remove unused imports, and standardize code formatting.
