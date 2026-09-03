"use client";

import AppShell from "@/components/layout/AppShell";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { scanApi } from "@/lib/api/scans";
import { useRouter } from "next/navigation";

interface ScanAnalysisResult {
  qr_decoded?: {
    badge_barcode?: string;
    employee_id?: string;
  };
  patch_a_active_delta_e?: number;
  patch_b_drift?: number;
  patch_c_condition?: string;
  confidence_score?: number;
}

export default function ScanPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setIsScanning(true);
    setError(null);
    
    try {
      const data = await scanApi.analyzeImage(file);
      setResult(data);
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to analyze image. Ensure it is a valid photo of the wristband.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmitToLedger = async () => {
    if (!result || !user) return;
    setIsScanning(true);
    setError(null);

    try {
      // Basic heuristic: if it's the start of the day, do start-shift, else end-shift.
      // For demo purposes, we will just call end-shift directly to generate the advisory.
      await scanApi.endShift({
        worker_id: user.employee_id,
        plant_unit: user.plant_unit,
        shift_duration_hours: 8.0,
        badge_id: result.qr_decoded?.badge_barcode || user.active_badge_id || "BAND-1234",
        band_lifecycle_day: 1,
        start_delta_e: 0.0, // Assuming 0.0 for demo
        end_delta_e: result.patch_a_active_delta_e || 0.0,
        patch_b_drift: result.patch_b_drift || 0.0,
        patch_c_condition: result.patch_c_condition || "NORMAL",
      });
      
      // Navigate to dashboard or history
      if (user.role === "MANAGER" || user.role === "HSE_OFFICER") {
        router.push("/dashboard");
      } else {
        router.push("/"); // Back to empty state
      }
    } catch {
      setError("Failed to submit scan to the ledger.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-text-primary">Dosimeter Scan</h1>
        <p className="text-sm text-text-secondary mt-1">Capture or upload wristband image for AI colorimetry analysis</p>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="card p-6">
          
          {error && (
            <div className="p-3 mb-4 bg-status-errorBg border border-status-error text-status-error text-sm rounded-md">
              {error}
            </div>
          )}

          {!result ? (
            <div className="space-y-6">
              
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-surface-background hover:bg-surface-hover transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="text-primary font-medium">{file.name} ready for scan.</div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-primary-light text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                    <p className="text-text-primary font-medium">Tap to capture or upload photo</p>
                    <p className="text-text-secondary text-xs mt-1">Make sure lighting is even and the badge is clearly visible.</p>
                  </>
                )}
              </div>

              <button 
                className="btn-primary w-full py-3 text-base"
                onClick={handleScan}
                disabled={!file || isScanning}
              >
                {isScanning ? "Analyzing patch gradients..." : "Scan Dosimeter"}
              </button>

            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-status-successBg text-status-success rounded-full flex items-center justify-center mx-auto mb-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h2 className="text-xl font-medium text-center text-text-primary">Analysis Complete</h2>
              
              <div className="bg-surface-background rounded-lg p-4 border border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-text-secondary uppercase">Decoded Identity</div>
                    <div className="font-medium text-text-primary">{result.qr_decoded?.employee_id || "Unknown"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-secondary uppercase">Condition</div>
                    <div className="font-medium text-status-success">{result.patch_c_condition || "NORMAL"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-secondary uppercase">Optical Density ΔE</div>
                    <div className="font-medium text-text-primary">{result.patch_a_active_delta_e?.toFixed(2) || "0.00"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-secondary uppercase">Confidence</div>
                    <div className="font-medium text-text-primary">{result.confidence_score?.toFixed(1) || "0.0"} / 10</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  className="btn-secondary flex-1"
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                  }}
                  disabled={isScanning}
                >
                  Scan Another
                </button>
                <button 
                  className="btn-primary flex-1"
                  onClick={handleSubmitToLedger}
                  disabled={isScanning}
                >
                  {isScanning ? "Submitting..." : "Submit to Ledger"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
