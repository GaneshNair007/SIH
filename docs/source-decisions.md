# Source Decisions & Document Harmonization

**Date:** 2026-09-02  
**Scope:** Technical alignment, design token implementations, and scientific uncertainty handling.

---

## 1. Documentation Conflicts & Resolution

| Topic | Document / Source A | Document / Source B | Chosen Resolution & Rationale |
| :--- | :--- | :--- | :--- |
| **Product Name** | Prompt: "editable working name **H₂S MONITOR**" | Backend & README: "Rakshak (रक्षक)" | Primary public brand: **H₂S MONITOR** with subtitle "Powered by Rakshak Dosimetry Engine" for clear identity and domain continuity. |
| **Band Lifecycle** | Chemistry Doc: Mentions 7-day deployment window | Backend models & Agent.md: Strict 5-day rotation (`band_lifecycle_day` 1 to 5) | Enforce 5-day maximum operational lifecycle per physical wristband in UI and validation rules. |
| **Exposure Precision** | Traditional dashboards often present single float values (e.g. `2.4 ppm`) | Agent.md & statutory engine: Strict uncertainty ranges (e.g. `2.1–2.7 ppm`) | **Zero Fake Precision:** UI always renders low–high uncertainty bounds (`dose_low–dose_high ppm·h` and `twa_low–twa_high ppm`). |
| **Missing Spec Documents** | Prompt requests `h2s_platform_spec.md` and `H2S_Wristband_Project_Context.md` | Files absent in repo | Specifications derived faithfully from `Agent.md`, `README.md`, `H2S_Wristband_SbCl3_Anthocyanin_Complete.md`, and direct backend code audit. |
| **Typography Fallback** | Prompt requests Satoshi for body/interface | Satoshi is a commercial webfont not bundled in the repo | Substituted with **Inter** (Google Fonts) with documented fallback font stack (`Inter, -apple-system, BlinkMacSystemFont, sans-serif`). Anton is used for public display headlines. |
| **Team Information** | Prompt requests real names, roles, photos | No external team list supplied | Honest editable placeholder state in Team section. No fictional team members or customer logos invented. |
| **Prototype Imagery** | Prompt requests real photographs or labeled concept illustrations | No physical hardware photos in repository | SVG and interactive canvas concept illustrations clearly labeled **"Concept illustration — laboratory benchmark prototype"**. |

---

## 2. Measurement & Scientific Uncertainty Integrity

1. **Passive Response vs. Active Detector:**
   The wristband is a passive colorimetric dosimeter that develops color over time. It is **not** an instantaneous gas alarm or continuous real-time PPM sniffer. The UI prominently displays this disclaimer on public and operational screens.

2. **Differential Dose Calculation:**
   Chemical darkening ($\Delta E$) on the SbCl₃-anthocyanin composite is irreversible. Shift dose is derived strictly as:
   $$\Delta E_{\text{net}} = \max(0.0, \Delta E_{\text{end}} - \Delta E_{\text{start}} - \max(0.0, \text{Patch B drift} - 0.05))$$
   Successive shift readings are never summed as independent raw doses without differential subtraction.

3. **Statutory Classification:**
   - **TIER 1 (NORMAL):** $\text{TWA}_{\text{high}} < 1.0\text{ ppm}$ AND $\text{7-day load}_{\text{high}} < 15.0\text{ ppm}\cdot\text{hr}$
   - **TIER 2 (CAUTION):** $1.0 \le \text{TWA}_{\text{high}} < 5.0\text{ ppm}$ OR $15.0 \le \text{7-day load}_{\text{high}} < 35.0\text{ ppm}\cdot\text{hr}$
   - **TIER 3 (CRITICAL):** $\text{TWA}_{\text{high}} \ge 5.0\text{ ppm}$ OR $\text{7-day load}_{\text{high}} \ge 35.0\text{ ppm}\cdot\text{hr}$ OR $\text{Single-shift dose}_{\text{high}} > 20.0\text{ ppm}\cdot\text{hr}$
