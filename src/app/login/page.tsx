"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, refreshSession } = useAuth();
  
  const [employeeId, setEmployeeId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  if (!isLoading && user) {
    if (user.role === "MANAGER") router.replace("/dashboard");
    else router.replace("/scan");
    return null;
  }

  const handleDemoLogin = async (role: "manager" | "hse_officer" | "employee") => {
    setIsSubmitting(true);
    setError("");
    try {
      await authApi.demoLogin(role, role === "employee" ? employeeId || "EMP-1042" : undefined);
      await refreshSession();
      if (role === "manager" || role === "hse_officer") {
        router.push("/dashboard");
      } else {
        router.push("/scan");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
      setIsSubmitting(false);
    }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    setIsSubmitting(true);
    setError("");
    try {
      await authApi.standardLogin(employeeId);
      await refreshSession();
      // Simple routing based on prefix
      if (employeeId.toLowerCase().includes("mgr") || employeeId.toLowerCase().includes("manager")) {
        router.push("/dashboard");
      } else {
        router.push("/scan");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-background p-4">
      <div className="w-full max-w-md">
        
        {/* Brand / Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-elevation-1">
            H₂S
          </div>
          <h1 className="text-2xl font-medium text-text-primary">Rakshak AI</h1>
          <p className="text-text-secondary text-sm mt-1">Occupational Safety Platform</p>
        </div>

        {/* Standard Login Card */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-medium text-text-primary mb-4">Sign In</h2>
          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label htmlFor="employeeId" className="label">Employee ID or Username</label>
              <input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="input-field"
                placeholder="e.g., EMP-1042 or MGR-01"
                required
              />
            </div>
            
            {error && (
              <div className="p-3 bg-status-errorBg border border-status-error text-status-error text-sm rounded-md">
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isSubmitting || !employeeId}
              className="btn-primary w-full"
            >
              {isSubmitting ? "Signing in..." : "Continue"}
            </button>
          </form>
        </div>

        {/* 1-Click Demo Section */}
        <div className="card p-6 border border-dashed border-border bg-surface shadow-none">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">Quick Demo Access</h3>
            <span className="badge-warning">Hackathon Mode</span>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => handleDemoLogin("manager")}
              disabled={isSubmitting}
              className="w-full flex items-center p-3 rounded border border-border hover:border-primary hover:bg-primary-light transition-all text-left"
            >
              <div className="w-10 h-10 rounded bg-primary-light text-primary flex items-center justify-center mr-3 shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">Shift Manager</div>
                <div className="text-xs text-text-secondary">Dashboard & Analytics</div>
              </div>
            </button>
            
            <button 
              onClick={() => handleDemoLogin("employee")}
              disabled={isSubmitting}
              className="w-full flex items-center p-3 rounded border border-border hover:border-primary hover:bg-primary-light transition-all text-left"
            >
              <div className="w-10 h-10 rounded bg-primary-light text-primary flex items-center justify-center mr-3 shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">Field Employee</div>
                <div className="text-xs text-text-secondary">Dosimetry Check-in/out</div>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
