"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { 
  X, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  QrCode as QrIcon, 
  ShieldCheck, 
  SlidersHorizontal,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { WorkerProfileData } from "@/lib/types";

interface WorkerQrModalProps {
  worker: WorkerProfileData | null;
  onClose: () => void;
}

export default function WorkerQrModal({ worker, onClose }: WorkerQrModalProps) {
  if (!worker) return null;

  const [qrFormat, setQrFormat] = useState<"delimited" | "json" | "id_only">("delimited");
  const [badgeId, setBadgeId] = useState(worker.active_badge_id || `BAND-${worker.worker_id.replace("EMP-", "")}-01`);
  const [plantUnit, setPlantUnit] = useState(worker.plant_unit || "CDU-1");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  // Determine the encoded string
  const getEncodedPayload = () => {
    if (qrFormat === "delimited") {
      return `${worker.worker_id}:${plantUnit}:${badgeId}`;
    }
    if (qrFormat === "json") {
      return JSON.stringify({
        emp_id: worker.worker_id,
        unit: plantUnit,
        badge_id: badgeId
      });
    }
    return worker.worker_id;
  };

  const payloadString = getEncodedPayload();

  // Generate QR Code data URL
  useEffect(() => {
    const generateQr = async () => {
      try {
        const url = await QRCode.toDataURL(payloadString, {
          width: 400,
          margin: 2,
          errorCorrectionLevel: "H", // High error correction for small physical sticker prints
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error("Failed to generate QR Code", err);
      }
    };
    generateQr();
  }, [payloadString]);

  // Copy payload string
  const handleCopy = () => {
    navigator.clipboard.writeText(payloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download high-resolution PNG
  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `WRISTBAND_QR_${worker.worker_id}_${badgeId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Print wristband label
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the wristband label.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Wristband QR Label — ${worker.worker_id}</title>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              text-align: center;
              padding: 10px;
              color: #111;
            }
            .label-card {
              display: inline-block;
              border: 1.5px dashed #333;
              padding: 12px;
              border-radius: 8px;
              background: #fff;
              width: 180px;
              box-sizing: border-box;
            }
            .label-card img {
              width: 120px;
              height: 120px;
              display: block;
              margin: 0 auto 6px;
            }
            .emp-name {
              font-weight: bold;
              font-size: 13px;
              margin-bottom: 2px;
            }
            .emp-id {
              font-family: monospace;
              font-size: 12px;
              font-weight: bold;
              color: #0b6558;
            }
            .unit-badge {
              font-size: 10px;
              color: #555;
              margin-top: 4px;
            }
            .cut-instruction {
              font-size: 9px;
              color: #888;
              margin-top: 6px;
              border-top: 1px solid #ddd;
              padding-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <img src="${qrDataUrl}" alt="QR Code" />
            <div class="emp-name">${worker.full_name}</div>
            <div class="emp-id">${worker.worker_id}</div>
            <div class="unit-badge">${plantUnit} · ${badgeId}</div>
            <div class="cut-instruction">Cut & place on physical wristband</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-light-surface shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-charcoal text-white px-6 py-5 flex items-center justify-between border-b border-dark-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-golden text-charcoal flex items-center justify-center font-bold shadow-md">
              <QrIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl uppercase tracking-tight text-white">
                  Wristband QR Code Generator
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-deep text-white font-bold">
                  Physical Prototype Link
                </span>
              </div>
              <p className="text-xs text-sage mt-0.5">
                Generate, download, or print scannable QR sticker for physical wristband hardware.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-sage hover:text-white rounded-lg hover:bg-charcoal-card transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Info Banner */}
          <div className="bg-warm-white p-4 rounded-2xl border border-light-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono text-sage-muted uppercase font-bold">Worker Details</span>
              <div className="text-base font-bold text-charcoal">{worker.full_name}</div>
              <div className="text-xs text-sage-muted font-mono mt-0.5">
                ID: <strong className="text-teal-deep">{worker.worker_id}</strong> · Unit: {plantUnit} · Role: {worker.role}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-light-surface shadow-sm self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-charcoal">Auth Verified</span>
            </div>
          </div>

          {/* QR Code + Prototype Mockup Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: High-Contrast Scannable QR Code */}
            <div className="bg-white p-5 rounded-2xl border-2 border-charcoal/10 shadow-md flex flex-col items-center justify-center text-center">
              <div className="relative p-3 bg-white rounded-xl border border-charcoal/15 shadow-inner">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Wristband QR Code for ${worker.worker_id}`}
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-sage-muted text-xs font-mono">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="mt-3 font-mono text-xs font-bold text-charcoal tracking-wide break-all bg-warm-white px-3 py-1.5 rounded-lg border border-light-surface w-full max-w-xs">
                {payloadString}
              </div>

              <div className="mt-2 text-[10px] text-sage-muted font-mono">
                High Error Correction (Level H) · Sized for 15–20mm Sticker
              </div>
            </div>

            {/* Right: Real Hardware Wristband Preview */}
            <div className="bg-charcoal text-white p-5 rounded-2xl border border-dark-surface shadow-md flex flex-col justify-between h-full">
              <div>
                <span className="text-[10px] font-mono font-bold text-yellow-golden uppercase tracking-wider block mb-1">
                  Hardware Prototype Placement
                </span>
                <h4 className="font-display text-lg uppercase tracking-tight text-white mb-2">
                  Physical Wristband Preview
                </h4>
                <p className="text-xs text-sage leading-relaxed mb-4">
                  Stick this printed QR code directly onto the designated <strong>QR CODE</strong> box on the physical white badge.
                </p>

                {/* Simulated Physical Badge with QR placed on left */}
                <div className="bg-white text-charcoal p-3 rounded-xl border-2 border-dashed border-sage/40 shadow-inner flex items-center justify-between gap-2">
                  {/* Left QR Box (Real Preview) */}
                  <div className="border border-charcoal/30 p-1 rounded bg-white flex flex-col items-center justify-center w-16 h-16 shrink-0 shadow-sm">
                    {qrDataUrl && (
                      <img src={qrDataUrl} alt="Mini QR" className="w-11 h-11 object-contain" />
                    )}
                    <span className="text-[6px] font-mono font-bold mt-0.5 text-charcoal">QR CODE</span>
                  </div>

                  {/* Middle Expiry Patch */}
                  <div className="border border-charcoal/20 p-1 rounded bg-[#F8F9FA] flex flex-col items-center justify-center w-12 h-16 shrink-0 text-center">
                    <span className="w-5 h-5 bg-[#EAE8E3] rounded-sm border border-charcoal/20 block mb-0.5" />
                    <span className="text-[5px] font-mono font-bold leading-tight">EXPIRY PATCH</span>
                  </div>

                  {/* Right Reactive Strip */}
                  <div className="border border-charcoal/20 p-1 rounded bg-[#F8F9FA] flex-1 flex flex-col justify-between h-16">
                    <div className="h-4 bg-gradient-to-r from-[#F0DBA5] via-[#BA7C7C] to-[#5C6E82] rounded-sm border border-charcoal/20" />
                    <span className="text-[5px] font-mono font-bold text-center block">REACTIVE STRIP</span>
                    <div className="text-[4px] font-mono text-sage-muted flex justify-between px-0.5">
                      <span>0</span>
                      <span>10</span>
                      <span>30</span>
                      <span>60</span>
                      <span>120</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dark-surface text-[11px] text-sage flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Enables automatic worker recognition & optical scan workflow</span>
              </div>
            </div>
          </div>

          {/* Configuration Settings: Format & Badge Barcode */}
          <div className="bg-warm-white p-4 rounded-2xl border border-light-surface space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-charcoal">
              <SlidersHorizontal className="w-4 h-4 text-teal-deep" />
              <span>Badge QR Encoding Configuration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-sage-muted mb-1">
                  Encoding Format
                </label>
                <select
                  value={qrFormat}
                  onChange={(e) => setQrFormat(e.target.value as any)}
                  className="w-full p-2 bg-white rounded-xl border border-light-surface font-semibold text-charcoal focus:ring-2 focus:ring-teal-deep text-xs"
                >
                  <option value="delimited">Delimited (ID:Unit:Badge) [Recommended]</option>
                  <option value="json">Full JSON Payload</option>
                  <option value="id_only">Worker ID Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sage-muted mb-1">
                  Assigned Wristband ID
                </label>
                <input
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value.toUpperCase())}
                  className="w-full p-2 bg-white rounded-xl border border-light-surface font-mono font-bold text-charcoal text-xs uppercase focus:ring-2 focus:ring-teal-deep"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sage-muted mb-1">
                  Assigned Plant Unit
                </label>
                <input
                  type="text"
                  value={plantUnit}
                  onChange={(e) => setPlantUnit(e.target.value.toUpperCase())}
                  className="w-full p-2 bg-white rounded-xl border border-light-surface font-mono font-bold text-charcoal text-xs uppercase focus:ring-2 focus:ring-teal-deep"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Toolbar */}
        <div className="bg-warm-white px-6 py-4 border-t border-light-surface flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 bg-white hover:bg-sage-light/40 border border-light-surface rounded-xl text-xs font-semibold text-charcoal flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-sage-muted" />}
            <span>{copied ? "Copied String!" : "Copy Raw Data"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="px-4 py-2 bg-white hover:bg-sage-light/40 border border-light-surface rounded-xl text-xs font-semibold text-charcoal flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-teal-deep" />
              <span>Download PNG (512px)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-charcoal hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <Printer className="w-4 h-4 text-yellow-golden" />
              <span>Print Wristband Label</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
