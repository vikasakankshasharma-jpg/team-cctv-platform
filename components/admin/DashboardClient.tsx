"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Users, Zap, Hash, Activity, ArrowRight, ArrowUpRight, BarChart3, Clock } from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { Lead } from "@/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

export interface WeeklyBucket {
  label: string;
  total: number;
  won: number;
}

export interface SourceBreakdown {
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface RecentActivity {
  id: string;
  customer_name: string;
  status: string;
  created_at: unknown;
}

export interface DashboardClientProps {
  trend: WeeklyBucket[];
  sources: SourceBreakdown[];
  initialRecentLeads: RecentActivity[];
  initialInternalLeads: RecentActivity[];
  internalLeadsCount: number;
  conversionRate: number;
}

const STATUS_COLORS: Record<string, string> = {
  new:             "sp-new",
  contacted:       "sp-new",
  unreachable:     "bg-rose-500/10 text-rose-500 border-rose-500/20",
  busy:            "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  technical_error: "bg-red-500/10 text-red-500 border-red-500/20",
  site_visit:      "sp-site",
  quoted:          "sp-quote",
  won:             "sp-won",
  lost:            "sp-lost",
  waitlist:        "sp-waitlist",
};

// ─── RECHARTS TOOLTIP ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--surface3)] text-[var(--text)] p-3 border border-[var(--border)] shadow-xl rounded-lg">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider mb-2 text-[var(--muted)]">{label}</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--blue)" }} />
            <span className="text-[12px] font-medium">Total: {payload[0].value}</span>
          </div>
          {payload[1] && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "var(--green)" }} />
              <span className="text-[12px] font-medium">Won: {payload[1].value}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// ─── SALES TREND CHART ────────────────────────────────────────────────────────
function SalesTrendChart({ trend }: { trend: WeeklyBucket[] }) {
  const totalLeads = trend.reduce((s, b) => s + b.total, 0);
  const totalWon   = trend.reduce((s, b) => s + b.won, 0);

  return (
    <div className="h-full flex flex-col" style={{ height: "400px" }}>
      <div className="flex-1 w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--green)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border2)" opacity={0.5} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border2)', strokeWidth: 2, strokeDasharray: '3 3' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: 'var(--muted)', paddingTop: '20px' }} />
            <Area type="monotone" dataKey="total" name="Total Leads" stroke="var(--blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, fill: 'var(--blue)', stroke: 'var(--surface)', strokeWidth: 2 }} />
            <Area type="monotone" dataKey="won" name="Won Deals" stroke="var(--green)" strokeWidth={3} fillOpacity={1} fill="url(#colorWon)" activeDot={{ r: 6, fill: 'var(--green)', stroke: 'var(--surface)', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export function DashboardClient({ trend, sources, initialRecentLeads, initialInternalLeads, internalLeadsCount, conversionRate }: DashboardClientProps) {
  const [recentLeads, setRecentLeads] = useState<RecentActivity[]>(initialRecentLeads);
  const [internalLeads, setInternalLeads] = useState<RecentActivity[]>(initialInternalLeads);
  const [liveInternalCount, setLiveInternalCount] = useState(internalLeadsCount);

  // Setup Firebase Realtime Listeners
  useEffect(() => {
    // Recent Leads Listener
    const qRecent = query(collection(db, "leads"), orderBy("created_at", "desc"), limit(7));
    const unsubRecent = onSnapshot(qRecent, (snapshot) => {
      const leads = snapshot.docs.map(doc => {
        const d = doc.data() as Lead;
        return {
          id: doc.id,
          customer_name: d.customer_name ?? "Unknown",
          status: d.status ?? "new",
          created_at: (d.created_at as any)?.toDate?.()?.toISOString() ?? "",
        } as RecentActivity;
      });
      setRecentLeads(leads);
    });

    const qInternal = query(collection(db, "leads"), where("is_escalated", "==", true), limit(5));
    const unsubInternal = onSnapshot(qInternal, (snapshot) => {
      const leads = snapshot.docs.map(doc => {
        const d = doc.data() as Lead;
        return {
          id: doc.id,
          customer_name: d.customer_name ?? "Unknown",
          status: d.status ?? "new",
          created_at: (d.created_at as any)?.toDate?.()?.toISOString() ?? "",
        } as RecentActivity;
      });
      setInternalLeads(leads);
      
      if (snapshot.docs.length < 5) {
        setLiveInternalCount(snapshot.docs.length);
      }
    });

    return () => {
      unsubRecent();
      unsubInternal();
    };
  }, []);

  return (
    <div className="two-col">
      {/* Left Panel: Analytics */}
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">Sales Analytics</div>
          <Link href="/admin/reports" className="panel-action" style={{ textDecoration: 'none' }}>View Report</Link>
        </div>
        <div className="panel-body">
          <SalesTrendChart trend={trend} />
        </div>
      </div>
      
      {/* Right Column: Actions & Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Urgent Escalated Queue */}
        <div className="panel" style={liveInternalCount > 0 ? { borderColor: "var(--red)", background: "rgba(239,68,68,0.05)" } : {}}>
          <div className="panel-head border-b-0 pb-0">
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "8px", color: liveInternalCount > 0 ? "var(--red)" : "inherit" }}>
              {liveInternalCount > 0 && <span className="animate-pulse">🚨</span>}
              Urgent Action Required
            </div>
            {liveInternalCount > 0 && (
              <div style={{ fontSize: "10px", fontWeight: "700", padding: "3px 8px", background: "var(--red)", color: "white", borderRadius: "10px" }}>
                {liveInternalCount}
              </div>
            )}
          </div>
          <div className="panel-body pt-3">
            {internalLeads.length === 0 ? (
              <p style={{ fontSize: "11.5px", color: "var(--muted)", textAlign: "center", padding: "10px 0" }}>No escalated issues — Great work!</p>
            ) : (
              internalLeads.map(lead => (
                <Link key={lead.id} href="/admin/dispatch" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", background: "rgba(239,68,68,0.1)", borderRadius: "var(--r)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: "8px", textDecoration: "none" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--red)" }}>{lead.customer_name}</span>
                    <span style={{ fontSize: "10px", color: "var(--red)" }}>Unmapped Territory (Dispatch Required)</span>
                  </div>
                  <ArrowRight style={{ width: "14px", height: "14px", color: "var(--red)" }} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="panel" style={{ flex: 1 }}>
          <div className="panel-head">
            <div className="panel-title">Live Activity</div>
            <Link href="/admin/leads" className="panel-action" style={{ textDecoration: 'none' }}>View All</Link>
          </div>
          <div className="panel-body p-0 max-h-[300px] overflow-y-auto scrollbar-none">
            {recentLeads.length === 0 ? (
              <p style={{ fontSize: "11.5px", color: "var(--muted)", textAlign: "center", padding: "20px 0" }}>No recent activity</p>
            ) : (
              recentLeads.map((lead) => (
                <Link href="/admin/leads" key={lead.id} className="activity-item px-4" style={{ textDecoration: 'none' }}>
                  <div className="act-dot" style={{ background: "var(--blue)" }}></div>
                  <div className="act-text">
                    <strong>{lead.customer_name}</strong> - Inquiry <br/>
                    <span className={`status-pill mt-1 ${STATUS_COLORS[lead.status] || "sp-new"}`}>
                      {lead.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="act-time">Just now</div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
