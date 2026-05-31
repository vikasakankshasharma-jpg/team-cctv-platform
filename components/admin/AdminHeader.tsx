"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import { Search, Command, Bell, Settings, LogOut, Clock, ChevronRight } from "lucide-react";
import { useOmniSearchStore } from "@/store/omni-search";

interface AdminHeaderProps {
  userEmail: string;
  userRole: string;
}

// ─── Live IST Date (Replaces LiveClock) ──────────────────────────────────────
function LiveDate() {
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setDateStr(now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", month: "short", day: "numeric", year: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 1000 * 60 * 60); // update every hour
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ fontSize: "10.5px", color: "var(--dim)", background: "var(--surface)", border: "0.5px solid var(--border)", padding: "3px 8px", borderRadius: "4px", fontFamily: "var(--font-mono), monospace" }}>
      {dateStr}
    </div>
  );
}

// ─── Breadcrumb Title ─────────────────────────────────────────────────────────
function PageTitle() {
  const pathname = usePathname();
  const segments = pathname.replace("/admin", "").split("/").filter(Boolean);
  
  if (segments.length === 0) return <div className="tb-title">Dashboard</div>;

  return (
    <div className="tb-title capitalize">
      {segments[segments.length - 1].replace(/-/g, " ")}
    </div>
  );
}

// ─── MAIN HEADER ──────────────────────────────────────────────────────────────
export function AdminHeader({ userEmail, userRole }: AdminHeaderProps) {
  const { setIsOpen } = useOmniSearchStore();

  return (
    <div className="topbar">
      
      {/* LEFT — Title + Date */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <PageTitle />
        <LiveDate />
      </div>

      {/* RIGHT — Search + Bell + Settings */}
      <div className="tb-right">
        {/* Search */}
        <div className="tb-search" onClick={() => setIsOpen(true)} style={{ cursor: "pointer" }}>
          <Search style={{ width: "13px", height: "13px" }} />
          <input 
            placeholder="Search leads, quotes..." 
            readOnly 
            style={{ cursor: "pointer" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "10px", opacity: 0.6 }}>
            <Command style={{ width: "10px", height: "10px" }} /> K
          </div>
        </div>

        {/* Notification Bell */}
        <div className="tb-btn">
          <Bell style={{ width: "15px", height: "15px" }} />
          <span className="dot"></span>
        </div>

        {/* Settings */}
        <Link href="/admin/settings" className="tb-btn">
          <Settings style={{ width: "15px", height: "15px" }} />
        </Link>
      </div>
    </div>
  );
}
