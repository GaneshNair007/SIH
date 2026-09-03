# H2S Dose Wristband + Digital Monitoring Platform
## Claude-Ready Engineering Setup, Product Specification, Architecture, API Contract, Database Model, UI Contract, and Build Plan

> **Document purpose**
>
> This file is the implementation handoff for the engineering agent/team building the H2S Dose Wristband digital platform. It is intentionally written as a build contract rather than a concept note.
>
> **Primary instruction for the implementer**
>
> Build the application described here end-to-end. Do not replace the product flow with a generic dashboard template. Do not silently remove workflow steps. Do not invent scientifically validated thresholds or calibration numbers that are not provided by the project team. Where a value is explicitly marked `TBD`, implement the system so it is configurable and provide a safe demo default only where needed for the demo environment.
>
> **Source basis**
>
> The supplied H2S Wristband build guide establishes the physical badge concept and the base image-analysis flow: a mobile web app, photograph capture, Patch A/B/C sampling, RGB → CIE L\*a\*b\*, ΔE calculation, calibration-based dose estimation, a sealed Patch B reference, Patch C as a condition/humidity indicator, and a future path toward per-batch calibration. The project requirements supplied by the team extend this into a full Shift Manager + worker longitudinal exposure history + Control Room monitoring platform.
>
> **Scientific boundary**
>
> This application is a passive colorimetric dosimeter reader. Its result is an **estimate of cumulative H₂S dose**, not a direct continuous gas concentration measurement. The UI must communicate uncertainty. The app must never imply that a photograph provides a second-by-second telemetry trace or an exact instantaneous concentration.

---

# A. Revision Notes (Read First)

This document merges and corrects two source drafts: the original engineering build contract and a separate chemistry/redesign brief. It is now self-contained — an implementation agent does not need any other file.

Corrections applied during review, relative to the original build contract:

1. **Cumulative vs. differential dose math (the most important fix).** Patch A's color change is chemically irreversible and accumulates continuously for the badge's entire working life (Section B.2). A single END-of-shift reading therefore already reflects the *total* dose since the band was issued — not just that shift's increment. The original draft's worked example in §8.2 summed independent per-shift numbers (`3.2 + 4.7 + 2.9 = 10.8`) as if each day's reading were a fresh, independent measurement. That contradicts the chemistry and would double/triple-count exposure. §8 and §17 below now define the corrected model: band-cumulative dose comes directly from the latest reading; a shift's own contribution is the differential between that shift's start-reading estimate and end-reading estimate.
2. **"Fake precision" single-number doses.** The document's own rule (§71, item 7) forbids showing a bare number like `7.384 ppm·h` instead of a range — but several UI mockups elsewhere in the original draft (QR-scan summary, activity feed, alert cards) violated that rule by showing single numbers. All exposure displays below now consistently show a low–high range.
3. **Patch B's tamper/seal-integrity role was missing.** The chemistry brief establishes that Patch B (the sealed reference) should also function as a tamper/expiry check: if Patch B itself has drifted from its expected unexposed baseline at read time, the badge's seal was compromised before it was ever worn, and the reading should be flagged. The original draft only used Patch B as a white-point baseline. Added to §9.6 and §12.2.
4. **Sub-perceptibility ΔE handling was unspecified.** ΔE ≈ 3.3 is roughly the threshold where a color difference becomes human-perceptible; below that the app should report "no measurable exposure yet" rather than interpolating a fake nonzero dose. The original calibration/interpolation logic (§11) didn't encode this. Added as §11.7.
5. **Band lifecycle diagram ambiguity.** The original state diagram showed "shelf-life/condition invalid before use" branching off the `ACTIVE` state, which is contradictory — a badge can't fail a *pre-use* check after it's already active. §3.2 now separates the pre-issuance validity gate from an in-service expiry check.
6. **`working_day_count` vs `working_day_index` naming was inconsistent** between the prose (§3.3) and the schema (§18). Clarified: `bands.working_day_count` is the running total (0–5) on the band; `working_day_index` on shifts/readings records which of those days a specific event belongs to.
7. **Minor fixes:** a stray leading space in the `calibration_points` schema field name; the `/api/readings/analyze` example response had a flat `patchCStatus` field where the `ReadingResult` TypeScript type nests it under `patchC.status` — aligned the two.
8. **The chemistry/materials-science rationale** from the separate redesign brief has been folded into Section B below (condensed) so this is one self-contained document. Its regulatory figures (ACGIH TLV 1 ppm TWA / 5 ppm STEL, NIOSH IDLH 100 ppm) were spot-checked against current sources during this review and are accurate; the India-specific IS 15200:2002 figures were not independently re-verified and should be confirmed by the team before being quoted to judges.

Nothing else was changed. The roles/permissions model, database schema, API contracts, band lifecycle rules, alert engine, Control Room spec, tech stack, build phases, and testing strategy are unchanged except where noted above.

---

# B. Scientific & Chemistry Basis (Condensed)

Source: Zhang et al., *"A Visual Color Response Test Paper for the Detection of Hydrogen Sulfide Gas in the Air,"* Molecules 2023, 28(13), 5044 (open access, CC BY 4.0), plus the team's own redesign brief. This section is the "why" behind the app's data model — Sections 0 onward are the implementation instructions.

## B.1 What this device is and isn't

This is a **passive, integrating dosimeter** — the same logic radiation workers' film badges have used for 70 years, applied to H₂S. It answers *"how much sub-threshold H₂S has this worker absorbed over a shift/week/month?"*, not *"is there a leak right now?"* It is not an acute-leak alarm and must never be marketed as one; electronic real-time detectors already fill that role. Regulatory anchors: Indian Standard IS 15200:2002 references a 10 ppm TLV / 15 ppm 15-min STEL; the current ACGIH TLV is far stricter at 1 ppm 8-hr TWA / 5 ppm STEL (a 2010 revision); NIOSH IDLH is 100 ppm; OSHA's legal PEL is a comparatively lax 20 ppm TWA / 50 ppm ceiling.

## B.2 The chemistry

A two-reagent composite strip — roughly **0.5 wt% antimony trichloride (SbCl₃) + 4 wt% anthocyanin extract** (originally purple cabbage; candidate Indian substitutes worth bench-testing: butterfly pea flower, black rice bran, jamun skin, black carrot, hibiscus — none proven equivalent to SbCl₃ yet), coated in two passes onto filter paper — gives a **gradient, concentration-dependent** color response, unlike either reagent alone:

| Strip | Detection limit | Behavior |
|---|---|---|
| Anthocyanin only | ~10 ppm | Slow, gradual, but too insensitive for realistic occupational exposure |
| SbCl₃ only | ~200 ppb | Very fast — behaves like a switch, not a meter |
| **SbCl₃ + anthocyanin (chosen)** | **~200 ppb** | Sensitive *and* stretched-out/gradient over minutes-to-hours; validated near-linear against ΔE across 0.2–10 ppm |

Mechanism (confirmed via XPS): SbCl₃ pre-coordinates onto the anthocyanin's carbonyl group during strip preparation. On H₂S exposure, the antimony forms Sb₂S₃ while the anthocyanin separately forms a genuine **C–S covalent bond** — new C–S/S–O binding-energy peaks appear in XPS. This is real chemistry, not a reversible pH swing or physical adsorption: **the color change is permanent and does not fade back when the gas clears.** That permanence is what makes cumulative dose logging possible, and it is also why the "sum independent daily readings" math in the original draft was wrong (item 1 above) — the strip never resets.

**Safety constraint (non-negotiable):** antimony trichloride is corrosive/irritating in raw form and must never have extended skin contact. The reactive layer must be physically isolated from skin by the badge housing — gas-permeable to ambient air, not skin-contacting.

## B.3 Badge architecture

A disposable pod on a wrist strap, three patches behind one transparent gas-permeable/liquid-impermeable window:

- **Patch A — dose strip.** SbCl₃/anthocyanin composite. Only patch exposed to ambient air.
- **Patch B — sealed reference.** Same batch, hermetically sealed, never sees H₂S. Two jobs: (1) gives the app a badge-specific zero-exposure white-point baseline at read time, correcting for paper/dye-lot drift and photo lighting; (2) **tamper/seal-integrity check** — if Patch B has already darkened at read time, the seal was compromised before the badge was ever worn and the reading should be flagged.
- **Patch C — humidity/expiry card.** Cobalt-free humidity-indicator card; independent physical read of whether the storage pouch was breached and how humid the wear environment has been.
- **QR/batch code** on the housing, linking to the correct calibration curve for that manufacturing batch — formulations drift batch to batch, so never hard-code a single calibration curve.

Target BOM: filter paper, humidity card, small vented housing, strap — sub-₹50 at scale.

## B.4 Turning color into a dose number

Standard CIE L\*a\*b\* + Euclidean ΔE (CIE76):

**ΔE = √[(L−L₀)² + (a−a₀)² + (b−b₀)²]**

ΔE ≈ 3.3 is the commonly cited threshold below which a human eye can't reliably distinguish two colors — below that, the app should report "no measurable exposure yet," not a manufactured low number (see §11.7).

The source paper gives ΔE vs. concentration (fixed time) and ΔE vs. time (fixed concentration) separately; it does **not** establish that equal concentration×time products (reciprocity / Haber's Rule, c·t = k, or the ten-Berge refinement cⁿ·t = k) produce equal ΔE. **Testing that reciprocity assumption is this project's own original contribution**, not something already proven in the literature — build the calibration table from a concentration×duration grid that specifically includes equal-C·t combinations, and report whatever relationship the data actually shows (don't assume linearity).

## B.5 Temperature & humidity compensation

The source paper's own data: the same strip at the same H₂S concentration fully colors in under a minute at 80°C but takes tens of minutes at 0°C — any dose estimate that ignores this is wrong by a large factor between a hot boiler room and a winter tank farm. Two compensation channels (don't rely on just one): (1) on-badge — Patch C's humidity read plus, if budget allows, a printed thermochromic dot, gives a coarse temperature/humidity *bucket* from the same photo, with a correction multiplier per bucket derived from the team's own multi-temperature calibration runs; (2) phone location + timestamp against a weather API, as a secondary/outdoor fallback — most phones have no ambient temp/humidity sensor. When conditions fall outside the calibrated range, widen the reported uncertainty band or flag "outside calibrated range" rather than silently extrapolating. **Note:** the source paper never tested humidity as a variable (only dry gases) — humidity-robustness is the team's own untested extension, not something citable to the paper.

## B.6 Expiry / shelf life

Two independent signals: (1) physical — Patch C plus a heat-sealed pouch; a breached pouch lets moisture reach Patch C, which visibly and permanently changes, checkable by eye with no app needed; (2) a printed manufacture/use-by date backed by an accelerated-aging study (elevated temperature/humidity storage for a short period, extrapolated Arrhenius-style to real-time shelf life), not a guessed number.

## B.7 Validation plan (do even a miniature version)

Build a small sealed exposure chamber, generate known low H₂S concentrations (metered sulfide salt + dilute acid, with air circulation), verified against a calibrated commercial H₂S detector as independent ground truth. Run a concentration×time grid over the target occupational range (~1–10 ppm, 15–120 min) including equal-C·t points to test reciprocity; fit and report the calibration curve *with* uncertainty; repeat a subset at two temperatures for a first-pass compensation multiplier; run a short accelerated-aging batch for the shelf-life claim.

**Safety note:** any live H₂S generation, even at ppm levels, must be done in a fume hood or fully outdoors, with a calibrated backup H₂S detector running, under supervision of someone with real chemistry-lab training — ideally a college/institute lab, not an improvised setup. If that access isn't available in the build timeframe, validate the color-quantification/app pipeline using a surrogate colorant (pre-made strips at known ΔE, or the source paper's own published figures as a synthetic validation set) and label the H₂S-chamber validation as "protocol designed, pending supervised lab access."

## B.8 Honest open risks (own these, don't hide them)

- Antimony toxicity in a wearable is a real constraint, not a footnote — the housing must isolate the reactive layer from skin.
- Humidity-robustness and pigment-source substitution (butterfly pea etc.) are untested extensions of the cited paper, not proven facts.
- Reciprocity (equal C·t → equal ΔE) is an assumption being tested, not a given — the paper's own data hints at non-linearity outside the 1–10 ppm band.
- Batch-to-batch chemistry variation is expected for a natural-pigment product — this is exactly why calibration is versioned and scoped per batch in the data model (§11.6, `band_batches`).

## B.9 References

- Zhang, H. et al. *A Visual Color Response Test Paper for the Detection of Hydrogen Sulfide Gas in the Air.* Molecules 2023, 28(13), 5044. https://doi.org/10.3390/molecules28135044 (CC BY 4.0)
- Bureau of Indian Standards, IS 15200:2002, *Hydrogen Sulphide — Code of Safety.*
- OSHA, *Hydrogen Sulfide — Standards & Hazards* (osha.gov/hydrogen-sulfide)
- NIOSH, *Hydrogen Sulfide IDLH documentation* (cdc.gov/niosh/idlh)

---

# 0. Executive Product Definition

## 0.1 One-sentence product definition

A company-operated digital monitoring platform that links each disposable H₂S colorimetric wristband to one worker, records start/end-of-shift readings from a phone photograph, estimates cumulative exposure from the strip's color change, maintains longitudinal exposure history across multiple bands, and provides a near-real-time Control Room for worker, shift, region, work-area, band, and exposure analytics.

## 0.2 Core operational story

The platform must support this complete business flow:

