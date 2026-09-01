# Requirement-to-route checklist

## Public experience

- `/` — project introduction, problem/hardware/software/operations explanation, limitation, platform access, and supplied team details.
- `/working` — Flowchart, Images, Chemistry, and Comparison tabs with query-string state and keyboard access.
- `/pipeline` — redirect to `/working`.
- `/login` — production sign-in when Supabase is configured plus a visibly separate synthetic demo entry for the three documented staff roles.

## Shift Manager

- `/manager` — scan-first overview with active shifts, alerts, readings, and quick actions.
- `/manager/scan` — QR/identity, action, location, capture, patch sampling, analysis, and review/save workflow.
- `/manager/workers`, `/manager/workers/new`, `/manager/workers/[workerId]` — roster, registration, and history.
- `/manager/bands` — issue, replacement, lifecycle, and history.
- `/manager/shifts`, `/manager/shifts/[shiftId]`, `/manager/reading/[readingId]` — operational records and paired-reading details.

## Control Room

- `/control-room` — company-wide overview.
- `/control-room/workers`, `/control-room/workers/[workerId]` — filtered roster and worker history.
- `/control-room/regions`, `/control-room/regions/[regionId]` — recorded work-area patterns with non-hotspot wording.
- `/control-room/bands`, `/control-room/bands/[bandId]` — lifecycle and ownership details.
- `/control-room/shifts`, `/control-room/analytics`, `/control-room/alerts`, `/control-room/reports` — records, charts, acknowledgement, and real CSV export.

## Administration

- `/admin`, `/admin/users`, `/admin/company`, `/admin/locations`, `/admin/calibration`, `/admin/thresholds`, `/admin/audit` — protected configuration surfaces. Prototype-only configuration is labeled and mutations remain unavailable until production persistence is connected.

## Cross-cutting behavior

- Direct URLs are protected by role-aware guards.
- Demo state is deterministic, synthetic, device-local, resettable, and isolated from production authentication.
- The assistant is read-only Guided Help unless a model is configured.
- Invalid readings never appear as zero or safe; timestamps, units, confidence, calibration status, and stale/offline state are explicit.

