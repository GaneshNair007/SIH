import { QrCode, Smartphone, Layers, Shield, Activity, RefreshCw } from "lucide-react";

export default function BentoGrid() {
  return (
    <section className="py-16 px-6 lg:px-12 bg-white border-b border-light-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-teal-deep mb-2">Technical Subsystems</div>
          <h2 className="font-display text-5xl sm:text-6xl uppercase tracking-tight text-charcoal leading-tightest">
            THE MEASUREMENT ARCHITECTURE
          </h2>
          <p className="text-base text-sage-muted mt-4">
            Six interconnected subsystems designed for reliable passive detection in harsh refinery environments.
          </p>
        </div>

        {/* 3-Column Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-[minmax(360px,auto)]">
          {/* Card 1: Wristband Architecture (Spans 2 Columns) */}
          <div className="lg:col-span-2 bg-[#171C1B] text-white rounded-2xl p-8 border border-dark-surface flex flex-col justify-between shadow-lg card-hover-lift">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-yellow-golden uppercase font-bold">Subsystem 01</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-teal-deep text-white">SbCl₃ + Anthocyanin</span>
              </div>
              <h3 className="font-display text-3xl uppercase tracking-tight text-white mb-3">
                Triple-Patch Wristband Architecture
              </h3>
              <p className="text-sm text-sage leading-relaxed max-w-xl mb-6">
                Separated from skin contact within a replaceable cartridge. Integrates three distinct reactive and control zones to ensure chemical authenticity and baseline compensation.
              </p>

              {/* 3 Patch Visual Callout */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#242A29] p-3.5 rounded-xl border border-yellow-golden/30">
                  <div className="text-xs font-bold text-yellow-golden mb-1">Patch A: Active Spot</div>
                  <div className="text-[11px] text-sage">0.5 wt% SbCl₃ + 4 wt% anthocyanin composite forming irreversible orange-brown response (ΔE).</div>
                </div>
                <div className="bg-[#242A29] p-3.5 rounded-xl border border-sage/20">
                  <div className="text-xs font-bold text-white mb-1">Patch B: Blank Drift</div>
                  <div className="text-[11px] text-sage">Anthocyanin-only control to detect sunlight oxidation, ambient drift, or seal tamper.</div>
                </div>
                <div className="bg-[#242A29] p-3.5 rounded-xl border border-sage/20">
                  <div className="text-xs font-bold text-white mb-1">Patch C: Integrity</div>
                  <div className="text-[11px] text-sage">Interferent and humidity indicator flagging seal breaches or water damage.</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-dark-surface text-xs text-sage flex items-center justify-between">
              <span>Non-skin contact laboratory benchmark</span>
              <span className="font-mono text-yellow-golden">200 ppb Lab Detection Limit</span>
            </div>
          </div>

          {/* Card 2: Smartphone Capture (1 Column) */}
          <div className="bg-warm-white text-charcoal rounded-2xl p-8 border border-light-surface flex flex-col justify-between shadow-sm card-hover-lift">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-teal-deep uppercase font-bold">Subsystem 02</span>
                <Smartphone className="w-5 h-5 text-teal-deep" />
              </div>
              <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal mb-3">
                Controlled Mobile Capture
              </h3>
              <p className="text-sm text-sage-muted leading-relaxed mb-4">
                Real-time camera viewfinder evaluates lighting uniformity, suppresses specular reflection, and transforms pixels from sRGB to CIELAB space.
              </p>
              <div className="space-y-2 text-xs font-medium text-charcoal bg-white p-3 rounded-xl border border-light-surface">
                <div className="flex justify-between">
                  <span>Glare Threshold:</span>
                  <span className="font-mono text-teal-deep">&lt; 2.5%</span>
                </div>
                <div className="flex justify-between">
                  <span>Sharpness Index:</span>
                  <span className="font-mono text-teal-deep">&gt; 70.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Blue Substrate Check:</span>
                  <span className="font-mono text-teal-deep">HSV Verified</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-light-surface text-xs text-sage-muted">
              Standardized optical intake
            </div>
          </div>

          {/* Card 3: Worker Identity (1 Column) */}
          <div className="bg-warm-white text-charcoal rounded-2xl p-8 border border-light-surface flex flex-col justify-between shadow-sm card-hover-lift">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-teal-deep uppercase font-bold">Subsystem 03</span>
                <QrCode className="w-5 h-5 text-teal-deep" />
              </div>
              <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal mb-3">
                Worker-Linked Band Identity
              </h3>
              <p className="text-sm text-sage-muted leading-relaxed mb-4">
                QR codes embed Worker ID, refinery operating unit, badge barcode, and batch calibration versions to prevent misattribution.
              </p>
              <div className="p-3 bg-white rounded-xl border border-light-surface font-mono text-xs text-charcoal break-all">
                EMP-1042:CDU-1:BAND-1042-01
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-light-surface text-xs text-sage-muted">
              Zero-latency QR extraction
            </div>
          </div>

          {/* Card 4: Recorded Exposure History (Spans 2 Columns) */}
          <div className="lg:col-span-2 bg-[#171C1B] text-white rounded-2xl p-8 border border-dark-surface flex flex-col justify-between shadow-lg card-hover-lift">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-yellow-golden uppercase font-bold">Subsystem 04</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-amber-900/50 text-yellow-golden border border-yellow-golden/30">
                  Rolling Ledgers
                </span>
              </div>
              <h3 className="font-display text-3xl uppercase tracking-tight text-white mb-3">
                Multi-Window Cumulative Ledgers
              </h3>
              <p className="text-sm text-sage leading-relaxed max-w-xl mb-6">
                Shifts are accumulated into rolling 7-day, 30-day, and 90-day ledgers. Doses are calculated as uncertainty envelopes (low–high bounds) rather than deceptive single-float numbers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="bg-[#1E2423] p-3 rounded-xl border border-sage/10">
                  <div className="text-[10px] text-sage font-mono uppercase">7-Day Rolling Load</div>
                  <div className="text-lg font-bold text-yellow-golden font-mono mt-1">7.4–8.8 ppm·h</div>
                  <div className="text-[9px] text-emerald-400 mt-0.5">Tier 1 Limit: 15 ppm·h</div>
                </div>
                <div className="bg-[#1E2423] p-3 rounded-xl border border-sage/10">
                  <div className="text-[10px] text-sage font-mono uppercase">30-Day Cumulative</div>
                  <div className="text-lg font-bold text-white font-mono mt-1">24.1 ppm·h</div>
                  <div className="text-[9px] text-sage mt-0.5">Sub-chronic accumulation</div>
                </div>
                <div className="bg-[#1E2423] p-3 rounded-xl border border-sage/10">
                  <div className="text-[10px] text-sage font-mono uppercase">90-Day Lung Risk Index</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-1">14 / 100</div>
                  <div className="text-[9px] text-sage mt-0.5">Low Occupational Risk</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-dark-surface text-xs text-sage flex items-center justify-between">
              <span>Deterministic Python kinetics</span>
              <span className="text-yellow-golden font-mono">Zero-LLM Math</span>
            </div>
          </div>

          {/* Card 5: Measurement Quality (1 Column) */}
          <div className="bg-warm-white text-charcoal rounded-2xl p-8 border border-light-surface flex flex-col justify-between shadow-sm card-hover-lift">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-teal-deep uppercase font-bold">Subsystem 05</span>
                <Activity className="w-5 h-5 text-teal-deep" />
              </div>
              <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal mb-3">
                Integrity & Quality Gates
              </h3>
              <p className="text-sm text-sage-muted leading-relaxed mb-4">
                Dynamic uncertainty expansion: if Patch B drift exceeds 0.35 ΔE or Patch C shows warning, measurement envelopes expand from ±10% to ±25%.
              </p>
              <div className="bg-white p-3 rounded-xl border border-light-surface text-xs font-mono text-charcoal">
                Confidence: <strong className="text-teal-deep">HIGH (±10%)</strong>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-light-surface text-xs text-sage-muted">
              Statutory verification
            </div>
          </div>

          {/* Card 6: Band Lifecycle (1 Column) */}
          <div className="bg-warm-white text-charcoal rounded-2xl p-8 border border-light-surface flex flex-col justify-between shadow-sm card-hover-lift">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-teal-deep uppercase font-bold">Subsystem 06</span>
                <RefreshCw className="w-5 h-5 text-teal-deep" />
              </div>
              <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal mb-3">
                5-Day Rotation Lifecycle
              </h3>
              <p className="text-sm text-sage-muted leading-relaxed mb-4">
                Wristbands support up to 5 operational shift rotations before chemical saturation requires cartridge disposal and replacement.
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((day) => (
                  <div
                    key={day}
                    className={`flex-1 text-center py-1.5 rounded text-xs font-bold font-mono ${
                      day <= 2 ? "bg-teal-deep text-white" : "bg-sage-light text-sage-muted"
                    }`}
                  >
                    D{day}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-light-surface text-xs text-sage-muted">
              Automated expiration flags
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
