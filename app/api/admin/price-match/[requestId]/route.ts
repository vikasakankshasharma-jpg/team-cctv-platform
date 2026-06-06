import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await verifySession();
  if (!session.isAuthenticated || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { requestId } = await params;
    const body = await request.json();
    const { status, review_notes, approved_discount_flat, approved_discount_percent, counter_offer_amount, lead_id } = body;

    if (!lead_id) {
      return NextResponse.json({ error: "Missing lead_id" }, { status: 400 });
    }

    const leadRef = adminDb.collection("leads").doc(lead_id);
    const requestRef = leadRef.collection("price_match_requests").doc(requestId);

    const docSnap = await requestRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Price match request not found" }, { status: 404 });
    }

    // Update the request
    await requestRef.update({
      status,
      review_notes: review_notes || null,
      approved_discount_flat: approved_discount_flat || null,
      approved_discount_percent: approved_discount_percent || null,
      counter_offer_amount: counter_offer_amount || null,
      reviewer_id: session.user?.uid || "admin",
      reviewer_name: session.user?.name || "Admin",
      reviewer_role: "admin",
      reviewed_at: serverTimestamp()
    });

    // Mirror the status to the lead document so the salesperson sees it instantly
    await leadRef.update({
      price_match_status: status,
      updated_at: serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating price match request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
