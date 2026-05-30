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
      { name: "Catalog & Pricing",  href: "/admin/catalog-manager",   icon: Package },
      { name: "Hardware Inventory", href: "/admin/products",          icon: Package },
      { name: "Data Management",    href: "/admin/products/bulk",     icon: Database },
      { name: "Compatibility",      href: "/admin/compatibility",     icon: Link2 },
      { name: "Catalog Health",     href: "/admin/products/health",   icon: HeartPulse },
      { name: "Live Pricing",       href: "/admin/pricing",          icon: IndianRupee },
      { name: "Geo-Pricing Rules",  href: "/admin/pricing/geo-rules", icon: MapPin },
      { name: "Quotation Matrices", href: "/admin/pricing/matrices",  icon: Grid3x3 },
      { name: "Rules & Add-ons",    href: "/admin/rules",            icon: Zap },
      { name: "Card Layouts",       href: "/admin/card-layouts",     icon: Workflow },
    ],
  },
  {
    label: "Operations Network",
    items: [
      { name: "Dispatch Center",    href: "/admin/dispatch",         icon: Workflow },
      { name: "City Hubs",          href: "/admin/hubs",             icon: Building2 },
      { name: "Verified Installers",href: "/admin/installers",       icon: ShieldCheck },
      { name: "Promoters",         href: "/admin/promoters",   icon: BadgeDollarSign },
      { name: "Ledger & Payouts",  href: "/admin/commission",  icon: FileBox },
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
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 bg-popover text-popover-foreground text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-md border border-border opacity-0 group-hover/tooltip:opacity-100 scale-95 group-hover/tooltip:scale-100 transition-all duration-200 origin-left">
        {label}
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
        bg-sidebar border-r border-sidebar-border text-sidebar-foreground
        transition-all duration-300 ease-in-out shrink-0
      `}
    >
      {/* ── BRAND HEADER ──────────────────────────────────────────────────── */}
      <div className="relative h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-none mb-1">TEAM CCTV</p>
                <p className="text-sm font-semibold leading-tight tracking-tight truncate">Command Centre</p>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-all"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full flex justify-center">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-all"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* ── NAVIGATION GROUPS ─────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-none">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!isCollapsed ? (
              <p className="text-[11px] font-medium text-sidebar-foreground/50 px-3 mb-2 tracking-wide">
                {group.label}
              </p>
            ) : (
              group.label !== "Overview" && (
                <div className="h-px bg-sidebar-border my-3 mx-2" />
              )
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                const linkContent = (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      relative flex items-center gap-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200
                      ${isCollapsed ? "justify-center px-0 mx-1" : "px-3"}
                      ${active
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }
                    `}
                  >
                    <Icon className={`w-[18px] h-[18px] transition-transform duration-200 ${active ? "scale-105" : ""}`} />
                    {!isCollapsed && <span className="truncate flex-1">{item.name}</span>}
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
      <div className="p-3 border-t border-sidebar-border shrink-0 space-y-2">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-success/10 border border-success/20">
            <div className="w-2 h-2 bg-success rounded-full" />
            <span className="text-xs font-medium text-success">All Systems Nominal</span>
          </div>
        ) : (
          <NavTooltip label="All Systems Nominal">
            <div className="flex justify-center py-2">
              <div className="w-2 h-2 bg-success rounded-full" />
            </div>
          </NavTooltip>
        )}

        {isCollapsed ? (
          <NavTooltip label="Secure Logout">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex justify-center py-2 rounded-lg text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <LogOut className={`w-[18px] h-[18px] ${loggingOut ? "animate-spin" : ""}`} />
            </button>
          </NavTooltip>
        ) : (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <LogOut className={`w-[18px] h-[18px] ${loggingOut ? "animate-spin" : ""}`} />
            <span>{loggingOut ? "Signing out..." : "Secure Logout"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
