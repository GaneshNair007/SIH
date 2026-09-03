# M2-2 Science Pipeline & Public Interactive Tabs Specification Report

## 1. Observation

Direct code and architectural observations across `src/app/working/page.tsx`, `src/app/pipeline/page.tsx`, `src/lib/content.ts`, `src/lib/colorimetry.ts`, and associated public components:

### A. Routing and Query Parameter Synchronization
1. **Server Redirect (`/pipeline` $\to$ `/working`)**:
   - File: `src/app/pipeline/page.tsx:1-6`
   ```tsx
   import { redirect } from "next/navigation";
   export default function PipelineRedirect() {
     redirect("/working");
   }
   ```
   - Observed behavior: In Next.js 14 App Router, `redirect("/working")` in a server component issues an HTTP 307 temporary redirect to `/working`. Query params (e.g. `/pipeline?tab=chemistry`) are dropped unless explicitly forwarded via searchParams prop.
2. **Tab URL State Synchronization (`?tab=`)**:
   - File: `src/app/working/page.tsx:8-25, 273-275`
   - Component `WorkingTabs` wrapped inside `<Suspense fallback={...}>`.
   - `searchParams.get("tab") || "flowchart"` initializes `activeTab`.
   - `setTab(tab)` executes `setActiveTab(tab)` and `window.history.pushState(null, "", "?tab=" + tab)`.
   - `useEffect` listens to `searchParams` to sync state on external URL updates.
   - Observation: When an invalid tab query parameter (e.g. `?tab=invalid`) is supplied, `activeTab` receives the invalid string and matches none of the 4 tab conditions, rendering an empty tab pane without fallback.

### B. Tab 1: Operational Flowchart & Limitation Notice
1. **8 Operational Stages**:
   - File: `src/app/working/page.tsx:73-108`
   - Stages defined:
     1. `Assign & Resolve` (Badge ID resolution & calibration link)
     2. `Capture Baseline` (Pre-shift baseline photo under controlled illumination)
     3. `Passive Exposure` (Cumulative gas wear during hazardous shift)
     4. `End Shift Capture` (Post-shift capture under controlled illumination)
     5. `Quality Check` (Patch A, B, C sampling and integrity verification)
     6. `Calculate Color` (CIELAB conversion and CIE76 $\Delta E$ computation)
     7. `Apply Calibration` (Piecewise curve interpolation & uncertainty range)
     8. `Record & Alert` (Dossier persistence, ledger commit, OISD tier alerting)
   - Observation: Each stage has an individual `Limitation` warning card (`bg-status-warningBg text-status-warning`).
   - Presentation: Implemented as an unstructured 2-column grid (`grid grid-cols-1 md:grid-cols-2`) rather than a sequential timeline or step-flow diagram with phase groupings (Pre-shift, In-shift, Post-shift analysis, Ledger commit).

### C. Tab 2: Dosimeter Strip Architecture Diagrams & Substrates
1. **Cartridge Layout & Workflow Demonstrations**:
   - File: `src/app/working/page.tsx:111-136`
   - Currently contains placeholder boxes with raw text strings `[Concept Illustration: Patch Arrangement]` and `[Synthetic Demonstration: Software Workflow]`.
   - Includes a "Pending Validation" research prototype notice.
   - Observation: Detailed multi-layer substrate cross-section specifications (PTFE gas diffusion membrane, cellulose/PVDF reagent matrix, titanium dioxide $TiO_2$ reference white ring, $12\times 12\text{ mm}$ QR fiducial, hermetic barrier) and patch layout geometry (Patch A active, Patch B sealed reference, Patch C condition) are described in basic text without vector architectural SVGs or structured substrate specification tables.

### D. Tab 3: Chemistry, Colorimetry & Dose Calibration Curve
1. **Formulation & Equations**:
   - File: `src/app/working/page.tsx:138-177` vs `src/lib/colorimetry.ts:1-193`
   - Current text describes SbCl₃ + Anthocyanin composite and CIE76 distance formula:
     $$\Delta E = \sqrt{(L_2 - L_1)^2 + (a_2 - a_1)^2 + (b_2 - b_1)^2}$$
   - Observation:
     - Stoichiometric reaction equation ($2\text{SbCl}_3 + 3\text{H}_2\text{S} \to \text{Sb}_2\text{S}_3\downarrow + 6\text{HCl}$) is not displayed in formula block format.
     - CIELAB D65 conversion matrix ($sRGB \to \text{linear RGB} \to \text{XYZ} \to L^*a^*b^*$) implemented in `colorimetry.ts` is omitted from the page.
     - Piecewise linear calibration curve lookup table ($\Delta E \in [0.0, 38.0] \to [0.0, 35.0]\text{ ppm}\cdot\text{h}$) and saturation clamping boundary are omitted from the visual tab.

