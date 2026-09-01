"use client";

import { useState } from "react";
import { startShift, endShift } from "@/lib/api";
import { REFINERY_UNITS } from "@/lib/constants";
import { 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldAlert, 
  FileText,
  Clock,
  Layers,
  Sparkles
} from "lucide-react";

interface ReadingCaptureProps {
  workerId: string;
  workerName: string;
  defaultUnit?: string;
  activeBadgeId?: string;
  currentLifecycleDay?: number;
  hasActiveShift?: boolean;
  onShiftUpdated: () => void;
}

export default function ReadingCapture({
  workerId,
  workerName,
  defaultUnit = "CDU-1",
  activeBadgeId = "BAND-1042-01",
  currentLifecycleDay = 1,
  hasActiveShift = false,
  onShiftUpdated,
}: ReadingCaptureProps) {
  const [mode, setMode] = useState<"start" | "end">(hasActiveShift ? "end" : "start");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultPayload, setResultPayload] = useState<any | null>(null);

  // Form fields
  const [unit, setUnit] = useState(defaultUnit);
  const [badgeId, setBadgeId] = useState(activeBadgeId);
  const [lifecycleDay, setLifecycleDay] = useState(currentLifecycleDay);
  const [startDeltaE, setStartDeltaE] = useState<number>(0.4);
  const [endDeltaE, setEndDeltaE] = useState<number>(3.8);
  const [patchBDrift, setPatchBDrift] = useState<number>(0.10);
  const [patchCCondition, setPatchCCondition] = useState<"NORMAL" | "WARNING" | "COMPROMISED">("NORMAL");
  const [shiftHours, setShiftHours] = useState<number>(8.0);

  const handleStartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setResultPayload(null);
    try {
      const res = await startShift({
        employee_id: workerId,
        plant_unit: unit,
        badge_id: badgeId,
        start_delta_e: startDeltaE,
        band_lifecycle_day: lifecycleDay,
      });
      setResultPayload(res);
      onShiftUpdated();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to start shift.");
    } finally {
      setLoading(false);
    }
  };

  const handleEndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        end_delta_e: endDeltaE,
        patch_b_drift: patchBDrift,
        patch_c_condition: patchCCondition,
      });
      setResultPayload(res);
      onShiftUpdated();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit end-of-shift scan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-light-surface shadow-md space-y-6">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between border-b border-light-surface pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-teal-deep uppercase">
            Paired Shift Action
          </span>
          <h3 className="font-display text-2xl uppercase tracking-tight text-charcoal">
            {mode === "start" ? "Start-of-Shift Check-In" : "End-of-Shift Differential Reading"}
          </h3>
        </div>

        <div className="flex items-center gap-1 p-1 bg-warm-white rounded-xl border border-light-surface">
          <button
            type="button"
            onClick={() => {
              setMode("start");
              setResultPayload(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase transition-colors ${
              mode === "start" ? "bg-charcoal text-white" : "text-sage-muted hover:text-charcoal"
            }`}
          >
            Start Shift
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("end");
              setResultPayload(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase transition-colors ${
              mode === "end" ? "bg-charcoal text-white" : "text-sage-muted hover:text-charcoal"
            }`}
          >
            End Shift
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Start Shift Form */}
      {mode === "start" && (
        <form onSubmit={handleStartSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase text-charcoal mb-1">
                Refinery Operating Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2.5 bg-warm-white rounded-xl border border-light-surface font-semibold text-charcoal focus:ring-2 focus:ring-teal-deep"
              >
                {REFINERY_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-charcoal mb-1">
                Active Wristband ID
              </label>
              <input
                type="text"
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value)}
                className="w-full p-2.5 bg-warm-white rounded-xl border border-light-surface font-mono font-bold text-charcoal uppercase focus:ring-2 focus:ring-teal-deep"
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-charcoal mb-1">
                Rotation Lifecycle Day (1–5)
              </label>
              <select
                value={lifecycleDay}
                onChange={(e) => setLifecycleDay(parseInt(e.target.value))}
                className="w-full p-2.5 bg-warm-white rounded-xl border border-light-surface font-semibold text-charcoal focus:ring-2 focus:ring-teal-deep"
              >
                {[1, 2, 3, 4, 5].map((d) => (
                  <option key={d} value={d}>Day {d} of 5</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-charcoal mb-1">
                Baseline Optical Density (ΔE_start)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.0"
                max="5.0"
                value={startDeltaE}
                onChange={(e) => setStartDeltaE(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-warm-white rounded-xl border border-light-surface font-mono font-bold text-charcoal focus:ring-2 focus:ring-teal-deep"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-charcoal text-white hover:bg-black font-bold text-sm rounded-xl transition-all shadow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-yellow-golden" />}
            <span>Log Check-In & Start Active Shift</span>
          </button>
        </form>
      )}

      {/* End Shift Form */}
      {mode === "end" && (
        <form onSubmit={handleEndSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold uppercase text-charcoal mb-1">
                Start ΔE Baseline
              </label>
              <input
                type="number"
                step="0.05"
                value={startDeltaE}
                onChange={(e) => setStartDeltaE(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-warm-white rounded-xl border border-light-surface font-mono text-charcoal focus:ring-2 focus:ring-teal-deep"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-charcoal mb-1">
                End-of-Shift ΔE_end
              </label>
              <input
                type="number"
                step="0.05"
                min="0.0"
                max="30.0"
                value={endDeltaE}
                onChange={(e) => setEndDeltaE(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-warm-white rounded-xl border border-light-surface font-mono font-bold text-charcoal focus:ring-2 focus:ring-teal-deep"
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-charcoal mb-1">
                Shift Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={shiftHours}
                onChange={(e) => setShiftHours(parseFloat(e.target.value) || 8)}
                className="w-full p-2.5 bg-warm-white rounded-xl border border-light-surface font-mono text-charcoal focus:ring-2 focus:ring-teal-deep"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-charcoal mb-1">
                Patch B Control Drift (ΔE_B)
              </label>
              <input
                type="number"
                step="0.02"
                min="0.0"
                value={patchBDrift}
                onChange={(e) => setPatchBDrift(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-warm-white rounded-xl border border-light-surface font-mono text-charcoal focus:ring-2 focus:ring-teal-deep"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-charcoal mb-1">
                Patch C Integrity Condition
              </label>
              <select
                value={patchCCondition}
                onChange={(e: any) => setPatchCCondition(e.target.value)}
                className="w-full p-2.5 bg-warm-white rounded-xl border border-light-surface font-semibold text-charcoal focus:ring-2 focus:ring-teal-deep"
              >
                <option value="NORMAL">NORMAL (Intact Seal)</option>
                <option value="WARNING">WARNING (Minor Fade)</option>
                <option value="COMPROMISED">COMPROMISED (Water/Interferent)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-charcoal mb-1">
                Operating Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2.5 bg-warm-white rounded-xl border border-light-surface font-semibold text-charcoal"
              >
                {REFINERY_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-charcoal text-white hover:bg-black font-bold text-sm rounded-xl transition-all shadow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-yellow-golden" />}
            <span>Compute Differential Shift Exposure & Submit Scan</span>
          </button>
        </form>
      )}

      {/* Result Display Banner */}
      {resultPayload && (
        <div className="p-5 bg-[#171C1B] text-white rounded-xl border border-sage/20 shadow-inner space-y-4">
          <div className="flex items-center justify-between border-b border-sage/10 pb-3">
            <span className="text-xs font-mono font-bold text-yellow-golden uppercase">
              {resultPayload.status || "SCAN RECORD COMPLETED"}
            </span>
            <span className="font-mono text-xs text-sage">
              ID: {resultPayload.scan_id}
            </span>
          </div>

          {resultPayload.computed_metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-[#1E2423] p-2.5 rounded-lg border border-sage/10">
                <div className="text-[10px] text-sage font-mono">Differential Net ΔE</div>
                <div className="text-base font-bold text-white font-mono mt-0.5">
                  {resultPayload.computed_metrics.net_delta_e}
                </div>
              </div>
              <div className="bg-[#1E2423] p-2.5 rounded-lg border border-sage/10">
                <div className="text-[10px] text-sage font-mono">Dose Uncertainty Range</div>
                <div className="text-base font-bold text-yellow-golden font-mono mt-0.5">
                  {resultPayload.computed_metrics.shift_dose_range_str}
                </div>
              </div>
              <div className="bg-[#1E2423] p-2.5 rounded-lg border border-sage/10">
                <div className="text-[10px] text-sage font-mono">Shift TWA Range</div>
                <div className="text-base font-bold text-white font-mono mt-0.5">
                  {resultPayload.computed_metrics.shift_twa_range_str}
                </div>
              </div>
              <div className="bg-[#1E2423] p-2.5 rounded-lg border border-sage/10">
                <div className="text-[10px] text-sage font-mono">Statutory Tier</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                  {resultPayload.computed_metrics.statutory_tier}
                </div>
              </div>
            </div>
          )}

          {resultPayload.advisory && resultPayload.advisory.summary_banner && (
            <div className="p-3 bg-[#242A29] rounded-lg border border-sage/20 text-xs text-sage leading-relaxed">
              <strong className="text-white block mb-1">Clinical Safety Guidance:</strong>
              {resultPayload.advisory.summary_banner}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
