import { Camera, Image as ImageIcon, QrCode, Layers, Shield } from "lucide-react";

export default function ImagesTab() {
  const imageAssets = [
    {
      title: "Physical Sensor Prototype Layout",
      type: "Physical hardware prototype layout",
      desc: "Actual wristband housing featuring replaceable filter paper cartridge, reference scale, expiry patch, and QR identifier. Physically separated from direct epidermal contact.",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      content: (
        <div className="w-full h-64 bg-[#171C1B] rounded-xl flex flex-col items-center justify-center p-3 text-white text-center border border-sage/20 overflow-hidden">
          <img
            src="/images/wristband_prototype.jpg"
            alt="Hardware prototype with QR code, expiry patch, reactive strip, and reference scale"
            className="w-full h-full object-contain rounded-lg"
          />
        </div>
      ),
    },
    {
      title: "Triple-Patch Optical Arrangement",
      type: "Proposed engineering schematic",
      desc: "Spatial layout of Patch A (Active detection), Patch B (Anthocyanin blank control), and Patch C (Humidity & interferent indicator) on 20×50 mm cellulose substrate.",
      badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
      content: (
        <div className="w-full h-56 bg-warm-white rounded-xl flex flex-col items-center justify-center p-4 border border-light-surface">
          <div className="w-full max-w-xs bg-white p-4 rounded-xl border-2 border-dashed border-charcoal/20 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-charcoal border-b pb-2 mb-3">
              <span>SUBSTRATE (20×50mm)</span>
              <span className="text-teal-deep">Cellulose Paper</span>
            </div>
            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="border border-amber-400 bg-amber-50 p-2 rounded text-center">
                <span className="w-5 h-5 rounded-full bg-amber-700 mx-auto block" />
                <span className="text-[9px] font-bold block mt-1">A: SbCl₃</span>
              </div>
              <div className="border border-gray-300 bg-gray-50 p-2 rounded text-center">
                <span className="w-5 h-5 rounded-full bg-purple-200 mx-auto block" />
                <span className="text-[9px] font-bold block mt-1">B: Blank</span>
              </div>
              <div className="border border-emerald-400 bg-emerald-50 p-2 rounded text-center">
                <span className="w-5 h-5 rounded-full bg-emerald-300 mx-auto block" />
                <span className="text-[9px] font-bold block mt-1">C: Seal</span>
              </div>
            </div>
            <div className="text-[9px] font-mono text-sage-muted text-center pt-2 border-t mt-2">
              Reference Scale: 0 | 10 | 30 | 60 | 120 ΔE
            </div>
          </div>
          <span className="text-xs text-sage-muted mt-3 font-mono">Figure 2: Micro-Well Patch Separation</span>
        </div>
      ),
    },
    {
      title: "Smartphone Capture Viewfinder",
      type: "Actual software implementation preview",
      desc: "Live HTML5 webcam / smartphone capture interface with real-time blue substrate chromaticity detection (HSV) and QR bounding-box tracking via jsQR.",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      content: (
        <div className="w-full h-56 bg-[#0F1212] rounded-xl flex flex-col items-center justify-center p-4 border border-sage/20 text-white">
          <div className="relative w-48 h-36 border-2 border-emerald-400 rounded-xl flex flex-col items-center justify-between p-3 bg-black/60 shadow-inner">
            <span className="text-[9px] font-mono text-emerald-400 font-bold tracking-wider">🟢 BLUE STRIP DETECTED</span>
            <div className="w-20 h-10 border border-dashed border-emerald-400/80 rounded flex items-center justify-center">
              <span className="text-[8px] font-mono text-emerald-300">ALIGN PATCH</span>
            </div>
            <div className="flex justify-between w-full text-[8px] font-mono text-sage">
              <span>GLARE: 1.2%</span>
              <span>SHARP: 88.4</span>
            </div>
          </div>
          <span className="text-xs text-sage mt-2 font-mono">Figure 3: AI Quality Scorecard Viewfinder</span>
        </div>
      ),
    },
    {
      title: "Control Room Exposure Heatmap",
      type: "Actual software implementation preview",
      desc: "2D spatial fugitive emission leak triangulation across MRPL refinery units (CDU-1, CDU-2, DHDS, SRU, Tank Farm) based on worker dosimeter scan logs.",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      content: (
        <div className="w-full h-56 bg-[#171C1B] rounded-xl flex flex-col items-center justify-center p-4 border border-sage/20 text-white">
          <div className="w-full max-w-xs h-36 bg-[#0F1212] rounded-lg p-3 border border-sage/10 relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10px] font-mono text-sage border-b border-sage/10 pb-1">
              <span>PLANT GRID: MRPL</span>
              <span className="text-yellow-golden">IDW Triangulation</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono my-auto">
              <div className="p-1 rounded bg-teal-deep/30 border border-teal-deep/50 text-teal-light">CDU-1: 0.88 ppm</div>
              <div className="p-1 rounded bg-amber-900/30 border border-yellow-golden/50 text-yellow-golden">DHDS: 1.84 ppm</div>
              <div className="p-1 rounded bg-red-950/40 border border-red-500/50 text-red-300">SRU: 3.42 ppm</div>
            </div>
            <div className="text-[8px] text-sage font-mono flex justify-between">
              <span>Active Hotspots: 1</span>
              <span>Normal Units: 4</span>
            </div>
          </div>
          <span className="text-xs text-sage mt-2 font-mono">Figure 4: Spatial Leak Heatmap Visualizer</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="font-display text-3xl uppercase tracking-tight text-charcoal">
          Hardware & Software Imagery
        </h3>
        <p className="text-sm text-sage-muted mt-2">
          Clear distinction between laboratory prototype illustrations, proposed schematics, and live software previews.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {imageAssets.map((asset, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-6 border border-light-surface shadow-sm card-hover-lift flex flex-col justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h4 className="font-display text-2xl uppercase tracking-tight text-charcoal">
                  {asset.title}
                </h4>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${asset.badgeColor}`}>
                  {asset.type}
                </span>
              </div>
              <div className="mb-4">
                {asset.content}
              </div>
              <p className="text-xs text-sage-muted leading-relaxed">
                {asset.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