### E. Tab 4: Benchmark Comparison Matrix
1. **Comparative Modality Benchmark**:
   - File: `src/app/working/page.tsx:179-249`
   - Current table rows: `SbCl₃–Anthocyanin (Composite)`, `Anthocyanin-only (Control)`, `Lead Acetate`, `PbCl₂`.
   - Current columns: `Material / Approach`, `Proposed Role`, `Response Description`, `Evidence Available`, `Limitations`, `Status`.
   - Observation:
     - Missing **Tungsten Trioxide ($WO_3$) Thin Films** (chemiresistive semiconductor standard).
     - Missing **Electronic Electrochemical Sensors** (amperometric continuous personal gas monitors).
     - Missing explicit structured comparison dimensions for **Selectivity**, **Toxicity & Disposal**, **Calibration Drift / Shelf Life**, and **Cost per Unit**.

---

## 2. Logic Chain

1. **Routing & Query Param Invariant**:
   - User navigation to `/working?tab=chemistry` should reliably load the Chemistry tab directly.
   - When users switch tabs, the URL query param should reflect the new tab (`window.history.pushState` or `router.replace`) so URLs are shareable and bookmarkable.
   - If an unrecognized query parameter is received, the component must sanitize input and fallback to `flowchart` to prevent rendering an empty blank view.
   - For `/pipeline`, any query parameters received should be forwarded during the redirect to `/working`.

2. **Flowchart Operational Integrity**:
   - The 8 stages represent the full end-to-end lifecycle of an industrial dosimeter band per OISD-STD-105.
   - Grouping the 8 stages into 4 operational phases (1. Shift Allocation, 2. Field Exposure, 3. Multi-Patch Scanning & CIELAB Extraction, 4. Dose Ledger & Compliance Alerting) clarifies how the physical band connects to the software pipeline.

3. **Dosimeter Hardware & Substrate Transparency**:
   - The system uses three distinct optical zones (Patch A, Patch B, Patch C).
   - Patch A provides cumulative color shift; Patch B provides baseline optical drift cancellation; Patch C validates moisture and environmental integrity.
   - Vector SVG strip architecture diagrams and physical substrate spec cards provide clear technical documentation for industrial safety auditors and technical evaluators.

4. **Chemistry & Mathematical Rigor**:
   - The platform relies on three mathematical pillars:
     1. Heterogeneous reaction kinetics: Antimony trichloride reacting with gaseous hydrogen sulfide to precipitate yellow/orange stibnite ($Sb_2S_3$), stabilized in an anthocyanin chromophore matrix.
     2. D65 standard illuminant color space transformation: Non-linear sRGB gamma expansion $\to$ CIE XYZ tristimulus $\to$ CIELAB ($L^*a^*b^*$).
     3. Piecewise linear interpolation against calibration curves with explicit saturation threshold clamping at $\Delta E = 38.0$ ($35.0\text{ ppm}\cdot\text{h}$).

5. **Benchmark Comparison Completeness**:
   - Industrial safety managers need clear comparative evaluation against standard industry technologies:
     - SbCl₃–Anthocyanin (our passive colorimetric wristband: non-toxic, disposable, zero-power, low cost <$1).
     - Lead Acetate ($Pb(CH_3COO)_2$: legacy colorimetric paper, carcinogenic, environmental hazard).
     - $WO_3$ Thin Films (metal-oxide semiconductor: high temperature required, power-hungry, cross-sensitive).
     - Electronic Electrochemical Sensors (active continuous personal detectors: real-time audible alarms, high cost $150–$500+, sensor poisoning, calibration drift).

---

