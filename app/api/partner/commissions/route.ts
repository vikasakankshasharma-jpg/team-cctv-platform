import { NextResponse } from "next/server";
import { requirePartnerSession } from "@/lib/auth-partner";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import type { CommissionRecord, Lead } from "@/types";

export async function GET() {
  try {
    const session = await requirePartnerSession();

    // Fetch commission records for partner
    const commsSnap = await adminDb
      .collection(COLLECTIONS.COMMISSION_RECORDS)
      .where("promoter_id", "==", session.promoterId)
      .orderBy("created_at", "desc")
      .get();

    let totalEarned = 0;
    let totalPending = 0;
    let totalPaid = 0;

    const recordsPromises = commsSnap.docs.map(async (doc) => {
      const data = doc.data() as CommissionRecord;
      
      // Calculate totals
      totalEarned += data.commission_amount;
      if (data.status === "pending") {
        totalPending += data.commission_amount;
      } else if (data.status === "paid") {
        totalPaid += data.commission_amount;
      }

      // Fetch lead name for UI context
      let customerName = "Unknown Customer";
      try {
        const leadSnap = await adminDb.collection(COLLECTIONS.LEADS).doc(data.lead_id).get();
        if (leadSnap.exists) {
          customerName = (leadSnap.data() as Lead).customer_name;
        }
      } catch (e) {
        // Ignore read errors for individual leads
      }

      return {
        id: doc.id,
        ...data,
        customer_name: customerName,
      };
    });

    const records = await Promise.all(recordsPromises);

    return NextResponse.json({
      records,
      summary: {
        totalEarned,
        totalPending,
        totalPaid,
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PARTNER_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Partner Commissions GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
