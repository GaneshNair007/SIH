"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  Sparkles, 
  Activity, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw,
  Zap,
  Microscope
} from "lucide-react";

interface StripScanningAnimationProps {
  employeeId: string;
  employeeName?: string;
  plantUnit?: string;
  badgeId?: string;
  analysisResult?: any;
  onComplete?: () => void;
  onReset?: () => void;
  autoRedirect?: boolean;
}

export default function StripScanningAnimation({
  employeeId,
  employeeName = "Worker",
  plantUnit = "CDU-1",
  badgeId = "BAND-1042-01",
  analysisResult,
  onComplete,
  onReset,
  autoRedirect = true,
}: StripScanningAnimationProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [laserPosition, setLaserPosition] = useState(0); // 0% to 100%
  const [countdown, setCountdown] = useState(3);
  const [isFinished, setIsFinished] = useState(false);

  const deltaE = analysisResult?.delta_e ?? 4.82;
  const predDuration = analysisResult?.predicted_exposure_human ?? "42 min";
  const confidence = analysisResult?.confidence ?? "HIGH";

  const hazardScore = analysisResult?.hazard_score_5pt ?? (
    analysisResult ? Math.min(5.0, Math.max(0.0, parseFloat(((deltaE / 3.2)).toFixed(1)))) : 1.8
  );
  const hazardLevel = analysisResult?.hazard_level_simple ?? (
    hazardScore <= 1.5 ? "SAFE" : hazardScore <= 3.4 ? "CAUTION" : "CRITICAL"
  );

  // Step sequencer animation
  useEffect(() => {
    // Step 1: QR Authenticated -> Step 2: Strip Optical Scan
    const t1 = setTimeout(() => {
      setStep(2);
      setLaserPosition(25);
    }, 600);

    // Step 2: Colorimetric coordinates extraction
    const t2 = setTimeout(() => {
      setStep(3);
      setLaserPosition(65);
    }, 1400);

    // Step 3: Neural network exposure inference
    const t3 = setTimeout(() => {
      setStep(4);
      setLaserPosition(100);
    }, 2200);

    // Step 4: Complete and ready to log
    const t4 = setTimeout(() => {
      setIsFinished(true);
      if (onComplete) onComplete();
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  // Auto-redirect countdown after finished
  useEffect(() => {
    if (!isFinished || !autoRedirect) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/workers/${employeeId}?badgeId=${badgeId}&autoScan=true&deltaE=${deltaE}&hazardScore=${hazardScore.toFixed(1)}&hazardLevel=${encodeURIComponent(hazardLevel)}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, autoRedirect, employeeId, badgeId, deltaE, router]);

  return (
    <div className="w-full bg-[#121615] rounded-3xl border border-sage/20 shadow-2xl overflow-hidden p-6 sm:p-8 text-white animate-in fade-in zoom-in-95 duration-300">
      {/* Top Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shadow-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                Step 1: QR Identity Verified
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                {employeeId}
              </span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl uppercase tracking-tight text-white mt-0.5">
              {employeeName !== "Worker" ? employeeName : `Worker ID: ${employeeId}`}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono text-sage">
          <div>
            <span className="text-[9px] text-sage-muted block uppercase">Destination Roster</span>
            <span className="text-white font-bold">{plantUnit}</span> · <span>{badgeId}</span>
          </div>
        </div>
      </div>

      {/* Main Central Scanning Visual Area */}
      <div className="py-8 flex flex-col items-center justify-center">
        {/* Animated Banner */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-golden/10 border border-yellow-golden/40 text-yellow-golden text-xs font-mono font-bold mb-6 animate-pulse">
          <Microscope className="w-4 h-4" />
          <span>
            {isFinished
              ? "DETECTION STRIP SCAN COMPLETE — READY TO LOG DATA"
              : "SCANNING THE CHEMICAL DETECTION STRIP..."}
          </span>
        </div>

        {/* Realistic Physical Wristband Strip with Sweeping Laser Beam */}
        <div className="relative w-full max-w-xl bg-gradient-to-b from-[#1C2322] to-[#141A19] p-6 rounded-3xl border-2 border-sage/30 shadow-2xl overflow-hidden">
          {/* Background Grid Accent */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(to right, #B7C6C2 1px, transparent 1px), linear-gradient(to bottom, #B7C6C2 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          />

          {/* Stitched Badge Enclosure Preview */}
          <div className="relative z-10 bg-white rounded-2xl p-4 border-2 border-dashed border-charcoal/30 shadow-inner flex flex-col gap-4 text-charcoal">
            {/* Label Header */}
            <div className="flex items-center justify-between border-b border-charcoal/10 pb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal/70">
                STRELA Dosimeter Badge Substrate
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-teal-deep text-white font-bold">
                SbCl₃ Reactive Core
              </span>
            </div>

            {/* Strip Components Row */}
            <div className="relative flex items-center justify-between gap-3 bg-[#F7F8F5] p-3 rounded-xl border border-charcoal/15 overflow-hidden">
              {/* Left QR (Dimmed & Verified) */}
              <div className="w-16 h-20 rounded-lg bg-white border border-emerald-500/50 p-1 flex flex-col items-center justify-center shrink-0 shadow-sm relative">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-0.5" />
                <span className="text-[6px] font-mono font-bold text-emerald-800">QR LINKED</span>
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                  ✓
                </span>
              </div>

              {/* Middle Patch B: Reference Control */}
              <div className={`w-14 h-20 rounded-lg border p-1 flex flex-col items-center justify-center shrink-0 transition-all duration-300 ${
                step >= 2 ? "bg-white border-yellow-golden shadow-md" : "bg-[#EAEAEA] border-charcoal/20"
              }`}>
                <span className={`w-5 h-5 rounded-full border mb-1 transition-colors ${
                  step >= 2 ? "bg-amber-100 border-amber-400" : "bg-gray-300 border-gray-400"
                }`} />
                <span className="text-[6px] font-mono font-bold text-center leading-tight">PATCH B (BLANK)</span>
                <span className="text-[6px] font-mono text-sage-muted mt-0.5">
                  {step >= 2 ? "0.12 ΔE" : "Standby"}
                </span>
              </div>

              {/* Right Patch A: Active SbCl3 Reaction Strip (Target of Laser) */}
              <div className="flex-1 h-20 rounded-lg bg-white border-2 border-teal-deep/30 p-2 flex flex-col justify-between relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] font-mono font-bold text-charcoal uppercase">PATCH A (ACTIVE STRIP)</span>
                  <span className="text-[7px] font-mono font-bold text-teal-deep">0–120 ppm·h</span>
                </div>

                {/* Colorimetric Gradient */}
                <div className="h-5 rounded bg-gradient-to-r from-[#F0DBA5] via-[#C98A7B] to-[#5A6F82] border border-charcoal/20 relative">
                  {/* Reaction Darkening Circle Spot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-700/80 border border-amber-900 shadow-sm animate-ping opacity-30" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-amber-800 border border-amber-900 shadow-sm" />
                </div>

                {/* Scale Ticks */}
                <div className="text-[6px] font-mono text-charcoal/60 flex justify-between px-0.5">
                  <span>0</span>
                  <span>10</span>
                  <span>30</span>
                  <span>60</span>
                  <span>120</span>
                </div>
              </div>

              {/* Patch C: Integrity Indicator */}
              <div className={`w-12 h-20 rounded-lg border p-1 flex flex-col items-center justify-center shrink-0 transition-all duration-300 ${
                step >= 3 ? "bg-white border-emerald-400 shadow-md" : "bg-[#EAEAEA] border-charcoal/20"
              }`}>
                <span className={`w-4 h-4 rounded-full border mb-1 transition-colors ${
                  step >= 3 ? "bg-emerald-400 border-emerald-600" : "bg-gray-300 border-gray-400"
                }`} />
                <span className="text-[6px] font-mono font-bold text-center leading-tight">PATCH C</span>
                <span className="text-[5px] font-mono text-emerald-700 font-bold mt-0.5">
                  {step >= 3 ? "SEAL OK" : "Standby"}
                </span>
              </div>

              {/* Dynamic Laser Beam Overlay Sweeping Across Strip */}
              {!isFinished && (
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-golden via-teal-deep to-yellow-golden shadow-[0_0_15px_4px_rgba(255,225,124,0.8)] pointer-events-none transition-all duration-700 ease-in-out"
                  style={{ left: `${laserPosition}%` }}
                >
                  <div className="absolute -top-1 -left-1.5 w-4 h-2 bg-yellow-golden rounded-full blur-[1px]" />
                  <div className="absolute -bottom-1 -left-1.5 w-4 h-2 bg-yellow-golden rounded-full blur-[1px]" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real-Time Extraction Pipeline Step Indicators */}
        <div className="w-full max-w-xl mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="text-[9px] text-sage-muted uppercase">01 / QR Code</div>
            <div className="text-emerald-400 font-bold text-xs mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border transition-colors flex flex-col justify-between ${
            step >= 2 ? "bg-white/10 border-yellow-golden/60 text-white" : "bg-white/5 border-white/10 text-sage-muted"
          }`}>
            <div className="text-[9px] uppercase">02 / Strip Region</div>
            <div className="font-bold text-xs mt-1 text-yellow-golden">
              {step >= 2 ? "Segmented ✓" : "Scanning..."}
            </div>
          </div>

          <div className={`p-3 rounded-2xl border transition-colors flex flex-col justify-between ${
            step >= 3 ? "bg-white/10 border-teal-light/60 text-white" : "bg-white/5 border-white/10 text-sage-muted"
          }`}>
            <div className="text-[9px] uppercase">03 / CIELAB ΔE</div>
            <div className="font-bold text-xs mt-1 text-teal-light">
              {step >= 3 ? `${deltaE} ΔE ✓` : "Computing..."}
            </div>
          </div>

          <div className={`p-3 rounded-2xl border transition-colors flex flex-col justify-between ${
            step >= 4 ? "bg-emerald-500/20 border-emerald-400 text-white" : "bg-white/5 border-white/10 text-sage-muted"
          }`}>
            <div className="text-[9px] uppercase">04 / Hazard Rating</div>
            <div className="font-bold text-xs mt-1 text-emerald-400">
              {step >= 4 ? `★ ${hazardScore.toFixed(1)}/5 (${hazardLevel}) ✓` : "Rating..."}
            </div>
          </div>
        </div>

        {/* Live Environmental Microclimate Telemetry Ingested into Calculation */}
        <div className="w-full max-w-xl mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-sage">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-golden animate-pulse" />
            <span className="text-white font-bold">Environmental Telemetry in Calculation:</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Ambient: <strong className="text-white">{analysisResult?.environmental_telemetry?.temperature_c ?? 30.0}°C</strong></span>
            <span>·</span>
            <span>Humidity: <strong className="text-white">{analysisResult?.environmental_telemetry?.relative_humidity_pct ?? 75.0}% RH</strong></span>
            <span>·</span>
            <span>Arrhenius k: <strong className="text-yellow-golden">{analysisResult?.environmental_telemetry?.kinetic_factor_k ?? 1.08}x</strong></span>
          </div>
        </div>
      </div>

      {/* Completion Toolbar & Redirect */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          {isFinished ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-emerald-400">
                Optical Extraction Successful · Redirecting to {employeeName}&apos;s profile in {countdown}s...
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono text-sage">
              <div className="w-3.5 h-3.5 border-2 border-yellow-golden border-t-transparent rounded-full animate-spin" />
              <span>Analyzing colorimetric shift and non-skin cartridge integrity...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Scan Another Band</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push(`/workers/${employeeId}?badgeId=${badgeId}&autoScan=true&deltaE=${deltaE}&hazardScore=${hazardScore.toFixed(1)}&hazardLevel=${encodeURIComponent(hazardLevel)}`)}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-yellow-golden hover:bg-yellow-hover text-charcoal text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span>Proceed to Dossier</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
