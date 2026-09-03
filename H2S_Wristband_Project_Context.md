# Project Context: Passive Colorimetric H₂S Exposure-Dosimeter Wristband with AI-Based Quantitative Reading

## 1. Project title

**Passive Colorimetric H₂S Exposure-Dosimeter Wristband with AI-Based
Quantitative Reading**

Alternative short title:

**Wearable Passive H₂S Exposure Dosimeter using Colorimetric Chemistry +
Smartphone AI**

------------------------------------------------------------------------

## 2. Core project idea

The project aims to develop a **low-cost, passive, wearable wristband
for monitoring a worker's cumulative exposure to hydrogen sulfide
(H₂S)**.

The wristband does not need electronics, a battery, or a pump for the
sensing portion.

Instead:

**H₂S in the environment → passive diffusion into reactive strip →
chemical reaction → progressive color change → smartphone image →
computer vision → CIELAB/ΔE analysis → calibrated AI/ML model →
estimated exposure → worker safety report/dashboard**

The key idea is to convert a normally subjective colorimetric gas
response into a **quantitative digital exposure estimate**.

The project is inspired by and uses the scientific foundation of this
research paper:

**"A Visual Color Response Test Paper for the Detection of Hydrogen
Sulfide Gas in the Air"**

Reference: https://pmc.ncbi.nlm.nih.gov/articles/PMC10343175/

The paper demonstrates a colorimetric H₂S sensing paper using **SbCl₃
and anthocyanin**, with measurable color changes and quantitative
analysis using color difference (ΔE). The paper reports detection down
to approximately **200 ppb** under its experimental conditions.

Important: the project should NOT simply claim that the paper's exact
calibration transfers directly to the wristband. The wristband geometry,
substrate, coating thickness, diffusion layer, humidity, temperature,
and other environmental factors can change the response. The actual
wristband must therefore be experimentally calibrated.

------------------------------------------------------------------------

# 3. The problem being solved

H₂S is a toxic gas encountered in several occupational environments.

Potentially affected workers include:

-   Oil and gas workers
-   Petrochemical and chemical-industry workers
-   Sewage and wastewater-treatment workers
-   Workers entering manholes, tanks, pits, and other confined spaces
-   Mining workers
-   Workers around animal waste and certain agricultural facilities

The problem is not only detecting whether H₂S is present.

For worker safety, it can also be important to understand **exposure
over time**.

A conventional electronic H₂S detector generally gives an instantaneous
concentration and/or alarm. A passive dosimeter, in contrast, is
intended to accumulate a response over a period of exposure.

Therefore, the project's central problem statement is:

> Workers in H₂S-prone environments need affordable personal exposure
> monitoring. Conventional electronic H₂S detectors can require power,
> electronics, calibration, maintenance, and relatively higher cost,
> while simple colorimetric indicators are often qualitative or
> semi-quantitative. There is therefore a need for a low-cost, passive,
> wearable H₂S exposure dosimeter that records exposure through a
> controlled colorimetric response and converts that response into a
> quantitative estimate using smartphone computer vision and AI.

------------------------------------------------------------------------

# 4. Important distinction: detector vs dosimeter

This distinction should be used in the project pitch.

## Conventional detector

Answers:

> **"How much H₂S is present right now?"**

Typical characteristics:

-   Electronic
-   Powered
-   Provides real-time readings
-   Can provide alarms
-   Requires calibration/maintenance

## Proposed dosimeter

Attempts to answer:

> **"What exposure has this worker accumulated over a defined period?"**

Typical characteristics:

-   Passive sensing
-   No battery required for the chemical sensing element
-   Color response accumulates with exposure
-   Smartphone reads the final/intermediate color
-   Software estimates exposure from calibration data
-   Worker-level exposure history can be stored

The proposed device should NOT initially be claimed as a replacement for
certified industrial H₂S alarms. It should be presented as a **low-cost
personal exposure-monitoring/dosimetry prototype**, subject to proper
validation before safety-critical use.

------------------------------------------------------------------------

# 5. Scientific foundation from the research paper

The research paper demonstrates the following general concept:

**H₂S → reactive colorimetric chemistry → visible color change →
measurable color difference → quantitative interpretation**

The paper investigated a colorimetric paper using **SbCl₃ +
anthocyanin**.

A useful formulation reported in the paper for further testing was
approximately:

