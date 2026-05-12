import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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
  Moon,
  Sun,
} from "lucide-react";

// ... (NAV_GROUPS remains same)

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200/50 dark:border-zinc-800/60 flex flex-col h-screen sticky top-0 overflow-hidden shadow-[1px_0_10px_rgba(0,0,0,0.02)] transition-colors duration-500">

      {/* ── BRAND HEADER ──────────────────────────────────────────────────── */}
      <div className="h-20 flex items-center px-6 shrink-0 gap-4 relative">
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600/5 dark:bg-blue-600/10 blur-2xl rounded-full pointer-events-none" />
        <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-2xl shadow-zinc-900/20 dark:shadow-white/10 relative z-10 shrink-0 group hover:scale-105 transition-transform duration-500 cursor-pointer">
          <ShieldCheck className="w-5 h-5 text-white dark:text-zinc-900" />
        </div>
        <div className="relative z-10 min-w-0">
          <p className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.4em] leading-none mb-1">TEAM</p>
          <p className="text-sm font-black text-zinc-900 dark:text-white leading-tight tracking-tight truncate">Command Centre</p>
        </div>
      </div>

      {/* ── NAVIGATION GROUPS ─────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-none">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-3">
            {/* Section Label */}
            <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] px-3 leading-none flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-800" />
              {group.label}
            </p>

            {/* Items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all relative group ${
                      active
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl shadow-zinc-900/10 dark:shadow-white/5"
                        : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 ${
                      active
                        ? "bg-white/10 dark:bg-black/10"
                        : "bg-zinc-50 dark:bg-zinc-900 group-hover:bg-white dark:group-hover:bg-zinc-800 border border-transparent group-hover:border-zinc-200 dark:group-hover:border-zinc-700"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <span className="truncate flex-1 tracking-wider">{item.name}</span>

                    {active ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-800 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── FOOTER / SETTINGS ─────────────────────────────────────────────── */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-900/60 shrink-0 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-md">
        
        {/* Appearance & Status Row */}
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="relative">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping absolute inset-0" />
              <div className="w-2 h-2 bg-emerald-500 rounded-full relative" />
            </div>
            <span className="text-[9px] font-black text-zinc-900 dark:text-white uppercase tracking-widest leading-none">System Live</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white shadow-sm transition-all active:scale-95 group"
            aria-label="Toggle Theme"
          >
            {mounted && (theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 w-full text-left rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 group"
        >
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 group-hover:bg-red-500 text-zinc-400 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-300">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="flex-1">Secure Session End</span>
        </button>
      </div>
    </div>
  );
}
