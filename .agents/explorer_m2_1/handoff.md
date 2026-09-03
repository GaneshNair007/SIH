# Handoff Report — Explorer M2-1: Public Home Page Investigation

**Scope**: Investigation and compliance audit of the Public Home page (`src/app/page.tsx`, `src/lib/content.ts`, `public/`, and related layout/footer components) against Milestone 2 (R2) requirements.

---

## 1. Observations

### 1.1 Hero Section
- **File**: `src/app/page.tsx`, lines 30–65
- **Headline**: Renders `{PROJECT.name}` (`"Rakshak AI (H₂S Dose Wristband)"` defined in `src/lib/content.ts:2`).
- **Value Proposition**: Paragraph at lines 35–37 states:
  > *"A passive wristband that records a colour response to H₂S exposure. Read the band with a smartphone and connect each reading to a worker’s history."*
- **Call-to-Action Buttons**:
  - Primary CTA: `<Link href="/login" className="btn-primary text-base px-6 py-3">Manager login</Link>` (line 42)
  - Secondary CTA: `<Link href="/working" className="btn-secondary text-base px-6 py-3">Explore the pipeline</Link>` (line 39)
- **Visuals**: Embedded SVG concept illustration (lines 49–64) rendering a wristband strap (`strokeWidth="24"`), white cartridge housing, QR code abstraction, and Patches A (blue), B (yellow), and C (green).