-   **0.5 wt% SbCl₃**
-   **4 wt% anthocyanin**

The paper reported a detection limit around **200 ppb** under its
experimental conditions and showed that ΔE can be used to quantify color
changes.

The paper is therefore the **scientific sensing foundation**, not the
complete final product.

------------------------------------------------------------------------

# 6. What is new in our project compared with the paper?

The research paper mainly demonstrates a **colorimetric H₂S test
paper**.

Our proposed project extends that concept into a complete wearable
system:

  -----------------------------------------------------------------------
  Research paper                      Proposed project
  ----------------------------------- -----------------------------------
  Colorimetric test paper             Wearable wristband

  H₂S sensing                         Personal worker exposure monitoring

  Visible color response              Smartphone image capture

  Color measurement                   Computer vision

  ΔE analysis                         Calibrated quantitative exposure
                                      estimation

  Laboratory sensing concept          Wearable/field-oriented packaging

  Standalone strip                    Wristband with reference scale

  No worker database                  Worker exposure history

  No complete digital monitoring      App/dashboard/reporting
  system                              

  Research sensing principle          Chemical + hardware + software/AI
                                      system
  -----------------------------------------------------------------------

The project innovation is therefore the **integration and engineering of
the sensing chemistry into a passive wearable dosimeter and quantitative
smartphone-based analysis system**.

Do NOT claim that the underlying colorimetric H₂S chemistry itself is
completely new.

------------------------------------------------------------------------

# 7. Main proposed solution flowchart

## Concept of the proposed solution

``` text
H₂S in Environment
        ↓
Passive Diffusion into Wristband
        ↓
Reactive Colorimetric Strip
        ↓
Chemical Reaction with H₂S
        ↓
Progressive Color Change
        ↓
Smartphone Camera Capture
        ↓
Image Processing
        ↓
RGB → CIELAB
        ↓
ΔE Calculation
        ↓
Calibration / AI-ML Model
        ↓
Estimated Exposure
        ↓
Worker Safety Report / Dashboard
```

------------------------------------------------------------------------

# 8. Overall system flow

``` text
Wear Wristband
      ↓
Worker is exposed during shift
      ↓
H₂S reaches sensing strip
      ↓
Reactive strip changes color
      ↓
Worker/inspector scans strip using smartphone
      ↓
App detects the sensor region (ROI)
      ↓
Reference patch corrects lighting variation
      ↓
Color converted to CIELAB
      ↓
ΔE calculated
      ↓
Exposure time + environmental variables considered
      ↓
AI/ML calibration model
      ↓
Estimated cumulative exposure
      ↓
Risk classification + exposure history
      ↓
Dashboard / safety report
```

------------------------------------------------------------------------

# 9. How the wristband is physically structured

The proposed wristband can resemble the user's reference image.

The visible front can contain:

``` text
┌───────────────────────────────────────────────┐
│                                               │
│  QR CODE     EXPIRY PATCH    H₂S REACTIVE     │
│                              STRIP             │
│                                               │
│              REFERENCE SCALE                 │
│          R0   R1   R2   R3   R4              │
│                                               │
└───────────────────────────────────────────────┘
```

The uploaded reference image shows a wristband with:

-   QR code
-   Expiry patch
-   Reactive strip
-   Reference scale
-   Flexible wearable strap

The exact visual design can be refined later.

------------------------------------------------------------------------

# 10. Suggested wristband components

  -----------------------------------------------------------------------
  Component                           Purpose
  ----------------------------------- -----------------------------------
  Flexible wrist strap                Wearability

  Filter paper/cellulose substrate    Holds reactive chemistry

  Anthocyanin                         Colorimetric component

  SbCl₃                               H₂S-reactive chemical component

  Diffusion membrane                  Controls H₂S entry rate

  Protective porous membrane          Protects sensing layer from
                                      dust/contact

  Reference color patches             Correct smartphone/light variation

  Transparent window                  Allows optical scanning

  QR code                             Wristband/worker identification

  Expiry patch                        Indicates whether the wristband is
                                      within its intended validity period

  Backing layer                       Mechanical support

  Adhesive/lamination                 Holds layers together
  -----------------------------------------------------------------------

Important safety note:

SbCl₃ is a hazardous chemical. It should not be left as loose/exposed
chemical on a wearable device. For a prototype, the chemistry should be
immobilized appropriately and handled under suitable laboratory
supervision. Before real worker use, the device needs safety,
chemical-leaching, durability, and occupational validation.

