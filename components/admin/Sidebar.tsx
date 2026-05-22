"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import {
  LayoutDashboard,
  Users,
  Package,
  Settings,
  LogOut,
  Blocks,
  FileBox,
  BadgeDollarSign,
  TrendingUp,
  Workflow,
  ShieldCheck,
  ChevronRight,
  Calendar,
  IndianRupee,
  Zap,
  Link2,
  Megaphone,
  Grid3x3,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Building2,
  HeartPulse,
  MapPin,
  Bell,
} from "lucide-react";

// ─── NAVIGATION STRUCTURE ─────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Sales Operations",
    items: [
      { name: "Leads & CRM",    href: "/admin/leads",        icon: Users },
      { name: "Expansion Hub",  href: "/admin/expansion",    icon: MapPin },
      { name: "Site Visits",    href: "/admin/bookings",     icon: Calendar },
      { name: "Campaigns",      href: "/admin/campaigns",    icon: Megaphone },
      { name: "Reports",        href: "/admin/reports",      icon: TrendingUp },
      { name: "Salespersons",   href: "/admin/salespersons", icon: ShieldCheck },
    ],
  },
  {
    label: "Product Catalog",
    items: [
      { name: "Products",           href: "/admin/products",          icon: Package },
      { name: "Data Management",    href: "/admin/products/bulk",     icon: Database },
      { name: "Compatibility",      href: "/admin/compatibility",     icon: Link2 },
      { name: "Catalog Health",     href: "/admin/products/health",   icon: HeartPulse },
      { name: "Live Pricing",       href: "/admin/pricing",          icon: IndianRupee },
      { name: "Quotation Matrices", href: "/admin/pricing/matrices",  icon: Grid3x3 },
      { name: "Rules & Add-ons",    href: "/admin/rules",            icon: Zap },
      { name: "Card Layouts",       href: "/admin/card-layouts",     icon: Workflow },
    ],
  },
  {
    label: "Financials",
    items: [
      { name: "Franchise Network", href: "/admin/franchises",  icon: Building2 },
      { name: "Promoters",         href: "/admin/promoters",   icon: BadgeDollarSign },
      { name: "Commission Ledger", href: "/admin/commission",  icon: FileBox },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings",   href: "/admin/settings",      icon: Settings },
      { name: "Audit Logs", href: "/admin/reports/logs",  icon: ShieldCheck },
    ],
  },
];

// ─── TOOLTIP WRAPPER ──────────────────────────────────────────────────────────

function NavTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 bg-zinc-900 dark:bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl whitespace-nowrap shadow-md border border-zinc-700/50 opacity-0 group-hover/tooltip:opacity-100 scale-90 group-hover/tooltip:scale-100 transition-all duration-200 origin-left">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-900 dark:border-r-zinc-800" />
      </div>
    </div>
  );
}

