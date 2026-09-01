/**
 * Central content configuration.
 * Edit this file to update public-facing copy, team info, and project metadata.
 * All public pages pull from here — no content is scattered across JSX.
 */

export const PROJECT = {
  name: "H₂S Dose Wristband",
  tagline: "Passive Colorimetric Exposure Monitoring",
  heroLines: [
    "A passive wristband that records a colour response to H₂S exposure.",
    "Read the band with a smartphone and connect each reading to a worker's history.",
  ],
  limitation:
    "Research prototype for cumulative exposure assessment. Not a continuous gas alarm.",
  status: "Research Prototype",
  year: 2026,
} as const;

export interface TeamMember {
  name: string;
  role: string;
  photo: string; // path relative to /public
  bio?: string;
}

export const TEAM: TeamMember[] = [
  {
    name: "Ganesh Nair",
    role: "Frontend & Spatial Architect",
    photo: "/ganesh_real.jpg",
  },
  {
    name: "Arjit Ujjawal",
    role: "Backend & Domain Architect",
    photo: "/arjit.jpg",
  },
  {
    name: "Sumedh",
    role: "Chemical & Sensing Engineer",
    photo: "/sumedh.png",
  },
];

export const ROLES_DESCRIPTION = {
  shiftManager: {
    title: "Shift Manager",
    short: "Scan wristbands, record shift readings, manage workers and bands on the factory floor.",
  },
  controlRoom: {
    title: "Control Room Manager",
    short: "Monitor exposure across all workers, review analytics, manage alerts and generate reports.",
  },
  admin: {
    title: "Administrator",
    short: "Configure calibration, thresholds, locations, users, and audit system activity.",
  },
} as const;

export const CHEMISTRY = {
  formulation: "proposed SbCl₃–anthocyanin composite on filter paper",
  patchA: {
    name: "Patch A — Dose Strip",
    description:
      "Proposed SbCl₃/anthocyanin composite exposed to ambient air. Published bench work reports a visible response to H₂S; our wearable dose response still requires validation.",
  },
  patchB: {
    name: "Patch B — Sealed Reference",
    description:
      "Same batch formulation, hermetically sealed. Provides a badge-specific zero-exposure baseline and serves as a tamper/seal-integrity check.",
  },
  patchC: {
    name: "Patch C — Condition Indicator",
    description:
      "Proposed cobalt-free condition indicator. It flags storage or wear conditions that may invalidate a reading; it cannot diagnose the exact cause or time of a seal failure.",
  },
  deltaEEquation: "ΔE = √[(L* − L₀*)² + (a* − a₀*)² + (b* − b₀*)²]",
  deltaEExplanation:
    "CIE76 colour difference between Patch A and a validated baseline/reference. Larger ΔE means a larger colour difference, but it becomes an exposure estimate only when an eligible calibration is available. No human-perception threshold is treated as an instrument detection limit.",
  reference: {
    authors: "Zhang, H. et al.",
    title: "A Visual Color Response Test Paper for the Detection of Hydrogen Sulfide Gas in the Air.",
    journal: "Molecules 2023, 28(13), 5044",
    doi: "https://doi.org/10.3390/molecules28135044",
  },
} as const;

export const COMPARISON_TABLE = [
  {
    material: "SbCl₃–anthocyanin composite",
    role: "Proposed reactive formulation",
    response: "Published test-paper experiments report a visible, graded response under controlled exposure conditions.",
    evidence: "Zhang et al. 2023; evidence applies to the published laboratory test paper, not yet to this wristband.",
    limitations: "Antimony is corrosive — must be physically isolated from skin. Humidity robustness untested. Batch-to-batch variation expected with natural pigments.",
    status: "Proposed — wearable validation pending",
  },
  {
    material: "Anthocyanin only (control)",
    role: "Comparison baseline",
    response: "Control used to separate the pigment response from the proposed composite response.",
    evidence: "Zhang et al. 2023",
    limitations: "Published control behavior does not establish performance in the proposed wearable cartridge.",
    status: "Control comparison",
  },
  {
    material: "Lead acetate",
    role: "Literature comparison",
    response: "Requested comparison topic; lead sulfide darkening is used in established qualitative H₂S methods.",
    evidence: "Comparison literature only; no project validation.",
    limitations: "Lead toxicity makes it unsuitable for the proposed wearable. It is not treated as equivalent to the project formulation.",
    status: "Comparison reference only",
  },
  {
    material: "PbCl₂",
    role: "Mentioned in sketch — role requires confirmation",
    response: "Mentioned in the sketch; its intended role has not been established.",
    evidence: "No supplied evidence resolves its role in this project.",
    limitations: "Lead toxicity. Relationship to our project's formulation requires clarification.",
    status: "Requires confirmation",
  },
] as const;

