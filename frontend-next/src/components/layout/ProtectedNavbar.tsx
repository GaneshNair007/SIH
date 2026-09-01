"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, ShieldCheck, User, Activity, Layers, Home, GitFork } from "lucide-react";
import { PROJECT_NAME } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const getWorkspaceTitle = () => {
    if (pathname.startsWith("/manager")) return "Shift Manager Workspace";
    if (pathname.startsWith("/control-room")) return "Control Room Overview";
    if (pathname.startsWith("/workers")) return "Worker Dosimetry Dossier";
    if (pathname.startsWith("/admin")) return "Platform Administration";
    return "Operations Workspace";
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-charcoal text-white border-b border-dark-surface px-4 lg:px-8 flex items-center justify-between shadow-md">
      {/* Brand & Workspace Label */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display text-2xl tracking-tight uppercase text-white flex items-center">
            {PROJECT_NAME}
            <span className="text-yellow-golden text-3xl leading-none">.</span>
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-charcoal-card rounded-md border border-dark-surface text-xs text-sage">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-white">{getWorkspaceTitle()}</span>
        </div>
      </div>

      {/* Primary Links */}
      <nav className="hidden md:flex items-center gap-6">
        <Link
          href="/"
          className="text-xs font-medium text-sage hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <Link
          href="/working"
          className="text-xs font-medium text-sage hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <GitFork className="w-3.5 h-3.5" />
          <span>Pipeline</span>
        </Link>
        <span className="text-dark-surface">|</span>
        <Link
          href="/manager"
          className={`text-xs font-medium px-2.5 py-1.5 rounded transition-colors ${
            pathname.startsWith("/manager")
              ? "bg-teal-deep text-white font-semibold"
              : "text-sage hover:text-white hover:bg-charcoal-card"
          }`}
        >
          Manager
        </Link>
        <Link
          href="/control-room"
          className={`text-xs font-medium px-2.5 py-1.5 rounded transition-colors ${
            pathname.startsWith("/control-room")
              ? "bg-teal-deep text-white font-semibold"
              : "text-sage hover:text-white hover:bg-charcoal-card"
          }`}
        >
          Control Room
        </Link>
        <Link
          href="/workers/EMP-1042"
          className={`text-xs font-medium px-2.5 py-1.5 rounded transition-colors ${
            pathname.startsWith("/workers")
              ? "bg-teal-deep text-white font-semibold"
              : "text-sage hover:text-white hover:bg-charcoal-card"
          }`}
        >
          Worker Profile
        </Link>
        <Link
          href="/admin"
          className={`text-xs font-medium px-2.5 py-1.5 rounded transition-colors ${
            pathname.startsWith("/admin")
              ? "bg-teal-deep text-white font-semibold"
              : "text-sage hover:text-white hover:bg-charcoal-card"
          }`}
        >
          Admin
        </Link>
      </nav>

      {/* User Info & Logout */}
      <div className="hidden md:flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-white leading-tight">{user.full_name}</div>
              <div className="text-[10px] text-sage-light tracking-wide">{user.role} · {user.plant_unit}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-sage hover:text-yellow-golden hover:bg-charcoal-card rounded-md border border-dark-surface transition-colors"
              title="Logout session"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs px-3 py-1.5 bg-yellow-golden text-charcoal font-semibold rounded hover:bg-yellow-hover transition-colors"
          >
            Login
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden p-2 text-sage hover:text-white rounded"
        aria-label="Toggle Navigation Menu"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-charcoal-dark border-b border-dark-surface p-4 flex flex-col gap-3 shadow-2xl">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="text-sm text-sage hover:text-white py-1 flex items-center gap-2"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
          <Link
            href="/working"
            onClick={() => setMobileOpen(false)}
            className="text-sm text-sage hover:text-white py-1 flex items-center gap-2"
          >
            <GitFork className="w-4 h-4" /> Pipeline
          </Link>
          <div className="border-t border-dark-surface my-1" />
          <Link
            href="/manager"
            onClick={() => setMobileOpen(false)}
            className="text-sm text-white py-1"
          >
            Manager Dashboard
          </Link>
          <Link
            href="/control-room"
            onClick={() => setMobileOpen(false)}
            className="text-sm text-white py-1"
          >
            Control Room
          </Link>
          <Link
            href="/workers/EMP-1042"
            onClick={() => setMobileOpen(false)}
            className="text-sm text-white py-1"
          >
            Worker Profile (EMP-1042)
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="text-sm text-white py-1"
          >
            Administration
          </Link>
          <div className="border-t border-dark-surface my-1 pt-2 flex justify-between items-center">
            <span className="text-xs text-sage">{user?.full_name || "Guest"}</span>
            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="text-xs text-yellow-golden flex items-center gap-1 font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
