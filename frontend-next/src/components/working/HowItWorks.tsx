import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "ASSIGN & CAPTURE",
      desc: "Link the worker profile and physical wristband QR code. The smartphone camera captures the initial baseline optical density (ΔE_start) and starts the active shift in the control room.",
      sub: "Day 1–5 Lifecycle tracking initialized.",
    },
    {
      num: "02",
      title: "WEAR & READ",
      desc: "The worker wears the sealed dosimeter cartridge in the refinery unit. At shift conclusion, the smartphone optical scanner captures the terminal state, evaluating image quality and Patch B/C integrity.",
      sub: "Rejects glare (>2.5%) and unaligned substrates.",
    },
    {
      num: "03",
      title: "ANALYSE & RECORD",
      desc: "The deterministic engine computes differential net darkening (ΔE_net), resolves eligible calibration curves, updates the rolling 7d/30d/90d ledgers, and assigns statutory risk tiers.",
      sub: "Zero-LLM mathematical rigor.",
    },
  ];

  return (
    <section className="py-24 px-6 lg:px-12 bg-warm-white border-b border-light-surface">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Sticky Title (1 Part of 1:2 layout) */}
        <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-deep">
            SUMMARY WORKFLOW
          </span>
          <h2 className="font-display text-5xl sm:text-6xl uppercase tracking-tight text-charcoal leading-tightest">
            HOW IT WORKS.
          </h2>
          <p className="text-sm text-sage-muted leading-relaxed">
            Three deterministic steps bridging physical chemistry and refinery occupational safety records.
          </p>
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-charcoal hover:text-teal-deep group"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-4 h-4 text-yellow-golden group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Steps (2 Parts of 1:2 layout) */}
        <div className="lg:col-span-8 space-y-8">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-8 border border-light-surface shadow-sm card-hover-lift flex flex-col sm:flex-row items-start gap-6 group focus-within:ring-2 focus-within:ring-yellow-golden"
              tabIndex={0}
            >
              {/* Large Yellow Numeral with hover/focus feedback */}
              <div className="font-display text-6xl sm:text-7xl text-yellow-golden leading-none group-hover:scale-110 group-focus:scale-110 transition-transform duration-300 select-none">
                {step.num}
              </div>

              <div className="space-y-2 flex-1">
                <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-charcoal">
                  {step.title}
                </h3>
                <p className="text-sm text-sage-muted leading-relaxed">
                  {step.desc}
                </p>
                <div className="text-xs font-mono text-teal-deep font-semibold pt-1">
                  → {step.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
