import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function ReadmePage() {
  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] font-sans selection:bg-[#E3262E] selection:text-white pb-24">
      {/* Header */}
      <header className="white-header">
        <Link href="/" className="brand-title-light flex items-center gap-2">
          <span>PROJECT / H₂S</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono border border-slate-300">
            ARCHITECTURE SPEC
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-wider text-slate-600">
          <Link href="/" className="hover:text-black transition">01. About &amp; Team</Link>
          <Link href="/login" className="hover:text-black transition font-bold text-[#E3262E]">02. Log In Portal</Link>
          <Link href="/manager" className="hover:text-black transition">03. Shift Manager</Link>
          <Link href="/worker" className="hover:text-black transition">04. Worker View</Link>
          <Link href="/control-room" className="hover:text-black transition">05. Control Room</Link>
        </nav>

        <div className="status-badge-light">
          <span className="pulse-red-dot" /> SPEC VERIFIED
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-600 hover:text-black transition mb-6 uppercase tracking-wider font-semibold"
        >
          <ArrowLeft size={14} /> Back to About &amp; Team (Page 01)
        </Link>

        <div className="mb-10">
          <div className="text-xs font-mono text-[#E3262E] uppercase tracking-wider font-bold mb-1">
            Standard Operating Procedure · SOP-H2S-01
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-black font-serif">
            How The Platform Operates
          </h1>
          <p className="text-sm md:text-base text-slate-600 font-sans mt-3 leading-relaxed">
            Bridging disposable colorimetric chemical sensing cartridges with smartphone optical spectroscopy and multi-shift digital worker telemetry.
          </p>
        </div>

        {/* 5-Step Operational Flow */}
        <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mb-12">
          <h2 className="text-xl font-bold text-black mb-6 border-b border-slate-200 pb-4 font-serif flex items-center justify-between">
            <span>5-Step Workflow Architecture</span>
            <span className="text-xs font-mono text-[#E3262E]">SOP-H2S-01</span>
          </h2>

          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-mono font-bold shrink-0">
                01
              </div>
              <div>
                <h3 className="text-base font-bold text-black mb-1">Assign &amp; Distribute</h3>
                <p className="text-xs md:text-sm text-slate-600 font-sans leading-relaxed">
                  A sterile colorimetric wristband is issued to an industrial worker or contractor. Each band contains a 5-working-day reactive strip patch and a 7-day chemical expiration indicator.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-mono font-bold shrink-0">
                02
              </div>
              <div>
                <h3 className="text-base font-bold text-black mb-1">Shift Start Optical Scan</h3>
                <p className="text-xs md:text-sm text-slate-600 font-sans leading-relaxed">
                  The Shift Manager snaps an initial camera frame of the band before the worker enters the refinery unit. The app records the unexposed ivory baseline (Patch A) and starts the shift exposure clock.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-mono font-bold shrink-0">
                03
              </div>
              <div>
                <h3 className="text-base font-bold text-black mb-1">Passive Ambient Absorption</h3>
                <p className="text-xs md:text-sm text-slate-600 font-sans leading-relaxed">
                  The worker performs regular duties in high-risk zones. The SbCl₃ + purple cabbage anthocyanin matrix passively and selectively reacts with ambient H₂S gas, darkening proportionately to exposure.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-mono font-bold shrink-0">
                04
              </div>
              <div>
                <h3 className="text-base font-bold text-black mb-1">Shift End Scan &amp; &Delta;E Spectroscopy</h3>
                <p className="text-xs md:text-sm text-slate-600 font-sans leading-relaxed">
                  At shift conclusion, the manager scans the wristband again. The algorithm calculates the CIE L*a*b* color difference (<code className="text-[#E3262E] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">&Delta;E = end - start</code>), interpolating the dose range (<code className="text-emerald-700 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">4.8–6.2 ppm•h</code>) and assigning a confidence score (<code className="text-blue-700 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">HIGH</code>).
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-mono font-bold shrink-0">
                05
              </div>
              <div>
                <h3 className="text-base font-bold text-black mb-1">Continuous Digital Worker Profile</h3>
                <p className="text-xs md:text-sm text-slate-600 font-sans leading-relaxed">
                  Calculated shift exposure appends directly to the worker&apos;s digital profile in Supabase. Even when bands reach their 5-day limit and are retired, the worker&apos;s cumulative history remains unbroken.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Documentation Suite Links */}
        <section className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div>
            <div className="text-xs font-mono text-[#E3262E] uppercase font-bold">Authentication Gateway</div>
            <div className="text-base font-bold text-black">Ready to test worker logins? Proceed to Page 02.</div>
          </div>

          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-mono text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center gap-2"
          >
            <span>Proceed to Log In (Page 2)</span>
            <ArrowRight size={14} />
          </Link>
        </section>
      </main>
    </div>
  );
}
