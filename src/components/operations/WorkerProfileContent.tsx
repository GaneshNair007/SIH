"use client";

import { EmptyState, PageHeader, RecordLink, StatCard, StatusPill } from "@/components/operations/Primitives";
import { mockStore } from "@/lib/mockStore";
import { useDemoRevision } from "@/hooks/useDemoRevision";

export default function WorkerProfileContent({ workerId }: { workerId: string }) {
  useDemoRevision();
  const worker = mockStore.getWorkerById(workerId);
  if (!worker) return <EmptyState title="Worker not found" detail="The record may be outside your company scope or the identifier is invalid." />;

  const exposures = mockStore.getExposureDaily(worker.id);
  const summary = mockStore.getWorkerExposure(worker.id);
  const bands = mockStore.getBands().filter((band) => band.worker_id === worker.id);
  const shifts = mockStore.getShifts().filter((shift) => shift.worker_id === worker.id);
  const readings = mockStore.getReadings(worker.id);
  const alerts = mockStore.getAlerts().filter((alert) => alert.worker_id === worker.id);

  return (
    <>
      <PageHeader eyebrow="Worker record" title={worker.full_name} description={`${worker.worker_code} · ${worker.department || "Department not set"} · ${worker.designation || "Designation not set"}`} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4"><StatCard label="Today" value={`${summary.today_low}–${summary.today_high}`} note="Synthetic ppm·h · valid increments only"/><StatCard label="7-day" value={`${summary.week_low}–${summary.week_high}`} note="Non-overlapping shift increments"/><StatCard label="30-day" value={`${summary.month_low}–${summary.month_high}`} note="Gaps remain visible"/><StatCard label="Open alerts" value={alerts.filter((alert) => alert.status === "OPEN").length} note="Supervisor review records" tone="amber"/></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card"><h2 className="text-heading-3 text-charcoal">Daily history</h2><p className="mt-1 text-xs text-muted">Synthetic dose ranges appear only because demo calibration is active.</p><div className="mt-4 overflow-x-auto"><table className="data-table min-w-[520px]"><thead><tr><th>Date</th><th>Range</th><th>Shifts</th><th>Readings</th></tr></thead><tbody>{exposures.slice(0, 12).map((row) => <tr key={row.id}><td>{row.date}</td><td>{row.exposure_low_ppm_h}–{row.exposure_high_ppm_h} ppm·h</td><td>{row.shift_count}</td><td>{row.reading_count}</td></tr>)}</tbody></table></div></section>
        <section className="card"><h2 className="text-heading-3 text-charcoal">Band history</h2><div className="mt-4 space-y-3">{bands.map((band) => <div key={band.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"><div><p className="font-medium text-charcoal">{band.band_code}</p><p className="text-xs text-muted">{band.working_day_count || 0}/5 working days · {band.retirement_reason || "No retirement reason"}</p></div><StatusPill value={band.status}/></div>)}{!bands.length && <p className="text-sm text-muted">No band history.</p>}</div></section>
      </div>
      <section className="card mt-6 overflow-hidden p-0"><div className="border-b border-border px-5 py-4"><h2 className="text-heading-3 text-charcoal">Shifts and paired readings</h2></div><div className="overflow-x-auto"><table className="data-table min-w-[760px]"><thead><tr><th>Started</th><th>Status</th><th>Work area</th><th>Shift increment</th><th>Confidence</th><th>Readings</th></tr></thead><tbody>{shifts.slice(0, 15).map((shift) => <tr key={shift.id}><td>{new Date(shift.started_at || shift.created_at || "").toLocaleString("en-IN")}</td><td><StatusPill value={shift.status}/></td><td>{shift.work_area_id || "—"}</td><td>{shift.confidence === "INVALID" ? <span className="font-medium text-red-700">Invalid — not zero</span> : shift.exposure_low == null ? "Pending end reading" : `${shift.exposure_low}–${shift.exposure_high} ppm·h`}</td><td><StatusPill value={shift.confidence || "PENDING"}/></td><td><RecordLink href={`/manager/shifts/${shift.id}`}>Open record</RecordLink></td></tr>)}</tbody></table></div></section>
      <section className="card mt-6"><h2 className="text-heading-3 text-charcoal">Reading audit trail</h2><div className="mt-4 overflow-x-auto"><table className="data-table min-w-[760px]"><thead><tr><th>Timestamp</th><th>Type</th><th>ΔE</th><th>Cumulative estimate</th><th>Calibration</th><th>Confidence</th></tr></thead><tbody>{readings.slice(0, 20).map((reading) => <tr key={reading.id}><td>{new Date(reading.captured_at || reading.created_at || "").toLocaleString("en-IN")}</td><td>{reading.reading_type}</td><td>{reading.delta_e ?? "—"}</td><td>{reading.confidence === "INVALID" ? "Invalid — review reasons" : reading.calibration_version_id ? `${reading.dose_low_ppm_h}–${reading.dose_high_ppm_h} ppm·h` : "Dose calibration unavailable"}</td><td>{reading.calibration_version_id ? "Synthetic demo" : "Unavailable"}</td><td><StatusPill value={reading.confidence}/></td></tr>)}</tbody></table></div></section>
    </>
  );
}

