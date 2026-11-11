"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  LayoutDashboard, 
  Users, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  FileText,
  Menu,
  X,
  HandCoins,
  MapPin,
} from "lucide-react";

const NAV_GROUPS = [
  {
    labelKey: "inst_nav_overview" as const,
    labelFallback: "Overview",
    items: [
      { nameKey: "nav_dashboard" as const, nameFallback: "Dashboard", href: "/salesperson/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    labelKey: "sls_nav_ops" as const,
    labelFallback: "Sales Operations",
    items: [
      { nameKey: "sls_nav_visits" as const, nameFallback: "Daily Client Visits", href: "/salesperson/route", icon: MapPin },
      { nameKey: "sls_nav_my_leads" as const, nameFallback: "My Leads", href: "/salesperson/leads", icon: Users },
      { nameKey: "sls_nav_walkin" as const, nameFallback: "Walk-In Quote", href: "/salesperson/create-quote", icon: FileText },
    ]
  },
  {
    labelKey: "sls_nav_financials" as const,
    labelFallback: "Financials",
    items: [
      { nameKey: "prt_nav_commissions" as const, nameFallback: "Commissions", href: "/salesperson/commissions", icon: HandCoins },
    ]
  },
];

export function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
      toast.error(t("inst_side_logout_err", "Logout failed. Please try again."));
    }
  };

  const isActive = (href: string) => pathname === href || (href !== "/salesperson/dashboard" && pathname.startsWith(href));

  const sidebarContent = (
    <>
      {/* ── BRAND HEADER ── */}
      <div className="h-16 flex items-center px-5 border-b border-zinc-200/80 dark:border-white/10 shrink-0 gap-3 relative">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 relative z-10 shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div className="relative z-10 min-w-0 flex-1">
          <p className="text-[8px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.3em] leading-none">TEAM CCTV</p>
          <p className="text-sm font-black text-zinc-900 dark:text-white leading-tight tracking-tight truncate">{t("sls_portal_title", "Sales Portal")}</p>
        </div>
        {/* Mobile close button */}
        <button aria-label={t("inst_side_close_menu", "Close menu")} onClick={() => setMobileOpen(false)} className="md:hidden w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── NAVIGATION GROUPS ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-none">
        {NAV_GROUPS.map((group) => (
          <div key={group.labelKey}>
            <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] px-3 mb-2 leading-snug">
              {t(group.labelKey, group.labelFallback)}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const label = t(item.nameKey, item.nameFallback);
                return (
                  <Link
                    key={item.nameKey + item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all relative group ${
                      active
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-black"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5"
                    }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-500 rounded-r-full" />
                    )}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      active
                        ? "bg-blue-600 text-white dark:bg-blue-500/20 dark:text-blue-400"
                        : "bg-zinc-100 dark:bg-white/5 text-zinc-500 group-hover:bg-zinc-200/70 dark:group-hover:bg-white/10 group-hover:text-zinc-900 dark:group-hover:text-white"
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="flex-1 leading-snug break-words">{label}</span>
                    {active && (
                      <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── FOOTER / LOGOUT ── */}
      <div className="p-3 border-t border-zinc-200/80 dark:border-white/10 shrink-0 space-y-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 group"
        >
          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/5 group-hover:bg-red-100 dark:group-hover:bg-red-500/20 text-zinc-500 group-hover:text-red-600 flex items-center justify-center shrink-0 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold leading-snug">{t("inst_side_logout", "Secure Logout")}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header bar with hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white/95 dark:bg-[#030303]/95 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">{t("sls_mob_sales", "Sales")}</span>
        </div>
        <button aria-label={t("inst_side_open_menu", "Open menu")} onClick={() => setMobileOpen(true)} className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex w-64 bg-white dark:bg-[#0a0a0a] border-r border-zinc-200/80 dark:border-white/10 flex-col h-screen sticky top-0 overflow-hidden transition-colors duration-300">
        {sidebarContent}
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0a0a0a] flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
