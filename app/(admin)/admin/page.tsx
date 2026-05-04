import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, FileText, Percent, BadgeIndianRupee, LayoutDashboard } from "lucide-react";
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
  const [leadsCountRes, wonLeadsCountRes, promotersSnapshot, recentLeadsSnap] = await Promise.all([
    adminDb.collection("leads").count().get(),
    adminDb.collection("leads").where("status", "==", "won").count().get(),
    adminDb.collection("promoters").get(),
    adminDb.collection("leads").orderBy("created_at", "desc").limit(7).get(),
  ]);

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

  const KPIS = [
    {
      label: "Total Pipeline",
      value: leadsCount.toLocaleString("en-IN"),
      icon: Users,
      trend: "Leads captured via Catalyst",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      shadow: "shadow-blue-500/10",
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
      href: "/admin/bookings"
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        icon={LayoutDashboard} 
        title="Command Centre" 
        description="Real-time operational intelligence and platform performance metrics."
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {KPIS.map((kpi, idx) => (
          <Link href={kpi.href} key={idx} className={`block bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] p-8 relative overflow-hidden group shadow-lg dark:shadow-2xl transition-all hover:border-blue-500/20 active:scale-95 ${kpi.shadow}`}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{kpi.label}</span>
              <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color} shadow-inner`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2">{kpi.value}</div>
            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">{kpi.trend}</div>
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-500/[0.02] dark:from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Link>
        ))}
      </div>

      {/* Live Charts */}
      <DashboardClient
        trend={trend}
        sources={sources}
        recentLeads={recentLeads}
        conversionRate={conversionRate}
      />
    </div>
  );
}

