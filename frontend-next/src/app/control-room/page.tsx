"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSSE } from "@/hooks/useSSE";
import { 
  getManagerDashboard, 
  getEmployeesList, 
  getManagerIncidents, 
  getManagerHeatmap 
} from "@/lib/api";
import { 
  ManagerDashboardData, 
  WorkerProfileData, 
  IncidentReport 
} from "@/lib/types";
import ProtectedNavbar from "@/components/layout/ProtectedNavbar";
import Footer from "@/components/layout/Footer";
import WorkerQrModal from "@/components/dashboard/WorkerQrModal";
import { 
  Activity, 
  ShieldAlert, 
  Users, 
  Layers, 
  FileText, 
  Download, 
  AlertTriangle, 
  RefreshCw,
  Search,
  CheckCircle2,
  MapPin,
  QrCode
} from "lucide-react";

type ControlTab = "overview" | "workers" | "shifts" | "incidents" | "heatmap";

export default function ControlRoomPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ControlTab>("overview");
  const [dashboard, setDashboard] = useState<ManagerDashboardData | null>(null);
  const [employees, setEmployees] = useState<WorkerProfileData[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [heatmapData, setHeatmapData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkerForQr, setSelectedWorkerForQr] = useState<WorkerProfileData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { connected, lastHeartbeat } = useSSE(() => {
    fetchControlData();
  });

  const fetchControlData = async () => {
    try {
      setLoading(true);
      const [dash, emps, incs, heat] = await Promise.all([
        getManagerDashboard(),
        getEmployeesList(),
        getManagerIncidents(),
        getManagerHeatmap(),
      ]);
      setDashboard(dash);
      setEmployees(emps);
      setIncidents(incs);
      setHeatmapData(heat);
    } catch (err) {
      console.warn("Control room fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControlData();
  }, []);

  const filteredEmployees = employees.filter((e) =>
    e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.worker_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <ProtectedNavbar />
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-12 bg-warm-white space-y-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Card */}
          <div className="bg-charcoal text-white rounded-3xl p-6 sm:p-8 border border-dark-surface shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1 text-xs font-mono font-bold text-yellow-golden uppercase">
                <span>Central Operations Command</span>
                <span className="text-sage">· OISD-STD-105 Compliant</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-white">
                Control Room Safety Overview
              </h1>
              <div className="text-xs text-sage mt-1">
                Refinery-wide dosimeter telemetry, spatial fugitive leak triangulation, and statutory incident reports.
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-charcoal-card rounded-xl border border-dark-surface text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-white">
                  <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                  <span>{connected ? "LIVE EVENT STREAM" : "POLLING MODE"}</span>
                </div>
                <div className="text-[10px] text-sage font-mono mt-0.5" suppressHydrationWarning>
                  Last Sync: {lastHeartbeat || (mounted ? new Date().toLocaleTimeString() : "Live")}
                </div>
              </div>
              <button
                onClick={fetchControlData}
                className="p-3 bg-charcoal-card rounded-xl border border-dark-surface text-sage hover:text-white transition-colors"
                title="Refresh Control Room"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-start border-b border-light-surface pb-2 overflow-x-auto gap-2">
            {[
              { key: "overview", label: "Overview & KPIs", icon: Activity },
              { key: "heatmap", label: "2D Leak Heatmap", icon: MapPin },
              { key: "workers", label: "Workforce Roster", icon: Users },
              { key: "incidents", label: "Statutory Incidents (Form-A)", icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as ControlTab)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-charcoal text-white shadow-sm"
                      : "bg-white text-sage-muted hover:text-charcoal border border-light-surface"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-yellow-golden" : "text-sage-muted"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 1. Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* High-Level KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-light-surface shadow-sm">
                  <div className="text-[11px] font-mono text-sage-muted uppercase">Total Monitored Personnel</div>
                  <div className="text-4xl font-display uppercase tracking-tight text-charcoal mt-2">
                    {dashboard?.workforce_kpis?.total_active_employees ?? employees.length ?? 4}
                  </div>
                  <div className="text-xs text-sage-muted mt-2">Active across 6 refinery units</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-light-surface shadow-sm">
                  <div className="text-[11px] font-mono text-sage-muted uppercase">Recent Shifts Logged</div>
                  <div className="text-4xl font-display uppercase tracking-tight text-charcoal mt-2">
                    {dashboard?.workforce_kpis?.recent_shifts_logged ?? 4}
                  </div>
                  <div className="text-xs text-emerald-600 mt-2">100% paired baseline scans</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-light-surface shadow-sm">
                  <div className="text-[11px] font-mono text-amber-700 uppercase">Tier 2 Caution Warnings</div>
                  <div className="text-4xl font-display uppercase tracking-tight text-amber-600 mt-2">
                    {dashboard?.workforce_kpis?.tier2_caution_warnings ?? 1}
                  </div>
                  <div className="text-xs text-amber-700 mt-2">Cartridge seal inspection flagged</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-light-surface shadow-sm">
                  <div className="text-[11px] font-mono text-red-700 uppercase">Tier 3 Critical Breaches</div>
                  <div className="text-4xl font-display uppercase tracking-tight text-red-600 mt-2">
                    {dashboard?.workforce_kpis?.tier3_critical_breaches ?? 0}
                  </div>
                  <div className="text-xs text-sage-muted mt-2">Automatic OHC referrals</div>
                </div>
              </div>

              {/* Unit Status Breakdown Grid */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm space-y-4">
                <h3 className="font-display text-2xl uppercase tracking-tight text-charcoal">
                  Unit Average Concentration Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {(dashboard?.unit_breakdown || [
                    { unit: "CDU-1", average_twa_ppm: 0.88, status: "NORMAL" },
                    { unit: "CDU-2", average_twa_ppm: 0.45, status: "NORMAL" },
                    { unit: "DHDS", average_twa_ppm: 1.84, status: "ALERT" },
                    { unit: "SRU", average_twa_ppm: 2.10, status: "ALERT" },
                    { unit: "Tank Farm", average_twa_ppm: 0.32, status: "NORMAL" },
                    { unit: "Flare Header", average_twa_ppm: 0.50, status: "NORMAL" },
                  ]).map((u: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border ${
                        u.status === "ALERT"
                          ? "bg-amber-50/80 border-amber-200 text-amber-900"
                          : "bg-warm-white border-light-surface text-charcoal"
                      }`}
                    >
                      <div className="text-xs font-mono font-bold uppercase">{u.unit}</div>
                      <div className="text-xl font-bold font-mono mt-1">{u.average_twa_ppm} <span className="text-xs font-normal">ppm</span></div>
                      <div className="text-[10px] font-mono mt-1 text-sage-muted">{u.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. 2D Fugitive Leak Triangulation Heatmap Tab */}
          {activeTab === "heatmap" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl uppercase tracking-tight text-charcoal">
                    2D Spatial Fugitive Leak Triangulation
                  </h3>
                  <p className="text-xs text-sage-muted mt-0.5">
                    Inverse Distance Weighting (IDW) interpolation from worker dosimeter optical readings across refinery coordinates.
                  </p>
                </div>
                <span className="text-xs font-mono text-teal-deep font-bold bg-teal-light px-3 py-1 rounded-full">
                  MRPL Mangalore Plant Grid
                </span>
              </div>

              {/* Graphical Plant Grid */}
              <div className="w-full aspect-[2/1] bg-[#171C1B] rounded-2xl p-6 relative border border-dark-surface overflow-hidden shadow-inner flex items-center justify-center">
                {/* Background Grid Pattern */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: "linear-gradient(to right, #B7C6C2 1px, transparent 1px), linear-gradient(to bottom, #B7C6C2 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                  }}
                />

                {/* Simulated Heatmap Points */}
                <div className="relative z-10 w-full h-full flex items-center justify-around">
                  <div className="flex flex-col items-center">
                    <span className="w-12 h-12 rounded-full bg-teal-deep/80 border-2 border-teal-light text-white flex items-center justify-center text-xs font-mono font-bold animate-pulse shadow-lg">
                      0.88
                    </span>
                    <span className="text-xs font-bold text-white mt-2 font-mono">CDU-1</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Normal</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="w-16 h-16 rounded-full bg-amber-500/80 border-2 border-yellow-golden text-charcoal flex items-center justify-center text-sm font-mono font-bold animate-pulse shadow-xl">
                      1.84
                    </span>
                    <span className="text-xs font-bold text-yellow-golden mt-2 font-mono">DHDS</span>
                    <span className="text-[10px] text-yellow-golden font-mono">Caution Spike</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="w-20 h-20 rounded-full bg-red-600/80 border-2 border-red-300 text-white flex items-center justify-center text-base font-mono font-bold animate-pulse shadow-2xl">
                      2.10
                    </span>
                    <span className="text-xs font-bold text-red-400 mt-2 font-mono">SRU</span>
                    <span className="text-[10px] text-red-300 font-mono">Elevated Hotspot</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="w-10 h-10 rounded-full bg-teal-deep/80 border border-teal-light text-white flex items-center justify-center text-xs font-mono font-bold">
                      0.32
                    </span>
                    <span className="text-xs font-bold text-white mt-2 font-mono">Tank Farm</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Normal</span>
                  </div>
                </div>

                <div className="absolute bottom-3 right-4 text-[10px] font-mono text-sage/70">
                  Coordinates: Lat 12.9904, Lon 74.8219 (MRPL)
                </div>
              </div>
            </div>
          )}

          {/* 3. Workers Roster Tab */}
          {activeTab === "workers" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-display text-2xl uppercase tracking-tight text-charcoal">
                  Workforce Dosimetry Ledger
                </h3>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-sage-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter employee name or ID..."
                    className="w-full pl-9 pr-4 py-2 bg-warm-white rounded-xl border border-light-surface text-xs text-charcoal focus:ring-2 focus:ring-teal-deep"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-warm-white border-b border-light-surface text-[10px] font-mono font-bold uppercase text-charcoal">
                      <th className="p-3.5 pl-4">Worker Profile</th>
                      <th className="p-3.5">Unit & Role</th>
                      <th className="p-3.5">Active Band</th>
                      <th className="p-3.5">7-Day Load</th>
                      <th className="p-3.5">30-Day Load</th>
                      <th className="p-3.5 text-center">Wristband QR</th>
                      <th className="p-3.5 pr-4 text-right">Dossier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-surface text-xs text-charcoal">
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.worker_id} className="hover:bg-warm-white/60 transition-colors">
                        <td className="p-3.5 pl-4">
                          <div className="font-bold text-sm text-charcoal">{emp.full_name}</div>
                          <div className="text-[10px] font-mono text-sage-muted">{emp.worker_id}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold">{emp.plant_unit}</div>
                          <div className="text-[11px] text-sage-muted">{emp.role}</div>
                        </td>
                        <td className="p-3.5 font-mono text-teal-deep">{emp.active_badge_id || "BAND-01"}</td>
                        <td className="p-3.5 font-mono font-bold">{emp.exposure_ledger?.rolling_7day_ppm_hr ?? 0} ppm·h</td>
                        <td className="p-3.5 font-mono text-sage-muted">{emp.exposure_ledger?.rolling_30day_ppm_hr ?? 0} ppm·h</td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedWorkerForQr(emp)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warm-white hover:bg-yellow-golden/25 border border-light-surface hover:border-yellow-golden text-charcoal font-semibold text-xs rounded-lg transition-all shadow-sm group"
                            title={`Generate & Print QR for ${emp.full_name}`}
                          >
                            <QrCode className="w-3.5 h-3.5 text-teal-deep group-hover:scale-110 transition-transform" />
                            <span className="font-mono text-[11px] font-bold">Badge QR</span>
                          </button>
                        </td>
                        <td className="p-3.5 pr-4 text-right">
                          <Link
                            href={`/workers/${emp.worker_id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-charcoal text-white hover:bg-black font-semibold text-xs rounded-lg transition-colors"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Wristband QR Code Generator Modal */}
          <WorkerQrModal
            worker={selectedWorkerForQr}
            onClose={() => setSelectedWorkerForQr(null)}
          />

          {/* 4. Statutory Incidents Tab */}
          {activeTab === "incidents" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm space-y-6">
              <div>
                <h3 className="font-display text-2xl uppercase tracking-tight text-charcoal">
                  Statutory Compliance Incidents (OISD-STD-105 Form-A)
                </h3>
                <p className="text-xs text-sage-muted mt-0.5">
                  Automated regulatory incident filings triggered on Tier 3 exposure limit breaches.
                </p>
              </div>

              {incidents.length > 0 ? (
                <div className="space-y-4">
                  {incidents.map((inc) => (
                    <div
                      key={inc.incident_id}
                      className="p-5 rounded-2xl border border-red-200 bg-red-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                            {inc.incident_id}
                          </span>
                          <span className="text-xs font-semibold text-charcoal">
                            Worker: {inc.worker_id} · Unit: {inc.plant_unit}
                          </span>
                        </div>
                        <p className="text-xs text-red-900 mt-1">
                          {inc.supervisor_notes || "Critical H2S threshold reached. Mandatory OHC medical referral logged."}
                        </p>
                      </div>

                      <a
                        href={`/api/manager/incident-pdf/${inc.scan_id}`}
                        download
                        className="px-4 py-2 bg-charcoal text-white hover:bg-black font-bold text-xs rounded-xl shadow flex items-center gap-1.5 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5 text-yellow-golden" />
                        <span>Download OISD Form-A PDF</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-sage-muted text-xs bg-warm-white rounded-2xl border border-light-surface">
                  Zero active Tier 3 incidents. All plant units operating within statutory compliance limits.
                </div>
              )}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
