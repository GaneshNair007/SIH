import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="relative py-28 px-6 lg:px-12 bg-yellow-golden text-charcoal overflow-hidden">
      {/* Oversized Decorative Background Typography at Low Opacity */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-10 overflow-hidden font-display text-[22vw] leading-none uppercase tracking-tighter text-charcoal"
      >
        STRELA
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-charcoal text-white text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
          <span>OCCUPATIONAL SAFETY INNOVATION</span>
        </div>

        <h2 className="font-display text-5xl sm:text-7xl md:text-8xl uppercase tracking-tight text-charcoal leading-tightest mb-6">
          SEE THE WORKING. <br />
          EXPLORE THE PLATFORM.
        </h2>

        <p className="text-base sm:text-xl text-charcoal/80 max-w-2xl leading-relaxed mb-10 font-medium">
          Review the complete laboratory benchmark chemistry, optical vision pipeline, and deterministic dosimetry models.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/working"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-charcoal text-white hover:bg-black font-bold text-base px-8 py-4 rounded-full transition-all duration-300 shadow-md hover:shadow-xl group"
          >
            <span>HOW IT WORKS</span>
            <ArrowRight className="w-5 h-5 text-yellow-golden group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-charcoal hover:bg-warm-white font-bold text-base px-8 py-4 rounded-full border border-charcoal/20 transition-all duration-300 shadow-sm hover:shadow"
          >
            <span>OPEN PLATFORM</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
