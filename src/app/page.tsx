"use client";

import Link from "next/link";
import { useState } from "react";
import { PROJECT, TEAM, ROLES_DESCRIPTION } from "@/lib/content";

export default function HomePage() {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (name: string) => {
    setImageErrors((prev) => ({ ...prev, [name]: true }));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-background">
      {/* Public Navbar */}
      <header className="bg-surface border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-3 group no-underline">
              <div className="w-8 h-8 bg-primary text-white rounded flex items-center justify-center font-bold text-xs shadow-sm group-hover:bg-primary-hover transition-colors">
                H₂S
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-text-primary text-base leading-tight group-hover:text-primary transition-colors">
                  {PROJECT.shortName} AI
                </span>
                <span className="text-[11px] text-text-secondary hidden sm:inline">
                  H₂S Dose Monitoring Platform
                </span>
              </div>
            </Link>
            <nav className="flex space-x-6 text-sm font-medium items-center">
              <Link href="/" className="text-primary font-semibold">Home</Link>
              <Link href="/working" className="text-text-secondary hover:text-text-primary transition-colors">Pipeline</Link>
              <Link href="/login" className="btn-primary text-xs px-4 py-2">Platform Login</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-medium border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Next-Gen Industrial Safety • OISD-STD-105 Aligned</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-text-primary tracking-tight leading-tight">
              Continuous Passive <span className="text-primary">H₂S Dosimetry</span> for Industrial Workforce
            </h1>
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl leading-relaxed">
              A wearable passive chemical wristband that records cumulative gaseous H₂S exposure. Scan with standard mobile devices to convert irreversible chemo-optical shifts into verified Time-Weighted Average (TWA) worker safety records.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center lg:justify-start">
              <Link href="/working" className="btn-secondary text-base px-6 py-3 flex items-center justify-center gap-2">
                <span>Explore Science Pipeline</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link href="/login" className="btn-primary text-base px-6 py-3 flex items-center justify-center gap-2 shadow-elevation-1">
                <span>Launch Operational Platform</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
              </Link>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md mx-auto">
            {/* High-Fidelity Vector Dosimeter Illustration */}
            <div className="card p-8 bg-surface border border-border shadow-elevation-2 flex flex-col items-center justify-center aspect-square relative overflow-hidden">
              <div className="absolute top-4 left-4 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-status-success" />
                <span className="text-xs font-mono text-text-secondary font-medium">Rakshak Strip v2.4</span>
              </div>
              <span className="absolute top-4 right-4 text-[11px] bg-primary-light text-primary font-medium px-2 py-0.5 rounded">
                Multi-Layer Substrate
              </span>

              <svg width="240" height="240" viewBox="0 0 240 240" fill="none" className="text-border">
                {/* Wristband strap */}
                <path d="M50 120 C50 48, 190 48, 190 120 C190 192, 50 192, 50 120" stroke="#5f6368" strokeWidth="28" strokeLinecap="round" opacity="0.25" />
                {/* Cartridge Housing */}
                <rect x="75" y="65" width="90" height="110" rx="10" fill="#ffffff" stroke="#dadce0" strokeWidth="3" />
                <rect x="80" y="70" width="80" height="100" rx="8" fill="#f8f9fa" />

                {/* 12x12mm 2D DataMatrix / QR Fiducial */}
                <rect x="95" y="76" width="50" height="38" rx="4" fill="#202124" />
                {/* QR pattern abstractions */}
                <rect x="100" y="81" width="10" height="10" fill="#ffffff" />
                <rect x="102" y="83" width="6" height="6" fill="#202124" />
                <rect x="130" y="81" width="10" height="10" fill="#ffffff" />
                <rect x="132" y="83" width="6" height="6" fill="#202124" />
                <rect x="100" y="99" width="8" height="8" fill="#ffffff" />
                <rect x="114" y="84" width="10" height="4" fill="#ffffff" />
                <rect x="114" y="92" width="6" height="6" fill="#ffffff" />
                <rect x="124" y="96" width="14" height="6" fill="#ffffff" />

                {/* Titanium Dioxide (TiO2) White Ring Surrounding Optical Zones */}
                <rect x="86" y="122" width="68" height="40" rx="6" fill="#ffffff" stroke="#dadce0" strokeWidth="1.5" />

                {/* Patch A (Active Sensing Zone) */}
                <circle cx="98" cy="142" r="9" fill="#ffffff" stroke="#dadce0" strokeWidth="1.5" />
                <circle cx="98" cy="142" r="7" fill="#f9ab00" />

                {/* Patch B (Sealed Optical Reference) */}
                <circle cx="120" cy="142" r="9" fill="#ffffff" stroke="#dadce0" strokeWidth="1.5" />
                <circle cx="120" cy="142" r="7" fill="#1a73e8" />

                {/* Patch C (Hydrochromic Condition Indicator) */}
                <circle cx="142" cy="142" r="7" fill="#ffffff" stroke="#dadce0" strokeWidth="1.5" />
                <circle cx="142" cy="142" r="5" fill="#1e8e3e" />
              </svg>

              <div className="w-full flex justify-between items-center text-[10px] text-text-secondary mt-2 px-4 border-t border-border pt-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-warning inline-block" /> Patch A (Active)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Patch B (Ref)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-success inline-block" /> Patch C (Seal)</span>
              </div>
            </div>
          </div>
        </section>

        {/* System Overview: 4 Pillars */}
        <section className="py-16 bg-surface border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-medium text-text-primary tracking-tight">System Architecture Overview</h2>
              <p className="text-text-secondary mt-3 text-base">
                Bridging non-toxic material chemistry, edge computer vision, and industrial compliance telemetry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Pillar 1: The Problem */}
              <div className="card p-6 border border-border flex flex-col justify-between hover:shadow-elevation-2 transition-shadow">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <h3 className="text-lg font-medium text-text-primary">1. Problem Statement</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Keeping verifiable, tamper-evident longitudinal records of individual workers&apos; cumulative exposure in hazardous hydrocarbon refining is prohibitively expensive with bulky electronic monitors alone.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 text-xs text-primary font-medium">
                  Scalable Personal Safety
                </div>
              </div>

              {/* Pillar 2: The Hardware */}
              <div className="card p-6 border border-border flex flex-col justify-between hover:shadow-elevation-2 transition-shadow">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  </div>
                  <h3 className="text-lg font-medium text-text-primary">2. Hardware Dosimeter</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Multi-layer disposable cartridge featuring non-toxic SbCl₃–Anthocyanin reactive matrix, PTFE gas diffusion membrane, and certified TiO₂ reference white standard isolated from dermal contact.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 text-xs text-primary font-medium">
                  5-Day Wear Lifecycle
                </div>
              </div>

              {/* Pillar 3: The Software Platform */}
              <div className="card p-6 border border-border flex flex-col justify-between hover:shadow-elevation-2 transition-shadow">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  </div>
                  <h3 className="text-lg font-medium text-text-primary">3. Software Platform</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Smartphone computer vision normalizes camera white-point, extracts Patch A/B/C pixels, computes CIELAB ΔE Euclidean distances, and maps dose against batch calibration curves.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 text-xs text-primary font-medium">
                  D65 Normalized CIELAB
                </div>
              </div>

              {/* Pillar 4: Operational Purpose */}
              <div className="card p-6 border border-border flex flex-col justify-between hover:shadow-elevation-2 transition-shadow">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <h3 className="text-lg font-medium text-text-primary">4. Operational Purpose</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Permanent encrypted shift dossiers, workforce cumulative load heatmaps, automated Tier 1/2/3 breach escalation, and OISD-STD-105 statutory compliance reporting.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 text-xs text-primary font-medium">
                  HSE Compliance & Dossiers
                </div>
              </div>
            </div>

            {/* Prototype Limitation Banner */}
            <div className="mt-12 p-5 bg-status-warningBg border border-status-warning/40 rounded-xl flex items-start gap-4 max-w-4xl mx-auto shadow-sm">
              <div className="p-2 rounded-full bg-status-warning/20 text-status-warning shrink-0 mt-0.5">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-text-primary">Research Prototype & Regulatory Scope Notice</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {PROJECT.complianceNotice} {PROJECT.limitation}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Access Workspaces */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-medium text-text-primary tracking-tight">Role-Based Platform Access</h2>
            <p className="text-text-secondary mt-3 text-base">
              Secure operational workflows tailored to refinery Shift Managers, central HSE Control Rooms, and field personnel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-left">
            {/* Shift Manager Card */}
            <div className="card p-6 border border-border flex flex-col justify-between hover:border-primary transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="badge bg-primary-light text-primary font-semibold">
                    {ROLES_DESCRIPTION.shiftManager.badge}
                  </span>
                  <svg className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
                <h3 className="text-xl font-medium text-text-primary mb-2">
                  {ROLES_DESCRIPTION.shiftManager.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  {ROLES_DESCRIPTION.shiftManager.short}
                </p>
                <ul className="text-xs text-text-secondary space-y-2 mb-6">
                  <li className="flex items-center gap-2"><span className="text-status-success">✔</span> 8-Step Optical Scan Stepper</li>
                  <li className="flex items-center gap-2"><span className="text-status-success">✔</span> Worker Badge & Lot Assignment</li>
                  <li className="flex items-center gap-2"><span className="text-status-success">✔</span> Field Tier 1/2 Advisory Dispatch</li>
                </ul>
              </div>
              <Link href={ROLES_DESCRIPTION.shiftManager.route} className="btn-primary w-full text-center text-sm py-2.5">
                Access Manager Portal
              </Link>
            </div>

            {/* Control Room Card */}
            <div className="card p-6 border border-border flex flex-col justify-between hover:border-primary transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="badge bg-purple-50 text-purple-700 font-semibold">
                    {ROLES_DESCRIPTION.controlRoom.badge}
                  </span>
                  <svg className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
                <h3 className="text-xl font-medium text-text-primary mb-2">
                  {ROLES_DESCRIPTION.controlRoom.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  {ROLES_DESCRIPTION.controlRoom.short}
                </p>
                <ul className="text-xs text-text-secondary space-y-2 mb-6">
                  <li className="flex items-center gap-2"><span className="text-status-success">✔</span> Refinery Plant-Wide KPIs & Heatmap</li>
                  <li className="flex items-center gap-2"><span className="text-status-success">✔</span> Statutory Incident Log (OISD Form-A)</li>
                  <li className="flex items-center gap-2"><span className="text-status-success">✔</span> Real-Time SSE Shift Telemetry Stream</li>
                </ul>
              </div>
              <Link href={ROLES_DESCRIPTION.controlRoom.route} className="btn-primary w-full text-center text-sm py-2.5">
                Access Control Room
              </Link>
            </div>

            {/* Field Employee Card */}
            <div className="card p-6 border border-border flex flex-col justify-between hover:border-primary transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="badge bg-status-successBg text-status-success font-semibold">
                    {ROLES_DESCRIPTION.fieldEmployee.badge}
                  </span>
                  <svg className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
                <h3 className="text-xl font-medium text-text-primary mb-2">
                  {ROLES_DESCRIPTION.fieldEmployee.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  {ROLES_DESCRIPTION.fieldEmployee.short}
                </p>
                <ul className="text-xs text-text-secondary space-y-2 mb-6">
                  <li className="flex items-center gap-2"><span className="text-status-success">✔</span> Personal Shift Exposure Dossier</li>
                  <li className="flex items-center gap-2"><span className="text-status-success">✔</span> 5-Day Wristband Lifecycle Tracker</li>
                  <li className="flex items-center gap-2"><span className="text-status-success">✔</span> Longitudinal Dose & Health Risk Insights</li>
                </ul>
              </div>
              <Link href={ROLES_DESCRIPTION.fieldEmployee.route} className="btn-secondary w-full text-center text-sm py-2.5">
                Access Employee Dossier
              </Link>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-xl border border-border inline-flex flex-col sm:flex-row items-center gap-4 max-w-2xl mx-auto shadow-sm">
            <div className="flex-1 text-left">
              <div className="font-medium text-text-primary text-sm">Instant Demo Mode Available</div>
              <div className="text-xs text-text-secondary mt-0.5">Explore with pre-seeded refinery workforce telemetry and calibrated sensor runs without creating credentials.</div>
            </div>
            <Link href="/login" className="btn-primary text-sm px-6 py-2.5 shrink-0">
              Open Demo Platform
            </Link>
          </div>
        </section>

        {/* Team Showcase */}
        <section id="team" className="py-20 bg-surface border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-3xl mx-auto mb-16">
              <span className="badge bg-primary-light text-primary font-semibold mb-2">Core Engineering Team</span>
              <h2 className="text-3xl font-medium text-text-primary tracking-tight">Meet the Architects & Researchers</h2>
              <p className="text-text-secondary mt-3 text-base">
                Cross-disciplinary development spanning chemical sensor synthesis, computer vision colorimetry, and enterprise HSE platforms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
              {TEAM.map((member) => {
                const hasError = imageErrors[member.name];
                return (
                  <div key={member.name} className="card p-6 border border-border flex flex-col items-center text-center shadow-elevation-1 hover:shadow-elevation-2 transition-all">
                    <div className="w-28 h-28 rounded-full bg-surface-hover border-2 border-primary/30 overflow-hidden mb-5 shadow-elevation-1 relative flex items-center justify-center">
                      {!hasError && member.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(member.name)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary text-2xl font-bold bg-primary-light">
                          {getInitials(member.name)}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-text-primary">{member.name}</h3>
                    <p className="text-xs font-semibold text-primary mt-1 mb-3">{member.role}</p>
                    <p className="text-xs text-text-secondary leading-relaxed">{member.bio}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-surface-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-primary text-white rounded flex items-center justify-center font-bold text-xs">
                  H₂S
                </div>
                <span className="font-semibold text-text-primary text-base">{PROJECT.name}</span>
              </div>
              <p className="text-xs text-text-secondary max-w-md leading-relaxed">
                {PROJECT.tagline}. An integrated hardware-software solution engineered for petrochemical, refinery, and mining safety operations.
              </p>
              <div className="pt-2">
                <span className="badge-warning text-[11px] px-2.5 py-1">
                  {PROJECT.status}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Platform Navigation</h4>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li><Link href="/" className="hover:text-primary transition-colors">Public Home</Link></li>
                <li><Link href="/working" className="hover:text-primary transition-colors">Science Pipeline (4 Tabs)</Link></li>
                <li><Link href="/working?tab=flowchart" className="hover:text-primary transition-colors">Operational Flowchart</Link></li>
                <li><Link href="/working?tab=chemistry" className="hover:text-primary transition-colors">Chemistry & Colorimetry</Link></li>
                <li><Link href="/login" className="hover:text-primary transition-colors">Platform Login & Demo</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Regulatory Compliance</h4>
              <ul className="space-y-2 text-xs text-text-secondary">
                {PROJECT.regulatoryCitations.map((citation, idx) => (
                  <li key={idx} className="leading-snug">{citation}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-text-secondary">
            <div>© {PROJECT.year} {PROJECT.name}. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span>Time-Weighted Average (TWA) Dosimetry</span>
              <span>•</span>
              <span className="text-primary font-mono">D65 CIELAB Euclidean ΔE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

