import { requireAdmin } from "@/lib/auth-server";
import { AdminAmcClient } from "@/components/admin/AdminAmcClient";
import { PageHeader } from "@/components/admin/PageHeader";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "AMC Contracts | TEAM CCTV",
};

export const dynamic = "force-dynamic";

export default async function AdminAmcPage() {
  await requireAdmin();

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        title="AMC Contracts"
        description="Manage customer Annual Maintenance Contracts and track renewal revenue."
        icon={ShieldCheck}
      />
      
      <div className="max-w-5xl">
        <AdminAmcClient />
      </div>
    </div>
  );
}
