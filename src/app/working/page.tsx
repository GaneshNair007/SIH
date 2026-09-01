"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";
import { FLOWCHART_STAGES, CHEMISTRY, COMPARISON_TABLE } from "@/lib/content";
import PublicNav from "@/components/ui/PublicNav";
import PublicFooter from "@/components/ui/PublicFooter";

const TABS = ["flowchart", "images", "chemistry", "comparison"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
  flowchart: "Flowchart",
  images: "Images",
  chemistry: "Chemistry",
  comparison: "Comparison",
};

/* ─── Tab Content: Flowchart ──────────────────── */
function FlowchartTab() {
  return (
    <div className="space-y-4">
      <p className="text-body text-muted mb-6">
        The complete workflow from band assignment to recorded exposure history. Click any stage to see inputs, process, outputs, and limitations.
      </p>
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-6 top-4 bottom-4 w-px bg-border hidden md:block" />

        <div className="space-y-4">
          {FLOWCHART_STAGES.map((stage) => (
            <details key={stage.id} className="group card-hover relative">
              <summary className="flex items-start gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className="w-12 h-12 rounded-full bg-teal-pale text-teal flex items-center justify-center text-sm font-bold shrink-0 relative z-10">
                  {stage.number}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-heading-3 text-charcoal group-open:text-teal transition-colors">
                    {stage.title}
                  </h3>
                  <p className="text-sm text-muted mt-1">{stage.summary}</p>
                </div>
                <svg className="w-5 h-5 text-muted mt-3 shrink-0 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
                </svg>
              </summary>
              <div className="mt-4 ml-16 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
                <div className="p-3 rounded-lg bg-canvas">
                  <div className="text-xs font-semibold text-teal uppercase tracking-wider mb-1">Input</div>
                  <p className="text-sm text-muted">{stage.input}</p>
                </div>
                <div className="p-3 rounded-lg bg-canvas">
                  <div className="text-xs font-semibold text-teal uppercase tracking-wider mb-1">Process</div>
                  <p className="text-sm text-muted">{stage.process}</p>
                </div>
                <div className="p-3 rounded-lg bg-canvas">
                  <div className="text-xs font-semibold text-teal uppercase tracking-wider mb-1">Output</div>
                  <p className="text-sm text-muted">{stage.output}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Limitation</div>
                  <p className="text-sm text-amber-800">{stage.limitation}</p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab Content: Images ─────────────────────── */
function ImagesTab() {
  const categories = [
    {
      title: "Physical Prototype",
      description: "The wristband cartridge housing with strap and patches.",
      hasImage: false,
      emptyState: "Lab prototype photographs pending — available after next fabrication run.",
    },
    {
      title: "Patch Arrangement",
      description: "A (dose), B (sealed reference), C (condition indicator) layout within the cartridge window.",
      hasImage: false,
      emptyState: "Detailed patch arrangement photography pending — see Flowchart tab for a conceptual diagram.",
    },
    {
      title: "Capture Example",
      description: "A smartphone photograph of the badge under controlled illumination, showing patch sampling.",
      hasImage: false,
      emptyState: "Capture workflow screenshots will be added once the scan module is finalized.",
    },
    {
      title: "Software Workflow",
      description: "The scan stepper UI: QR → resolve → photograph → sample → analyze → save.",
      hasImage: false,
      emptyState: "Software workflow screenshots pending — the Manager Scan workflow is implemented at /manager/scan.",
    },
  ];

  return (
    <div>
      <p className="text-body text-muted mb-8">
        Visual documentation of the wristband system. Real photographs are distinguished from concept illustrations. Missing assets show honest empty states.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {categories.map((cat) => (
          <div key={cat.title} className="card">
            <h3 className="text-heading-3 text-charcoal mb-2">{cat.title}</h3>
            <p className="text-sm text-muted mb-4">{cat.description}</p>
            {cat.hasImage ? (
              <div className="aspect-video bg-canvas-subtle rounded-lg" />
            ) : (
              <div className="aspect-video bg-canvas rounded-lg border border-dashed border-border flex items-center justify-center p-6">
                <p className="text-sm text-muted-light text-center italic">{cat.emptyState}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Tab Content: Chemistry ──────────────────── */
function ChemistryTab() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h3 className="text-heading-2 text-charcoal mb-4 font-serif">Proposed Formulation</h3>
        <p className="text-body text-muted leading-relaxed mb-4">
          The research direction uses a <strong>{CHEMISTRY.formulation}</strong>. Zhang et al. reported a graded colour response and used XPS to investigate reaction products in controlled test-paper experiments. Those findings support laboratory exploration; they do not yet prove that our cartridge is a calibrated cumulative dosimeter.
        </p>
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <strong>Safety constraint:</strong> Antimony trichloride is corrosive/irritating in raw form. The reactive layer must be physically isolated from skin by the cartridge housing — gas-permeable to ambient air, not skin-contacting.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[CHEMISTRY.patchA, CHEMISTRY.patchB, CHEMISTRY.patchC].map((patch) => (
          <div key={patch.name} className="card">
            <h4 className="text-sm font-semibold text-charcoal mb-2">{patch.name}</h4>
            <p className="text-sm text-muted">{patch.description}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-heading-2 text-charcoal mb-4 font-serif">Colour Quantification</h3>
        <div className="card-elevated mb-4">
          <div className="font-mono text-lg text-charcoal text-center py-4">
            {CHEMISTRY.deltaEEquation}
          </div>
        </div>
        <p className="text-body text-muted leading-relaxed mb-4">
          {CHEMISTRY.deltaEExplanation}
        </p>
        <p className="text-body text-muted leading-relaxed">
          <strong>Raw ΔE vs calibrated dose:</strong> ΔE measures colour difference. Converting to a dose (ppm·h) requires a batch-specific calibration curve built from controlled exposures. Without a validated calibration, only the raw ΔE or a clearly labeled exposure index is shown — never a fabricated dose number.
        </p>
      </div>

      <div>
        <h3 className="text-heading-2 text-charcoal mb-4 font-serif">Validation Status</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
            <span className="text-green-600 mt-0.5">✓</span>
            <p className="text-sm text-green-800"><strong>Published literature:</strong> A graded response and colour-difference relationship were reported for a controlled SbCl₃/anthocyanin test-paper experiment (Zhang et al. 2023). These are not results produced by our team.</p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <span className="text-amber-600 mt-0.5">◊</span>
            <p className="text-sm text-amber-800"><strong>Proposed/untested:</strong> Humidity robustness, natural pigment substitutes (butterfly pea, black rice, etc.), C×t reciprocity across the full occupational range, batch-to-batch reproducibility</p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <span className="text-blue-600 mt-0.5">○</span>
            <p className="text-sm text-blue-800"><strong>Our proposed work:</strong> Test whether equal concentration×time products produce equal ΔE, build per-batch calibration curves, validate cartridge isolation, and evaluate the smartphone colour pipeline.</p>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted border-t border-border pt-4">
        <strong>Primary reference:</strong> {CHEMISTRY.reference.authors} <em>{CHEMISTRY.reference.title}</em> {CHEMISTRY.reference.journal}.{" "}
        <a href={CHEMISTRY.reference.doi} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">DOI</a> (CC BY 4.0)
      </div>
    </div>
  );
}

/* ─── Tab Content: Comparison ─────────────────── */
function ComparisonTab() {
  return (
    <div>
      <p className="text-body text-muted mb-6">
        Materials and approaches considered for the H₂S-responsive formulation. This is a comparison, not confirmation that all entries are part of our selected system.
      </p>
      <div className="overflow-x-auto">
        <table className="data-table min-w-[800px]">
          <thead>
            <tr>
              <th>Material / Approach</th>
              <th>Proposed Role</th>
              <th>Response Description</th>
              <th>Evidence Available</th>
              <th>Limitations</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_TABLE.map((row) => (
              <tr key={row.material}>
                <td className="font-medium text-charcoal whitespace-nowrap">{row.material}</td>
                <td>{row.role}</td>
                <td className="max-w-xs">{row.response}</td>
                <td className="max-w-xs">{row.evidence}</td>
                <td className="max-w-xs">{row.limitations}</td>
                <td>
                  <span className={`badge ${
                    row.status.startsWith("Proposed") ? "badge-teal" :
                    row.status === "Requires confirmation" ? "badge-elevated" :
                    "badge-neutral"
                  }`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Tab Controller (needs Suspense for useSearchParams) ── */
function WorkingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = (searchParams.get("tab") as Tab) || "flowchart";

  const setTab = useCallback(
    (tab: Tab) => {
      router.push(`/working?tab=${tab}`, { scroll: false });
    },
    [router]
  );

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "flowchart": return <FlowchartTab />;
      case "images": return <ImagesTab />;
      case "chemistry": return <ChemistryTab />;
      case "comparison": return <ComparisonTab />;
      default: return <FlowchartTab />;
    }
  }, [activeTab]);

  return (
    <>
      {/* Header */}
      <section className="pt-28 pb-8">
        <div className="page-container max-w-5xl">
          <h1 className="text-display-2 text-charcoal font-serif mb-2">
            How the wristband works
          </h1>
          <p className="text-body-lg text-muted">
            From chemical colour response to a recorded exposure estimate.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="sticky top-[65px] z-30 bg-canvas/95 backdrop-blur-sm border-b border-border">
        <div className="page-container max-w-5xl">
          <div className="tab-nav" role="tablist" aria-label="Pipeline sections">
            {TABS.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setTab(tab)}
                onKeyDown={(e) => {
                  const idx = TABS.indexOf(tab);
                  if (e.key === "ArrowRight" && idx < TABS.length - 1) {
                    setTab(TABS[idx + 1]);
                  } else if (e.key === "ArrowLeft" && idx > 0) {
                    setTab(TABS[idx - 1]);
                  }
                }}
                tabIndex={activeTab === tab ? 0 : -1}
                className="tab-item"
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab content */}
      <section className="section-spacing">
        <div className="page-container max-w-5xl" role="tabpanel" aria-label={TAB_LABELS[activeTab]}>
          {tabContent}
        </div>
      </section>
    </>
  );
}

/* ─── Page Wrapper ────────────────────────────── */
export default function WorkingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <PublicNav />
      <Suspense fallback={
        <div className="pt-28 page-container"><p className="text-muted">Loading...</p></div>
      }>
        <WorkingPageContent />
      </Suspense>
      <PublicFooter />
    </div>
  );
}
