export const PROJECT = {
  name: "Rakshak AI (H₂S Dose Wristband)",
  shortName: "Rakshak",
  tagline: "Continuous Passive Colorimetric Dosimetry & Real-Time Workplace Safety Monitoring",
  heroLines: [
    "Continuous passive colorimetric dosimetry & AI-powered real-time workplace safety monitoring."
  ],
  status: "Operational Prototype",
  limitation: "Research prototype for cumulative exposure assessment compliant with OISD-STD-105 & DGMS standards. Not a continuous gas alarm.",
  complianceNotice: "OISD-STD-105 & DGMS Industrial Compliance Notice: Rakshak passive dosimeters assess cumulative shift exposure (TWA ppm·h) and complement active continuous gas detectors.",
  regulatoryCitations: [
    "OISD-STD-105: Work Permit System & Gas Monitoring in Hydrocarbon Processing Plants",
    "DGMS Circular No. 02/2019: Threshold Limit Values (TLV-TWA) for H₂S Exposure in Confined Spaces",
    "OSHA 1910.1000 Table Z-2: 8-Hour Time-Weighted Average Permissible Exposure Limits (PEL-TWA)"
  ],
  year: 2026,
};

export const TEAM = [
  {
    name: "Ganesh Nair",
    role: "Project Lead & Systems Architect",
    image: "/ganesh_real.jpg",
    bio: "Full-stack cloud systems, IoT edge integration, and distributed industrial safety telemetry architecture."
  },
  {
    name: "Arjit Ujjawal",
    role: "Lead Chemical & Optical Engineer",
    image: "/arjit.jpg",
    bio: "Colorimetric chemo-optical sensors, reactive substrate synthesis, and CIELAB colorimetry calibration engines."
  },
  {
    name: "Sumedh",
    role: "Full-Stack & Embedded Software Lead",
    image: "/sumedh.png",
    bio: "Mobile optical processing, Next.js architecture, reactive data layers, and real-time dashboard instrumentation."
  }
];

export const ROLES_DESCRIPTION = {
  shiftManager: {
    title: "Shift Manager",
    short: "Assigns bands, runs scan workflows at shift boundaries, and issues field safety alerts.",
    badge: "Field Operations",
    route: "/login",
    color: "primary"
  },
  controlRoom: {
    title: "Control Room",
    short: "Monitors aggregated dashboard telemetry, worker exposure ledgers, and resolves tier 3 breaches.",
    badge: "Telemetry & HSE",
    route: "/login",
    color: "text-primary"
  },
  fieldEmployee: {
    title: "Field Employee",
    short: "Views personal exposure history, active wristband lifecycle status, and shift dosimeter logs.",
    badge: "Personal Dossier",
    route: "/login",
    color: "status-success"
  }
};

export interface FlowchartStage {
  id: number;
  name: string;
  phase: string;
  process: string;
  limitation: string;
  badge: string;
}

export interface FlowchartPhase {
  phaseNumber: number;
  phaseName: string;
  description: string;
  stages: FlowchartStage[];
}