```text
COMPANY
  |
  +--> CONTROL ROOM MANAGER
  |       |
  |       +--> Overview
  |       +--> Workers
  |       +--> Regions / Work Areas
  |       +--> Bands
  |       +--> Exposure Analytics
  |       +--> Alerts / Safety Events
  |       +--> Reports
  |
  +--> SHIFT MANAGER
          |
          +--> Login
          +--> Register worker
          +--> Register/issue band
          +--> Scan band at start of shift
          +--> Select actual work location
          +--> Capture A/B/C image
          +--> Submit start reading
          +--> Scan same band at end of shift
          +--> Capture A/B/C image
          +--> Submit end reading
          +--> Review result / warnings
          +--> Retire band if required

BAND
  |
  +--> Permanent identity
  +--> Worker identity
  +--> Batch/calibration identity
  +--> Start/end shift readings
  +--> Daily history
  +--> Cumulative band dose
  +--> Measurement-health state
  +--> Retirement state

WORKER
  |
  +--> Current band
  +--> Historical bands
  +--> Shift history
  +--> Daily exposure
  +--> Weekly exposure
  +--> Monthly exposure
  +--> Long-term exposure history
  +--> Alerts / safety events
```

## 0.3 Non-negotiable product behaviors

1. A Shift Manager must log in before accessing operational data.
2. A physical band is permanently assigned to exactly one worker.
3. The QR identity contains the worker identity and band identity.
4. Scanning an already assigned band must automatically identify the worker and retrieve the worker/band profile.
5. A worker can rotate between plants/regions/work areas; actual location is selected per shift and can be manually overridden.
6. The same physical band is used until either five **working days** have elapsed or the strip becomes unable to provide a reliable measurement, whichever comes first.
7. The start-of-shift workflow captures a formal baseline/state reading.
8. The end-of-shift workflow captures the end state and calculates the shift exposure estimate.
9. Band cumulative exposure and worker cumulative exposure are stored separately.
10. Worker exposure history must remain continuous across band changes.
11. The application must preserve raw measurement inputs and derived results for future analysis/recalibration, subject to configured storage/privacy policy.
12. Patch A, Patch B, and Patch C are part of the software reading workflow.
13. The phone rear camera and flash/controlled illumination are the preferred scan condition. Device limitations must be handled gracefully.
14. The app must validate image quality and measurement confidence before presenting a result as trustworthy.
15. Patch C is used for badge-condition/validity checks in the first implementation; the data model must support environmental correction later.
16. A saturated/out-of-range strip must not be treated as a normal precise measurement.
17. Exposure thresholds are configurable and versioned; the team must supply scientifically appropriate values.
18. Alert severity changes the workflow. Elevated = dashboard notification; High = acknowledgement; Critical = acknowledgement + action.
19. Control Room data must update near-real-time when new readings/events arrive.
20. The architecture must keep the core measurement engine independent from React, database code, authentication, and UI code.

---

# 1. Product Roles and Permissions

## 1.1 Roles

The minimum role model is:

```text
SHIFT_MANAGER
CONTROL_ROOM_MANAGER
ADMIN
```

Optional future roles can be added without changing the core schema.

## 1.2 Shift Manager responsibilities

A Shift Manager can:

- log in
- search/create workers
- issue a new band to a worker
- scan existing bands
- start a shift
- select/override the shift's plant/region/work area
- capture start reading
- capture end reading
- review the analysis result
- acknowledge permitted alerts if policy allows
- retire a band when the measurement system requires it
- view worker and band history needed for shift operations

A Shift Manager must not:

- edit scientific calibration constants
- change global exposure thresholds unless explicitly granted the Admin capability
- reassign an existing band
- delete safety events
- alter historical readings

## 1.3 Control Room Manager responsibilities

Can:

- view company overview
- view near-real-time reading/event feed
- search/filter workers
- open worker exposure profiles
- inspect bands and lifecycle histories
- compare regions/work areas
- inspect shifts
- inspect alerts/safety events
- view exposure analytics
- review trend graphs
- use configured reporting/export functions

Should not by default:

- change chemistry calibration data
- reassign bands
- alter raw measurement data
- delete audit records

## 1.4 Admin responsibilities

Admin may additionally:

- manage users and roles
- manage company/plant/region/work-area hierarchy
- create/activate calibration versions
- manage threshold configurations
- manage system configuration
- manage alert routing configuration
- manage custom worker fields
- manage demo data
- inspect audit logs

## 1.5 Authorization rule

All permissions must be enforced server-side. Frontend route hiding is not a security boundary.

---

# 2. Core Domain Concepts

The application revolves around nine core concepts.

| Concept | Meaning |
|---|---|
| Worker | Human employee/worker being monitored |
| Band | One physical disposable wristband |
| Band Batch | Manufacturing/calibration group for bands |
| Shift | A period of work performed by a worker |
| Reading | One photograph-based analysis event |
| Exposure Aggregate | Daily/weekly/monthly/long-term calculated exposure |
| Calibration | Mapping from color response to dose estimate |
| Alert/Safety Event | Rule-triggered exposure or system event |
| Location | Plant → region → work area hierarchy |

## 2.1 Worker

Persistent identity across all historical bands.

A worker can have many bands over time, but a band belongs to only one worker.

## 2.2 Band

Persistent identity for one physical badge.

A band has:

- unique band ID
- QR payload
- worker link
- batch link
- issue date
- maximum working-day lifetime
- measurement-health state
- cumulative band exposure
- reading history
- retirement state/reason

## 2.3 Shift

A shift links one worker, one active band, one manager, one actual location, and time boundaries.

## 2.4 Reading

A reading is the immutable measurement record generated from a scan. Readings should be append-only from the business perspective. Corrections should be represented by a correction/review event instead of overwriting the original record.

---

# 3. Band Lifecycle State Machine

## 3.1 Required states

```text
UNREGISTERED
REGISTERED
ACTIVE
WARNING
RETIRED
EXPIRED
COMPROMISED
```

`WARNING` is a health/measurement warning state. `RETIRED`, `EXPIRED`, and `COMPROMISED` are terminal states unless an Admin explicitly reopens a state for a test/demo environment.

## 3.2 State transitions

The original draft showed "shelf-life/condition invalid before use" branching off the already-`ACTIVE` state, which is contradictory — a badge cannot fail a *pre-use* check after it has already started being used. There are two separate checks, at two separate points in the lifecycle:

```text
UNREGISTERED
    |
    | issue to worker
    v
REGISTERED
    |
    +--> pre-use validity gate fails
    |    (Patch B/Patch C already show tamper/expiry signs, or
    |     nominal_expiry_date already passed, before first shift)
    |        |
    |        v
    |      EXPIRED / COMPROMISED
    |
    | start first shift (validity gate passes)
    v
ACTIVE
    |
    +--> Patch C warning / low confidence
    |        |
    |        v
    |      WARNING
    |        |
    |        +--> valid again -> ACTIVE
    |        +--> invalid/compromised -> COMPROMISED
    |
    +--> measurement saturation / unusable calibration range
    |        |
    |        v
    |      RETIRED
    |
    +--> 5 working days reached
    |        |
    |        v
    |      RETIRED
    |
    +--> nominal_expiry_date reached while in service
             |
             v
          EXPIRED
```

## 3.3 Five-working-day rule

The application must track **working days**, not simply elapsed calendar days.

Two related but distinct fields (do not conflate them):

- `bands.working_day_count` — a running total (0–5) stored on the band, incremented as it accumulates working days.
- `working_day_index` (on shifts/readings) — records which of those days a specific shift or reading belongs to (e.g. `3` for the shift that pushed the band to its third working day).

The simplest deterministic MVP rule for incrementing the count:

- each distinct workday on which the band participates in an operational shift counts as one working day
- multiple readings on the same date do not increment the count more than once
- the maximum is `5`

If the company later defines holidays/rosters, a configurable working-calendar service can be introduced.

## 3.4 Measurement-based retirement rule

A band may retire before day 5 when:

- color response is detected as saturated, or
- ΔE is outside the validated calibration region in a way that makes dose estimation unreliable, or
- Patch C indicates unacceptable badge compromise, or
- repeated image/measurement quality checks indicate the badge cannot provide reliable data and policy says to retire.

The UI must state the retirement reason.

## 3.5 No band reassignment

Once:

```text
band.worker_id = worker_X
```

that relationship is permanent.

Backend must enforce this. Frontend must not provide a generic "Change worker" button.

If a worker leaves, the band remains historically linked to that worker.

---

# 4. Worker Lifecycle

## 4.1 New worker

Workflow:

```text
Shift Manager
  -> Register Worker
  -> Enter worker data
  -> Save
  -> Worker profile created
  -> Ready for band issuance
```

## 4.2 Extensible worker fields

Core fields must be typed and indexed. Additional company-specific fields should be supported via a custom-field mechanism rather than hard-coded schema changes.

Recommended implementation:

```text
worker_custom_fields
    id
    company_id
    field_key
    label
    field_type
    is_required
    options_json
```

and:

```text
worker_custom_values
    worker_id
    field_id
    value_text
    value_number
    value_boolean
    value_date
    value_json
```

The actual implementation may instead use a typed JSONB field if the team prefers, but core searchable fields should remain normal columns.

---

# 5. QR Identity Specification

## 5.1 QR contents

For this project, the QR identifies:

```text
Worker ID
Band ID
```

Preferred representation:

```json
{
  "type": "H2S_BAND",
  "version": 1,
  "workerId": "WRK-001042",
  "bandId": "BND-000381"
}
```

Alternative compact form is acceptable if the parser is versioned.

## 5.2 Security rule

The QR is an identifier, not proof of authorization.

A malicious person copying another QR must not gain access to that worker's complete profile merely by decoding/scanning it.

After QR decode:

```text
QR
 -> parse
 -> validate schema
 -> authenticate manager
 -> backend lookup
 -> verify band-worker relationship
 -> return permitted summary
```

## 5.3 QR scan behavior for a known band

If the band is registered:

```text
Scan QR
   ↓
Backend lookup
   ↓
Band found
   ↓
Worker found
   ↓
Display worker summary
   ↓
Display band state
   ↓
Determine active shift / available action
```

Example:

```text
WORKER
Aarav Kumar
WRK-001042

BAND
BND-000381
Batch: BATCH-07
Day: 3 / 5
Status: ACTIVE

Current cumulative band dose
11.8–13.4 ppm·h

Current worker cumulative dose
49.1–57.8 ppm·h

[ START SHIFT ]
[ END SHIFT ]
[ VIEW WORKER ]
```

## 5.4 QR scan behavior for an unregistered band

If the band exists but has not been assigned:

```text
Band found: UNREGISTERED

[ ISSUE TO WORKER ]
```

Then manager searches for/selects worker and confirms permanent assignment.

## 5.5 Invalid/unknown QR

Display:

```text
QR NOT RECOGNIZED

Possible reasons:
- damaged QR
- wrong product
- typo/unsupported version
- band not present in company database

[ SCAN AGAIN ]
[ ENTER BAND ID ]
```

The fallback manual entry can be controlled by company policy.

---

# 6. Shift Manager User Journeys

# 6.1 Login journey

```text
/login
    |
    +--> authenticated Shift Manager -> /manager
    +--> Control Room Manager -> /control-room
    +--> Admin -> /admin
```

Login must persist a secure session according to the selected auth provider.

## 6.2 Manager home

The Manager Home screen should prioritize operational actions.

Top area:

```text
H2S MONITOR
Shift Manager: <name>
Current date/time

[ SCAN BAND ]

Active shift count
Pending alerts
Recent readings
```

Secondary actions:

```text
[ REGISTER WORKER ]
[ SEARCH WORKER ]
[ BAND HISTORY ]
```

## 6.3 Scan entry

The manager chooses the operational action by scanning the band. The application should attempt to infer the correct action from shift state:

- registered + no active shift → offer `START SHIFT`
- registered + active shift → offer `END SHIFT`
- registered + active shift but manager asks for another action → require explicit confirmation
- retired/expired/compromised → do not allow normal reading workflow

## 6.4 Register new worker

Screen fields:

```text
Worker ID* 
Full Name*
Employee / HR ID*
Department
Designation
Contact
Plant
Default Region
Default Work Area
Supervisor
Shift Group
Joining Date
Custom Fields...
```

Validation:

- Worker ID required and unique within company
- HR/employee ID unique if company policy requires it
- Name required
- no accidental duplicate worker profiles

Duplicate handling:

```text
A worker with similar details already exists.

[ VIEW EXISTING ]
[ CONTINUE CREATING ]
```

## 6.5 Issue new band

Workflow:

```text
Scan unregistered QR
   ↓
Confirm band metadata
   ↓
Search worker
   ↓
Select worker
   ↓
Confirm permanent assignment
   ↓
Select batch if needed
   ↓
Verify manufacture/expiry metadata
   ↓
Issue band
```

Permanent-assignment confirmation must explicitly say:

> This band will be permanently linked to this worker and cannot later be reassigned.

## 6.6 Start-shift screen

After QR scan, show:

```text
Worker: <name>
Worker ID: <id>
Band: <band id>
Band day: <n>/5
Band status: <status>

Select actual work location:
Plant* 
Region*
Work Area*

Manager: <current user>
Shift type/group: <value>
Start time: <current timestamp>

[ START SHIFT & SCAN BAND ]
```

The location selection is per shift because workers can rotate.

## 6.7 Start-shift image capture

The standard workflow is:

```text
1. Rear camera
2. Enable flash/torch when supported
3. Place entire badge in frame
4. Make A/B/C visible
5. Hold steady
6. Capture
```

The app should show short guidance:

```text
Use the rear camera.
Use flash/controlled illumination.
Avoid glare.
Keep the band flat.
Ensure A, B and C are visible.
```

## 6.8 Start-shift result

Start reading does not represent a separate continuous gas exposure measurement. It is a state/baseline record used for traceability and shift processing.

Display:

```text
START READING SAVED

Worker: ...
Band day: ...
Location: ...
Patch status: valid/warning
Measurement confidence: ...

Shift is now ACTIVE.
```

## 6.9 End-shift screen

After scanning the QR of a band with an active shift:

