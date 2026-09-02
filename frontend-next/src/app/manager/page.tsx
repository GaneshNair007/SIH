"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSSE } from "@/hooks/useSSE";
import { getManagerDashboard, getEmployeesList } from "@/lib/api";
import { ManagerDashboardData, WorkerProfileData } from "@/lib/types";
import ProtectedNavbar from "@/components/layout/ProtectedNavbar";
import Footer from "@/components/layout/Footer";
import BandScanner from "@/components/dashboard/BandScanner";
import WorkerQrModal from "@/components/dashboard/WorkerQrModal";
import { 
  Camera, 
  Users, 
  AlertTriangle, 
  Activity, 
  ShieldCheck, 
  QrCode, 
  ArrowRight, 
  Search, 
  RefreshCw,
  FileText,
  Clock,
  CheckCircle2,
  Printer
} from "lucide-react";

export default function ManagerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
  const [employees, setEmployees] = useState<WorkerProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedWorkerForQr, setSelectedWorkerForQr] = useState<WorkerProfileData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // SSE real-time updates
  const { connected, lastHeartbeat } = useSSE(() => {
    fetchDashboard();
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dash, emps] = await Promise.all([
        getManagerDashboard(),
        getEmployeesList(),
      ]);
      setDashboardData(dash);
      setEmployees(emps);
    } catch (err) {
      console.warn("Failed to fetch manager data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const filteredEmployees = employees.filter((e) =>
    e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.worker_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.plant_unit.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <ProtectedNavbar />
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-12 bg-warm-white space-y-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Manager Header */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-light-surface shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-teal-deep uppercase">Refinery Shift Operations</span>
                <span className="text-xs text-sage-muted">· MRPL Mangalore</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-charcoal">
                {user?.full_name || "Vikram Singh"} — {user?.role || "Shift Safety Lead"}
              </h1>
              <div className="text-xs text-sage-muted mt-1 flex flex-wrap items-center gap-4" suppressHydrationWarning>
                <span suppressHydrationWarning>
                  Date: {mounted ? new Date().toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "Today"}
                </span>
                <span>Workspace: Central Operations</span>
              </div>
            </div>

            {/* Connection & Live Sync Indicator */}
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-warm-white border border-light-surface text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-charcoal">
                  <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
                  <span>{connected ? "LIVE SSE STREAM" : "POLLING MODE"}</span>
                </div>
                <div className="text-[10px] text-sage-muted font-mono mt-0.5" suppressHydrationWarning>
                  Last Sync: {lastHeartbeat || (mounted ? new Date().toLocaleTimeString() : "Live")}
                </div>
              </div>

              <button
                onClick={fetchDashboard}
                className="p-3 rounded-xl bg-warm-white border border-light-surface text-sage-muted hover:text-charcoal transition-colors"
                title="Refresh dashboard"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Top Layout: Top-Left Scanner + KPI Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Top-Left: Prominent Scan Band Card (4 cols) */}
            <div className="lg:col-span-4 bg-gradient-to-br from-charcoal to-charcoal-dark text-white rounded-2xl p-6 sm:p-8 border border-dark-surface shadow-xl flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-yellow-golden uppercase tracking-wider">
                    Quick Optical Action
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <h2 className="font-display text-3xl uppercase tracking-tight text-white mb-2">
                  SCAN WRISTBAND
                </h2>
                <p className="text-xs text-sage leading-relaxed mb-6">
                  Activate the smartphone camera to decode the employee QR code, evaluate image quality, and capture start/end shift optical state.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setScannerOpen(!scannerOpen)}
                  className="w-full py-3.5 bg-yellow-golden text-charcoal hover:bg-yellow-hover font-bold text-sm rounded-xl transition-all shadow flex items-center justify-center gap-2 group"
                >
                  <Camera className="w-4 h-4" />
                  <span>{scannerOpen ? "Collapse Scanner" : "Launch Camera Viewfinder"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <Link
                  href="/manager/scan"
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl transition-colors text-center block"
                >
                  Open Standalone Scanner View
                </Link>
              </div>
            </div>

            {/* Right: Summary KPIs (8 cols) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1: Active Employees */}
              <div className="bg-white rounded-2xl p-5 border border-light-surface shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono text-sage-muted uppercase">Active Workforce</span>
                  <Users className="w-4 h-4 text-teal-deep" />
                </div>
                <div className="text-3xl font-display uppercase tracking-tight text-charcoal">
                  {dashboardData?.workforce_kpis?.total_active_employees ?? employees.length ?? 4}
                </div>
                <div className="text-[11px] text-sage-muted mt-2">All units monitored</div>
              </div>

              {/* Card 2: Recent Shifts Logged */}
              <div className="bg-white rounded-2xl p-5 border border-light-surface shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono text-sage-muted uppercase">Shifts Logged</span>
                  <Activity className="w-4 h-4 text-teal-deep" />
                </div>
                <div className="text-3xl font-display uppercase tracking-tight text-charcoal">
                  {dashboardData?.workforce_kpis?.recent_shifts_logged ?? 4}
                </div>
                <div className="text-[11px] text-emerald-600 mt-2">100% paired shifts</div>
              </div>

              {/* Card 3: Tier 2 Caution Warnings */}
              <div className="bg-white rounded-2xl p-5 border border-light-surface shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono text-amber-700 uppercase">Caution (Tier 2)</span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-3xl font-display uppercase tracking-tight text-amber-600">
                  {dashboardData?.workforce_kpis?.tier2_caution_warnings ?? 1}
                </div>
                <div className="text-[11px] text-amber-700 mt-2">Cartridge seal checks</div>
              </div>

              {/* Card 4: Open OISD Incidents */}
              <div className="bg-white rounded-2xl p-5 border border-light-surface shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono text-red-700 uppercase">Critical (Tier 3)</span>
                  <ShieldCheck className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-3xl font-display uppercase tracking-tight text-red-600">
                  {dashboardData?.workforce_kpis?.tier3_critical_breaches ?? 0}
                </div>
                <div className="text-[11px] text-sage-muted mt-2">OISD Form-A filings</div>
              </div>

              {/* Unit Exposure Breakdown Table (Spans full width of right col) */}
              <div className="sm:col-span-2 md:col-span-4 bg-white rounded-2xl p-6 border border-light-surface shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl uppercase tracking-tight text-charcoal">
                    Plant Unit Exposure Telemetry
                  </h3>
                  <Link href="/control-room" className="text-xs font-semibold text-teal-deep hover:underline">
                    View 2D Triangulation Map →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                  {(dashboardData?.unit_breakdown || [
                    { unit: "CDU-1", average_twa_ppm: 0.88, status: "NORMAL" },
                    { unit: "CDU-2", average_twa_ppm: 0.45, status: "NORMAL" },
                    { unit: "DHDS", average_twa_ppm: 1.84, status: "ALERT" },
                    { unit: "SRU", average_twa_ppm: 2.10, status: "ALERT" },
                    { unit: "Tank Farm", average_twa_ppm: 0.32, status: "NORMAL" },
                    { unit: "Flare Header", average_twa_ppm: 0.50, status: "NORMAL" },
                  ]).map((u: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border ${
                        u.status === "ALERT"
                          ? "bg-amber-50/60 border-amber-200 text-amber-900"
                          : "bg-warm-white border-light-surface text-charcoal"
                      }`}
                    >
                      <div className="text-xs font-bold font-mono">{u.unit}</div>
                      <div className="text-base font-bold font-mono mt-1">{u.average_twa_ppm} <span className="text-[10px]">ppm</span></div>
                      <div className="text-[9px] font-mono mt-0.5 text-sage-muted">{u.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible In-Dashboard Camera Scanner */}
          {scannerOpen && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <BandScanner standalone={false} />
            </div>
          )}

          {/* Workforce Roster & Quick Search */}
          <div className="bg-white rounded-2xl border border-light-surface shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl uppercase tracking-tight text-charcoal">
                  Refinery Worker Dosimetry Roster
                </h2>
                <p className="text-xs text-sage-muted mt-0.5">
                  Select any worker to inspect longitudinal exposure graphs, paired shift scans, and band lifecycle.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-sage-muted absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search worker ID, name, unit..."
                  className="w-full pl-9 pr-4 py-2 bg-warm-white rounded-xl border border-light-surface text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-teal-deep"
                />
              </div>
            </div>

            {/* Workers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-warm-white border-b border-light-surface text-[11px] font-mono font-bold uppercase text-charcoal">
                    <th className="p-3.5 pl-4">Worker ID & Name</th>
                    <th className="p-3.5">Assigned Unit & Role</th>
                    <th className="p-3.5">Active Wristband</th>
                    <th className="p-3.5">Lifecycle Day</th>
                    <th className="p-3.5">7-Day Load Range</th>
                    <th className="p-3.5 text-center">Wristband QR</th>
                    <th className="p-3.5 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-surface text-xs text-charcoal">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => {
                      const load = emp.exposure_ledger?.rolling_7day_ppm_hr ?? 0;
                      const isHigh = load >= 15.0;
                      return (
                        <tr key={emp.worker_id} className="hover:bg-warm-white/60 transition-colors">
                          <td className="p-3.5 pl-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm shrink-0 border border-light-surface bg-warm-white flex items-center justify-center">
                                {emp.worker_id === "EMP-1042" || emp.full_name?.toLowerCase().includes("sumedh") ? (
                                  <img
                                    src="/avatars/sumedh_kulkarni.jpg"
                                    alt={emp.full_name}
                                    className="w-full h-full object-cover object-top"
                                  />
                                ) : (
                                  <span className="font-bold text-xs text-teal-deep font-mono">
                                    {emp.full_name.substring(0, 2)}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-sm text-charcoal">{emp.full_name}</div>
                                <div className="text-[11px] font-mono text-sage-muted">{emp.worker_id} · {emp.age || (emp.worker_id === "EMP-1042" ? 25 : 35)} yrs</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold">{emp.plant_unit}</div>
                            <div className="text-[11px] text-sage-muted">{emp.role}</div>
                          </td>
                          <td className="p-3.5 font-mono text-xs text-teal-deep">
                            {emp.active_badge_id || "BAND-01"}
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sage-light/50 text-charcoal">
                              Day {emp.band_lifecycle_day || 1}/5
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full ${
                                isHigh
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {load.toFixed(1)} ppm·h
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedWorkerForQr(emp)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warm-white hover:bg-yellow-golden/25 border border-light-surface hover:border-yellow-golden text-charcoal font-semibold text-xs rounded-lg transition-all shadow-sm group"
                              title={`Generate & Print Wristband QR Sticker for ${emp.full_name} (${emp.worker_id})`}
                            >
                              <QrCode className="w-4 h-4 text-teal-deep group-hover:scale-110 transition-transform" />
                              <span className="font-mono text-[11px] font-bold">Wristband QR</span>
                            </button>
                          </td>
                          <td className="p-3.5 pr-4 text-right">
                            <Link
                              href={`/workers/${emp.worker_id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-charcoal text-white hover:bg-black font-semibold text-xs rounded-lg transition-colors"
                            >
                              <span>Dossier</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-sage-muted text-xs">
                        No employees found matching &quot;{searchQuery}&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Wristband QR Code Generator Modal */}
        <WorkerQrModal
          worker={selectedWorkerForQr}
          onClose={() => setSelectedWorkerForQr(null)}
        />
      </main>
      <Footer />
    </>
  );
}
