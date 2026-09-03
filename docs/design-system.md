# Design System (Material Design 3 / Google-Style)

## Core Philosophy
The interface will eschew heavily themed "AI-generated" or dark/neon aesthetics in favor of a clean, professional, enterprise-grade look similar to Google Workspace or Google Cloud Console.

- **Content-First:** Generous whitespace, clear visual hierarchy.
- **Calm & Professional:** Minimal use of borders, soft shadow elevation, and distinct primary actions.

## 1. Color Palette
- **Primary:** Google Blue (`#1a73e8`) – used for primary buttons, active links, and key indicators.
- **Surface / Background:**
  - Page Background: `#f8f9fa` (Light Gray)
  - Card/Surface Background: `#ffffff` (Pure White)
- **Text:**
  - High Emphasis: `#202124` (Charcoal)
  - Medium Emphasis (Muted): `#5f6368` (Gray)
- **Semantic/Status:**
  - Success / Safe (Tier 1): `#1e8e3e` (Green)
  - Warning / Caution (Tier 2): `#f9ab00` (Amber/Yellow)
  - Error / Critical (Tier 3): `#d93025` (Red)

## 2. Typography
- **Typeface:** `Inter` (or system UI fonts `Roboto, sans-serif`).
- **Scale:**
  - H1 / Display: 24px, Medium, `#202124`
  - H2 / Title: 20px, Medium, `#202124`
  - Body: 14px, Regular, `#202124` or `#5f6368`
  - Small / Helper: 12px, Regular, `#5f6368`

## 3. Components
### Cards
- **Style:** Pure white (`bg-white`), subtle shadow (`shadow-sm` or Material elevation 1), rounded corners (`rounded-lg` or `rounded-xl`), no harsh borders.

### Buttons
- **Primary:** Solid blue (`bg-[#1a73e8]`), white text, slightly rounded (`rounded-md`), subtle hover effect (darken).
- **Secondary/Outlined:** Transparent background, gray border (`border-[#dadce0]`), blue text on hover.
- **Ghost/Text:** No background, gray text turning blue on hover.

### Inputs & Forms
- **Style:** Outlined fields with light gray borders (`border-[#dadce0]`), 14px text.
- **Focus State:** Border changes to primary blue (`border-[#1a73e8]`) with a soft blue ring.

### Navigation
- **Top Bar:** White background, thin bottom border, simple app logo, right-aligned user avatar.
- **Side Nav (Dashboard):** Flat list of items. Active item has a light blue background (`bg-[#e8f0fe]`) and blue text (`text-[#1a73e8]`).

## 4. Layout & Spacing
- **Container:** Max-width constrained (e.g., `max-w-7xl` for dashboards, `max-w-md` for auth).
- **Grid/Flex:** Consistent `gap-4` or `gap-6`. Padding `p-4` or `p-6` inside cards.

## 5. Icons
- **Library:** Google Material Symbols (Rounded) or Lucide React (configured with thin strokes). No generic illustrations; icons should be purely functional.
