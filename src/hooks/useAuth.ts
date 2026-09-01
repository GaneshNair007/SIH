"use client";

import { useAuth as useAuthContext } from "@/context/AuthContext";
import type { UserRole } from "@/types/domain";

export function useAuth() {
  const context = useAuthContext();
  const role = context.user?.role ?? null;
  return {
    ...context,
    role,
    isManager: role === "SHIFT_MANAGER",
    isControlRoom: role === "CONTROL_ROOM_MANAGER",
    isAdmin: role === "ADMIN",
    hasRole: (allowed: UserRole[]) => Boolean(role && allowed.includes(role)),
  };
}
