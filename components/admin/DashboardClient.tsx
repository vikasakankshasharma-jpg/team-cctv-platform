"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Users, Zap, Hash, Activity, ArrowRight, ArrowUpRight, BarChart3, Clock } from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types";

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
  new:        "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400",
  contacted:  "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400",
  site_visit: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400",
  quoted:     "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400",
  won:        "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400",
  lost:       "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400",
};

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

// ─── ANIMATED BAR (REMOVED) ─────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1d1d1f]/95 text-[#f5f5f7] p-3 border border-[#424245] shadow-2xl rounded-xl">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-[#86868b]">{label}</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0071e3]" />
            <span className="text-sm font-medium">Total: {payload[0].value}</span>
          </div>
          {payload[1] && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#34c759]" />
              <span className="text-sm font-medium">Won: {payload[1].value}</span>
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
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-2xl font-semibold text-foreground tracking-tight">Weekly Analytics</h3>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {totalLeads} total · {totalWon} converted · 7-day cycle
          </p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0071e3" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0071e3" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34c759" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#34c759" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d2d2d7" opacity={0.3} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#86868b', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#86868b', fontSize: 12 }} />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(134,134,139,0.3)', strokeWidth: 2, strokeDasharray: '3 3' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            <Area type="monotone" dataKey="total" name="Total Leads" stroke="#0071e3" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, fill: '#0071e3', stroke: '#fff', strokeWidth: 2 }} />
            <Area type="monotone" dataKey="won" name="Won Deals" stroke="#34c759" strokeWidth={3} fillOpacity={1} fill="url(#colorWon)" activeDot={{ r: 6, fill: '#34c759', stroke: '#fff', strokeWidth: 2 }} />
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
      
      // Update count roughly based on snapshot, although real count might be higher if > 5. 
      // We rely on initial SSR count, and increment/decrement based on changes.
      // For a truly accurate live count, we'd need a counter document, but this is a good UI approximation.
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 shadow-sm border-border bg-card">
        <CardContent className="p-6 md:p-8 h-full min-h-[480px]">
          <SalesTrendChart trend={trend} />
        </CardContent>
      </Card>
      
      <div className="flex flex-col gap-6">
        
        {/* Urgent Escalated Queue */}
        <Card className={`shadow-sm border-border ${liveInternalCount > 0 ? "bg-red-500/5 border-red-500/20" : "bg-card"}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${liveInternalCount > 0 ? "text-red-500 animate-pulse" : "text-foreground"}`}>
                {liveInternalCount > 0 && <span className="text-xl">🚨</span>}
                Urgent Action Required
              </CardTitle>
              <Badge variant={liveInternalCount > 0 ? "destructive" : "outline"} className={liveInternalCount > 0 ? "animate-pulse" : "bg-success/20 text-success-foreground"}>
                {liveInternalCount} Escalated
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {internalLeads.length === 0 ? (
              <p className="text-sm font-medium text-muted-foreground text-center py-4">No escalated issues — Great work!</p>
            ) : (
              internalLeads.map(lead => (
                <Link key={lead.id} href="/admin/dispatch" className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400 truncate">{lead.customer_name}</span>
                    <span className="text-xs text-red-500/80">Unmapped Territory (Manual Dispatch Required)</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-red-500 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="flex-1 shadow-sm border-border bg-card min-h-[280px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Live Activity
              </CardTitle>
              <Link href="/admin/leads" className="text-xs font-medium text-primary hover:underline">
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-none">
            {recentLeads.length === 0 ? (
              <p className="text-sm font-medium text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              recentLeads.map((lead) => (
                <Link href="/admin/leads" key={lead.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {lead.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">{lead.customer_name}</span>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Inquiry</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`font-medium capitalize ${STATUS_COLORS[lead.status] || "bg-muted text-muted-foreground"}`}>
                    {lead.status.replace("_", " ")}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
