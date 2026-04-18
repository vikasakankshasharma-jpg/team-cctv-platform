import { NextResponse } from "next/server";
import { adminDb, arrayUnion, serverTimestamp } from "@/lib/firebase-admin";

/**
 * PATCH /api/leads/[leadId]/share
 * Records a WhatsApp share event on the lead document.
 * Body: { shared_to_number: string }
 *
 * This powers the CRM's secondary lead tracking — when a customer shares
 * their quote to a friend/partner, that number is recorded for follow-up.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const body = await request.json();
    const { shared_to_number } = body;

    if (!shared_to_number || !/^[6-9]\d{9}$/.test(shared_to_number)) {
      return NextResponse.json(
        { error: "A valid 10-digit Indian mobile number is required." },
        { status: 400 }
      );
    }

    const leadRef = adminDb.collection("leads").doc(leadId);
    const leadDoc = await leadRef.get();

    if (!leadDoc.exists) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const shareNote = `Quote shared to +91 ${shared_to_number} on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    await leadRef.update({
      shared_to_numbers: arrayUnion(shared_to_number),
      quote_shared_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      follow_up_notes: arrayUnion(shareNote),
    });

    return NextResponse.json({ success: true, note: shareNote }, { status: 200 });
  } catch (error: any) {
    console.error("Share recording error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
