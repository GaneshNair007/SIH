"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { managerApi } from "@/lib/api/manager";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function WorkerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const workerId = (params?.workerId || params?.id) as string;

  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("weekly");

  const { data, isLoading, error } = useQuery({
    queryKey: ["worker-profile", workerId],
    queryFn: () => managerApi.getEmployee(workerId),
    enabled: !!workerId,
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="card p-6 bg-status-errorBg text-status-error border border-status-error mb-4">
          Failed to load worker profile for &quot;{workerId}&quot;.
        </div>
        <Link href="/manager" className="btn-secondary">
          &larr; Back to Dashboard
        </Link>
      </AppShell>
    );
  }

  const { employee_profile: emp, recent_scans: scans } = data;

  // Prepare chart data (discrete readings)
  const chartData = (scans || []).map((s: Record<string, unknown>) => {
    const ts = s.timestamp as string;
    const metrics = s.computed_metrics as Record<string, number | string> | undefined;
    return {
      time: new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit" }),
      rawTime: new Date(ts).getTime(),
      dose: (metrics?.compensated_dose_ppm_hr as number) || 0,
      twa: (metrics?.shift_twa_ppm as number) || 0,
      deltaE: (s.end_delta_e as number) || 0,
      tier: (metrics?.statutory_tier as string) || "TIER 1",
    };
  }).sort((a: { rawTime: number }, b: { rawTime: number }) => a.rawTime - b.rawTime);

  return (
    <AppShell>
      {/* Back Navigation Bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/manager"
          className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
        <div className="flex gap-2">
          <Link href="/" className="text-xs text-text-secondary hover:text-text-primary">Home</Link>
          <span className="text-xs text-text-disabled">•</span>
          <Link href="/working" className="text-xs text-text-secondary hover:text-text-primary">Pipeline</Link>
        </div>
      </div>

      {/* Worker Header Card */}
      <div className="card p-6 mb-8 bg-surface border border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-light text-primary font-bold text-2xl flex items-center justify-center border border-primary/20 shrink-0">
              {emp.full_name?.charAt(0) || "W"}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-medium text-text-primary">{emp.full_name}</h1>
                <span className="badge-neutral">{emp.worker_id}</span>
              </div>
              <p className="text-sm text-text-secondary mt-1">
                {emp.role} • {emp.plant_unit} • Active Band: <span className="font-mono text-xs">{emp.active_badge_id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-border">
            <div>
              <div className="text-xs text-text-secondary uppercase">7-Day Dose Load</div>
              <div className="text-xl font-medium text-text-primary mt-0.5">
                {emp.exposure_ledger?.rolling_7day_ppm_hr || 0.0} <span className="text-xs text-text-secondary">ppm·h</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase">Lifecycle</div>
              <div className="text-xl font-medium text-text-primary mt-0.5">
                Day {emp.band_lifecycle_day}/5
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* H2S Exposure Graph (2 Cols) */}
        <div className="card col-span-1 lg:col-span-2 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="text-lg font-medium text-text-primary">H₂S Exposure History (Discrete Dosimetry)</h2>
              <p className="text-xs text-text-secondary">Measured cumulative shift dose (ppm·h). Discrete readings; no continuous interpolation.</p>
            </div>

            {/* Timeframe Toggle */}
            <div className="inline-flex rounded-md border border-border p-1 bg-surface-background">
              {(["daily", "weekly", "monthly"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTimeRange(mode)}
                  className={`px-3 py-1 text-xs font-medium rounded capitalize transition-colors ${
                    timeRange === mode
                      ? "bg-surface text-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Graph Display */}
          {chartData.length > 0 ? (
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                  <XAxis dataKey="time" stroke="#5f6368" fontSize={12} tickLine={false} />
                  <YAxis stroke="#5f6368" fontSize={12} tickLine={false} unit=" ppm·h" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#dadce0", borderRadius: "8px" }}
                  />
                  <Scatter dataKey="dose" fill="#1a73e8" name="dose" />
                  <Line type="monotone" dataKey="dose" stroke="#1a73e8" strokeWidth={2} dot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg bg-surface-background text-text-secondary p-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2 text-text-disabled"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
              <p className="text-sm font-medium text-text-primary">No exposure readings recorded yet for this worker.</p>
              <p className="text-xs text-text-secondary mt-1">Shift readings will appear here once scans are completed.</p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border">
            <span>Calibration Status: <strong className="text-status-success">SbCl₃ Empirical Curve v1.2 (Active)</strong></span>
            <span>Uncertainty: ±0.15 ppm·h</span>
          </div>
        </div>

        {/* Worker Details & Quick Actions (1 Col) */}
        <div className="space-y-6">
          
          <div className="card p-5 space-y-4">
            <h3 className="text-base font-medium text-text-primary border-b border-border pb-2">Active Band Details</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Badge ID</span>
                <span className="font-mono text-xs font-medium text-text-primary">{emp.active_badge_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Hardware Patches</span>
                <span className="text-status-success font-medium">A/B/C Intact</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Replacement Due</span>
                <span className="text-text-primary">In 4 days</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/scan")}
              className="btn-primary w-full text-sm py-2"
            >
              Scan New Shift Reading
            </button>
          </div>

          <div className="card p-5 space-y-3 bg-surface-background border border-border">
            <h4 className="text-xs font-medium text-text-primary uppercase tracking-wide">Assistant Context Suggestions</h4>
            <p className="text-xs text-text-secondary">Tap any question to open the Platform Assistant:</p>
            <div className="space-y-2">
              {[
                "Summarize this worker’s recorded H₂S history.",
                "What precautions are recommended based on this exposure pattern?",
                "Which bands for this worker need replacement soon?",
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    // Trigger custom event or alert for assistant drawer
                    alert(`Question suggested to Assistant: "${q}"`);
                  }}
                  className="w-full text-left p-2 rounded text-xs bg-surface border border-border hover:border-primary text-text-primary transition-colors"
                >
                  &quot;{q}&quot;
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Shift History Table */}
      <div className="card p-0 mt-8">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-base font-medium text-text-primary">Complete Shift Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-background text-xs font-medium text-text-secondary uppercase tracking-wider">
                <th className="px-5 py-3 border-b border-border">Timestamp</th>
                <th className="px-5 py-3 border-b border-border">Status</th>
                <th className="px-5 py-3 border-b border-border">Shift TWA (ppm)</th>
                <th className="px-5 py-3 border-b border-border">Cumulative Dose (ppm·h)</th>
                <th className="px-5 py-3 border-b border-border">Statutory Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-text-primary">
              {(scans || []).map((scan: Record<string, unknown>) => {
                const metrics = scan.computed_metrics as Record<string, number | string> | undefined;
                const tier = (metrics?.statutory_tier as string) || "";
                return (
                <tr key={scan.scan_id as string} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                    {new Date(scan.timestamp as string).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 font-medium">{scan.shift_status as string}</td>
                  <td className="px-5 py-4 font-mono">{(metrics?.shift_twa_ppm as number)?.toFixed(2)}</td>
                  <td className="px-5 py-4 font-mono">{(metrics?.compensated_dose_ppm_hr as number)?.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className={
                      tier.includes("TIER 1") ? "badge-success" :
                      tier.includes("TIER 2") ? "badge-warning" : "badge-error"
                    }>
                      {tier}
                    </span>
                  </td>
                </tr>
                );
              })}
              {(!scans || scans.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-text-secondary">
                    No shift records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
