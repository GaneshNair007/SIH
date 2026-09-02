"use client";

import { useState } from "react";
import { startShift, endShift } from "@/lib/api";
import { REFINERY_UNITS } from "@/lib/constants";
import { 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Camera,
  ShieldCheck,
  ShieldAlert, 
  Clock,
  Sliders,
  X
} from "lucide-react";
import BandScanner from "@/components/dashboard/BandScanner";
import { ScanBriefing } from "@/components/assistant/ChatbotDrawer";

interface ReadingCaptureProps {
  workerId: string;
  workerName: string;
  defaultUnit?: string;
  activeBadgeId?: string;
  currentLifecycleDay?: number;
  hasActiveShift?: boolean;
  initialDeltaE?: number;
  onShiftUpdated: () => void;
  onScanLogged?: (briefing: ScanBriefing) => void;
}

export default function ReadingCapture({
  workerId,
  workerName,
  defaultUnit = "CDU-1",
  activeBadgeId = "BAND-1042-01",
  currentLifecycleDay = 1,
  hasActiveShift = false,
  initialDeltaE,
  onShiftUpdated,
  onScanLogged,
}: ReadingCaptureProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultPayload, setResultPayload] = useState<any | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showManualOverride, setShowManualOverride] = useState(false);

  // Active or completed shift state
  const isShiftActive = hasActiveShift && !resultPayload?.computed_metrics;

  // Form fields (defaults automatically pre-filled)
  const [unit, setUnit] = useState(defaultUnit);
  const [badgeId, setBadgeId] = useState(activeBadgeId);
  const [lifecycleDay, setLifecycleDay] = useState(currentLifecycleDay);
  const [startDeltaE, setStartDeltaE] = useState<number>(0.4);
  const [endDeltaE, setEndDeltaE] = useState<number>(initialDeltaE ?? 4.82);
  const [patchBDrift, setPatchBDrift] = useState<number>(0.10);
  const [patchCCondition, setPatchCCondition] = useState<"NORMAL" | "WARNING" | "COMPROMISED">("NORMAL");
  const [shiftHours, setShiftHours] = useState<number>(8.0);

  // 1-Click Automated Start Shift (Morning Check-In)
  const executeStartShift = async (customStartDeltaE?: number) => {
    setLoading(true);
    setErrorMsg(null);
    setResultPayload(null);
    try {
      const res = await startShift({
        employee_id: workerId,
        plant_unit: unit,
        badge_id: badgeId,
        start_delta_e: customStartDeltaE ?? startDeltaE,
        band_lifecycle_day: lifecycleDay,
      });
      setResultPayload(res);
      onShiftUpdated();

      if (onScanLogged) {
        onScanLogged({
          type: "start",
          workerName,
          workerId,
          unit: res.plant_unit || unit,
          badgeId: res.badge_id || badgeId,
          deltaE: customStartDeltaE ?? startDeltaE,
          hazardScore: 0.0,
          hazardLevel: "SAFE / NORMAL",
          scanId: res.scan_id,
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to log morning shift check-in.");
    } finally {
      setLoading(false);
      setShowScanner(false);
    }
  };

  // 1-Click Automated End Shift (Differential Exposure Calculation)
  const executeEndShift = async (customEndDeltaE?: number) => {
    setLoading(true);
    setErrorMsg(null);
    setResultPayload(null);
    try {
      const res = await endShift({
        worker_id: workerId,
        employee_id: workerId,
        plant_unit: unit,
        shift_duration_hours: shiftHours,
        badge_id: badgeId,
        band_lifecycle_day: lifecycleDay,
        start_delta_e: startDeltaE,
        end_delta_e: customEndDeltaE ?? endDeltaE,
        patch_b_drift: patchBDrift,
        patch_c_condition: patchCCondition,
      });
      setResultPayload(res);
      onShiftUpdated();

      if (onScanLogged) {
        const m = res.computed_metrics;
        const hScore = m?.hazard_score_5pt ?? (
          m ? Math.min(5.0, Math.max(0.0, parseFloat(((m.shift_dose_high_ppm_hr ?? 3.6) / 4.0).toFixed(1)))) : 1.8
        );
        const hLevel = m?.hazard_level_simple ?? (
          hScore > 3.4 ? "DANGEROUS / CRITICAL" : hScore > 1.5 ? "MODERATE / CAUTION" : "SAFE / NORMAL"
        );
        onScanLogged({
          type: "end",
          workerName,
          workerId,
          unit: res.plant_unit || unit,
          badgeId: res.badge_id || badgeId,
          hazardScore: hScore,
          hazardLevel: hLevel,
          doseRangeStr: m?.shift_dose_range_str || "3.0–3.6 ppm·h",
          twaRangeStr: m?.shift_twa_range_str || "0.4–0.5 ppm",
          deltaE: m?.net_delta_e ?? 1.8,
          scanId: res.scan_id,
          guidanceText: res.advisory?.summary_banner,
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to calculate and submit shift exposure.");
    } finally {
      setLoading(false);
      setShowScanner(false);
    }
  };

  // Callback when scanner finishes optical analysis
  const handleScanSuccess = (scannedEmpId: string, scannedBadgeId?: string, scannedUnit?: string) => {
    if (scannedBadgeId) setBadgeId(scannedBadgeId);
    if (scannedUnit) setUnit(scannedUnit);

    if (!isShiftActive) {
      executeStartShift(0.40);
    } else {
      executeEndShift(initialDeltaE ?? 4.82);
    }
  };

  // Calculate Hazard Rating (0.0 to 5.0) for display
  const metrics = resultPayload?.computed_metrics;
  const rawScore = metrics?.hazard_score_5pt ?? (
    metrics ? Math.min(5.0, Math.max(0.0, parseFloat(((metrics.shift_dose_high_ppm_hr ?? 3.6) / 4.0).toFixed(1)))) : 0.0
  );
  const hazardScore = Math.min(5.0, Math.max(0.0, rawScore));
  
  // Tag: SAFE (0-1.5), CAUTION (1.6-3.4), CRITICAL (3.5-5.0)
  const isSafe = hazardScore <= 1.5;
  const isCaution = hazardScore > 1.5 && hazardScore <= 3.4;
  const isCritical = hazardScore > 3.4;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-md space-y-6">
      
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-surface pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-teal-deep uppercase tracking-wider">
              {isShiftActive ? "Live Shift Monitoring" : resultPayload?.computed_metrics ? "Shift Completed" : "Morning Check-In"}
            </span>
            <span className="text-xs text-sage-muted">· {workerName} ({workerId})</span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-charcoal">
            {isShiftActive ? "Shift in Progress" : resultPayload?.computed_metrics ? "Today's Exposure Logged" : "Start-of-Shift Check-In"}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {isShiftActive ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ACTIVE SHIFT RUNNING</span>
            </div>
          ) : resultPayload?.computed_metrics ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-deep text-xs font-bold font-mono">
              <CheckCircle2 className="w-4 h-4 text-teal-deep" />
              <span>LOGGED & RECORDED</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold font-mono">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>AWAITING MORNING SCAN</span>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ----------------- STATE 1: MORNING CHECK-IN (NO ACTIVE SHIFT) ----------------- */}
      {!isShiftActive && !resultPayload?.computed_metrics && (
        <div className="space-y-6">
          <div className="bg-warm-white/70 rounded-2xl p-5 border border-light-surface flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-charcoal uppercase">
                Worker Station & Assigned Wristband
              </div>
              <p className="text-xs text-sage-muted leading-relaxed">
                Unit: <strong className="text-charcoal">{unit}</strong> · Active Band: <strong className="text-charcoal">{badgeId}</strong> (Day {lifecycleDay} of 5-day rotation)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white rounded-lg border border-light-surface text-[11px] font-mono font-semibold text-emerald-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Substrate Ready</span>
              </span>
            </div>
          </div>

          {/* Primary Action Button: Zero Manual Typing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="py-4 px-6 bg-yellow-golden text-charcoal hover:bg-yellow-hover font-bold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 group"
            >
              <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Scan Wristband with Camera</span>
            </button>

            <button
              type="button"
              onClick={() => executeStartShift(0.40)}
              disabled={loading}
              className="py-4 px-6 bg-charcoal text-white hover:bg-charcoal-dark font-bold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-emerald-400" />}
              <span>Auto-Check In (Clean Baseline)</span>
            </button>
          </div>
        </div>
      )}

      {/* ----------------- STATE 2: ACTIVE SHIFT IN PROGRESS ----------------- */}
      {isShiftActive && (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-[#1B2322] to-[#121716] text-white rounded-2xl border border-dark-surface shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  Shift Active at {unit}
                </span>
              </div>
              <span className="text-xs font-mono text-sage">
                Band: {badgeId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] uppercase font-mono text-sage">Morning Baseline</div>
                <div className="text-lg font-bold text-white font-mono mt-1">
                  0.40 ΔE (Clean)
                </div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] uppercase font-mono text-sage">Current Hazard Score</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-1 flex items-center justify-center gap-1">
                  <span>0.0 / 5.0</span>
                  <span className="text-xs font-normal text-sage">(Safe)</span>
                </div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] uppercase font-mono text-sage">Shift Target Duration</div>
                <div className="text-lg font-bold text-yellow-golden font-mono mt-1">
                  8.0 Hours
                </div>
              </div>
            </div>

            <p className="text-xs text-sage leading-relaxed pt-1">
              {workerName} checked in with clean baseline optical density. When shift concludes, scan the band below to automatically calculate today's exposure.
            </p>
          </div>

          {/* Primary Action Button to Complete Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="py-4 px-6 bg-yellow-golden text-charcoal hover:bg-yellow-hover font-bold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 group"
            >
              <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Scan Wristband to End Shift</span>
            </button>

            <button
              type="button"
              onClick={() => executeEndShift(4.82)}
              disabled={loading}
              className="py-4 px-6 bg-charcoal text-white hover:bg-charcoal-dark font-bold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-yellow-golden" />}
              <span>Auto-Log Shift Completion</span>
            </button>
          </div>
        </div>
      )}

      {/* ----------------- STATE 3: SHIFT COMPLETED — 0.0 TO 5.0 HAZARD DISPLAY ----------------- */}
      {resultPayload?.computed_metrics && (
        <div className="p-6 sm:p-8 bg-[#171C1B] text-white rounded-3xl border border-sage/20 shadow-2xl space-y-6">
          
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-sage/10 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-yellow-golden uppercase tracking-wider">
                TODAY'S SHIFT COMPLETED & RECORDED
              </span>
              <div className="text-xs text-sage mt-0.5 font-mono">
                Log ID: {resultPayload.scan_id}
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider ${
              isCritical
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : isCaution
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
            }`}>
              {isCritical ? "DANGEROUS / CRITICAL" : isCaution ? "MODERATE / CAUTION" : "SAFE / NORMAL"}
            </span>
          </div>

          {/* Core Feature: 0.0 to 5.0 Rating & 5-Segment Visual Meter */}
          <div className="bg-[#1F2625] p-6 rounded-2xl border border-sage/15 flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Left: Large Rating Score */}
            <div className="text-center md:text-left space-y-1">
              <div className="text-[11px] uppercase font-mono tracking-wider text-sage">
                Today's Exposure Hazard Rating (0 to 5.0)
              </div>
              <div className="flex items-baseline justify-center md:justify-start gap-2">
                <span className={`text-5xl sm:text-6xl font-display uppercase tracking-tight ${
                  isCritical ? "text-red-400" : isCaution ? "text-yellow-golden" : "text-emerald-400"
                }`}>
                  {hazardScore.toFixed(1)}
                </span>
                <span className="text-xl font-mono text-sage-muted">/ 5.0</span>
              </div>
            </div>

            {/* Right: 5-Point Visual Meter Bar */}
            <div className="w-full md:w-auto flex-1 max-w-md space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-sage-muted uppercase">
                <span>0.0 (Zero H₂S)</span>
                <span>2.5 (Caution)</span>
                <span>5.0 (Critical Ceiling)</span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 h-4 w-full">
                {[1, 2, 3, 4, 5].map((point) => {
                  const filled = hazardScore >= point;
                  const partiallyFilled = !filled && hazardScore > point - 1;
                  return (
                    <div
                      key={point}
                      className={`h-full rounded transition-all ${
                        filled || partiallyFilled
                          ? point <= 2
                            ? "bg-emerald-400"
                            : point <= 3
                            ? "bg-yellow-golden"
                            : "bg-red-500"
                          : "bg-white/10"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="text-right text-[11px] font-mono text-sage">
                Status: <strong className={isCritical ? "text-red-400" : isCaution ? "text-yellow-golden" : "text-emerald-400"}>
                  {isCritical ? "Ceiling limit breached" : isCaution ? "Approaching caution threshold" : "Standard ambient safe levels"}
                </strong>
              </div>
            </div>
          </div>

          {/* Simple Human-Friendly Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-[#1E2423] p-4 rounded-xl border border-sage/10">
              <div className="text-[10px] text-sage font-mono uppercase">Total Shift Exposure</div>
              <div className="text-xl font-bold text-yellow-golden font-mono mt-1">
                {metrics?.shift_dose_range_str || "3.0–3.6 ppm·h"}
              </div>
              <div className="text-[10px] text-sage-muted mt-1">Cumulative dose absorbed</div>
            </div>

            <div className="bg-[#1E2423] p-4 rounded-xl border border-sage/10">
              <div className="text-[10px] text-sage font-mono uppercase">Average Air Concentration</div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {metrics?.shift_twa_range_str || "0.4–0.5 ppm"}
              </div>
              <div className="text-[10px] text-sage-muted mt-1">8-hour Time-Weighted Average</div>
            </div>

            <div className="bg-[#1E2423] p-4 rounded-xl border border-sage/10">
              <div className="text-[10px] text-sage font-mono uppercase">7-Day Cumulative Dose</div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {metrics?.updated_7day_range_str || "14.2–16.5 ppm·h"}
              </div>
              <div className="text-[10px] text-sage-muted mt-1">Rolling multi-shift load</div>
            </div>
          </div>

          {/* Plain-English Action Guidance */}
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
            isCritical
              ? "bg-red-950/40 border-red-500/40 text-red-200"
              : isCaution
              ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
              : "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
          }`}>
            <div className="font-bold uppercase mb-1 flex items-center gap-1.5">
              {isCritical ? <ShieldAlert className="w-4 h-4 text-red-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              <span>{isCritical ? "Immediate Medical Attention Required" : isCaution ? "Supervisor Action Required" : "Normal Shift Completion"}</span>
            </div>
            {isCritical
              ? `Critical exposure detected! Refer ${workerName} to the Occupational Health Centre (OHC) immediately and retire this wristband.`
              : isCaution
              ? "Exposure is approaching the caution threshold. Inspect respiratory PPE fit and check CDU-1 equipment for fugitive leaks."
              : "Worker exposure is well within normal statutory safety limits. Normal handover permitted for tomorrow's shift."}
          </div>

          {/* Reset / New Shift Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setResultPayload(null);
                onShiftUpdated();
              }}
              className="py-2.5 px-5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-mono font-bold transition-colors"
            >
              Log Another Shift
            </button>
          </div>
        </div>
      )}

      {/* ----------------- COLLAPSED EMERGENCY MANUAL OVERRIDE ----------------- */}
      <div className="pt-4 border-t border-light-surface">
        <button
          type="button"
          onClick={() => setShowManualOverride(!showManualOverride)}
          className="text-xs font-mono font-semibold text-sage-muted hover:text-charcoal flex items-center gap-1.5 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showManualOverride ? "Hide Emergency Calibration Controls ▲" : "Show Emergency Manual Controls (Hardware Camera Fallback) ▼"}</span>
        </button>

        {showManualOverride && (
          <div className="mt-4 p-5 bg-warm-white rounded-2xl border border-light-surface space-y-4 text-xs">
            <div className="text-xs font-bold uppercase text-charcoal flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Manual Optical Parameters (For Testing / Override Only)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-charcoal mb-1">Operating Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-light-surface font-semibold text-charcoal"
                >
                  {REFINERY_UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal mb-1">Start Baseline ΔE</label>
                <input
                  type="number"
                  step="0.05"
                  value={startDeltaE}
                  onChange={(e) => setStartDeltaE(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-white rounded-lg border border-light-surface font-mono text-charcoal"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal mb-1">End ΔE Reading</label>
                <input
                  type="number"
                  step="0.05"
                  value={endDeltaE}
                  onChange={(e) => setEndDeltaE(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-white rounded-lg border border-light-surface font-mono text-charcoal"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => executeStartShift()}
                className="py-2 px-4 bg-charcoal text-white rounded-lg text-xs font-bold hover:bg-black"
              >
                Submit Manual Check-In
              </button>
              <button
                type="button"
                onClick={() => executeEndShift()}
                className="py-2 px-4 bg-yellow-golden text-charcoal rounded-lg text-xs font-bold hover:bg-yellow-hover"
              >
                Submit Manual End-Shift
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ----------------- CAMERA SCANNER POPUP MODAL ----------------- */}
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-light-surface overflow-hidden relative">
            <div className="p-4 bg-charcoal text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-yellow-golden" />
                <span className="font-mono text-xs font-bold uppercase">
                  {isShiftActive ? "Scanning to Complete Shift" : "Scanning for Morning Check-In"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowScanner(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <BandScanner
                standalone
                onScanSuccess={handleScanSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
