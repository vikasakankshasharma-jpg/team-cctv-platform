import { NextRequest, NextResponse } from "next/server";
import { requireDealerSession } from "@/lib/auth-dealer";
import { adminDb, increment, serverTimestamp } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDealerSession();
    const dealerId = session.dealerId!;
    const { id } = await params;

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    // 1. Fetch current lead
    const leadRef = adminDb.collection(COLLECTIONS.LEADS).doc(id);
    const leadDoc = await leadRef.get();
    
    if (!leadDoc.exists) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const leadData = leadDoc.data();

    // 2. Security Check: Lead must belong to the dealer
    if (leadData?.franchise_dealer_id !== dealerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const previousStatus = leadData?.status;

    // 3. Update status in leads collection
    await leadRef.update({
      status,
      updated_at: serverTimestamp()
    });

    // 4. Handle Dealer Performance Counter Updates
    // If status changed to 'won' for the first time
    if (status === "won" && previousStatus !== "won") {
      await adminDb.collection(COLLECTIONS.FRANCHISE_DEALERS).doc(dealerId).update({
        total_leads_won: increment(1),
        updated_at: serverTimestamp()
      });
      
      // In Phase 3, we would also create a commission ledger record here
      // and update 'total_commission_due' and 'total_ex_tax_business'
    } 
    // If status was 'won' but changed back to something else (rare, but handle it)
    else if (previousStatus === "won" && status !== "won") {
      await adminDb.collection(COLLECTIONS.FRANCHISE_DEALERS).doc(dealerId).update({
        total_leads_won: increment(-1),
        updated_at: serverTimestamp()
      });
    }

    return NextResponse.json({ success: true, message: "Status updated" });
  } catch (err) {
    console.error("[Dealer Lead Status API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
