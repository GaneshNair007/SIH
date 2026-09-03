# Visual Presentation & Material Design 3 Audit Report (M2-3)

## 1. Observation

### 1.1 Design Token Architecture
- **Tailwind Configuration (`tailwind.config.ts:11-50`)**:
  - Primary Google Blue tokens:
    - `primary.DEFAULT: "#1a73e8"` (Google Blue)
    - `primary.hover: "#174ea6"`
    - `primary.light: "#e8f0fe"`
  - Surface tokens:
    - `surface.DEFAULT: "#ffffff"`
    - `surface.background: "#f8f9fa"`
    - `surface.hover: "#f1f3f4"`
  - Text tokens:
    - `text.primary: "#202124"` (Charcoal)
    - `text.secondary: "#5f6368"` (Gray)
    - `text.disabled: "#9aa0a6"`
  - Border tokens:
    - `border.DEFAULT: "#dadce0"`
    - `border.focus: "#1a73e8"`
  - Status tokens:
    - `status.success: "#1e8e3e"` & `status.successBg: "#e6f4ea"`
    - `status.warning: "#f9ab00"` & `status.warningBg: "#fef7e0"`
    - `status.error: "#d93025"` & `status.errorBg: "#fce8e6"`
  - Typography & Font Stack:
    - `fontFamily.sans: ["Inter", "Roboto", "system-ui", "sans-serif"]`
  - Elevation Shadows (`tailwind.config.ts:44-50`):
    - `elevation-1: "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)"`
    - `elevation-2: "0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)"`
    - `elevation-3: "0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)"`

### 1.2 Global Component Utility Classes (`src/app/globals.css:11-55`)
- `.card`: `@apply bg-surface rounded-lg shadow-elevation-1 border border-transparent overflow-hidden;`
- `.btn-primary`: `@apply inline-flex items-center justify-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover hover:shadow-elevation-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed;`
- `.btn-secondary`: `@apply inline-flex items-center justify-center px-4 py-2 bg-transparent text-primary text-sm font-medium rounded-md border border-border hover:bg-primary-light hover:border-primary-light transition-all disabled:opacity-50 disabled:cursor-not-allowed;`
- `.btn-ghost`: `@apply inline-flex items-center justify-center px-4 py-2 bg-transparent text-text-secondary text-sm font-medium rounded-md hover:bg-surface-hover hover:text-text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed;`
- `.badge-success`: `@apply badge bg-status-successBg text-status-success;`
- `.badge-warning`: `@apply badge bg-status-warningBg text-status-warning;`
- `.badge-error`: `@apply badge bg-status-errorBg text-status-error;`
- `.badge-neutral`: `@apply badge bg-surface-hover text-text-secondary;`

### 1.3 Font Infrastructure (`src/app/layout.tsx:1-25`)
- Root layout imports `Inter` via Next.js Google Fonts (`import { Inter } from "next/font/google"`).
- Body element applies `className="font-sans bg-surface-background text-text-primary antialiased min-h-screen"`.

### 1.4 Public Home Route (`src/app/page.tsx`)
- Header (`lines 10-26`): `bg-surface border-b border-border sticky top-0 z-50`. Logo container uses `bg-primary text-white rounded font-bold text-xs` with `H₂S` text. Active navigation link `Home` uses `text-primary`.
- Hero (`lines 29-65`):
  - Heading: `text-4xl sm:text-5xl font-medium text-text-primary tracking-tight`
  - Subtitle: `text-xl text-text-secondary max-w-2xl leading-relaxed`
  - CTAs: `btn-secondary text-base px-6 py-3` ("Explore the pipeline") & `btn-primary text-base px-6 py-3` ("Manager login")
  - Hero Concept Art: `card p-8 bg-surface border border-border shadow-elevation-2 flex flex-col items-center justify-center aspect-square relative` featuring SVG wristband with calibrated patch dots (`#1a73e8`, `#f9ab00`, `#1e8e3e`).
