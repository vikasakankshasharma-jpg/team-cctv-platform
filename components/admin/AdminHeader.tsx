"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import { Search, Command, UserCheck, Bell, ChevronDown, LogOut, Clock, ChevronRight } from "lucide-react";
import { useOmniSearchStore } from "@/store/omni-search";

interface AdminHeaderProps {
  userEmail: string;
  userRole: string;
}

// ─── Live IST Clock ───────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
      setDate(now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-inner">
      <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
      <div className="flex flex-col leading-none">
        <span className="text-[11px] font-black text-zinc-900 dark:text-white tabular-nums tracking-widest">{time}</span>
        <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mt-0.5">{date} · IST</span>
      </div>
    </div>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.replace("/admin", "").split("/").filter(Boolean);

  if (segments.length === 0) return (
    <span className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest hidden lg:block">Dashboard</span>
  );

  return (
    <div className="hidden lg:flex items-center gap-1.5">
      <Link href="/admin" className="text-[11px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        Home
      </Link>
      {segments.map((seg, i) => (
        <div key={seg} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-700" />
          <span className={`text-[11px] font-black uppercase tracking-widest ${
            i === segments.length - 1 
              ? "text-zinc-900 dark:text-white" 
              : "text-zinc-400 dark:text-zinc-600 hover:text-blue-600 dark:hover:text-blue-400"
          }`}>
            {seg.replace(/-/g, " ")}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── User Dropdown ────────────────────────────────────────────────────────────
function UserDropdown({ userEmail, userRole }: { userEmail: string; userRole: string }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  // Close on click-outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = userEmail
    ? userEmail.startsWith("+91") || /^\d+$/.test(userEmail.replace(/\D/g, ""))
      ? "AD"
      : userEmail.slice(0, 2).toUpperCase()
    : "AD";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await auth.signOut();
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-2 px-4 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black shadow-inner shadow-blue-700/30 shrink-0">
          {initials}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-black text-zinc-900 dark:text-white leading-none max-w-[120px] truncate">
            {userEmail || "Admin"}
          </span>
          <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-500 mt-0.5">
            {userRole?.replace(/_/g, " ")}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl dark:shadow-zinc-950 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Profile header */}
          <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-600/20">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-zinc-900 dark:text-white truncate">{userEmail || "Admin"}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">{userRole?.replace(/_/g, " ")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-50 group"
            >
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <LogOut className={`w-3.5 h-3.5 ${loggingOut ? "animate-spin" : ""}`} />
              </div>
              {loggingOut ? "Signing out..." : "Secure Logout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN HEADER ──────────────────────────────────────────────────────────────
export function AdminHeader({ userEmail, userRole }: AdminHeaderProps) {
  const { setIsOpen } = useOmniSearchStore();

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-[#050505]/90 backdrop-blur-xl flex items-center justify-between px-6 z-20 shrink-0 gap-4">
      
      {/* LEFT — Status + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* System Status */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest hidden sm:block">Operational</span>
        </div>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />

        {/* Breadcrumb */}
        <Breadcrumb />
      </div>

      {/* RIGHT — Clock + Search + Bell + User */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Live Clock */}
        <LiveClock />

        {/* Search */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group shadow-inner"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Search Console...</span>
          <div className="hidden md:flex items-center gap-0.5 ml-1 px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-[8px] font-black opacity-50 group-hover:opacity-100 transition-opacity">
            <Command className="w-2.5 h-2.5" /> K
          </div>
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-inner">
          <Bell className="w-4 h-4" />
          {/* Badge */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full border border-white dark:border-zinc-950 shadow-sm">
            <span className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-75" />
          </span>
        </button>

        {/* User Dropdown */}
        <UserDropdown userEmail={userEmail} userRole={userRole} />
      </div>
    </header>
  );
}
