import { LogisticsDashboardClient } from "@/components/admin/logistics/LogisticsDashboardClient";
import { requireAdmin } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Logistics & Inventory | Command Centre",
};

export default async function LogisticsPage() {
  const session = await requireAdmin();
  
  // Inventory/Logistics should ideally be restricted to operations or super_admin
  const hasOpsPower = session.role === "super_admin" || session.permissions?.operations?.manage_hubs === true || session.permissions?.catalog?.edit_catalog === true;

  if (!hasOpsPower) {
    redirect("/admin/dashboard");
  }

  return <LogisticsDashboardClient />;
}
