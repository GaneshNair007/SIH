"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/components/auth/AuthGuard";
import AssistantDrawer from "@/components/layout/AssistantDrawer";
import type { UserRole } from "@/types/domain";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const MANAGER_NAV: NavItem[] = [
  { href: "/manager", label: "Overview", icon: <IconGrid /> },
  { href: "/manager/scan", label: "Scan", icon: <IconScan /> },
  { href: "/manager/workers", label: "Workers", icon: <IconUsers /> },
  { href: "/manager/bands", label: "Bands", icon: <IconBand /> },
  { href: "/manager/shifts", label: "Shifts", icon: <IconClock /> },
];

const CONTROL_ROOM_NAV: NavItem[] = [
  { href: "/control-room", label: "Overview", icon: <IconGrid /> },
  { href: "/control-room/workers", label: "Workers", icon: <IconUsers /> },
  { href: "/control-room/regions", label: "Regions", icon: <IconMap /> },
  { href: "/control-room/shifts", label: "Shifts", icon: <IconClock /> },
  { href: "/control-room/bands", label: "Bands", icon: <IconBand /> },
  { href: "/control-room/analytics", label: "Analytics", icon: <IconChart /> },
  { href: "/control-room/alerts", label: "Alerts", icon: <IconBell /> },
  { href: "/control-room/reports", label: "Reports", icon: <IconFile /> },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <IconGrid /> },
  { href: "/admin/users", label: "Users", icon: <IconUsers /> },
  { href: "/admin/company", label: "Company", icon: <IconBuilding /> },
  { href: "/admin/locations", label: "Locations", icon: <IconMap /> },
  { href: "/admin/calibration", label: "Calibration", icon: <IconScience /> },
  { href: "/admin/thresholds", label: "Thresholds", icon: <IconSlider /> },
  { href: "/admin/audit", label: "Audit Log", icon: <IconFile /> },
];

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "SHIFT_MANAGER": return MANAGER_NAV;
    case "CONTROL_ROOM_MANAGER": return CONTROL_ROOM_NAV;
    case "ADMIN": return ADMIN_NAV;
    default: return MANAGER_NAV;
  }
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "SHIFT_MANAGER": return "Shift Manager";
    case "CONTROL_ROOM_MANAGER": return "Control Room";
    case "ADMIN": return "Administrator";
    default: return role;
  }
}