### 1.2 4-Pillar Project Description
- **File**: `src/app/page.tsx`, lines 68–108
- **Structure**: 4-column responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`) under header "System Overview".
  1. *The Problem* (lines 76–79): *"Keeping an organized record of individual workers’ exposure-related readings in hazardous environments is difficult and expensive at scale."*
  2. *The Hardware* (lines 85–88): *"Passive colour-changing material in a cartridge physically separated from skin."*
  3. *The Software* (lines 94–97): *"Scan identity, photograph patches, assess image quality, quantify colour change, and estimate dose only when appropriate calibration is available."*
  4. *Operational Purpose* (lines 103–106): *"Shift records, worker history, condition flags, and supervisor review."*

### 1.3 Research Prototype Notice Banner
- **File**: `src/app/page.tsx`, lines 109–115
- **Content & Styling**: Rendered in a Material warning card (`bg-status-warningBg border border-status-warning text-status-warning`):
  > *"Research prototype for cumulative exposure assessment. Not a continuous gas alarm."*

### 1.4 Platform Access Workspace Cards
- **File**: `src/app/page.tsx`, lines 118–139; `src/lib/content.ts`, lines 30–37
- **Grid Layout**: 2-column grid (`grid-cols-1 sm:grid-cols-2`).
- **Cards Rendered**:
  - Shift Manager: `{ROLES_DESCRIPTION.shiftManager.short}` (*"Assigns bands, runs scan workflows at shift boundaries, and issues field safety alerts."*)
  - Control Room: `{ROLES_DESCRIPTION.controlRoom.short}` (*"Monitors aggregated dashboard telemetry, worker exposure ledgers, and resolves tier 3 breaches."*)
- **Missing Element**: The **Field Employee** workspace card is omitted from `src/app/page.tsx` and from `ROLES_DESCRIPTION` in `src/lib/content.ts`.

### 1.5 Team Showcase & Authentic Portrait Assets
- **Files**: `src/app/page.tsx` (lines 141–163), `src/lib/content.ts` (lines 12–28), `public/`
- **Authentic Assets in `public/`**:
  - `public/ganesh_real.jpg` (authentic portrait of Ganesh Nair)
  - `public/arjit.jpg` (authentic portrait of Arjit Ujjawal)
  - `public/sumedh.png` (authentic portrait of Sumedh)
- **Data Configuration in `src/lib/content.ts`**:
  - Lines 16, 21, 26 have empty strings: `image: ""`.
- **Component Rendering in `src/app/page.tsx`**:
  - Lines 148–153 render only `{member.name.charAt(0)}` in a generic fallback div without attempting to render `<img src={member.image} />` or `next/image`.
  - Line 159–161 renders an explicit placeholder message: `<div className="mt-12 text-sm text-text-secondary italic">Team details coming soon.</div>`.

### 1.6 Public Footer & Regulatory Citations
- **File**: `src/app/page.tsx`, lines 167–184
- **Content**: Inline footer with 3 navigation links (`Home`, `Pipeline`, `Login`) and a `"Research Prototype"` badge.
- **Missing Elements**:
  - No explicit citations of **OISD-STD-105** (Oil Industry Safety Directorate) or **DGMS** (Directorate General of Mines Safety) standards.
  - `src/components/ui/PublicFooter.tsx` exists as an unused orphan component with legacy non-MD3 color tokens (`bg-canvas-white`, `bg-teal`, `text-charcoal`).

---

## 2. Logic Chain

1. **Hero Compliance**:
   - The headline, value proposition, and two primary action buttons (`/working` and `/login`) are present and functional.
   - Adding technical feature badges (e.g. "SbCl₃-Anthocyanin Matrix", "Zero-Power Optical Capture", "OISD-STD-105 Compliant") improves user clarity and MD3 visual polish.
2. **4-Pillar Overview Depth**:
   - All 4 pillars ("The Problem", "The Hardware", "The Software", "Operational Purpose") exist in the grid.
   - However, the text is currently 1-sentence placeholder copy. Expanding it with explicit details (toxic-free SbCl₃ matrix, Patches A/B/C, CIELAB D65 $\Delta E$, statutory compliance) elevates the technical depth to match `PROJECT.md`.
3. **Research Prototype Notice**:
   - The notice banner exists with proper warning styling, but should clarify field deployment scope (auxiliary post-shift cumulative exposure tracking to complement statutory real-time gas detectors).
4. **Platform Access Deficiency (Deficiency #1)**:
   - R2 explicitly specifies 3 workspace cards: **Shift Manager**, **Control Room**, and **Field Employee**.
   - `src/app/page.tsx` and `src/lib/content.ts` currently only define 2 cards (Shift Manager and Control Room).
   - Inference: `src/lib/content.ts` must add `fieldEmployee` to `ROLES_DESCRIPTION`, and `src/app/page.tsx` must render a 3-column responsive grid (`grid-cols-1 md:grid-cols-3`) with direct links to `/login`.
5. **Team Showcase Deficiency (Deficiency #2)**:
   - The user requested an authentic team showcase for Ganesh Nair, Arjit Ujjawal, and Sumedh.
   - High-quality portrait images already exist in the repository (`public/ganesh_real.jpg`, `public/arjit.jpg`, `public/sumedh.png`).
   - However, `src/lib/content.ts` left `image: ""` blank, and `src/app/page.tsx` omitted the `<img />` element and included `"Team details coming soon."`.
   - Inference: `src/lib/content.ts` and `src/app/page.tsx` must be updated to reference `/ganesh_real.jpg`, `/arjit.jpg`, and `/sumedh.png`, render image elements with fallback handlers, and remove the placeholder text.
6. **Public Footer Standards Citation Deficiency (Deficiency #3)**:
   - R2 requires OISD-STD-105 and DGMS safety standards citations in the footer.
   - The current inline footer in `src/app/page.tsx` has zero mention of OISD-STD-105 or DGMS.
   - Inference: The footer must be enhanced with explicit citations (e.g. OISD-STD-105 Work Permit & Hazardous Gas Monitoring, DGMS Toxic Gas Thresholds: 10 ppm TWA / 15 ppm STEL), full navigation links, and prototype status metadata.

---

## 3. Caveats

- **Scope Boundary**: This investigation is strictly read-only for the Public Home page (`/`), its data module (`src/lib/content.ts`), and static assets (`public/`).
- **Pipeline & Auth Separation**: The `/working` page (4 tabs) and `/login` page are managed in parallel sub-milestones, though navigation links between `/` and these routes were verified.
- **Backend Independence**: The Public Home page is fully client-renderable and static-optimized; it does not depend on a live FastAPI connection to render.

---

## 4. Conclusion & Actionable Proposals

The Public Home page layout and structure are 70% aligned with R2, but require 3 critical enhancements and 3 content polish updates for 100% compliance:

### Required Code Changes

#### A. Update `src/lib/content.ts`
Enrich `PROJECT`, `TEAM`, `ROLES_DESCRIPTION`, and `SYSTEM_PILLARS`:
```typescript
export const PROJECT = {
  name: "Rakshak AI (H₂S Dose Wristband)",
  shortName: "Rakshak AI",
  tagline: "Continuous Passive Colorimetric Dosimetry & Industrial Plant Safety Platform",
  heroLines: [
    "A passive wristband that records a colour response to H₂S exposure. Read the band with a smartphone and connect each reading to a worker’s history.",
    "Eliminating toxic heavy metals with SbCl₃–Anthocyanin reaction matrices and CIELAB optical quantification."
  ],
  status: "Research & Field Evaluation Prototype",
  limitation: "Auxiliary cumulative dosimeter for shift exposure estimation; does not replace active continuous gas alarms required under OISD-STD-105 & DGMS regulations.",
  standards: [
    "OISD-STD-105: Work Permit System & Hazardous Gas Monitoring in Oil & Gas Installations",
    "DGMS: Directorate General of Mines Safety (Toxic Gas Exposure Thresholds: 10 ppm TWA / 15 ppm STEL)"
  ],
  year: 2026,
};

