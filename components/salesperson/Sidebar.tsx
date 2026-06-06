"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
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
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard",    href: "/salesperson/dashboard",    icon: LayoutDashboard },
    ]
  },
  {
    label: "Sales Operations",
    items: [
      { name: "My Leads",     href: "/salesperson/leads",        icon: Users },
      { name: "Walk-In Quote",href: "/salesperson/create-quote", icon: FileText },
    ]
  },
  {
    label: "Financials",
    items: [
      { name: "Commissions",  href: "/salesperson/commissions",  icon: HandCoins },
    ]
  },
];

export function Sidebar() {
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
    }
  };

  const isActive = (href: string) => pathname === href || (href !== "/salesperson/dashboard" && pathname.startsWith(href));

  const sidebarContent = (
    <>
      {/* ── BRAND HEADER ── */}
      <div className="h-16 flex items-center px-5 border-b border-white/10 shrink-0 gap-3 relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-amber-500/20 blur-xl rounded-full pointer-events-none" />
        <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 relative z-10 shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div className="relative z-10 min-w-0 flex-1">
          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em] leading-none">TEAM CCTV</p>
          <p className="text-sm font-black text-white leading-tight tracking-tight truncate">Sales Portal</p>
        </div>
        {/* Mobile close button */}
        <button onClick={() => setMobileOpen(false)} className="md:hidden w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── NAVIGATION GROUPS ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-none">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em] px-3 mb-2 leading-none">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name + item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all relative group ${
                      active
                        ? "bg-amber-500/10 text-amber-500"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                    )}
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      active
                        ? "bg-amber-500/20"
                        : "bg-white/5 group-hover:bg-white/10"
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate flex-1">{item.name}</span>
                    {active && (
                      <ChevronRight className="w-3 h-3 text-amber-500/60 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── FOOTER / LOGOUT ── */}
      <div className="p-3 border-t border-white/10 shrink-0 space-y-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all text-zinc-400 hover:text-red-400 hover:bg-red-500/5 group"
        >
          <div className="w-7 h-7 rounded-xl bg-white/5 group-hover:bg-red-500/10 flex items-center justify-center shrink-0 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </div>
          <span className="font-black">Secure Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header bar with hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#030303]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-black text-white tracking-tight">Sales</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex w-64 bg-white/[0.02] backdrop-blur-3xl border-r border-white/10 flex-col h-screen sticky top-0 overflow-hidden transition-colors duration-500">
        {sidebarContent}
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
