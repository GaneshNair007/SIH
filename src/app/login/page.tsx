"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight, User, Briefcase } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 flex flex-col justify-center items-center p-6">
      <Link href="/" className="flex items-center gap-2 text-cyan-400 font-bold text-2xl mb-8">
        <ShieldCheck size={32} />
        H₂S Monitor
      </Link>

      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Log In</h1>
        
        <form className="space-y-4 mb-8" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email or Employee ID</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              placeholder="e.g. EMP-12345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-colors mt-2"
          >
            Log In
          </button>
        </form>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-800 text-slate-500">Demo Login Options</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link 
            href="/manager"
            className="w-full flex items-center justify-between bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="text-cyan-400" />
              <span className="font-semibold">Continue as Manager</span>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-white transition-colors" />
          </Link>
          
          <Link 
            href="/worker"
            className="w-full flex items-center justify-between bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl transition-colors group"
          >
            <div className="flex items-center gap-3">
              <User className="text-cyan-400" />
              <span className="font-semibold">Continue as Worker</span>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </div>
      
      <p className="mt-8 text-sm text-slate-500">
        Demo mode — simulated data. Not for production use.
      </p>
    </div>
  );
}