export const PIPELINE_PHASES: FlowchartPhase[] = [
  {
    phaseNumber: 1,
    phaseName: "Shift Check-in & Baseline",
    description: "Wristband identity resolution, batch calibration pairing, and pristine pre-exposure optical baseline registration.",
    stages: [
      {
        id: 1,
        name: "Assign & Resolve",
        phase: "Shift Check-in",
        process: "Scan worker QR code and dosimeter badge ID; resolve manufacturing lot calibration curve and initialize 5-day lifecycle counter.",
        limitation: "Requires local network connectivity to resolve active calibration profile and company tenant.",
        badge: "Identity"
      },
      {
        id: 2,
        name: "Capture Baseline",
        phase: "Shift Check-in",
        process: "Photograph unexposed optical zones (Patches A, B, C) under controlled flash/illumination to record baseline sRGB/CIELAB coordinates.",
        limitation: "Assumes pristine unexposed storage condition within sealed foil moisture-barrier pouch.",
        badge: "Optical Scan"
      }
    ]
  },
  {
    phaseNumber: 2,
    phaseName: "Operational Shift Wear",
    description: "Unobtrusive personal wear during hazardous operations in refining, petrochemical, or confined space environments.",
    stages: [
      {
        id: 3,
        name: "Passive Exposure",
        phase: "Operational Shift",
        process: "Worker wears dosimeter band in hazardous plant zone. Gaseous H₂S diffuses across the microporous PTFE membrane, precipitating Sb₂S₃ in the reactive matrix.",
        limitation: "Cumulative passive dosimeter — does not sound instantaneous high-concentration acoustic escape alarms.",
        badge: "Diffusion"
      }
    ]
  },
  {
    phaseNumber: 3,
    phaseName: "Shift Check-out & Colorimetric Analysis",
    description: "Post-shift optical capture, reference drift compensation, and Euclidean color difference computation.",
    stages: [
      {
        id: 4,
        name: "End Shift Capture",
        phase: "Post-Shift Analysis",
        process: "Re-photograph the dosimeter strip under normalized illumination at shift conclusion to capture post-exposure color shift.",
        limitation: "Must be scanned within 60 minutes post-shift to avoid ambient post-exposure dark oxidation.",
        badge: "Optical Scan"
      },
      {
        id: 5,
        name: "Quality Check",
        phase: "Post-Shift Analysis",
        process: "Locate and sample optical wells; verify Reference Patch B drift (ΔE < 4.0) and Hydrochromic Patch C physical seal integrity.",
        limitation: "Invalidates reading if Patch B drift exceeds 4.0 ΔE or Patch C indicates liquid moisture ingress.",
        badge: "Integrity"
      },
      {
        id: 6,
        name: "Calculate Color",
        phase: "Post-Shift Analysis",
        process: "Convert normalized sRGB pixels to linear RGB, transform to CIE XYZ (D65 illuminant), and compute CIE76 Euclidean distance ΔE.",
        limitation: "Normalized against TiO₂ reference white ring to compensate for ambient smartphone lighting variance.",
        badge: "CIELAB"
      }
    ]
  },
  {
    phaseNumber: 4,
    phaseName: "Ledger Commit & HSE Compliance",
    description: "Piecewise dose interpolation, statutory classification, and immutable ledger record commit.",
    stages: [
      {
        id: 7,
        name: "Apply Calibration",
        phase: "Ledger Commit",
        process: "Interpolate ΔE against batch calibration curve to compute [min, max] ppm·h cumulative dose with confidence rating.",
        limitation: "Piecewise linear interpolation clamped at ΔE > 38.0 (35.0 ppm·h chemical saturation boundary).",
        badge: "Calibration"
      },
      {
        id: 8,
        name: "Record & Alert",
        phase: "Ledger Commit",
        process: "Commit shift dossier to encrypted database, update worker cumulative ledger, and trigger Tier 1/2/3 HSE breach alerts.",
        limitation: "Permanent tamper-evident audit record for statutory compliance (OISD-STD-105 / DGMS).",
        badge: "Audit Trail"
      }
    ]
  }
];

export const DOSIMETER_SPECIFICATIONS = [
  { label: "Physical Dimensions", value: "42.0 mm × 22.0 mm × 2.8 mm" },
  { label: "Total Mass", value: "3.4 grams (ultra-lightweight)" },
  { label: "Operating Temperature", value: "-10°C to +55°C (14°F to 131°F)" },
  { label: "Operating Humidity", value: "10% to 95% RH (non-condensing)" },
  { label: "Wear Lifecycle Limit", value: "5 Operating Days (cumulative)" },
  { label: "Shelf Life (Sealed)", value: "12 Months in desiccated hermetic pouch" },
  { label: "Detection Range", value: "0.0 to 35.0 ppm·h cumulative H₂S dose" },
  { label: "Lower Detection Limit", value: "0.5 ppm·h (ΔE ≈ 3.5)" },
  { label: "Chemical Saturation", value: "35.0 ppm·h (ΔE ≥ 38.0)" },
  { label: "Sampling Mechanism", value: "Passive molecular diffusion (Fick's 1st Law)" },
  { label: "Carrier Substrate", value: "Hypoallergenic biocompatible medical silicone" },
  { label: "Regulatory Compliance", value: "OISD-STD-105, DGMS Circular 02/2019, OSHA 1910" }
];

