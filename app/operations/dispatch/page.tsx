import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth-server";
import { DispatchMapClient } from "@/components/operations/DispatchMapClient";

export const metadata = {
  title: "Live Dispatch Map | TEAM CCTV",
  description: "Bird's eye view of all active field agents and deliveries.",
};

export const dynamic = "force-dynamic";

export default async function DispatchMapPage() {
  const session = await verifySession();
  
  if (!session.isAuthenticated || (session.role !== "operations_manager" && session.role !== "super_admin")) {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <DispatchMapClient />
      </div>
    </div>
  );
}
