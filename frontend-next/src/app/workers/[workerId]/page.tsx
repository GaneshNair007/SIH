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
import ChatbotDrawer from "@/components/assistant/ChatbotDrawer";
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
  CheckCircle2
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
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-charcoal to-[#242A29] text-yellow-golden flex items-center justify-center font-display text-3xl uppercase tracking-tighter shadow-md shrink-0">
                {profile?.full_name?.substring(0, 2) || "RK"}
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
                  {profile?.full_name || "Rajesh Kumar"}
                </h1>
                <div className="text-xs text-sage-muted font-medium">
                  {profile?.role || "Senior Panel Operator"} · {profile?.age || 38} yrs · {profile?.gender || "Male"}
                </div>
              </div>
            </div>

            {/* Right: Active Wristband Status & Cumulative KPI (6 cols) */}
            <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="bg-warm-white p-3.5 rounded-2xl border border-light-surface">
                <div className="text-[10px] font-mono text-sage-muted uppercase">Active Wristband</div>
                <div className="text-sm font-bold font-mono text-teal-deep mt-1 truncate">
                  {badgeParam || profile?.active_badge_id || "BAND-1042-01"}
                </div>
                <div className="text-[10px] text-sage font-mono mt-0.5">
                  Day {profile?.band_lifecycle_day || 2} of 5
                </div>
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
            workerName={profile?.full_name || "Rajesh Kumar"}
            defaultUnit={profile?.plant_unit || "CDU-1"}
            activeBadgeId={badgeParam || profile?.active_badge_id || "BAND-1042-01"}
            currentLifecycleDay={profile?.band_lifecycle_day || 1}
            hasActiveShift={scans.length > 0 && scans[0].shift_status === "ACTIVE"}
            onShiftUpdated={fetchProfile}
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
                      <th className="p-3 pl-4">Scan ID & Timestamp</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Badge ID</th>
                      <th className="p-3">Net ΔE</th>
                      <th className="p-3">Dose Range</th>
                      <th className="p-3 pr-4">Statutory Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-surface text-xs text-charcoal font-mono">
                    {scans.map((scan) => {
                      const m = scan.computed_metrics || ({} as any);
                      const isTier3 = m.statutory_tier === "TIER 3 (CRITICAL)";
                      const isTier2 = m.statutory_tier === "TIER 2 (CAUTION)";
                      return (
                        <tr key={scan.scan_id} className="hover:bg-warm-white/60 transition-colors">
                          <td className="p-3 pl-4">
                            <div className="font-bold text-charcoal">{scan.scan_id}</div>
                            <div className="text-[10px] text-sage-muted">
                              {scan.timestamp ? new Date(scan.timestamp).toLocaleString() : "Recent"}
                            </div>
                          </td>
                          <td className="p-3 font-sans font-medium">{scan.plant_unit}</td>
                          <td className="p-3 text-teal-deep">{scan.badge_data?.badge_id || "BAND-01"}</td>
                          <td className="p-3 font-bold">{scan.badge_data?.net_delta_e ?? scan.badge_data?.delta_e ?? 0.0}</td>
                          <td className="p-3 text-yellow-800 font-bold">{m.shift_dose_range_str || "6.2–7.8 ppm·h"}</td>
                          <td className="p-3 pr-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                isTier3
                                  ? "bg-red-100 text-red-800 border border-red-300"
                                  : isTier2
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {m.statutory_tier || "TIER 1 (NORMAL)"}
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

        {/* Docked AI Safety Chatbot Drawer */}
        <ChatbotDrawer
          workerId={workerId}
          workerName={profile?.full_name || "Rajesh Kumar"}
        />
      </main>
      <Footer />
    </>
  );
}
