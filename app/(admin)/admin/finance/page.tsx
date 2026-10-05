import type { Metadata } from "next";
import { FinanceDashboardClient } from "@/components/admin/finance/FinanceDashboardClient";

export const metadata: Metadata = {
  title: "Finance & Accounts | Admin",
  description: "Unified Accounts Payable and Receivable",
};

export default function FinanceDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto py-6">
      <FinanceDashboardClient />
    </div>
  );
}
