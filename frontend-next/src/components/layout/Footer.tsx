import Link from "next/link";
import { PROJECT_NAME, ENGINE_NAME } from "@/lib/constants";
import { ShieldCheck, AlertCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-charcoal text-sage border-t border-dark-surface mt-auto py-12 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Col 1: Brand & Purpose */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl uppercase tracking-tight text-white flex items-center">
              {PROJECT_NAME}
              <span className="text-yellow-golden text-4xl leading-none">.</span>
            </span>
          </div>
          <p className="text-sm text-sage-light max-w-md leading-relaxed">
            Passive colourimetric dosimeter wristband platform and smartphone optical reading system.
            Connecting occupational exposure data with longitudinal health records in petroleum refining environments.
          </p>
          <div className="flex items-center gap-2 text-xs text-yellow-golden bg-charcoal-card p-3 rounded-lg border border-dark-surface max-w-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-yellow-golden" />
            <span>Research prototype for cumulative exposure assessment. Not a continuous gas alarm.</span>
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold tracking-wider uppercase text-white">Platform Navigation</h4>
          <Link href="/" className="text-sm hover:text-white transition-colors">Home</Link>
          <Link href="/working" className="text-sm hover:text-white transition-colors">Pipeline & Science</Link>
          <Link href="/working?tab=chemistry" className="text-sm hover:text-white transition-colors">SbCl₃ Chemistry</Link>
          <Link href="/working?tab=comparison" className="text-sm hover:text-white transition-colors">Formulation Comparison</Link>
          <Link href="/login" className="text-sm hover:text-white transition-colors">Manager Login</Link>
        </div>

        {/* Col 3: Operational */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold tracking-wider uppercase text-white">Workspaces</h4>
          <Link href="/manager" className="text-sm hover:text-white transition-colors">Shift Manager</Link>
          <Link href="/manager/scan" className="text-sm hover:text-white transition-colors">Optical Band Scanner</Link>
          <Link href="/control-room" className="text-sm hover:text-white transition-colors">Control Room Overview</Link>
          <Link href="/workers/EMP-1042" className="text-sm hover:text-white transition-colors">Worker Longitudinal Dossier</Link>
          <Link href="/admin" className="text-sm hover:text-white transition-colors">Administration</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-dark-surface flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-sage-muted">
        <div suppressHydrationWarning>
          © {new Date().getFullYear()} {PROJECT_NAME}. Powered by {ENGINE_NAME}.
        </div>
        <div className="flex items-center gap-6">
          <span>OISD-STD-105 / 155 Statutory Baseline</span>
          <span>CIELAB ΔE Optical Quantification</span>
        </div>
      </div>
    </footer>
  );
}
