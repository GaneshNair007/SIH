"use client";

import { Activity, ShieldAlert, CheckCircle2, User, Layers, QrCode, TrendingUp } from "lucide-react";

export default function DashboardPreview() {
  return (
    <div className="w-full bg-[#171C1B] rounded-2xl border border-sage/20 shadow-2xl overflow-hidden text-white font-sans">
      {/* Browser Window Chrome */}
      <div className="bg-[#0F1212] px-4 py-3 border-b border-sage/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
          <span className="ml-2 text-xs font-mono text-sage/70">h2s-monitor.refinery.internal/manager</span>
        </div>
        <div className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-amber-500/20 text-yellow-golden border border-yellow-golden/30">
          Demo preview — synthetic data
        </div>
      </div>

      {/* Mock Interface Content */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: KPI & Scanner Card */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#1E2423] p-4 rounded-xl border border-sage/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-sage uppercase">Active Shift Safety</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-2xl font-display uppercase tracking-tight text-white">4 Plant Units Active</div>
            <div className="text-xs text-sage mt-1">CDU-1 · DHDS · SRU · Tank Farm</div>
          </div>

          <div className="bg-[#242A29] p-4 rounded-xl border border-yellow-golden/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-yellow-golden text-charcoal">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-yellow-golden">Top-Left Band Scanner</div>
                <div className="text-sm font-semibold text-white">Live Camera Optical Analysis</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-sage/10 text-xs text-sage flex items-center justify-between">
              <span>Automatic QR + ΔE</span>
              <span className="font-mono text-emerald-400">READY</span>
            </div>
          </div>
        </div>

        {/* Center Column: Worker Exposure Ledger Preview */}
        <div className="lg:col-span-2 bg-[#1E2423] p-4 rounded-xl border border-sage/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-sage/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-yellow-golden" />
                <span className="text-sm font-bold text-white">EMP-1042 — Rajesh Kumar</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-deep text-white font-mono">CDU-1 Operator</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                TIER 1 (NORMAL)
              </span>
            </div>

            {/* Exposure Range Bar */}
            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="bg-[#171C1B] p-2.5 rounded-lg border border-sage/10">
                <div className="text-[10px] text-sage font-mono">Differential Shift Dose</div>
                <div className="text-base font-bold text-yellow-golden font-mono mt-0.5">6.2–7.8 ppm·h</div>
                <div className="text-[9px] text-sage/70">Uncertainty Envelope ±10%</div>
              </div>
              <div className="bg-[#171C1B] p-2.5 rounded-lg border border-sage/10">
                <div className="text-[10px] text-sage font-mono">Shift TWA Range</div>
                <div className="text-base font-bold text-white font-mono mt-0.5">0.78–0.98 ppm</div>
                <div className="text-[9px] text-emerald-400">Below 1.0 ppm ACGIH Limit</div>
              </div>
              <div className="bg-[#171C1B] p-2.5 rounded-lg border border-sage/10">
                <div className="text-[10px] text-sage font-mono">7-Day Rolling Load</div>
                <div className="text-base font-bold text-white font-mono mt-0.5">7.4 ppm·h</div>
                <div className="text-[9px] text-sage/70">Max Cap: 15.0 ppm·h</div>
              </div>
            </div>

            {/* Patch Integrity Telemetry */}
            <div className="flex items-center justify-between text-xs bg-[#171C1B] p-2.5 rounded-lg border border-sage/10">
              <span className="text-sage">Band: <strong className="text-white font-mono">BAND-1042-01 (Day 2/5)</strong></span>
              <span className="text-sage">Patch B Drift: <strong className="text-emerald-400 font-mono">0.10 ΔE (Pass)</strong></span>
              <span className="text-sage">Patch C: <strong className="text-emerald-400 font-mono">NORMAL</strong></span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-sage/10 flex items-center justify-between text-[11px] text-sage">
            <span>Deterministic Dosimetry Math · Zero-LLM Numerical Calculation</span>
            <span className="text-yellow-golden">OISD-STD-105 Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
