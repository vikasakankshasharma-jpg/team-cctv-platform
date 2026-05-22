"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Users, Zap, Hash, Activity, ArrowRight, ArrowUpRight, BarChart3 } from "lucide-react";

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
  recentLeads: RecentActivity[];
  internalLeads: RecentActivity[];
  internalLeadsCount: number;
  conversionRate: number;
}

const STATUS_COLORS: Record<string, string> = {
  new:        "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/30",
  contacted:  "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/30",
  site_visit: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-500/30",
  quoted:     "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700",
  won:        "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/30",
  lost:       "bg-red-500/10 text-red-500 border-red-200 dark:border-red-500/30",
};

const SOURCE_COLORS = [
  { bar: "bg-gradient-to-r from-amber-400 to-orange-500", glow: "shadow-amber-500/20", pill: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30" },
  { bar: "bg-gradient-to-r from-blue-400 to-indigo-500", glow: "shadow-blue-500/20", pill: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30" },
  { bar: "bg-gradient-to-r from-teal-400 to-emerald-500", glow: "shadow-teal-500/20", pill: "text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/30" },
  { bar: "bg-gradient-to-r from-rose-400 to-pink-500", glow: "shadow-rose-500/20", pill: "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30" },
];

// ─── ANIMATED BAR ─────────────────────────────────────────────────────────────
function AnimatedBar({ height, className, delay = 0 }: { height: number; className: string; delay?: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={`flex-1 rounded-xl transition-all duration-700 ease-out ${className}`}
      style={{
        height: animated ? `${height}%` : "0%",
        minHeight: animated && height > 0 ? "6px" : "0",
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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-500 mb-1.5 flex items-center gap-2">
            <Activity className="w-3 h-3" /> Temporal Analysis
          </p>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">Weekly Flux</h3>
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
            {totalLeads} total · {totalWon} converted · 7-day cycle
          </p>
        </div>
        <div className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <div className="w-2.5 h-2.5 rounded-sm bg-zinc-200 dark:bg-zinc-700" />
            <span className="text-zinc-400 dark:text-zinc-500">Gross</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span className="text-emerald-700 dark:text-emerald-500">Won</span>
          </div>
        </div>
      </div>

      {/* Chart Body */}
      <div className="flex-1 flex items-end gap-3 pb-8 min-h-0">
        {trend.map((bucket, idx) => {
          const totalH = (bucket.total / maxTotal) * 100;
          const wonH   = (bucket.won / maxTotal) * 100;
          return (
            <div key={bucket.label} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 scale-90 group-hover:scale-100 bg-zinc-900 dark:bg-zinc-800 text-white text-[10px] font-black p-3 rounded-xl whitespace-nowrap shadow-2xl border border-zinc-700/50 z-10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  {bucket.total} leads
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {bucket.won} won
                </div>
              </div>
              {/* Bars */}
              <div className="w-full flex items-end gap-1 p-1 bg-zinc-50 dark:bg-zinc-950/30 rounded-xl shadow-inner" style={{ height: "180px" }}>
                <AnimatedBar height={totalH} className="bg-zinc-200/80 dark:bg-zinc-800/80 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 border border-zinc-300/40 dark:border-zinc-700/40 transition-colors" delay={idx * 60} />
                <AnimatedBar height={wonH} className="bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.2)] dark:shadow-[0_4px_12px_rgba(16,185,129,0.3)]" delay={idx * 60 + 100} />
              </div>
              {/* Day Label */}
              <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                {bucket.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">7-Day Operational Cycle</span>
        </div>
        <div className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-950/40 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
          Real-time Telemetry
        </div>
      </div>
    </div>
  );
}

// ─── LEAD SOURCE PANEL ────────────────────────────────────────────────────────
function LeadSourcesPanel({ sources, recentLeads, internalLeads, internalLeadsCount, conversionRate }: {
  sources: SourceBreakdown[];
  recentLeads: RecentActivity[];
  internalLeads: RecentActivity[];
  internalLeadsCount: number;
  conversionRate: number;
}) {
  return (
    <div className="h-full flex flex-col gap-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-600 dark:text-purple-500 mb-1.5 flex items-center gap-2">
          <Hash className="w-3 h-3" /> Lead Sources
        </p>
        <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">Origin Matrix</h3>
      </div>

      {/* Unassigned Queue */}
      <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/5 border border-amber-100 dark:border-amber-800/30 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[9px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest">Unassigned Queue</span>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${internalLeadsCount > 0 ? "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" : "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"}`}>
            {internalLeadsCount} Leads
          </span>
        </div>
        <div className="space-y-1.5">
          {internalLeads.length === 0 ? (
            <p className="text-[10px] font-bold text-amber-600/60 dark:text-amber-700 text-center py-2">Queue Empty — Great work!</p>
          ) : (
            internalLeads.map(lead => (
              <Link key={lead.id} href="/admin/leads" className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded-lg border border-amber-100 dark:border-amber-800/20 shadow-sm hover:scale-[1.02] hover:shadow-md transition-all group/ql">
                <span className="text-[11px] font-black text-zinc-900 dark:text-white truncate group-hover/ql:text-amber-600 dark:group-hover/ql:text-amber-400 transition-colors">{lead.customer_name}</span>
                <ArrowRight className="w-3 h-3 text-amber-500 shrink-0" />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Conversion Donut */}
      <div className="flex items-center gap-5 p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 group overflow-hidden relative">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full -rotate-90 group-hover:scale-110 transition-transform duration-500" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="4" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${conversionRate * 0.879} 87.9`}
              className="drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-black text-zinc-900 dark:text-white leading-none">{conversionRate}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-black text-zinc-900 dark:text-white mb-0.5">Conversion Rate</div>
          <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Lead-to-project pipeline efficacy</p>
          <div className="flex items-center gap-1.5 mt-2">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500">Active momentum</span>
          </div>
        </div>
      </div>

      {/* Source Bars */}
      <div className="space-y-4">
        {sources.map((s, i) => {
          const colorSet = SOURCE_COLORS[i % SOURCE_COLORS.length];
          return (
            <div key={s.label} className="group/bar">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest group-hover/bar:text-zinc-900 dark:group-hover/bar:text-white transition-colors">{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600">{s.count} leads</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${colorSet.pill}`}>{s.percent}%</span>
                </div>
              </div>
              <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full shadow-sm ${colorSet.bar} ${colorSet.glow} transition-all duration-1000`}
                  style={{ width: `${s.percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Recent Activity</span>
          </div>
          <Link href="/admin/leads" className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
          {recentLeads.length === 0 ? (
            <p className="text-zinc-400 dark:text-zinc-600 text-[10px] font-black uppercase text-center py-8 tracking-widest border border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl">No recent activity</p>
          ) : (
            recentLeads.map((lead) => (
              <Link href="/admin/leads" key={lead.id}
                className="flex items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-800/40 rounded-xl hover:bg-white dark:hover:bg-zinc-900/60 hover:border-blue-200 dark:hover:border-blue-500/20 hover:shadow-sm transition-all group/row active:scale-[0.98]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-black text-zinc-500 dark:text-zinc-400 group-hover/row:from-blue-50 dark:group-hover/row:from-blue-500/10 group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-all shrink-0">
                    {lead.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-black text-zinc-900 dark:text-white truncate block group-hover/row:text-blue-700 dark:group-hover/row:text-blue-400 transition-colors">{lead.customer_name}</span>
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">New Inquiry</span>
                  </div>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-inner shrink-0 ${STATUS_COLORS[lead.status] || "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700"}`}>
                  {lead.status.replace("_", " ")}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export function DashboardClient({ trend, sources, recentLeads, internalLeads, internalLeadsCount, conversionRate }: DashboardClientProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-[#0F0F0F] border border-zinc-800/80 rounded-[32px] p-8 min-h-[480px] flex flex-col shadow-xl backdrop-blur-sm hover:border-blue-500/20 hover:shadow-2xl hover:shadow-black transition-all duration-500">
        <SalesTrendChart trend={trend} />
      </div>
      <div className="bg-[#0F0F0F] border border-zinc-800/80 rounded-[32px] p-8 min-h-[480px] flex flex-col shadow-xl backdrop-blur-sm hover:border-purple-500/20 hover:shadow-2xl hover:shadow-black transition-all duration-500">
        <LeadSourcesPanel
          sources={sources}
          recentLeads={recentLeads}
          internalLeads={internalLeads}
          internalLeadsCount={internalLeadsCount}
          conversionRate={conversionRate}
        />
      </div>
    </div>
  );
}
