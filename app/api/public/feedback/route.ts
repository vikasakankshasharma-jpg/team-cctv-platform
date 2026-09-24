import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { addLeadActivity } from "@/lib/crm-events";

export async function POST(req: Request) {
  try {
    const { leadId, rating, comment } = await req.json();

    if (!leadId || !rating) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const leadDoc = await adminDb.collection("leads").doc(leadId).get();
    if (!leadDoc.exists) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    // Save to feedbacks collection
    await adminDb.collection("feedbacks").add({
      lead_id: leadId,
      rating,
      comment,
      status: rating >= 4 ? "published" : "pending_action",
      created_at: new Date().toISOString()
    });

    // Log to CRM Timeline
    let alertMsg = `Customer submitted a ${rating}-star review.`;
    if (rating <= 3) {
      alertMsg = `🚨 NEGATIVE FEEDBACK: ${rating} Stars. Reason: "${comment}"`;
    } else {
      alertMsg = `⭐⭐⭐⭐⭐ POSITIVE FEEDBACK: ${rating} Stars. Redirected to Google.`;
    }

    await addLeadActivity(leadId, "SYSTEM", alertMsg);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
