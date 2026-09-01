"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, getDemoUser, getDefaultRoute } from "@/context/AuthContext";
import { PROJECT, ROLES_DESCRIPTION } from "@/lib/content";
import type { UserRole } from "@/types/domain";
import PublicNav from "@/components/ui/PublicNav";
import PublicFooter from "@/components/ui/PublicFooter";

const DEMO_ROLES: { role: UserRole; label: string; description: string; icon: string }[] = [
  {
    role: "SHIFT_MANAGER",
    label: ROLES_DESCRIPTION.shiftManager.title,
    description: ROLES_DESCRIPTION.shiftManager.short,
    icon: "📋",
  },
  {
    role: "CONTROL_ROOM_MANAGER",
    label: ROLES_DESCRIPTION.controlRoom.title,
    description: ROLES_DESCRIPTION.controlRoom.short,
    icon: "📊",
  },
  {
    role: "ADMIN",
    label: ROLES_DESCRIPTION.admin.title,
    description: ROLES_DESCRIPTION.admin.short,
    icon: "⚙️",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, loginProduction, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.replace(getDefaultRoute(user.role));
  }, [router, user]);

  const handleProductionLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await loginProduction(email, password);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  if (user) return null;

  const handleDemoLogin = (role: UserRole) => {
    const demoUser = getDemoUser(role);
    login(demoUser);
    router.push(getDefaultRoute(role));
  };

  return (
    <div className="min-h-screen bg-canvas">
      <PublicNav />

      <div className="pt-28 pb-section">
        <div className="page-container max-w-lg">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-full bg-teal-pale flex items-center justify-center mx-auto mb-4">
              <span className="text-teal text-lg font-bold">H₂S</span>
            </div>
            <h1 className="text-heading-1 text-charcoal font-serif mb-2">
              Sign in
            </h1>
            <p className="text-body text-muted">
              Access the {PROJECT.name} monitoring platform
            </p>
          </div>

          {/* Production login */}
          <div className="card mb-8">
            <form onSubmit={handleProductionLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email or Employee ID</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-12"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>

          {/* Demo access — visually distinct */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-canvas px-4 text-sm text-muted">or explore the demo</span>
            </div>
          </div>

          <div className="mt-8 p-6 rounded-card border-2 border-dashed border-border bg-canvas-white">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge-elevated">Demo Mode</span>
              <span className="text-xs text-muted">Synthetic data only — no real worker records</span>
            </div>

            <div className="space-y-3">
              {DEMO_ROLES.map((dr) => (
                <button
                  key={dr.role}
                  onClick={() => handleDemoLogin(dr.role)}
                  className="w-full text-left p-4 rounded-lg border border-border bg-canvas-white hover:bg-canvas-subtle hover:border-border-strong transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{dr.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-charcoal group-hover:text-teal transition-colors">
                        {dr.label}
                      </div>
                      <div className="text-xs text-muted truncate">{dr.description}</div>
                    </div>
                    <svg className="w-4 h-4 text-muted group-hover:text-teal transition-colors" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4l4 4-4 4"/></svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/" className="text-sm text-muted hover:text-teal transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