```text
END SHIFT

Worker: ...
Band: ...
Shift: ...
Start: ...
Location: ...

[ SCAN FINAL BAND READING ]
```

After processing:

```text
SHIFT COMPLETED

Shift exposure estimate:
X–Y ppm·h

Band cumulative exposure:
X–Y ppm·h

Worker historical exposure:
X–Y ppm·h

Band status:
ACTIVE / WARNING / RETIRED

Confidence:
HIGH / MEDIUM / LOW / INVALID
```

## 6.10 End-shift retirement decision

If max working day reached:

```text
BAND RETIRED

Reason: 5 working days reached

Issue a new band before the worker's next operational shift.
```

If saturation occurs:

```text
BAND RETIRED

Reason: strip measurement limit reached

Exposure above the validated measurement range.
```

---

# 7. Control Room User Journeys

## 7.1 Control Room primary layout

Recommended desktop layout:

```text
┌────────────────────────────────────────────────────────────┐
│ Header: company | search | alerts | user                  │
├───────────────┬────────────────────────────────────────────┤
│ Sidebar       │ Main content                               │
│               │                                            │
│ Overview      │ KPI cards                                  │
│ Workers       │ Graphs                                     │
│ Regions       │ Alert feed                                 │
│ Shifts        │ Maps / regional analysis                   │
│ Bands         │                                            │
│ Analytics     │                                            │
│ Alerts        │                                            │
│ Reports       │                                            │
└───────────────┴────────────────────────────────────────────┘
```

## 7.2 Overview KPIs

Required first-pass KPIs:

```text
Total workers
Active bands
Readings today
Active shifts
Elevated events today
High events today
Critical events today
Active regions
Retired bands
```

## 7.3 Latest activity feed

Show latest events:

```text
11:34  END SHIFT   WRK-1042   Region 2   5.2–6.4 ppm·h
11:29  START SHIFT WRK-00319  Region 4   Valid baseline
11:23  HIGH ALERT  WRK-00987  Region 2   15.1–17.6 ppm·h
```

Each item opens the relevant reading/worker/alert.

## 7.4 Worker table

Columns:

```text
Worker ID
Name
Department
Current Band
Band Day
Current/Latest Exposure
Monthly Exposure
Last Reading
Status
```

Search and filters:

```text
Name
Worker ID
Department
Plant
Region
Work Area
Exposure severity
Current band status
Date range
```

## 7.5 Worker profile

Must answer:

> How much H₂S exposure has this worker recorded, and how has it changed over time?

Sections:

```text
Overview
Exposure trend
Daily history
Weekly history
Monthly history
Band history
Shift history
Reading history
Alerts/events
Environmental context
```

Top summary:

```text
Worker
Worker ID
Current band
Current band cumulative dose
Current month dose
Current week dose
Long-term recorded dose
Number of bands used
High/critical events
```

## 7.6 Region page

A region page must show measured exposure patterns.

Metrics:

```text
Readings
Workers present
Active bands
Estimated exposure statistics
High/critical event count
Trend over selected period
Work-area comparison
```

The UI must distinguish:

```text
MEASURED EXPOSURE
```

from:

```text
INFERRED HOTSPOT / RISK PATTERN
```

## 7.7 Hotspot interpretation

The platform may identify a potential hotspot based on repeated elevated measurements.

Example wording:

> Region 2 shows a persistent pattern of elevated worker exposure across the selected period and may warrant investigation.

Do not write:

> H₂S leak confirmed at Region 2.

The passive badge provides exposure evidence, not source localization.

---

# 8. Exposure Data Model and Aggregation Logic

## 8.1 What is stored

For every worker, preserve:

```text
Individual reading data
Shift exposure
Daily exposure
Weekly exposure
Monthly exposure
Band cumulative exposure
Worker cumulative historical exposure
```

## 8.2 Two dose quantities — and why they are not computed the same way

Because Patch A's color change is permanent and cumulative (§B.2), a reading's calibrated dose — `calibration(ΔE of Patch A vs. Patch B)` — is always a **cumulative-since-issuance** number for that band, never a per-shift increment on its own. Two distinct quantities follow from that fact, and the system must not conflate them:

- **Band cumulative dose** = the calibrated dose of the band's *most recent* reading. It is read directly off that one reading — never summed from past shifts, because the strip never resets and each new reading's ΔE already contains every prior shift's contribution. A same-or-lower cumulative value on a later reading is itself a data-quality/tamper signal worth surfacing (see §12), not something to accept silently.
- **Shift exposure** (this shift's own contribution) = the *differential* between this shift's end-reading dose and this shift's start-reading dose:

```text
shift_exposure_low  = max(0, end_dose_low  - start_dose_high)
shift_exposure_high = max(0, end_dose_high - start_dose_low)
```

Subtracting low-from-high and high-from-low (rather than midpoint-from-midpoint) keeps the shift estimate conservative under interval arithmetic; flooring at zero absorbs measurement noise that could otherwise produce a spurious negative differential.

This differential computation is the **default MVP behavior**, not a "future" enhancement — it follows directly from the chemistry, not from a hypothetical future scientific model. Implement it once in the exposure domain service; never let a UI component or a raw SQL sum reduce this to a simple addition.

## 8.3 Band-level accumulation

Worked example, one band used across three shifts:

```text
Band BND-001
Day 1  start dose 0.0–0.5    end dose 3.0–3.6   -> shift exposure 2.5–3.6
Day 2  start dose 3.0–3.6    end dose 7.4–8.5   -> shift exposure 3.8–5.5
Day 3  start dose 7.4–8.5    end dose 10.2–11.6 -> shift exposure 1.7–4.2

Band cumulative (= Day 3 end dose, taken directly) = 10.2–11.6 ppm·h
```

Band cumulative is **not** `sum(Day 1 + Day 2 + Day 3 shift exposures)` — that would double-count, since each day's raw reading already includes every prior day's accumulated color change. (An earlier draft of this document summed independent per-day numbers this way; see §A item 1.)

The numerical implementation must preserve lower/upper uncertainty bounds:

```text
band_cumulative_low
band_cumulative_high
```

rather than reducing history to one fake-precise number.

## 8.4 Worker-level accumulation

Worker cumulative history spans all bands *that worker has ever used*. Unlike band-level accumulation, summing across different bands genuinely is correct, because each new band starts its own Patch A at zero:

```text
Band 001 final cumulative: 10.8–12.4
Band 002 final cumulative: 41.0–44.2
Band 003 (current) cumulative: 17.2–19.0

Worker cumulative recorded exposure:
69.0–75.6 ppm·h
```

The display should clarify whether a value is:

- the sum of each band's own cumulative dose (long-term worker total, §8.4)
- the sum of shift-level differential exposures in a selected period (daily/weekly/monthly, §8.5–§8.7)

These are two different, both-valid views of the same history and must not be silently mixed on screen.

## 8.5 Daily aggregation

Daily exposure is the sum of **shift-level differential** exposure estimates (§8.2) from completed shifts assigned to that worker/date — never the sum of raw end-reading cumulative values.

Store:

```text
date
worker_id
exposure_low
exposure_high
reading_count
shift_count
high_event_count
critical_event_count
```

## 8.6 Weekly aggregation

Week must use a single consistent ISO-week or company-defined calendar. Default recommendation: ISO week. Sums the same shift-level differential values as §8.5, grouped by week.

Store:

```text
week_start
week_end
worker_id
exposure_low
exposure_high
reading_count
shift_count
```

## 8.7 Monthly aggregation

Same differential-summation rule as §8.5–§8.6, grouped by month.

Store:

```text
year
month
worker_id
exposure_low
exposure_high
reading_count
shift_count
```

## 8.8 Avoid double counting

Do not sum both start and end state readings as two exposure events, and do not sum raw end-reading (cumulative) values across multiple shifts on the same band as if they were independent increments (§8.2–§8.3).

The operational model is:

```text
START READING  = this shift's baseline cumulative-dose reading
END READING    = this shift's ending cumulative-dose reading
SHIFT EXPOSURE = END reading's calibrated dose minus START reading's calibrated dose (§8.2)
```

Store both start and end readings, but keep the differential calculation inside the exposure domain service — never hard-code simplistic summation into the UI.

---

# 9. Measurement Engine

## 9.1 Architecture

Create a standalone package/module:

```text
packages/measurement-engine/
```

It must be usable from:

- browser UI
- server/API
- automated tests
- future native application

It must not import:

- React
- Next.js UI components
- Supabase client
- database ORM
- browser DOM APIs

It may depend on pure math/image-processing utilities if those utilities are platform-neutral.

## 9.2 Pipeline

```text
Image
  ↓
Image quality validation
  ↓
Patch sampling
  ↓
Patch A RGB
Patch B RGB
Patch C RGB
  ↓
RGB → XYZ
  ↓
XYZ → CIE L*a*b*
  ↓
Patch A Lab / Patch B Lab
  ↓
ΔE calculation
  ↓
Patch C condition classification
  ↓
Calibration lookup
  ↓
Dose range interpolation
  ↓
Saturation/out-of-range detection
  ↓
Confidence assessment
  ↓
Measurement result
```

## 9.3 Image input

The measurement engine should accept an image plus metadata rather than directly owning camera logic.

Example:

```ts
interface MeasurementInput {
  imageSource: ImageSource;
  patchPoints: {
    A: Point;
    B: Point;
    C: Point;
  };
  calibration: CalibrationConfig;
  badge: BadgeMeasurementContext;
  environment?: EnvironmentContext;
  capture: CaptureContext;
}
```

## 9.4 Patch sampling

For the MVP, use manual tap-to-sample as defined in the supplied app guide.

Algorithm:

1. Render captured image to a processing canvas.
2. Map CSS/display coordinates to image pixel coordinates.
3. For each point, sample a configurable square around the point.
4. Clamp sample rectangle to image bounds.
5. Reject empty/invalid samples.
6. Return averaged RGB values.

Recommended default sample size:

```text
20 × 20 px
```

Make this configurable because actual camera resolutions will vary.

## 9.5 Patch A

Patch A is the exposed dose strip.

Store:

```text
rgb_raw
lab
sample_point
sample_size
```

## 9.6 Patch B

Patch B is the sealed same-batch unexposed reference. It serves two roles:

1. **White-point baseline.** The software compares Patch A against Patch B to reduce sensitivity to absolute starting color differences between badge batches and to lighting variation at read time.
2. **Tamper/seal-integrity check.** Patch B should never itself show meaningful color change, because it is hermetically sealed and never exposed to H₂S. Compare Patch B's Lab value at read time against its expected unexposed baseline (from batch/calibration metadata, §11.2). If Patch B has drifted beyond a configured tolerance, the badge's seal was likely compromised before it was ever worn — flag the reading as low-confidence/invalid via the same validation pipeline used for Patch C (§12), and surface a distinct reason code (e.g. `PATCH_B_BASELINE_DRIFT`) rather than silently treating it as a normal reading.

## 9.7 Patch C

Patch C is the humidity/condition indicator.

First implementation:

```text
NORMAL
WARNING
COMPROMISED
UNKNOWN
```

The threshold/reference colors must be determined experimentally.

The code path must support future:

```text
humidity_correction_factor
```

without claiming that the first hackathon build has scientifically validated correction.

---

# 10. Color Science Specification

## 10.1 sRGB to linear RGB

Use the standard sRGB transfer function:

```text
c = c / 255

if c <= 0.04045:
    linear = c / 12.92
else:
    linear = ((c + 0.055) / 1.055)^2.4
```

## 10.2 Linear RGB to XYZ

Use D65 sRGB conversion coefficients from the supplied build guide:

```text
X = 0.4124564R + 0.3575761G + 0.1804375B
Y = 0.2126729R + 0.7151522G + 0.0721750B
Z = 0.0193339R + 0.1191920G + 0.9503041B
```

## 10.3 XYZ to CIE L*a*b*

Use D65 reference white:

```text
Xn = 0.95047
Yn = 1.0
Zn = 1.08883
```

With:

```text
f(t) = t^(1/3)                    if t > 0.008856
       7.787t + 16/116           otherwise
```

Then:

```text
L = 116f(Y/Yn) - 16
a = 500(f(X/Xn) - f(Y/Yn))
b = 200(f(Y/Yn) - f(Z/Zn))
```

## 10.4 ΔE method

The supplied guide's MVP uses Euclidean distance in Lab (CIE76):

```text
ΔE = sqrt((L1-L2)^2 + (a1-a2)^2 + (b1-b2)^2)
```

Implement this behind an interface:

```ts
calculateDeltaE(labA, labB, method = "CIE76")
```

A future CIEDE2000 implementation can be introduced without changing the domain API.

---

# 11. Calibration Engine

## 11.1 Concept

The app maps color response to an **estimated dose range**.

The calibration table must never be treated as universally valid. It belongs to a specific chemistry/badge batch/version under defined test conditions.

## 11.2 Calibration metadata

Each calibration version should include:

```text
id
version_label
chemistry_version
badge_batch_scope
created_at
approved_at
approved_by
valid_from
valid_until (optional)
notes
source/test metadata
```

## 11.3 Calibration points

A point contains at least:

```text
delta_e
dose_low_ppm_h
dose_high_ppm_h
```

Optional later fields:

```text
exposure_concentration_ppm
exposure_duration_h
temperature_c
humidity_percent
sample_count
stddev / uncertainty
```

## 11.4 MVP interpolation

The supplied guide uses sorted ΔE points and linear interpolation for the demo.

Conceptually:

```text
Given p1=(de1, low1, high1)
      p2=(de2, low2, high2)

fraction = (de - de1) / (de2 - de1)

low  = low1  + fraction * (low2  - low1)
high = high1 + fraction * (high2 - high1)
```

## 11.5 Demo-only placeholder calibration

The supplied guide contains these placeholder demo points:

```text
ΔE     doseLow    doseHigh
0      0          0.5
6.3    1          2.5
13.2   2.5        5
25     5          10
55.5   10         20
```

These may be used only in `DEMO_MODE=true` or another clearly labeled prototype mode. They are **not production validation data**.

## 11.6 Calibration selection

Preferred hierarchy:

```text
Band
  -> batch
  -> chemistry version
  -> calibration version
  -> active calibration points
```

If no matching calibration exists:

```text
Do not silently fall back to another chemistry/batch calibration in production.
Return CALIBRATION_UNAVAILABLE.
```

For the hackathon demo, fallback may be enabled only when the UI explicitly shows `DEMO CALIBRATION`.

## 11.7 Sub-perceptibility ΔE

ΔE ≈ 3.3 is the commonly cited threshold below which a human eye cannot reliably distinguish two colors (§B.4). Below a configurable `deltaEPerceptibilityFloor` (default `3.3`, overridable per calibration version), the engine must not interpolate a manufactured nonzero dose. Instead it should report a distinct zero-exposure state — e.g. `measurementStatus: "BELOW_PERCEPTIBILITY"`, displayed as "No measurable exposure yet" rather than a numeric range. This is a change from naive linear interpolation starting at `ΔE = 0`, which would otherwise report a small but fake-precise nonzero dose for imperceptible color differences that are more likely camera/lighting noise than real signal.

---

# 12. Measurement Confidence and Validation

## 12.1 Validation philosophy

The system must decide not only:

> What dose does this color map to?

but also:

> Can we trust this reading enough to present it as an operational estimate?

## 12.2 Validation layers

```text
1. Image quality
2. Patch visibility / sample validity
3. Patch B baseline drift (seal/tamper check, §9.6)
4. Patch C condition
5. Color calculation validity
6. Calibration availability
7. Calibration range
8. Saturation detection
9. Consistency checks
10. Confidence score/classification
```

## 12.3 Image quality checks

Implement configurable checks for:

- minimum resolution
- excessive darkness
- excessive brightness
- blur estimate
- clipping/highlight glare estimate where feasible
- invalid image decode

The first version can use heuristic thresholds. Keep them configurable.

## 12.4 Confidence levels

Required:

```text
HIGH
MEDIUM
LOW
INVALID
```

Illustrative meaning:

### HIGH

Image/patches are valid, calibration exists, ΔE is inside the validated range, Patch C is normal, and no major quality issue is detected.

### MEDIUM

A usable estimate exists but one non-fatal concern is present.

### LOW

An estimate may exist, but uncertainty or validation concern is significant.

### INVALID

The software must not present an exposure estimate as operationally reliable.

## 12.5 Result behavior

### High confidence

```text
Estimated cumulative exposure
5.2–6.4 ppm·h

Confidence: HIGH
```

### Medium confidence

```text
Estimated cumulative exposure
5.2–6.4 ppm·h

Confidence: MEDIUM
Warning: Patch C condition indicates environmental uncertainty.
```

### Low confidence

```text
Estimated exposure
5.2–8.0 ppm·h

Confidence: LOW
Review recommended.
```

### Invalid

```text
READING INVALID

No reliable dose estimate was produced.
Reason: <reason>

[ RETAKE PHOTO ]
```

---

# 13. Saturation / Measurement Limit

## 13.1 User decision

If the strip reaches a state where further exposure no longer produces a reliably distinguishable/calibrated color change, the application should show a warning such as:

```text
Estimated exposure: 40–50+ ppm·h

STRIP SATURATION DETECTED
Value is above the validated measurement range.
Band should be retired.
```

Exact numerical wording must use the active calibration's upper limit, not a hard-coded fake production limit.

## 13.2 Saturation detection inputs

Potential indicators:

- ΔE beyond final calibrated point
- color distance entering a known saturation plateau
- channel compression / low incremental change between expected response bands
- calibration metadata explicitly declaring a saturation boundary

For the MVP, use the calibration metadata and ΔE out-of-range behavior. Advanced saturation modeling can be added later.

## 13.3 Retirement event

When saturation is confirmed:

```text
band.status = RETIRED
band.retirement_reason = MEASUREMENT_SATURATION
```

Do not silently overwrite the last valid reading.

---

# 14. Capture and Camera Specification

## 14.1 Preferred capture mode

The UI should prefer rear-camera capture with flash/torch enabled where supported.

Browser camera controls vary by phone/browser. Therefore implement two paths:

### Path A: live camera

Use `getUserMedia()` on supported devices.

Attempt to enable torch/flash if the browser/device exposes the capability.

Conceptual behavior:

```ts
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: { ideal: "environment" } }
});

// If ImageCapture/track constraints expose torch support,
// attempt to turn torch on.
```

### Path B: file input fallback

Use:

```html
<input type="file" accept="image/*" capture="environment">
```

This is a required fallback because not every mobile browser exposes controllable torch APIs.

## 14.2 Flash requirement UX

The UI must say:

> Use flash/controlled illumination when your phone supports it.

It must **not** claim:

> All phone flashes are identical.

The app must treat the flash as a repeatability aid, not as proof that every device has identical optical characteristics.

## 14.3 Capture guide

Before capture:

```text
┌───────────────────────────────┐
│ Camera preview                │
│                               │
│      [ badge guide box ]      │
│                               │
│ A • B • C should be visible   │
└───────────────────────────────┘

Flash: ON / unavailable
Avoid glare
Hold steady

[ CAPTURE ]
```

## 14.4 Post-capture crop/zoom

The manager should be able to:

- zoom
- pan
- retake
- confirm points

The original image must remain available for audit/reanalysis if retention is enabled.

---

# 15. Manual Patch Sampling UX

## 15.1 Sample sequence

For the MVP:

```text
1. Tap Patch A — dose strip
2. Tap Patch B — sealed reference
3. Tap Patch C — condition/humidity indicator
```

## 15.2 UI prompt

```text
STEP 1 OF 3
Tap the center of Patch A
```

Then:

```text
STEP 2 OF 3
Tap the center of Patch B
```

Then:

```text
STEP 3 OF 3
Tap the center of Patch C
```

## 15.3 Point confirmation

After each tap, show a circle marker.

Allow:

```text
[ UNDO ]
[ RETAKE PHOTO ]
```

## 15.4 Sampling result preview

Before submitting:

```text
A  RGB 123, 77, 150
B  RGB 98, 82, 145
C  RGB 210, 180, 190

Patch checks: PASS

[ PROCESS READING ]
```

Raw RGB values can be hidden behind `Details` on mobile.

---

# 16. Reading Object Contract

A reading must contain enough information to reconstruct the result context.

Recommended TypeScript shape:

```ts
export type ReadingType = "START" | "END";

export type Confidence = "HIGH" | "MEDIUM" | "LOW" | "INVALID";

export type PatchCStatus = "NORMAL" | "WARNING" | "COMPROMISED" | "UNKNOWN";

export type MeasurementStatus =
  | "VALID"
  | "BELOW_PERCEPTIBILITY"
  | "WARNING"
  | "OUT_OF_RANGE"
  | "SATURATED"
  | "INVALID"
  | "CALIBRATION_UNAVAILABLE";

export interface ReadingResult {
  valid: boolean;
  measurementStatus: MeasurementStatus;
  confidence: Confidence;

  deltaE?: number;

  doseLowPpmH?: number;
  doseHighPpmH?: number;

  patchA?: {
    rgb: [number, number, number];
    lab: [number, number, number];
  };

  patchB?: {
    rgb: [number, number, number];
    lab: [number, number, number];
  };

  patchC?: {
    rgb: [number, number, number];
    lab: [number, number, number];
    status: PatchCStatus;
  };

  calibrationVersion: string;
  outOfRange: boolean;
  saturationDetected: boolean;
  reasons: string[];
}
```

## 16.1 Stored reading metadata

In addition to `ReadingResult`, persist:

```text
reading_id
company_id
worker_id
band_id
shift_id
manager_user_id
reading_type
captured_at
work_date
plant_id
region_id
work_area_id
working_day_index
image_storage_reference (if enabled)
image_hash
capture_device_metadata (minimal, privacy-safe)
flash_used / torch_requested / torch_supported if available
patch points
patch sample size
raw RGB values
Lab values
ΔE
calibration version
result/status/confidence
estimated dose low/high
band cumulative low/high after reading
worker cumulative low/high after reading
```

---

# 17. Start vs End Reading Semantics

## 17.1 Start reading

Purpose:

- establish shift-start state
- record the band's cumulative-dose reading at the moment the worker begins the shift (this is the baseline the shift's own contribution will be measured against, per §8.2)
- associate initial badge condition with this shift
- provide an audit trail

