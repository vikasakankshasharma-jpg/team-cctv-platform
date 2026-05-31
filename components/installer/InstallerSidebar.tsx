"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Wrench, 
  Settings2, 
  LogOut,
  ShieldCheck,
  ChevronRight,
  BookOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Overview", href: "/installer/dashboard", icon: LayoutDashboard },
  { name: "My Leads", href: "/installer/jobs", icon: ClipboardList },
  { name: "Ledger", href: "/installer/ledger", icon: BookOpen },
  { name: "Profile", href: "/installer/profile", icon: Settings2 },
];

export function InstallerSidebar({ installerName }: { installerName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await fetch("/api/installer/auth/session", { method: "DELETE" });
      router.push("/installer/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-800/60 flex flex-col h-screen sticky top-0 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-500">

      {/* ── BRAND HEADER ──────────────────────────────────────────────────── */}
      <div className="h-20 flex items-center px-5 border-b border-zinc-100 dark:border-zinc-800/60 shrink-0 gap-3 relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-500/10 dark:bg-indigo-500/20 blur-xl rounded-full pointer-events-none" />
        <div className="w-9 h-9 rounded-[14px] bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 relative z-10 shrink-0">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <div className="relative z-10 min-w-0">
          <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] leading-none">TEAM CCTV</p>
          <p className="text-[13px] font-black text-zinc-900 dark:text-white leading-tight tracking-tight mt-0.5 truncate">Field Operations</p>
        </div>
      </div>

      {/* ── USER IDENTIFIER ─────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/60">
        <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">Authenticated As</p>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
           <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{installerName}</p>
        </div>
      </div>

      {/* ── NAVIGATION ─────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all relative group ${
                active
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-500"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 dark:bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              )}

              <div className={`w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0 transition-colors ${
                active
                  ? "bg-indigo-500/10 dark:bg-indigo-500/20"
                  : "bg-zinc-50 dark:bg-zinc-900 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800"
              }`}>
                <Icon className="w-4 h-4" />
              </div>

              <span className="truncate flex-1">{item.name}</span>

              {active && (
                <ChevronRight className="w-3.5 h-3.5 text-indigo-600/60 dark:text-indigo-500/60 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── FOOTER / LOGOUT ───────────────────────────────────────────────── */}
      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/60 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 group"
        >
          <div className="w-8 h-8 rounded-[12px] bg-zinc-50 dark:bg-zinc-900 group-hover:bg-red-50 dark:group-hover:bg-red-500/10 flex items-center justify-center shrink-0 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="font-black">Secure Logout</span>
        </button>
      </div>
    </div>
  );
}
