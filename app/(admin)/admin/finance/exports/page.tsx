import { FinanceExportsClient } from "@/components/admin/FinanceExportsClient";
import { requireAdmin } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Tax & Finance Exports | Command Centre",
};

export default async function FinanceExportsPage() {
  const session = await requireAdmin();
  
  // Check if they have the specific 'export_tax_reports' permission or are super_admin
  const hasExportPower = session.role === "super_admin" || session.permissions?.financial?.export_tax_reports === true;

  if (!hasExportPower) {
    redirect("/admin/dashboard");
  }

  return <FinanceExportsClient />;
}
