import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { SalesRoutePlannerClient } from "@/components/salesperson/SalesRoutePlannerClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Client Visits Plan | Sales Portal",
  description: "Plan on-site surveys, customer meetings, and generate instant quotes along your route",
};

export const dynamic = "force-dynamic";

export default async function SalespersonRoutePage() {
  const session = await verifySession();
  
  if (!session.isAuthenticated || (session.role !== "sales_staff" && session.role !== "super_admin")) {
    redirect("/admin/login");
  }

  return <SalesRoutePlannerClient />;
}