------------------------------------------------------------------------

# 11. Proposed sensing-strip construction

A conceptual multilayer sensing region:

``` text
TOP
────────────────────────
Protective porous layer
────────────────────────
Diffusion-control layer
────────────────────────
Reactive colorimetric layer
(SbCl₃ + anthocyanin)
────────────────────────
Substrate / filter paper
────────────────────────
Backing layer
────────────────────────
BOTTOM
```

H₂S enters through the outer layers by diffusion and reaches the
reactive layer.

The response then develops as a color change.

------------------------------------------------------------------------

# 12. Colorimetric chemistry concept

The original project discussion considered the following general H₂S
colorimetric reaction concept.

H₂S interacts with the reactive chemical system and produces a visible
color response.

The exact reaction pathway should be described according to the selected
formulation and verified experimentally rather than oversimplified.

The key engineering relationship is:

**H₂S exposure → chemical transformation → optical color change**

The color change is what the smartphone analyzes.

------------------------------------------------------------------------

# 13. Why ΔE is important

A human may look at the strip and say:

> "It became darker."

That is subjective.

Instead, the smartphone captures the color numerically.

General workflow:

``` text
Camera image
    ↓
RGB values
    ↓
Color correction / normalization
    ↓
CIELAB
    ↓
ΔL*, Δa*, Δb*
    ↓
ΔE
```

ΔE provides a numerical representation of the color difference between
the exposed sensor and its reference/original state.

A conceptual dataset could look like:

    H₂S concentration   Exposure time   ΔE
  ------------------- --------------- ----
                  Low           Short    X
                  Low            Long    X
               Medium           Short    X
               Medium            Long    X
                 High           Short    X
                 High            Long    X

The actual values must come from experiments.

------------------------------------------------------------------------

# 14. Critical scientific point about ΔE

Do NOT claim:

> **ΔE = H₂S concentration**

That is too simplistic.

The sensor response can depend on:

-   H₂S concentration
-   Exposure time
-   Temperature
-   Relative humidity
-   Indicator concentration
-   Coating thickness
-   Diffusion resistance
-   Substrate
-   Storage conditions
-   Lighting during image acquisition

A better conceptual relationship is:

> **Color response = f(H₂S concentration, exposure time, environmental
> conditions, sensor properties)**

For a dosimeter, the desired output is closer to:

> **Estimated cumulative exposure/dose = f(color response + exposure
> duration + calibration/environmental variables)**

------------------------------------------------------------------------

# 15. Why the reference color scale is important

The wristband should contain reference color patches.

Example:

``` text
REFERENCE SCALE

R0      R1      R2      R3      R4
██      ██      ██      ██      ██
```

Initially, use labels such as:

**R0, R1, R2, R3, R4**

rather than immediately labeling them with ppm.

After experimental calibration, the software can associate color regions
with measured exposure ranges.

This is important because smartphone images vary with:

-   Sunlight
-   Indoor lighting
-   Yellow/white LEDs
-   Camera exposure
-   White balance
-   Shadows

The reference patch provides a built-in comparison.

------------------------------------------------------------------------

# 16. Smartphone + AI concept

The smartphone does NOT chemically detect H₂S.

The chemical strip responds to H₂S.

The smartphone/software interprets the response.

Recommended software pipeline:

``` text
Photograph wristband
        ↓
Detect QR code
        ↓
Identify sensor ROI
        ↓
Identify reference patch
        ↓
Lighting/reference correction
        ↓
Extract RGB features
        ↓
Convert to CIELAB
        ↓
Calculate ΔE
        ↓
Combine with exposure duration
        ↓
AI/ML model
        ↓
Exposure estimate
```

Possible model inputs:

-   ΔL\*
-   Δa\*
-   Δb\*
-   ΔE
-   Relative color ratios
-   Exposure duration
-   Temperature
-   Relative humidity
-   Reference-patch measurements

Possible outputs:

-   Estimated exposure
-   Exposure category
-   Valid/invalid reading
-   Confidence score
-   Worker exposure history

------------------------------------------------------------------------

# 17. Important AI positioning

Do NOT say:

> "AI detects H₂S."

Better:

> **"The chemical sensor responds to H₂S, while computer vision and AI
> convert the optical response into a quantitative exposure estimate."**

