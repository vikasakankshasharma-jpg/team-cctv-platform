"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import { Search, Command, Bell, ChevronDown, LogOut, Clock, ChevronRight } from "lucide-react";
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
    <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border shadow-sm">
      <Clock className="w-[14px] h-[14px] text-primary shrink-0" />
      <div className="flex flex-col leading-none">
        <span className="text-[12px] font-semibold text-foreground tabular-nums tracking-wide">{time}</span>
        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest mt-[1px]">{date} · IST</span>
      </div>
    </div>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.replace("/admin", "").split("/").filter(Boolean);

  if (segments.length === 0) return (
    <span className="text-xs font-semibold text-muted-foreground hidden lg:block">Dashboard</span>
  );

  return (
    <div className="hidden lg:flex items-center gap-1.5">
      <Link href="/admin" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
        Home
      </Link>
      {segments.map((seg, i) => (
        <div key={seg} className="flex items-center gap-1.5">
          <ChevronRight className="w-[14px] h-[14px] text-muted-foreground/50" />
          <span className={`text-xs font-medium capitalize ${
            i === segments.length - 1 
              ? "text-foreground font-semibold" 
              : "text-muted-foreground hover:text-primary"
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
        className="flex items-center gap-3 bg-card border border-border rounded-xl py-1.5 px-3 shadow-sm hover:shadow-md transition-all group"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[11px] font-bold shrink-0">
          {initials}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[12px] font-semibold text-foreground leading-none max-w-[120px] truncate">
            {userEmail || "Admin"}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground mt-0.5 capitalize">
            {userRole?.replace(/_/g, " ")}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Profile header */}
          <div className="px-4 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{userEmail || "Admin"}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-success rounded-full" />
                  <p className="text-[10px] font-medium text-success capitalize">{userRole?.replace(/_/g, " ")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-1.5">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-medium text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
            >
              <LogOut className={`w-4 h-4 ${loggingOut ? "animate-spin" : ""}`} />
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
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-20 shrink-0 gap-4">
      
      {/* LEFT — Status + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* System Status */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-success/10 border border-success/20 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-semibold text-success uppercase tracking-wider hidden sm:block">Operational</span>
        </div>

        <div className="h-4 w-px bg-border shrink-0" />

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
          className="flex items-center gap-2.5 px-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all group shadow-sm"
        >
          <Search className="w-4 h-4" />
          <span className="text-xs font-medium hidden md:block">Search Console...</span>
          <div className="hidden md:flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-background border border-border rounded-md text-[10px] font-medium opacity-60 group-hover:opacity-100 transition-opacity">
            <Command className="w-3 h-3" /> K
          </div>
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg bg-secondary/50 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shadow-sm">
          <Bell className="w-[18px] h-[18px]" />
          {/* Badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warning rounded-full border-[1.5px] border-background shadow-sm">
            <span className="absolute inset-0 bg-warning rounded-full animate-ping opacity-75" />
          </span>
        </button>

        {/* User Dropdown */}
        <UserDropdown userEmail={userEmail} userRole={userRole} />
      </div>
    </header>
  );
}
