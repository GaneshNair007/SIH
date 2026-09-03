"use client";

import { useQuery } from "@tanstack/react-query";
import { managerApi, RecentScan } from "@/lib/api/manager";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const employeeId = id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => managerApi.getEmployee(employeeId),
    enabled: !!employeeId,
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="p-4 bg-status-errorBg border border-status-error text-status-error rounded-md">
          Failed to load employee details.
        </div>
        <Link href="/employees" className="text-primary mt-4 inline-block hover:underline">
          &larr; Back to roster
        </Link>
      </AppShell>
    );
  }

  const { employee_profile: emp, recent_scans } = data;
  const load7d = emp.exposure_ledger?.rolling_7day_ppm_hr || 0;
  let badgeClass = "badge-success";
  if (load7d > 20) badgeClass = "badge-error";
  else if (load7d > 10) badgeClass = "badge-warning";

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/employees" className="text-text-secondary hover:text-primary text-sm mb-2 inline-flex items-center">
            &larr; Back to roster
          </Link>
          <h1 className="text-2xl font-medium text-text-primary">{emp.full_name}</h1>
          <p className="text-sm text-text-secondary mt-1">{emp.role} • {emp.plant_unit}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-text-secondary uppercase tracking-wide">7-Day Load</div>
          <div className="text-2xl font-medium mt-1">
            {load7d} <span className="text-sm font-normal text-text-secondary">ppm·h</span>
          </div>
          <div className="mt-1">
            <span className={badgeClass}>{emp.exposure_ledger?.rolling_7day_range_str || "0.0–0.0"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Details */}
        <div className="card col-span-1 p-5 space-y-4">
          <h3 className="text-base font-medium text-text-primary border-b border-border pb-2">Profile</h3>
          
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <div className="text-text-secondary text-xs">Worker ID</div>
              <div className="text-text-primary font-medium">{emp.worker_id}</div>
            </div>
            <div>
              <div className="text-text-secondary text-xs">Active Badge</div>
              <div className="text-text-primary font-medium font-mono">{emp.active_badge_id}</div>
            </div>
            <div>
              <div className="text-text-secondary text-xs">Department</div>
              <div className="text-text-primary font-medium">{emp.department}</div>
            </div>
            <div>
              <div className="text-text-secondary text-xs">Lifecycle Day</div>
              <div className="text-text-primary font-medium">{emp.band_lifecycle_day}/5</div>
            </div>
          </div>
        </div>

        {/* Shift History */}
        <div className="card col-span-1 lg:col-span-2 p-0">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-base font-medium text-text-primary">Shift History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-background text-xs font-medium text-text-secondary uppercase tracking-wider">
                  <th className="px-5 py-3 border-b border-border">Date</th>
                  <th className="px-5 py-3 border-b border-border">Status</th>
                  <th className="px-5 py-3 border-b border-border">TWA (ppm)</th>
                  <th className="px-5 py-3 border-b border-border">Dose (ppm·h)</th>
                  <th className="px-5 py-3 border-b border-border">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-text-primary">
                {recent_scans?.map((scan: RecentScan) => (
                  <tr key={scan.scan_id} className="hover:bg-surface-hover">
                    <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                      {new Date(scan.timestamp).toLocaleDateString()} {new Date(scan.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {scan.shift_status}
                    </td>
                    <td className="px-5 py-3">
                      {scan.computed_metrics?.shift_twa_ppm.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      {scan.computed_metrics?.compensated_dose_ppm_hr.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={
                        scan.computed_metrics?.statutory_tier.includes("TIER 1") ? "badge-success" :
                        scan.computed_metrics?.statutory_tier.includes("TIER 2") ? "badge-warning" : "badge-error"
                      }>
                        {scan.computed_metrics?.statutory_tier.split(" ")[0]}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!recent_scans || recent_scans.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-text-secondary">
                      No scans recorded for this employee.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
