import Link from "next/link";
import { ArrowRight, ShieldCheck, Users, Activity, BarChart3 } from "lucide-react";
import DashboardPreview from "./DashboardPreview";

export default function PlatformAccess() {
  return (
    <section className="py-24 px-6 lg:px-12 bg-warm-white border-b border-light-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-teal-deep mb-2">Role-Based Operations</div>
          <h2 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-tight text-charcoal leading-tightest">
            AUTHENTICATED PLATFORM WORKSPACES
          </h2>
          <p className="text-base sm:text-lg text-sage-muted mt-6 leading-relaxed">
            Tailored interfaces for on-field shift supervisors, occupational health clinicians, and central control room commanders.
          </p>
        </div>

        {/* Browser Dashboard Preview */}
        <div className="mb-16">
          <DashboardPreview />
        </div>

        {/* Feature Split Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Shift Manager Card */}
          <div className="bg-white rounded-2xl p-8 border border-light-surface card-hover-lift">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-light text-teal-deep flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-teal-deep uppercase">On-Site Role</span>
                <h3 className="font-display text-2xl uppercase tracking-tight text-charcoal">Shift Safety Lead</h3>
              </div>
            </div>
            <p className="text-sm text-sage-muted leading-relaxed mb-6">
              Manage field technicians, execute optical check-in/check-out scans via smartphone camera, track band lifecycle rotations (Days 1–5), and view immediate post-scan triage guidance.
            </p>
            <ul className="space-y-2 text-xs font-medium text-charcoal mb-8">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-deep" />
                Live Camera Optical Viewfinder & QR Auto-Fill
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-deep" />
                Paired Start/End Shift Differential Dosimetry
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-deep" />
                Instant 1-Click OISD Form-A Incident Report Generation
              </li>
            </ul>
          </div>

          {/* Control Room / OHC Card */}
          <div className="bg-white rounded-2xl p-8 border border-light-surface card-hover-lift">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-yellow-golden/30 text-charcoal flex items-center justify-center font-bold">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-teal-deep uppercase">Command & Medical</span>
                <h3 className="font-display text-2xl uppercase tracking-tight text-charcoal">Control Room & Health Lead</h3>
              </div>
            </div>
            <p className="text-sm text-sage-muted leading-relaxed mb-6">
              Monitor refinery-wide fugitive emission hot-spots with 2D spatial triangulation, inspect 90-day worker lung-risk trajectories, evaluate olfactory fatigue tests, and oversee statutory compliance.
            </p>
            <ul className="space-y-2 text-xs font-medium text-charcoal mb-8">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-deep" />
                2D Spatial Fugitive Leak Triangulation Heatmap
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-deep" />
                Longitudinal 90-Day Occupational Health Risk Scoring
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-deep" />
                Real-time Server-Sent Events (SSE) Broadcast Stream
              </li>
            </ul>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-3 bg-charcoal text-white hover:bg-black font-semibold text-base px-8 py-4 rounded-full transition-all duration-300 shadow-md hover:shadow-lg group"
          >
            <span>OPEN MONITORING PLATFORM</span>
            <ArrowRight className="w-5 h-5 text-yellow-golden group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
