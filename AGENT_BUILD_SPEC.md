# Agent Build Spec — "Kavach" (कवच) H2S Exposure Advisory Chatbot

> **Suggested local name: `Kavach`** (Hindi/Sanskrit: "shield" / "armor"). It's short, easy to say on a shop floor, translates naturally across Indian languages, and fits the protective/safety framing better than a generic "Sentinel-H2S" label. Suggested full branding: **`Kavach-H2S`** (e.g. "Kavach bataya ki aaj TWA 1.7 ppm hai" in casual usage).
> Alternatives if you want something else: `Prahari` (प्रहरी — sentinel/watchman), `Rakshak` (रक्षक — protector), `Suraksha Mitra` (सुरक्षा मित्र — safety friend), or keep `Sentinel-H2S` if you want an English/technical brand.
>
> This doc uses **Kavach** as the working name — find/replace if you pick a different one.

---

## 0. Purpose of this file

This is the implementation brief for the coding agent (Claude Code / engineer) building the Kavach chatbot system described in the source PRD. It restates the requirements in build-order, with explicit module boundaries, schemas, and acceptance criteria so the agent can scaffold and implement without re-deriving architecture decisions.

**Non-negotiable design principle:** the LLM never does math or makes statutory tier decisions. All dosimetry math (kinetic correction, TWA, rolling loads, tier classification) happens in deterministic backend code *before* the LLM is called. The LLM's job is strictly: (a) conversational intake, (b) turning computed numbers + retrieved regulatory text into empathetic, correctly-prioritized, bilingual guidance. If this boundary blurs anywhere in the implementation, that's a bug.

---

## 1. System Overview

**Domain:** occupational health & safety — passive colorimetric H2S dosimeter wristbands + AI advisory layer for refinery workers (pilot target: MRPL, Mangalore).

**Two operating modes:**
1. **Onboarding Mode** — one-time conversational intake building a worker's clinical + operational baseline profile.
2. **Post-Scan Advisory Mode** — triggered on shift-end badge scan; computes exposure, classifies statutory risk tier, and generates prioritized bilingual guidance for the worker and their supervisor.

**Two consumers of output:**
- **Worker View** — plain-language, symptom- and PPE-focused.
- **Shift Supervisor View** — engineering/compliance-focused (leak locations, unit tags, OISD forms).

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| LLM inference | `llama-3.3-70b-versatile` via Groq API (cloud); fallback to on-prem vLLM (`Qwen-2.5-32B-Instruct` or `Llama-3.3-70B`) for air-gapped zones |
| Structured output | `instructor` + Pydantic, patched onto the Groq client |
| DB | PostgreSQL (worker profiles, exposure ledgers, scan logs) |
| Retrieval | Hybrid RAG — dense (`bge-large-en-v1.5`) + sparse (BM25) + cross-encoder reranker (`bge-reranker-large`), with CRAG-style relevance filtering (threshold 0.85) |
| Weather/env | Open-Meteo API, fallback to MRPL DCS environmental stations |
| Report output | Auto-generated PDF (OISD/DGMS incident form) |
| Languages | English + Hindi (Devanagari), full bilingual toggle |

---

## 3. Build Order (recommended milestones)

### Milestone 1 — Data layer
- [ ] Define Pydantic models for Worker Profile, Shift Scan/Telemetry, and LLM structured output (schemas in §5 below — lift directly from PRD §3).
- [ ] Set up PostgreSQL schema + migrations for worker profiles, exposure ledgers (7d/30d/90d rolling), scan logs.
- [ ] Write ledger update logic: on each new scan, recompute rolling 7/30/90-day cumulative ppm·hr.

### Milestone 2 — Deterministic kinetic + statutory engine (no LLM involved)
- [ ] `get_kinetic_weather(lat, lon)` — fetch T/RH from Open-Meteo, compute Arrhenius+moisture scaling factor `k(T,RH)`.
- [ ] Dose compensation: `compensated_dose = raw_optical_dose / k_factor`.
- [ ] TWA: `twa_ppm = compensated_dose / shift_hours`.
- [ ] Tier classification per the fixed thresholds (Tier 1/2/3 — see §4).
- [ ] Unit test this module exhaustively with edge cases (zero shift hours, missing weather API, boundary values exactly at 1.0/5.0/15.0/35.0/20.0).

### Milestone 3 — RAG corpus + retrieval
- [ ] Ingest and chunk: OISD-STD-105, OISD-STD-155 (I & II), OISD-STD-166/114, DGMS PME circulars, NIOSH/ACGIH H2S dose-response docs, MRPL SOPs.
- [ ] Build hybrid retrieval (dense + BM25) with cross-encoder rerank.
- [ ] Implement CRAG-style filter: drop chunks scoring below 0.85 relevance; on empty result set, fall back to a static deterministic protocol table (do NOT let the LLM free-generate regulatory claims).

### Milestone 4 — Onboarding conversational flow
- [ ] Implement the intake system prompt (§6.1) as a stateful multi-turn flow.
- [ ] Parse free-text/voice answers into the validated Worker Profile Pydantic object.
- [ ] Bilingual prompting — detect or ask worker's language preference up front.
- [ ] Never let this flow emit anything diagnostic — it collects facts only.

### Milestone 5 — Post-scan advisory flow
- [ ] Wire deterministic engine output + worker profile + RAG context into the advisory system prompt (§6.2).
- [ ] Call Groq (`instructor`-patched) with `response_model=DosimeterAdvisoryPayload`, `temperature=0.1`.
- [ ] Enforce ascending priority order in output validation (reject/re-prompt if LOW comes after MANDATORY, etc.) — don't trust the model to always get ordering right; validate server-side.
- [ ] Render dual views (Worker / Supervisor) from the same payload.

