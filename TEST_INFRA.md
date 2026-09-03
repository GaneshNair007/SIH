# E2E Test Infra: Passive H₂S Wristband & Digital Monitoring Platform

## Test Philosophy
- **Opaque-box & Requirement-driven**: Tests derive strictly from user requirements in `ORIGINAL_REQUEST.md` and user-facing specifications, exercising the product as an end user / shift manager / control room operator would.
- **Progressive Testability**: Verification mechanisms for earlier tiers do not depend on complex downstream features.
- **Robustness**: Full coverage of error conditions, empty states, boundary values, and statutory safety constraints.

## Feature Inventory & Test Mapping
| # | Feature | Requirement Source | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) |
|---|---------|---------------------|:-----------------:|:-----------------:|:---------------------:|
| 1 | Quality Gates & Build Cleanliness | R1, Acceptance Criteria | 5 | 5 | ✓ |
| 2 | Auth Test Alignment & Sessions | R1, R3 | 5 | 5 | ✓ |
| 3 | Public Home Page (`/`) | R2 | 5 | 5 | ✓ |
| 4 | Interactive Pipeline (`/working`) | R2 | 5 | 5 | ✓ |
| 5 | Pipeline Redirect (`/pipeline`) | R2 | 5 | 5 | ✓ |
| 6 | Material Design 3 Design System | R2 | 5 | 5 | ✓ |
| 7 | Full Backend API Client Layer | R1, Acceptance Criteria | 5 | 5 | ✓ |
| 8 | SSE Real-Time Event Stream | R1, R3 | 5 | 5 | ✓ |
| 9 | Dual-Mode Authentication (`/login`) | R3 | 5 | 5 | ✓ |
| 10 | Shift Manager Safety Dashboard (`/dashboard`) | R3 | 5 | 5 | ✓ |
| 11 | Scan-First Stepper Workflow (`/scan`) | R3 | 5 | 5 | ✓ |
| 12 | Workforce Roster (`/employees`) | R3 | 5 | 5 | ✓ |
| 13 | Worker Dossier (`/employees/[id]`) | R3 | 5 | 5 | ✓ |
| 14 | Incident Log & PDF Report (`/incidents`) | R3 | 5 | 5 | ✓ |
| 15 | Personal Exposure History (`/history`) | R3 | 5 | 5 | ✓ |
| 16 | Dashboard Assistant Drawer | R4 | 5 | 5 | ✓ |
| 17 | CIELAB Colorimetry & Dose Engine | R1, R3 | 5 | 5 | ✓ |

## Test Architecture
- **Test Runner**: Jest + React Testing Library (`npm test`) + Next.js build verification (`npm run build`).
- **Test Layout**:
  - `src/__tests__/smoke.test.ts`: Base route and component loading
  - `src/__tests__/colorimetry.test.ts`: D65 conversion, CIE76 $\Delta E$, interpolation
  - `src/__tests__/adversarial-colorimetry.test.ts`: 20,000 fuzz vectors, D65 whitepoint invariant, metric axioms
  - `src/__tests__/mockStore.test.ts`: Reactive relational state, shift lifecycle, 5-day expiry
  - `src/__tests__/auth.test.tsx`: Dual-mode login, session persistence, role routing
  - `src/__tests__/e2e-workflow.test.tsx`: End-to-end integration across scan flow, dashboard metrics, and incident logging

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Normal Shift Flow | Auth (`/login`) $\to$ Baseline Scan $\to$ 8h Work $\to$ End-of-Shift Scan $\to$ Tier 1 Normal Record logged in `/history` | Medium |
| 2 | Elevated Exposure Alert Flow | End-of-Shift Scan with $\Delta E=6.5$ ($>1.0$ ppm TWA) $\to$ Tier 2 Caution flagged on `/dashboard` and worker profile | Medium |
| 3 | Critical H₂S Breach & OISD Report | High exposure $\Delta E=28.0$ $\to$ Tier 3 Critical Breach $\to$ Incident generated on `/incidents` with OISD-STD-105 Form-A PDF | High |
| 4 | Compromised Patch C / Expired Band | 5-day lifecycle limit or compromised moisture barrier $\to$ Scan rejected with `INVALID` confidence $\to$ Band replacement alert | Medium |
| 5 | Public Inquiry & Guided Assistant | Visitor navigates Home $\to$ `/working` 4 tabs $\to$ Opens Assistant Drawer $\to$ Guided Help FAQ lookup | Low |

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: $\ge 5$ test cases per feature ($17 \times 5 = 85$ tests).
- **Tier 2 (Boundary & Corner Cases)**: $\ge 5$ test cases per feature ($17 \times 5 = 85$ tests).
- **Tier 3 (Cross-Feature Combinations)**: $\ge 17$ pairwise integration tests.
- **Tier 4 (Real-World Application Scenarios)**: $\ge 5$ end-to-end lifecycle scenario tests.
- **Tier 5 (Adversarial Coverage Hardening)**: White-box challenger verification with zero gap tolerance.
