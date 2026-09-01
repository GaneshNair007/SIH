"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { SessionUser, UserRole } from "@/lib/types";
import { getSessionMe, loginDemo, loginStandard, logoutUser } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  loginWithDemo: (role: "employee" | "manager" | "hse_officer", employeeId?: string) => Promise<void>;
  loginWithCredentials: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const refreshSession = async () => {
    try {
      setLoading(true);
      const session = await getSessionMe();
      if (session && session.authenticated) {
        setUser(session);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const loginWithDemo = async (role: "employee" | "manager" | "hse_officer", employeeId?: string) => {
    setLoading(true);
    try {
      const session = await loginDemo(role, employeeId);
      setUser(session);
      if (role === "manager") {
        router.push("/manager");
      } else if (role === "hse_officer") {
        router.push("/control-room");
      } else {
        router.push(`/workers/${session.employee_id || "EMP-1042"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithCredentials = async (username: string, password: string) => {
    setLoading(true);
    try {
      const session = await loginStandard(username, password);
      setUser(session);
      if (session.role === "MANAGER") {
        router.push("/manager");
      } else if (session.role === "HSE_OFFICER") {
        router.push("/control-room");
      } else {
        router.push(`/workers/${session.employee_id || "EMP-1042"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithDemo,
        loginWithCredentials,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
