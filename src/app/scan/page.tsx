"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ScanPage() {
  const { role } = useAuth();
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [scanResult, setScanResult] = useState<null | "success" | "invalid">(null);

  useEffect(() => {
    if (!role || role !== "Shift Manager") {
      router.push("/");
    }
  }, [role, router]);

  const simulateScan = () => {
    setScanning(false);
    // 80% chance of success for demo purposes
    if (Math.random() > 0.2) {
      setScanResult("success");
    } else {
      setScanResult("invalid");
    }
  };

  if (role !== "Shift Manager") return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 flex items-center border-b border-gray-800 bg-gray-900">
        <button onClick={() => router.back()} className="p-2 mr-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-semibold">Scan Wristband</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {scanning ? (
          <div className="flex flex-col items-center w-full max-w-sm">
            <div className="relative w-full aspect-square bg-gray-800 rounded-xl overflow-hidden border-2 border-dashed border-gray-600 flex items-center justify-center mb-8">
              <Camera size={48} className="text-gray-500 mb-4 opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-blue-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
              </div>
            </div>
            
            <p className="text-gray-400 text-center mb-8">
              Align the QR code and reference patches within the frame.
            </p>

            <button 
              onClick={simulateScan}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Simulate Scan
            </button>
          </div>
        ) : scanResult === "success" ? (
          <div className="flex flex-col items-center bg-gray-800 p-8 rounded-2xl w-full max-w-sm text-center">
            <CheckCircle2 size={64} className="text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Scan Successful</h2>
            <p className="text-gray-400 mb-6">Band H2S-001 processed.</p>
            
            <div className="bg-gray-900 rounded-lg p-4 w-full mb-6 text-left">
              <div className="text-sm text-gray-500 mb-1">Estimated Exposure</div>
              <div className="text-xl font-mono text-white">10 - 30 ppm·h</div>
              <div className="mt-2 text-xs font-semibold px-2 py-1 bg-green-900/30 text-green-400 inline-block rounded">
                Confidence: HIGH
              </div>
            </div>

            <button 
              onClick={() => {
                setScanning(true);
                setScanResult(null);
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Scan Another
            </button>
            <button 
              onClick={() => router.push("/dashboard")}
              className="w-full mt-3 bg-transparent text-gray-400 hover:text-white py-3 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center bg-gray-800 p-8 rounded-2xl w-full max-w-sm text-center">
            <AlertTriangle size={64} className="text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Scan Failed</h2>
            <p className="text-gray-400 mb-6">Could not read reference patches. Ensure good lighting and try again.</p>
            
            <button 
              onClick={() => {
                setScanning(true);
                setScanResult(null);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
