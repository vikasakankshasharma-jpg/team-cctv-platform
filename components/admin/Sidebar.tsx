"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import { toast } from "sonner";
import { useOmniSearchStore } from "@/store/omni-search";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  LayoutDashboard, Users, Package, Settings, LogOut,
  FileBox, BadgeDollarSign, TrendingUp, Workflow, ShieldCheck,
  Calendar, IndianRupee, Zap, Link2, Megaphone,
  Grid3x3, PanelLeftClose, PanelLeftOpen, Database, Building2,
  HeartPulse, MapPin, Menu, X, Sparkles, Navigation,
  FileSpreadsheet, Filter, Search, CreditCard
} from "lucide-react";

// ─── REORGANIZED 7-PILLAR NAVIGATION STRUCTURE ────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Overview & Pipeline",
    items: [
      { name: "Executive Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Quote Funnel", href: "/admin/analytics/funnel", icon: Filter },
      { name: "Analytics Trends", href: "/admin/analytics", icon: TrendingUp },
    ],
  },
  {
    label: "Sales & CRM",
    items: [
      { name: "Leads Pipeline", href: "/admin/leads", icon: Users },
      { name: "Site Visits & Surveys", href: "/admin/bookings", icon: Calendar },
      { name: "AMC Contracts", href: "/admin/amc", icon: ShieldCheck },
      { name: "Sales Representatives", href: "/admin/salespersons", icon: Navigation },
    ],
  },
  {
    label: "Pricing & Margins",
    items: [
      { name: "Quotation Matrices", href: "/admin/pricing/matrices", icon: Grid3x3 },
      { name: "Geo-Surge & Pincodes", href: "/admin/pricing/geo-rules", icon: MapPin },
      { name: "Add-ons & Options", href: "/admin/addons", icon: Zap },
      { name: "Recommendation Logic", href: "/admin/rules", icon: Workflow },
      { name: "Compatibility Matrix", href: "/admin/compatibility", icon: Link2 },
      { name: "Live Pricing Engine", href: "/admin/pricing", icon: IndianRupee },
    ],
  },
  {
    label: "Hardware Catalog",
    items: [
      { name: "Product Master", href: "/admin/products", icon: Package },
      { name: "Warehouse Stock & POs", href: "/admin/inventory", icon: Database },
      { name: "Vendor Price Import", href: "/admin/vendor-import", icon: FileSpreadsheet },
      { name: "Catalog Quality Health", href: "/admin/products/health", icon: HeartPulse },
    ],
  },
  {
    label: "Field Operations",
    items: [
      { name: "Dispatch & Live Jobs", href: "/admin/dispatch", icon: Workflow },
      { name: "Verified Technicians", href: "/admin/installers", icon: ShieldCheck },
      { name: "City Inventory Hubs", href: "/admin/hubs", icon: Building2 },
      { name: "Territory Beat Plans", href: "/admin/beat-plans", icon: Navigation },
    ],
  },
  {
    label: "Promoters & Growth",
    items: [
      { name: "Promoter Network", href: "/admin/promoters", icon: BadgeDollarSign },
      { name: "Follow-Up Campaigns", href: "/admin/campaigns", icon: Sparkles },
      { name: "Marketing Collaterals", href: "/admin/marketing", icon: Megaphone },
      { name: "Regional Expansion", href: "/admin/expansion", icon: MapPin },
    ],
  },
  {
    label: "Finance & System",
    items: [
      { name: "Profitability Heatmaps", href: "/admin/analytics/profitability", icon: TrendingUp },
      { name: "Accounts Payable", href: "/admin/finance", icon: IndianRupee },
      { name: "Cloud Costs & Budgets", href: "/admin/finance/billing", icon: CreditCard },
      { name: "All Reports & Export", href: "/admin/reports", icon: FileBox },
      { name: "Global Settings", href: "/admin/settings", icon: Settings },
      { name: "Staff & Audit Trail", href: "/admin/staff", icon: ShieldCheck },
    ],
  },
];

