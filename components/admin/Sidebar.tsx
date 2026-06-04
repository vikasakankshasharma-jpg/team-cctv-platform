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
  Menu,
  X,
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
      { name: "Leads & CRM",    href: "/admin/leads",        icon: Users, badge: "12" },
      { name: "Expansion Hub",  href: "/admin/expansion",    icon: MapPin, badge: "247", badgeNew: true },
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
      { name: "Vendor Import Engine", href: "/admin/vendor-import",       icon: Package },
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
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 bg-[#212B3F] text-[#E8EDF5] text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-md border border-[#263550] opacity-0 group-hover/tooltip:opacity-100 scale-95 group-hover/tooltip:scale-100 transition-all duration-200 origin-left">
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
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const sidebarContent = (
    <div className={`sidebar ${isCollapsed ? "w-[72px]" : "w-[220px]"} transition-all duration-300 admin-theme`} style={isCollapsed ? { width: '72px' } : {}}>
      {/* ── BRAND HEADER ──────────────────────────────────────────────────── */}
      <div className="sb-logo flex items-center justify-between">
        {!isCollapsed ? (
          <>
            <div className="sb-brand">
              <div className="sb-icon">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="sb-name truncate">CCTVQuotation</div>
                <div className="sb-sub truncate">Admin Panel</div>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-md hover:bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] transition-all ml-1"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full flex justify-center">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-md hover:bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] transition-all"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* ── NAVIGATION GROUPS ─────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-none">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!isCollapsed ? (
              <div className="sb-section">
                {group.label}
              </div>
            ) : (
              group.label !== "Overview" && (
                <div className="h-px bg-[var(--border)] my-3 mx-2" />
              )
            )}

            <div className="space-y-[1px]">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                const linkContent = (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`sb-item ${active ? 'active' : ''} ${isCollapsed ? 'justify-center px-0 mx-2' : ''}`}
                  >
                    <Icon className={`w-[15px] h-[15px] transition-transform duration-200 ${active ? "scale-105" : ""}`} />
                    {!isCollapsed && <span className="truncate flex-1">{item.name}</span>}
                    {!isCollapsed && item.badge && (
                       <span className={`sb-badge ${item.badgeNew ? 'new' : ''}`}>{item.badge}</span>
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
      <div className="sb-spacer"></div>
      
      {isCollapsed ? (
        <NavTooltip label="Secure Logout">
          <div className="sb-user justify-center" onClick={handleLogout}>
             <LogOut className={`w-[15px] h-[15px] text-[var(--dim)] hover:text-[var(--red)] ${loggingOut ? "animate-spin" : ""}`} />
          </div>
        </NavTooltip>
      ) : (
        <div className="sb-user" onClick={handleLogout}>
          <div className="sb-avatar">A</div>
          <div className="flex-1 min-w-0">
            <div className="sb-user-name truncate">Admin User</div>
            <div className="sb-user-role truncate">{loggingOut ? "Signing out..." : "Secure Logout"}</div>
          </div>
          <LogOut className="w-[14px] h-[14px] text-[var(--dim)]" />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile header bar with hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4" style={{ background: '#0A0E1A', borderBottom: '1px solid #1E2D45' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,149,58,0.12)' }}>
            <ShieldCheck className="w-4 h-4" style={{ color: '#D4953A' }} />
          </div>
          <span className="text-sm font-black" style={{ color: '#E8EDF5' }}>Admin</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#111827', color: '#8A98B4' }}>
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        {sidebarContent}
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-72 shadow-2xl animate-in slide-in-from-left duration-200" style={{ background: '#0A0E1A' }}>
            <div className="absolute top-4 right-4 z-10">
              <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#111827', color: '#8A98B4' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
