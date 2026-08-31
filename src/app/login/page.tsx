"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, User, Briefcase, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    } else if (data.user) {
      // Fetch user role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        toast.error("Could not fetch user role.");
        setIsLoading(false);
        return;
      }

      toast.success("Login successful!");
      
      if (userData.role === 'SHIFT_MANAGER') {
        router.push('/manager');
      } else if (userData.role === 'WORKER') {
        router.push('/worker');
      } else if (userData.role === 'CONTROL_ROOM_MANAGER') {
        router.push('/control-room');
      } else {
        router.push('/manager'); // Fallback
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 flex flex-col justify-center items-center p-6">
      <Link href="/" className="flex items-center gap-2 text-cyan-400 font-bold text-2xl mb-8">
        <ShieldCheck size={32} />
        H₂S Monitor
      </Link>

      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Log In</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Demo Mode</span>
            <button 
              onClick={() => setDemoMode(!demoMode)}
              className={`w-10 h-5 rounded-full relative transition-colors ${demoMode ? 'bg-cyan-600' : 'bg-slate-600'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${demoMode ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
        
        <form className="space-y-4 mb-8" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              placeholder="e.g. manager@plant.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-colors mt-2 flex justify-center items-center gap-2"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
          </button>
        </form>

        {demoMode && (
          <>
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-500">Demo Login Shortcuts</span>
              </div>
            </div>

            <div className="space-y-3">
              <Link 
                href="/manager"
                className="w-full flex items-center justify-between bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="text-cyan-400" />
                  <span className="font-semibold">Bypass as Manager</span>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-white transition-colors" />
              </Link>
              
              <Link 
                href="/worker"
                className="w-full flex items-center justify-between bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <User className="text-cyan-400" />
                  <span className="font-semibold">Bypass as Worker</span>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-white transition-colors" />
              </Link>
              
              <Link 
                href="/control-room"
                className="w-full flex items-center justify-between bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-cyan-400" />
                  <span className="font-semibold">Bypass as Control Room</span>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-white transition-colors" />
              </Link>
            </div>
          </>
        )}
      </div>
      
      <p className="mt-8 text-sm text-slate-500 text-center">
        Toggle Demo Mode to bypass real authentication.<br/>
        Otherwise, requires a valid Supabase Auth account.
      </p>
    </div>
  );
}
