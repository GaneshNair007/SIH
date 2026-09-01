"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/domain";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Wraps protected routes. Redirects to /login if unauthenticated.
 * Optionally checks role with requiredRoles.
 */
export default function AuthGuard({ children, requiredRoles, fallback }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return fallback || (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="card max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-hazard-highBg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-hazard-high" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
          </div>
          <h2 className="text-heading-2 text-charcoal mb-2">Access Denied</h2>
          <p className="text-sm text-muted mb-4">
            Your role ({user.role.replace(/_/g, " ")}) does not have permission to access this page.
          </p>
          <button onClick={() => router.back()} className="btn-secondary text-sm">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
