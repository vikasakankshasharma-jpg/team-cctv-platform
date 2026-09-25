import { redirect } from "next/navigation";
import { verifyInstallerSession } from "@/lib/auth-installer";
import { RoutePlannerClient } from "@/components/installer/RoutePlannerClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daily Route Planner | Field Operations",
  description: "View and organize your daily field stops, sync with time slots and Google Maps navigation.",
};

export default async function InstallerRoutePage() {
  const session = await verifyInstallerSession();
  if (!session.isAuthenticated) redirect("/installer/login");

  return <RoutePlannerClient />;
}
