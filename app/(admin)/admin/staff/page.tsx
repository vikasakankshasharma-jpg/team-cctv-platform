import { requireAdmin } from "@/lib/auth-server";
import { StaffManagementClient } from "@/components/admin/StaffManagementClient";
import { FinanceSubNav } from "@/components/admin/navigation/AdminSubNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff & Access Control | Command Centre",
  description: "Manage internal staff roles, permissions, and territory access.",
};

export const dynamic = "force-dynamic";

export default async function StaffManagementPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <FinanceSubNav />
      <StaffManagementClient />
    </div>
  );
}
