# Rakshak (रक्षक) — H₂S Exposure Advisory & Plant Safety Platform

**Rakshak-H2S (रक्षक)** is an occupational health & safety advisory platform designed for petroleum refinery workers (pilot: MRPL Mangalore) exposed to Hydrogen Sulfide ($H_2S$) using passive colorimetric dosimeter wristbands and AI advisory intelligence.

---

## 🌟 Key Architecture & Principles

1. **Zero-LLM Dosimetry Math:** The LLM **never** does math or classifies statutory tiers. All kinetic Arrhenius/moisture scaling ($k(T, RH)$), Time-Weighted Average (TWA), 7d/30d/90d rolling exposure ledgers, and statutory tiers (Tier 1 / Tier 2 / Tier 3) are computed deterministically in Python before any LLM is called.
2. **Deterministic Statutory Tiers:**
   - **TIER 1 (NORMAL):** $\text{TWA} < 1.0\text{ ppm}$ AND $\text{7-day load} < 15.0\text{ ppm}\cdot\text{hr}$
   - **TIER 2 (CAUTION):** $1.0\text{ ppm} \le \text{TWA} < 5.0\text{ ppm}$ OR $15.0 \le \text{7-day load} < 35.0\text{ ppm}\cdot\text{hr}$
   - **TIER 3 (CRITICAL):** $\text{TWA} \ge 5.0\text{ ppm}$ OR $\text{7-day load} \ge 35.0\text{ ppm}\cdot\text{hr}$ OR $\text{Single-shift dose} > 20.0\text{ ppm}\cdot\text{hr}$
3. **Ascending Priority Guardrail:** Server-side sorting guarantees recommendations follow strict priority order:
   - `[LOW / SELF-CARE]`
   - `[RECOMMENDED / OPERATIONAL]`
   - `[MANDATORY / CLINICAL]`
4. **Hard Tier 3 Override Lock:** Guarantees mandatory Occupational Health Centre (OHC) referral and Form-A incident report banner if Tier 3 is reached.
5. **Corrective RAG (CRAG) with Static Fallback:** Hybrid retrieval (Dense/Semantic + BM25) over OISD/DGMS/ACGIH corpus with confidence gating ($\ge 0.85$). If confidence is lower, the system seamlessly uses an authoritative deterministic protocol table.
6. **Flagship Intelligence:**
   - 2D Fugitive leak triangulation heatmap across refinery units.
   - Neuro-olfactory & psychomotor reflex screener.
   - 0–100 Chronic occupational lung-risk scoring model.
   - 1-Click OISD-STD-105 Form-A PDF incident report generator.

---

## 🚀 Quick Start (Rakshak Backend & Chatbot)

### 1. Installation
```bash
# Create virtual environment and install dependencies
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
```

### 2. Run the Platform
```bash
python run.py
```
Open your browser at **`http://127.0.0.1:8000`**

### 3. Run Automated Tests
```bash
.\venv\Scripts\pytest -v
```

---

## 🧭 Page Routes & API Endpoints

- **`/`** — Rakshak AI Safety Chatbot Interface.
- **`/manager`** (or `/supervisor`) — Shift Supervisor Command Center with 2D leak heatmap and OISD Form-A download.
- **`/onboard`** — Multi-turn bilingual conversational intake bot.
- **`/scan`** — Dosimeter badge scanner with optical density ($\Delta E$) simulation and dual Worker/Supervisor advisory views.
- **`/screener`** — Neuro-olfactory fatigue and psychomotor reaction test.
- **`/lung-risk`** — Chronic lung risk index calculator.
- **`/docs`** — Interactive OpenAPI Swagger UI documentation.
