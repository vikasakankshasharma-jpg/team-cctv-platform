import { redirect } from "next/navigation";
import { verifyPartnerSession } from "@/lib/auth-partner";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/lib/constants";
import { PartnerDashboardClient } from "@/components/partner/PartnerDashboardClient";
import type { CommissionRecord, Lead } from "@/types";

export const dynamic = "force-dynamic";

export default async function PartnerDashboardPage() {
  const session = await verifyPartnerSession();
  if (!session.isAuthenticated) redirect("/partner/login");
  const promoterId = session.promoterId!;

  // 1. Fetch Commission Summary
  const commsSnap = await adminDb
    .collection(COLLECTIONS.COMMISSION_RECORDS)
    .where("promoter_id", "==", promoterId)
    .get();

  let totalEarned = 0;
  let pendingPayout = 0;
  let totalPaid = 0;

  commsSnap.docs.forEach((doc) => {
    const data = doc.data() as CommissionRecord;
    totalEarned += data.commission_amount;
    if (data.status === "pending") pendingPayout += data.commission_amount;
    if (data.status === "paid") totalPaid += data.commission_amount;
  });

  // 2. Fetch Recent Won Leads
  const recentCommsSnap = await adminDb
    .collection(COLLECTIONS.COMMISSION_RECORDS)
    .where("promoter_id", "==", promoterId)
    .orderBy("created_at", "desc")
    .limit(5)
    .get();

  const recentWinsPromises = recentCommsSnap.docs.map(async (doc) => {
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
      commission_amount: data.commission_amount,
      status: data.status,
      created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at,
    };
  });

  const recentWins = await Promise.all(recentWinsPromises);

  // 3. Count Total Leads and aggregate statuses
  const leadsSnap = await adminDb.collection(COLLECTIONS.LEADS).where("promoter_id", "==", promoterId).get();
  const totalLeads = leadsSnap.size;
  
  const pipeline = {
    new: 0,
    contacted: 0,
    site_visit: 0,
    quoted: 0,
    won: 0,
    lost: 0,
  };
  
  leadsSnap.docs.forEach((doc) => {
    const status = doc.data().status as keyof typeof pipeline;
    if (pipeline[status] !== undefined) {
      pipeline[status]++;
    }
  });

  // 4. Fetch Promoter details for referral code
  const promoterDoc = await adminDb.collection(COLLECTIONS.PROMOTERS).doc(promoterId).get();
  const referralCode = promoterDoc.data()?.referral_code || "";

  // 5. Calculate SLA Breaches
  const now = new Date();
  let slaBreachesCount = 0;
  leadsSnap.docs.forEach(doc => {
    const data = doc.data() as Lead;
    if (data.sla_breach_at) {
      const breachDate = (data.sla_breach_at as any)?.toDate?.() || new Date(data.sla_breach_at as any);
      if (breachDate < now && data.status !== "won" && data.status !== "lost" && data.status !== "quoted") {
        slaBreachesCount++;
      }
    }
  });

  return (
    <PartnerDashboardClient 
      partnerName={session.promoterName || "Partner"}
      referralCode={referralCode}
      stats={{
        totalEarned,
        pendingPayout,
        totalPaid,
        totalLeads
      }}
      recentWins={recentWins}
      pipeline={pipeline}
      slaBreachesCount={slaBreachesCount}
    />
  );
}
