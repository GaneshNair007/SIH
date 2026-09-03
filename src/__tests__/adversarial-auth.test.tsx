import React from "react";
import { act, renderHook, waitFor, render, screen } from "@testing-library/react";
import {
  AuthProvider,
  getDefaultRoute,
  getDemoUser,
  isDemo,
  login,
  useAuth,
} from "@/context/AuthContext";
import { useAuth as useAuthHook } from "@/hooks/useAuth";
import AuthGuard from "@/components/auth/AuthGuard";
import AppShell from "@/components/layout/AppShell";
import type { UserRole } from "@/types/domain";

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockPathname = "/";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    prefetch: jest.fn(),
  }),
  usePathname: () => mockPathname,
}));

// Mock authApi to prevent real network calls during unit testing
jest.mock("@/lib/api/auth", () => ({
  authApi: {
    me: jest.fn().mockRejectedValue(new Error("Network Error")),
    demoLogin: jest.fn().mockRejectedValue(new Error("Network Error")),
    standardLogin: jest.fn().mockRejectedValue(new Error("Network Error")),
    logout: jest.fn().mockResolvedValue({ authenticated: false, message: "Logged out" }),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("Adversarial Auth Challenge: Helper Functions & Type Boundaries", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    jest.clearAllMocks();
    mockPathname = "/";
  });

  describe("1. getDefaultRoute Edge Cases & Malformed Inputs", () => {
    test("handles undefined, null, and empty string safely without throwing", () => {
      expect(getDefaultRoute(undefined)).toBe("/");
      expect(getDefaultRoute(null as unknown as string)).toBe("/");
      expect(getDefaultRoute("")).toBe("/");
    });

    test("handles unknown and bizarre role strings gracefully", () => {
      expect(getDefaultRoute("SUPER_ADMIN")).toBe("/admin"); // Contains ADMIN
      expect(getDefaultRoute("UNRECOGNIZED_ROLE")).toBe("/");
      expect(getDefaultRoute("GUEST")).toBe("/");
      expect(getDefaultRoute("12345")).toBe("/");
      expect(getDefaultRoute("<script>alert('xss')</script>")).toBe("/");
      expect(getDefaultRoute("[object Object]")).toBe("/");
      expect(getDefaultRoute("null")).toBe("/");
      expect(getDefaultRoute("undefined")).toBe("/");
    });

    test("handles non-string types safely at runtime", () => {
      expect(getDefaultRoute(12345 as unknown as string)).toBe("/");
      expect(getDefaultRoute(true as unknown as string)).toBe("/");
      expect(getDefaultRoute({} as unknown as string)).toBe("/");
      expect(getDefaultRoute([] as unknown as string)).toBe("/");
    });

    test("handles hyphenated and lowercase variations", () => {
      expect(getDefaultRoute("shift-manager")).toBe("/manager");
      expect(getDefaultRoute("control-room-manager")).toBe("/control-room");
      expect(getDefaultRoute("hse-officer")).toBe("/control-room");
      expect(getDefaultRoute("shift_manager")).toBe("/manager");
      expect(getDefaultRoute("worker")).toBe("/scan");
      expect(getDefaultRoute("employee")).toBe("/scan");
    });
  });

  describe("2. isDemo Edge Cases & Adversarial Objects", () => {
    test("handles primitives, null, and undefined without throwing", () => {
      expect(isDemo(undefined)).toBe(false);
      expect(isDemo(null)).toBe(false);
      expect(isDemo("")).toBe(false);
      expect(isDemo(0)).toBe(false);
      expect(isDemo(1)).toBe(false);
      expect(isDemo(true)).toBe(false);
      expect(isDemo(false)).toBe(false);
      expect(isDemo(() => {})).toBe(false);
      expect(isDemo(Symbol("demo"))).toBe(false);
    });

    test("identifies demo users accurately across different flag variations", () => {
      expect(isDemo({ is_demo: true })).toBe(true);
      expect(isDemo({ isDemo: true })).toBe(true);
      expect(isDemo({ id: "u-manager-01" })).toBe(true);
      expect(isDemo({ companyId: "c-apex-01" })).toBe(true);
      expect(isDemo({ company_id: "c-apex-01" })).toBe(true);
    });

    test("rejects non-demo users even if fields have partial resemblance", () => {
      expect(isDemo({ is_demo: false, isDemo: false })).toBe(false);
      expect(isDemo({ is_demo: "true" })).toBe(false); // string "true" should not trigger boolean flag
      expect(isDemo({ id: "user-prod-99" })).toBe(false);
      expect(isDemo({ id: "custom-id" })).toBe(false);
      expect(isDemo({ companyId: "c-other-corp" })).toBe(false);
      expect(isDemo({})).toBe(false);
    });

    test("handles malformed objects with null/undefined properties without crashing", () => {
      expect(isDemo({ id: null, companyId: null, is_demo: null })).toBe(false);
      expect(isDemo({ id: undefined, isDemo: undefined })).toBe(false);
      expect(isDemo({ id: 12345 })).toBe(false);
    });
  });

  describe("3. getDemoUser Robustness & Property Contract", () => {
    test("returns a fully hydrated user object for known roles", () => {
      const roles: (UserRole | string)[] = ["SHIFT_MANAGER", "CONTROL_ROOM_MANAGER", "ADMIN", "WORKER"];
      for (const role of roles) {
        const demoUser = getDemoUser(role);
        expect(demoUser).toBeDefined();
        expect(demoUser.id).toBeDefined();
        expect(demoUser.authenticated).toBe(true);
        expect(demoUser.is_demo).toBe(true);
        expect(demoUser.isDemo).toBe(true);
        expect(demoUser.employee_id).toBeDefined();
        expect(demoUser.active_badge_id).toBeDefined();
        expect(demoUser.email).toContain("@");
        expect(demoUser.plant_unit).toBeDefined();
        expect(demoUser.defaultRoute).toMatch(/^\/(manager|control-room|admin|scan|worker)$/);
      }
    });

    test("safely defaults when given unknown or malformed role", () => {
      const fallbackUser = getDemoUser("NON_EXISTENT_ROLE");
      expect(fallbackUser).toBeDefined();
      expect(fallbackUser.authenticated).toBe(true);
      expect(fallbackUser.is_demo).toBe(true);
      expect(fallbackUser.email).toBeDefined();

      const nullFallback = getDemoUser(null as unknown as string);
      expect(nullFallback).toBeDefined();
      expect(nullFallback.authenticated).toBe(true);

      const emptyFallback = getDemoUser("");
      expect(emptyFallback).toBeDefined();
      expect(emptyFallback.authenticated).toBe(true);
    });
  });

  describe("4. Session Storage Resilience & Corrupt Data Recovery", () => {
    test("recovers cleanly from malformed JSON in sessionStorage", async () => {
      window.sessionStorage.setItem("h2s_auth_session", "{bad-json, invalid syntax");
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Must not crash and should clean up corrupt storage
      expect(result.current.user).toBeNull();
      expect(result.current.isDemo).toBe(false);
      expect(window.sessionStorage.getItem("h2s_auth_session")).toBeNull();
    });

    test("recovers cleanly from empty string in sessionStorage", async () => {
      window.sessionStorage.setItem("h2s_auth_session", "");
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.user).toBeNull();
      expect(result.current.isDemo).toBe(false);
    });

    test("recovers cleanly from JSON null or primitive strings", async () => {
      window.sessionStorage.setItem("h2s_auth_session", "null");
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toBeNull();
    });

    test("handles non-object JSON values like numbers, booleans, and arrays safely", async () => {
      window.sessionStorage.setItem("h2s_auth_session", "12345");
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      // 12345 is truthy, isDemo(12345) is false
      expect(result.current.isDemo).toBe(false);
    });

    test("handles sessionStorage throw errors during write (e.g. QuotaExceededError)", () => {
      const originalSetItem = window.sessionStorage.setItem;
      window.sessionStorage.setItem = jest.fn(() => {
        throw new Error("QuotaExceededError");
      });

      expect(() => {
        login({ id: "test-user" });
      }).not.toThrow();

      window.sessionStorage.setItem = originalSetItem;
    });

    test("standalone login() helper does not crash on null/undefined input", () => {
      expect(() => login(null)).not.toThrow();
      expect(() => login(undefined)).not.toThrow();
      expect(() => login("")).not.toThrow();
    });
  });

  describe("5. AuthProvider State Transitions & Offline Demo Login", () => {
    test("demoLogin falls back to local enriched mock user when backend is unreachable", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let userResult: unknown;
      await act(async () => {
        userResult = await result.current.demoLogin("manager");
      });

      expect(userResult).toBeDefined();
      expect(result.current.user).toBeDefined();
      expect(result.current.user?.role).toBe("SHIFT_MANAGER");
      expect(result.current.isDemo).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(window.sessionStorage.getItem("h2s_auth_session")).not.toBeNull();
    });

    test("demoLogin sets custom employee_id on fallback user if provided", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.demoLogin("employee", "EMP-CUSTOM-999");
      });

      expect(result.current.user?.employee_id).toBe("EMP-CUSTOM-999");
    });

    test("multiple rapid logins and logouts do not corrupt state", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => result.current.login(getDemoUser("SHIFT_MANAGER")));
      expect(result.current.user?.role).toBe("SHIFT_MANAGER");

      act(() => result.current.login(getDemoUser("ADMIN")));
      expect(result.current.user?.role).toBe("ADMIN");

      await act(async () => {
        await result.current.logout();
      });
      expect(result.current.user).toBeNull();
      expect(window.sessionStorage.getItem("h2s_auth_session")).toBeNull();
    });
  });

  describe("6. Extended useAuth Hook & Role Helper Flags", () => {
    test("computes helper booleans and hasRole correctly for all roles", async () => {
      const { result } = renderHook(() => useAuthHook(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Initially signed out
      expect(result.current.role).toBeNull();
      expect(result.current.isManager).toBe(false);
      expect(result.current.isControlRoom).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.hasRole(["SHIFT_MANAGER"])).toBe(false);

      // Login as SHIFT_MANAGER
      act(() => result.current.login(getDemoUser("SHIFT_MANAGER")));
      expect(result.current.role).toBe("SHIFT_MANAGER");
      expect(result.current.isManager).toBe(true);
      expect(result.current.isControlRoom).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.hasRole(["SHIFT_MANAGER", "ADMIN"])).toBe(true);
      expect(result.current.hasRole(["WORKER"])).toBe(false);

      // Login as CONTROL_ROOM_MANAGER
      act(() => result.current.login(getDemoUser("CONTROL_ROOM_MANAGER")));
      expect(result.current.role).toBe("CONTROL_ROOM_MANAGER");
      expect(result.current.isManager).toBe(false);
      expect(result.current.isControlRoom).toBe(true);
      expect(result.current.isAdmin).toBe(false);

      // Login as ADMIN
      act(() => result.current.login(getDemoUser("ADMIN")));
      expect(result.current.role).toBe("ADMIN");
      expect(result.current.isAdmin).toBe(true);

      // Adversarial hasRole inputs
      expect(result.current.hasRole([])).toBe(false);
      expect(result.current.hasRole(["UNKNOWN_ROLE"])).toBe(false);
    });
  });

  describe("7. AuthGuard Component Boundary Stress Test", () => {
    test("shows fallback/spinner when loading", () => {
      render(
        <AuthProvider>
          <AuthGuard fallback={<div>Custom Loading...</div>}>
            <div>Protected Content</div>
          </AuthGuard>
        </AuthProvider>
      );
      expect(screen.getByText("Custom Loading...")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    test("redirects unauthenticated user to /login and renders null", async () => {
      render(
        <AuthProvider>
          <AuthGuard>
            <div>Secret Content</div>
          </AuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/login");
      });
      expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
    });

    test("renders children when user role satisfies requiredRoles", async () => {
      window.sessionStorage.setItem(
        "h2s_auth_session",
        JSON.stringify(getDemoUser("SHIFT_MANAGER"))
      );

      render(
        <AuthProvider>
          <AuthGuard requiredRoles={["SHIFT_MANAGER", "ADMIN"]}>
            <div>Manager Protected Data</div>
          </AuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Manager Protected Data")).toBeInTheDocument();
      });
    });

    test("renders Access Denied when user role does not satisfy requiredRoles", async () => {
      window.sessionStorage.setItem(
        "h2s_auth_session",
        JSON.stringify(getDemoUser("WORKER"))
      );

      render(
        <AuthProvider>
          <AuthGuard requiredRoles={["SHIFT_MANAGER", "ADMIN"]}>
            <div>Manager Only Data</div>
          </AuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Access Denied")).toBeInTheDocument();
        expect(screen.getByText(/does not have permission to access this page/)).toBeInTheDocument();
      });
      expect(screen.queryByText("Manager Only Data")).not.toBeInTheDocument();
    });

    test("handles malformed user role without crashing", async () => {
      const corruptUser = {
        ...getDemoUser("WORKER"),
        role: null,
      };
      window.sessionStorage.setItem("h2s_auth_session", JSON.stringify(corruptUser));

      render(
        <AuthProvider>
          <AuthGuard requiredRoles={["SHIFT_MANAGER"]}>
            <div>Protected</div>
          </AuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Access Denied")).toBeInTheDocument();
      });
    });
  });

  describe("8. AppShell Component Boundary Stress Test", () => {
    test("renders navigation and user badge correctly for Shift Manager", async () => {
      window.sessionStorage.setItem(
        "h2s_auth_session",
        JSON.stringify(getDemoUser("SHIFT_MANAGER"))
      );

      render(
        <AuthProvider>
          <AppShell>
            <div>Dashboard Content</div>
          </AppShell>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Employees")).toBeInTheDocument();
        expect(screen.getByText("Incidents")).toBeInTheDocument();
        expect(screen.getByText(/SHIFT MANAGER/i)).toBeInTheDocument();
      });
    });

    test("renders worker navigation for Worker role", async () => {
      window.sessionStorage.setItem(
        "h2s_auth_session",
        JSON.stringify(getDemoUser("WORKER"))
      );

      render(
        <AuthProvider>
          <AppShell>
            <div>Worker Content</div>
          </AppShell>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Worker Content")).toBeInTheDocument();
        expect(screen.getByText("Scan Check-in")).toBeInTheDocument();
        expect(screen.getByText("My History")).toBeInTheDocument();
      });
    });

    test("renders Access Denied in AppShell if requiredRoles are not met", async () => {
      window.sessionStorage.setItem(
        "h2s_auth_session",
        JSON.stringify(getDemoUser("WORKER"))
      );

      render(
        <AuthProvider>
          <AppShell>
            <div>Restricted Panel</div>
          </AppShell>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Access Denied")).toBeInTheDocument();
      });
      expect(screen.queryByText("Restricted Panel")).not.toBeInTheDocument();
    });

    test("handles role mapping aliases like MANAGER vs SHIFT_MANAGER", async () => {
      const user = {
        ...getDemoUser("SHIFT_MANAGER"),
        role: "MANAGER",
      };
      window.sessionStorage.setItem("h2s_auth_session", JSON.stringify(user));

      render(
        <AuthProvider>
          <AppShell>
            <div>Manager View</div>
          </AppShell>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Manager View")).toBeInTheDocument();
      });
    });
  });
});