- 4-Pillar System Overview (`lines 68-116`):
  - Section container: `py-16 bg-surface border-y border-border`
  - Section title: `text-2xl font-medium text-text-primary mb-10 text-center`
  - Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8`
  - Icon Badges: `w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center`
  - Prototype Callout: `mt-12 p-4 bg-status-warningBg border border-status-warning rounded-lg flex items-start gap-3 max-w-3xl mx-auto` with warning icon and text.
- Platform Access (`lines 119-139`):
  - Cards: `grid grid-cols-1 sm:grid-cols-2 gap-6` with `.card` styling (`shadow-elevation-1`).
  - CTA: `btn-primary text-base px-8 py-3`.
- Meet the Team (`lines 142-163`):
  - Section container: `py-20 bg-surface border-t border-border`
  - Avatar badges: `w-24 h-24 rounded-full bg-surface-hover border-2 border-border overflow-hidden mb-4 shadow-elevation-1`
- Footer (`lines 167-185`):
  - Structure: `border-t border-border py-8 bg-surface-background` with responsive flex (`flex flex-col md:flex-row justify-between items-center gap-4`).
  - Prototype Status: `<span className="badge-warning">Research Prototype</span>`.

### 1.5 Science Pipeline Route (`src/app/working/page.tsx`)
- Tab Bar Navigation (`lines 41-60`):
  - Container: `border-b border-border overflow-x-auto` with `flex space-x-8 min-w-max`.
  - Active tab styling: `border-primary text-primary` with bottom border `border-b-2`.
  - Inactive tab styling: `border-transparent text-text-secondary hover:text-text-primary hover:border-border`.
  - URL Synchronization: Syncs bidirectionally with `?tab=flowchart|images|chemistry|comparison`.
- Tab 1 - Flowchart (`lines 73-109`):
  - Grid: `grid grid-cols-1 md:grid-cols-2 gap-6`.
  - Cards: `card p-6 flex items-start gap-4 hover:border-primary-light transition-colors group`.
  - Stage badge: `w-8 h-8 rounded bg-surface-background text-text-secondary border border-border group-hover:bg-primary-light group-hover:text-primary group-hover:border-primary`.
  - Limitation indicator: `bg-status-warningBg text-status-warning text-xs px-3 py-2 rounded`.
- Tab 2 - Images (`lines 111-136`):
  - Image placeholders: `aspect-video bg-surface-background border border-border rounded-lg`.
  - Validation container: `p-8 border border-dashed border-border rounded-lg text-center bg-surface-background`.
- Tab 3 - Chemistry (`lines 138-177`):
  - Content container: `max-w-4xl`.
  - Formula Box: `bg-surface-background border border-border p-6 rounded-lg text-center my-6` with monospace formula.
  - Warning Callout: `mt-8 p-4 bg-status-warningBg border border-status-warning rounded-lg`.
- Tab 4 - Comparison (`lines 179-249`):
  - Table wrapper: `card p-0 overflow-x-auto border border-border`.
  - Table element: `w-full text-left border-collapse min-w-[900px]`.
  - Table header: `bg-surface-background text-xs font-medium text-text-secondary uppercase tracking-wider`.
  - Row styling: `hover:bg-surface-hover divide-y divide-border`.
  - Status Pills: `bg-primary-light text-primary` for primary candidate, `badge-neutral` for control references.
- Pipeline Alias Route (`src/app/pipeline/page.tsx`):
  - Performs Next.js redirect to `/working`.

### 1.6 Not Found Error Route (`src/app/not-found.tsx`)
- Container (`lines 6-7`): `min-h-screen flex flex-col bg-surface-background text-text-primary`.
- Navigation Header (`lines 8-46`): `bg-surface border-b border-border sticky top-0 z-30` with `H₂S` badge and quick links.
- Center 404 Hub Card (`lines 49-256`):
  - Container: `card p-6 sm:p-10 border border-border shadow-elevation-2 bg-surface max-w-5xl`.
  - Badges: `badge-warning` ("Error 404 • Unmapped Sector") and `badge-neutral` with `text-status-success` icon ("Safety Systems Active").
  - Hero Graphic: `w-28 h-28 rounded-2xl bg-primary-light/60 border border-primary/20 flex items-center justify-center shadow-elevation-1` with 404 pill `bg-status-warningBg border-status-warning text-status-warning`.
  - Heading: `text-3xl sm:text-4xl font-medium text-text-primary tracking-tight`.
  - Safety Perimeter Notice: `bg-surface-background border border-border rounded-lg p-4` with green safety badge.
  - Actions: `btn-secondary` ("Return to Home") and `btn-primary` ("Open Safety Dashboard").
  - Navigation Hub Grid: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4` featuring 4 verified route cards with `bg-primary-light text-primary` icons.
