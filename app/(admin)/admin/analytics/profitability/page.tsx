import { requireAdmin } from "@/lib/auth-server";
import { ProfitabilityAnalyticsClient } from "@/components/admin/ProfitabilityAnalyticsClient";
import { PageHeader } from "@/components/admin/PageHeader";
import { IndianRupee } from "lucide-react";

export const metadata = {
  title: "Profitability Analytics | TEAM CCTV",
};

export const dynamic = "force-dynamic";

export default async function ProfitabilityAnalyticsPage() {
  await requireAdmin();

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        title="Profitability Heatmaps"
        description="Live view of gross margins, hardware costs, and labor expenses across all active deals."
        icon={IndianRupee}
      />
      
      <div className="max-w-6xl">
        <ProfitabilityAnalyticsClient />
      </div>
    </div>
  );
}
