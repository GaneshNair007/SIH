# Source decisions

This file records the decisions used when the sketch, platform specification, and chemistry notes do not say exactly the same thing.

- The protected application has three account roles: Shift Manager, Control Room Manager, and Admin. Workers are company-scoped records managed by authorized staff; the old demo worker-account screen is not part of the product.
- The five-working-day rule from the platform specification is implemented as a configurable prototype operating policy. Calendar use-by dates and condition checks remain separate. A seven-day chemical life is not presented as experimentally guaranteed.
- The A/B/C model is preserved: Patch A is reactive, Patch B is a sealed reference and integrity check, and Patch C is a condition indicator. Older reference-scale artwork is treated as proposed hardware, not an identical validated design.
- A band reading represents the latest accumulated band response. Successive cumulative readings are never summed. A shift increment is derived from paired end and start estimates; negative differences and missing baselines are invalid states, not zero exposure.
- Worker history aggregates only non-overlapping valid shift increments. Off-shift changes, missing baselines, and rejected readings remain visible.
- A quantitative dose is shown only when an eligible calibration is present. Otherwise the interface preserves ΔE and says **Dose calibration unavailable**. Demo dose ranges are synthetic and remain labeled as such in the UI and exports.
- Human colour-perception thresholds are not used as instrument detection limits. A low ΔE is retained as a measured colour difference and is not translated into “no exposure”.
- A changed reference or condition patch is a validity concern. The interface does not claim that one photograph can identify the cause or timing of a seal failure.
- Occupational limits are not reproduced in public copy. Concentration ceilings, time-weighted averages, and cumulative dose are different quantities and are not substituted for one another.
- The published Zhang et al. paper supports laboratory test-paper statements only. Wristband packaging, skin isolation, cumulative reciprocity, batch calibration, field durability, and our team’s performance remain pending validation.

