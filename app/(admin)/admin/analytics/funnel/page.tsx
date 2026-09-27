import { requireAdmin } from "@/lib/auth-server";
import { FunnelAnalyticsClient } from "@/components/admin/FunnelAnalyticsClient";
import { PageHeader } from "@/components/admin/PageHeader";
import { Filter } from "lucide-react";

export const metadata = {
  title: "Funnel Analytics | TEAM CCTV",
};

export const dynamic = "force-dynamic";

export default async function FunnelAnalyticsPage() {
  await requireAdmin();

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        title="Quotation Funnel"
        description="Analyze customer drop-off rates through the quotation wizard steps."
        icon={Filter}
      />
      
      <div className="max-w-4xl">
        <FunnelAnalyticsClient />
      </div>
    </div>
  );
}
