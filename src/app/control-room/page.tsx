"use client";

import { ShieldCheck, LogOut, Activity, Users, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { time: '08:00', exposure: 2.4 },
  { time: '10:00', exposure: 4.8 },
  { time: '12:00', exposure: 5.1 },
  { time: '14:00', exposure: 8.9 },
  { time: '16:00', exposure: 12.4 },
  { time: '18:00', exposure: 15.2 },
];

export default function ControlRoom() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300">
      <nav className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-cyan-400" />
            <div>
              <div className="text-white font-bold leading-tight">Control Room Dashboard</div>
              <div className="text-xs text-slate-400">Live Plant Safety Overview</div>
            </div>
          </div>
          <Link href="/login" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
            <LogOut size={16} /> Log Out
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2 text-slate-400">
              <Users size={20} /> <h3 className="font-medium">Active Workers</h3>
            </div>
            <div className="text-4xl font-bold text-white">248</div>
            <div className="text-sm text-green-400 mt-2">+12 since last shift</div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2 text-slate-400">
              <Activity size={20} /> <h3 className="font-medium">Total Daily Scans</h3>
            </div>
            <div className="text-4xl font-bold text-white">492</div>
            <div className="text-sm text-cyan-400 mt-2">100% compliance</div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-900/20 rounded-bl-full"></div>
            <div className="flex items-center gap-3 mb-2 text-yellow-400">
              <AlertTriangle size={20} /> <h3 className="font-medium">Elevated Exposures</h3>
            </div>
            <div className="text-4xl font-bold text-yellow-400">3</div>
            <div className="text-sm text-slate-400 mt-2">Currently under review</div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8 h-96">
          <h3 className="text-xl font-bold text-white mb-6">Plant-Wide Cumulative Exposure Trend (Avg ppm•h)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} 
                itemStyle={{ color: '#22d3ee' }}
              />
              <Line type="monotone" dataKey="exposure" stroke="#22d3ee" strokeWidth={3} dot={{ r: 6, fill: '#0f172a', stroke: '#22d3ee', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
}
