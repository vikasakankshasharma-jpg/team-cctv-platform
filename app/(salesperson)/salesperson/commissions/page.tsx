import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { SalespersonCommissionsClient } from "@/components/salesperson/SalespersonCommissionsClient";
import type { CommissionRecord, Lead } from "@/types";

export const dynamic = "force-dynamic";

export default async function SalespersonCommissionsPage() {
  const session = await verifySession();
  
  if (!session.isAuthenticated || session.role !== "sales_staff") {
    redirect("/admin/login");
  }

  const salespersonUid = session.user!.uid;

  // Find the salesperson document linked to this UID
  const spSnap = await adminDb.collection("salespersons").where("firebase_uid", "==", salespersonUid).limit(1).get();
  if (spSnap.empty) {
    return <div className="p-8 text-red-400">Salesperson profile not linked correctly. Please contact admin.</div>;
  }
  
  const salespersonId = spSnap.docs[0].id;

  // Fetch commission records for this salesperson
  const commsSnap = await adminDb
    .collection(COLLECTIONS.COMMISSION_RECORDS)
    .where("user_type", "==", "salesperson")
    .where("user_id", "==", salespersonId)
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">My Commissions</h1>
        <p className="text-zinc-400 mt-2">Track your earned commissions from won deals.</p>
      </div>
      
      <SalespersonCommissionsClient 
        records={records} 
        summary={summary}
      />
    </div>
  );
}
