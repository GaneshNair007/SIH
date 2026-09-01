"use client";

import Link from "next/link";
import Image from "next/image";
import { PROJECT, TEAM, ROLES_DESCRIPTION, CHEMISTRY } from "@/lib/content";
import PublicNav from "@/components/ui/PublicNav";
import PublicFooter from "@/components/ui/PublicFooter";

/* ─── Wristband Concept SVG ─────────────────────────────── */
function WristbandIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg viewBox="0 0 400 220" className="w-full" aria-label="Concept illustration of the H₂S dose wristband showing strap, cartridge housing, QR code, and three colour patches A, B, C">
        {/* Strap */}
        <rect x="20" y="80" width="360" height="60" rx="30" fill="#E8E8E0" stroke="#B8C2BC" strokeWidth="1.5" />
        {/* Cartridge housing */}
        <rect x="110" y="55" width="180" height="110" rx="12" fill="#FFFFFF" stroke="#B8C2BC" strokeWidth="1.5" />
        <rect x="110" y="55" width="180" height="110" rx="12" fill="url(#housing-gradient)" />
        {/* Gas-permeable window */}
        <rect x="130" y="75" width="140" height="70" rx="6" fill="#FAFAF8" stroke="#DCE3DE" strokeWidth="1" strokeDasharray="4 2" />
        <text x="200" y="68" textAnchor="middle" className="fill-muted" fontSize="7" fontFamily="var(--font-mono)">GAS-PERMEABLE WINDOW</text>
        {/* Patch A */}
        <rect x="140" y="85" width="34" height="50" rx="4" fill="#E8D5C4" stroke="#C9A882" strokeWidth="1" />
        <text x="157" y="118" textAnchor="middle" className="fill-charcoal" fontSize="9" fontWeight="600">A</text>
        <text x="157" y="142" textAnchor="middle" className="fill-muted" fontSize="6">Dose</text>
        {/* Patch B */}
        <rect x="183" y="85" width="34" height="50" rx="4" fill="#F5F0EA" stroke="#D4C5B0" strokeWidth="1" />
        <text x="200" y="118" textAnchor="middle" className="fill-charcoal" fontSize="9" fontWeight="600">B</text>
        <text x="200" y="142" textAnchor="middle" className="fill-muted" fontSize="6">Ref</text>
        {/* Patch C */}
        <rect x="226" y="85" width="34" height="50" rx="4" fill="#E0E8F0" stroke="#A8B8C8" strokeWidth="1" />
        <text x="243" y="118" textAnchor="middle" className="fill-charcoal" fontSize="9" fontWeight="600">C</text>
        <text x="243" y="142" textAnchor="middle" className="fill-muted" fontSize="6">Cond.</text>
        {/* QR code area */}
        <rect x="286" y="56" width="44" height="44" rx="4" fill="#FFFFFF" stroke="#DCE3DE" strokeWidth="1" />
        <g transform="translate(292, 62)" fill="#171C1B" opacity="0.6">
          {[0,1,2,3,4].map(r => [0,1,2,3,4].map(c => (
            ((r+c) % 3 !== 0) && <rect key={`${r}-${c}`} x={c*6} y={r*6} width="5" height="5" rx="0.5" />
          )))}
        </g>
        <text x="308" y="110" textAnchor="middle" className="fill-muted" fontSize="6">QR</text>
        {/* Labels */}
        <text x="200" y="185" textAnchor="middle" className="fill-muted" fontSize="8" fontStyle="italic">Concept illustration — not a manufactured product photo</text>
        <defs>
          <linearGradient id="housing-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F0F0EC" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ─── Home Page ──────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas">
      <PublicNav />

      {/* ── B. Hero ─────────────────────────────── */}
      <section className="pt-28 pb-section">
        <div className="page-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-pale text-xs font-medium text-teal mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                {PROJECT.status}
              </div>

              <h1 className="text-display-1 text-charcoal mb-6 font-serif">
                {PROJECT.name}
              </h1>

              <div className="space-y-2 mb-8">
                {PROJECT.heroLines.map((line, i) => (
                  <p key={i} className="text-body-lg text-muted leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/working" className="btn-primary">
                  Explore the pipeline
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
                </Link>
                <Link href="/login" className="btn-secondary">
                  Manager login
                </Link>
                <Link href="/#team" className="btn-ghost">
                  Meet the team
                </Link>
              </div>
            </div>

            <div className="flex justify-center">
              <WristbandIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ── C. Project Description ──────────────── */}
      <section className="section-spacing bg-canvas-white border-y border-border">
        <div className="page-container max-w-4xl">
          <h2 className="text-heading-1 text-charcoal mb-8 font-serif">
            The Project
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="card">
              <h3 className="text-heading-3 text-charcoal mb-3">The Problem</h3>
              <p className="text-body text-muted leading-relaxed">
                Industrial workers face chronic, low-level H₂S exposure that&apos;s difficult to track individually.
                Keeping an organized record of each worker&apos;s cumulative exposure-related readings — across shifts,
                bands, and locations — is essential but rarely achieved with manual logs.
              </p>
            </div>

            <div className="card">
              <h3 className="text-heading-3 text-charcoal mb-3">The Hardware</h3>
              <p className="text-body text-muted leading-relaxed">
                A passive colour-changing material ({CHEMISTRY.formulation}) housed in a disposable cartridge
                on a wrist strap. The reactive layer is physically isolated from skin by a gas-permeable,
                liquid-impermeable window. Three patches — dose, reference, and condition — enable self-correcting measurements.
              </p>
            </div>

            <div className="card">
              <h3 className="text-heading-3 text-charcoal mb-3">The Software</h3>
              <p className="text-body text-muted leading-relaxed">
                A smartphone app that scans the band&apos;s QR code, photographs the patches, assesses image quality,
                quantifies colour change as CIE L*a*b* ΔE, and estimates cumulative dose when an appropriate
                calibration is available.
              </p>
            </div>

            <div className="card">
              <h3 className="text-heading-3 text-charcoal mb-3">The Operations</h3>
              <p className="text-body text-muted leading-relaxed">
                Shift managers scan bands at start and end of shift. Each reading builds a worker&apos;s longitudinal
                exposure history. Control room managers monitor trends, review alerts, and generate compliance reports.
              </p>
            </div>
          </div>

          {/* Limitation disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-canvas border border-border">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
            <p className="text-sm text-muted">
              <span className="font-semibold text-charcoal">Important: </span>
              {PROJECT.limitation}
            </p>
          </div>
        </div>
      </section>

      {/* ── D. Platform Access ──────────────────── */}
      <section className="section-spacing">
        <div className="page-container max-w-4xl text-center">
          <h2 className="text-heading-1 text-charcoal mb-4 font-serif">
            Monitoring Platform
          </h2>
          <p className="text-body-lg text-muted mb-10 max-w-2xl mx-auto">
            Access the operational dashboard to manage shifts, monitor exposure across your workforce,
            and review analytics.
          </p>

          <Link href="/login" className="btn-primary text-lg px-8 py-4">
            Open monitoring platform
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M12 6l4 4-4 4"/></svg>
          </Link>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
            <div className="card text-left">
              <div className="badge-teal mb-3">{ROLES_DESCRIPTION.shiftManager.title}</div>
              <p className="text-sm text-muted">{ROLES_DESCRIPTION.shiftManager.short}</p>
            </div>
            <div className="card text-left">
              <div className="badge-teal mb-3">{ROLES_DESCRIPTION.controlRoom.title}</div>
              <p className="text-sm text-muted">{ROLES_DESCRIPTION.controlRoom.short}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── E. Team ─────────────────────────────── */}
      <section id="team" className="section-spacing bg-canvas-white border-y border-border">
        <div className="page-container max-w-4xl">
          <h2 className="text-heading-1 text-charcoal mb-2 font-serif">
            Meet the Team
          </h2>
          <p className="text-body text-muted mb-10">
            The people behind the H₂S Dose Wristband project.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {TEAM.map((member) => (
              <div key={member.name} className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-canvas-subtle border-2 border-border">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <h3 className="text-heading-3 text-charcoal">{member.name}</h3>
                <p className="text-sm text-teal font-medium mt-1">{member.role}</p>
                {member.bio ? (
                  <p className="text-sm text-muted mt-2">{member.bio}</p>
                ) : (
                  <p className="text-xs text-muted-light mt-2 italic">Details coming soon</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── F. Footer ───────────────────────────── */}
      <PublicFooter />
    </div>
  );
}
