import type { Metadata } from "next";
import { BillingDashboardClient } from "@/components/admin/finance/BillingDashboardClient";
import { FinanceSubNav } from "@/components/admin/navigation/AdminSubNav";
import { requireAdmin } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Cloud Costs & Budgets | Admin",
  description: "Real-time cost observatory, budget limits, and credit monitors",
};

export default async function BillingDashboardPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <FinanceSubNav />
      <div className="max-w-7xl mx-auto">
        <BillingDashboardClient />
      </div>
    </div>
  );
}
