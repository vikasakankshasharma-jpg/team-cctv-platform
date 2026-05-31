import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, FileText, Percent, BadgeIndianRupee, LayoutDashboard, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DashboardClient, type WeeklyBucket, type SourceBreakdown, type RecentActivity } from "@/components/admin/DashboardClient";
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

  const [leadsCountRes, wonLeadsCountRes, promotersSnapshot, recentLeadsSnap, internalCountRes, internalSnap] = await Promise.all([
    adminDb.collection("leads").count().get(),
    adminDb.collection("leads").where("status", "==", "won").count().get(),
    adminDb.collection("promoters").get(),
    adminDb.collection("leads").orderBy("created_at", "desc").limit(7).get(),
    adminDb.collection("leads").where("is_escalated", "==", true).count().get(),
    adminDb.collection("leads").where("is_escalated", "==", true).limit(5).get(),
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
      color: "bg-[var(--gold)] text-white",
    },
    {
      label: "Organic / Direct",
      count: organicCount,
      percent: leadsCount > 0 ? Math.round((organicCount / leadsCount) * 100) : 0,
      color: "bg-[var(--surface3)] text-[var(--text)]",
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
      trendIcon: TrendingUp,
      trendClass: "up",
      colorVar: "var(--blue)",
      dimVar: "var(--blue-dim)",
      progress: "75%",
      href: "/admin/leads"
    },
    {
      label: "Operational Success",
      value: wonLeadsCount.toLocaleString("en-IN"),
      icon: FileText,
      trend: "Closed/Won transactions",
      trendIcon: TrendingUp,
      trendClass: "up",
      colorVar: "var(--green)",
      dimVar: "var(--green-dim)",
      progress: "42%",
      href: "/admin/leads"
    },
    {
      label: "Yield Velocity",
      value: `${conversionRate}%`,
      icon: Percent,
      trend: "Lead conversion efficacy",
      trendIcon: Minus,
      trendClass: "neutral",
      colorVar: "var(--purple)",
      dimVar: "var(--purple-dim)",
      progress: conversionRate + "%",
      href: "/admin/leads"
    },
    {
      label: "Gross Throughput",
      value: `₹${Math.floor(totalExTaxBusiness/1000)}k`,
      icon: BadgeIndianRupee,
      trend: "Ex-tax net business volume",
      trendIcon: TrendingUp,
      trendClass: "up",
      colorVar: "var(--gold)",
      dimVar: "var(--gold-dim)",
      progress: "80%",
      href: "/admin/bookings"
    },
  ];

  return (
    <div className="animate-in fade-in duration-700 pb-12">
      {/* KPI Grid */}
      <div className="kpi-grid">
        {KPIS.map((kpi, idx) => (
          <Link href={kpi.href} key={idx} className="kpi block" style={{ textDecoration: 'none' }}>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
            <div className={`kpi-delta ${kpi.trendClass}`}>
              <kpi.trendIcon style={{ width: '12px', height: '12px' }} />
              {kpi.trend}
            </div>
            
            <div className="kpi-icon" style={{ background: kpi.dimVar, color: kpi.colorVar }}>
              <kpi.icon />
            </div>
            
            <div className="kpi-bar" style={{ background: kpi.colorVar, width: kpi.progress }}></div>
          </Link>
        ))}
      </div>

      {/* Two-Column Grid for live charts/tables */}
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

