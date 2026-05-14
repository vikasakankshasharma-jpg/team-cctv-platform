import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/admin/PageHeader";
import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import { NewFranchiseClient } from "./NewFranchiseClient";

export const metadata: Metadata = {
  title: "New Franchise Dealer | Admin",
};

export default async function NewFranchisePage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Building2}
        title="Add Franchise Dealer"
        description="Onboard a new TEAM CCTV franchise dealer. After creation you will be taken to set their location-specific pricing."
      />
      <NewFranchiseClient />
    </div>
  );
}
