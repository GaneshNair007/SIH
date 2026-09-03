"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { managerApi } from "@/lib/api/manager";

export default function ManagerWorkspacePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [scanInput, setScanInput] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: managerApi.getDashboard,
    refetchInterval: 15000,
  });

  const handleResolveScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    setIsResolving(true);
    setErrorMsg(null);

    const targetId = scanInput.trim().toUpperCase();

    try {
      // Check if it's an employee ID or band ID by attempting lookup
      const employees = await managerApi.getEmployees();
      const match = employees.find(
        (emp) =>
          emp.employee_id.toUpperCase() === targetId ||
          emp.active_badge_id.toUpperCase() === targetId ||
          emp.full_name.toUpperCase().includes(targetId)
      );

      if (match) {
        router.push(`/workers/${match.employee_id}`);
      } else {
        setErrorMsg("Not found / Not authorized in your company unit.");
      }
    } catch {
      setErrorMsg("Failed to resolve band identity. Please try again.");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <AppShell>
      {/* Manager Summary Header */}
      <div className="card p-6 mb-8 bg-surface border border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-medium text-text-primary">Shift Manager Workspace</h1>
              <span className="badge-success">Online</span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              {user?.full_name} • {user?.plant_unit} • {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/scan")} 
              className="btn-primary"
            >
              Camera Scan Mode
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Top-Left Scanner Card */}
        <div className="card col-span-1 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-lg font-medium text-text-primary">Scan / Lookup Band</h2>
            <span className="text-xs text-text-secondary font-mono">Shift Operations</span>
          </div>

          <p className="text-sm text-text-secondary">
            Enter or scan a worker QR barcode to access their longitudinal profile and log shift dosimetry.
          </p>

          <form onSubmit={handleResolveScan} className="space-y-4">
            <div>
              <label htmlFor="scanInput" className="label">Worker ID or Badge Barcode</label>
              <input
                id="scanInput"
                type="text"
                className="input-field"
                placeholder="e.g. EMP-1042 or BAND-1042-01"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                required
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-status-errorBg border border-status-error text-status-error text-xs rounded-md">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isResolving || !scanInput.trim()}
                className="btn-primary flex-1"
              >
                {isResolving ? "Resolving..." : "Lookup Worker"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/scan")}
                className="btn-secondary shrink-0"
                title="Open Camera Scanner"
              >
                📷 Camera
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-border space-y-2">
            <div className="text-xs font-medium text-text-secondary uppercase">Quick Test Demo IDs</div>
            <div className="flex flex-wrap gap-2">
              {["EMP-1042", "EMP-1043", "EMP-1044"].map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setScanInput(id);
                    router.push(`/workers/${id}`);
                  }}
                  className="px-2 py-1 bg-surface-background border border-border text-xs rounded text-primary hover:bg-primary-light"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dashboard Overview Metrics & Scans */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* Key Metrics */}
          {dashboard && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card p-4">
                <div className="text-xs text-text-secondary uppercase">Active Workers</div>
                <div className="text-2xl font-medium text-text-primary mt-1">
                  {dashboard.workforce_kpis.total_active_employees}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-text-secondary uppercase">Shifts Today</div>
                <div className="text-2xl font-medium text-text-primary mt-1">
                  {dashboard.workforce_kpis.recent_shifts_logged}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-text-secondary uppercase">Tier 2 Warning</div>
                <div className="text-2xl font-medium text-status-warning mt-1">
                  {dashboard.workforce_kpis.tier2_caution_warnings}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-text-secondary uppercase">Open Incidents</div>
                <div className="text-2xl font-medium text-status-error mt-1">
                  {dashboard.workforce_kpis.open_oisd_incidents}
                </div>
              </div>
            </div>
          )}

          {/* Recent Shift Readings */}
          <div className="card p-0">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-base font-medium text-text-primary">Recent Shift Readings</h3>
              <button onClick={() => router.push("/employees")} className="text-primary text-xs hover:underline font-medium">
                View All Roster &rarr;
              </button>
            </div>
            {isLoading ? (
              <div className="py-8 text-center text-text-secondary">Loading metrics...</div>
            ) : error || !dashboard ? (
              <div className="p-4 text-status-error text-sm">Failed to load shift records.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-background text-xs font-medium text-text-secondary uppercase tracking-wider">
                      <th className="px-5 py-3 border-b border-border">Time</th>
                      <th className="px-5 py-3 border-b border-border">Worker ID</th>
                      <th className="px-5 py-3 border-b border-border">TWA (ppm)</th>
                      <th className="px-5 py-3 border-b border-border">Statutory Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm text-text-primary">
                    {dashboard.recent_scans.map((scan) => (
                      <tr key={scan.scan_id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-5 py-3 text-text-secondary">
                          {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3 font-medium">
                          <button
                            onClick={() => router.push(`/workers/${scan.employee_id}`)}
                            className="text-primary hover:underline text-left"
                          >
                            {scan.employee_id}
                          </button>
                        </td>
                        <td className="px-5 py-3 font-mono">
                          {scan.computed_metrics.shift_twa_ppm.toFixed(2)}
                        </td>
                        <td className="px-5 py-3">
                          <span className={
                            scan.computed_metrics.statutory_tier.includes("TIER 1") ? "badge-success" :
                            scan.computed_metrics.statutory_tier.includes("TIER 2") ? "badge-warning" : "badge-error"
                          }>
                            {scan.computed_metrics.statutory_tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </AppShell>
  );
}
