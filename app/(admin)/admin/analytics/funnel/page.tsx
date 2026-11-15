import { requireAdmin } from "@/lib/auth-server";
import { FunnelAnalyticsClient } from "@/components/admin/FunnelAnalyticsClient";
import { TourPerformanceWidget } from "@/components/admin/analytics/TourPerformanceWidget";
import { PageHeader } from "@/components/admin/PageHeader";
import { PipelineSubNav } from "@/components/admin/navigation/AdminSubNav";
import { Filter } from "lucide-react";

export const metadata = {
  title: "Funnel Analytics | TEAM CCTV",
};

export const dynamic = "force-dynamic";

export default async function FunnelAnalyticsPage() {
  await requireAdmin();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PipelineSubNav />
      <PageHeader
        title="Conversion & Tour Funnels"
        description="Analyze customer quotation conversion stages and guided tour engagement & drop-off telemetry."
        icon={Filter}
      />
      
      {/* 1. Core Quotation Wizard Funnel */}
      <div className="max-w-5xl space-y-4">
        <h2 className="text-base font-bold text-foreground">1. Quotation Flow Funnel</h2>
        <FunnelAnalyticsClient />
      </div>

      {/* 2. Guided Tour Telemetry & Drop-Off Performance */}
      <div className="max-w-5xl pt-4 border-t border-border/40">
        <TourPerformanceWidget />
      </div>
    </div>
  );
}