// ─── TOOLTIP WRAPPER ──────────────────────────────────────────────────────────
function NavTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 bg-[var(--surface)] text-[var(--text)] text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-[var(--border2)] opacity-0 group-hover/tooltip:opacity-100 scale-95 group-hover/tooltip:scale-100 transition-all duration-200 origin-left">
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
  const { setIsOpen: setOmniSearchOpen } = useOmniSearchStore();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await auth.signOut();
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed. Please try again.");
      setLoggingOut(false);
    }
  };

  const allNavHrefs = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));

  const isActive = (href: string) => {
    if (pathname === href) return true;
    if (href === "/admin") return false;
    if (pathname.startsWith(href + "/")) {
      const hasBetterMatch = allNavHrefs.some(
        (other) =>
          other !== href &&
          (pathname === other || (pathname.startsWith(other + "/") && other.length > href.length))
      );
      return !hasBetterMatch;
    }
    return false;
  };

  // Dynamic label for mobile topbar breadcrumb
  const currentNavName = (() => {
    for (const grp of NAV_GROUPS) {
      for (const itm of grp.items) {
        if (isActive(itm.href)) return itm.name;
      }
    }
    return "Admin";
  })();

  const desktopSidebarContent = (
    <div
      className={`sidebar ${isCollapsed ? "w-[72px]" : "w-[230px]"} transition-all duration-300 admin-theme h-screen flex flex-col`}
      style={isCollapsed ? { width: "72px" } : {}}
    >
      {/* ── BRAND HEADER ──────────────────────────────────────────────────── */}
      <div className="sb-logo flex items-center justify-between shrink-0">
        {!isCollapsed ? (
          <>
            <div className="sb-brand">
              <div className="sb-icon">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="sb-name truncate">CCTVQuotation</div>
                <div className="sb-sub truncate">Admin Console</div>
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
      <nav className="flex-1 min-h-0 overflow-y-auto py-2 scrollbar-none space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {!isCollapsed ? (
              <div className="sb-section px-3 text-[10px] uppercase font-bold tracking-wider text-[var(--muted)]">
                {group.label}
              </div>
            ) : (
              group.label !== "Overview & Pipeline" && (
                <div className="h-px bg-[var(--border)] my-2 mx-3" />
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
                    className={`sb-item ${active ? "active font-semibold" : ""} ${
                      isCollapsed ? "justify-center px-0 mx-2" : ""
                    }`}
                  >
                    <Icon
                      className={`w-[15px] h-[15px] shrink-0 transition-transform duration-200 ${
                        active ? "scale-105 text-primary" : ""
                      }`}
                    />
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
      <div className="shrink-0 border-t border-[var(--border)] pt-2 pb-2">
        {isCollapsed ? (
          <NavTooltip label="Secure Logout">
            <div
              className="sb-user justify-center cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut
                className={`w-[15px] h-[15px] text-[var(--dim)] hover:text-[var(--red)] ${
                  loggingOut ? "animate-spin" : ""
                }`}
              />
            </div>
          </NavTooltip>
        ) : (
          <div
            className="sb-user cursor-pointer hover:bg-[var(--surface2)] transition-colors"
            onClick={handleLogout}
          >
            <div className="sb-avatar">A</div>
            <div className="flex-1 min-w-0">
              <div className="sb-user-name truncate">Admin User</div>
              <div className="sb-user-role truncate">
                {loggingOut ? "Signing out..." : "Secure Logout"}
              </div>
            </div>
            <LogOut className="w-[14px] h-[14px] text-[var(--dim)]" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── MOBILE TOPBAR (TOUCH OPTIMIZED FOR ALL DISPLAY SIZES) ─────────── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-3 sm:px-4 shadow-sm"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--surface2)] active:scale-95 transition-all text-foreground"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/admin" className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--gold-dim)" }}
            >
              <ShieldCheck className="w-4 h-4" style={{ color: "var(--gold)" }} />
            </div>
            <span className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[130px] sm:max-w-[200px]">
              {currentNavName}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Search on Mobile */}
          <button
            onClick={() => setOmniSearchOpen(true)}
            className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs bg-[var(--surface2)] text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            title="Search Leads, Quotes & Products"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden xs:inline text-[11px] font-medium">Search</span>
          </button>

          {/* Theme switcher */}
          <div className="scale-90">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR ───────────────────────────────────────────────── */}
      <div className="hidden md:block">{desktopSidebarContent}</div>

      {/* ── MOBILE FULL-SCREEN DRAWER ─────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="md:hidden fixed inset-y-0 left-0 z-50 w-[82vw] max-w-xs shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 bg-[var(--surface)] text-[var(--text)] border-r border-[var(--border)]"
          >
            {/* Drawer Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--border)] shrink-0 bg-[var(--surface)]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--gold-dim)" }}
                >
                  <ShieldCheck className="w-4 h-4" style={{ color: "var(--gold)" }} />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">CCTVQuotation</div>
                  <div className="text-[10px] text-muted-foreground">Admin Console</div>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--surface2)] active:scale-95 transition-all text-muted-foreground hover:text-foreground"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation List */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isActive(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98] ${
                            active
                              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                              : "text-foreground hover:bg-[var(--surface2)]"
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                          <span className="truncate flex-1">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-[var(--border)] shrink-0 bg-[var(--surface)]">
              <div
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 text-foreground hover:text-destructive cursor-pointer transition-colors active:scale-95"
              >
                <div className="w-7 h-7 rounded-lg bg-[var(--surface2)] flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">Admin User</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {loggingOut ? "Signing out..." : "Tap to Secure Logout"}
                  </div>
                </div>
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
