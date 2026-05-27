import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, FileText, Percent, BadgeIndianRupee, LayoutDashboard, TrendingUp } from "lucide-react";
import { DashboardClient, type WeeklyBucket, type SourceBreakdown, type RecentActivity } from "@/components/admin/DashboardClient";
import { PageHeader } from "@/components/admin/PageHeader";
import type { Metadata } from "next";
import type { Promoter, Lead } from "@/types";

export const metadata: Metadata = {
  title: "Intelligence Dashboard | Admin Command Centre",
  description: "Real-time operational intelligence and platform performance metrics for the TEAM CCTV system.",
};

function getMidnight(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDayLabel(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysOffset);
  return d.toLocaleDateString("en-IN", { weekday: "short" });
}

export default async function AdminDashboard() {
  await requireAdmin();

  // ... (aggregation logic remains same)
  const [leadsCountRes, wonLeadsCountRes, promotersSnapshot, recentLeadsSnap, internalCountRes, internalSnap] = await Promise.all([
    adminDb.collection("leads").count().get(),
    adminDb.collection("leads").where("status", "==", "won").count().get(),
    adminDb.collection("promoters").get(),
    adminDb.collection("leads").orderBy("created_at", "desc").limit(7).get(),
    adminDb.collection("leads").where("franchise_dealer_id", "==", null).count().get(),
    adminDb.collection("leads").where("franchise_dealer_id", "==", null).orderBy("created_at", "desc").limit(5).get(),
  ]);

  const internalLeadsCount = internalCountRes.data().count;
  const internalLeadsSnap = internalSnap;

  const leadsCount = leadsCountRes.data().count;
  const wonLeadsCount = wonLeadsCountRes.data().count;
  const conversionRate = leadsCount > 0 ? Math.round((wonLeadsCount / leadsCount) * 100) : 0;

  const wonQuotesRef = adminDb.collection("commission_records");
  const revenueSnap = await wonQuotesRef.get();
  let totalExTaxBusiness = 0;
  revenueSnap.docs.forEach(doc => {
    totalExTaxBusiness += doc.data().ex_tax_amount || 0;
  });

  // Trend logic...
  const sevenDaysAgo = getMidnight(6);
  const allRecentLeadsSnap = await adminDb
    .collection("leads")
    .where("created_at", ">=", sevenDaysAgo)
    .get();

  const buckets = Array.from({ length: 7 }, (_, i) => {
    const offset = 6 - i;
    return {
      label: getDayLabel(offset),
      date: getMidnight(offset),
      total: 0,
      won: 0,
    };
  });

  allRecentLeadsSnap.docs.forEach((doc) => {
    const data = doc.data();
    const createdAt: Date = (data.created_at as any)?.toDate?.() ?? new Date(data.created_at);
    const dayStart = new Date(createdAt);
    dayStart.setHours(0, 0, 0, 0);

    const bucket = buckets.find((b) => b.date.getTime() === dayStart.getTime());
    if (bucket) {
      bucket.total += 1;
      if (data.status === "won") bucket.won += 1;
    }
  });

  const trend: WeeklyBucket[] = buckets.map(({ label, total, won }) => ({ label, total, won }));

  // Source breakdown...
  const referralCountRes = await adminDb
    .collection("leads")
    .where("referral_code", "!=", null)
    .count()
    .get();
  const referralCount = referralCountRes.data().count;
  const organicCount = leadsCount - referralCount;

  const sources: SourceBreakdown[] = [
    {
      label: "Referral Network",
      count: referralCount,
      percent: leadsCount > 0 ? Math.round((referralCount / leadsCount) * 100) : 0,
      color: "bg-amber-500/20 text-amber-400",
    },
    {
      label: "Organic / Direct",
      count: organicCount,
      percent: leadsCount > 0 ? Math.round((organicCount / leadsCount) * 100) : 0,
      color: "bg-zinc-700 text-zinc-300",
    },
  ];

  const recentLeads: RecentActivity[] = recentLeadsSnap.docs.map((doc) => {
    const d = doc.data() as Lead;
    return {
      id: doc.id,
      customer_name: d.customer_name ?? "Unknown",
      status: d.status ?? "new",
      created_at: (d.created_at as any)?.toDate?.()?.toISOString() ?? "",
    };
  });

  const internalLeads: RecentActivity[] = internalLeadsSnap.docs.map((doc: any) => {
    const d = doc.data() as Lead;
    return {
      id: doc.id,
      customer_name: d.customer_name ?? "Unknown",
      status: d.status ?? "new",
      created_at: (d.created_at as any)?.toDate?.()?.toISOString() ?? "",
    };
  });

  const leadVelocity = trend.length > 0 
    ? (trend.reduce((sum, day) => sum + day.total, 0) / trend.length).toFixed(1)
    : "0";

  const KPIS = [
    {
      label: "Total Pipeline",
      value: leadsCount.toLocaleString("en-IN"),
      icon: Users,
      trend: "Leads captured via Catalyst",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      shadow: "shadow-blue-500/10",
      borderGradient: "from-blue-400 to-indigo-500",
      hoverBg: "bg-gradient-to-br from-blue-500/[0.03] to-transparent",
      href: "/admin/leads"
    },
    {
      label: "Operational Success",
      value: wonLeadsCount.toLocaleString("en-IN"),
      icon: FileText,
      trend: "Closed/Won transactions",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      shadow: "shadow-emerald-500/10",
      borderGradient: "from-emerald-400 to-teal-500",
      hoverBg: "bg-gradient-to-br from-emerald-500/[0.03] to-transparent",
      href: "/admin/leads"
    },
    {
      label: "Yield Velocity",
      value: `${conversionRate}%`,
      icon: Percent,
      trend: "Lead conversion efficacy",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      shadow: "shadow-purple-500/10",
      borderGradient: "from-purple-400 to-violet-500",
      hoverBg: "bg-gradient-to-br from-purple-500/[0.03] to-transparent",
      href: "/admin/leads"
    },
    {
      label: "Gross Throughput",
      value: `₹${Math.floor(totalExTaxBusiness/1000)}k`,
      icon: BadgeIndianRupee,
      trend: "Ex-tax net business volume",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      shadow: "shadow-amber-500/10",
      borderGradient: "from-amber-400 to-orange-500",
      hoverBg: "bg-gradient-to-br from-amber-500/[0.03] to-transparent",
      href: "/admin/bookings"
    },
    {
      label: "Lead Velocity",
      value: leadVelocity,
      icon: TrendingUp,
      trend: "Avg leads per day (7d)",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      shadow: "shadow-rose-500/10",
      borderGradient: "from-rose-400 to-pink-500",
      hoverBg: "bg-gradient-to-br from-rose-500/[0.03] to-transparent",
      href: "/admin/leads"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        icon={LayoutDashboard} 
        title="Command Centre" 
        description="Real-time operational intelligence and platform performance metrics."
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {KPIS.map((kpi, idx) => (
          <Link
            href={kpi.href}
            key={idx}
            className={`
              relative block bg-[#0F0F0F]
              border border-zinc-800
              rounded-[28px] p-6 overflow-hidden group
              shadow-sm hover:shadow-md hover:shadow-black
              transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97]
            `}
          >
            {/* Gradient border glow at the bottom */}
            <div className={`absolute bottom-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${kpi.borderGradient}`} />

            {/* Background shimmer on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[28px] ${kpi.hoverBg}`} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none">{kpi.label}</span>
                <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
              </div>

              <div className={`text-3xl font-black tracking-tighter mb-1 text-white group-hover:${kpi.color} transition-colors duration-300`}>
                {kpi.value}
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{kpi.trend}</span>
                <div className={`flex items-center gap-1 text-[9px] font-black ${kpi.color}`}>
                  <TrendingUp className="w-3 h-3" />
                  <span className="uppercase tracking-widest">↑</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Live Charts */}
      <DashboardClient
        trend={trend}
        sources={sources}
        initialRecentLeads={recentLeads}
        initialInternalLeads={internalLeads}
        internalLeadsCount={internalLeadsCount}
        conversionRate={conversionRate}
      />
    </div>
  );
}

