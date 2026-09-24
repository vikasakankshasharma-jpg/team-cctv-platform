import { redirect } from "next/navigation";
import { verifyPartnerSession } from "@/lib/auth-partner";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { PartnerCommissionsClient } from "@/components/partner/PartnerCommissionsClient";
import type { CommissionRecord, Lead } from "@/types";
import { TaxationEngine } from "@/lib/taxation-engine";


export const dynamic = "force-dynamic";

export default async function PartnerCommissionsPage() {
  const session = await verifyPartnerSession();
  if (!session.isAuthenticated) redirect("/partner/login");
  const promoterId = session.promoterId!;

  // Fetch commission records for partner
  
  const promoterDoc = await adminDb.collection(COLLECTIONS.PROMOTERS).doc(promoterId).get();
  const promoterData = promoterDoc.data();
  const hasValidPan = !!(promoterData?.pan_number && promoterData.pan_number.length === 10);

  const commsSnap = await adminDb
    .collection(COLLECTIONS.COMMISSION_RECORDS)
    .where("promoter_id", "==", promoterId)
    .orderBy("created_at", "desc")
    .get();
  const recordsPromises = commsSnap.docs.map(async (doc) => {
    const data = doc.data() as any;
    let customerName = "Unknown Customer";
    try {
      const leadSnap = await adminDb.collection(COLLECTIONS.LEADS).doc(data.lead_id).get();
      if (leadSnap.exists) {
        customerName = (leadSnap.data() as Lead).customer_name;
      }
    } catch (e) {}

    return {
      id: doc.id,
      lead_id: data.lead_id,
      customer_name: customerName,
      ex_tax_amount: data.ex_tax_amount,
      commission_amount: data.commission_amount,
      status: data.status,
      created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at,
      paid_at: (data.paid_at as any)?.toDate?.()?.toISOString() || data.paid_at,
    };
  });

  const records = await Promise.all(recordsPromises);

  
  let totalEarned = 0;
  let totalPending = 0;
  let totalPaid = 0;

  for (const rec of records) {
    totalEarned += rec.commission_amount;
    if (rec.status === 'pending') totalPending += rec.commission_amount;
    if (rec.status === 'paid') totalPaid += rec.commission_amount;
  }

  // Calculate strict TDS via the engine for the pending amount (or total year depending on design, but let's just do it over totalEarned to show their net liability)
  const tdsCalculation = await TaxationEngine.calculate194H(totalEarned, 0, hasValidPan);
  
  const summary = {
    totalEarned,
    totalPending,
    totalPaid,
    tdsDeducted: tdsCalculation.tdsAmount,
    netPayable: tdsCalculation.netPayable,
    tdsRatePercent: tdsCalculation.tdsRatePercent,
    hasValidPan
  };


  return (
    <PartnerCommissionsClient 
      records={records} 
      summary={summary}
    />
  );
}

