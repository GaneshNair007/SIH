"use client";

import AppShell from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { RecentScan } from "@/lib/api/manager";

export default function HistoryPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState<RecentScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const { data } = await apiClient.get(`/manager/employees/${user.employee_id}`);
        setScans(data.shift_history || []);
      } catch (e: unknown) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-text-primary">My Exposure History</h1>
        <p className="text-sm text-text-secondary mt-1">Your longitudinal dosimetry records</p>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
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
              {scans.map((scan) => (
                <tr key={scan.scan_id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-text-secondary">
                    {new Date(scan.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">{scan.shift_status}</td>
                  <td className="px-5 py-4">{scan.computed_metrics?.shift_twa_ppm.toFixed(2)}</td>
                  <td className="px-5 py-4">{scan.computed_metrics?.compensated_dose_ppm_hr.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className={
                      scan.computed_metrics?.statutory_tier.includes("TIER 1") ? "badge-success" :
                      scan.computed_metrics?.statutory_tier.includes("TIER 2") ? "badge-warning" : "badge-error"
                    }>
                      {scan.computed_metrics?.statutory_tier.split(" ")[0]}
                    </span>
                  </td>
                </tr>
              ))}
              {scans.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-text-secondary">
                    No scans recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
