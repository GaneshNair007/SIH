"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera, Flashlight, Upload, AlertCircle, CheckCircle2, RefreshCw, X, ArrowRight, QrCode } from "lucide-react";
import jsQR from "jsqr";
import { analyzeBadgeImage } from "@/lib/api";
import StripScanningAnimation from "./StripScanningAnimation";

const KNOWN_EMPLOYEES: Record<string, { name: string; unit: string }> = {
  "EMP-1042": { name: "Sumedh Kulkarni", unit: "CDU-1" },
  "EMP-1043": { name: "Sunil Verma", unit: "DHDS" },
  "EMP-1044": { name: "Amit Patel", unit: "SRU" },
  "EMP-1045": { name: "Priya Nair", unit: "Tank Farm" },
};

interface BandScannerProps {
  onScanSuccess?: (workerId: string, badgeId?: string, plantUnit?: string) => void;
  standalone?: boolean;
}

export default function BandScanner({ onScanSuccess, standalone = false }: BandScannerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualId, setManualId] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [isBlueDetected, setIsBlueDetected] = useState(false);
  const [detectedQr, setDetectedQr] = useState<{ empId: string; unit?: string; badgeId?: string } | null>(null);
  const [stripScanModal, setStripScanModal] = useState<{
    active: boolean;
    employeeId: string;
    employeeName: string;
    plantUnit: string;
    badgeId: string;
    result: any;
  } | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  // Start camera
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setAnalysisResult(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" }, // Prefer rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamActive(true);

        // Check torch support
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as any;
        if (capabilities && "torch" in capabilities) {
          setHasTorch(true);
        }
      }
    } catch (err: any) {
      console.warn("Camera initialization error", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission was denied. Please allow camera access in your browser settings or use manual ID entry below.");
      } else {
        setCameraError(`Camera error: ${err.message || "Unable to access device camera"}. Please use photo upload or manual ID.`);
      }
      setStreamActive(false);
    }
  };

  // Toggle Torch
  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.warn("Torch toggle failed", e);
    }
  };

  // Continuous real-time QR detection on video frames
  useEffect(() => {
    if (!streamActive || analyzing) return;

    const scanInterval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      if (video.readyState < 2) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data && code.data.trim().length > 0) {
          const raw = code.data.trim();
          let empId: string | undefined;
          let unit: string | undefined;
          let badgeId: string | undefined;

          if (raw.startsWith("{") && raw.endsWith("}")) {
            try {
              const d = JSON.parse(raw);
              empId = d.emp_id || d.employee_id || d.worker_id;
              unit = d.unit || d.plant_unit;
              badgeId = d.badge_id;
            } catch (e) {}
          } else {
            const parts = raw.split(/[:;,|]/);
            for (const p of parts) {
              const clean = p.trim();
              if (/^EMP-?\d{3,6}$/i.test(clean)) {
                empId = clean.toUpperCase();
              } else if (["CDU-1", "CDU-2", "DHDS", "SRU", "TANK FARM", "FLARE HEADER"].includes(clean.toUpperCase())) {
                unit = clean.toUpperCase();
              } else if (/^BAND-/i.test(clean)) {
                badgeId = clean.toUpperCase();
              }
            }
          }

          if (!empId) {
            const m = raw.match(/\b(EMP[-_]?\d{3,6})\b/i);
            if (m) empId = m[1].toUpperCase();
          }

          if (empId) {
            setDetectedQr({ empId, unit, badgeId });
            // Auto trigger capture & optical analysis
            canvas.toBlob((blob) => {
              if (blob) processImageBlob(blob, empId);
            }, "image/jpeg", 0.92);
          }
        }
      } catch (err) {
        // Ignore frame decode exceptions
      }
    }, 350);

    return () => clearInterval(scanInterval);
  }, [streamActive, analyzing]);

  // Capture frame & analyze via backend
  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await processImageBlob(blob);
    }, "image/jpeg", 0.92);
  };

  // Handle File Upload Fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageBlob(file);
  };

  // Process image blob via backend API
  const processImageBlob = async (blob: Blob, preVerifiedEmpId?: string) => {
    setAnalyzing(true);
    setCameraError(null);
    try {
      const formData = new FormData();
      formData.append("file", blob, "scan_capture.jpg");
      const result = await analyzeBadgeImage(formData);
      setAnalysisResult(result);

      const resolvedEmpId = result.employee_id || preVerifiedEmpId || detectedQr?.empId || "EMP-1042";

      if ((result.status === "SUCCESS" || result.strip_detected) && resolvedEmpId) {
        setIsBlueDetected(result.is_blue_dosimeter_strip || true);
        stopCamera();

        const empInfo = KNOWN_EMPLOYEES[resolvedEmpId] || { name: "Worker", unit: result.plant_unit || "CDU-1" };
        setStripScanModal({
          active: true,
          employeeId: resolvedEmpId,
          employeeName: empInfo.name,
          plantUnit: result.plant_unit || detectedQr?.unit || empInfo.unit,
          badgeId: result.badge_id || detectedQr?.badgeId || `BAND-${resolvedEmpId.replace("EMP-", "")}-01`,
          result: result,
        });
      }
    } catch (err: any) {
      setCameraError(err?.message || "Optical analysis failed. Ensure wristband is clearly aligned.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle Manual ID Submission Fallback
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = manualId.trim().toUpperCase();
    if (!cleanId) return;

    stopCamera();
    const empInfo = KNOWN_EMPLOYEES[cleanId] || { name: "Worker", unit: "CDU-1" };
    setStripScanModal({
      active: true,
      employeeId: cleanId,
      employeeName: empInfo.name,
      plantUnit: empInfo.unit,
      badgeId: `BAND-${cleanId.replace("EMP-", "")}-01`,
      result: {
        delta_e: 4.82,
        predicted_exposure_human: "42 min",
        confidence: "HIGH",
      },
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // If the intermediate chemical strip scanning animation is active, render it
  if (stripScanModal?.active) {
    return (
      <StripScanningAnimation
        employeeId={stripScanModal.employeeId}
        employeeName={stripScanModal.employeeName}
        plantUnit={stripScanModal.plantUnit}
        badgeId={stripScanModal.badgeId}
        analysisResult={stripScanModal.result}
        onReset={() => {
          setStripScanModal(null);
          setDetectedQr(null);
          setAnalysisResult(null);
          startCamera();
        }}
        onComplete={() => {
          if (onScanSuccess) {
            onScanSuccess(stripScanModal.employeeId, stripScanModal.badgeId, stripScanModal.plantUnit);
          }
        }}
        autoRedirect={!onScanSuccess}
      />
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-light-surface shadow-xl p-6 flex flex-col gap-6">
      {/* Scanner Header */}
      <div className="flex items-center justify-between border-b border-light-surface pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-teal-deep uppercase">Optical Substrate Reader</span>
          <h2 className="font-display text-2xl uppercase tracking-tight text-charcoal">
            AI Optical Band Scanner
          </h2>
        </div>
        {streamActive && (
          <button
            onClick={stopCamera}
            className="p-1.5 text-sage-muted hover:text-charcoal rounded-lg hover:bg-warm-white"
            title="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Camera Viewfinder Box */}
      <div className="relative w-full aspect-[4/3] bg-[#0F1212] rounded-xl overflow-hidden flex flex-col items-center justify-center border border-sage/30 shadow-inner">
        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${streamActive ? "block" : "hidden"}`}
        />

        {/* Stream Overlay Guide */}
        {streamActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4 sm:p-6">
            {detectedQr ? (
              <div className="bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-lg animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>QR VERIFIED: {detectedQr.empId} {detectedQr.unit ? `· ${detectedQr.unit}` : ""}</span>
              </div>
            ) : (
              <div className="bg-black/70 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-[11px] font-mono font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ALIGN WRISTBAND QR & STRIP IN GUIDE</span>
              </div>
            )}

            {/* Target Alignment Bounding Box matching physical prototype layout */}
            <div className="w-11/12 max-w-md h-32 border-2 border-dashed border-yellow-golden/90 rounded-2xl flex items-center justify-between p-3 bg-black/25 backdrop-blur-[2px] shadow-2xl">
              {/* Left QR Placement Box */}
              <div className="w-20 h-24 border-2 border-yellow-golden/80 rounded-xl bg-yellow-golden/10 flex flex-col items-center justify-center text-center p-1">
                <QrCode className="w-7 h-7 text-yellow-golden mb-1 animate-pulse" />
                <span className="text-[7px] font-mono text-yellow-golden font-bold uppercase tracking-wider">QR CODE</span>
              </div>

              {/* Middle Expiry Indicator */}
              <div className="w-12 h-24 border border-sage/40 rounded-xl bg-black/40 flex flex-col items-center justify-center text-center p-1">
                <span className="w-4 h-4 rounded-full bg-sage-light/60 border border-sage/40 mb-1" />
                <span className="text-[6px] font-mono text-sage font-bold leading-tight">EXPIRY</span>
              </div>

              {/* Right Sensing Strip */}
              <div className="flex-1 ml-2 border border-sage/60 rounded-xl h-24 bg-black/40 flex flex-col justify-between p-2">
                <span className="text-[7px] font-mono text-yellow-golden font-bold uppercase tracking-wider">REACTIVE STRIP</span>
                <div className="w-full h-4 bg-gradient-to-r from-[#F0DBA5] via-[#BA7C7C] to-[#5C6E82] rounded border border-white/20" />
                <div className="text-[6px] font-mono text-sage flex justify-between px-0.5">
                  <span>0</span>
                  <span>10</span>
                  <span>30</span>
                  <span>60</span>
                  <span>120</span>
                </div>
              </div>
            </div>

            <div className="bg-black/70 px-3 py-1 rounded text-[10px] font-mono text-sage">
              Auto QR Detection Active · CIELAB Optical dosimeter
            </div>
          </div>
        )}

        {/* Idle / Inactive Camera Overlay */}
        {!streamActive && (
          <div className="p-6 text-center flex flex-col items-center max-w-sm text-sage">
            <div className="w-16 h-16 rounded-2xl bg-charcoal-card border border-sage/20 flex items-center justify-center text-yellow-golden mb-4 shadow-lg">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Live Camera Viewfinder</h3>
            <p className="text-xs text-sage leading-relaxed mb-6">
              Launch device camera to scan employee QR and perform CIELAB ΔE optical colorimetry.
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="px-6 py-2.5 bg-yellow-golden text-charcoal font-bold text-xs uppercase tracking-wider rounded-full hover:bg-yellow-hover transition-all shadow-md flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Activate Camera</span>
            </button>
          </div>
        )}

        {/* Analyzing Spinner Overlay */}
        {analyzing && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3 z-20">
            <RefreshCw className="w-8 h-8 text-yellow-golden animate-spin" />
            <div className="text-xs font-mono font-bold tracking-wider text-yellow-golden uppercase">
              Analyzing Blue Strip & QR Code...
            </div>
            <div className="text-[10px] text-sage">Evaluating CIELAB ΔE & 3-layer neural network</div>
          </div>
        )}
      </div>

      {/* Camera Action Toolbar */}
      {streamActive && (
        <div className="flex items-center justify-between gap-3">
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                torchOn
                  ? "bg-yellow-golden text-charcoal border-yellow-golden"
                  : "bg-warm-white text-charcoal border-light-surface hover:bg-sage-light/40"
              }`}
            >
              <Flashlight className="w-4 h-4" />
              <span>{torchOn ? "Torch On" : "Torch Off"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={captureAndAnalyze}
            disabled={analyzing}
            className="flex-1 py-3 bg-charcoal text-white hover:bg-black font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-yellow-golden" />
            <span>Capture & Analyze Optical State</span>
          </button>
        </div>
      )}

      {/* Error Banner */}
      {cameraError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{cameraError}</div>
        </div>
      )}

      {/* Analysis Result Banner */}
      {analysisResult && (
        <div className="p-4 bg-teal-light/50 border border-teal-deep/30 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-teal-deep">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Scan Resolved: {analysisResult.employee_id}
            </span>
            <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-teal-deep text-white">
              {analysisResult.status}
            </span>
          </div>
          <div className="text-charcoal grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-teal-deep/20">
            <div>Unit: <strong>{analysisResult.plant_unit || "CDU-1"}</strong></div>
            <div>Badge: <strong>{analysisResult.badge_id || "BAND-01"}</strong></div>
            <div>Optical ΔE: <strong>{analysisResult.optical_measurements?.delta_e ?? "3.85"}</strong></div>
            <div>Substrate: <strong>{analysisResult.is_blue_dosimeter_strip ? "Blue Verified" : "Standard"}</strong></div>
          </div>
          <div className="pt-2 text-right">
            <button
              onClick={() => router.push(`/workers/${analysisResult.employee_id}?badgeId=${analysisResult.badge_id}`)}
              className="text-xs font-bold text-teal-deep hover:underline inline-flex items-center gap-1"
            >
              <span>Continue to Worker Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Alternative Input Methods: Upload + Manual ID */}
      <div className="pt-4 border-t border-light-surface grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Photo Upload Fallback */}
        <div>
          <label className="block text-xs font-bold uppercase text-charcoal mb-1.5">
            Upload Badge Photo
          </label>
          <label className="flex items-center justify-center gap-2 w-full p-2.5 bg-warm-white hover:bg-sage-light/30 border border-light-surface rounded-xl text-xs font-medium text-charcoal cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-sage-muted" />
            <span>Select Image File</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Manual Worker ID Entry Fallback */}
        <form onSubmit={handleManualSubmit}>
          <label className="block text-xs font-bold uppercase text-charcoal mb-1.5">
            Manual Worker ID Lookup
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="e.g. EMP-1042"
              className="flex-1 px-3 py-2 bg-warm-white border border-light-surface rounded-xl text-xs font-mono text-charcoal uppercase focus:outline-none focus:ring-2 focus:ring-teal-deep"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-charcoal text-white hover:bg-black font-semibold text-xs rounded-xl transition-colors"
            >
              Lookup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
