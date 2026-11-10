import type { Metadata } from "next";
import { FinanceDashboardClient } from "@/components/admin/finance/FinanceDashboardClient";
import { FinanceSubNav } from "@/components/admin/navigation/AdminSubNav";

export const metadata: Metadata = {
  title: "Finance & Accounts | Admin",
  description: "Unified Accounts Payable and Receivable",
};

export default function FinanceDashboardPage() {
  return (
    <div className="space-y-6">
      <FinanceSubNav />
      <div className="max-w-7xl mx-auto">
        <FinanceDashboardClient />
      </div>
    </div>
  );
}
