import { NextResponse } from "next/server";
import { requirePartnerSession } from "@/lib/auth-partner";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/lib/constants";
import type { Lead, CommissionRecord } from "@/types";

export async function GET() {
  try {
    const session = await requirePartnerSession();

    // Fetch leads where promoter_id matches
    const leadsSnap = await adminDb
      .collection(COLLECTIONS.LEADS)
      .where("promoter_id", "==", session.promoterId)
      .orderBy("created_at", "desc")
      .get();

    // Also fetch commissions to attach commission amounts to won leads
    const commsSnap = await adminDb
      .collection(COLLECTIONS.COMMISSION_RECORDS)
      .where("promoter_id", "==", session.promoterId)
      .get();
      
    const commissionMap = new Map<string, number>();
    commsSnap.docs.forEach(doc => {
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
        created_at: leadData.created_at,
        total_payable: totalPayable,
        commission_amount: commissionMap.get(doc.id) || 0,
      };
    });

    const leads = await Promise.all(leadsPromises);

    return NextResponse.json({ leads });
  } catch (error) {
    if (error instanceof Error && error.message === "PARTNER_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Partner Leads GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
