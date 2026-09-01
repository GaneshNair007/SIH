"use client";

import { useState } from "react";
import { ArrowDown, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export default function FlowchartTab() {
  const [selectedStage, setSelectedStage] = useState<number>(0);

  const stages = [
    {
      num: "01",
      title: "Assign Band & Resolve Batch Identity",
      short: "QR pairing to employee profile and batch calibration matrix.",
      inputs: "Employee ID, refinery plant unit, wristband serial barcode (QR).",
      process: "Resolves active badge assignment, records deployment date, and links baseline calibration curve.",
      outputs: "Active worker-band link in database (`band_lifecycle_day` = 1).",
      limitations: "Assignment selects applicable calibration curve; it does not calibrate the physical chemistry on its own.",
    },
    {
      num: "02",
      title: "Capture Start-of-Shift Baseline",
      short: "Initial optical density (ΔE_start) recording.",
      inputs: "Smartphone camera photo of blue wristband under standardized ambient light.",
      process: "Evaluates lighting quality, segments Patch A & B, computes baseline ΔE_start (typically 0.2–0.6).",
      outputs: "Active Shift record (`ShiftScanModel` with `shift_status` = ACTIVE).",
      limitations: "Requires camera alignment within overlay guide.",
    },
    {
      num: "03",
      title: "Wear Passive Dosimeter Wristband",
      short: "Continuous passive exposure during work shift.",
      inputs: "Ambient airborne H₂S gas in refinery operating unit.",
      process: "H₂S diffuses through gas-permeable cartridge window and reacts irreversibly with SbCl₃-anthocyanin composite.",
      outputs: "Irreversible optical darkening on Patch A.",
      limitations: "Passive cumulative dosimeter. Does not emit acoustic or vibration alarms for peak surges.",
    },
    {
      num: "04",
      title: "Capture End-of-Shift State",
      short: "Terminal shift optical photograph capture.",
      inputs: "Smartphone photo of wristband upon leaving plant unit.",
      process: "QR decoding, glare filter, blue substrate chromaticity check, and pixel extraction.",
      outputs: "Raw terminal image coordinates and RGB color matrices.",
      limitations: "Damaged, heavily soiled, or occluded badges trigger manual supervisor inspection.",
    },
    {
      num: "05",
      title: "Sample Patches A, B, C & Evaluate Quality",
      short: "Multi-patch segmentation and integrity grading.",
      inputs: "Extracted RGB regions for active spot, control blank, and humidity indicator.",
      process: "Computes Patch B drift (ΔE_B) and Patch C color state to identify sunlight fade or seal breach.",
      outputs: "Measurement confidence classification (HIGH, MEDIUM, LOW, or INVALID).",
      limitations: "Extreme sunlight exposure may cause Patch B drift exceeding 0.70 ΔE.",
    },
    {
      num: "06",
      title: "Calculate CIELAB Net Colour Difference (ΔE_net)",
      short: "Deterministic differential dosimetry subtraction.",
      inputs: "ΔE_start, ΔE_end, Patch B drift.",
      process: "ΔE_net = max(0.0, ΔE_end - ΔE_start - max(0.0, Patch_B_drift - 0.05)).",
      outputs: "Net optical color difference (dimensionless CIELAB units).",
      limitations: "Negative differences are clamped to zero with baseline anomaly flag.",
    },
    {
      num: "07",
      title: "Apply Calibration & Assess Uncertainty Envelopes",
      short: "Dose mapping with dynamic uncertainty bounds.",
      inputs: "ΔE_net, shift duration (hours), Patch integrity margin.",
      process: "Dose_nominal = 2.15 × ΔE_net + 0.08 × (ΔE_net^1.5); expands to low–high bounds based on Patch B/C.",
      outputs: "Shift dose range (`dose_low–dose_high ppm·h`) and TWA range (`twa_low–twa_high ppm`).",
      limitations: "Without eligible calibration version, UI shows ΔE index rather than fabricated ppm dose.",
    },
    {
      num: "08",
      title: "Save Reading, Update Ledgers & Trigger Statutory Alerts",
      short: "Longitudinal database update and real-time SSE broadcast.",
      inputs: "Calculated shift metrics, worker profile, ambient telemetry.",
      process: "Updates rolling 7-day/30-day/90-day ledger. Classifies Tier 1/2/3. Triggers OISD Form-A if Tier 3.",
      outputs: "Stored shift scan, updated worker dossier, and SSE event broadcast to Manager Control Room.",
      limitations: "Requires network connectivity for database sync.",
    },
  ];

  return (
    <div className="space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal">
          8-Stage End-to-End Processing Pipeline
        </h3>
        <p className="text-sm text-sage-muted mt-2">
          Click any stage to inspect its specific inputs, mathematical processing, outputs, and limitations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Stages List (Left) */}
        <div className="lg:col-span-6 space-y-3">
          {stages.map((stage, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedStage(idx)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                selectedStage === idx
                  ? "bg-charcoal text-white border-charcoal shadow-md scale-[1.01]"
                  : "bg-white text-charcoal border-light-surface hover:border-teal-deep/40 hover:bg-warm-white"
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                    selectedStage === idx ? "bg-yellow-golden text-charcoal" : "bg-warm-white text-sage-muted border border-light-surface"
                  }`}
                >
                  {stage.num}
                </span>
                <div>
                  <h4 className="text-sm font-bold">{stage.title}</h4>
                  <p className={`text-xs mt-0.5 line-clamp-1 ${selectedStage === idx ? "text-sage" : "text-sage-muted"}`}>
                    {stage.short}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-semibold ${selectedStage === idx ? "text-yellow-golden" : "text-sage-muted"}`}>
                Details →
              </span>
            </button>
          ))}
        </div>

        {/* Selected Stage Detail Drawer (Right) */}
        <div className="lg:col-span-6 sticky top-24 bg-white rounded-2xl p-8 border border-light-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-light-surface pb-4 mb-6">
            <span className="text-xs font-mono font-bold text-teal-deep px-2.5 py-1 rounded bg-teal-light">
              STAGE {stages[selectedStage].num} SPECIFICATION
            </span>
            <span className="text-xs text-sage-muted">Deterministic Pipeline</span>
          </div>

          <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal mb-4">
            {stages[selectedStage].title}
          </h3>

          <div className="space-y-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-sage-muted mb-1">Inputs</div>
              <div className="text-sm text-charcoal bg-warm-white p-3 rounded-xl border border-light-surface">
                {stages[selectedStage].inputs}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-sage-muted mb-1">Transformation Process</div>
              <div className="text-sm text-charcoal bg-warm-white p-3 rounded-xl border border-light-surface leading-relaxed">
                {stages[selectedStage].process}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-sage-muted mb-1">Outputs</div>
              <div className="text-sm font-medium text-teal-deep bg-teal-light/40 p-3 rounded-xl border border-teal-deep/20">
                {stages[selectedStage].outputs}
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong className="font-semibold">Limitations & Domain Constraint:</strong> {stages[selectedStage].limitations}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
