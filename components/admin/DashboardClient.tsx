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

// ─── ANIMATED BAR ─────────────────────────────────────────────────────────────
function AnimatedBar({ height, className, delay = 0 }: { height: number; className: string; delay?: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={`flex-1 rounded-sm transition-all duration-700 ease-out ${className}`}
      style={{
        height: animated ? `${height}%` : "0%",
        minHeight: animated && height > 0 ? "4px" : "0",
      }}
    />
  );
}

// ─── SALES TREND CHART ────────────────────────────────────────────────────────
function SalesTrendChart({ trend }: { trend: WeeklyBucket[] }) {
  const maxTotal = Math.max(...trend.map((b) => b.total), 1);
  const totalLeads = trend.reduce((s, b) => s + b.total, 0);
  const totalWon   = trend.reduce((s, b) => s + b.won, 0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-xl font-semibold text-foreground tracking-tight">Weekly Flux</h3>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {totalLeads} total · {totalWon} converted · 7-day cycle
          </p>
        </div>
        <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            <span className="text-muted-foreground">Gross</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-foreground">Won</span>
          </div>
        </div>
      </div>

      {/* Chart Body */}
      <div className="flex-1 flex items-end gap-4 pb-4 min-h-[240px]">
        {trend.map((bucket, idx) => {
          const totalH = (bucket.total / maxTotal) * 100;
          const wonH   = (bucket.won / maxTotal) * 100;
          return (
            <div key={bucket.label} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer h-full justify-end">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 bg-popover text-popover-foreground text-xs font-medium p-2.5 rounded-lg shadow-md border border-border z-10 absolute -mt-16 -ml-4 whitespace-nowrap">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                  {bucket.total} leads
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {bucket.won} won
                </div>
              </div>
              {/* Bars */}
              <div className="w-full flex items-end justify-center gap-1.5 h-full relative">
                <AnimatedBar height={totalH} className="bg-secondary group-hover:bg-muted-foreground/20 w-full max-w-[24px]" delay={idx * 60} />
                <AnimatedBar height={wonH} className="bg-primary w-full max-w-[24px]" delay={idx * 60 + 100} />
              </div>
              {/* Day Label */}
              <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {bucket.label}
              </span>
            </div>
          );
        })}
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

    // Internal Leads Listener
    const qInternal = query(collection(db, "leads"), where("franchise_dealer_id", "==", null), orderBy("created_at", "desc"), limit(5));
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
        
        {/* Unassigned Queue */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Unassigned Queue
              </CardTitle>
              <Badge variant={liveInternalCount > 0 ? "secondary" : "outline"} className={liveInternalCount > 0 ? "bg-warning/20 text-warning-foreground" : "bg-success/20 text-success-foreground"}>
                {liveInternalCount} Leads
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {internalLeads.length === 0 ? (
              <p className="text-sm font-medium text-muted-foreground text-center py-4">Queue Empty — Great work!</p>
            ) : (
              internalLeads.map(lead => (
                <Link key={lead.id} href="/admin/leads" className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/50 hover:bg-secondary transition-colors group">
                  <span className="text-sm font-medium text-foreground truncate">{lead.customer_name}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
