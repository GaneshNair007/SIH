"use client";

import ProtectedNavbar from "@/components/layout/ProtectedNavbar";
import Footer from "@/components/layout/Footer";
import { STATUTORY_THRESHOLDS, PROJECT_NAME } from "@/lib/constants";
import { Settings, Shield, Sliders, Database, Users, CheckCircle2 } from "lucide-react";

export default function AdminPage() {
  return (
    <>
      <ProtectedNavbar />
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-12 bg-warm-white space-y-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-6 h-6 text-teal-deep" />
              <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-charcoal">
                Platform Administration & Calibration
              </h1>
            </div>
            <p className="text-xs text-sage-muted">
              Configure regulatory compliance thresholds, calibration curve versions, and system telemetry endpoints.
            </p>
          </div>

          {/* Statutory Threshold Configuration */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-light-surface pb-3">
              <Sliders className="w-5 h-5 text-teal-deep" />
              <h2 className="font-display text-2xl uppercase tracking-tight text-charcoal">
                Statutory Regulatory Thresholds (OISD / ACGIH)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-warm-white p-4 rounded-2xl border border-light-surface">
                <div className="text-[10px] font-mono text-sage-muted uppercase">Tier 1 Maximum TWA</div>
                <div className="text-2xl font-bold font-mono text-teal-deep mt-1">
                  {STATUTORY_THRESHOLDS.TIER1_TWA_MAX} ppm
                </div>
                <div className="text-[10px] text-sage-muted mt-1">Normal 8-hour shift ceiling</div>
              </div>

              <div className="bg-warm-white p-4 rounded-2xl border border-light-surface">
                <div className="text-[10px] font-mono text-sage-muted uppercase">Tier 1 Maximum 7-Day Load</div>
                <div className="text-2xl font-bold font-mono text-teal-deep mt-1">
                  {STATUTORY_THRESHOLDS.TIER1_7DAY_MAX} ppm·h
                </div>
                <div className="text-[10px] text-sage-muted mt-1">Rolling cumulative cap</div>
              </div>

              <div className="bg-warm-white p-4 rounded-2xl border border-light-surface">
                <div className="text-[10px] font-mono text-sage-muted uppercase">Tier 2 Maximum TWA</div>
                <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
                  {STATUTORY_THRESHOLDS.TIER2_TWA_MAX} ppm
                </div>
                <div className="text-[10px] text-amber-700 mt-1">Caution tier threshold</div>
              </div>

              <div className="bg-warm-white p-4 rounded-2xl border border-light-surface">
                <div className="text-[10px] font-mono text-sage-muted uppercase">Tier 2 Maximum 7-Day Load</div>
                <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
                  {STATUTORY_THRESHOLDS.TIER2_7DAY_MAX} ppm·h
                </div>
                <div className="text-[10px] text-amber-700 mt-1">Sub-chronic caution boundary</div>
              </div>

              <div className="bg-warm-white p-4 rounded-2xl border border-light-surface">
                <div className="text-[10px] font-mono text-sage-muted uppercase">Single-Shift Critical Dose</div>
                <div className="text-2xl font-bold font-mono text-red-600 mt-1">
                  {STATUTORY_THRESHOLDS.SINGLE_SHIFT_MAX} ppm·h
                </div>
                <div className="text-[10px] text-red-700 mt-1">Immediate Tier 3 lock</div>
              </div>

              <div className="bg-warm-white p-4 rounded-2xl border border-light-surface">
                <div className="text-[10px] font-mono text-sage-muted uppercase">Confidence Gating (CRAG)</div>
                <div className="text-2xl font-bold font-mono text-charcoal mt-1">
                  ≥ 0.85
                </div>
                <div className="text-[10px] text-sage-muted mt-1">Fallback to static protocols below</div>
              </div>
            </div>
          </div>

          {/* Database & System Integrity Status */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-light-surface pb-3">
              <Database className="w-5 h-5 text-teal-deep" />
              <h2 className="font-display text-2xl uppercase tracking-tight text-charcoal">
                Engine & Backend Status
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="flex items-center justify-between p-3 bg-warm-white rounded-xl border border-light-surface">
                <span className="text-sage-muted">Database Engine:</span>
                <span className="font-bold text-emerald-600">SQLite (WAL Concurrency)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-warm-white rounded-xl border border-light-surface">
                <span className="text-sage-muted">Neural Network:</span>
                <span className="font-bold text-emerald-600">3-Layer MLP (&lt; 2ms)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-warm-white rounded-xl border border-light-surface">
                <span className="text-sage-muted">Telemetry Source:</span>
                <span className="font-bold text-teal-deep">Open-Meteo Mangalore</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-warm-white rounded-xl border border-light-surface">
                <span className="text-sage-muted">LLM Provider:</span>
                <span className="font-bold text-teal-deep">Groq (qwen3.8-27b)</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