This is scientifically more accurate.

------------------------------------------------------------------------

# 18. Exposure/dose concept

A simple exposure concept is concentration integrated over time.

For a constant concentration:

**Dose ≈ concentration × time**

For example, conceptually:

**0.4 ppm × 8 hours = 3.2 ppm·h**

This illustrates why a dosimeter differs from an instantaneous detector.

However, the actual relationship between color response and dose must be
experimentally established. Do not assume the strip is perfectly linear
or that equal ppm·h exposures always produce identical colors.

------------------------------------------------------------------------

# 19. Why a passive wristband?

Advantages:

-   No battery required for the sensing element
-   No continuous electronics in the wristband
-   Lightweight
-   Low manufacturing complexity
-   Potentially inexpensive
-   Easy to distribute to workers
-   Can record exposure over a defined period
-   Smartphone can be used as the readout device
-   Digital records can be generated after scanning

The wristband is intended to make personal exposure monitoring more
accessible.

------------------------------------------------------------------------

# 20. Expiry patch

The wristband concept also contains a **7-day expiry/validity patch**.

Its purpose is NOT H₂S detection.

Its purpose is:

> **To indicate whether the sensing wristband is still within its
> validated operating period.**

The intended visual behavior could be:

``` text
DAY 0
VALID
🟢

      ↓

DAY 4–6
NEAR EXPIRY
🟡

      ↓

DAY 7
EXPIRED
🔴
```

Important:

A simple anthocyanin patch cannot automatically guarantee exactly 7
days. Temperature, humidity, formulation, layer thickness, and storage
conditions can alter its rate of change.

Therefore, the 7-day expiry patch must be experimentally calibrated.

------------------------------------------------------------------------

# 21. Expiry-patch method 1: humidity/environment-responsive anthocyanin patch

A simple experimental prototype:

``` text
Transparent cover
       ↓
Anthocyanin indicator paper
       ↓
Controlled moisture layer
       ↓
Backing
```

The patch gradually changes color under controlled environmental
exposure.

Concept:

``` text
Day 0 → initial color
Day 1–3 → small change
Day 4–6 → visible change
Day 7 → target expiry color
```

Calibration process:

``` text
Prepare multiple patch formulations
        ↓
Expose under controlled conditions
        ↓
Photograph every day
        ↓
Calculate ΔE
        ↓
Plot ΔE vs time
        ↓
Select formulation with desired 7-day endpoint
```

This is suitable as an experimental mini-project, but the exact 7-day
behavior must be demonstrated experimentally.

------------------------------------------------------------------------

# 22. Expiry-patch method 2: slow-diffusion chemical timer

A more engineered concept is a multilayer chemical timer.

Conceptual structure:

``` text
Transparent cover
        ↓
Indicator layer
        ↓
Gel/slow-diffusion layer
        ↓
Controlled chemical reservoir
        ↓
Barrier layer
        ↓
Backing
```

The chemical system changes gradually because diffusion is controlled.

The timing can potentially be tuned by:

-   Gel concentration
-   Layer thickness
-   Barrier thickness
-   Moisture content
-   Indicator concentration
-   Chemical composition

Concept:

``` text
Activation
    ↓
Slow diffusion/reaction
    ↓
Progressive color change
    ↓
Target 7-day endpoint
```

Again, this requires calibration.

------------------------------------------------------------------------

# 23. Expiry-patch method 3: commercial time indicator

For a practical prototype, a commercial time-temperature/time indicator
can be considered.

General concept:

``` text
Activation
   ↓
Controlled chemical progression
   ↓
Progressive color change
   ↓
Expiry indication
```

This may be more reliable than trying to invent an exact 7-day chemistry
during a short project.

------------------------------------------------------------------------

# 24. Expiry-patch method 4: digital QR-based validity

A very reliable prototype-level solution is to combine the physical
patch with a digital expiry system.

Example:

``` text
QR Code
   ↓
Wristband ID
   ↓
Activation date
   ↓
Current date
   ↓
Days used
   ↓
VALID / EXPIRED
```

Example record:

``` text
Wristband ID: WB024
Activation: 01/09/2026
Validity: 7 days
Expiry: 08/09/2026
```

This can prevent ambiguity even if the physical patch is still being
optimized.

------------------------------------------------------------------------

# 25. Recommended expiry strategy

