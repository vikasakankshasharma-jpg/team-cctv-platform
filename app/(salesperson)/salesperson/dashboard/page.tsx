import { verifySession } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  Users, LayoutDashboard, CalendarCheck, Clock,
  ArrowUpRight, Flame, Target, TrendingUp, FileText
} from "lucide-react";
import type { Metadata } from "next";
import type { Lead } from "@/types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ActivePipeline } from "@/components/salesperson/ActivePipeline";

export const metadata: Metadata = {
  title: "Sales Dashboard | TEAM CCTV",
};

export const dynamic = "force-dynamic";

export default async function SalespersonDashboard() {
  const session = await verifySession();

  let totalAssigned = 0;
  let wonLeads = 0;
  let activeCount = 0;
  let todayFollowUps = 0;
  let activeLeads: Lead[] = [];
  let todayLeads: Lead[] = [];
  // Simple monthly win data for mini trend (last 5 months)
  const monthlyWins: Record<string, number> = {};

  if (session.user) {
    const spSnap = await adminDb.collection("salespeople")
      .where("firebase_uid", "==", session.user.uid)
      .limit(1)
      .get();

    if (!spSnap.empty) {
      const spId = spSnap.docs[0].id;

      const leadsSnap = await adminDb.collection("leads")
        .where("assigned_to_salesperson_id", "==", spId)
        .orderBy("created_at", "desc")
        .get();

      totalAssigned = leadsSnap.size;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const allLeads = leadsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: (doc.data().created_at as any)?.toDate?.() ?? new Date(doc.data().created_at),
      } as Lead));

      allLeads.forEach(lead => {
        if (lead.status === "won") {
          wonLeads++;
          const d = lead.created_at as Date;
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthlyWins[key] = (monthlyWins[key] || 0) + 1;
        }
        if (lead.status !== "won" && lead.status !== "lost") activeCount++;

        // Follow-up: leads created today or leads in "contacted" status older than 24h
        const createdAt = lead.created_at as Date;
        const ageHours = (Date.now() - createdAt.getTime()) / 3600000;
        if (lead.status === "contacted" && ageHours > 24 && ageHours < 72) {
          todayFollowUps++;
          todayLeads.push(lead);
        } else if (lead.status === "new" && ageHours < 4) {
          todayLeads.push(lead);
        }
      });

      activeLeads = allLeads
        .filter(l => l.status !== "won" && l.status !== "lost")
        .slice(0, 6);
    }
  }

  const conversionRate = totalAssigned > 0 ? Math.round((wonLeads / totalAssigned) * 100) : 0;

  // Build mini trend bars (last 5 months)
  const trendMonths: { label: string; wins: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const shortMonth = d.toLocaleString("default", { month: "short" });
    trendMonths.push({ label: shortMonth, wins: monthlyWins[key] || 0 });
  }
  const maxWins = Math.max(...trendMonths.map(m => m.wins), 1);

  const KPIS = [
    {
      label: "Total Assigned",
      value: totalAssigned,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      sub: "all time"
    },
    {
      label: "Won Deals",
      value: wonLeads,
      icon: CalendarCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      sub: "closed successfully"
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: ArrowUpRight,
      color: conversionRate > 20 ? "text-emerald-500" : "text-amber-500",
      bg: conversionRate > 20 ? "bg-emerald-500/10" : "bg-amber-500/10",
      sub: conversionRate > 20 ? "above target" : "needs improvement"
    },
    {
      label: "Active Pipeline",
      value: activeCount,
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      sub: "in progress"
    },
    {
      label: "Follow-Ups Today",
      value: todayFollowUps,
      icon: Target,
      color: todayFollowUps > 0 ? "text-red-500" : "text-zinc-400",
      bg: todayFollowUps > 0 ? "bg-red-500/10" : "bg-zinc-100 dark:bg-zinc-800",
      sub: todayFollowUps > 0 ? "action required" : "all clear"
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        icon={LayoutDashboard}
        title="Command Centre"
        description="Monitor your active pipeline and conversion performance."
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {KPIS.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-tight">{kpi.label}</span>
              <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter relative z-10">{kpi.value}</div>
            <div className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">{kpi.sub}</div>
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 dark:from-zinc-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {/* Two-column layout: Pipeline + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Pipeline — 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" /> Active Pipeline
            </h3>
            <Link href="/salesperson/leads" className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline">
              View All →
            </Link>
          </div>
          <ActivePipeline leads={activeLeads} />
        </div>

        {/* Right column: Trend + Quick Actions */}
        <div className="space-y-6">
          {/* Monthly Win Trend */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Win Trend (5 Months)</h4>
            </div>
            <div className="flex items-end gap-2 h-24">
              {trendMonths.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: "72px" }}>
                    <div
                      className="w-full rounded-t-lg bg-emerald-500/80 transition-all"
                      style={{ height: `${Math.max((m.wins / maxWins) * 100, 4)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-zinc-400">{m.label}</span>
                  <span className="text-[9px] font-black text-zinc-600 dark:text-zinc-300">{m.wins}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-6 shadow-sm space-y-3">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Quick Actions</h4>
            <Link href="/salesperson/create-quote" className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors group">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-zinc-900 dark:text-white">Walk-In Quote</p>
                <p className="text-[9px] text-zinc-500 font-medium">Create quote for walk-in customer</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-400 ml-auto group-hover:text-amber-500 transition-colors" />
            </Link>
            <Link href="/salesperson/leads" className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors group">
              <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-zinc-900 dark:text-white">My Leads</p>
                <p className="text-[9px] text-zinc-500 font-medium">View and manage all assigned leads</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-400 ml-auto group-hover:text-blue-500 transition-colors" />
            </Link>
          </div>

          {/* Follow-Up Alert */}
          {todayFollowUps > 0 && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[28px] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-red-500" />
                <h4 className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Action Required</h4>
              </div>
              <p className="text-sm font-bold text-red-700 dark:text-red-300">
                {todayFollowUps} lead{todayFollowUps > 1 ? "s" : ""} need{todayFollowUps === 1 ? "s" : ""} follow-up today.
              </p>
              <Link href="/salesperson/leads" className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest hover:underline">
                View Now <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
