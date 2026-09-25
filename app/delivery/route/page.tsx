import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth-server";
import { DeliveryRoutePlannerClient } from "@/components/delivery/DeliveryRoutePlannerClient";

export const metadata = {
  title: "Delivery Daily Route Planner | TEAM CCTV",
  description: "Daily hardware dispatch route sequencing, OTP verification, and COD collection",
};

export const dynamic = "force-dynamic";

export default async function DeliveryRoutePage() {
  const session = await verifySession();
  if (!session.isAuthenticated) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <DeliveryRoutePlannerClient />
      </div>
    </div>
  );
}