## 3. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | State & Routing | Route Alias Redirect | Server redirect from `/pipeline` to `/working` | HTTP GET `/pipeline` | HTTP 307 redirect to `/working` | Query params currently dropped if not preserved | `src/app/pipeline/page.tsx:1-6` |
| 2 | State & Routing | `?tab=` URL Synchronization | Active tab state bound to `tab` query param in URL | URL `?tab={tab_id}` | Updates `activeTab` state & renders matching tab | Unrecognized tab query param yields blank render | `src/app/working/page.tsx:8-25` |
| 3 | State & Routing | Next.js Suspense Boundary | Client hook `useSearchParams()` isolated in `<Suspense>` | Client hydration | Prevents full-page client de-opt during SSR | Fallback indicator during mount | `src/app/working/page.tsx:273-275` |
| 4 | Flowchart Tab | 8-Stage Operational Flow | 8 operational stages from badge issue to ledger commit | Sequential shift progress | Rendered cards with step numbers and descriptions | Stage limitation notices highlighted | `src/app/working/page.tsx:73-108` |
| 5 | Flowchart Tab | Stage Limitation Callouts | Dedicated operational limitation pill on each of the 8 stages | Stage metadata | Formatted yellow warning box | Clarifies operating boundaries (e.g. not an active alarm) | `src/app/working/page.tsx:100-103` |
| 6 | Images Tab | Cartridge Layout Visual | Multi-patch layout showing Patch A, Patch B, and Patch C | Image / SVG specification | Visual layout of reactive and sealed zones | Concept illustration placeholder | `src/app/working/page.tsx:114-121` |
| 7 | Images Tab | Software Scanning Workflow View | Simulated mobile app UI showing fiducial and patch sampling | Optical capture spec | Visual representation of alignment UI | Synthetic demo placeholder | `src/app/working/page.tsx:122-128` |
| 8 | Images Tab | Prototype Research Notice | Prominent notice regarding physical prototype status | Research metadata | Dashed border callout box | Clarifies physical prototype testing status | `src/app/working/page.tsx:130-134` |
| 9 | Chemistry Tab | SbCl₃–Anthocyanin Formulation | Description of non-toxic colorimetric reactive matrix | Chemical reagent spec | Explanatory text & patch role definitions | Research kinetic validation notice | `src/app/working/page.tsx:142-153` |
| 10 | Chemistry Tab | CIE76 Euclidean Formula | Mathematical definition of $\Delta E$ Euclidean distance | $L_1, a_1, b_1, L_2, a_2, b_2$ | Formatted formula block `ΔE = √[...]` | Validated against `src/lib/colorimetry.ts` | `src/app/working/page.tsx:156-167` |
| 11 | Chemistry Tab | CIELAB D65 Physics Engine | sRGB $\to$ Linear $\to$ XYZ $\to$ CIELAB transformation | RGB `[0..255]` | Lab coordinates $\{l, a, b\}$ | Normalizes inputs, clamps RGB values | `src/lib/colorimetry.ts:25-68` |
| 12 | Chemistry Tab | Dose Interpolation & Saturation | Piecewise linear mapping from $\Delta E$ to ppm·h dose | $\Delta E$ numeric | Dose range `[min, max]`, confidence, zone | Clamps at $\Delta E > 38.0$, assigns `LOW` confidence | `src/lib/colorimetry.ts:103-162` |
| 13 | Comparison Tab | Benchmark Matrix Table | Multi-material comparison table across industrial sensing approaches | Material benchmark data | Responsive scrollable table with status badges | Displays comparative trade-offs | `src/app/working/page.tsx:179-249` |
| 14 | Navigation & UI | Public Header & Footer | Responsive top navbar and footer with branding and links | Viewport size & route | Material Design 3 styled nav with badge pill | Clean links across `/`, `/working`, `/login` | `src/app/working/page.tsx:254-296` |

---

## 4. Edge Cases

