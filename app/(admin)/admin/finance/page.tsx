import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-server";
import { FinanceDashboardClient } from "@/components/admin/finance/FinanceDashboardClient";
import { FinanceSubNav } from "@/components/admin/navigation/AdminSubNav";

export const metadata: Metadata = {
  title: "Finance & Accounts | Admin",
  description: "Unified Accounts Payable and Receivable",
};

export const dynamic = "force-dynamic";

export default async function FinanceDashboardPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <FinanceSubNav />
      <div className="max-w-7xl mx-auto">
        <FinanceDashboardClient />
      </div>
    </div>
  );
}
