"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getWorkerProfile } from "@/lib/api";
import { WorkerProfileData, ShiftScanRecord } from "@/lib/types";
import ProtectedNavbar from "@/components/layout/ProtectedNavbar";
import Footer from "@/components/layout/Footer";
import ExposureChart from "@/components/worker/ExposureChart";
import ReadingCapture from "@/components/worker/ReadingCapture";
import ChatbotDrawer, { ScanBriefing } from "@/components/assistant/ChatbotDrawer";
import WorkerQrModal from "@/components/dashboard/WorkerQrModal";
import { 
  User, 
  ShieldCheck, 
  Activity, 
  Layers, 
  Clock, 
  Heart, 
  AlertTriangle, 
  ArrowLeft,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  QrCode
} from "lucide-react";

export default function WorkerProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workerId = (params?.workerId as string) || "EMP-1042";
  const badgeParam = searchParams.get("badgeId");

  const [profile, setProfile] = useState<WorkerProfileData | null>(null);
  const [scans, setScans] = useState<ShiftScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeBriefing, setActiveBriefing] = useState<ScanBriefing | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await getWorkerProfile(workerId);
      setProfile(data.worker_profile || data.employee_profile);
      setScans(data.shift_history || data.recent_scans || []);
    } catch (err: any) {
      console.warn("Worker profile load error", err);
      setErrorMsg(err?.message || `Failed to load dossier for worker ${workerId}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [workerId]);

  // If arrived from the scanner with autoScan=true, trigger proactive AI briefing
  useEffect(() => {
    if (searchParams.get("autoScan") === "true" && profile) {
      const isStart = searchParams.get("scanType") === "start";
      const hScore = searchParams.get("hazardScore") ? parseFloat(searchParams.get("hazardScore")!) : (isStart ? 0.0 : 1.8);
      const hLevel = searchParams.get("hazardLevel") || (isStart ? "SAFE / NORMAL" : "SAFE / NORMAL");
      const dE = searchParams.get("deltaE") ? parseFloat(searchParams.get("deltaE")!) : (isStart ? 0.40 : 4.82);

      setActiveBriefing({
        type: isStart ? "start" : "end",
        workerName: profile.full_name,
        workerId: workerId,
        unit: profile.plant_unit,
        badgeId: badgeParam || profile.active_badge_id || "BAND-1042-01",
        hazardScore: hScore,
        hazardLevel: hLevel,
        deltaE: dE,
        doseRangeStr: "3.0–3.6 ppm·h",
        twaRangeStr: "0.4–0.5 ppm",
        scanId: `SCN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      });
    }
  }, [profile, searchParams, workerId, badgeParam]);

  if (loading && !profile) {
    return (
      <>
        <ProtectedNavbar />
        <div className="flex-1 py-32 flex flex-col items-center justify-center text-sage-muted gap-3">
          <RefreshCw className="w-8 h-8 text-teal-deep animate-spin" />
          <span className="text-xs font-mono">Loading Worker Dosimetry Dossier...</span>
        </div>
        <Footer />
      </>
    );
  }

  const ledger = profile?.exposure_ledger || ({} as any);
  const health = profile?.health_profile || ({} as any);
  const ppe = profile?.ppe_details || ({} as any);

  return (
    <>
      <ProtectedNavbar />
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-12 bg-warm-white space-y-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/manager"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-muted hover:text-charcoal transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Manager Dashboard</span>
            </Link>
            <span className="text-xs font-mono text-sage-muted">
              Record ID: {workerId}
            </span>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Worker Profile Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Avatar & Identity (6 cols) */}
            <div className="lg:col-span-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-light-surface bg-warm-white flex items-center justify-center">
                {workerId.toUpperCase() === "EMP-1042" || profile?.full_name?.toLowerCase().includes("sumedh") ? (
                  <img
                    src="/avatars/sumedh_kulkarni.jpg"
                    alt={profile?.full_name || "Sumedh Kulkarni"}
                    className="w-full h-full object-cover object-top"
                  />
                ) : profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1A2220] flex flex-col items-center justify-center text-white">
                    <span className="font-display text-2xl font-bold text-yellow-golden font-mono tracking-wider">
                      {(profile?.full_name || workerId)
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-sage-muted mt-0.5">
                      {profile?.worker_id || workerId}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-deep px-2 py-0.5 rounded bg-teal-light">
                    {profile?.worker_id || workerId}
                  </span>
                  <span className="text-xs text-sage-muted font-medium">
                    {profile?.department || "Operations"} · {profile?.plant_unit || "CDU-1"}
                  </span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-charcoal">
                  {profile?.full_name || (workerId === "EMP-1042" ? "Sumedh Kulkarni" : `Worker ${workerId}`)}
                </h1>
                <div className="text-xs text-sage-muted font-medium">
                  {profile?.role || "Field Operator"} · {profile?.age || (workerId === "EMP-1042" ? 25 : 32)} yrs · {profile?.gender || "Male"}
                </div>
              </div>
            </div>

            {/* Right: Active Wristband Status & Cumulative KPI (6 cols) */}
            <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="bg-warm-white p-3.5 rounded-2xl border border-light-surface flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono text-sage-muted uppercase">Active Wristband</div>
                  <div className="text-sm font-bold font-mono text-teal-deep mt-1 truncate">
                    {badgeParam || profile?.active_badge_id || "BAND-1042-01"}
                  </div>
                  <div className="text-[10px] text-sage font-mono mt-0.5">
                    Day {profile?.band_lifecycle_day || 2} of 5
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="mt-2 py-1 px-2 bg-white hover:bg-yellow-golden/25 border border-light-surface hover:border-yellow-golden rounded-lg text-[10px] font-mono font-bold text-charcoal flex items-center justify-center gap-1 transition-all shadow-sm group"
                  title="Generate & Print Physical Wristband QR Sticker"
                >
                  <QrCode className="w-3 h-3 text-teal-deep group-hover:scale-110 transition-transform" />
                  <span>Wristband QR</span>
                </button>
              </div>

              <div className="bg-warm-white p-3.5 rounded-2xl border border-light-surface">
                <div className="text-[10px] font-mono text-sage-muted uppercase">7-Day Rolling Load</div>
                <div className="text-lg font-bold font-mono text-charcoal mt-0.5">
                  {ledger.rolling_7day_ppm_hr ?? 7.4} <span className="text-[10px]">ppm·h</span>
                </div>
                <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                  Normal Tier
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-warm-white p-3.5 rounded-2xl border border-light-surface">
                <div className="text-[10px] font-mono text-sage-muted uppercase">Lifetime Shifts</div>
                <div className="text-lg font-bold font-mono text-charcoal mt-0.5">
                  {ledger.lifetime_shifts_logged ?? scans.length ?? 142}
                </div>
                <div className="text-[10px] text-sage font-mono mt-0.5">
                  Verified Records
                </div>
              </div>
            </div>
          </div>

          {/* Longitudinal Recharts Exposure Graph */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm">
            <ExposureChart scans={scans} />
          </div>

          {/* Paired Shift Reading Workflow Modal / Input Box */}
          <ReadingCapture
            workerId={workerId}
            workerName={profile?.full_name || (workerId === "EMP-1042" ? "Sumedh Kulkarni" : `Worker ${workerId}`)}
            defaultUnit={profile?.plant_unit || "CDU-1"}
            activeBadgeId={badgeParam || profile?.active_badge_id || `BAND-${workerId.replace("EMP-", "")}-01`}
            currentLifecycleDay={profile?.band_lifecycle_day || 1}
            hasActiveShift={scans.length > 0 && scans[0].shift_status === "ACTIVE"}
            initialDeltaE={searchParams.get("deltaE") ? parseFloat(searchParams.get("deltaE")!) : undefined}
            onShiftUpdated={fetchProfile}
            onScanLogged={(briefing) => setActiveBriefing(briefing)}
          />

          {/* Dual Column: Health Baseline & Historical Shifts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Clinical Health Profile & PPE Baseline (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-light-surface pb-3">
                <Heart className="w-5 h-5 text-teal-deep" />
                <h3 className="font-display text-xl uppercase tracking-tight text-charcoal">
                  Clinical & PPE Baseline
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase text-sage-muted">Smoking Status</div>
                  <div className="font-semibold text-charcoal">{health.smoking_status || "Non-smoker"}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-sage-muted">Baseline Spirometry (FEV1 / FVC)</div>
                  <div className="font-semibold text-charcoal font-mono">
                    FEV1: {health.fev1_baseline_liters || "3.8 L"} · FVC: {health.fvc_baseline_liters || "4.6 L"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-sage-muted">Assigned Respirator & Cartridge</div>
                  <div className="font-semibold text-charcoal">
                    {ppe.respirator_type || "3M Half-Face 6200 with 6006 Cartridge"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-sage-muted">Fit-Test Verification</div>
                  <div className="font-semibold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Passed on {ppe.fit_test_date || "2026-07-15"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Historical Shift Log (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-light-surface pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-deep" />
                  <h3 className="font-display text-xl uppercase tracking-tight text-charcoal">
                    Shift Dosimetry History
                  </h3>
                </div>
                <span className="text-xs font-mono text-sage-muted">{scans.length} Shifts Recorded</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-warm-white border-b border-light-surface text-[10px] font-mono font-bold uppercase text-charcoal">
                      <th className="p-3 pl-4">Scan ID & Time</th>
                      <th className="p-3">Station</th>
                      <th className="p-3">Band ID</th>
                      <th className="p-3">Hazard Score</th>
                      <th className="p-3">Total Exposure</th>
                      <th className="p-3 pr-4">Safety Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-surface text-xs text-charcoal font-mono">
                    {scans.map((scan) => {
                      const m = scan.computed_metrics || ({} as any);
                      const doseHigh = typeof m.dose_high === "number" ? m.dose_high : 3.6;
                      const hazardScore = typeof m.hazard_score_5pt === "number"
                        ? m.hazard_score_5pt
                        : Math.min(5.0, Math.max(0.0, parseFloat((doseHigh / 4.0).toFixed(1))));
                      const isCritical = hazardScore > 3.4 || m.statutory_tier === "TIER 3 (CRITICAL)";
                      const isCaution = !isCritical && (hazardScore > 1.5 || m.statutory_tier === "TIER 2 (CAUTION)");

                      return (
                        <tr key={scan.scan_id} className="hover:bg-warm-white/60 transition-colors">
                          <td className="p-3 pl-4">
                            <div className="font-bold text-charcoal">{scan.scan_id}</div>
                            <div className="text-[10px] text-sage-muted" suppressHydrationWarning>
                              {scan.timestamp ? new Date(scan.timestamp).toLocaleString() : "Recent"}
                            </div>
                          </td>
                          <td className="p-3 font-sans font-medium">{scan.plant_unit}</td>
                          <td className="p-3 text-teal-deep">{scan.badge_data?.badge_id || "BAND-01"}</td>
                          <td className="p-3 font-bold">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                              isCritical
                                ? "bg-red-100 text-red-800 border border-red-300"
                                : isCaution
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            }`}>
                              ★ {hazardScore.toFixed(1)} / 5.0
                            </span>
                          </td>
                          <td className="p-3 font-bold text-charcoal">
                            <div>{m.shift_dose_range_str || "3.0–3.6 ppm·h"}</div>
                            <div className="text-[10px] text-sage-muted font-normal">TWA: {m.shift_twa_range_str || "0.4–0.5 ppm"}</div>
                          </td>
                          <td className="p-3 pr-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase ${
                                isCritical
                                  ? "bg-red-500 text-white"
                                  : isCaution
                                  ? "bg-yellow-golden text-charcoal font-extrabold"
                                  : "bg-emerald-600 text-white"
                              }`}
                            >
                              {isCritical ? "CRITICAL ALERT" : isCaution ? "CAUTION" : "NORMAL / SAFE"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Docked AI Safety Chatbot Drawer with Proactive Briefing */}
        <ChatbotDrawer
          workerId={workerId}
          workerName={profile?.full_name || (workerId === "EMP-1042" ? "Sumedh Kulkarni" : `Worker ${workerId}`)}
          briefing={activeBriefing}
        />

        {/* Wristband QR Code Generator Modal */}
        <WorkerQrModal
          worker={showQrModal && profile ? profile : null}
          onClose={() => setShowQrModal(false)}
        />
      </main>
      <Footer />
    </>
  );
}
