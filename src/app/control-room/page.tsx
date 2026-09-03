"use client";

import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/AppShell";
import { managerApi } from "@/lib/api/manager";
import Link from "next/link";

export default function ControlRoomPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["control-room-dashboard"],
    queryFn: managerApi.getDashboard,
    refetchInterval: 10000,
  });

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">Control Room Monitoring Overview</h1>
          <p className="text-sm text-text-secondary mt-1">Real-time occupational health risk matrix and environmental telemetry</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse"></span>
          <span className="text-xs text-text-secondary font-medium uppercase">SSE Stream Connected</span>
        </div>
      </div>

      {/* Metrics Header */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <div className="text-xs text-text-secondary uppercase">Active Plant Workers</div>
            <div className="text-3xl font-medium text-text-primary mt-2">
              {dashboard.workforce_kpis.total_active_employees}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-text-secondary uppercase">Shifts Logged Today</div>
            <div className="text-3xl font-medium text-text-primary mt-2">
              {dashboard.workforce_kpis.recent_shifts_logged}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-text-secondary uppercase font-medium text-status-warning">
              Tier 2 Caution Warnings
            </div>
            <div className="text-3xl font-medium text-status-warning mt-2">
              {dashboard.workforce_kpis.tier2_caution_warnings}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-text-secondary uppercase font-medium text-status-error">
              Tier 3 Open Incidents
            </div>
            <div className="text-3xl font-medium text-status-error mt-2">
              {dashboard.workforce_kpis.open_oisd_incidents}
            </div>
          </div>
        </div>
      )}

      {/* Plant Unit Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="card col-span-1 p-0">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-base font-medium text-text-primary">Plant Unit Telemetry Summary</h3>
          </div>
          {isLoading ? (
            <div className="py-8 text-center text-text-secondary">Loading unit data...</div>
          ) : (
            <ul className="divide-y divide-border">
              {dashboard?.unit_breakdown.map((unit) => (
                <li key={unit.unit} className="px-5 py-4 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-text-primary">{unit.unit}</div>
                    <div className="text-xs text-text-secondary">{unit.total_scans} shift scans</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-text-primary">{unit.average_twa_ppm} ppm TWA</div>
                    <span className={unit.status === "ALERT" ? "badge-error mt-1" : "badge-success mt-1"}>
                      {unit.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card col-span-1 lg:col-span-2 p-0">
          <div className="px-5 py-4 border-b border-border flex justify-between items-center">
            <h3 className="text-base font-medium text-text-primary">Live Dosimetry Stream</h3>
            <Link href="/manager" className="text-xs text-primary font-medium hover:underline">
              Go to Shift Manager &rarr;
            </Link>
          </div>
          {isLoading ? (
            <div className="py-8 text-center text-text-secondary">Loading live scans...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-background text-xs font-medium text-text-secondary uppercase tracking-wider">
                    <th className="px-5 py-3 border-b border-border">Time</th>
                    <th className="px-5 py-3 border-b border-border">Worker ID</th>
                    <th className="px-5 py-3 border-b border-border">Plant Unit</th>
                    <th className="px-5 py-3 border-b border-border">TWA (ppm)</th>
                    <th className="px-5 py-3 border-b border-border">Status Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-text-primary">
                  {dashboard?.recent_scans.map((scan) => (
                    <tr key={scan.scan_id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-5 py-3 text-text-secondary">
                        {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3 font-medium">
                        <Link href={`/workers/${scan.employee_id}`} className="text-primary hover:underline">
                          {scan.employee_id}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-text-secondary">{scan.plant_unit}</td>
                      <td className="px-5 py-3 font-mono">{scan.computed_metrics.shift_twa_ppm.toFixed(2)}</td>
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
    </AppShell>
  );
}
