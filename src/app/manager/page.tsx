"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, LogOut, Users, UserPlus, Search, Plus } from "lucide-react";

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState<"view" | "add">("view");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setActiveTab("view");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300">
      
      {/* NAVBAR */}
      <nav className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-cyan-400" />
            <div>
              <div className="text-white font-bold leading-tight">Manager Dashboard</div>
              <div className="text-xs text-slate-400">Control Room & Shift Management</div>
            </div>
          </div>
          <Link href="/login" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
            <LogOut size={16} /> Log Out
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        
        {/* TABS */}
        <div className="flex gap-4 mb-8 border-b border-slate-800 pb-px">
          <button 
            onClick={() => setActiveTab("view")}
            className={`pb-4 px-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === "view" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
          >
            <Users size={18} /> View Workers
          </button>
          <button 
            onClick={() => setActiveTab("add")}
            className={`pb-4 px-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === "add" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
          >
            <UserPlus size={18} /> Add New Worker
          </button>
        </div>

        {/* CONTENT */}
        {activeTab === "view" ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <h2 className="text-2xl font-bold text-white">Active Workforce</h2>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search workers..." 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    <th className="p-4 font-bold text-slate-400">Worker</th>
                    <th className="p-4 font-bold text-slate-400">ID & Band</th>
                    <th className="p-4 font-bold text-slate-400">Department</th>
                    <th className="p-4 font-bold text-slate-400">Latest Exposure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {[
                    { name: "John Doe", id: "EMP-1042", band: "H2S-001", dept: "Maintenance", exp: "4.8–6.2 ppm•h", status: "safe" },
                    { name: "Sarah Smith", id: "EMP-1193", band: "H2S-002", dept: "Operations", exp: "12.0–15.5 ppm•h", status: "warning" },
                    { name: "Michael Chen", id: "EMP-1088", band: "H2S-003", dept: "Maintenance", exp: "2.1–3.5 ppm•h", status: "safe" },
                    { name: "David Wilson", id: "EMP-0932", band: "H2S-004", dept: "Logistics", exp: "8.5–10.0 ppm•h", status: "safe" },
                  ].map((w, i) => (
                    <tr key={i} className="hover:bg-slate-700/50 transition-colors cursor-pointer">
                      <td className="p-4 font-medium text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs">{w.name.charAt(0)}</div>
                        {w.name}
                      </td>
                      <td className="p-4">
                        <div className="text-white">{w.id}</div>
                        <div className="text-xs text-cyan-400 font-mono mt-1">Band: {w.band}</div>
                      </td>
                      <td className="p-4 text-slate-400">{w.dept}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          w.status === 'warning' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50' : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}>
                          {w.exp}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl bg-slate-800 border border-slate-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Register New Worker</h2>
            
            {showSuccess && (
              <div className="bg-green-900/30 border border-green-700 text-green-400 p-4 rounded-lg mb-6 flex items-center gap-2">
                <ShieldCheck size={20} /> Worker successfully added to the system.
              </div>
            )}

            <form className="space-y-6" onSubmit={handleAddWorker}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Full Name *</label>
                  <input required type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Worker ID *</label>
                  <input required type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Employee/HR ID</label>
                  <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number</label>
                  <input type="tel" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Department</label>
                  <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Designation</label>
                  <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
                </div>
                
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-700">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Plant</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 appearance-none">
                      <option>Main Refinery</option>
                      <option>Chemical Plant B</option>
                      <option>Offshore Rig</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Region</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 appearance-none">
                      <option>North</option>
                      <option>South</option>
                      <option>East</option>
                      <option>West</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Work Area</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 appearance-none">
                      <option>Zone 1 (High Risk)</option>
                      <option>Zone 2 (Medium Risk)</option>
                      <option>Zone 3 (Low Risk)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="pt-6">
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors">
                  <Plus size={18} /> Submit New Worker
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
