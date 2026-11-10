import React from "react";
import { requireAdmin } from "@/lib/auth-server";
import { BeatPlannerWorkspace } from "@/components/crm/BeatPlannerWorkspace";
import { CrmSubNav } from "@/components/admin/navigation/AdminSubNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Territory Beat Planner & Routes | Admin CRM",
  description: "Plan and optimize daily field routes for Customer Site Surveys and B2B Channel Partner visits.",
};

export const dynamic = "force-dynamic";

export default async function AdminBeatPlansPage() {
  await requireAdmin();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <CrmSubNav />
      <BeatPlannerWorkspace isAdmin={true} />
    </div>
  );
}
