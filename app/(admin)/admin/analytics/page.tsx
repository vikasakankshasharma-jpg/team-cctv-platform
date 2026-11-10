import { requireAdmin } from "@/lib/auth-server";
import { AnalyticsClient } from "@/components/admin/AnalyticsClient";
import { PipelineSubNav } from "@/components/admin/navigation/AdminSubNav";

export const metadata = {
  title: "Analytics Trends | Admin | TEAM CCTV",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PipelineSubNav />
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Analytics Trends & Insights</h1>
          <p className="text-zinc-500 font-medium text-xs mt-1">Real-time overview of business performance and pipeline velocity.</p>
        </div>
      </div>
      
      <AnalyticsClient />
    </div>
  );
}
