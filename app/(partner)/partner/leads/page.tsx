import { redirect } from "next/navigation";
import { verifyPartnerSession } from "@/lib/auth-partner";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/lib/constants";
import { PartnerLeadsClient } from "@/components/partner/PartnerLeadsClient";
import type { Lead, CommissionRecord } from "@/types";

export const dynamic = "force-dynamic";

export default async function PartnerLeadsPage() {
  const session = await verifyPartnerSession();
  if (!session.isAuthenticated) redirect("/partner/login");
  const promoterId = session.promoterId!;

  // Fetch leads where promoter_id matches
  const leadsSnap = await adminDb
    .collection(COLLECTIONS.LEADS)
    .where("promoter_id", "==", promoterId)
    .orderBy("created_at", "desc")
    .get();

  // Also fetch commissions to attach commission amounts to won leads
  const commsSnap = await adminDb
    .collection(COLLECTIONS.COMMISSION_RECORDS)
    .where("promoter_id", "==", promoterId)
    .get();
    
  const commissionMap = new Map<string, number>();
  commsSnap.docs.forEach((doc) => {
    const data = doc.data() as CommissionRecord;
    commissionMap.set(data.lead_id, data.commission_amount);
  });

  const leadsPromises = leadsSnap.docs.map(async (doc) => {
    const leadData = doc.data() as Lead;
    
    // Fetch latest quote to get total_payable
    let totalPayable = 0;
    if (["quoted", "won", "lost"].includes(leadData.status)) {
      const quotesSnap = await doc.ref
        .collection(SUBCOLLECTIONS.QUOTES)
        .orderBy("created_at", "desc")
        .limit(1)
        .get();
        
      if (!quotesSnap.empty) {
        totalPayable = quotesSnap.docs[0].data().total_payable || 0;
      }
    }

    return {
      id: doc.id,
      customer_name: leadData.customer_name,
      property_type: leadData.property_type,
      technology_choice: leadData.technology_choice,
      status: leadData.status,
      created_at: (leadData.created_at as any)?.toDate?.()?.toISOString() || leadData.created_at,
      total_payable: totalPayable,
      commission_amount: commissionMap.get(doc.id) || 0,
    };
  });

  const leads = await Promise.all(leadsPromises);

  return <PartnerLeadsClient initialLeads={leads} />;
}
