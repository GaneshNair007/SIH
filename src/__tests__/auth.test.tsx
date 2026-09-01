import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, getDefaultRoute, getDemoUser, useAuth } from "@/context/AuthContext";

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe("Authentication and isolated demo entry", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  test("starts signed out and does not invent a worker account", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.isDemo).toBe(false);
  });

  test.each(["SHIFT_MANAGER", "CONTROL_ROOM_MANAGER", "ADMIN"] as const)("demo %s uses the documented protected route", async (role) => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.login(getDemoUser(role)));
    expect(result.current.user?.role).toBe(role);
    expect(result.current.isDemo).toBe(true);
    expect(getDefaultRoute(role)).toMatch(/^\/(manager|control-room|admin)$/);
  });

  test("logout clears protected demo state", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.login(getDemoUser("SHIFT_MANAGER")));
    await act(async () => result.current.logout());
    expect(result.current.user).toBeNull();
    expect(window.sessionStorage.getItem("h2s_auth_session")).toBeNull();
  });
});