### Milestone 6 — Guardrails & overrides
- [ ] Hard backend override: if deterministic tier == CRITICAL (TIER 3), force-display mandatory OHC referral banner in the UI regardless of what the LLM produced (belt-and-suspenders — the LLM should already say this, but never rely on it alone for a safety-critical flag).
- [ ] Restrict LLM output to first-aid/PPE/triage language only — no prescription dosages, no diagnoses. Add a lightweight output classifier or prompt-based self-check for this before rendering.

### Milestone 7 — Flagship intelligence features (stretch, build after core loop is solid)
1. **Leak triangulation** — aggregate multi-worker shift readings by plant sub-zone, run 2D Gaussian Process / IDW to produce a fugitive-emission heatmap.
2. **Neuro-olfactory screener** — short interactive reflex/smell-check dialogue (H2S causes olfactory fatigue ≥5 ppm).
3. **Chronic lung-risk model** — combine 90-day rolling exposure + age + smoking pack-years + baseline spirometry into a 0–100 risk score (this is a scoring model, not a diagnostic tool — keep the framing careful).
4. **1-click OISD/DGMS incident PDF** — auto-fill from weather logs, calibration curves, exposure history, corrective-action checklist.

---

## 4. Statutory Tier Logic (deterministic — implement exactly as below)

```
TIER 1 (NORMAL):   TWA < 1.0 ppm            AND  7-day load < 15.0 ppm·hr
TIER 2 (CAUTION):  1.0 ppm <= TWA < 5.0 ppm  OR   15.0 <= 7-day load < 35.0 ppm·hr
TIER 3 (CRITICAL): TWA >= 5.0 ppm            OR   7-day load >= 35.0 ppm·hr
                                             OR   any single-shift dose > 20.0 ppm·hr
```

Recommendation matrix (always ascending order in output):

| Level | Tag | Scope |
|---|---|---|
| 1 | `[LOW / SELF-CARE]` | Eye saline flush, 15–20 min rest in positive-pressure room, skin wash, hydration |
| 2 | `[RECOMMENDED / OPERATIONAL]` | Cartridge replacement, half-mask reseal, report fugitive leaks, shift rotation |
| 3 | `[MANDATORY / CLINICAL]` | OHC referral, spirometry/peak-flow, arterial O2 check, OISD Form-A filing |

---

## 5. Core Schemas (Pydantic)

Lift these directly — they're already well-specified in the source PRD:

- **Worker Profile** — demographics, department, role, `health_profile` (smoking status, pre-existing conditions, baseline FEV1/FVC, allergies), `ppe_details` (respirator/cartridge type, last fit-test date), `exposure_ledger` (7d/30d/90d rolling ppm·hr, lifetime shifts logged).
- **Shift Scan & Telemetry** — scan_id, worker_id, timestamp, shift_duration_hours, badge_data (raw optical density ΔE, shelf-life status, uncompensated dose), environmental_telemetry (lat/lon, T, RH, pressure, k-factor), computed_metrics (compensated dose, TWA, updated 7-day load, statutory tier).
- **LLM Structured Output** — `RecommendationItem` (priority_level: Literal of the 3 tags, category, action_item, regulatory_reference) and `DosimeterAdvisoryPayload` (summary_banner, worker_id, shift_twa_ppm, rolling_7day_ppm_hr, severity_tier, recommendations: List[RecommendationItem] strictly ascending, triage_question, supervisor_actions: List[str]).

(Full field definitions and example JSON are in the original PRD §3 — implement verbatim.)

---

## 6. System Prompts

### 6.1 Onboarding/Intake prompt (summary)
Greet by name → sequentially collect plant unit/duties, respiratory history, smoking + ocular sensitivities, respirator model + fit-test status → validate & summarize → support English/Hindi → **never diagnose, only collect baseline occupational-hygiene facts.**

### 6.2 Shift Advisory prompt (summary)
Ground strictly in [Worker Profile] + [Computed Metrics] + [Retrieved RAG Context] — never invent regulatory clauses or thresholds. Enforce ascending priority order. Personalize to known conditions (e.g. allergic rhinitis → extra caution on respiratory recommendations). Cite OISD-STD-105/155/166 or ACGIH benchmarks where applicable. Respond strictly in the requested language.

(Full prompt text is in the original PRD §4 — use verbatim as the system message; do not let the agent paraphrase away the grounding/ordering constraints.)

---

## 7. Safety & Compliance Guardrails (must be enforced in code, not just prompt text)

1. **Deterministic override lock** — CRITICAL tier always forces the mandatory-referral UI banner server-side, independent of LLM output.
2. **Clinical scope restriction** — no prescription dosages, no diagnoses, ever. First aid / PPE / triage only.
3. **Data sovereignty** — worker profiles and exposure logs stay on on-prem PostgreSQL; air-gapped deployments must be able to swap Groq Cloud for an on-prem vLLM cluster with equivalent quantized open-weight models.
4. **RAG-or-fallback** — if retrieval confidence is below threshold, fall back to the static protocol table rather than letting the model free-generate compliance language.

---

## 8. Open Questions for the Agent to Flag (not to silently assume)

- Voice input handling for onboarding (STT engine choice) — not specified in source PRD.
- Auth/session model for worker scans (badge NFC? QR? manual ID entry?) — not specified.
- Exact PDF template/layout for the OISD Form-A generator — not specified, needs a real template from MRPL compliance team before Milestone 7.4 can ship.
- Whether the chronic lung-risk ML model is trained in-house or a literature-based scoring heuristic for v1 — recommend heuristic first, ML model later once you have longitudinal data.
