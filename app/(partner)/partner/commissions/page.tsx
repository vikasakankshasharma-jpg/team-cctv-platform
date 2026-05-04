import { verifyPartnerSession } from "@/lib/auth-partner";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { PartnerCommissionsClient } from "@/components/partner/PartnerCommissionsClient";
import type { CommissionRecord, Lead } from "@/types";

export const dynamic = "force-dynamic";

export default async function PartnerCommissionsPage() {
  const session = await verifyPartnerSession();
  const promoterId = session.promoterId!;

  // Fetch commission records for partner
  const commsSnap = await adminDb
    .collection(COLLECTIONS.COMMISSION_RECORDS)
    .where("promoter_id", "==", promoterId)
    .orderBy("created_at", "desc")
    .get();
  const recordsPromises = commsSnap.docs.map(async (doc) => {
    const data = doc.data() as CommissionRecord;
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

  const summary = records.reduce((acc, rec) => ({
    totalEarned: acc.totalEarned + rec.commission_amount,
    totalPending: acc.totalPending + (rec.status === 'pending' ? rec.commission_amount : 0),
    totalPaid: acc.totalPaid + (rec.status === 'paid' ? rec.commission_amount : 0),
  }), { totalEarned: 0, totalPending: 0, totalPaid: 0 });

  return (
    <PartnerCommissionsClient 
      records={records} 
      summary={summary}
    />
  );
}
