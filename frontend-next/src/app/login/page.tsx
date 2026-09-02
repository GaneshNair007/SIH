"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PublicNavbar from "@/components/layout/PublicNavbar";
import Footer from "@/components/layout/Footer";
import { ShieldCheck, UserCheck, Stethoscope, ArrowRight, Lock, User, AlertCircle } from "lucide-react";
import { PROJECT_NAME } from "@/lib/constants";

export default function LoginPage() {
  const { loginWithDemo, loginWithCredentials, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg("Please provide both username and password.");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      await loginWithCredentials(username, password);
    } catch (err: any) {
      setErrorMsg(err?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = async (role: "employee" | "manager" | "hse_officer", empId?: string) => {
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      await loginWithDemo(role, empId);
    } catch (err: any) {
      setErrorMsg(err?.message || "Demo login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PublicNavbar />
      <main className="min-h-[calc(100vh-80px)] pt-28 pb-16 px-6 lg:px-12 flex items-center justify-center bg-hero-grid bg-warm-white">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl p-8 lg:p-12 border border-light-surface shadow-xl">
          
          {/* Left Column: 1-Click Demo Logins for Hackathon Judges */}
          <div className="flex flex-col justify-between border-b md:border-b-0 md:border-r border-light-surface pb-8 md:pb-0 md:pr-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-golden/40 border border-yellow-golden text-charcoal text-[11px] font-bold uppercase tracking-wider mb-4">
                <span>1-Click Hackathon Demo Mode</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-charcoal mb-3">
                INSTANT ROLE ACCESS
              </h1>
              <p className="text-xs text-sage-muted leading-relaxed mb-6">
                Frictionless single-click demo profiles pre-configured with operational shift records, active ledgers, and plant credentials.
              </p>

              <div className="space-y-3">
                {/* 1. Shift Manager Demo */}
                <button
                  type="button"
                  onClick={() => handleDemoClick("manager")}
                  disabled={isSubmitting || loading}
                  className="w-full p-4 rounded-xl border border-light-surface bg-warm-white hover:border-teal-deep hover:bg-teal-light/20 transition-all text-left flex items-center justify-between group disabled:opacity-50 card-hover-lift"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-teal-deep text-white">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-teal-deep uppercase">Shift Safety Lead</div>
                      <div className="text-sm font-bold text-charcoal">Vikram Singh (MGR-01)</div>
                      <div className="text-[11px] text-sage-muted">Control Room & Optical Scanner</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-teal-deep group-hover:translate-x-1 transition-transform" />
                </button>

                {/* 2. HSE / Medical Lead Demo */}
                <button
                  type="button"
                  onClick={() => handleDemoClick("hse_officer")}
                  disabled={isSubmitting || loading}
                  className="w-full p-4 rounded-xl border border-light-surface bg-warm-white hover:border-yellow-golden hover:bg-yellow-golden/10 transition-all text-left flex items-center justify-between group disabled:opacity-50 card-hover-lift"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-charcoal text-yellow-golden">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-amber-800 uppercase">OHC Medical Officer</div>
                      <div className="text-sm font-bold text-charcoal">Dr. Ananya Sharma (HSE-01)</div>
                      <div className="text-[11px] text-sage-muted">Statutory Reports & Triangulation</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-charcoal group-hover:translate-x-1 transition-transform" />
                </button>

                {/* 3. Field Employee Demo */}
                <button
                  type="button"
                  onClick={() => handleDemoClick("employee", "EMP-1042")}
                  disabled={isSubmitting || loading}
                  className="w-full p-4 rounded-xl border border-light-surface bg-warm-white hover:border-charcoal/40 hover:bg-warm-white transition-all text-left flex items-center justify-between group disabled:opacity-50 card-hover-lift"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-sage-light text-charcoal">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-sage-muted uppercase">Field Technician</div>
                      <div className="text-sm font-bold text-charcoal">Sumedh Kulkarni (EMP-1042)</div>
                      <div className="text-[11px] text-sage-muted">CDU-1 · Active Band-01</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-charcoal group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="text-[11px] text-sage-muted pt-4 border-t border-light-surface mt-6">
              Cookie session authenticated against FastAPI backend.
            </div>
          </div>

          {/* Right Column: Standard Credentials Form */}
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="font-display text-2xl uppercase tracking-tight text-charcoal mb-2">
                STANDARD CREDENTIALS
              </h2>
              <p className="text-xs text-sage-muted leading-relaxed mb-6">
                Enter your registered company ID and password to access authorized operations.
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleStandardSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-charcoal mb-1">
                    Employee or Manager ID
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-sage-muted absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. MGR-01 or EMP-1042"
                      className="w-full pl-9 pr-4 py-2.5 bg-warm-white rounded-xl border border-light-surface text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-teal-deep"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-charcoal mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-sage-muted absolute left-3 top-3.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2.5 bg-warm-white rounded-xl border border-light-surface text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-teal-deep"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="w-full py-3 bg-charcoal text-white hover:bg-black font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? "Authenticating..." : "Sign In to Platform"}
                </button>
              </form>
            </div>

            <div className="text-center pt-6 text-xs text-sage-muted">
              Need access? Contact refinery HSE administration.
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
