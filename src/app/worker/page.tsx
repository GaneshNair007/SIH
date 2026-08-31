"use client";

import Link from "next/link";
import { LogOut, User, ShieldAlert, CheckCircle2, History, Activity, AlertTriangle } from "lucide-react";

export default function WorkerDashboard() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 pb-12">
      
      {/* NAVBAR */}
      <nav className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-cyan-400 font-bold text-xl tracking-tight">H₂S MyMonitor</div>
          <Link href="/login" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
            <LogOut size={16} /> Log Out
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        
        {/* WORKER PROFILE */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
          <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative">
            <User size={64} className="text-slate-600" />
            {/* Image Placeholder */}
            {/* <img src="/profile.jpg" className="absolute inset-0 w-full h-full object-cover" alt="Profile" /> */}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-white mb-1">Alex Rodriguez</h1>
            <p className="text-cyan-400 font-medium mb-3">ID: EMP-8492 | Field Technician</p>
            <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Currently on shift
            </div>
          </div>
        </div>

        {/* H2S EXPOSURE INFO */}
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="text-cyan-400" size={20} /> Cumulative Exposure
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
            <div className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Today</div>
            <div className="text-xl font-mono text-white font-bold">1.2–2.5</div>
            <div className="text-xs text-slate-400">ppm•h</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
            <div className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">This Week</div>
            <div className="text-xl font-mono text-white font-bold">8.4–10.1</div>
            <div className="text-xs text-slate-400">ppm•h</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
            <div className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">This Month</div>
            <div className="text-xl font-mono text-white font-bold">32.0–41.5</div>
            <div className="text-xs text-slate-400">ppm•h</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
            <div className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Lifetime</div>
            <div className="text-xl font-mono text-cyan-400 font-bold">145–180</div>
            <div className="text-xs text-slate-400">ppm•h</div>
          </div>
        </div>

        {/* CURRENT BAND STATUS */}
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="text-cyan-400" size={20} /> Current Band Status
        </h2>
        <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 border border-slate-700 rounded-xl p-6 mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 bg-cyan-900/30 rounded-full flex items-center justify-center border border-cyan-800 shrink-0">
              <CheckCircle2 className="text-cyan-400" size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-lg font-bold text-white">Band: H2S-004-92A</span>
                <span className="bg-green-900/50 text-green-400 text-xs font-bold px-2 py-0.5 rounded border border-green-800">ACTIVE</span>
              </div>
              <p className="text-sm text-slate-400">Working Day: <span className="font-bold text-white">3 / 5</span></p>
            </div>
          </div>
          
          <div className="w-full md:w-auto bg-slate-900 p-4 rounded-lg border border-slate-700 text-center md:text-right">
            <div className="text-xs text-slate-500 mb-1">Latest Scan Reading</div>
            <div className="font-mono text-lg text-white">1.2–2.5 ppm•h</div>
            <div className="text-xs font-medium text-green-400 mt-1">Confidence: HIGH</div>
          </div>
        </div>

        {/* EXPOSURE HISTORY TABLE */}
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <History className="text-cyan-400" size={20} /> Exposure History
        </h2>
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="p-4 font-bold text-slate-400">Date</th>
                  <th className="p-4 font-bold text-slate-400">Shift</th>
                  <th className="p-4 font-bold text-slate-400">Location</th>
                  <th className="p-4 font-bold text-slate-400">Exposure Range</th>
                  <th className="p-4 font-bold text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {[
                  { date: "Oct 24, 2026", shift: "Morning", loc: "Zone A - Refinery", exp: "1.2–2.5 ppm•h", status: "SAFE" },
                  { date: "Oct 23, 2026", shift: "Morning", loc: "Zone A - Refinery", exp: "0.5–1.2 ppm•h", status: "SAFE" },
                  { date: "Oct 22, 2026", shift: "Morning", loc: "Zone B - Storage", exp: "8.4–10.1 ppm•h", status: "ELEVATED" },
                  { date: "Oct 21, 2026", shift: "Morning", loc: "Zone B - Storage", exp: "2.1–3.8 ppm•h", status: "SAFE" },
                  { date: "Oct 20, 2026", shift: "Morning", loc: "Zone A - Refinery", exp: "0.0–0.5 ppm•h", status: "SAFE" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 text-white font-medium">{row.date}</td>
                    <td className="p-4 text-slate-400">{row.shift}</td>
                    <td className="p-4 text-slate-400">{row.loc}</td>
                    <td className="p-4 font-mono text-white">{row.exp}</td>
                    <td className="p-4">
                      {row.status === 'SAFE' ? (
                        <span className="text-xs font-bold text-green-400 bg-green-900/20 px-2 py-1 rounded border border-green-800/50">SAFE</span>
                      ) : (
                        <span className="text-xs font-bold text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-800/50 flex items-center inline-flex gap-1">
                          <AlertTriangle size={12} /> ELEVATED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
