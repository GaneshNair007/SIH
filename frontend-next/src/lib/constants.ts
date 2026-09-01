export const PROJECT_NAME = "STRELA";
export const ENGINE_NAME = "Strela Dosimetry Engine";

export const COLORS = {
  yellow: "#FFE17C",
  yellowHover: "#F5D466",
  teal: "#0B6558",
  tealHover: "#084C42",
  charcoal: "#171C1B",
  darkGray: "#272727",
  sage: "#B7C6C2",
  mutedText: "#5E6964",
  warmWhite: "#F7F8F5",
  white: "#FFFFFF",
  lightCard: "#F8F9FA",
};

export const REFINERY_UNITS = [
  "CDU-1",
  "CDU-2",
  "DHDS",
  "SRU",
  "Tank Farm",
  "Flare Header",
];

export const STATUTORY_THRESHOLDS = {
  TIER1_TWA_MAX: 1.0,      // ppm
  TIER1_7DAY_MAX: 15.0,    // ppm·hr
  TIER2_TWA_MAX: 5.0,      // ppm
  TIER2_7DAY_MAX: 35.0,    // ppm·hr
  SINGLE_SHIFT_MAX: 20.0,  // ppm·hr
};

export const STATIC_GUIDED_HELP: Record<string, { title: string; answer: string; reference?: string }> = {
  summary: {
    title: "Summarize this worker's recorded history",
    answer: "Worker profiles track cumulative 7-day, 30-day, and 90-day exposure ledgers. Doses are calculated using differential optical shift dosimetry (ΔE_end - ΔE_start - Patch B drift) with dynamic uncertainty envelopes. Check the 90-day trajectory chart to observe long-term trends.",
    reference: "OISD-STD-105 Clause 6.4",
  },
  replacement: {
    title: "Which bands need replacement?",
    answer: "Each passive wristband has a strict 5-day operational lifecycle (Days 1–5). Bands must be retired immediately if: 1) Lifecycle reaches Day 5, 2) Patch B baseline drift exceeds 0.70 ΔE, or 3) Patch C indicates chemical interference or moisture compromise.",
    reference: "MRPL SOP / H₂S Wristband Quality Standard",
  },
  invalid: {
    title: "Why was this reading invalid or wide in uncertainty?",
    answer: "Readings receive wider uncertainty margins (±15% to ±25%) or INVALID flags when: 1) Control Patch B shows unexpected optical drift (>0.35 ΔE), 2) Patch C shows severe discoloration (COMPROMISED), or 3) Image quality fails brightness, sharpness, or glare checks.",
    reference: "ACGIH Dosimetry Guidelines 2024",
  },
  procedure: {
    title: "Show the approved procedure associated with this alert",
    answer: "Tier 1: Wash face with clean water, hydrate, and log normal completion. Tier 2: Inspect respirator cartridge seal, perform positive-pressure check, report unit sniffer check. Tier 3: Mandatory Occupational Health Centre (OHC) clinical referral, SpO2 & Spirometry check, 48-hour sour unit stand-down, and automatic OISD Form-A filing.",
    reference: "OISD-STD-155 / DGMS PME Protocol",
  },
};
