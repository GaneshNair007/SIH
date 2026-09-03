"use client";

import { useAuth as useAuthContext } from "@/context/AuthContext";
import type { UserRole } from "@/types/domain";

export function useAuth() {
  const context = useAuthContext();
  const role = (context.user?.role as UserRole | string) ?? null;
  return {
    ...context,
    role,
    isManager: role === "SHIFT_MANAGER" || role === "MANAGER",
    isControlRoom: role === "CONTROL_ROOM_MANAGER" || role === "HSE_OFFICER",
    isAdmin: role === "ADMIN",
    hasRole: (allowed: (UserRole | string)[]) => Boolean(role && (allowed as (string | UserRole)[]).includes(role)),
  };
}