For the prototype:

**Use two systems together:**

### Physical

A small experimental 7-day chemical/time indicator.

### Digital

QR code + app-based activation date and expiry calculation.

This provides redundancy.

For a 4-day experimental schedule, the digital expiry mechanism is the
easiest to demonstrate reliably while the physical 7-day patch remains a
calibrated prototype feature.

------------------------------------------------------------------------

# 26. How the solution addresses the problem

Use these concise points in a presentation:

### Problem → Solution

**Problem:** Electronic detectors can be expensive and powered.

**Solution:** Passive chemical sensing requires no battery in the
sensing strip.

------------------------------------------------------------------------

**Problem:** Instantaneous readings do not necessarily represent a
worker's cumulative exposure.

**Solution:** Progressive color response can act as an exposure record
over time.

------------------------------------------------------------------------

**Problem:** Visual color interpretation is subjective.

**Solution:** Smartphone imaging + CIELAB + ΔE provides numerical color
analysis.

------------------------------------------------------------------------

**Problem:** Smartphone lighting varies.

**Solution:** Built-in reference color patches support image
normalization/calibration.

------------------------------------------------------------------------

**Problem:** Workers may lack individual exposure histories.

**Solution:** QR-linked worker/wristband IDs can create digital exposure
records.

------------------------------------------------------------------------

**Problem:** Monitoring must be affordable and scalable.

**Solution:** Low-cost passive sensing + smartphone readout reduces
electronic hardware requirements.

------------------------------------------------------------------------

# 27. Innovation and uniqueness

Short points:

1.  **Wearable passive colorimetric H₂S dosimeter**
2.  **No battery/electronics required in the sensing element**
3.  **Smartphone-based quantitative color analysis**
4.  **CIELAB/ΔE-based objective reading**
5.  **Reference patch for lighting correction**
6.  **AI/ML-based exposure estimation**
7.  **Worker-specific exposure history**
8.  **QR-based wristband identification**
9.  **Physical + digital 7-day validity mechanism**
10. **Low-cost and potentially scalable design**

The strongest innovation is the integration:

> **Passive chemistry + wearable form factor + smartphone computer
> vision + AI-based quantitative exposure estimation**

------------------------------------------------------------------------

# 28. Who is affected?

Main target groups:

``` text
H₂S-prone environments
        ↓
┌──────────────────────────────┐
│ Oil & Gas                    │
│ Petrochemical/Chemical       │
│ Sewage/Wastewater            │
│ Mining                       │
│ Confined-space workers       │
│ Manholes/Tanks/Pits          │
│ Animal-waste facilities      │
└──────────────────────────────┘
```

The most important target users are workers who may experience repeated
or intermittent H₂S exposure and who could benefit from inexpensive
personal exposure monitoring.

------------------------------------------------------------------------

# 29. Statistics / number of affected people

Do NOT use an unsupported "exact number of H₂S-exposed workers" in the
final pitch.

A previous discussion mentioned figures such as "150--200 million
workers globally" and "over 10 million in India," but these should be
treated as **claims requiring source verification**, not as established
exact H₂S-specific statistics.

A safer presentation strategy is:

> **"H₂S exposure affects workers across oil & gas, petrochemical,
> wastewater, mining, and confined-space operations worldwide."**

If a single numerical statistic is required for SIH, find a current,
authoritative statistic specifically tied to the relevant occupational
sector (for example, number of workers in wastewater, oil & gas, or
hazardous/confined-space occupations) and clearly label it as the size
of the **potential target workforce**, not the number of workers proven
to be exposed to H₂S.

------------------------------------------------------------------------

# 30. Expected impact

``` text
Affordable personal monitoring
            ↓
More workers can be monitored
            ↓
Exposure becomes measurable
            ↓
Worker-specific exposure history
            ↓
Earlier identification of high exposure
            ↓
Better occupational safety decisions
```

Key impact points:

-   Makes personal exposure monitoring more accessible
-   Converts subjective color interpretation into numerical data
-   Supports worker-level exposure history
-   Can reduce dependence on electronics for basic exposure logging
-   Enables digital safety reporting
-   Can support data-driven occupational safety programs
-   Potentially scalable to large worker populations

Again, do not claim that the prototype itself "prevents H₂S deaths" or
is a certified safety replacement without validation.

------------------------------------------------------------------------

# 31. Recommended four-day prototype workflow

