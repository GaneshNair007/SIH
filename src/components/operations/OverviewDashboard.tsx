"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AppShell from "@/components/layout/AppShell";
import { PageHeader, RecordLink, StatCard, StatusPill } from "@/components/operations/Primitives";
import { mockStore } from "@/lib/mockStore";
import { useDemoRevision } from "@/hooks/useDemoRevision";
import type { UserRole } from "@/types/domain";

type OverviewRole = "manager" | "control-room";

const compactDate = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
const compactTime = (value: string) => new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function OverviewDashboard({ role }: { role: OverviewRole }) {
  useDemoRevision();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("ALL");

  const workers = mockStore.getWorkers();
  const bands = mockStore.getBands();
  const shifts = mockStore.getShifts();
  const readings = mockStore.getReadings();
  const alerts = mockStore.getAlerts();
  const exposures = mockStore.getExposureDaily();

  const departments = useMemo(() => Array.from(new Set(workers.map((worker) => worker.department || "Unassigned"))).sort(), [workers]);
  const visibleWorkers = useMemo(() => workers.filter((worker) => {
    const matchesDepartment = department === "ALL" || (worker.department || "Unassigned") === department;
    const haystack = `${worker.full_name} ${worker.worker_code} ${worker.department || ""}`.toLowerCase();
    return matchesDepartment && haystack.includes(query.toLowerCase());
  }), [department, query, workers]);
  const workerIds = useMemo(() => new Set(visibleWorkers.map((worker) => worker.id)), [visibleWorkers]);
  const visibleExposures = exposures.filter((row) => workerIds.has(row.worker_id));
  const visibleBands = bands.filter((band) => !band.worker_id || workerIds.has(band.worker_id));
  const visibleShifts = shifts.filter((shift) => workerIds.has(shift.worker_id));
  const visibleReadings = readings.filter((reading) => workerIds.has(reading.worker_id));
  const visibleAlerts = alerts.filter((alert) => !alert.worker_id || workerIds.has(alert.worker_id));

  const trend = useMemo(() => {
    const byDate = new Map<string, { date: string; low: number; high: number; samples: number }>();
    for (const row of visibleExposures) {
      const entry = byDate.get(row.date) || { date: row.date, low: 0, high: 0, samples: 0 };
      entry.low += row.exposure_low_ppm_h || 0;
      entry.high += row.exposure_high_ppm_h || 0;
      entry.samples += row.reading_count || 0;
      byDate.set(row.date, entry);
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-10).map((row) => ({ ...row, label: compactDate(row.date), low: Number(row.low.toFixed(1)), high: Number(row.high.toFixed(1)) }));
  }, [visibleExposures]);

  const areaComparison = useMemo(() => {
    const byArea = new Map<string, { area: string; value: number; samples: number }>();
    for (const row of visibleExposures) {
      const worker = workers.find((item) => item.id === row.worker_id);
      const area = worker?.default_work_area_id || "Unassigned";
      const entry = byArea.get(area) || { area, value: 0, samples: 0 };
      entry.value += row.exposure_high_ppm_h || 0;
      entry.samples += row.reading_count || 0;
      byArea.set(area, entry);
    }
    return Array.from(byArea.values()).sort((a, b) => b.value - a.value).slice(0, 6).map((entry) => ({ ...entry, value: Number(entry.value.toFixed(1)) }));
  }, [visibleExposures, workers]);

  const activeShifts = visibleShifts.filter((shift) => shift.status === "ACTIVE");
  const activeBands = visibleBands.filter((band) => ["ACTIVE", "WARNING"].includes(band.status || ""));
  const openAlerts = visibleAlerts.filter((alert) => alert.status === "OPEN");
  const requiredRoles: UserRole[] = role === "manager" ? ["SHIFT_MANAGER", "ADMIN"] : ["CONTROL_ROOM_MANAGER", "ADMIN"];

  return (
    <AppShell requiredRoles={requiredRoles}>
      <PageHeader
        eyebrow={role === "manager" ? "Shift operations" : "Recorded exposure overview"}
        title={role === "manager" ? "Run today’s band workflow" : "Control room overview"}
        description={role === "manager"
          ? "Start with a band scan, pair start and end readings, and keep every exception visible."
          : "Review timestamped demo records across workers and work areas. The charts connect photographs; they are not a continuous concentration trace."}
        action={role === "manager" ? { href: "/manager/scan", label: "Scan band" } : undefined}
      />

      {role === "control-room" && (
        <div className="card mb-5 grid gap-3 sm:grid-cols-[1fr_220px_auto]">
          <label className="sr-only" htmlFor="overview-search">Search workers</label>
          <input id="overview-search" className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search worker, code, or department" />
          <label className="sr-only" htmlFor="overview-department">Filter department</label>
          <select id="overview-department" className="input" value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="ALL">All departments</option>
            {departments.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="btn-secondary" onClick={() => { setQuery(""); setDepartment("ALL"); }}>Reset filters</button>
        </div>
      )}

      <div className={`grid gap-4 ${role === "manager" ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 xl:grid-cols-5"}`}>
        <StatCard label="Workers" value={visibleWorkers.length} note="Company-scoped records" />
        <StatCard label="Active shifts" value={activeShifts.length} note="Paired start reading present" />
        <StatCard label="Active bands" value={activeBands.length} note="Includes lifecycle warnings" />
        <StatCard label="Readings" value={visibleReadings.length} note="Timestamped demo photographs" tone="neutral" />
        {role === "control-room" && <StatCard label="Open alerts" value={openAlerts.length} note="Acknowledgement required" tone={openAlerts.length ? "red" : "teal"} />}
      </div>

      {role === "manager" && (
        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <Link href="/manager/scan" className="card-hover font-medium text-charcoal">Scan a band <span className="float-right text-teal">→</span></Link>
          <Link href="/manager/workers/new" className="card-hover font-medium text-charcoal">Register worker <span className="float-right text-teal">→</span></Link>
          <Link href="/manager/workers" className="card-hover font-medium text-charcoal">Search workers <span className="float-right text-teal">→</span></Link>
          <Link href="/manager/bands" className="card-hover font-medium text-charcoal">Issue or replace band <span className="float-right text-teal">→</span></Link>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section className="card min-w-0" aria-labelledby="trend-title">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div><h2 id="trend-title" className="text-heading-3 text-charcoal">Recorded exposure history</h2><p className="mt-1 text-xs text-muted">Synthetic ppm·h ranges · gaps are preserved · sample count in tooltip</p></div>
            <span className="badge-neutral">Latest received {readings[0]?.captured_at ? compactTime(readings[0].captured_at) : "—"}</span>
          </div>
          <div className="h-72 w-full" role="img" aria-label="Area chart of synthetic recorded exposure ranges by measurement date">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                <defs><linearGradient id="h2s-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0B6558" stopOpacity={0.28}/><stop offset="100%" stopColor="#0B6558" stopOpacity={0.02}/></linearGradient></defs>
                <CartesianGrid stroke="#E4E9E5" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#8A9690"/><YAxis tick={{ fontSize: 11 }} stroke="#8A9690" unit=""/>
                <Tooltip formatter={(value, name) => [`${value} ppm·h`, name === "high" ? "Upper estimate" : "Lower estimate"]}/>
                <Area type="monotone" dataKey="high" stroke="#0B6558" fill="url(#h2s-area)" strokeWidth={2} connectNulls={false}/>
                <Area type="monotone" dataKey="low" stroke="#78A99F" fill="transparent" strokeWidth={1.5} connectNulls={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card min-w-0" aria-labelledby="area-title">
          <h2 id="area-title" className="text-heading-3 text-charcoal">Work-area comparison</h2>
          <p className="mt-1 text-xs text-muted">Recorded patterns only; not inferred hotspots</p>
          <div className="mt-4 h-72" role="img" aria-label="Bar chart comparing synthetic recorded exposure by work area">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={areaComparison} layout="vertical" margin={{ left: 20, right: 8 }}><CartesianGrid stroke="#E4E9E5" horizontal={false}/><XAxis type="number" tick={{ fontSize: 10 }}/><YAxis dataKey="area" type="category" width={96} tick={{ fontSize: 10 }}/><Tooltip formatter={(value) => [`${value} ppm·h`, "Upper estimate total"]}/><Bar dataKey="value" fill="#0B6558" radius={[0, 4, 4, 0]}/></BarChart></ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="card overflow-hidden p-0" aria-labelledby="workers-title">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 id="workers-title" className="text-heading-3 text-charcoal">Workers</h2><p className="text-xs text-muted">Showing {Math.min(visibleWorkers.length, 8)} of {visibleWorkers.length}</p></div><Link className="text-sm font-medium text-teal" href={role === "manager" ? "/manager/workers" : "/control-room/workers"}>View all</Link></div>
          <div className="overflow-x-auto"><table className="data-table min-w-[660px]"><thead><tr><th>Worker</th><th>Department</th><th>Band</th><th>Shift</th><th>History</th></tr></thead><tbody>{visibleWorkers.slice(0, 8).map((worker) => { const band = bands.find((item) => item.worker_id === worker.id && ["ACTIVE", "WARNING"].includes(item.status || "")); const shift = shifts.find((item) => item.worker_id === worker.id && item.status === "ACTIVE"); return <tr key={worker.id}><td><RecordLink href={`/workers/${worker.id}`}>{worker.full_name}</RecordLink><div className="text-xs text-muted">{worker.worker_code}</div></td><td>{worker.department || "—"}</td><td>{band ? <StatusPill value={band.status}/> : <span className="text-muted">—</span>}</td><td>{shift ? <StatusPill value={shift.status}/> : <span className="text-muted">No active shift</span>}</td><td><RecordLink href={`/workers/${worker.id}`}>Open history</RecordLink></td></tr>; })}</tbody></table></div>
        </section>

        <section className="card" aria-labelledby="alerts-title">
          <div className="mb-4 flex items-center justify-between"><h2 id="alerts-title" className="text-heading-3 text-charcoal">Open alerts</h2><Link href={role === "manager" ? "/manager/shifts" : "/control-room/alerts"} className="text-sm text-teal">Review all</Link></div>
          <div className="space-y-3">{openAlerts.slice(0, 4).map((alert) => <Link key={alert.id} href="/control-room/alerts" className="block rounded-lg border border-border p-3 hover:border-border-strong"><div className="flex items-center justify-between gap-2"><StatusPill value={alert.severity}/><span className="text-[11px] text-muted">{compactTime(alert.created_at || new Date().toISOString())}</span></div><p className="mt-2 line-clamp-2 text-sm text-charcoal">{alert.message}</p></Link>)}{openAlerts.length === 0 && <p className="text-sm text-muted">No open alerts in the current filter.</p>}</div>
        </section>
      </div>
    </AppShell>
  );
}

