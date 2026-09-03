"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { PROJECT } from "@/lib/content";

function WorkingTabs() {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const validTabs = ["flowchart", "images", "chemistry", "comparison"] as const;
  type TabType = typeof validTabs[number];
  const initialTab: TabType = validTabs.includes(rawTab as TabType) ? (rawTab as TabType) : "flowchart";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && validTabs.includes(tab as TabType) && tab !== activeTab) {
      setActiveTab(tab as TabType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setTab = (tab: TabType) => {
    setActiveTab(tab);
    window.history.pushState(null, "", `?tab=${tab}`);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "flowchart", label: "Flowchart" },
    { id: "images", label: "Images" },
    { id: "chemistry", label: "Chemistry" },
    { id: "comparison", label: "Comparison" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-medium text-text-primary">How the wristband works</h1>
        <p className="text-lg text-text-secondary mt-2">From chemical colour response to a recorded exposure estimate.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border overflow-x-auto mb-8">
        <nav className="flex space-x-1 sm:space-x-6 min-w-max" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(tab.id)}
                className={`whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-2">
        {activeTab === "flowchart" && <FlowchartTab />}
        {activeTab === "images" && <ImagesTab />}
        {activeTab === "chemistry" && <ChemistryTab />}
        {activeTab === "comparison" && <ComparisonTab />}
      </div>
    </div>
  );
}

function FlowchartTab() {
  const [activeStage, setActiveStage] = useState<number | null>(null);

  const stages = [
    {
      id: 1, name: "Assign & Resolve",
      process: "Assign a band to a worker and resolve its batch/calibration identity via QR barcode scan.",
      input: "Worker ID, Band barcode",
      output: "Active band record linked to worker",
      limitation: "Requires network access to confirm calibration batch.",
    },
    {
      id: 2, name: "Capture Baseline",
      process: "Capture the start-of-shift badge state under controlled illumination.",
      input: "Band (unexposed), smartphone camera",
      output: "Baseline ΔE reading (≈ 0)",
      limitation: "Baseline assumes clean environmental start with no prior partial exposure.",
    },
    {
      id: 3, name: "Passive Exposure",
      process: "The passive reactive patch A responds during wear in hazardous areas.",
      input: "Gaseous H₂S in environment, passive diffusion",
      output: "Cumulative irreversible color change on Patch A",
      limitation: "Only measures cumulative gaseous H₂S. Does not alarm in real-time.",
    },
    {
      id: 4, name: "End-Shift Capture",
      process: "Capture the end-of-shift state under controlled illumination.",
      input: "Band (post-exposure), smartphone camera",
      output: "End-shift ΔE reading",
      limitation: "Must be performed promptly after shift ends.",
    },
    {
      id: 5, name: "Quality Check",
      process: "Locate and sample Patches A, B, and C. Check image quality and badge physical condition.",
      input: "Captured photograph",
      output: "Patch coordinates, quality score, validity flag",
      limitation: "Invalidated if Reference Patch B shows alteration or Patch C signals liquid breach.",
    },
    {
      id: 6, name: "Calculate ΔE",
      process: "Convert pixel data to CIELAB color space and calculate CIE76 Euclidean color difference.",
      input: "RGB pixels from Patches A and B",
      output: "ΔE value (dimensionless)",
      limitation: "Dependent on phone camera ISP normalization; corrected via Patch B reference.",
    },
    {
      id: 7, name: "Apply Calibration",
      process: "Apply an eligible calibration curve if available, and assess measurement uncertainty.",
      input: "ΔE value, calibration curve ID",
      output: "Shift dose estimate (ppm·h), uncertainty band",
      limitation: "Dose is only an estimate without a validated lab calibration curve.",
    },
    {
      id: 8, name: "Record & Alert",
      process: "Save the result, update worker exposure ledger, and apply configured HSE alert rules.",
      input: "Dose estimate, worker record",
      output: "Audit log entry, Tier 1/2/3 alert if threshold breached",
      limitation: "Historical cumulative record only — not a continuous gas alarm.",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <p className="text-text-secondary max-w-3xl leading-relaxed">
        Eight operational stages from band issuance through statutory exposure recording. Click a stage to expand its details.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            onClick={() => setActiveStage(activeStage === stage.id ? null : stage.id)}
            className="card p-5 flex items-start gap-4 hover:border-primary transition-colors cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-surface-background text-text-secondary border border-border flex items-center justify-center font-semibold shrink-0 group-hover:bg-primary-light group-hover:text-primary group-hover:border-primary transition-colors">
              {stage.id}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-text-primary">{stage.name}</h3>
              <p className="text-sm text-text-secondary mt-1">{stage.process}</p>

              {activeStage === stage.id && (
                <div className="mt-3 space-y-2 text-xs">
                  <div className="p-2 bg-surface-background rounded border border-border">
                    <span className="font-medium text-text-primary">Input:</span>{" "}
                    <span className="text-text-secondary">{stage.input}</span>
                  </div>
                  <div className="p-2 bg-surface-background rounded border border-border">
                    <span className="font-medium text-text-primary">Output:</span>{" "}
                    <span className="text-text-secondary">{stage.output}</span>
                  </div>
                  <div className="p-2 bg-status-warningBg border border-status-warning rounded">
                    <span className="font-medium text-status-warning">Limitation:</span>{" "}
                    <span className="text-status-warning">{stage.limitation}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImagesTab() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Concept Illustration */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="badge bg-primary-light text-primary text-xs font-semibold">Concept Illustration</span>
          <span className="text-xs text-text-secondary">Not a manufactured product photograph</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-8 items-center justify-center py-8">
          {/* SVG Wristband Concept */}
          <svg width="340" height="200" viewBox="0 0 340 200" fill="none" className="mx-auto">
            {/* Strap */}
            <path d="M40 100 C40 40, 160 40, 160 100 C160 160, 40 160, 40 100" stroke="#dadce0" strokeWidth="28" strokeLinecap="round" />
            {/* Cartridge housing */}
            <rect x="68" y="55" width="90" height="90" rx="10" fill="white" stroke="#dadce0" strokeWidth="3" />
            {/* QR code abstraction */}
            <rect x="83" y="63" width="25" height="25" rx="3" fill="#202124" />
            <rect x="86" y="66" width="7" height="7" fill="white" />
            <rect x="96" y="66" width="5" height="5" fill="white" />
            <rect x="86" y="76" width="5" height="5" fill="white" />
            {/* Patch A */}
            <circle cx="95" cy="115" r="12" fill="#f9ab00" opacity="0.9" />
            <text x="95" y="139" fontSize="9" textAnchor="middle" fill="#5f6368">A (Active)</text>
            {/* Patch B */}
            <circle cx="120" cy="115" r="10" fill="#1a73e8" opacity="0.85" />
            <text x="120" y="139" fontSize="9" textAnchor="middle" fill="#5f6368">B (Ref)</text>
            {/* Patch C */}
            <circle cx="142" cy="115" r="8" fill="#1e8e3e" opacity="0.85" />
            <text x="142" y="139" fontSize="9" textAnchor="middle" fill="#5f6368">C</text>
            {/* Label */}
            <text x="165" y="180" fontSize="11" fill="#9aa0a6" textAnchor="middle">Proposed cartridge layout</text>
          </svg>

          <div className="space-y-3 max-w-xs text-sm text-text-secondary">
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f9ab00] mt-1 shrink-0"></div>
              <span><strong className="text-text-primary">Patch A (Active):</strong> Exposed to ambient H₂S through PTFE membrane. Color changes irreversibly.</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1a73e8] mt-1 shrink-0"></div>
              <span><strong className="text-text-primary">Patch B (Reference):</strong> Hermetically sealed. Corrects for UV, temperature, and camera variance.</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1e8e3e] mt-1 shrink-0"></div>
              <span><strong className="text-text-primary">Patch C (Condition):</strong> Hydrochromic indicator. Signals liquid breach or physical compromise.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="aspect-video bg-surface-background border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-text-disabled p-4">
            <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
            <span className="text-xs text-center">Physical prototype photograph pending lab manufacture</span>
          </div>
          <p className="text-xs font-medium text-text-primary">Physical Prototype</p>
          <p className="text-xs text-text-secondary">Substrate fabrication and optical testing in progress.</p>
        </div>
        <div className="space-y-3">
          <div className="aspect-video bg-surface-background border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-text-disabled p-4">
            <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="14" r="4"/><line x1="12" y1="6" x2="12" y2="6"/></svg>
            <span className="text-xs text-center">Smartphone capture workflow — synthetic demonstration</span>
          </div>
          <p className="text-xs font-medium text-text-primary">Capture Workflow</p>
          <p className="text-xs text-text-secondary">Shows the smartphone camera alignment and patch sampling area.</p>
        </div>
      </div>

      <div className="p-4 bg-status-warningBg border border-status-warning rounded-lg">
        <p className="text-sm text-status-warning">
          <strong>Pending Validation:</strong> Physical prototype photographs and calibrated gas-chamber test images are pending. Placeholder visuals are clearly marked as concept illustrations or synthetic demonstrations.
        </p>
      </div>
    </div>
  );
}

function ChemistryTab() {
  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-medium text-text-primary mb-3">SbCl&#8323;&#8211;Anthocyanin Formulation</h2>
        <p className="text-text-secondary leading-relaxed">
          The proposed passive sensing formulation uses Antimony Trichloride (SbCl&#8323;) combined with natural anthocyanin extracts from purple cabbage. When exposed to Hydrogen Sulfide gas, the composite undergoes an irreversible colorimetric shift.
        </p>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-medium text-text-primary">Patch Architecture</h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-surface-background border border-border rounded-lg flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-[#f9ab00] mt-0.5 shrink-0"></div>
            <div>
              <strong className="text-text-primary">Patch A (Active Reactive):</strong>
              <span className="text-text-secondary"> Exposed to the environment through a semi-permeable PTFE membrane. Irreversibly changes color proportional to cumulative H&#8322;S exposure.</span>
            </div>
          </div>
          <div className="p-3 bg-surface-background border border-border rounded-lg flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-[#1a73e8] mt-0.5 shrink-0"></div>
            <div>
              <strong className="text-text-primary">Patch B (Sealed Reference):</strong>
              <span className="text-text-secondary"> Hermetically sealed, impermeable to gas. Compensates for baseline optical drift, UV degradation, and camera temperature variations.</span>
            </div>
          </div>
          <div className="p-3 bg-surface-background border border-border rounded-lg flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-[#1e8e3e] mt-0.5 shrink-0"></div>
            <div>
              <strong className="text-text-primary">Patch C (Condition Indicator):</strong>
              <span className="text-text-secondary"> Moisture-sensitive indicator. Flags seal compromise or liquid immersion, invalidating the reading.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-medium text-text-primary">CIE76 Color Difference Equation</h3>
        <div className="bg-surface-background border border-border rounded-lg p-6 text-center">
          <code className="text-lg text-text-primary font-mono block">
            &#916;E = &#8730;[(L&#8322;&#8211;L&#8321;)&#178; + (a&#8322;&#8211;a&#8321;)&#178; + (b&#8322;&#8211;b&#8321;)&#178;]
          </code>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-surface-background border border-border rounded">
            <strong className="text-text-primary">L*</strong>
            <p className="text-text-secondary text-xs mt-1">Lightness axis (0 = black, 100 = white)</p>
          </div>
          <div className="p-3 bg-surface-background border border-border rounded">
            <strong className="text-text-primary">a*</strong>
            <p className="text-text-secondary text-xs mt-1">Green-to-Red chromatic axis</p>
          </div>
          <div className="p-3 bg-surface-background border border-border rounded">
            <strong className="text-text-primary">b*</strong>
            <p className="text-text-secondary text-xs mt-1">Blue-to-Yellow chromatic axis</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          The raw &#916;E value (dimensionless color difference) is then mapped to an estimated dose (ppm&#183;h) through an empirical calibration curve validated against certified H&#8322;S concentrations in a controlled gas chamber. Without a validated calibration, the system displays &#916;E only, labeled as &quot;Dose calibration unavailable.&quot;
        </p>
      </div>

      <div className="p-4 bg-status-warningBg border border-status-warning rounded-lg">
        <p className="text-sm text-status-warning">
          <strong>Pending Validation:</strong> The kinetic response curve of the SbCl&#8323; formulation is pending primary lab calibration. Detection limit thresholds are provisional until validated. No unvalidated numeric claims are published.
        </p>
      </div>
    </div>
  );
}

function ComparisonTab() {
  const data = [
    {
      material: "SbCl&#8323;&#8211;Anthocyanin (Composite)",
      role: "Proposed primary reactive compound",
      response: "Irreversible visual colorimetric shift proportional to H&#8322;S dose",
      evidence: "Literature support for SbCl&#8323; sulfide precipitation; prototype calibration pending",
      limitations: "Calibration curve requires rigorous controlled-environment validation",
      status: "Primary Candidate",
      statusClass: "bg-primary-light text-primary",
    },
    {
      material: "Anthocyanin Only (Control)",
      role: "Baseline pH-sensitive indicator dye",
      response: "pH-dependent color shift",
      evidence: "Well documented in food science literature",
      limitations: "Reversible; high cross-sensitivity to humidity and ambient pH",
      status: "Control Reference",
      statusClass: "bg-surface-background text-text-secondary",
    },
    {
      material: "Lead Acetate Paper (Pb(CH&#8323;COO)&#8322;)",
      role: "Legacy comparison baseline",
      response: "Black/brown PbS precipitation on H&#8322;S contact",
      evidence: "Extensively validated and commercially used",
      limitations: "Highly toxic heavy metal; carcinogenic; environmental hazard under REACH/RoHS",
      status: "Comparison Baseline",
      statusClass: "bg-surface-background text-text-secondary",
    },
    {
      material: "PbCl&#8322; (Lead Chloride)",
      role: "Mentioned in project sketch &#8212; role requires confirmation",
      response: "Similar sulfide precipitation to Lead Acetate",
      evidence: "Literature indicates function as H&#8322;S sensor",
      limitations: "Heavy metal toxicity; no validated role defined in our project",
      status: "Requires Confirmation",
      statusClass: "bg-status-warningBg text-status-warning",
    },
  ];

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-text-secondary max-w-3xl leading-relaxed mb-6">
        Comparison of proposed and reference sensing materials for H&#8322;S colorimetric dosimetry. Status reflects our project&#39;s current assessment only.
      </p>
      <div className="card p-0 overflow-x-auto border border-border">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-surface-background text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <th className="px-5 py-3 border-b border-border">Material / Approach</th>
              <th className="px-5 py-3 border-b border-border">Proposed Role</th>
              <th className="px-5 py-3 border-b border-border">Response</th>
              <th className="px-5 py-3 border-b border-border">Evidence</th>
              <th className="px-5 py-3 border-b border-border">Limitations</th>
              <th className="px-5 py-3 border-b border-border">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm text-text-primary">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-surface-hover">
                <td className="px-5 py-4 font-medium" dangerouslySetInnerHTML={{ __html: row.material }} />
                <td className="px-5 py-4 text-text-secondary" dangerouslySetInnerHTML={{ __html: row.role }} />
                <td className="px-5 py-4 text-text-secondary" dangerouslySetInnerHTML={{ __html: row.response }} />
                <td className="px-5 py-4 text-text-secondary">{row.evidence}</td>
                <td className="px-5 py-4 text-text-secondary">{row.limitations}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.statusClass}`}>
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

export default function WorkingPage() {
  return (
    <div className="min-h-screen bg-surface-background">
      {/* Public Navbar */}
      <header className="bg-surface border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-white rounded flex items-center justify-center font-bold text-xs">
                H&#8322;S
              </div>
              <span className="font-medium text-text-primary hidden sm:block">{PROJECT.name}</span>
            </Link>
            <nav className="flex space-x-6 text-sm font-medium">
              <Link href="/" className="text-text-secondary hover:text-text-primary transition-colors">Home</Link>
              <Link href="/working" className="text-primary">Pipeline</Link>
              <Link href="/login" className="text-text-secondary hover:text-text-primary transition-colors">Login</Link>
            </nav>
          </div>
        </div>
      </header>

      <Suspense fallback={
        <div className="p-12 text-center text-text-secondary">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading pipeline...
        </div>
      }>
        <WorkingTabs />
      </Suspense>

      <footer className="border-t border-border py-8 bg-surface-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-text-disabled text-white rounded flex items-center justify-center font-bold text-[10px]">H&#8322;S</div>
            <span className="font-medium text-text-secondary text-sm">{PROJECT.name}</span>
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/" className="text-text-secondary hover:text-text-primary">Home</Link>
            <Link href="/working" className="text-text-secondary hover:text-text-primary">Pipeline</Link>
            <Link href="/login" className="text-text-secondary hover:text-text-primary">Login</Link>
          </nav>
          <span className="text-xs px-2 py-1 bg-status-warningBg text-status-warning rounded font-medium">Research Prototype</span>
        </div>
      </footer>
    </div>
  );
}