The project has previously been discussed under a tight experimental
timeline of approximately four days.

A practical plan:

## Day 1 --- Reactive strip

-   Prepare/test the colorimetric strip
-   Study the chosen chemistry
-   Establish baseline color
-   Test response under controlled conditions
-   Photograph samples

## Day 2 --- Wristband

-   Assemble the layers
-   Add reactive strip
-   Add reference scale
-   Add QR code
-   Add preliminary expiry patch
-   Create wearable prototype

## Day 3 --- Computer vision + calibration

-   Capture smartphone images
-   Detect ROI
-   Extract color
-   Convert RGB → CIELAB
-   Calculate ΔE
-   Build initial calibration dataset
-   Test regression/ML models

## Day 4 --- Expiry + final demonstration

-   Test the expiry-patch concept
-   Demonstrate QR validity
-   Complete dashboard/report
-   Compare prototype against reference measurements if available
-   Prepare final presentation

------------------------------------------------------------------------

# 32. Experimental calibration concept

The calibration dataset should contain controlled combinations of:

**H₂S concentration × exposure time**

For each exposure:

``` text
Known concentration
        +
Known exposure duration
        ↓
Expose sensor
        ↓
Photograph
        ↓
Extract color features
        ↓
Calculate ΔE
        ↓
Store ground-truth exposure
```

Dataset fields could include:

  --------------------------------------------------------------------------------------------------------
  Sample               H₂S   Exposure   Temperature      RH    ΔL\*    Δa\*    Δb\*      ΔE   Ground-truth
  ID         concentration       time                                                             exposure
  -------- --------------- ---------- ------------- ------- ------- ------- ------- ------- --------------

  --------------------------------------------------------------------------------------------------------

This becomes the basis for the AI/ML model.

------------------------------------------------------------------------

# 33. AI model concept

Potential models for an early prototype:

-   Linear regression
-   Polynomial regression
-   Random Forest
-   Gradient boosting
-   Support Vector Regression

Start simple.

First determine whether:

**ΔE vs exposure**

has a useful relationship.

Then compare more complex models.

The goal is not to use AI just for the sake of saying "AI."

The AI should provide a measurable improvement such as:

-   Better prediction accuracy
-   Compensation for environmental variables
-   More robust interpretation of nonlinear color response
-   Confidence/risk classification

------------------------------------------------------------------------

# 34. Very important calibration issue

Do not assume the research paper's calibration curve is directly usable.

The paper's sensor configuration and experimental conditions differ from
the wristband.

Your actual device introduces:

-   Diffusion layer
-   Protective membrane
-   Different substrate
-   Different coating thickness
-   Wearable orientation
-   Humidity effects
-   Temperature effects
-   Smartphone imaging effects

Therefore:

> **The final wristband needs its own calibration curve/model.**

The research paper provides the **scientific starting point**, not the
final calibration.

------------------------------------------------------------------------

# 35. Important validation requirement

A prototype should be compared against a known/reference H₂S measurement
method.

Conceptually:

``` text
Controlled H₂S environment
        ↓
Reference H₂S instrument
        +
Proposed wristband
        ↓
Reference concentration
        +
Measured color response
        ↓
Calibration/validation
```

The purpose is to determine:

-   Accuracy
-   Repeatability
-   Detection limit
-   Response time
-   Effect of temperature
-   Effect of humidity
-   Effect of diffusion layer
-   Sensor-to-sensor variation
-   Storage stability

For safety-critical deployment, appropriate occupational/industrial
standards and certified instrumentation would need to be considered.

------------------------------------------------------------------------

# 36. Major limitations to openly acknowledge

1.  Color response can depend on environmental conditions.
2.  Smartphone cameras differ between devices.
3.  Lighting can affect RGB values.
4.  The sensing chemistry can age during storage.
5.  The diffusion membrane changes response time.
6.  The color response may not be linear.
7.  Very high exposure may saturate the color response.
8.  Cross-sensitivity to other chemicals must be investigated.
9.  The 7-day expiry patch requires calibration.
10. The prototype should not replace certified H₂S alarms until properly
    validated.

Being transparent about these limitations makes the project more
scientifically credible.

------------------------------------------------------------------------

# 37. Recommended one-sentence pitch