export const DOSIMETER_LAYERS = [
  {
    layerNumber: 1,
    name: "Protective Anti-UV Window",
    thickness: "0.12 mm",
    material: "Fluoropolymer Top Barrier",
    function: "Blocks UV-A/UV-B photodegradation while maintaining >94% optical clarity for smartphone imaging."
  },
  {
    layerNumber: 2,
    name: "Microporous PTFE Gas-Diffusion Membrane",
    thickness: "0.15 mm",
    material: "Hydrophobic ePTFE (0.2 µm pore size)",
    function: "Allows gaseous H₂S diffusion at controlled rates while strictly repelling liquid water and aerosolized particulates."
  },
  {
    layerNumber: 3,
    name: "Reactive Chemo-Optical Matrix",
    thickness: "0.40 mm",
    material: "SbCl₃ + Anthocyanin Composite on PVDF",
    function: "Undergoes irreversible chemical reaction with H₂S gas to precipitate orange-brown stibnite (Sb₂S₃)."
  },
  {
    layerNumber: 4,
    name: "Reflective White Backing Layer",
    thickness: "0.25 mm",
    material: "High-Purity Titanium Dioxide (TiO₂)",
    function: "Provides diffuse reflectance standard (L* ≈ 96.5) maximizing contrast and eliminating background color bias."
  },
  {
    layerNumber: 5,
    name: "Medical-Grade Skin-Safe Carrier",
    thickness: "1.80 mm",
    material: "Biocompatible Silicone / Acrylic Adhesive",
    function: "Isolates chemical reagents completely from skin contact; hypoallergenic ISO 10993 cytotoxicity compliant."
  },
  {
    layerNumber: 6,
    name: "Laser-Etched 2D DataMatrix Fiducial",
    thickness: "0.08 mm",
    material: "High-Contrast Matte Etching (12 × 12 mm)",
    function: "Provides sub-pixel perspective correction, homography warp alignment, and unique badge UUID resolution."
  }
];

export const OPTICAL_PATCHES = [
  {
    code: "Patch A",
    name: "Active Sensing Zone",
    geometry: "Circular Well (Ø 6.0 mm)",
    color: "#f9ab00",
    role: "Exposed to ambient air through PTFE membrane. Undergoes irreversible color shift proportional to cumulative H₂S exposure."
  },
  {
    code: "Patch B",
    name: "Sealed Optical Reference Zone",
    geometry: "Circular Well (Ø 6.0 mm)",
    color: "#1a73e8",
    role: "Hermetically sealed with aluminized barrier foil. Measures baseline optical drift, UV aging, and camera color temperature for drift subtraction."
  },
  {
    code: "Patch C",
    name: "Hydrochromic Condition Indicator",
    geometry: "Circular Well (Ø 4.0 mm)",
    color: "#1e8e3e",
    role: "Moisture-sensitive cobalt/silica matrix that shifts color if the internal barrier is breached by liquid, invalidating compromised scans."
  },
  {
    code: "TiO₂ Ring",
    name: "Certified White Balance Ring",
    geometry: "Concentric Annulus (1.5 mm border)",
    color: "#ffffff",
    role: "Encircles each optical patch with certified reflectance standard (L*=96.5, a*=-0.2, b*=0.8) for camera white-balance normalization."
  }
];

