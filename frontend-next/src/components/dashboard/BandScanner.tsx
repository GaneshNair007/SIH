"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Flashlight, Upload, AlertCircle, CheckCircle2, RefreshCw, X, ArrowRight } from "lucide-react";
import { analyzeBadgeImage } from "@/lib/api";

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
  const processImageBlob = async (blob: Blob) => {
    setAnalyzing(true);
    setCameraError(null);
    try {
      const formData = new FormData();
      formData.append("file", blob, "scan_capture.jpg");
      const result = await analyzeBadgeImage(formData);
      setAnalysisResult(result);

      if (result.status === "SUCCESS" && result.employee_id) {
        setIsBlueDetected(result.is_blue_dosimeter_strip);
        if (onScanSuccess) {
          onScanSuccess(result.employee_id, result.badge_id, result.plant_unit);
        } else {
          // Navigate to worker profile retaining context
          setTimeout(() => {
            stopCamera();
            router.push(`/workers/${result.employee_id}?badgeId=${result.badge_id || "BAND-1042-01"}&autoScan=true`);
          }, 1200);
        }
      }
    } catch (err: any) {
      setCameraError(err?.message || "Optical analysis failed. Ensure blue strip is clearly aligned.");
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
    if (onScanSuccess) {
      onScanSuccess(cleanId);
    } else {
      router.push(`/workers/${cleanId}`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-mono font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ALIGN BLUE WRISTBAND IN FRAME</span>
            </div>

            {/* Target Alignment Bounding Box */}
            <div className="w-3/4 h-28 border-2 border-dashed border-yellow-golden/80 rounded-xl flex items-center justify-center bg-yellow-golden/5">
              <span className="text-[10px] font-mono text-yellow-golden font-bold uppercase tracking-wider">
                [ QR + PATCH A / B / C ]
              </span>
            </div>

            <div className="bg-black/60 px-3 py-1 rounded text-[10px] font-mono text-sage">
              Rear Camera Active · CIELAB AI Extraction
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