The start reading is never treated as its own exposure dose added to the worker's cumulative exposure — it is one term in the §8.2 differential calculation, not an event in its own right.

## 17.2 End reading

Purpose:

- establish end-of-shift badge state
- derive the shift's estimated exposure as the differential between this reading's calibrated dose and the shift's start reading's calibrated dose (§8.2) — the raw end-reading dose is the band's *new cumulative* value, not the shift's exposure by itself
- update band cumulative exposure (set directly from this reading, per §8.3 — not incremented)
- update worker historical/daily/weekly/monthly aggregates (using the shift-level differential, per §8.5–§8.7)
- trigger alert evaluation
- determine band health/retirement

## 17.3 Implementation note

The start-vs-end differential in §8.2 is the default MVP computation, required from day one — it is not a "future" or optional refinement, because it follows directly from the chemistry (Patch A's color change is irreversible and never resets between shifts). Implement it in the measurement engine/exposure domain service, never in the UI layer.

---

# 18. Database Schema

The following logical tables are required. Names may vary slightly by ORM conventions, but the concepts are mandatory.

## 18.1 companies

```text
id UUID PK
name TEXT NOT NULL
code TEXT UNIQUE NOT NULL
status TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## 18.2 users

```text
id UUID PK
company_id UUID FK
email TEXT
name TEXT
role TEXT
status TEXT
last_login_at TIMESTAMPTZ
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Auth-provider identity should be linked securely; do not store passwords manually if using a managed auth provider.

## 18.3 workers

```text
id UUID PK
company_id UUID FK
worker_code TEXT NOT NULL
full_name TEXT NOT NULL
employee_hr_id TEXT
phone TEXT
email TEXT
department TEXT
designation TEXT
plant_id UUID FK
default_region_id UUID FK
default_work_area_id UUID FK
supervisor_worker_id UUID FK nullable
shift_group TEXT
joining_date DATE
status TEXT
custom_fields JSONB nullable
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Unique index:

```text
(company_id, worker_code)
```

## 18.4 plants

```text
id UUID PK
company_id UUID FK
name TEXT
code TEXT
created_at TIMESTAMPTZ
```

## 18.5 regions

```text
id UUID PK
plant_id UUID FK
name TEXT
code TEXT
status TEXT
created_at TIMESTAMPTZ
```

## 18.6 work_areas

```text
id UUID PK
region_id UUID FK
name TEXT
code TEXT
status TEXT
created_at TIMESTAMPTZ
```

## 18.7 band_batches

```text
id UUID PK
company_id UUID FK
batch_code TEXT UNIQUE
chemistry_version TEXT
manufacture_date DATE
shelf_life_days INTEGER
nominal_expiry_date DATE
calibration_version_id UUID FK nullable
notes TEXT
created_at TIMESTAMPTZ
```

## 18.8 bands

```text
id UUID PK
company_id UUID FK
band_code TEXT UNIQUE NOT NULL
worker_id UUID FK NOT NULL
batch_id UUID FK
qr_version INTEGER
qr_payload TEXT
issued_at TIMESTAMPTZ
first_used_at TIMESTAMPTZ
retired_at TIMESTAMPTZ
status TEXT
retirement_reason TEXT
working_day_count INTEGER DEFAULT 0
current_cumulative_low NUMERIC
current_cumulative_high NUMERIC
current_confidence TEXT
last_reading_id UUID nullable
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Important database invariant:

```text
worker_id on an existing band cannot be updated to another worker.
```

Enforce this at the service layer and, if practical, with database policy/trigger protections.

## 18.9 shifts

```text
id UUID PK
company_id UUID FK
worker_id UUID FK
band_id UUID FK
manager_user_id UUID FK
plant_id UUID FK
region_id UUID FK
work_area_id UUID FK
shift_group TEXT
started_at TIMESTAMPTZ
ended_at TIMESTAMPTZ
status TEXT
working_day_index INTEGER
start_reading_id UUID nullable
end_reading_id UUID nullable
exposure_low NUMERIC nullable
exposure_high NUMERIC nullable
confidence TEXT nullable
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Statuses:

```text
PLANNED
ACTIVE
COMPLETED
CANCELLED
INVALID
```

## 18.10 readings

```text
id UUID PK
company_id UUID FK
worker_id UUID FK
band_id UUID FK
shift_id UUID FK
manager_user_id UUID FK
reading_type TEXT
captured_at TIMESTAMPTZ
work_date DATE
plant_id UUID FK
region_id UUID FK
work_area_id UUID FK
working_day_index INTEGER
image_storage_path TEXT nullable
image_hash TEXT nullable
capture_metadata JSONB
patch_points JSONB
patch_sample_size INTEGER
patch_a_rgb JSONB
patch_b_rgb JSONB
patch_c_rgb JSONB
patch_a_lab JSONB
patch_b_lab JSONB
patch_c_lab JSONB
delta_e NUMERIC nullable
patch_c_status TEXT
measurement_status TEXT
confidence TEXT
calibration_version_id UUID nullable
dose_low_ppm_h NUMERIC nullable
dose_high_ppm_h NUMERIC nullable
saturation_detected BOOLEAN DEFAULT FALSE
out_of_range BOOLEAN DEFAULT FALSE
reasons JSONB
created_at TIMESTAMPTZ
```

## 18.11 exposure_daily

```text
id UUID PK
company_id UUID FK
worker_id UUID FK
date DATE
exposure_low_ppm_h NUMERIC
exposure_high_ppm_h NUMERIC
reading_count INTEGER
shift_count INTEGER
high_event_count INTEGER
critical_event_count INTEGER
updated_at TIMESTAMPTZ
```

Unique:

```text
(company_id, worker_id, date)
```

## 18.12 exposure_weekly

```text
id UUID PK
company_id UUID FK
worker_id UUID FK
iso_year INTEGER
iso_week INTEGER
week_start DATE
week_end DATE
exposure_low_ppm_h NUMERIC
exposure_high_ppm_h NUMERIC
reading_count INTEGER
shift_count INTEGER
high_event_count INTEGER
critical_event_count INTEGER
updated_at TIMESTAMPTZ
```

## 18.13 exposure_monthly

```text
id UUID PK
company_id UUID FK
worker_id UUID FK
year INTEGER
month INTEGER
exposure_low_ppm_h NUMERIC
exposure_high_ppm_h NUMERIC
reading_count INTEGER
shift_count INTEGER
high_event_count INTEGER
critical_event_count INTEGER
updated_at TIMESTAMPTZ
```

## 18.14 calibration_versions

```text
id UUID PK
company_id UUID FK
version_label TEXT
chemistry_version TEXT
batch_scope TEXT
status TEXT
valid_from DATE
valid_until DATE nullable
created_by UUID FK
approved_by UUID FK nullable
created_at TIMESTAMPTZ
notes TEXT
metadata JSONB
```

Statuses:

```text
DRAFT
ACTIVE
RETIRED
```

## 18.15 calibration_points

```text
id UUID PK
calibration_version_id UUID FK
delta_e NUMERIC
dose_low_ppm_h NUMERIC
dose_high_ppm_h NUMERIC
sequence INTEGER
metadata JSONB
```

## 18.16 threshold_versions

```text
id UUID PK
company_id UUID FK
version_label TEXT
status TEXT
elevated_config JSONB
high_config JSONB
critical_config JSONB
effective_from TIMESTAMPTZ
effective_until TIMESTAMPTZ nullable
created_by UUID FK
created_at TIMESTAMPTZ
```

## 18.17 alerts

```text
id UUID PK
company_id UUID FK
worker_id UUID FK
band_id UUID FK nullable
shift_id UUID FK nullable
reading_id UUID FK nullable
plant_id UUID FK
region_id UUID FK
work_area_id UUID FK
severity TEXT
rule_id TEXT
message TEXT
threshold_version_id UUID FK nullable
status TEXT
requires_ack BOOLEAN
requires_action BOOLEAN
acknowledged_by UUID FK nullable
acknowledged_at TIMESTAMPTZ nullable
action_type TEXT nullable
action_notes TEXT nullable
resolved_by UUID FK nullable
resolved_at TIMESTAMPTZ nullable
created_at TIMESTAMPTZ
```

Statuses:

```text
OPEN
ACKNOWLEDGED
RESOLVED
ESCALATED
INVALIDATED
```

## 18.18 audit_logs

```text
id UUID PK
company_id UUID FK
actor_user_id UUID FK
entity_type TEXT
entity_id UUID
action TEXT
before_json JSONB nullable
after_json JSONB nullable
metadata JSONB
created_at TIMESTAMPTZ
```

Audit important events such as:

- worker creation
- band issuance
- start shift
- end shift
- reading creation
- alert creation
- alert acknowledgement
- alert resolution
- band retirement
- calibration activation
- threshold configuration change

---

# 19. Database Integrity Constraints

Mandatory constraints:

1. `band_code` unique within company.
2. `worker_code` unique within company.
3. A band must have exactly one worker after issuance.
4. A band cannot have two simultaneous active workers.
5. A worker should not have more than one active band unless company policy explicitly permits it; default policy: one active band per worker.
6. A worker should not have more than one active shift at a time in the standard MVP.
7. A shift's band must belong to that shift's worker.
8. End reading must belong to the active shift.
9. A retired/expired/compromised band cannot start a new operational shift.
10. Historical readings cannot be hard-deleted through normal UI.
11. Calibration versions are immutable once active; create a new version for changes.
12. Threshold versions are immutable once effective; create a new version for changes.

---

# 20. API Contract

The implementation can use Next.js route handlers or another TypeScript API layer, but the logical contracts below should remain stable.

## 20.1 Authentication

```http
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

`GET /api/auth/me` returns:

```json
{
  "user": {
    "id": "uuid",
    "name": "Shift Manager",
    "role": "SHIFT_MANAGER",
    "companyId": "uuid"
  }
}
```

## 20.2 Workers

```http
POST /api/workers
GET /api/workers
GET /api/workers/:workerId
PATCH /api/workers/:workerId
GET /api/workers/:workerId/summary
GET /api/workers/:workerId/readings
GET /api/workers/:workerId/bands
GET /api/workers/:workerId/shifts
```

Create request:

```json
{
  "workerCode": "WRK-001042",
  "fullName": "Aarav Kumar",
  "employeeHrId": "EMP-1042",
  "department": "Processing",
  "designation": "Technician",
  "plantId": "plant-1",
  "defaultRegionId": "region-2",
  "defaultWorkAreaId": "area-4",
  "supervisorWorkerId": null,
  "shiftGroup": "A",
  "joiningDate": "2026-08-29",
  "customFields": {}
}
```

## 20.3 Band scan

```http
POST /api/bands/resolve-qr
```

Request:

```json
{
  "qrPayload": "{...}"
}
```

Response for known band:

```json
{
  "band": {
    "id": "uuid",
    "bandCode": "BND-000381",
    "status": "ACTIVE",
    "workingDayIndex": 3,
    "batchId": "uuid",
    "cumulativeDose": {
      "low": 12.1,
      "high": 15.6
    }
  },
  "worker": {
    "id": "uuid",
    "workerCode": "WRK-001042",
    "fullName": "Aarav Kumar"
  },
  "activeShift": null,
  "allowedActions": ["START_SHIFT", "VIEW_WORKER"]
}
```

## 20.4 Issue band

```http
POST /api/bands/issue
```

Request:

```json
{
  "bandId": "uuid",
  "workerId": "uuid",
  "batchId": "uuid"
}
```

Server must check:

- band exists
- band is UNREGISTERED
- worker exists
- band is not already linked
- manager has permission

## 20.5 Start shift

```http
POST /api/shifts/start
```

Request:

```json
{
  "bandId": "uuid",
  "plantId": "uuid",
  "regionId": "uuid",
  "workAreaId": "uuid",
  "shiftGroup": "A"
}
```

Server determines:

- worker from band
- manager from session
- working-day index
- shift start timestamp

## 20.6 Analyze image

```http
POST /api/readings/analyze
```

Request can be multipart or signed-upload reference depending on storage architecture.

Logical body:

```json
{
  "imageReference": "...",
  "patchPoints": {
    "A": { "x": 100, "y": 120 },
    "B": { "x": 180, "y": 120 },
    "C": { "x": 250, "y": 120 }
  },
  "sampleSize": 20,
  "bandId": "uuid",
  "shiftId": "uuid",
  "readingType": "END"
}
```

Response:

```json
{
  "result": {
    "valid": true,
    "measurementStatus": "VALID",
    "confidence": "HIGH",
    "deltaE": 13.2,
    "doseLowPpmH": 2.5,
    "doseHighPpmH": 5.0,
    "patchC": {
      "status": "NORMAL"
    },
    "calibrationVersion": "CAL-2026-08-01-01",
    "outOfRange": false,
    "saturationDetected": false,
    "reasons": []
  }
}
```

This mirrors the `ReadingResult` TypeScript shape in §16 exactly (`patchC.status`, not a flat `patchCStatus`) so the frontend can type the API response directly against that interface without a translation layer.

## 20.7 Submit reading

```http
POST /api/readings
```

This endpoint creates the immutable reading record and triggers domain updates:

```text
save reading
 -> update shift if END
 -> update band cumulative
 -> update worker aggregate
 -> update daily/weekly/monthly aggregates
 -> evaluate alerts
 -> evaluate band lifecycle
 -> create audit record
 -> publish realtime event
```

This sequence must be transactional where practical.

## 20.8 End shift

```http
POST /api/shifts/:shiftId/end
```

Request:

```json
{
  "readingId": "uuid"
}
```

Response:

```json
{
  "shift": {
    "id": "uuid",
    "status": "COMPLETED",
    "exposure": {
      "low": 4.2,
      "high": 6.1
    }
  },
  "band": {
    "status": "ACTIVE",
    "workingDayIndex": 2,
    "cumulativeExposure": {
      "low": 8.4,
      "high": 11.5
    }
  },
  "worker": {
    "cumulativeExposure": {
      "low": 44.8,
      "high": 59.7
    }
  },
  "alertsCreated": []
}
```

## 20.9 Alerts

```http
GET /api/alerts
GET /api/alerts/:alertId
POST /api/alerts/:alertId/acknowledge
POST /api/alerts/:alertId/resolve
```

Critical acknowledgement request:

```json
{
  "actionType": "WORKER_REMOVED",
  "actionNotes": "Worker removed from affected work area and area investigation initiated."
}
```

## 20.10 Analytics

```http
GET /api/analytics/company
GET /api/analytics/exposure
GET /api/analytics/regions
GET /api/analytics/workers/:workerId
GET /api/analytics/bands/:bandId
GET /api/analytics/shifts
```

Query parameters should support:

```text
from
until
plantId
regionId
workAreaId
workerId
severity
bandId
```

---

# 21. Transactional End-of-Shift Processing

This is one of the most important backend workflows.

When the end reading is submitted:

```text
BEGIN TRANSACTION

1. Verify authenticated manager.
2. Load shift FOR UPDATE.
3. Verify shift status == ACTIVE.
4. Load band FOR UPDATE.
5. Verify band belongs to shift worker.
6. Verify band not already retired/invalid.
7. Validate reading belongs to this shift.
8. Insert immutable reading.
9. Calculate shift exposure result as the differential between this end reading's calibrated dose and this shift's start reading's calibrated dose (§8.2) — not the raw end-reading dose by itself.
10. Update shift END metadata.
11. Set band cumulative exposure directly from this end reading's calibrated dose (§8.3) — do not add to the previous cumulative value.
12. Update band working-day state.
13. Evaluate band measurement health.
14. Retire band if required.
15. Update worker daily aggregate.
16. Recompute/update weekly aggregate.
17. Recompute/update monthly aggregate.
18. Evaluate alert rules using the active threshold version.
19. Create safety events if triggered.
20. Add audit log.
21. Commit transaction.
22. Publish realtime events after successful commit.

END TRANSACTION
```

If any critical step fails, do not partially update exposure totals.

---

# 22. Alert Engine

## 22.1 Alert severity

Required:

```text
NORMAL
ELEVATED
HIGH
CRITICAL
```

## 22.2 Behavior

### NORMAL

Store reading. No alert.

### ELEVATED

- dashboard notification
- historical event if configured
- no mandatory acknowledgement by default

### HIGH

- create alert
- show Control Room alert
- acknowledgement required

### CRITICAL

- create urgent alert
- show Control Room alert prominently
- acknowledgement required
- corrective action required
- permanent safety-event record

## 22.3 Rule engine architecture

Do not hard-code every condition directly in UI components.

Create:

```text
packages/safety-rules/
```

Example:

```ts
interface ExposureRuleContext {
  reading: Reading;
  shift?: Shift;
  workerHistory: WorkerExposureSummary;
  bandState: BandState;
  thresholdConfig: ThresholdConfig;
}

interface AlertRuleResult {
  triggered: boolean;
  severity?: AlertSeverity;
  ruleId: string;
  requiresAcknowledgement: boolean;
  requiresAction: boolean;
  message?: string;
}
```

## 22.4 Future rule types

The architecture must support:

- shift exposure threshold
- daily cumulative threshold
- weekly cumulative threshold
- monthly cumulative threshold
- repeated elevated events
- rapid trend increase
- band compromise
- saturation
- calibration unavailable
- unusual regional pattern

Do not implement unsupported scientific rules as if they are validated. Use explicit feature flags/configuration.

---

# 23. Alert Acknowledgement UI

## 23.1 High

```text
HIGH EXPOSURE

Worker: WRK-001042
Region: Processing
Shift: 08:00–16:00
Estimated shift exposure: 13.6–16.0 ppm·h

[ ACKNOWLEDGE ]
```

## 23.2 Critical

```text
CRITICAL EXPOSURE

Worker: WRK-001042
Region: Processing
Estimated exposure: 16.9–19.8 ppm·h

ACTION REQUIRED

( ) Worker removed from area
( ) Area investigation
( ) Safety review initiated
( ) False / invalid reading
( ) Other

Notes: __________________

[ ACKNOWLEDGE + RECORD ACTION ]
```

A critical alert cannot become `RESOLVED` without an action record.

---

# 24. Realtime Architecture

## 24.1 Goal

When a manager submits a completed reading:

```text
Manager phone
    ↓
Backend transaction
    ↓
Database commit
    ↓
Realtime event
    ↓
Control Room browser
    ↓
KPI/graph/alert updates
```

## 24.2 Realtime event types

Examples:

```text
reading.created
shift.completed
band.status_changed
alert.created
alert.updated
worker.exposure_updated
region.metrics_updated
```

## 24.3 Client behavior

Control Room should:

- update visible KPI cards
- prepend latest activity
- update alert badge
- refresh affected graph/summary data

Avoid reloading every page/table on every event. Update the smallest relevant cache/query where possible.

## 24.4 Fallback

If realtime is unavailable:

- poll relevant Control Room endpoints at a modest interval
- show `Live updates: reconnecting` state
- never show stale data as if it were live without indication

---

# 25. Control Room Analytics

## 25.1 Required analytical dimensions

The platform must support analysis by:

```text
Company
Plant
Region
Work Area
Worker
Shift
Band
Band Batch
Date
Week
Month
Severity
```

## 25.2 Required charts

### Chart 1 — Exposure trend

X-axis: date/time
Y-axis: estimated ppm·h

Use a range representation where possible:

```text
dose low
  |
  |   █ range █
  |  ██████████
  |__________________ time
```

If the charting library supports range bands, use them. Otherwise display midpoint plus confidence annotation, but do not hide the original range from details.

### Chart 2 — Region comparison

Compare cumulative/average recorded exposure by region.

### Chart 3 — Work-area comparison

Identify areas with persistent elevated measurements.

### Chart 4 — Alert frequency

Counts by severity over time.

### Chart 5 — Worker exposure history

Daily/weekly/monthly.

### Chart 6 — Band lifecycle

- active bands
- retired bands
- average working days before retirement
- saturation retirement frequency

### Chart 7 — Environmental context

Only show temperature/humidity relationship graphs when valid environment data and validated interpretation exist.

Do not imply correlation/causation automatically.

## 25.3 Time filters

Required:

```text
Today
7 days
30 days
This month
Custom
```

## 25.4 Region ranking

A useful Control Room panel:

```text
Potential exposure hotspots

1. Region 4   elevated pattern
2. Region 2   moderate pattern
3. Region 1   low pattern
```

Accompany with the sample size:

```text
Based on 84 readings from 31 workers.
```

Avoid ranking a region from one anomalous reading.

---

# 26. Worker Profile Detailed Specification

## 26.1 Header

```text
Aarav Kumar
WRK-001042
Department: Processing

Current Band: BND-000381
Status: ACTIVE
Band Day: 3/5
```

## 26.2 Exposure summary

```text
Today
4.8–6.2 ppm·h

This Week
18.7–24.1 ppm·h

This Month
54.2–68.9 ppm·h

Recorded Long-Term
122.8–154.0 ppm·h
```

The exact labels should communicate that the values are estimated recorded exposure, not direct gas concentration.

## 26.3 Band history

Table:

```text
Band        Issued       Days Used     Cumulative Dose     Retirement
BND-000381  28 Aug 2026  3/5           12.6–15.2           Active
BND-000355  24 Aug 2026  5/5           21.0–26.4           5-day limit
BND-000317  18 Aug 2026  4/5           17.2–20.1           Saturated
```

## 26.4 Daily history

```text
Date         Dose        Band        Region        Status
28 Aug       4.8–6.2     BND-381     Region 2      Normal
27 Aug       7.1–9.4     BND-381     Region 4      Elevated
26 Aug       2.2–3.1     BND-381     Region 2      Normal
```

## 26.5 Reading details

A detail drawer should expose the raw measurement metadata to authorized users:

```text
Timestamp
Reading type
Image reference
Patch A RGB/Lab
Patch B RGB/Lab
Patch C RGB/Lab/status
ΔE
Calibration version
Confidence
Validity reasons
Temperature
Humidity
Location
Band working day
```

---

# 27. Environment Data

## 27.1 MVP

Environment is optional and should not block the core workflow.

Potential fields:

```text
temperature_c
humidity_percent
source
captured_at
```

## 27.2 Patch C first role

Patch C is a local badge-condition indicator.

The first implementation should use it to determine:

```text
NORMAL / WARNING / COMPROMISED / UNKNOWN
```

## 27.3 Future compensation

The backend must be capable of storing environmental conditions and a future correction model such as:

```text
raw response
  -> environment correction
  -> calibrated response
  -> dose estimate
```

However, **do not invent a correction formula** without project calibration data.

## 27.4 Weather API

Not required for MVP.

If implemented later, external weather data must be marked as contextual data, not as direct ground truth for the badge reaction.

---

# 28. Location Model

## 28.1 Hierarchy

```text
Company
  -> Plant
      -> Region
          -> Work Area
```

## 28.2 Shift location

Every shift has:

```text
plant_id
region_id
work_area_id
```

The manager chooses these during start shift.

## 28.3 Manual override

If a worker's default area differs from the actual shift area:

```text
Default location: Region 2 / Area A
Actual shift location: Region 4 / Area C

[ USE DEFAULT ] [ SELECT ACTUAL LOCATION ]
```

Actual shift location wins for analytics.

## 28.4 GPS

Optional future feature.

Do not make GPS a dependency for operation because indoor industrial environments may produce poor GPS.

---

# 29. Security and Privacy

## 29.1 General

The platform contains worker identity and exposure information. Treat it as sensitive operational data.

## 29.2 Authentication

Use a managed auth mechanism where possible.

Recommended hackathon default:

```text
Supabase Auth
```

but the domain model must not directly depend on a vendor-specific user object.

## 29.3 Row-level authorization

If using Supabase/Postgres, use Row Level Security (RLS) so a user can access only their company's data and allowed role scopes.

## 29.4 QR security

QR contents are identifiers only.

Do not place:

- passwords
- tokens
- full medical data
- complete exposure history

inside QR codes.

## 29.5 Images

If photographs are stored:

- use private storage
- serve via short-lived signed URLs
- restrict access by company/role
- avoid exposing direct public object URLs

## 29.6 Auditability

Never silently mutate or delete a historical measurement.

Corrections should create an audit record.

---

# 30. Recommended Technology Stack

To make this handoff deterministic for an implementation agent, use these defaults unless the repository already establishes an equivalent stack.

## Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
```

## Backend

```text
Next.js route handlers / server actions
TypeScript
```

## Database/Auth/Realtime/Storage

```text
Supabase
PostgreSQL
Supabase Auth
Supabase Realtime
Supabase Storage
```

## Forms/Validation

```text
Zod
React Hook Form
```

## Charts

```text
Recharts
```

## QR

Use a maintained browser QR scanning library compatible with mobile camera access.

## State/query

Use a consistent client data layer such as TanStack Query if needed for cache synchronization. Keep domain logic outside query hooks.

## Testing

```text
Vitest / Jest equivalent for unit tests
Playwright for end-to-end tests
```

## Deployment

```text
Vercel for web
Supabase for backend services
```

This stack is an implementation choice to remove ambiguity for the build agent. The core architecture should remain portable.

---

# 31. Repository Structure

Use a modular monorepo-style structure where practical:

```text
h2s-monitoring-platform/
│
├── apps/
│   └── web/
│       ├── app/
│       │   ├── login/
│       │   ├── manager/
│       │   │   ├── page.tsx
│       │   │   ├── scan/
│       │   │   ├── workers/
│       │   │   ├── bands/
│       │   │   └── shifts/
│       │   ├── control-room/
│       │   │   ├── page.tsx
│       │   │   ├── workers/
│       │   │   ├── regions/
│       │   │   ├── analytics/
│       │   │   ├── alerts/
│       │   │   └── reports/
│       │   ├── admin/
│       │   └── api/
│       │
│       ├── components/
│       │   ├── camera/
│       │   ├── qr/
│       │   ├── worker/
│       │   ├── band/
│       │   ├── shift/
│       │   ├── readings/
│       │   ├── alerts/
│       │   ├── dashboard/
│       │   └── charts/
│       │
│       ├── lib/
│       │   ├── auth/
│       │   ├── api/
│       │   ├── supabase/
│       │   └── realtime/
│       └── public/
│
├── packages/
│   ├── measurement-engine/
│   │   ├── color/
│   │   ├── image/
│   │   ├── calibration/
│   │   ├── confidence/
│   │   ├── saturation/
│   │   └── index.ts
│   │
│   ├── band-domain/
│   │   ├── lifecycle.ts
│   │   ├── qr.ts
│   │   └── validity.ts
│   │
│   ├── exposure-domain/
│   │   ├── aggregation.ts
│   │   ├── worker-history.ts
│   │   └── band-history.ts
│   │
│   ├── safety-rules/
│   │   └── index.ts
│   │
│   ├── shared-types/
│   │   ├── worker.ts
│   │   ├── band.ts
│   │   ├── shift.ts
│   │   ├── reading.ts
│   │   └── alert.ts
│   │
│   └── config/
│
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── functions/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
├── .env.example
├── package.json
└── SETUP.md
```

---

# 32. Frontend Route Map

## Public

```text
/login
```

## Shift Manager

```text
/manager
/manager/scan
/manager/workers
/manager/workers/new
/manager/workers/[workerId]
/manager/bands
/manager/shifts
/manager/shifts/[shiftId]
/manager/reading/[readingId]
```

## Control Room

```text
/control-room
/control-room/workers
/control-room/workers/[workerId]
/control-room/regions
/control-room/regions/[regionId]
/control-room/bands
/control-room/bands/[bandId]
/control-room/shifts
/control-room/analytics
/control-room/alerts
/control-room/reports
```

## Admin

```text
/admin
/admin/users
/admin/company
/admin/locations
/admin/calibration
/admin/thresholds
/admin/audit
```

---

# 33. Reusable UI Components

## 33.1 Required components

```text
AppShell
AuthGuard
RoleGuard
QrScanner
CameraCapture
FlashStatus
PatchSamplingCanvas
PatchMarker
ImageQualityBadge
ReadingResultCard
ConfidenceBadge
BandStatusBadge
ExposureRange
AlertBadge
AlertCard
WorkerSummaryCard
BandSummaryCard
ShiftSummaryCard
ExposureChart
RegionRankingTable
RealtimeStatus
```

## 33.2 Domain vs UI separation

Never implement domain rules like:

```ts
if (band.workingDayCount >= 5) retireBand()
```

directly inside JSX.

Instead:

```ts
const decision = evaluateBandLifecycle(band, readingContext);
```

and render `decision`.

---

# 34. State Management Rules

Use three kinds of state:

## Server state

Workers, bands, shifts, readings, alerts, analytics.

Use API/query caching.

## Local UI state

Current QR scan, selected location, current camera frame, tap points, modal visibility.

## Domain state

Measurement result, lifecycle decision, safety result. Domain state should be pure and testable.

Do not duplicate the same canonical exposure number in many client-side stores. Server responses remain authoritative after mutation.

---

# 35. Error Handling Contract

All API errors should return a predictable structure:

```json
{
  "error": {
    "code": "BAND_ALREADY_ASSIGNED",
    "message": "This band is permanently linked to another worker.",
    "details": {}
  }
}
```

Recommended error codes:

```text
AUTH_REQUIRED
FORBIDDEN
WORKER_NOT_FOUND
BAND_NOT_FOUND
BAND_ALREADY_ASSIGNED
BAND_RETIRED
BAND_EXPIRED
BAND_COMPROMISED
ACTIVE_SHIFT_EXISTS
NO_ACTIVE_SHIFT
INVALID_QR
IMAGE_INVALID
IMAGE_TOO_DARK
IMAGE_TOO_BLURRY
PATCH_SAMPLE_INVALID
PATCH_B_BASELINE_DRIFT
PATCH_C_COMPROMISED
CALIBRATION_UNAVAILABLE
CALIBRATION_OUT_OF_RANGE
MEASUREMENT_INVALID
SHIFT_ALREADY_ENDED
READING_ALREADY_SUBMITTED
THRESHOLD_CONFIG_MISSING
INTERNAL_ERROR
```

---

# 36. User-Facing Error Messages

Do not expose stack traces.

Examples:

### Camera denied

```text
Camera access is required to read the wristband.

Please allow camera access and try again.
```

### Image quality

```text
PHOTO QUALITY TOO LOW

The image is too dark/blurred to produce a reliable reading.

Use flash/controlled illumination and retake the photo.
```

### Patch C compromised

```text
BADGE CONDITION WARNING

Patch C indicates that the badge may have been exposed to humidity or otherwise compromised.

The reading is not considered high-confidence.
```

### Calibration unavailable

```text
CALIBRATION UNAVAILABLE

No validated calibration is available for this band/batch.

Do not report a numerical dose from this scan.
```

### Saturation

```text
MEASUREMENT LIMIT REACHED

The strip is beyond the validated measurement range.
The band will be retired.
```

---

# 37. Offline Strategy

## 37.1 Goal

The application should remain useful if connectivity temporarily fails during an industrial shift.

## 37.2 MVP offline behavior

At minimum:

- app shell/PWA assets can load after prior use
- the measurement engine can run locally in the browser
- image sampling and color calculations can run without server access
- completed offline reading can be placed in a local queue

## 37.3 Sync queue

Local queued record example:

```json
{
  "localId": "local-uuid",
  "type": "END_READING",
  "createdAt": "...",
  "payload": {},
  "status": "PENDING"
}
```

When connectivity returns:

```text
PENDING
 -> UPLOADING
 -> CONFIRMED
```

or:

```text
PENDING
 -> CONFLICT
```

## 37.4 Offline restrictions

Do not allow offline operations that require authoritative server state if the result cannot be safely verified.

For example, permanent worker-band issuance should normally require server connectivity unless an explicit offline issuance protocol is later defined.

---

# 38. PWA

Implement PWA support where practical:

```text
manifest.json
service worker
offline shell
installable icon
```

This is useful for the phone-based workflow but must not compromise the standard web deployment.

---

# 39. Demo Mode

## 39.1 Purpose

The project must be demoable even if validated chemistry data is not available on the exact presentation day.

The supplied build guide explicitly suggests validating the software pipeline using artificial color swatches before controlled chemistry testing.

## 39.2 Demo mode must be clearly labeled

Header/banner:

```text
DEMO MODE — simulated calibration data
```

Never hide demo status.

## 39.3 Demo dataset

Create:

```text
Company: Demo H2S Industries
Plants: 2
Regions: 6–8
Work areas: 12+
Workers: 20–30
Bands: 40+
Shifts: 100+
Readings: 200+
Alerts: elevated/high/critical samples
```

The exact count can be smaller if performance is an issue, but the dataset should be rich enough to demonstrate trends.

## 39.4 Demo scenarios

Required scenarios:

### Scenario A — Normal worker

Low exposure over several days.

### Scenario B — Elevated region

Region 2 has repeated elevated exposure.

### Scenario C — High alert

Worker receives a high exposure event.

### Scenario D — Critical alert

Critical event requiring action.

### Scenario E — Saturated band

Band retires before day 5.

### Scenario F — Five-day retirement

Band reaches day 5 and retires normally.

### Scenario G — Multiple bands for one worker

Worker has 4–5 bands across a month.

## 39.5 Demo data generator

Implement a seed script or route that can reset the demo environment.

Example:

```bash
npm run seed:demo
npm run reset:demo
```

---

# 40. Reports and Export

## 40.1 MVP

CSV export is sufficient as a first implementation if time is limited.

Support exports for:

```text
Worker exposure history
Band history
Region exposure summary
Alert history
Shift history
```

## 40.2 Export columns

At minimum:

```text
Worker ID
Worker Name
Band ID
Date
Shift
Plant
Region
Work Area
Reading Type
Estimated Dose Low
Estimated Dose High
ΔE
Confidence
Calibration Version
Alert Severity
```

## 40.3 PDF reports

Optional after MVP.

---

# 41. Calibration Administration UI

## 41.1 Calibration list

```text
Calibration Version
Chemistry Version
Batch Scope
Status
Valid From
Created By
```

## 41.2 Calibration editor

Fields:

```text
Version label
Chemistry version
Batch scope
Notes

Points:
ΔE | Dose Low | Dose High
```

Buttons:

```text
[ SAVE DRAFT ]
[ ACTIVATE ]
```

Activation must create an audit event.

## 41.3 Activation rule

Once a calibration version is active, treat its points as immutable.

To change the table:

```text
Create new version
 -> review
 -> activate
```

Historical readings keep their calibration version reference.

---

# 42. Threshold Administration UI

## 42.1 Configurable threshold model

Do not hard-code scientific values into UI files.

Store configuration such as:

```json
{
  "elevated": {
    "shiftDoseLowThreshold": null,
    "shiftDoseHighThreshold": null
  },
  "high": {},
  "critical": {}
}
```

The exact structure can evolve as scientific requirements mature.

## 42.2 Versioning

Every reading/alert evaluation must know which threshold version was active.

If thresholds are changed tomorrow, yesterday's events remain historically tied to yesterday's rules.

---

# 43. Audit Trail

Every high-impact action should write an audit record.

Example:

```text
Actor: shift_manager_01
Action: BAND_ISSUED
Band: BND-000381
Worker: WRK-001042
Timestamp: ...
```

For a critical alert:

```text
Action: ALERT_ACKNOWLEDGED
Alert: ALT-0012
Actor: control_room_02
Action Type: WORKER_REMOVED
Notes: ...
```

Audit records should not be editable through normal UI.

---

# 44. Image Storage Policy

Because photographs can contain identifiable workers/workspaces, image retention must be configurable.

Recommended MVP:

```text
Store original reading image in private object storage.
Store image hash in DB.
Generate signed URL only for authorized detail views.
```

Future configuration:

```text
KEEP_FOREVER
KEEP_90_DAYS
KEEP_30_DAYS
NUMERICAL_ONLY
```

The numerical record must remain even if the original image is later deleted, unless company retention rules say otherwise.

---

# 45. Scientific Validation Boundary

## 45.1 Software must not invent validation

The software team must not claim:

- a specific detection limit
- a scientifically validated shelf life
- a validated humidity correction
- a validated exposure threshold
- a universal phone-camera correction

unless these values come from the project's validated test data.

## 45.2 Required experimental outputs

The chemistry/project team is expected to supply, as available:

```text
Calibration dataset
Concentration × duration conditions
Measured color response
Repeatability
Temperature/humidity context
Shelf-life test result
Badge batch data
Validated operating range
```

The application should accept these as configuration/data, not require code changes.

## 45.3 Shelf life

The physical project expects a stated shelf life such as 30 or 90 days after validation. The app should store:

```text
manufacture_date
nominal_expiry_date
```

and independently track:

```text
operational use lifetime <= 5 working days
```

These are different concepts.

---

# 46. Testing Strategy

## 46.1 Unit tests — measurement engine

Must test:

1. sRGB transfer function
2. RGB → XYZ
3. XYZ → Lab
4. RGB → Lab
5. ΔE calculation
6. calibration interpolation
7. exact point lookup
8. below-range result
9. above-range result
10. saturation decision
11. Patch C classification
12. confidence classification
13. invalid image handling

## 46.2 Known math tests

Use stable sample values so refactors cannot silently alter color science.

Tests should include:

```text
black -> expected Lab
white -> expected Lab
identical colors -> ΔE = 0
small change -> small ΔE
large change -> larger ΔE
```

## 46.3 Band lifecycle tests

Test:

```text
issue band
 -> start shift
 -> end shift
 -> day 1
 -> repeat to day 5
 -> retire
```

and:

```text
issue band
 -> day 2
 -> saturation
 -> retire early
```

## 46.4 Assignment tests

Verify:

```text
Band A -> Worker A
Attempt Band A -> Worker B
=> rejected
```

## 46.5 Worker history tests

Create:

```text
Worker A
Band 1
Band 2
Band 3
```

Verify all readings aggregate into one worker-level history.

## 46.6 Shift consistency tests

Verify:

- cannot end nonexistent shift
- cannot end someone else's shift
- cannot submit twice
- cannot use retired band
- cannot use another worker's band
- cannot create duplicate active shift

## 46.7 Alert tests

Test:

```text
normal -> no alert
elevated -> dashboard event
high -> acknowledgement required
critical -> acknowledgement + action required
```

## 46.8 API authorization tests

Test cross-company access denial.

## 46.9 E2E test

One golden end-to-end script:

```text
login
 -> create worker
 -> scan/register new band
 -> start shift
 -> capture reading fixture
 -> end shift
 -> verify exposure updated
 -> verify alert behavior
 -> verify Control Room update
```

---

# 47. Image Test Fixtures

Create fixture images or synthetic color panels for:

```text
PATCHES_NORMAL_LOW
PATCHES_NORMAL_MEDIUM
PATCHES_HIGH
PATCHES_SATURATED
PATCH_C_WARNING
PATCH_C_COMPROMISED
TOO_DARK
TOO_BLURRY
GLARE
PARTIAL_PATCH
```

Synthetic swatches are acceptable for validating the software pipeline, but they are not evidence that the chemistry itself performs that way.

---

# 48. Logging and Observability

The backend should log structured operational events.

Examples:

```text
AUTH_LOGIN_SUCCESS
AUTH_LOGIN_FAILURE
QR_RESOLVED
BAND_ISSUED
SHIFT_STARTED
READING_ANALYSIS_FAILED
READING_CREATED
BAND_RETIRED
ALERT_CREATED
ALERT_ACKNOWLEDGED
```

Never log:

- passwords
- auth tokens
- full sensitive QR payloads if avoidable
- unnecessary personal data

---

# 49. Performance Expectations

## Manager phone

The common scan workflow should feel responsive:

```text
QR scan -> worker loaded quickly
photo -> analysis result quickly
```

Image processing can occur locally before upload.

## Control Room

Initial dashboard should load with reasonable data volume and pagination.

Never fetch every historical reading into one browser page.

Use:

- pagination
- date filters
- aggregation queries
- server-side filtering

---

# 50. Accessibility

The UI should:

- have readable text
- maintain adequate contrast
- not rely only on color for exposure state
- use icons + labels
- support keyboard navigation on desktop Control Room
- have accessible form labels
- clearly identify alerts with text

Example:

Do not display only:

```text
🔴
```

Display:

```text
CRITICAL
```

as text.

---

# 51. Mobile UX Requirements

The Shift Manager experience is phone-first.

Design for:

```text
360–430 px width
portrait first
large touch targets
minimal typing
high visibility outdoors/industrial setting
```

The most common actions should fit within one or two taps after QR scan.

Use sticky action buttons where useful:

```text
[ CAPTURE ]
[ PROCESS READING ]
[ SUBMIT ]
```

---

# 52. Desktop UX Requirements

Control Room is desktop-first but should remain responsive.

Recommended:

```text
1280 px+
sidebar
multi-column KPI layout
large charts
filter bar
```

---

# 53. Design Language

The visual language should feel:

```text
Industrial safety
Modern technical system
Clear analytics
Trustworthy, restrained UI
```

Avoid:

- game-like graphics
- excessive gradients
- fake medical imagery
- dashboards filled with meaningless gauges

Exposure severity should be visually obvious but always accompanied by explicit text.

---

# 54. Recommended Color Semantics

Use a consistent semantic system:

```text
Normal     -> success
Elevated   -> warning
High       -> high-severity
Critical   -> danger
Invalid    -> neutral/error
```

Do not rely on exact colors as the only information channel.

---

# 55. Frontend Page Specifications

# 55.1 `/login`

Elements:

```text
Logo / project name
Email / Employee ID
Password
[ LOG IN ]
Error state
Loading state
```

After auth, redirect according to role.

# 55.2 `/manager`

Elements:

```text
Header
Primary Scan button
Register Worker button
Today's active shifts
Today's alerts
Recent activity
```

# 55.3 `/manager/scan`

Stages:

```text
QR
 -> worker/band resolution
 -> action selection
 -> location
 -> camera
 -> patch sampling
 -> analysis
 -> result
```

A stepper/progress indicator is recommended.

# 55.4 `/manager/workers/new`

Form + validation + save.

# 55.5 `/manager/workers/[workerId]`

Operational worker summary with history access.

# 55.6 `/control-room`

Dashboard with:

```text
KPI cards
trend chart
region ranking
active alerts
latest activity
```

# 55.7 `/control-room/workers/[workerId]`

Detailed longitudinal worker record.

# 55.8 `/control-room/regions`

Region comparison and hotspot analysis.

# 55.9 `/control-room/analytics`

Multi-filter analytical workspace.

# 55.10 `/control-room/alerts`

Open/acknowledged/resolved alerts with filters.

---

# 56. Camera Component Contract

```ts
interface CameraCaptureProps {
  onCapture: (image: Blob | File) => void;
  onError: (error: CaptureError) => void;
  preferFlash?: boolean;
  facingMode?: "environment" | "user";
}
```

The component reports:

```text
camera available
flash supported
flash requested
flash enabled
capture complete
```

It must not report `flash enabled` when the browser did not confirm it.

---

# 57. QR Scanner Component Contract

```ts
interface QrScanResult {
  rawValue: string;
}

interface QrScannerProps {
  onDetected: (result: QrScanResult) => void;
  onError: (error: QrError) => void;
}
```

After detection, stop scanning while processing to avoid duplicate requests.

---

# 58. Measurement Engine Service Contract

Recommended top-level API:

```ts
analyzeWristbandReading(input): ReadingResult
```

Internally:

```text
validateImage
samplePatches
convertColors
calculateDeltaE
classifyPatchC
lookupCalibration
estimateDose
checkSaturation
scoreConfidence
returnReadingResult
```

No database calls inside this function.

---

# 59. Exposure Domain Service Contract

```ts
calculateShiftExposure(params)
updateBandCumulative(params)
updateWorkerExposure(params)
calculateDailyAggregate(params)
calculateWeeklyAggregate(params)
calculateMonthlyAggregate(params)
```

All functions must operate on explicit input data and be deterministic.

---

# 60. Band Domain Service Contract

```ts
evaluateBandLifecycle(params)
canStartShift(band)
issueBand(band, worker)
retireBand(band, reason)
calculateWorkingDayIndex(history)
```

---

# 61. Safety Domain Service Contract

```ts
evaluateExposureRules(context)
createAlertFromRule(result)
acknowledgeAlert(alert, action)
resolveAlert(alert)
```

---

# 62. Build Order for Claude / Engineering Team

Implement in this order to minimize dependency conflicts.

## Phase 1 — Scaffold

- initialize repository
- configure TypeScript
- configure lint/format
- configure env handling
- configure Next.js app
- configure Supabase client
- configure shared types

Definition of done:

```bash
npm run lint
npm run build
```

both succeed.

## Phase 2 — Auth and roles

Implement:

- login
- session
- role-aware routing
- logout

## Phase 3 — Database migrations

Create:

- companies
- users
- workers
- plants
- regions
- work areas
- batches
- bands
- shifts
- readings
- aggregates
- calibration
- thresholds
- alerts
- audit logs

## Phase 4 — Worker management

Implement:

- create worker
- list/search worker
- worker profile

## Phase 5 — Band/QR management

Implement:

- QR resolve
- new band registration
- permanent assignment
- band detail
- lifecycle

## Phase 6 — Shift workflow

Implement:

- start shift
- location selection
- active shift
- end shift

## Phase 7 — Camera + patch sampling

Implement:

- camera
- flash/torch attempt
- fallback upload
- patch A/B/C tap workflow
- image quality checks

## Phase 8 — Measurement engine

Implement and test:

- RGB
- XYZ
- Lab
- ΔE
- calibration
- dose estimate
- confidence
- saturation

## Phase 9 — Reading persistence

Implement:

- start reading persistence
- end reading persistence
- transactional exposure updates

## Phase 10 — Worker longitudinal analytics

Implement:

- daily
- weekly
- monthly
- band cumulative
- worker cumulative

## Phase 11 — Alerts

Implement:

- rule engine
- elevated
- high
- critical
- acknowledgement
- action recording

## Phase 12 — Control Room

Implement:

- overview
- workers
- regions
- alerts
- analytics
- drill-downs

## Phase 13 — Realtime

Implement:

- reading event
- alert event
- KPI update
- activity feed

## Phase 14 — Demo mode

Implement:

- demo seed
- reset demo
- simulated calibration
- scenario navigation

## Phase 15 — Offline/PWA

Only after the core online flow works.

---

# 63. Team Parallelization

If several people are working simultaneously:

## Developer A — Manager frontend

Own:

```text
login UX
manager dashboard
QR scan
worker registration
band issue
shift flow
camera
patch sampling UI
```

## Developer B — Control Room frontend

Own:

```text
control room
worker profile
region view
analytics charts
alerts page
```

## Developer C — Backend/database

Own:

```text
migrations
RLS/auth
workers
bands
shifts
readings
aggregates
alerts
realtime
```

## Developer D — Measurement engine

Own:

```text
color math
ΔE
calibration
confidence
saturation
image tests
```

## Developer E — QA/integration (if available)

Own:

```text
e2e tests
seed/demo data
bug triage
integration testing
deployment
```

All developers must consume the shared domain types rather than inventing duplicate types.

---

# 64. Git Rules

Use:

```text
main
  |
  +-- develop (optional)
       |
       +-- feature/auth
       +-- feature/worker-management
       +-- feature/band-qr
       +-- feature/scan
       +-- feature/measurement-engine
       +-- feature/control-room
```

Commit messages should be meaningful:

```text
feat: add permanent band-worker assignment
feat: implement RGB to Lab conversion
feat: add end-shift transaction
fix: prevent duplicate end readings
```

Before merge:

```bash
npm run lint
npm test
npm run build
```

---

# 65. Environment Variables

`.env.example` should include placeholders similar to:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

DATABASE_URL=

NEXT_PUBLIC_ENABLE_DEMO_MODE=true
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_ENVIRONMENT_DATA=false
NEXT_PUBLIC_ENABLE_GPS=false
NEXT_PUBLIC_STORE_READING_IMAGES=true
NEXT_PUBLIC_ENABLE_EXTERNAL_NOTIFICATIONS=false
```

Never commit secrets.

---

# 66. Local Development Setup

## 66.1 Prerequisites

```text
Node.js LTS
Git
VS Code or equivalent
Modern browser
Android phone strongly recommended
```

## 66.2 Install

```bash
git clone <repo>
cd h2s-monitoring-platform
npm install
```

## 66.3 Configure

```bash
cp .env.example .env.local
```

Fill Supabase values.

## 66.4 Start

```bash
npm run dev
```

## 66.5 Database

Run migrations through the selected Supabase/SQL workflow.

Then seed demo data.

---

# 67. Suggested npm Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "seed:demo": "tsx scripts/seed-demo.ts",
    "reset:demo": "tsx scripts/reset-demo.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

The exact lint command may differ by framework version; keep the script names stable.

---

# 68. Demo Readiness Checklist

The hackathon demo must be able to perform the following without manual database edits during the presentation.

## Worker onboarding

```text
[ ] Login
[ ] Register new worker
[ ] Scan new band
[ ] Permanently assign band
[ ] Worker profile appears
```

## Start of shift

```text
[ ] Scan known band
[ ] Worker automatically appears
[ ] Select actual location
[ ] Start shift
[ ] Capture A/B/C
[ ] Save baseline reading
```

## End of shift

```text
[ ] Scan same band
[ ] Active shift automatically recognized
[ ] Capture A/B/C
[ ] Get ΔE
[ ] Get dose range
[ ] Get confidence
[ ] Update band cumulative
[ ] Update worker history
```

## Band lifecycle

```text
[ ] Working day increments correctly
[ ] Saturation retires band
[ ] Day 5 retires band
```

## Control Room

```text
[ ] New reading appears automatically
[ ] KPI updates
[ ] Worker exposure chart updates
[ ] Region statistics update
[ ] Alert appears
[ ] Alert acknowledgement works
[ ] Critical action record works
```

---

# 69. Definition of Done — Full MVP

The implementation is complete when all of the following are true:

### Identity

- shift manager authentication works
- worker registration works
- permanent QR→worker+band link works
- reassignment is blocked

### Shift workflow

- start shift works
- actual location can be selected per shift
- workers can rotate locations
- end shift works

### Measurement

- camera capture works on mobile
- flash/torch is attempted when supported
- fallback image upload works
- A/B/C sampling works
- RGB → Lab works
- ΔE works
- calibration works
- dose range works
- confidence works
- invalid/saturated states work

### Exposure history

- band day-by-day history works
- band cumulative exposure works
- worker history across many bands works
- daily aggregation works
- weekly aggregation works
- monthly aggregation works

### Safety

- elevated state works
- high alert works
- critical alert works
- acknowledgement works
- critical corrective action is recorded

### Control Room

- overview works
- worker analytics work
- region analytics work
- work-area analytics work
- alert feed works
- near-real-time updates work
- drill-down from company → region → worker → band → shift → reading works

### Reliability

- core domain tests pass
- e2e golden path passes
- database constraints prevent band reassignment
- no sensitive API endpoint is unauthenticated
- production build succeeds

---

# 70. Golden End-to-End Acceptance Scenario

Use this exact scenario for final QA.

```text
ACTOR: Shift Manager

1. Login.
2. Create worker WRK-001042.
3. Scan unregistered band BND-000381.
4. Assign it permanently to WRK-001042.
5. Select Plant A / Region 2 / Work Area 4.
6. Start shift.
7. Capture Patch A/B/C under flash/controlled illumination.
8. Save START reading.
9. Worker performs shift.
10. Scan BND-000381 at end of shift.
11. System identifies WRK-001042 automatically.
12. System identifies the active shift automatically.
13. Capture A/B/C.
14. Analyze image.
15. Display ΔE and estimated dose range.
16. Display confidence and badge-condition status.
17. Save END reading.
18. Update shift exposure.
19. Update band cumulative exposure.
20. Update worker cumulative history.
21. Update daily/weekly/monthly aggregate.
22. Evaluate safety rules.
23. If triggered, create alert.
24. Retire band if saturated or day 5 reached.
25. Control Room receives event in near-real-time.
26. Manager can open worker profile.
27. Manager can see the new shift and daily exposure.
28. Control Room can compare the worker's region with other regions.
```

---

# 71. What Claude Must NOT Do

Do not:

1. Build only a static dashboard mockup.
2. Skip the backend/database.
3. Store everything only in browser localStorage in the final platform.
4. Make the band reassignable.
5. Treat the QR code as authentication.
6. Sum start and end readings as two exposure doses without a validated domain rule.
7. Display a fake exact dose such as `7.384 ppm·h` when the model only supports an estimate/range.
8. invent scientific thresholds or calibration data as production truth.
9. claim that a region has a confirmed leak just because worker exposure is elevated.
10. make the Control Room dependent on manual page refresh only when realtime is enabled.
11. put all domain logic into one React component/file.
12. make environmental correction appear validated without test data.
13. silently discard raw color measurements needed for future recalibration.
14. allow a retired band to start a new operational shift.
15. allow a critical alert to be closed without an action record.

---

# 72. “80% as a Library” Architecture Requirement

This project was intentionally planned so that roughly 80% of the meaningful logic can be written once and reused.

The reusable portion should include:

```text
Color science
Image sampling
Image quality
Calibration
Dose estimation
Confidence scoring
Saturation logic
Band lifecycle
Exposure aggregation
Safety-rule evaluation
Shared data types
```

UI-specific logic belongs in the app layer.

Database-specific code belongs in repository/service adapters.

The goal is that future applications can do:

```ts
const result = analyzeWristbandReading(input);
```

without importing the entire Control Room application.

---

# 73. Future Expansion Hooks

The implementation must leave clean extension points for:

## Automatic patch detection

Replace manual tap selection with computer vision without changing the downstream measurement engine.

## Better ΔE

Add CIEDE2000 behind the same interface.

## Environmental correction

Add calibrated temperature/humidity correction.

## Batch calibration

Already modeled via `band_batches` and `calibration_versions`.

## Native mobile app

Reuse the measurement/domain packages.

## Multi-company SaaS

`company_id` exists across major tables.

## External notifications

Add notification adapters without changing safety rules.

## Advanced hotspot analytics

Add geospatial/location analytics while keeping current measured-vs-inferred language boundaries.

## Machine-learning assistance

If later added, ML must remain a separate inference layer and must not silently override validated deterministic color calculations.

---

# 74. Scientific/Product Language Rules for UI Copy

Use:

```text
Estimated cumulative exposure
Estimated dose
Recorded exposure estimate
Potential exposure hotspot
Measurement confidence
Outside calibrated range
Badge condition warning
```

Avoid unsupported claims such as:

```text
Exact H₂S concentration
Leak confirmed
Medical diagnosis
Guaranteed safe
Perfect measurement
Real-time gas concentration
```

The system measures a passive colorimetric response and estimates exposure from calibration.

---

# 75. Suggested App Information Architecture

```text
LOGIN
  |
  +-----------------------------+
  |                             |
SHIFT MANAGER              CONTROL ROOM
  |                             |
  +-- Scan Band                 +-- Overview
  +-- Register Worker           +-- Workers
  +-- Worker Search             +-- Regions
  +-- Shift Operations          +-- Work Areas
  +-- Reading History           +-- Shifts
                                +-- Bands
                                +-- Analytics
                                +-- Alerts
                                +-- Reports
                                      |
                                      +-- Drill into Worker
                                      +-- Drill into Band
                                      +-- Drill into Shift
                                      +-- Drill into Reading
```

---

# 76. Final Architecture Summary

The complete system is:

```text
                   ┌───────────────────────┐
                   │     SHIFT MANAGER     │
                   │                       │
                   │ Login                 │
                   │ QR Scan               │
                   │ Location selection    │
                   │ Camera + Flash        │
                   │ Patch A/B/C           │
                   └───────────┬───────────┘
                               │
                               v
                   ┌───────────────────────┐
                   │   MEASUREMENT ENGINE   │
                   │                       │
                   │ Image quality         │
                   │ RGB → XYZ → Lab       │
                   │ ΔE                    │
                   │ Calibration            │
                   │ Dose estimate          │
                   │ Confidence             │
                   │ Saturation             │
                   └───────────┬───────────┘
                               │
                               v
                   ┌───────────────────────┐
                   │   DOMAIN / BACKEND    │
                   │                       │
                   │ Workers               │
                   │ Bands                 │
                   │ Shifts                │
                   │ Readings              │
                   │ Exposure aggregates   │
                   │ Alerts                │
                   │ Audit                  │
                   └───────────┬───────────┘
                               │
                  ┌────────────┴────────────┐
                  │                         │
                  v                         v
        ┌───────────────────┐     ┌─────────────────────┐
        │ WORKER HISTORY    │     │    CONTROL ROOM     │
        │                   │     │                     │
        │ Daily             │     │ Company overview    │
        │ Weekly            │     │ Region analysis     │
        │ Monthly           │     │ Worker analytics    │
        │ Per-band          │     │ Alerts              │
        │ Long-term         │     │ Trends              │
        └───────────────────┘     │ Near-real-time      │
                                  └─────────────────────┘
```

---

# 77. Final Principle

The platform must preserve three layers of truth:

## Layer 1 — Raw measurement

```text
Image
RGB
Lab
ΔE
Patch status
Capture metadata
```

## Layer 2 — Calibrated estimate

```text
Estimated cumulative dose range
Calibration version
Working-day/band context
```

## Layer 3 — Operational interpretation

```text
Confidence
Alert severity
Band status
Worker trends
Regional patterns
```

Never collapse all three layers into one number.

The system should allow an engineer six months later to answer:

> “Why did the app produce this exposure estimate for this worker on this shift, using this band, under this calibration, and why did the system consider the result high/low confidence?”

That traceability is a core requirement, not an optional analytics feature.

---

# 78. Immediate Instructions to the Build Agent

When this file is handed to an implementation agent such as Claude, the expected behavior is:

```text
1. Read this entire document.
2. Create the repository structure.
3. Create the database migrations.
4. Create shared domain types.
5. Implement authentication and roles.
6. Implement workers.
7. Implement permanent band assignment.
8. Implement QR scan resolution.
9. Implement shift start/end workflows.
10. Implement camera/image capture.
11. Implement A/B/C patch sampling.
12. Implement the pure measurement engine.
13. Implement calibration.
14. Implement confidence/validity/saturation handling.
15. Implement transactional reading persistence.
16. Implement exposure aggregation.
17. Implement alerts.
18. Implement Control Room analytics.
19. Implement realtime updates.
20. Seed a rich demo environment.
21. Add automated tests.
22. Run build/lint/typecheck/tests.
23. Fix failures.
24. Verify the golden end-to-end acceptance scenario.
25. Only then polish the UI.
```

Do not wait for a future specification to implement the core system. Use `TBD` values as configurable data structures and clearly label demo defaults.

---

# 79. Source Alignment Notes

The supplied physical/app guide establishes the underlying badge concept and the initial software pipeline. Specifically, it describes a mobile web app, a camera input containing Patch A/B/C, manual taps to sample the patches, conversion from RGB to CIE Lab, ΔE between the exposed Patch A and sealed Patch B, a calibration table with dose ranges, local history for the simplest MVP, and future QR-linked per-batch calibration/environment features.

This engineering specification preserves those core elements and adds the team's later product decisions:

```text
Shift Manager login
Permanent band→worker assignment
Worker registration
Shift-specific location
Start/end shift sessions
Five-working-day maximum operational band life
Measurement-based early retirement
Longitudinal worker history across multiple bands
Daily/weekly/monthly exposure
Control Room
Near-real-time updates
Safety events
Configurable/versioned thresholds
```

The supplied guide's placeholder calibration values are explicitly treated as demo-only in this document. They must be replaced by validated project data before the product is represented as scientifically calibrated.

---

# 80. Final Acceptance Statement

This application is successful when a Shift Manager can take one real physical wristband from issuance through multiple shifts, the system can preserve the complete history of that physical band and the worker using it, and the Control Room can turn those individual passive colorimetric observations into an understandable longitudinal exposure picture by worker, shift, day, week, month, region, and work area.

The software is not merely a camera color reader.

It is a **worker-linked cumulative exposure record system built around a passive chemical sensor**.

