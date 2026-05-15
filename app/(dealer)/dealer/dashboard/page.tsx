import { redirect } from "next/navigation";
import { verifyDealerSession } from "@/lib/auth-dealer";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { DealerDashboardClient } from "@/components/dealer/DealerDashboardClient";
import type { FranchiseDealer, Lead } from "@/types";

export const dynamic = "force-dynamic";

export default async function DealerDashboardPage() {
  const session = await verifyDealerSession();
  if (!session.isAuthenticated) redirect("/dealer/login");
  const dealerId = session.dealerId!;

  // 1. Fetch Dealer Data for stats
  const dealerDoc = await adminDb.collection(COLLECTIONS.FRANCHISE_DEALERS).doc(dealerId).get();
  const dealer = { id: dealerDoc.id, ...dealerDoc.data() } as FranchiseDealer & { id: string };

  // 2. Fetch Recent Leads for this dealer
  const leadsSnap = await adminDb
    .collection(COLLECTIONS.LEADS)
    .where("franchise_dealer_id", "==", dealerId)
    .orderBy("created_at", "desc")
    .limit(10)
    .get();

  const leads = leadsSnap.docs.map((doc) => {
    const data = doc.data() as Lead;
    return {
      id: doc.id,
      customer_name: data.customer_name,
      mobile_number: data.mobile_number,
      status: data.status,
      created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at,
    };
  });

  // 3. Status aggregate for the pipeline view
  const allLeadsSnap = await adminDb
    .collection(COLLECTIONS.LEADS)
    .where("franchise_dealer_id", "==", dealerId)
    .get();
  
  const pipeline = { new: 0, contacted: 0, site_visit: 0, quoted: 0, won: 0, lost: 0 };
  const pincodePerformance: Record<string, number> = {};
  
  // Lead Velocity (Last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  let recentLeadCount = 0;

  allLeadsSnap.docs.forEach((doc) => {
    const data = doc.data();
    const status = data.status as keyof typeof pipeline;
    if (pipeline[status] !== undefined) pipeline[status]++;

    const pin = data.address?.pincode || data.wizard_answers?.lead_pincode;
    if (pin) pincodePerformance[pin] = (pincodePerformance[pin] || 0) + 1;

    const createdAt = data.created_at?.toDate?.() || new Date(data.created_at);
    if (createdAt >= sevenDaysAgo) recentLeadCount++;
  });

  const leadVelocity = Number((recentLeadCount / 7).toFixed(1));
  const topPincodes = Object.entries(pincodePerformance)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <DealerDashboardClient
      dealer={dealer}
      recentLeads={leads}
      pipeline={pipeline}
      leadVelocity={leadVelocity}
      topPincodes={topPincodes}
    />
  );
}
