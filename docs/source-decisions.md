# Source Decisions & Scientific Conflicts

This document records the resolution of scientific and documentation conflicts in the H₂S Dose Wristband platform, explicitly distinguishing proposed research claims from currently validated operational behavior.

## 1. Operational Lifespan & Expiry
- **Decision**: We enforce the platform specification's **five-working-day** operational policy.
- **Rationale**: This is a configurable prototype policy. While chemical literature describes a "seven-day expiry," that metric is not experimentally guaranteed in field conditions. Calendar use-by dates and physical patch condition checks (Patch C) are tracked independently from this policy.

## 2. Hardware Model (A/B/C Patches)
- **Decision**: The A/B/C operational model is preserved in the software workflow.
- **Rationale**: Any older reference-scale artwork is considered "proposed." The software expects exactly three patches: Patch A (active reactive), Patch B (sealed reference), and Patch C (condition indicator).

## 3. Cumulative Response vs. Summation
- **Decision**: Successive cumulative readings are **not** summed.
- **Rationale**: The optical change (ΔE) on the band already represents the accumulated response. Shift dose is derived mathematically from paired end-of-shift and start-of-shift estimates. Negative differences or excessive uncertainty are handled via explicit exception workflows, not hidden in summations.

## 4. Worker History Aggregation
- **Decision**: Worker history aggregates non-overlapping, valid shift increments only.
- **Rationale**: Off-shift changes or missing baselines must remain explicitly visible in the ledger. The system will not invent allocation for untracked periods.

## 5. Calibration and "Dose"
- **Decision**: Quantitative exposure dose requires an eligible, validated calibration curve.
- **Rationale**: Cumulative color permanence does not inherently establish a concentration × time metric. If a calibration is unavailable, the UI will display the raw `ΔE` (or an exposure index) explicitly labeled "Dose calibration unavailable."

## 6. Detection Limits and Human Perceptibility
- **Decision**: A ΔE of 3.3 (human perceptibility threshold) is not used as an established instrument detection limit.
- **Rationale**: Any cutoff is considered provisional until validated. A value below the cutoff does not guarantee "no exposure" and will not be translated as such.

## 7. Patch Seal Failure Diagnosis
- **Decision**: We do not claim the exact cause or timing of seal failure can be diagnosed from a single photograph.
- **Rationale**: A changed reference patch (Patch B) flags a validity concern. It invalidates the reading but does not provide diagnostic forensics on the breach event.

## 8. Statutory Occupational Limits
- **Decision**: System alerts distinguish strictly between concentration ceilings, Time-Weighted Averages (TWA), and cumulative dose.
- **Rationale**: The UI does not publish "safe limits" copied verbatim from unverified documents. All limits align with authoritative sources and their explicit definitions.