export const FLOWCHART_STAGES = [
  {
    id: "assign",
    number: 1,
    title: "Assign band to worker",
    summary: "Link a physical wristband to a worker via QR code",
    input: "Unregistered band + worker identity",
    process: "Scan QR → resolve batch/calibration identity → permanent assignment",
    output: "REGISTERED band linked to worker",
    limitation: "Assignment is permanent — a band cannot be reassigned to a different worker",
  },
  {
    id: "start",
    number: 2,
    title: "Capture start-of-shift state",
    summary: "Photograph the badge before the shift begins",
    input: "Registered/active band under controlled illumination",
    process: "Photograph → sample Patch A, B, C → record baseline state",
    output: "Start reading with RGB/Lab values and patch conditions",
    limitation: "Requires controlled illumination for consistent colour measurement",
  },
  {
    id: "wear",
    number: 3,
    title: "Passive exposure during wear",
    summary: "The reactive patch responds to ambient H₂S during the shift",
    input: "Badge worn in work environment",
    process: "The proposed reactive patch accumulates a colour response during wear; reciprocity and permanence in the cartridge remain validation questions",
    output: "Accumulated colour shift on Patch A",
    limitation: "Passive integrating response — not a continuous real-time measurement. Temperature affects reaction rate.",
  },
  {
    id: "end",
    number: 4,
    title: "Capture end-of-shift state",
    summary: "Photograph the badge after the shift under controlled illumination",
    input: "Badge after shift exposure",
    process: "Photograph → sample Patch A, B, C → record end state",
    output: "End reading with RGB/Lab values",
    limitation: "Same illumination conditions as start reading are needed for meaningful comparison",
  },
  {
    id: "sample",
    number: 5,
    title: "Sample and validate patches",
    summary: "Extract colour values from A, B, C regions and check quality",
    input: "Captured photograph",
    process: "Locate patch regions → average pixel samples → check image quality, blur, brightness → verify Patch B integrity → check Patch C condition",
    output: "Validated patch RGB/Lab values or quality rejection",
    limitation: "Image quality below threshold results in rejected reading, not a forced estimate",
  },
  {
    id: "calculate",
    number: 6,
    title: "Calculate ΔE colour difference",
    summary: "Convert to CIE L*a*b* and compute Euclidean distance",
    input: "Patch A Lab values + Patch B baseline Lab values",
    process: "ΔE = √[(L*−L₀*)² + (a*−a₀*)² + (b*−b₀*)²] (CIE76). Preserve the value even when calibration is unavailable",
    output: "Numeric ΔE value with confidence assessment",
    limitation: "ΔE is raw colour difference — not yet a calibrated dose. Sub-perceptibility threshold is provisional.",
  },
  {
    id: "calibrate",
    number: 7,
    title: "Apply calibration (if available)",
    summary: "Map ΔE to exposure dose range using batch-specific calibration",
    input: "ΔE + eligible calibration curve for the band's manufacturing batch",
    process: "Piecewise interpolation against calibration points → dose range (low–high ppm·h) with confidence and uncertainty",
    output: "Estimated dose range or 'Dose calibration unavailable' if no eligible calibration exists",
    limitation: "Production dose requires validated calibration. Without it, only raw ΔE or exposure index is shown. Reciprocity (C×t = k) is being tested, not proven.",
  },
  {
    id: "save",
    number: 8,
    title: "Save and update history",
    summary: "Record the immutable reading and cascade updates",
    input: "Validated reading result",
    process: "Save reading → update shift (exposure = end − start) → update band cumulative → update worker aggregates (daily/weekly/monthly) → evaluate alert rules → check band lifecycle (5-day limit, saturation)",
    output: "Updated worker exposure history, any triggered alerts, potential band retirement",
    limitation: "Shift dose is the differential (end − start), not an independent measurement. Negative differences are flagged, not silently zeroed.",
  },
] as const;
