import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { BeatPlannerWorkspace } from "@/components/crm/BeatPlannerWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Client Visits & B2B Beat Plan | Sales Portal",
  description: "Plan on-site surveys, customer meetings, and B2B partner check-ins along your route",
};

export const dynamic = "force-dynamic";

export default async function SalespersonRoutePage() {
  const session = await verifySession();
  
  if (!session.isAuthenticated || (session.role !== "sales_staff" && session.role !== "super_admin")) {
    redirect("/admin/login");
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <BeatPlannerWorkspace isAdmin={false} />
    </div>
  );
}
