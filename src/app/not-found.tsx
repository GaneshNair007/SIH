import Link from "next/link";
import { PROJECT } from "@/lib/content";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-background text-text-primary">
      {/* Top Header / Brand Bar */}
      <header className="bg-surface border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold text-xs shadow-elevation-1 transition-transform group-hover:scale-105">
                H₂S
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-text-primary text-sm sm:text-base leading-tight">
                  {PROJECT.name}
                </span>
                <span className="text-[10px] text-text-secondary hidden sm:block">
                  Industrial Dosimetry & Workplace Safety
                </span>
              </div>
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link
                href="/"
                className="text-text-secondary hover:text-text-primary transition-colors hidden sm:inline-block"
              >
                Home
              </Link>
              <Link
                href="/working"
                className="text-text-secondary hover:text-text-primary transition-colors hidden sm:inline-block"
              >
                Pipeline
              </Link>
              <Link
                href="/dashboard"
                className="btn-secondary text-xs sm:text-sm py-1.5 px-3"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main 404 Hero & Navigation Hub */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
        <div className="w-full card p-6 sm:p-10 border border-border shadow-elevation-2 bg-surface">
          {/* Header Status & Icon */}
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Status Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="badge-warning">
                <svg
                  className="w-3.5 h-3.5 mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Error 404 • Unmapped Sector
              </span>
              <span className="badge-neutral">
                <svg
                  className="w-3.5 h-3.5 mr-1 text-status-success"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Safety Systems Active
              </span>
            </div>

            {/* Industrial Safety SVG Illustration */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-28 h-28 rounded-2xl bg-primary-light/60 border border-primary/20 flex items-center justify-center shadow-elevation-1">
                <svg
                  className="w-14 h-14 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <circle cx="12" cy="11" r="3" />
                  <line x1="12" y1="5" x2="12" y2="7" />
                  <line x1="12" y1="15" x2="12" y2="17" />
                  <line x1="6" y1="11" x2="8" y2="11" />
                  <line x1="16" y1="11" x2="18" y2="11" />
                </svg>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-status-warningBg border border-status-warning flex items-center justify-center text-status-warning font-mono text-xs font-bold shadow-sm">
                404
              </div>
            </div>

            {/* Typography */}
            <h1 className="text-3xl sm:text-4xl font-medium text-text-primary tracking-tight">
              Monitoring Zone Not Found
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl leading-relaxed">
              The requested safety route, dosimetry ledger, or telemetry parameter does not exist in the plant registry. You may have entered an uncharted sector or followed an expired shift link.
            </p>

            {/* Plant Safety Status Notice */}
            <div className="w-full max-w-2xl bg-surface-background border border-border rounded-lg p-4 text-left flex items-start gap-3 mt-2">
              <div className="w-5 h-5 rounded-full bg-status-successBg text-status-success flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-xs sm:text-sm text-text-secondary">
                <span className="font-medium text-text-primary">Safety Perimeter Maintained: </span>
                Active dosimeter badge synchronization, ΔE optical calibration pipelines, and plant hazard logs remain operational. Select an authorized navigation zone below to resume monitoring.
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/" className="btn-secondary px-5 py-2.5">
                <svg
                  className="w-4 h-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Return to Home
              </Link>
              <Link href="/dashboard" className="btn-primary px-5 py-2.5">
                <svg
                  className="w-4 h-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="7" height="9" x="3" y="3" rx="1" />
                  <rect width="7" height="5" x="14" y="3" rx="1" />
                  <rect width="7" height="9" x="14" y="12" rx="1" />
                  <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
                Open Safety Dashboard
              </Link>
            </div>
          </div>

          {/* Quick Route Directory Hub */}
          <div className="mt-10 pt-8 border-t border-border">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4 text-center sm:text-left">
              Verified Navigation Hubs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/"
                className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover hover:border-primary/40 transition-all group shadow-sm flex flex-col"
              >
                <div className="w-8 h-8 rounded bg-primary-light text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                </div>
                <div className="font-medium text-sm text-text-primary group-hover:text-primary transition-colors">
                  Public Home
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  System architecture, 4-pillar overview & team credentials.
                </div>
              </Link>

              <Link
                href="/dashboard"
                className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover hover:border-primary/40 transition-all group shadow-sm flex flex-col"
              >
                <div className="w-8 h-8 rounded bg-primary-light text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                  </svg>
                </div>
                <div className="font-medium text-sm text-text-primary group-hover:text-primary transition-colors">
                  Shift Dashboard
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  Plant unit breakdown, live KPIs & worker exposure summaries.
                </div>
              </Link>

              <Link
                href="/working"
                className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover hover:border-primary/40 transition-all group shadow-sm flex flex-col"
              >
                <div className="w-8 h-8 rounded bg-primary-light text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 2v7.31M14 9.3V1.99M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
                  </svg>
                </div>
                <div className="font-medium text-sm text-text-primary group-hover:text-primary transition-colors">
                  Science Pipeline
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  Interactive chemical reaction matrix, ΔE flow & calibration.
                </div>
              </Link>

              <Link
                href="/scan"
                className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover hover:border-primary/40 transition-all group shadow-sm flex flex-col"
              >
                <div className="w-8 h-8 rounded bg-primary-light text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <rect x="7" y="7" width="10" height="10" rx="1" />
                  </svg>
                </div>
                <div className="font-medium text-sm text-text-primary group-hover:text-primary transition-colors">
                  Dosimeter Check-In
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  Optical patch image analysis & QR identity verification.
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-success inline-block"></span>
            <span>OISD-STD-105 & DGMS Industrial Workplace Safety Protocol</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-text-primary transition-colors">
              Home
            </Link>
            <Link href="/working" className="hover:text-text-primary transition-colors">
              Pipeline
            </Link>
            <Link href="/login" className="hover:text-text-primary transition-colors">
              Authentication
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