export const CALIBRATION_POINTS_DATA = [
  { deltaE: "0.0", doseRange: "[0.0, 0.0] ppm·h", confidence: "HIGH", zone: "NORMAL", interpretation: "Pristine unexposed baseline" },
  { deltaE: "3.5", doseRange: "[0.5, 1.2] ppm·h", confidence: "HIGH", zone: "NORMAL", interpretation: "Lower threshold of quantifiable detection" },
  { deltaE: "8.2", doseRange: "[2.0, 3.8] ppm·h", confidence: "HIGH", zone: "ELEVATED", interpretation: "Tier 1 advisory threshold (Shift Manager alerted)" },
  { deltaE: "15.0", doseRange: "[5.0, 8.5] ppm·h", confidence: "HIGH", zone: "HIGH", interpretation: "Tier 2 mandatory rotation / investigation threshold" },
  { deltaE: "25.0", doseRange: "[10.0, 18.0] ppm·h", confidence: "MEDIUM", zone: "CRITICAL", interpretation: "Approaching statutory shift ceiling" },
  { deltaE: "38.0", doseRange: "[20.0, 35.0] ppm·h", confidence: "LOW", zone: "CRITICAL", interpretation: "Chemical saturation threshold (>38.0 ΔE clamped)" }
];

export const BENCHMARK_MODALITIES = [
  {
    modality: "SbCl₃–Anthocyanin Composite (Rakshak Dosimeter)",
    selectivity: "High selectivity to H₂S via stoichiometric sulfide precipitation; anthocyanin buffer prevents NO₂/SO₂ false positives.",
    toxicity: "Lead-free, non-carcinogenic, RoHS compliant, skin-isolated disposal.",
    drift: "Hermetic seal + Patch B optical reference subtraction compensates for thermal/photodegradation.",
    power: "Passive (Zero Power) — no batteries, charging docks, or daily bump-testing.",
    cost: "< $1.00 per dosimeter cartridge (scalable consumable).",
    role: "Longitudinal personal shift dosimetry & statutory TWA exposure recording.",
    status: "Primary Technology"
  },
  {
    modality: "Lead Acetate Test Paper (Pb(CH₃COO)₂)",
    selectivity: "High for H₂S (PbS black precipitate), but susceptible to atmospheric oxidation and dark fading.",
    toxicity: "Hazardous heavy metal (carcinogenic, reproductive toxin); strict disposal restrictions under REACH/RoHS.",
    drift: "Severe color fading on exposure to light and ambient oxygen; non-linear optical response.",
    power: "Passive (Zero Power) paper strip.",
    cost: "$0.50 – $1.50 per strip.",
    role: "Legacy qualitative spot check (deprecated in modern HSE programs).",
    status: "Legacy Baseline"
  },
  {
    modality: "Tungsten Trioxide (WO₃) Thin Films (Chemiresistive MOS)",
    selectivity: "Moderate; cross-sensitive to ethanol, CO, methane, and ambient relative humidity fluctuations.",
    toxicity: "Non-toxic solid-state metal oxide sensor.",
    drift: "Baseline resistance drifts significantly with ambient humidity and heater element degradation.",
    power: "High power consumption (requires integrated micro-heater at 200°C–350°C).",
    cost: "$15.00 – $40.00 per sensor module.",
    role: "Fixed area continuous point detection.",
    status: "Semiconductor Reference"
  },
  {
    modality: "Electronic Electrochemical Sensors (Continuous Personal Monitors)",
    selectivity: "High selectivity with carbon-filter scrubbers, though high concentrations poison electrolyte.",
    toxicity: "Contains acid electrolyte solutions; requires specialized e-waste disposal.",
    drift: "Electrolyte evaporation, zero-drift, and span-drift; requires routine 30-day calibration & bump tests.",
    power: "Active battery-powered device requiring daily overnight recharge stations.",
    cost: "$150.00 – $500.00+ per personal monitor + calibration gas cylinders.",
    role: "Immediate audible & vibratory emergency escape warning.",
    status: "Complementary Standard"
  }
];