interface AppShellProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export default function AppShell({ children, requiredRoles }: AppShellProps) {
  return (
    <AuthGuard requiredRoles={requiredRoles}>
      <AppShellInner>{children}</AppShellInner>
    </AuthGuard>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isDemo } = useAuth();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!user) return null;

  const navItems = getNavItems(user.role);
  const isManager = user.role === "SHIFT_MANAGER";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/manager" || href === "/control-room" || href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop Sidebar (Control Room / Admin) */}
      {!isManager && (
        <>
          <aside className={`sidebar hidden lg:flex`}>
            {/* Brand */}
            <div className="p-5 border-b border-border">
              <Link href="/" className="flex items-center gap-2 text-sm font-serif font-semibold text-charcoal">
                <span className="w-6 h-6 rounded-full bg-teal flex items-center justify-center text-white text-[9px] font-bold">H₂S</span>
                <span>Dose Wristband</span>
              </Link>
              <div className="mt-2 badge-teal text-[10px]">{getRoleLabel(user.role)}</div>
              {isDemo && <div className="mt-1 badge-elevated text-[10px]">Demo Mode</div>}
            </div>

            {/* Nav items */}
            <nav className="flex-1 py-3 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-item ${isActive(item.href) ? "active" : ""}`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User / Logout */}
            <div className="p-4 border-t border-border">
              <div className="text-xs text-muted mb-1">{user.name}</div>
              <div className="text-xs text-muted-light mb-3">{user.companyName}</div>
              <button onClick={handleLogout} className="btn-ghost text-xs w-full justify-start text-hazard-high hover:text-hazard-critical">
                <IconLogout /> Sign out
              </button>
            </div>
          </aside>

          {/* Mobile sidebar overlay */}
          {mobileSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/30" onClick={() => setMobileSidebarOpen(false)} />
              <aside className="absolute left-0 top-0 h-full w-64 bg-canvas-white border-r border-border flex flex-col">
                <div className="p-5 border-b border-border flex justify-between items-center">
                  <span className="text-sm font-serif font-semibold text-charcoal">Menu</span>
                  <button onClick={() => setMobileSidebarOpen(false)} className="text-muted hover:text-charcoal">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>
                  </button>
                </div>
                <nav className="flex-1 py-3 overflow-y-auto">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`sidebar-item ${isActive(item.href) ? "active" : ""}`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="p-4 border-t border-border">
                  <button onClick={handleLogout} className="btn-ghost text-xs w-full justify-start text-hazard-high">
                    <IconLogout /> Sign out
                  </button>
                </div>
              </aside>
            </div>
          )}
        </>
      )}

      {/* Header */}
      <header className={`fixed top-0 right-0 z-40 bg-canvas-white/90 backdrop-blur-sm border-b border-border ${!isManager ? "left-0 lg:left-64" : "left-0"}`}>
        <div className="px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {!isManager && (
              <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden text-muted hover:text-charcoal">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/></svg>
              </button>
            )}
            {isManager && (
              <Link href="/" className="flex items-center gap-2 text-sm font-serif font-semibold text-charcoal">
                <span className="w-6 h-6 rounded-full bg-teal flex items-center justify-center text-white text-[9px] font-bold">H₂S</span>
              </Link>
            )}
            <span className="text-sm font-medium text-charcoal">{getRoleLabel(user.role)}</span>
            {isDemo && <span className="badge-elevated text-[10px]">Demo</span>}
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-muted">{dateStr} · {timeStr}</span>
            <span className="hidden sm:inline text-xs text-muted-light">{user.companyName}</span>
            {isManager && (
              <button onClick={handleLogout} className="text-xs text-muted hover:text-hazard-high transition-colors flex items-center gap-1">
                <IconLogout /> <span className="hidden sm:inline">Sign out</span>
              </button>
            )}
          </div>
        </div>

        {/* Manager bottom nav (mobile) */}
        {isManager && (
          <nav className="md:hidden flex border-t border-border bg-canvas-white">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] ${
                  isActive(item.href) ? "text-teal" : "text-muted"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Manager desktop nav */}
        {isManager && (
          <nav className="hidden md:flex border-t border-border px-5 sm:px-8 bg-canvas-white">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 ${
                  isActive(item.href)
                    ? "text-teal border-teal"
                    : "text-muted border-transparent hover:text-charcoal"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className={`pt-14 ${isManager ? "md:pt-[6.5rem]" : "lg:ml-64"} min-h-screen`}>
        <div className="p-5 sm:p-8">
          {isDemo && (
            <div className="mb-5 flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between" role="status">
              <strong>DEMO MODE — synthetic workers and simulated calibration data</strong>
              <span>Device-local state · not a live gas feed</span>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Assistant FAB */}
      <button
        onClick={() => setAssistantOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-teal text-white shadow-elevated hover:bg-teal-light transition-all z-30 flex items-center justify-center"
        aria-label="Open platform assistant"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </button>

      {/* Assistant drawer */}
      <AssistantDrawer open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}

/* ─── Icon Components ────────────────────────── */
function IconGrid() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>; }
function IconScan() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 5V3a1 1 0 011-1h2M11 2h2a1 1 0 011 1v2M14 11v2a1 1 0 01-1 1h-2M5 14H3a1 1 0 01-1-1v-2M2 8h12"/></svg>; }
function IconUsers() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-2.8 2.2-5 5-5s5 2.2 5 5"/><circle cx="12" cy="5" r="2"/><path d="M14 14c0-1.7-1-3.2-2.5-4"/></svg>; }
function IconBand() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="10" height="6" rx="3"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/></svg>; }
function IconClock() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></svg>; }
function IconMap() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 3l5-1 4 2 5-1v10l-5 1-4-2-5 1V3z"/><line x1="6" y1="2" x2="6" y2="12"/><line x1="10" y1="4" x2="10" y2="14"/></svg>; }
function IconChart() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 14V6l4 3 4-6 4 4"/></svg>; }
function IconBell() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6a4 4 0 018 0c0 4 2 5 2 5H2s2-1 2-5"/><path d="M6.5 13a1.5 1.5 0 003 0"/></svg>; }
function IconFile() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2h5l5 5v7a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M9 2v5h5"/></svg>; }
function IconBuilding() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="2" width="10" height="12" rx="1"/><line x1="6" y1="5" x2="6" y2="5.01"/><line x1="8" y1="5" x2="8" y2="5.01"/><line x1="10" y1="5" x2="10" y2="5.01"/><line x1="6" y1="8" x2="6" y2="8.01"/><line x1="8" y1="8" x2="8" y2="8.01"/><line x1="10" y1="8" x2="10" y2="8.01"/><rect x="6" y="11" width="4" height="3"/></svg>; }
function IconScience() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2v4L2 13a1 1 0 001 1h10a1 1 0 001-1L10 6V2"/><line x1="5" y1="2" x2="11" y2="2"/><path d="M5 9h6"/></svg>; }
function IconSlider() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="2" y1="4" x2="14" y2="4"/><circle cx="5" cy="4" r="1.5"/><line x1="2" y1="8" x2="14" y2="8"/><circle cx="10" cy="8" r="1.5"/><line x1="2" y1="12" x2="14" y2="12"/><circle cx="7" cy="12" r="1.5"/></svg>; }
function IconLogout() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M6 8h8"/></svg>; }