| # | Feature | Input | Observed Behavior | Expected / Hardened Behavior |
|---|---------|-------|-------------------|------------------------------|
| 1 | Tab Query Param | `?tab=unknown_val` or `?tab=123` | `activeTab` set to `"unknown_val"`, renders blank area under tab nav | Validate against `['flowchart', 'images', 'chemistry', 'comparison']`; fallback to `'flowchart'` |
| 2 | Tab Query Param | `?tab=` (empty string) | `activeTab` set to `""`, renders blank area | Default to `'flowchart'` when param is empty |
| 3 | Server Redirect | GET `/pipeline?tab=chemistry` | Redirects to `/working` (query param `?tab=chemistry` dropped) | Forward `searchParams` in redirect: `/working?tab=chemistry` |
| 4 | Delta E Saturation | $\Delta E = 45.0$ (> 38.0 saturation limit) | Chemical saturation; dose clamped to $[20.0, 35.0]\text{ ppm}\cdot\text{h}$, `outOfRange: true`, `confidence: LOW` | Document chemical saturation threshold clearly in Tab 3 |
| 5 | Colorimetry Zero Shift | $\Delta E = 0.0$ (identical start & end) | Maps to $[0.0, 0.0]\text{ ppm}\cdot\text{h}$, `confidence: HIGH`, `zone: NORMAL` | Display baseline zero point on calibration curve |
| 6 | Reference Drift Correction | $\Delta E(\text{Patch B}) > 4.0$ (excessive reference drift) | Indicates badge storage compromise or extreme UV degradation; invalidates reading | Explain Patch B optical drift subtraction in Tab 2 and Tab 3 |
| 7 | Mobile Table Overflow | Viewport width < 640px on Comparison Tab | Table width is `min-w-[900px]`, horizontal scrollbar enables complete readability | Wrap with clear scroll cue or sticky left column |
| 8 | Accessibility (a11y) | Tab buttons keyboard navigation | Buttons have standard button roles, missing ARIA `role="tab"` and `role="tabpanel"` | Add standard WAI-ARIA tab attributes (`aria-selected`, `aria-controls`, `tabIndex`) |

---

## 5. Polish & Enhancement Recommendations for Implementation

1. **Tab 1 (Flowchart)**:
   - Introduce phase headers dividing the 8 stages into 4 logical phases:
     - **Phase 1: Shift Check-in & Baseline** (Stage 1: Assign & Resolve, Stage 2: Capture Baseline)
     - **Phase 2: Operational Shift Wear** (Stage 3: Passive Exposure)
     - **Phase 3: Shift Check-out & Colorimetric Analysis** (Stage 4: End Shift Capture, Stage 5: Quality Check, Stage 6: Calculate Color)
     - **Phase 4: Ledger Commit & HSE Compliance** (Stage 7: Apply Calibration, Stage 8: Record & Alert)
   - Add visual chevron/arrow connectors between sequential stages.
   - Include an overarching banner at the top: *OISD-STD-105 & DGMS Industrial Compliance Notice: Rakshak passive dosimeters assess cumulative shift exposure (TWA ppm·h) and complement active continuous gas detectors.*

2. **Tab 2 (Images)**:
   - Replace raw text placeholder strings with rich interactive SVG vector diagrams:
     - **Vector Diagram 1: Multi-Layer Dosimeter Architecture** (Layer stack: 1. Protective Anti-UV Window, 2. Microporous PTFE Gas-Diffusion Membrane, 3. Reagent Matrix on Porous Cellulose/PVDF Substrate, 4. Reflective White Substrate Backing, 5. Medical-Grade Skin-Safe Adhesive Carrier, 6. $12\times 12\text{ mm}$ Laser-Etched 2D DataMatrix / QR Fiducial).
     - **Vector Diagram 2: Optical Substrate Geometry & Patch Arrangement** (Patch A Active Sensing Well $\varnothing 6\text{mm}$, Patch B Sealed Reference Well $\varnothing 6\text{mm}$, Patch C Hydrochromic Integrity Indicator $\varnothing 4\text{mm}$, $TiO_2$ Reference White Ring $L^* \approx 96.5$).
   - Add a structured technical specifications card detailing dimensions ($42\times 22\times 2.8\text{ mm}$), operating temperature ($-10^\circ\text{C}$ to $+55^\circ\text{C}$), operating humidity ($10\%\text{--}95\%\text{ RH}$ non-condensing), and 5-day lifecycle limit.

