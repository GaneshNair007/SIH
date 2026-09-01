import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ProblemSolution() {
  const problems = [
    { title: "Disconnected Paper Records", desc: "Manual logbooks lead to lost shift history and untracked cumulative loads across physical bands." },
    { title: "Inconsistent Image Capture", desc: "Variable ambient lighting, camera flash glare, and angled perspectives distort color reading." },
    { title: "Missing Shift Pairing", desc: "Single end-of-shift readings fail to account for pre-existing chemical darkening from prior shifts." },
    { title: "Untracked Band Replacement", desc: "No automated enforcement of physical sensor degradation or 5-day expiration lifecycles." },
    { title: "Unclear Measurement Validity", desc: "Lack of control patches obscures whether darkening was caused by H₂S exposure or seal tampering." },
  ];

  const solutions = [
    { title: "Worker-Linked Band Identity", desc: "QR codes bind physical wristbands directly to employee profiles and active refinery units." },
    { title: "Controlled Optical Quality Checks", desc: "Real-time edge sharpness, glare rejection, and blue substrate chromaticity validation in camera." },
    { title: "Differential Shift Quantification", desc: "Net optical darkening ΔE_net = max(0, ΔE_end - ΔE_start - Patch B drift) measures the exact shift dose." },
    { title: "Strict 5-Day Lifecycle Management", desc: "Tracks operational days 1 to 5 and flags replacement when Patch B/C integrity degrades." },
    { title: "Zero-Fake-Precision Uncertainty Bounds", desc: "Presents conservative low–high dose ranges and statutory tiering with hard clinical safety locks." },
  ];

  return (
    <section className="py-16 px-6 lg:px-12 bg-warm-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: The Recording Gap (Charcoal) */}
          <div className="bg-charcoal text-white rounded-2xl p-8 lg:p-10 border border-dark-surface shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-red-400 mb-4 uppercase">
                <AlertTriangle className="w-4 h-4" />
                Operational Problem
              </div>
              <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-tight text-white mb-6">
                THE RECORDING GAP
              </h2>
              <p className="text-sm text-sage leading-relaxed mb-8">
                Passive colorimetric badges in industrial environments frequently suffer from systemic record-keeping and measurement ambiguity.
              </p>

              <div className="space-y-4">
                {problems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      ✕
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-sage mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: The Connected Workflow (Dark Gray with Yellow Accent Border) */}
          <div className="bg-gray-dark text-white rounded-2xl p-8 lg:p-10 border-2 border-yellow-golden shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-yellow-golden mb-4 uppercase">
                <CheckCircle2 className="w-4 h-4 text-yellow-golden" />
                Engineering Solution
              </div>
              <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-tight text-white mb-6">
                THE CONNECTED WORKFLOW
              </h2>
              <p className="text-sm text-sage leading-relaxed mb-8">
                A closed-loop optical pipeline combining QR pairing, differential subtraction, and statutory health ledgers.
              </p>

              <div className="space-y-4">
                {solutions.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-yellow-golden text-charcoal flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      ✓
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-yellow-golden">{item.title}</h3>
                      <p className="text-xs text-sage-light mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
