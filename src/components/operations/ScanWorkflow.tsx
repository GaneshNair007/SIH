"use client";

/* eslint-disable @next/next/no-img-element -- camera and upload previews use transient blob/data URLs */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { PageHeader, StatusPill } from "@/components/operations/Primitives";
import { mockStore } from "@/lib/mockStore";
import { calculateDeltaE, deltaEToExposure } from "@/lib/colorimetry";
import { useDemoRevision } from "@/hooks/useDemoRevision";
import type { RgbColor } from "@/types/domain";

const STEPS = ["QR", "Resolve", "Action", "Location", "Photograph", "Sample A/B/C", "Analysis", "Review"];
const SAMPLE_LABELS = ["A · reactive", "B · sealed reference", "C · condition"];

type Action = "START" | "END";

function toRgb(value: unknown, fallback: RgbColor): RgbColor {
  if (value && typeof value === "object" && "r" in value && "g" in value && "b" in value) return value as RgbColor;
  return fallback;
}

export default function ScanWorkflow() {
  useDemoRevision();
  const [step, setStep] = useState(0);
  const [code, setCode] = useState("BND-1003");
  const [bandId, setBandId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [location, setLocation] = useState("AREA-COKER-01");
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [cameraState, setCameraState] = useState<"idle" | "active" | "denied" | "unavailable">("idle");
  const [sampled, setSampled] = useState<boolean[]>([false, false, false]);
  const [submitting, setSubmitting] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const band = bandId ? mockStore.getBandById(bandId) : undefined;
  const worker = band?.worker_id ? mockStore.getWorkerById(band.worker_id) : undefined;
  const activeShift = worker ? mockStore.getActiveShiftForWorker(worker.id) : undefined;
  const action: Action = activeShift ? "END" : "START";
  const startReading = activeShift ? mockStore.getReadings(worker?.id).find((reading) => reading.id === activeShift.start_reading_id) : undefined;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState((state) => state === "active" ? "idle" : state);
  };

  useEffect(() => () => stopCamera(), []);
  useEffect(() => { if (step !== 4) stopCamera(); }, [step]);

  const resolveBand = () => {
    setError("");
    const normalized = code.trim().toUpperCase();
    const match = mockStore.getBandById(normalized);
    if (!match) {
      setBandId(null);
      setError("Unknown band code. No worker or company details were exposed.");
      return;
    }
    if (!match.worker_id) {
      setBandId(match.id);
      setError("This registered band is not assigned. Issue it from the Bands page before starting a shift.");
      return;
    }
    if (!["ACTIVE", "WARNING"].includes(match.status || "")) {
      setBandId(match.id);
      setError(`Band status ${match.status || "UNKNOWN"} requires replacement or exception review; scanning cannot continue.`);
      return;
    }
    setBandId(match.id);
    setStep(1);
  };

  const startCamera = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unavailable");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("active");
    } catch {
      setCameraState("denied");
    }
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
    } catch {
      setError("Torch control is not supported by this camera. Use steady, diffuse lighting instead.");
    }
  };

  const captureCameraFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setFrameUrl(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  };

  const handleUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file from the camera or photo library.");
      return;
    }
    setFrameUrl(URL.createObjectURL(file));
    setError("");
  };

  const patchValues = useMemo(() => {
    const baselineA = { r: 235, g: 220, b: 185 };
    const baselineB = { r: 240, g: 225, b: 190 };
    const baselineC = { r: 178, g: 150, b: 72 };
    if (action === "START") return { a: baselineA, b: baselineB, c: baselineC };
    const b = toRgb(startReading?.patch_b_rgb, baselineB);
    const c = toRgb(startReading?.patch_c_rgb, baselineC);
    return { a: { r: 176, g: 132, b: 102 }, b, c };
  }, [action, startReading]);

  const analysis = useMemo(() => {
    const deltaE = calculateDeltaE(patchValues.a, patchValues.b);
    const estimate = deltaEToExposure(deltaE, mockStore.getCalibrationPoints());
    if (action === "START") return { deltaE, low: estimate.minPpmH, high: estimate.maxPpmH, label: "Current band cumulative estimate" };
    const startLow = startReading?.dose_low_ppm_h ?? 0;
    const startHigh = startReading?.dose_high_ppm_h ?? 0;
    return {
      deltaE,
      low: Math.max(0, estimate.minPpmH - startHigh),
      high: Math.max(0, estimate.maxPpmH - startLow),
      label: "Paired shift increment estimate",
    };
  }, [action, patchValues, startReading]);

  const save = () => {
    if (!band || !worker || submitting || savedId) return;
    setSubmitting(true);
    setError("");
    try {
      if (action === "START") {
        const result = mockStore.startShift({
          worker_id: worker.id,
          band_id: band.id,
          plant_id: worker.plant_id || "PLANT-NORTH",
          work_area_id: location,
          baseline_patch_a_rgb: patchValues.a,
          baseline_patch_b_rgb: patchValues.b,
          baseline_patch_c_rgb: patchValues.c,
          image_storage_path: "demo://device-local/start-frame",
        });
        setSavedId(result.shift.id);
      } else if (activeShift) {
        const result = mockStore.endShift({
          shift_id: activeShift.id,
          final_patch_a_rgb: patchValues.a,
          final_patch_b_rgb: patchValues.b,
          final_patch_c_rgb: patchValues.c,
          image_storage_path: "demo://device-local/end-frame",
        });
        setSavedId(result.reading.id);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The record could not be saved.");
    } finally {
      setSubmitting(false);
    }
  };

  const canContinue = [Boolean(band && worker && !error), Boolean(band && worker), Boolean(action), Boolean(location), Boolean(frameUrl), sampled.every(Boolean), true, true][step];

  return (
    <AppShell requiredRoles={["SHIFT_MANAGER", "ADMIN"]}>
      <PageHeader eyebrow="Guided capture" title="Scan band" description="Resolve identity first, capture only after an explicit camera action, and pair the end reading to its stored baseline." />

      <ol className="mb-6 flex gap-2 overflow-x-auto pb-2" aria-label="Scan progress">
        {STEPS.map((label, index) => <li key={label} className={`min-w-fit rounded-full px-3 py-1.5 text-xs ${index === step ? "bg-teal text-white" : index < step ? "bg-teal-pale text-teal" : "bg-canvas-subtle text-muted"}`} aria-current={index === step ? "step" : undefined}>{index + 1}. {label}</li>)}
      </ol>

      <div className="mx-auto max-w-3xl card-elevated">
        {step === 0 && <div><h2 className="text-heading-2 text-charcoal">Scan or enter the QR identity</h2><p className="mt-2 text-sm text-muted">Demo codes include BND-1003 for Start Shift and BND-1001 for End Shift. An unknown code reveals no record data.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="band-code">Band code</label><input id="band-code" className="input flex-1 uppercase" value={code} onChange={(event) => setCode(event.target.value)} autoCapitalize="characters"/><button className="btn-primary" onClick={resolveBand}>Resolve band</button></div></div>}

        {step === 1 && band && worker && <div><h2 className="text-heading-2 text-charcoal">Identity resolved</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-lg bg-canvas p-4"><p className="text-xs uppercase tracking-wider text-muted">Worker record</p><p className="mt-1 font-semibold text-charcoal">{worker.full_name}</p><p className="text-sm text-muted">{worker.worker_code} · {worker.department}</p></div><div className="rounded-lg bg-canvas p-4"><p className="text-xs uppercase tracking-wider text-muted">Band</p><p className="mt-1 font-semibold text-charcoal">{band.band_code}</p><div className="mt-2"><StatusPill value={band.status}/></div></div></div></div>}

        {step === 2 && band && <div><h2 className="text-heading-2 text-charcoal">Valid action</h2><div className="mt-5 rounded-lg border border-teal/30 bg-teal-pale p-5"><p className="text-xs font-semibold uppercase tracking-wider text-teal">{action === "START" ? "No active shift found" : "Active shift found"}</p><p className="mt-2 text-xl font-semibold text-charcoal">{action === "START" ? "Start Shift" : "End Shift"}</p><p className="mt-2 text-sm text-muted">{action === "START" ? "A formal baseline reading will be saved before wear." : `The final reading will pair to shift ${activeShift?.id}.`}</p></div></div>}

        {step === 3 && <div><h2 className="text-heading-2 text-charcoal">Actual work location</h2><p className="mt-2 text-sm text-muted">Choose the location for this shift record; the worker’s default is not silently reused.</p><label htmlFor="scan-location" className="label mt-5">Work area</label><select id="scan-location" className="input" value={location} onChange={(event) => setLocation(event.target.value)}><option value="AREA-COKER-01">North Plant · Coker 01</option><option value="AREA-COKER-02">North Plant · Coker 02</option><option value="AREA-SRU-01">North Plant · Sulfur Recovery 01</option><option value="AREA-ALK-01">South Plant · Alkylation 01</option><option value="AREA-TF-01">South Plant · Tank Farm 01</option></select></div>}

        {step === 4 && <div><h2 className="text-heading-2 text-charcoal">Photograph under controlled illumination</h2><p className="mt-2 text-sm text-muted">Camera permission is requested only when you choose Start rear camera. The stream stops after capture or when you leave this step.</p>{frameUrl ? <div className="mt-5"><img src={frameUrl} alt="Captured wristband frame preview" className="max-h-80 w-full rounded-lg border border-border object-contain"/><button className="btn-secondary mt-3" onClick={() => { setFrameUrl(null); setSampled([false, false, false]); }}>Retake</button></div> : <div className="mt-5"><video ref={videoRef} muted playsInline className={`max-h-80 w-full rounded-lg bg-charcoal ${cameraState === "active" ? "block" : "hidden"}`}/><div className="flex flex-wrap gap-3"><button className="btn-primary" onClick={startCamera}>Start rear camera</button>{cameraState === "active" && <><button className="btn-secondary" onClick={captureCameraFrame}>Capture frame</button><button className="btn-secondary" onClick={toggleTorch}>Turn on torch</button></>}<label className="btn-secondary cursor-pointer">Upload image<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => handleUpload(event.target.files?.[0])}/></label><button className="btn-ghost" onClick={() => setFrameUrl("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%23eef2ef'/%3E%3Ctext x='400' y='225' text-anchor='middle' font-family='Arial' font-size='28' fill='%230b6558'%3ESynthetic demo capture frame%3C/text%3E%3C/svg%3E")}>Use synthetic demo frame</button></div>{cameraState === "denied" && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Camera access was denied. Allow it in browser settings or use the upload fallback.</p>}{cameraState === "unavailable" && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Live camera is unavailable in this browser. Use the upload fallback.</p>}</div>}</div>}

        {step === 5 && frameUrl && <div><h2 className="text-heading-2 text-charcoal">Confirm patch sample areas</h2><p className="mt-2 text-sm text-muted">Zoom or retake if the patch surface is not clear. In this synthetic demo, tap each marked region to confirm A, B, and C.</p><div className="relative mt-5 overflow-hidden rounded-lg border border-border bg-canvas"><img src={frameUrl} alt="Wristband capture prepared for manual patch sampling" className="h-72 w-full object-contain"/><div className="absolute inset-x-0 bottom-4 flex justify-center gap-3">{SAMPLE_LABELS.map((label, index) => <button key={label} className={`rounded-md border px-3 py-2 text-xs font-semibold shadow-sm ${sampled[index] ? "border-teal bg-teal text-white" : "border-charcoal bg-white text-charcoal"}`} onClick={() => setSampled((values) => values.map((value, itemIndex) => itemIndex === index ? true : value))}>{sampled[index] ? "✓ " : ""}{label}</button>)}</div></div></div>}

        {step === 6 && <div><h2 className="text-heading-2 text-charcoal">Analysis preview</h2><p className="mt-2 text-sm text-muted">Quality checks passed for this synthetic frame. Production analysis must use the stored image, versioned algorithm, and eligible batch calibration.</p><div className="mt-5 grid gap-4 sm:grid-cols-3"><div className="rounded-lg bg-canvas p-4"><p className="text-xs text-muted">ΔE (CIE76)</p><p className="mt-1 text-2xl font-semibold text-charcoal">{analysis.deltaE.toFixed(2)}</p></div><div className="rounded-lg bg-canvas p-4 sm:col-span-2"><p className="text-xs text-muted">{analysis.label}</p><p className="mt-1 text-2xl font-semibold text-charcoal">{analysis.low.toFixed(2)}–{analysis.high.toFixed(2)} <span className="text-sm font-normal text-muted">ppm·h</span></p><p className="mt-1 text-xs text-amber-700">Synthetic calibration · demonstration only</p></div></div></div>}

        {step === 7 && band && worker && <div><h2 className="text-heading-2 text-charcoal">Review and save</h2><dl className="mt-5 grid gap-4 rounded-lg bg-canvas p-5 sm:grid-cols-2"><div><dt className="text-xs text-muted">Worker</dt><dd className="font-medium text-charcoal">{worker.full_name} ({worker.worker_code})</dd></div><div><dt className="text-xs text-muted">Action</dt><dd className="font-medium text-charcoal">{action === "START" ? "Start shift baseline" : "End shift paired reading"}</dd></div><div><dt className="text-xs text-muted">Work area</dt><dd className="font-medium text-charcoal">{location}</dd></div><div><dt className="text-xs text-muted">Calibration</dt><dd className="font-medium text-amber-700">Synthetic demo calibration</dd></div></dl>{savedId ? <div className="mt-5 rounded-lg border border-teal/30 bg-teal-pale p-4 text-sm text-teal"><strong>Saved once.</strong> Record {savedId} is now visible in worker and control-room history. <Link href={`/workers/${worker.id}`} className="underline">Open worker history</Link>.</div> : <button className="btn-primary mt-5" disabled={submitting} onClick={save}>{submitting ? "Saving…" : `Save ${action === "START" ? "start" : "end"} reading`}</button>}</div>}

        {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}

        <div className="mt-7 flex items-center justify-between border-t border-border pt-5"><button className="btn-ghost" disabled={step === 0 || Boolean(savedId)} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</button>{step < 7 && <button className="btn-primary" disabled={!canContinue} onClick={() => setStep((value) => Math.min(7, value + 1))}>Continue</button>}</div>
      </div>
    </AppShell>
  );
}
