import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { addLeadActivity } from "@/lib/crm-events";
import { getApiMessage, resolveRequestLocale } from "@/lib/i18n/api-messages";

export async function POST(req: Request) {
  let locale = resolveRequestLocale(req);
  try {
    const body = await req.json();
    locale = resolveRequestLocale(req, body);
    const { leadId, rating, comment } = body;

    if (!leadId || !rating) {
      return NextResponse.json({ success: false, error: getApiMessage(locale, "missing_fields") }, { status: 400 });
    }

    const leadDoc = await adminDb.collection("leads").doc(leadId).get();
    if (!leadDoc.exists) {
      return NextResponse.json({ success: false, error: getApiMessage(locale, "lead_not_found") }, { status: 404 });
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
    return NextResponse.json({ success: false, error: getApiMessage(locale, "internal_error") }, { status: 500 });
  }
}
