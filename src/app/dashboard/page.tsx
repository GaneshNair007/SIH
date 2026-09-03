"use client";

import { useQuery } from "@tanstack/react-query";
import { managerApi } from "@/lib/api/manager";
import AppShell from "@/components/layout/AppShell";

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: managerApi.getDashboard,
    refetchInterval: 15000, // Refresh every 15s for live data
  });

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-text-primary">Safety Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">Live overview of plant H₂S exposure and compliance</p>
      </div>

      {isLoading && (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-status-errorBg border border-status-error text-status-error rounded-md">
          Failed to load dashboard data. Please check connection.
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard title="Active Employees" value={data.workforce_kpis.total_active_employees} />
            <KpiCard title="Shifts Logged" value={data.workforce_kpis.recent_shifts_logged} />
            <KpiCard 
              title="Caution (Tier 2)" 
              value={data.workforce_kpis.tier2_caution_warnings} 
              isWarning={data.workforce_kpis.tier2_caution_warnings > 0} 
            />
            <KpiCard 
              title="Critical (Tier 3)" 
              value={data.workforce_kpis.tier3_critical_breaches} 
              isError={data.workforce_kpis.tier3_critical_breaches > 0} 
            />
            <KpiCard 
              title="Open Incidents" 
              value={data.workforce_kpis.open_oisd_incidents} 
              isError={data.workforce_kpis.open_oisd_incidents > 0} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Unit Breakdown */}
            <div className="card col-span-1 p-0">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-base font-medium text-text-primary">Plant Unit Breakdown</h3>
              </div>
              <ul className="divide-y divide-border">
                {data.unit_breakdown.map((unit) => (
                  <li key={unit.unit} className="px-5 py-3 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{unit.unit}</div>
                      <div className="text-xs text-text-secondary">{unit.total_scans} shifts</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-text-primary">{unit.average_twa_ppm} ppm</div>
                      <span className={unit.status === "ALERT" ? "badge-error mt-1" : "badge-success mt-1"}>
                        {unit.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent Scans */}
            <div className="card col-span-1 lg:col-span-2 p-0">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-base font-medium text-text-primary">Recent Scans</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-background text-xs font-medium text-text-secondary uppercase tracking-wider">
                      <th className="px-5 py-3 border-b border-border">Time</th>
                      <th className="px-5 py-3 border-b border-border">Worker ID</th>
                      <th className="px-5 py-3 border-b border-border">Unit</th>
                      <th className="px-5 py-3 border-b border-border">TWA (ppm)</th>
                      <th className="px-5 py-3 border-b border-border">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm text-text-primary">
                    {data.recent_scans.map((scan) => (
                      <tr key={scan.scan_id} className="hover:bg-surface-hover">
                        <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                          {new Date(scan.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-5 py-3 font-medium text-primary">
                          {scan.employee_id}
                        </td>
                        <td className="px-5 py-3 text-text-secondary">
                          {scan.plant_unit}
                        </td>
                        <td className="px-5 py-3">
                          {scan.computed_metrics.shift_twa_ppm.toFixed(2)}
                        </td>
                        <td className="px-5 py-3">
                          <span className={
                            scan.computed_metrics.statutory_tier.includes("TIER 1") ? "badge-success" :
                            scan.computed_metrics.statutory_tier.includes("TIER 2") ? "badge-warning" : "badge-error"
                          }>
                            {scan.computed_metrics.statutory_tier.split(" ")[0]}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {data.recent_scans.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-text-secondary">
                          No recent scans found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function KpiCard({ title, value, isWarning, isError }: { title: string, value: number, isWarning?: boolean, isError?: boolean }) {
  let valueColor = "text-text-primary";
  if (isError) valueColor = "text-status-error";
  else if (isWarning) valueColor = "text-status-warning";

  return (
    <div className="card p-5">
      <div className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">{title}</div>
      <div className={`text-3xl font-medium ${valueColor}`}>{value}</div>
    </div>
  );
}