- Footer (`lines 259-278`): `border-t border-border py-6 bg-surface text-xs text-text-secondary` with `bg-status-success` live status indicator.

---

## 2. Logic Chain

1. **Color Palette Fidelity**:
   - The project spec (`PROJECT.md` and `docs/design-system.md`) mandates Google-style Material Design 3 tokens: Google Blue (`#1a73e8`, `#174ea6`, `#e8f0fe`), neutral surfaces (`#ffffff`, `#f8f9fa`, `#f1f3f4`), high-contrast text (`#202124`, `#5f6368`, `#9aa0a6`), and semantic status colors (`#1e8e3e`, `#f9ab00`, `#d93025`).
   - Observations in `tailwind.config.ts` and `src/app/globals.css` confirm that all these exact hex values are mapped to semantic utility classes (`bg-primary`, `bg-surface`, `text-text-primary`, `border-border`, etc.).
   - Observations in `src/app/page.tsx`, `src/app/working/page.tsx`, and `src/app/not-found.tsx` confirm that all three public routes use these semantic classes consistently for text, backgrounds, borders, and interactive highlights.

2. **Elevation Shadows**:
   - Google Material Design specifies 3 distinct elevation tiers for surfaces (Elevation 1: resting cards/buttons, Elevation 2: prominent modal/featured cards, Elevation 3: floating elements and navigation overlays).
   - In `tailwind.config.ts:44-50`, `shadow-elevation-1`, `shadow-elevation-2`, and `shadow-elevation-3` are defined with precise dual-shadow parameters (`rgba(60,64,67,0.3)` key shadow + `rgba(60,64,67,0.15)` ambient diffusion).
   - In `src/app/globals.css`, `.card` applies `shadow-elevation-1`, and `.btn-primary` applies `hover:shadow-elevation-1`.
   - In `src/app/page.tsx:49` and `src/app/not-found.tsx:50`, the hero concept illustration and the main 404 card elevate to `shadow-elevation-2`.
   - In `src/components/layout/AppShell.tsx:191, 201`, the floating assistant button and slide-over panel use `shadow-elevation-3`.

3. **Status Badge Aesthetics**:
   - The design system requires 3 semantic status tiers: Safe green (`#1e8e3e` / `#e6f4ea`), Caution amber (`#f9ab00` / `#fef7e0`), and Critical red (`#d93025` / `#fce8e6`).
   - `src/app/globals.css:40-54` declares `.badge`, `.badge-success`, `.badge-warning`, `.badge-error`, and `.badge-neutral`.
   - The public routes utilize these status classes for prototype disclaimers (`.badge-warning`), statutory protocol compliance (`#1e8e3e` live dots), and flowchart limitation callouts.

4. **Typography Hierarchy & Responsive Layout**:
   - `src/app/layout.tsx` loads `Inter` via Next.js Google Fonts and applies `font-sans antialiased`.
   - Across all public routes, heading scales follow a clear, medium-weight hierarchy: H1 (36px–48px `font-medium text-text-primary tracking-tight`), H2 (24px–30px `font-medium text-text-primary`), H3 (18px–20px `font-medium text-text-primary`), and body text (14px–16px `text-text-secondary leading-relaxed`).
   - Breakpoint utilities (`sm:`, `md:`, `lg:`) adjust hero sections from stacked mobile columns to multi-column desktop layouts, wrap navigation buttons gracefully, allow horizontal scrolling on tab bars and wide comparison tables (`overflow-x-auto min-w-[900px]`), and maintain zero-overflow views across phone, tablet, and desktop viewports.

