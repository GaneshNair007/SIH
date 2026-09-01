"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { UserRole } from "@/types/domain";
import type { Database } from "@/types/database";
import { isProductionOperationsEnabled, isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  isDemo: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isDemo: boolean;
  login: (user: AuthUser) => void;
  loginProduction: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isDemo: false,
  login: () => {},
  loginProduction: async () => ({ error: "Authentication is unavailable." }),
  logout: async () => {},
});

const AUTH_KEY = "h2s_auth_session";

const DEMO_USERS: Record<string, AuthUser> = {
  SHIFT_MANAGER: {
    id: "demo-sm-001",
    email: "shift.manager@demo.h2s",
    name: "Demo Shift Manager",
    role: "SHIFT_MANAGER",
    companyId: "demo-company-001",
    companyName: "Demo Petrochemicals Ltd.",
    isDemo: true,
  },
  CONTROL_ROOM_MANAGER: {
    id: "demo-cr-001",
    email: "control.room@demo.h2s",
    name: "Demo Control Room Manager",
    role: "CONTROL_ROOM_MANAGER",
    companyId: "demo-company-001",
    companyName: "Demo Petrochemicals Ltd.",
    isDemo: true,
  },
  ADMIN: {
    id: "demo-admin-001",
    email: "admin@demo.h2s",
    name: "Demo Administrator",
    role: "ADMIN",
    companyId: "demo-company-001",
    companyName: "Demo Petrochemicals Ltd.",
    isDemo: true,
  },
};

export function getDemoUser(role: UserRole): AuthUser {
  return DEMO_USERS[role] || DEMO_USERS.SHIFT_MANAGER;
}

export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case "SHIFT_MANAGER": return "/manager";
    case "CONTROL_ROOM_MANAGER": return "/control-room";
    case "ADMIN": return "/admin";
    default: return "/manager";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    try {
      const stored = sessionStorage.getItem(AUTH_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    const restoreProductionSession = async () => {
      if (!isProductionOperationsEnabled() || sessionStorage.getItem(AUTH_KEY)) {
        if (mounted) setIsLoading(false);
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        if (mounted) setIsLoading(false);
        return;
      }
      const { data: profileData } = await supabase
        .from("users")
        .select("id,email,name,role,company_id")
        .eq("id", data.user.id)
        .single();
      const profile = profileData as Database["public"]["Tables"]["users"]["Row"] | null;
      if (profile && mounted) {
        const { data: companyData } = profile.company_id
          ? await supabase.from("companies").select("name").eq("id", profile.company_id).single()
          : { data: null };
        const companyValue = companyData as { name?: string } | null;
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          companyId: profile.company_id || "",
          companyName: companyValue?.name || "Company",
          isDemo: false,
        });
      }
      if (mounted) setIsLoading(false);
    };
    void restoreProductionSession();
    return () => { mounted = false; };
  }, []);

  const login = useCallback((newUser: AuthUser) => {
    setUser(newUser);
    try {
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    } catch {
      // ignore
    }
  }, []);

  const loginProduction = useCallback(async (email: string, password: string) => {
    if (!isProductionOperationsEnabled()) {
      return { error: "Production operations are not enabled yet. Apply and verify the Supabase migration, transactional shift workflow, private image storage, and RLS tests before setting NEXT_PUBLIC_ENABLE_PRODUCTION_OPERATIONS=true. The demo below remains fully isolated." };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: error?.message || "Sign-in failed." };

    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("id,email,name,role,company_id")
      .eq("id", data.user.id)
      .single();
    const profile = profileData as Database["public"]["Tables"]["users"]["Row"] | null;

    if (profileError || !profile || !["SHIFT_MANAGER", "CONTROL_ROOM_MANAGER", "ADMIN"].includes(profile.role)) {
      await supabase.auth.signOut();
      return { error: "This account does not have an authorized staff role for the platform." };
    }

    const { data: companyData } = profile.company_id
      ? await supabase.from("companies").select("name").eq("id", profile.company_id).single()
      : { data: null };
    const companyValue = companyData as { name?: string } | null;
    setUser({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      companyId: profile.company_id || "",
      companyName: companyValue?.name || "Company",
      isDemo: false,
    });
    sessionStorage.removeItem(AUTH_KEY);
    return { error: null };
  }, []);

  const logout = useCallback(async () => {
    if (user && !user.isDemo && isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isDemo: user?.isDemo ?? false, login, loginProduction, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
