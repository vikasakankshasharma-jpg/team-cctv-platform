"use client";

import { TrendingUp, Users, Zap, Hash, Activity } from "lucide-react";
import Link from "next/link";

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
  conversionRate: number;
}
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  site_visit: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  quoted: "bg-zinc-800 text-zinc-400 border-zinc-700",
  won: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  lost: "bg-red-500/10 text-red-500 border-red-500/20",
};

// ─────────────────────────────────────────────────────────────────────────────
// SALES TREND CHART (CSS Bar Chart)
// ─────────────────────────────────────────────────────────────────────────────

function SalesTrendChart({ trend }: { trend: WeeklyBucket[] }) {
  const maxTotal = Math.max(...trend.map((b) => b.total), 1);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-500 mb-1.5 flex items-center gap-2">
            <Activity className="w-3 h-3" /> Temporal Analysis
          </p>
          <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">
            Weekly Flux
          </h3>
        </div>
        <div className="flex items-center gap-6 p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 shadow-inner">
          <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700" />
            <span className="text-zinc-400 dark:text-zinc-500">Gross Volume</span>
          </div>
          <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] dark:shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-emerald-700 dark:text-emerald-500">Conversion</span>
          </div>
        </div>
      </div>

      {/* Chart Body */}
      <div className="flex-1 flex items-end gap-4 pb-10 min-h-0">
        {trend.map((bucket) => {
          const totalH = (bucket.total / maxTotal) * 100;
          const wonH = (bucket.won / maxTotal) * 100;
          return (
            <div key={bucket.label} className="flex-1 flex flex-col items-center gap-4 group cursor-pointer">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 bg-white dark:bg-zinc-950/90 border border-zinc-100 dark:border-zinc-700 text-zinc-900 dark:text-white text-[10px] font-black p-3 rounded-2xl mb-2 whitespace-nowrap shadow-xl dark:shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                   {bucket.total} TOTAL
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   {bucket.won} SUCCESS
                </div>
              </div>
              {/* Bars */}
              <div className="w-full flex items-end gap-1.5 p-1 bg-zinc-50 dark:bg-zinc-950/20 rounded-2xl shadow-inner" style={{ height: "220px" }}>
                <div
                  className="flex-1 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-xl group-hover:bg-zinc-300/80 dark:group-hover:bg-zinc-700/80 transition-all border border-zinc-300/40 dark:border-zinc-800/40"
                  style={{ height: `${totalH}%`, minHeight: bucket.total > 0 ? "8px" : "0" }}
                />
                <div
                  className="flex-1 bg-emerald-500 rounded-xl group-hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] dark:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  style={{ height: `${wonH}%`, minHeight: bucket.won > 0 ? "8px" : "0" }}
                />
              </div>
              {/* Label */}
              <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                {bucket.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">
            7-Day Operational Cycle
          </span>
        </div>
         <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-950/40 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60 shadow-inner">
            Real-time Telemetry
         </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAD SOURCE PANEL
// ─────────────────────────────────────────────────────────────────────────────

function LeadSourcesPanel({
  sources,
  recentLeads,
  conversionRate,
}: {
  sources: SourceBreakdown[];
  recentLeads: RecentActivity[];
  conversionRate: number;
}) {
  return (
    <div className="h-full flex flex-col gap-8">
      {/* Title */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-600 dark:text-purple-500 mb-1.5 flex items-center gap-2">
          <Hash className="w-3 h-3" /> Source Integrity
        </p>
        <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
          Origin Matrix
        </h3>
      </div>

      {/* Conversion Rate Plate */}
      {/* Conversion Rate Plate */}
      <div className="flex items-center gap-4 lg:gap-6 p-5 lg:p-6 bg-zinc-50 dark:bg-zinc-950/40 rounded-[32px] border border-zinc-100 dark:border-zinc-800/60 shadow-inner group overflow-hidden relative">
        <div className="relative w-16 h-16 lg:w-20 lg:h-20 shrink-0">
          <svg className="w-full h-full -rotate-90 group-hover:scale-110 transition-transform duration-700" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-900" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke="#10b981" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${conversionRate * 0.942} 94.2`}
              className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm lg:text-lg font-black text-zinc-900 dark:text-white leading-none">
                {conversionRate}%
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <div className="text-zinc-900 dark:text-white font-black text-lg lg:text-xl leading-none mb-1.5 lg:mb-2 truncate">Efficacy</div>
          <p className="text-zinc-400 dark:text-zinc-500 text-[9px] lg:text-[10px] font-bold uppercase tracking-wider lg:tracking-widest leading-snug">
            Lead-to-Project Conversion
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
           <Zap className="w-24 h-24 text-emerald-500" />
        </div>
      </div>

      {/* Source Breakdown Bars */}
      <div className="space-y-6">
        {sources.map((s) => (
          <div key={s.label} className="group/bar">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover/bar:text-zinc-900 dark:group-hover/bar:text-white transition-colors">{s.label}</span>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">{s.count} Leads</span>
                 <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${s.color}`}>{s.percent}%</span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/40 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${s.color.includes("amber") ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)] dark:shadow-[0_0_10px_rgba(245,158,11,0.3)]" : "bg-zinc-300 dark:bg-zinc-600"}`}
                style={{ width: `${s.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Strip */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2.5">
            <Zap className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Flux Stream</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
          {recentLeads.length === 0 ? (
            <p className="text-zinc-400 dark:text-zinc-600 text-[10px] font-black uppercase text-center py-10 tracking-widest border border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl">Ledger Empty</p>
          ) : (
            recentLeads.map((lead) => (
              <Link href={`/admin/leads`} key={lead.id} className="flex items-center justify-between gap-4 p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-800/40 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900/40 hover:border-blue-500/30 transition-all group/item active:scale-[0.98]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-[11px] font-black text-zinc-400 dark:text-zinc-500 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-500 transition-colors shrink-0 shadow-inner">
                    {lead.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black text-zinc-900 dark:text-white truncate leading-none mb-1 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">{lead.customer_name}</span>
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest truncate">Inquiry Captured</span>
                  </div>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-inner shrink-0 ${STATUS_COLORS[lead.status] || "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700"}`}>
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardClient({ trend, sources, recentLeads, conversionRate }: DashboardClientProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 rounded-[40px] p-10 min-h-[500px] flex flex-col shadow-xl dark:shadow-2xl backdrop-blur-sm transition-all hover:border-blue-500/20">
        <SalesTrendChart trend={trend} />
      </div>
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 rounded-[40px] p-10 min-h-[500px] flex flex-col shadow-xl dark:shadow-2xl backdrop-blur-sm transition-all hover:border-purple-500/20">
        <LeadSourcesPanel
          sources={sources}
          recentLeads={recentLeads}
          conversionRate={conversionRate}
        />
      </div>
    </div>
  );
}
