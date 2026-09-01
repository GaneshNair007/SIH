export default function ComparisonTab() {
  const comparisons = [
    {
      approach: "SbCl₃–Anthocyanin Composite",
      role: "Active colorimetric sensing layer (Patch A)",
      evidence: "Molecules 2023, 28, 5044; reported 200 ppb lab LOD and ~1–10 ppm monotonic ΔE response.",
      limitations: "Irreversible darkening; SbCl₃ is toxic and requires non-skin contact physical cartridge housing.",
      status: "Selected Laboratory Benchmark",
      statusColor: "bg-teal-light text-teal-deep border-teal-deep/30",
    },
    {
      approach: "Anthocyanin-Only Substrate",
      role: "Reference blank drift control (Patch B)",
      evidence: "Empirical control; cyanidin pigments degrade under UV sunlight and humidity independent of H₂S.",
      limitations: "Zero sensitivity to low-concentration H₂S; serves exclusively as an environmental drift baseline.",
      status: "Selected Control Mechanism",
      statusColor: "bg-teal-light text-teal-deep border-teal-deep/30",
    },
    {
      approach: "Lead Acetate [Pb(C₂H₃O₂)₂]",
      role: "Traditional paper strip indicator",
      evidence: "ASTM D2420, historical standard for H₂S presence forming brownish-black Lead Sulfide (PbS).",
      limitations: "High neurotoxicity, cumulative heavy metal bioaccumulation, hazardous disposal constraints in field operations.",
      status: "Excluded (Toxicity / Safety)",
      statusColor: "bg-red-50 text-red-700 border-red-200",
    },
    {
      approach: "Lead Chloride [PbCl₂]",
      role: "Requires confirmation",
      evidence: "Inorganic lead halide forming PbS in research literature; distinct chemical precursor from acetate.",
      limitations: "Environmental hazard; heavy metal regulatory restrictions under OSHA and Indian refinery rules.",
      status: "Excluded / Not Adopted",
      statusColor: "bg-gray-100 text-gray-700 border-gray-300",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal">
          Formulation & Material Comparison
        </h3>
        <p className="text-sm text-sage-muted mt-2">
          Evaluating alternative colorimetric approaches, baseline controls, and statutory safety limitations.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-light-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-warm-white border-b border-light-surface text-xs font-mono font-bold uppercase text-charcoal">
                <th className="p-4 pl-6">Approach</th>
                <th className="p-4">Operational Role</th>
                <th className="p-4">Scientific Evidence</th>
                <th className="p-4">Limitations</th>
                <th className="p-4 pr-6">Project Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-surface text-xs text-charcoal">
              {comparisons.map((row, idx) => (
                <tr key={idx} className="hover:bg-warm-white/50 transition-colors">
                  <td className="p-4 pl-6 font-bold text-sm text-charcoal">
                    {row.approach}
                  </td>
                  <td className="p-4 text-sage-muted font-medium">
                    {row.role}
                  </td>
                  <td className="p-4 text-sage-muted leading-relaxed max-w-xs">
                    {row.evidence}
                  </td>
                  <td className="p-4 text-sage-muted leading-relaxed max-w-xs">
                    {row.limitations}
                  </td>
                  <td className="p-4 pr-6">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
