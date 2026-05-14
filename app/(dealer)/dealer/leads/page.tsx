import { redirect } from "next/navigation";
import { verifyDealerSession } from "@/lib/auth-dealer";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { DealerLeadsClient } from "@/components/dealer/DealerLeadsClient";
import type { Lead } from "@/types";

export const dynamic = "force-dynamic";

export default async function DealerLeadsPage() {
  const session = await verifyDealerSession();
  if (!session.isAuthenticated) redirect("/dealer/login");
  const dealerId = session.dealerId!;

  // Fetch all leads for this dealer
  const leadsSnap = await adminDb
    .collection(COLLECTIONS.LEADS)
    .where("franchise_dealer_id", "==", dealerId)
    .orderBy("created_at", "desc")
    .get();

  const leads = leadsSnap.docs.map((doc) => {
    const data = doc.data() as Lead;
    return {
      id: doc.id,
      customer_name: data.customer_name,
      mobile_number: data.mobile_number,
      status: data.status,
      property_type: data.property_type,
      technology_choice: data.technology_choice,
      created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at,
    };
  });

  return (
    <DealerLeadsClient leads={leads} dealerId={dealerId} />
  );
}