3. **Tab 3 (Chemistry)**:
   - Render the complete chemical reaction equation block:
     $$2\text{SbCl}_3\text{ (solid matrix)} + 3\text{H}_2\text{S}\text{ (gas)} \xrightarrow{\text{Anthocyanin buffer}} \text{Sb}_2\text{S}_3\downarrow\text{ (yellow-orange stibnite)} + 6\text{HCl}\text{ (g)}$$
   - Display the CIELAB D65 mathematical matrix conversion pipeline step-by-step ($sRGB \to \text{linear RGB} \to \text{XYZ (D65)} \to L^*a^*b^*$).
   - Display the complete Piecewise Linear Calibration Curve lookup table matching `DEFAULT_CALIBRATION_POINTS` in `src/lib/colorimetry.ts`:
     - $\Delta E = 0.0 \to [0.0, 0.0]\text{ ppm}\cdot\text{h}$
     - $\Delta E = 3.5 \to [0.5, 1.2]\text{ ppm}\cdot\text{h}$
     - $\Delta E = 8.2 \to [2.0, 3.8]\text{ ppm}\cdot\text{h}$
     - $\Delta E = 15.0 \to [5.0, 8.5]\text{ ppm}\cdot\text{h}$
     - $\Delta E = 25.0 \to [10.0, 18.0]\text{ ppm}\cdot\text{h}$
     - $\Delta E = 38.0 \to [20.0, 35.0]\text{ ppm}\cdot\text{h}$ (Saturation threshold)

4. **Tab 4 (Comparison)**:
   - Expand the benchmark matrix to comprehensively compare all 4 key sensing modalities:
     1. **SbCl₃–Anthocyanin Composite (Rakshak Dosimeter)**
     2. **Lead Acetate Test Paper ($Pb(CH_3COO)_2$)**
     3. **Tungsten Trioxide ($WO_3$) Thin Films (Chemiresistive MOS)**
     4. **Electronic Electrochemical Sensors (Alphasense / CityTech 3-Electrode Cells)**
   - Structure dedicated comparison columns:
     - `Technology Modality`
     - `Selectivity & Interference` ($H_2S$ vs $SO_2, NO_x, CO, VOCs$)
     - `Toxicity & RoHS Compliance` (Lead-free, non-hazardous disposal vs toxic heavy metals)
     - `Calibration Drift & Shelf Life` (Hermetic seal + Patch B optical correction vs sensor poisoning)
     - `Power & Infrastructure` (Passive zero-power vs active battery/charging dock)
     - `Cost per Unit` (<$1 / test vs $150–$500+ / unit)
     - `Primary Industrial Role` (Longitudinal shift dosimetry vs real-time audible escape alarm)

5. **State & Routing**:
   - Sanitize tab input with fallback: `const activeTab = validTabs.includes(rawTab) ? rawTab : "flowchart"`.
   - Update `src/app/pipeline/page.tsx` to preserve incoming search params during redirect.
   - Enhance accessibility with WAI-ARIA `role="tab"`, `role="tablist"`, `aria-selected`, and `role="tabpanel"`.

---

## 6. Caveats

1. **Physical Prototype Calibration Data**: The calibration lookup curve points in `colorimetry.ts` represent empirical research reference values; quantitative clinical/in-chamber batch calibration curves are generated per manufacturing lot.
2. **Read-Only Scope**: This report records specification discovery findings, interface boundaries, and exact technical formulas for execution by the M2 polish builder.

---

## 7. Conclusion

The Science Pipeline page (`src/app/working/page.tsx` and `src/app/pipeline/page.tsx`) already possesses the fundamental architectural foundation (4 tabs, `?tab=` query sync, 8-stage flowchart, CIE76 equation, and comparison table). By implementing the full stoichiometric reaction equations, CIELAB D65 conversion pipeline, calibration curve lookup table, vector dosimeter architecture diagrams, substrate specifications, and 4-modality benchmark matrix, the page will fully satisfy all R2 requirements with industrial-grade technical rigor.

---

## 8. Verification Method

1. **Verify Server Redirect**:
   - Navigate to `/pipeline` $\to$ verify 307 redirect to `/working`.
   - Navigate to `/pipeline?tab=chemistry` $\to$ verify redirect to `/working?tab=chemistry`.
2. **Verify Tab State Synchronization**:
   - Navigate to `/working?tab=flowchart` $\to$ Flowchart tab active.
   - Navigate to `/working?tab=images` $\to$ Images tab active.
   - Navigate to `/working?tab=chemistry` $\to$ Chemistry tab active.
   - Navigate to `/working?tab=comparison` $\to$ Comparison tab active.
   - Test invalid param: `/working?tab=invalid` $\to$ gracefully falls back to `flowchart`.
3. **Verify Colorimetry Science Engine**:
   - Run `npm test -- src/__tests__/colorimetry.test.ts` $\to$ verify 100% pass on CIELAB D65 conversions, CIE76 Euclidean distance, and piecewise dose interpolation.