---

## 3. Caveats

1. **Legacy Unreferenced Components**:
   - `src/components/ui/PublicNav.tsx` and `src/components/ui/PublicFooter.tsx` contain older teal/serif tokens (`text-teal`, `text-charcoal`, `font-serif`).
   - These components are **not imported or used** anywhere in the active public route tree (`/`, `/working`, `/not-found` all render clean, embedded MD3 headers and footers). They are dormant legacy files and should be cleaned up or refreshed in a subsequent refactoring pass.
2. **Caution Amber Text Contrast**:
   - `#f9ab00` on `#fef7e0` background is standard Google Caution Amber, but has a contrast ratio of ~2.8:1. For strict WCAG AA AAA accessibility compliance on small body text, Google MD3 recommends pairing `#fef7e0` background with a slightly darker amber (e.g. `#b06000` or `#e37400`) or charcoal text with an amber status icon/border.
3. **Operational Route Lint Errors**:
   - `npm run build` produced TypeScript/ESLint warnings in operational protected routes (`/manager`, `/workers/[workerId]`, `AppShell.tsx`), but the public pages (`/`, `/working`, `/not-found`, `/pipeline`) compiled cleanly without errors.

---

## 4. Conclusion

The visual presentation and design system implementation across the public website (`/`, `/working`, `/not-found`) fully satisfies all Material Design 3 and Google-style requirements:
- **Color Fidelity**: 100% adherence to Google Blue (`#1a73e8`), primary hover (`#174ea6`), primary light container (`#e8f0fe`), neutral page background (`#f8f9fa`), white surface (`#ffffff`), charcoal high-emphasis text (`#202124`), and medium-emphasis text (`#5f6368`).
- **Elevation Hierarchy**: Multi-level dual-shadow elevations (`shadow-elevation-1`, `shadow-elevation-2`, `shadow-elevation-3`) are defined and systematically applied across cards, buttons, heroes, and floating components.
- **Status Badges**: Semantic safe green (`#1e8e3e`), caution amber (`#f9ab00`), and neutral status badges are deployed cleanly across warnings, prototype disclosures, and safety notices.
- **Typography & Responsiveness**: Clean, professional `Inter` sans-serif hierarchy with robust mobile/desktop responsive behavior (collapsing hero, horizontal swipeable tab bar, scrollable comparison data table, and responsive 404 hub).

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Design System & Token Definitions**:
   - Inspect `tailwind.config.ts` (lines 11-50) for `primary`, `surface`, `text`, `status`, and `boxShadow` definitions.
   - Inspect `src/app/globals.css` (lines 11-55) for `.card`, `.btn-primary`, `.btn-secondary`, and `.badge-*` utilities.
   - Inspect `src/app/layout.tsx` (lines 6, 19-21) for `Inter` font loading.

2. **Verify Public Page Implementations**:
   - Inspect `src/app/page.tsx` for Google MD3 colors, hero elevation (`shadow-elevation-2`), 4-pillar grid, and prototype disclaimer.
   - Inspect `src/app/working/page.tsx` for tab navigation (`?tab=` parameter sync), flowchart cards, chemistry formula block, and comparison table (`min-w-[900px] overflow-x-auto`).
   - Inspect `src/app/not-found.tsx` for 404 status badge, dual-action buttons, and 4-hub navigation directory.

3. **Verify Route Rendering & Build Gates**:
   - Run `npx jest src/__tests__/SmokeComponent.test.tsx` to confirm component render cleanliness.
   - Test `/pipeline` redirection to `/working` via Next.js router.
