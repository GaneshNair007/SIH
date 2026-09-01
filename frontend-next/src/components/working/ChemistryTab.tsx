import { FlaskConical, CheckCircle, Clock, AlertCircle, BookOpen } from "lucide-react";

export default function ChemistryTab() {
  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal">
          SbCl₃–Anthocyanin Colorimetric Chemistry
        </h3>
        <p className="text-sm text-sage-muted mt-2">
          Laboratory benchmark formulation based on published research and deterministic optical models.
        </p>
      </div>

      {/* Chemical Principle & CIELAB Math */}
      <div className="bg-white rounded-2xl p-8 border border-light-surface shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-light-surface pb-4">
          <FlaskConical className="w-6 h-6 text-teal-deep" />
          <h4 className="font-display text-2xl uppercase tracking-tight text-charcoal">
            Formulation & Optical Quantification (CIELAB)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <h5 className="font-bold text-charcoal">Chemical Reaction Mechanism:</h5>
            <p className="text-sage-muted leading-relaxed text-xs">
              Antimony trichloride (SbCl₃) complexes with cyanidin-based anthocyanins extracted from fresh purple cabbage (50% ethanol/water). When exposed to Hydrogen Sulfide ($H_2S$), the reaction produces insoluble antimony trisulfide ($Sb_2S_3$), generating an irreversible color transition from red/violet to deep orange-brown.
            </p>
            <div className="p-3 bg-warm-white rounded-xl border border-light-surface font-mono text-xs text-charcoal">
              2 SbCl₃ + 3 H₂S → Sb₂S₃ ↓ + 6 HCl
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-charcoal">CIELAB ΔE Color Quantification:</h5>
            <p className="text-sage-muted leading-relaxed text-xs">
              The smartphone converts RGB color space into device-independent CIELAB ($L^*, a^*, b^*$). Net optical shift is computed through differential Euclidean distance:
            </p>
            <div className="p-3 bg-warm-white rounded-xl border border-light-surface font-mono text-xs text-charcoal">
              ΔE = √[ (L* - L₀*)² + (a* - a₀*)² + (b* - b₀*)² ]
            </div>
          </div>
        </div>
      </div>

      {/* 4 Categorized Research Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Block 1: Published Findings */}
        <div className="bg-warm-white rounded-2xl p-6 border border-light-surface card-hover-lift">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-deep mb-3 uppercase">
            <BookOpen className="w-4 h-4" />
            1. Published Findings (Literature)
          </div>
          <h4 className="font-display text-xl uppercase tracking-tight text-charcoal mb-3">
            Molecules 2023, 28, 5044
          </h4>
          <ul className="space-y-2 text-xs text-sage-muted leading-relaxed list-disc list-inside">
            <li>Tested SbCl₃ concentrations: 0.05, 0.10, 0.20, 0.50, and 1.00 wt%.</li>
            <li>Selected optimal formulation: <strong>0.5 wt% SbCl₃ + 4 wt% anthocyanin</strong>.</li>
            <li>Published laboratory limit of detection: <strong>200 ppb</strong> in controlled gas chamber.</li>
            <li>Demonstrated monotonic ΔE progression across the 1–10 ppm exposure range.</li>
          </ul>
        </div>

        {/* Block 2: Proposed Project Design */}
        <div className="bg-warm-white rounded-2xl p-6 border border-light-surface card-hover-lift">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-deep mb-3 uppercase">
            <FlaskConical className="w-4 h-4" />
            2. Proposed Project Design
          </div>
          <h4 className="font-display text-xl uppercase tracking-tight text-charcoal mb-3">
            Triple-Patch Wristband Cartridge
          </h4>
          <ul className="space-y-2 text-xs text-sage-muted leading-relaxed list-disc list-inside">
            <li>Physical isolation: sealed cartridge prevents any epidermal contact with SbCl₃.</li>
            <li>Patch A: Active detection spot (SbCl₃ + anthocyanin composite).</li>
            <li>Patch B: Reference control blank (anthocyanin only) for sunlight drift compensation.</li>
            <li>Patch C: Chemical interferent & humidity seal indicator.</li>
          </ul>
        </div>

        {/* Block 3: Team-Validated Results */}
        <div className="bg-warm-white rounded-2xl p-6 border border-light-surface card-hover-lift">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-700 mb-3 uppercase">
            <CheckCircle className="w-4 h-4" />
            3. Team-Validated Implementation
          </div>
          <h4 className="font-display text-xl uppercase tracking-tight text-charcoal mb-3">
            Deterministic Dosimetry Engine
          </h4>
          <ul className="space-y-2 text-xs text-sage-muted leading-relaxed list-disc list-inside">
            <li>Pure Python zero-LLM dosimetry math ensuring 100% deterministic calculation.</li>
            <li>3-Layer MLP neural network (`h2s_strip_model.json`) running in &lt;2 ms.</li>
            <li>HSV blue substrate chromaticity rejection for webcam image security.</li>
            <li>Uncertainty envelopes (±10% to ±25%) replacing deceptive single numbers.</li>
          </ul>
        </div>

        {/* Block 4: Pending Validation */}
        <div className="bg-warm-white rounded-2xl p-6 border border-light-surface card-hover-lift">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-700 mb-3 uppercase">
            <Clock className="w-4 h-4" />
            4. Pending Validation
          </div>
          <h4 className="font-display text-xl uppercase tracking-tight text-charcoal mb-3">
            Field Refinery Pilot Verification
          </h4>
          <ul className="space-y-2 text-xs text-sage-muted leading-relaxed list-disc list-inside">
            <li>Long-term ambient aging across 5 full shifts in high-humidity monsoon conditions.</li>
            <li>Cross-sensitivity testing with trace sulfur dioxide ($SO_2$) and mercaptans.</li>
            <li>Batch-to-batch variation calibration across commercial cabbage anthocyanin lots.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