> **We are developing a low-cost passive wearable H₂S exposure dosimeter
> in which H₂S produces a measurable colorimetric response, and a
> smartphone-based computer-vision/AI system converts that response into
> a quantitative estimate of the worker's cumulative exposure.**

------------------------------------------------------------------------

# 38. Recommended 30-second explanation

> "H₂S is a highly hazardous gas encountered in industries such as oil
> and gas, wastewater treatment, petrochemicals, mining and confined
> spaces. Existing electronic detectors are useful for real-time alarms,
> but they can be expensive and do not by themselves provide a simple
> low-cost way to build worker-level exposure history. Our solution is a
> passive wristband containing an H₂S-reactive colorimetric strip.
> During exposure, the strip changes color. A smartphone photographs the
> strip, uses a reference patch to correct lighting, converts the color
> into CIELAB/ΔE values, and an AI/ML calibration model estimates the
> worker's cumulative exposure. The wristband can also use a QR code and
> validity indicator to maintain worker-specific records."

------------------------------------------------------------------------

# 39. Recommended simple diagrams for presentations

## Diagram A --- Concept

``` text
H₂S
 ↓
Wristband
 ↓
Color Change
 ↓
Smartphone
 ↓
AI
 ↓
Exposure
```

## Diagram B --- Problem to solution

``` text
Expensive/Powered Monitoring
          ↓
Limited Personal Exposure Data
          ↓
Subjective Color Indicators
          ↓
        NEED
          ↓
Passive + Wearable + Quantitative
          ↓
Our H₂S Dosimeter
```

## Diagram C --- Innovation

``` text
Colorimetric Chemistry
          +
Wearable Wristband
          +
Reference Scale
          +
Smartphone Computer Vision
          +
AI/ML
          ↓
Quantitative Passive H₂S
Exposure Dosimeter
```

## Diagram D --- Worker impact

``` text
Worker
  ↓
H₂S Exposure
  ↓
Wristband records response
  ↓
Smartphone scan
  ↓
Exposure estimate
  ↓
Digital history
  ↓
Better safety decision
```

## Diagram E --- Expiry

``` text
Activate
   ↓
7-day validity period
   ↓
Physical patch changes
   +
QR/app tracks time
   ↓
VALID / EXPIRED
```

------------------------------------------------------------------------

# 40. How to describe the project's uniqueness without overclaiming

Good wording:

> "Our novelty lies in integrating a passive H₂S colorimetric sensing
> layer into a wearable exposure-dosimeter architecture and coupling it
> with smartphone computer vision and AI-based quantitative
> interpretation."

Avoid:

> "We invented the first H₂S color sensor."

Avoid:

> "No existing H₂S detector uses color."

Avoid:

> "Our wristband completely replaces electronic H₂S detectors."

Avoid:

> "The device gives exact H₂S ppm under all conditions."

------------------------------------------------------------------------

# 41. Key terms to consistently use

Use:

-   Passive H₂S dosimeter
-   Colorimetric sensing
-   Cumulative exposure
-   Exposure dose
-   Smartphone computer vision
-   CIELAB
-   ΔE
-   Reference patch
-   Calibration
-   AI/ML exposure estimation
-   Worker exposure history
-   Low-cost wearable
-   Personal exposure monitoring

Avoid using "real-time detector" unless the system actually provides
continuous real-time quantitative measurements.

------------------------------------------------------------------------

# 42. Final project architecture

``` text
                    ┌──────────────────┐
                    │ H₂S Environment  │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Passive Diffusion│
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Reactive Strip   │
                    │ SbCl₃ +          │
                    │ Anthocyanin      │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Color Change     │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Smartphone       │
                    │ Image Capture    │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Reference        │
                    │ Correction       │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ RGB → CIELAB     │
                    │ → ΔE             │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ AI/ML Calibration│
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Exposure Estimate│
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Worker Dashboard │
                    │ History/Report    │
                    └──────────────────┘
```

------------------------------------------------------------------------

# 43. Final takeaway

The project should be understood as a **system**, not merely a chemical
strip.

The research paper provides:

**H₂S → color change → measurable ΔE**

The project adds:

**wearable packaging + diffusion control + reference scale + smartphone
imaging + computer vision + AI/ML + worker identification + exposure
history + validity/expiry system**

Therefore the complete concept is:

> **A low-cost passive wearable platform that transforms chemical H₂S
> exposure into a digital, quantitatively interpretable worker-exposure
> record.**