export const TEAM = [
  {
    name: "Ganesh Nair",
    title: "Lead Engineer & Project Architect",
    role: "Full-Stack System Architecture, Optical Scan Pipeline, Regulatory Safety Standard Compliance",
    image: "/ganesh_real.jpg",
  },
  {
    name: "Arjit Ujjawal",
    title: "Core Developer & Algorithm Specialist",
    role: "CIELAB D65 Colorimetry Engine, Multi-Patch Drift Normalization, Exposure Calibration Curves",
    image: "/arjit.jpg",
  },
  {
    name: "Sumedh",
    title: "Core Developer & Embedded Systems",
    role: "Sensor Matrix Optimization, Mobile Web Capture Workflow, Real-Time Stream Integration",
    image: "/sumedh.png",
  }
];

export const ROLES_DESCRIPTION = {
  shiftManager: {
    title: "Shift Manager",
    short: "Assigns dosimeter bands, conducts start/end optical scan workflows, and issues immediate field safety advisories.",
    features: ["Batch Badge Provisioning", "8-Step Optical Scan Stepper", "Field Alert Broadcasts"],
    href: "/login?role=manager",
  },
  controlRoom: {
    title: "Control Room / HSE Officer",
    short: "Monitors real-time plant telemetry, spatial exposure heatmaps, worker health trends, and resolves Tier 3 breaches.",
    features: ["Live Plant Heatmap & Telemetry", "Statutory Incident Log (Form-A)", "Workforce Longitudinal Roster"],
    href: "/login?role=hse_officer",
  },
  fieldEmployee: {
    title: "Field Employee",
    short: "Performs shift check-in/out badge scans, tracks personal cumulative exposure dose, and accesses personal safety records.",
    features: ["Personal Dosimeter Check-In", "Shift Exposure History", "Safety Guidance & SOP Advisor"],
    href: "/login?role=employee",
  }
};
```

#### B. Update `src/app/page.tsx`
1. **Hero Section**: Add subtitle tags and visual badge counters.
2. **System Overview (4 Pillars)**: Render detailed descriptions for Problem, Hardware, Software, and Operational Purpose with Material icons.
3. **Prototype Notice**: Clarify that Rakshak is an auxiliary dosimeter complementing statutory continuous gas detectors.
4. **Platform Access (3 Cards)**: Render 3 responsive cards (Shift Manager, Control Room, Field Employee) with feature lists and direct login links.
5. **Team Showcase**: Render `<img src={member.image} alt={member.name} className="w-full h-full object-cover" />` with initial letter fallback on error, display titles and roles, and remove "Team details coming soon." placeholder.
6. **Public Footer**: Include full OISD-STD-105 & DGMS compliance citations, complete site navigation, copyright, and prototype status badge.

---

## 5. Verification Method

To verify the updated Home page:
1. **Static Build Gate**: Run `npm run build` or `npx next build` to ensure zero compilation or TypeScript errors.
2. **Visual & Structural Inspection**:
   - Inspect `/` in browser or test runner.
   - Confirm all 3 team images load correctly (`/ganesh_real.jpg`, `/arjit.jpg`, `/sumedh.png`) with proper circular aspect ratio and fallback handling.
   - Confirm all 3 Platform Access cards (Shift Manager, Control Room, Field Employee) are rendered and link to `/login`.
   - Confirm OISD-STD-105 and DGMS safety standards citations appear in the footer.
   - Verify that placeholder text (`"Team details coming soon."`) is removed.
