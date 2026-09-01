import { Suspense } from "react";
import PublicNavbar from "@/components/layout/PublicNavbar";
import Footer from "@/components/layout/Footer";
import ProblemSolution from "@/components/working/ProblemSolution";
import BentoGrid from "@/components/working/BentoGrid";
import WorkingTabs from "@/components/working/WorkingTabs";
import HowItWorks from "@/components/working/HowItWorks";

export default function WorkingPage() {
  return (
    <>
      <PublicNavbar />
      <main className="flex-1 pt-24">
        {/* Working Hero Header */}
        <section className="py-16 px-6 lg:px-12 bg-hero-grid bg-warm-white text-center border-b border-light-surface">
          <div className="max-w-4xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-teal-deep px-3 py-1 bg-white rounded-full border border-light-surface shadow-sm inline-block mb-6">
              Full System Pipeline & Science
            </span>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl uppercase tracking-tight text-charcoal leading-tightest">
              FROM COLOUR CHANGE <br />
              TO A <span className="highlight-yellow">DIGITAL RECORD.</span>
            </h1>
            <p className="text-base sm:text-lg text-sage-muted mt-6 max-w-2xl mx-auto leading-relaxed">
              Explore the laboratory formulation, multi-patch optical error rejection, and deterministic statutory dosimetry models.
            </p>
          </div>
        </section>

        {/* 1. Problem - Solution 50/50 Split */}
        <ProblemSolution />

        {/* 2. Bento Grid */}
        <BentoGrid />

        {/* 3. Deep-Dive Tabs (Flowchart | Images | Chemistry | Comparison) */}
        <Suspense fallback={<div className="py-20 text-center text-sage-muted">Loading pipeline tabs...</div>}>
          <WorkingTabs />
        </Suspense>

        {/* 4. How It Works 1:2 Layout */}
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
