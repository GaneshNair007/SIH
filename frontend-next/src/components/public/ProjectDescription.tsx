import { Watch, Smartphone, FileBarChart2, ArrowRight } from "lucide-react";

export default function ProjectDescription() {
  const steps = [
    {
      icon: Watch,
      badge: "01 / WEAR",
      title: "Passive Colorimetric Dosimetry",
      description: "A passive antimony chloride (SbCl₃) and purple-cabbage anthocyanin composite develops an irreversible colorimetric response upon contact with airborne H₂S. Wearers are protected by a sealed, replaceable cartridge separated from direct skin contact.",
    },
    {
      icon: Smartphone,
      badge: "02 / READ",
      title: "Controlled Smartphone Optical Capture",
      description: "Workers check in at the start and end of shifts. A smartphone camera captures the wristband, automatically reading the QR code, assessing lighting quality, segmenting active spots vs control patches, and computing CIELAB ΔE net optical change.",
    },
    {
      icon: FileBarChart2,
      badge: "03 / REVIEW",
      title: "Longitudinal Exposure Records",
      description: "Authorized shift supervisors and health officers track rolling 7-day, 30-day, and 90-day exposure ledgers. The platform applies deterministic statutory tiering, flags patch integrity drift, and generates compliance documentation.",
    },
  ];

  return (
    <section className="py-24 px-6 lg:px-12 bg-white border-b border-light-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-teal-deep mb-2">Integrated Platform Workflow</div>
          <h2 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-tight text-charcoal leading-tightest">
            ONE BAND. <br />
            A CONNECTED RECORD.
          </h2>
          <p className="text-base sm:text-lg text-sage-muted mt-6 leading-relaxed">
            Bridging the gap between physical colourimetric response and compliant digital health intelligence across petroleum refining operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-warm-white rounded-2xl p-8 border border-light-surface card-hover-lift flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono font-bold tracking-wider text-teal-deep px-2.5 py-1 rounded bg-teal-light">
                      {step.badge}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-white border border-light-surface flex items-center justify-center text-charcoal shadow-sm">
                      <Icon className="w-6 h-6 text-teal-deep" />
                    </div>
                  </div>
                  <h3 className="font-display text-2xl uppercase tracking-tight text-charcoal mb-4">
                    {step.title}
                  </h3>
                  <p className="text-sm text-sage-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-light-surface flex items-center gap-2 text-xs font-semibold text-charcoal">
                  <span>Standardized refinery protocol</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
