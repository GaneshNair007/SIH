"use client";

import Link from "next/link";
import { ArrowRight, Shield, QrCode, Sparkles, CheckCircle2 } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-6 lg:px-12 bg-hero-grid bg-warm-white overflow-hidden border-b border-light-surface">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-charcoal/10 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="w-2 h-2 rounded-full bg-teal-deep animate-pulse" />
          <span className="text-[11px] sm:text-xs font-bold tracking-widest text-charcoal uppercase">
            STRELA · PASSIVE WRISTBAND · DIGITAL EXPOSURE RECORDS
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl uppercase tracking-tight text-charcoal leading-tightest max-w-5xl mb-8">
          WHEN EXPOSURE <br className="hidden sm:inline" />
          BECOMES DATA, <br className="hidden md:inline" />
          SAFETY BECOMES <span className="highlight-yellow">SMARTER.</span>
        </h1>

        {/* Supporting Copy */}
        <p className="text-lg sm:text-xl text-sage-muted max-w-2xl leading-relaxed mb-10 font-normal">
          A colour-changing wristband and smartphone reading workflow designed to connect H₂S exposure-related readings with each worker’s history.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full sm:w-auto">
          <Link
            href="/working"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-yellow-golden text-charcoal hover:bg-yellow-hover font-bold text-base px-8 py-4 rounded-full transition-all duration-300 shadow hover:shadow-md group"
          >
            <span>EXPLORE THE PIPELINE</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-charcoal text-white hover:bg-black font-semibold text-base px-8 py-4 rounded-full transition-all duration-300 shadow hover:shadow-md"
          >
            <span>MANAGER LOGIN</span>
          </Link>
        </div>

        {/* Wristband Hardware Prototype Showcase */}
        <div className="w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-2xl card-hover-lift text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-light-surface pb-4 mb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-deep">Hardware Architecture</div>
              <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-charcoal">Physical Wristband & Colorimetric Cartridge</h3>
            </div>
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 self-start sm:self-auto font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Hardware Prototype Layout
            </span>
          </div>

          {/* Actual Hardware Prototype Image */}
          <div className="bg-warm-white rounded-2xl p-4 sm:p-6 border border-light-surface mb-6 flex flex-col items-center">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-xl shadow-lg border border-charcoal/10 bg-black flex items-center justify-center">
              <img
                src="/images/wristband_prototype.jpg"
                alt="H2S Colorimetric Dosimeter Wristband Hardware Prototype with QR Code, Expiry Patch, Reactive Strip, and Reference Scale"
                className="w-full h-auto object-contain max-h-[380px] select-none hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
            
            {/* Diagram Annotations / Callout Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mt-4 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-light-surface shadow-sm">
                <div className="text-[10px] font-mono font-bold text-teal-deep uppercase">01 / QR CODE</div>
                <div className="text-[11px] font-semibold text-charcoal mt-0.5">Worker & Unit Link</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-light-surface shadow-sm">
                <div className="text-[10px] font-mono font-bold text-teal-deep uppercase">02 / EXPIRY PATCH</div>
                <div className="text-[11px] font-semibold text-charcoal mt-0.5">5-Day Shelf Integrity</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-light-surface shadow-sm">
                <div className="text-[10px] font-mono font-bold text-teal-deep uppercase">03 / REACTIVE STRIP</div>
                <div className="text-[11px] font-semibold text-charcoal mt-0.5">SbCl₃ + Anthocyanin</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-light-surface shadow-sm">
                <div className="text-[10px] font-mono font-bold text-teal-deep uppercase">04 / REFERENCE SCALE</div>
                <div className="text-[11px] font-semibold text-charcoal mt-0.5">0–120 ppm·h Range</div>
              </div>
            </div>
          </div>

          {/* Research Prototype Note */}
          <div className="flex items-start gap-3 text-xs text-sage-muted bg-warm-white p-3.5 rounded-lg border border-light-surface">
            <span className="font-bold text-charcoal shrink-0">CRITICAL NOTE:</span>
            <span>Research prototype for cumulative exposure assessment. Not a continuous gas alarm or real-time personal gas sniffer.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