// ─── SIDEBAR COMPONENT ────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await auth.signOut();
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
      setLoggingOut(false);
    }
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <div
      className={`
        ${isCollapsed ? "w-[72px]" : "w-64"} 
        relative flex flex-col h-screen sticky top-0 overflow-hidden
        bg-white dark:bg-[#050505] border-r border-zinc-200 dark:border-zinc-800
        transition-all duration-300 ease-in-out shrink-0
      `}
    >
      {/* ── Subtle background texture */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-blue-500/[0.03] to-transparent dark:from-blue-500/[0.05]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-50/80 to-transparent dark:from-zinc-900/20" />
      </div>

      {/* ── BRAND HEADER ──────────────────────────────────────────────────── */}
      <div className="relative h-16 flex items-center justify-between px-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 overflow-hidden">
        {/* Brand glow */}
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-20 h-20 bg-blue-500/10 dark:bg-blue-500/20 blur-2xl rounded-full pointer-events-none" />

        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 relative z-10">
              {/* Logo */}
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950 shadow-sm shadow-emerald-500/50" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-[0.35em] leading-none">TEAM CCTV</p>
                <p className="text-sm font-black text-zinc-900 dark:text-white leading-tight tracking-tight truncate">Command Centre</p>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="relative z-10 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 shrink-0 transition-all hover:scale-110 active:scale-95"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full flex justify-center relative z-10">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:scale-110 active:scale-95"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* ── NAVIGATION GROUPS ─────────────────────────────────────────────── */}
      <nav className="relative z-10 flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-none">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Section Label */}
            {!isCollapsed ? (
              <p className="text-[8px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.35em] px-3 mb-2 leading-none">
                {group.label}
              </p>
            ) : (
              group.label !== "Overview" && (
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-100 dark:via-zinc-800/60 to-transparent my-3 mx-1" />
              )
            )}

            {/* Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                const linkContent = (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      relative flex items-center gap-3 py-2.5 rounded-2xl
                      font-black text-[11px] uppercase tracking-wider
                      transition-all duration-200 group/item
                      ${isCollapsed ? "justify-center px-0 mx-1" : "px-3"}
                      ${active
                        ? "bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-600/15 dark:to-blue-600/5 text-blue-700 dark:text-blue-400 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      }
                    `}
                  >
                    {/* Animated active left indicator */}
                    <div className={`
                      absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full
                      bg-gradient-to-b from-blue-400 to-blue-700 dark:from-blue-400 dark:to-blue-600
                      shadow-[0_0_10px_rgba(59,130,246,0.6)]
                      transition-all duration-300
                      ${active ? "h-6 opacity-100" : "h-0 opacity-0"}
                    `} />

                    {/* Icon container */}
                    <div className={`
                      w-7 h-7 rounded-xl flex items-center justify-center shrink-0
                      transition-all duration-200
                      ${active
                        ? "bg-blue-600/15 dark:bg-blue-500/20 shadow-inner"
                        : "bg-zinc-50 dark:bg-zinc-900 group-hover/item:bg-white dark:group-hover/item:bg-zinc-800 group-hover/item:shadow-sm"
                      }
                    `}>
                      <Icon className={`w-3.5 h-3.5 transition-transform duration-200 ${active ? "scale-110" : "group-hover/item:scale-110"}`} />
                    </div>

                    {!isCollapsed && <span className="truncate flex-1 leading-none">{item.name}</span>}

                    {!isCollapsed && active && (
                      <ChevronRight className="w-3 h-3 text-blue-500/60 shrink-0 animate-pulse" />
                    )}
                  </Link>
                );

                return isCollapsed ? (
                  <NavTooltip key={item.name} label={item.name}>
                    {linkContent}
                  </NavTooltip>
                ) : (
                  <div key={item.name}>{linkContent}</div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 p-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0 space-y-2">
        {/* System Status */}
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-500/5 dark:to-teal-500/5 border border-emerald-100 dark:border-emerald-500/10">
            <div className="relative shrink-0">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-60" />
            </div>
            <span className="text-[8px] font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-[0.2em]">All Systems Nominal</span>
          </div>
        ) : (
          <NavTooltip label="All Systems Nominal">
            <div className="flex justify-center py-1">
              <div className="relative">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-60" />
              </div>
            </div>
          </NavTooltip>
        )}

        {/* Logout */}
        {isCollapsed ? (
          <NavTooltip label="Secure Logout">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex justify-center py-2.5 rounded-2xl text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all group/out disabled:opacity-50"
            >
              <div className="w-7 h-7 rounded-xl bg-zinc-50 dark:bg-zinc-900 group-hover/out:bg-red-50 dark:group-hover/out:bg-red-500/10 flex items-center justify-center transition-colors">
                <LogOut className={`w-3.5 h-3.5 ${loggingOut ? "animate-spin" : ""}`} />
              </div>
            </button>
          </NavTooltip>
        ) : (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 group/out text-left disabled:opacity-50"
          >
            <div className="w-7 h-7 rounded-xl bg-zinc-50 dark:bg-zinc-900 group-hover/out:bg-red-50 dark:group-hover/out:bg-red-500/10 flex items-center justify-center shrink-0 transition-colors">
              <LogOut className={`w-3.5 h-3.5 ${loggingOut ? "animate-spin" : ""}`} />
            </div>
            <span>{loggingOut ? "Signing out..." : "Secure Logout"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
