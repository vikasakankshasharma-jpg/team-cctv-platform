import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting to prevent brute-forcing Quote IDs + Phone numbers
    const limit = await rateLimit(req, 10, 60_000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const { referenceId, mobileNumber } = await req.json();

    if (!referenceId || !mobileNumber) {
      return NextResponse.json({ error: "Quote/Booking Reference and Mobile Number are required." }, { status: 400 });
    }

    const normalizedMobile = mobileNumber.toString().replace(/^\+?91/, "").replace(/\D/g, "").trim();
    if (normalizedMobile.length !== 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
    }

    let leadId = null;

    // 2. Identify if referenceId is a Quote ID or a Lead ID
    // Try Lead ID first
    const leadDoc = await adminDb.collection("leads").doc(referenceId).get();
    
    if (leadDoc.exists) {
      leadId = leadDoc.id;
    } else {
      // Try Quote ID in root collection
      const quoteDoc = await adminDb.collection("quotes").doc(referenceId).get();
      if (quoteDoc.exists) {
        leadId = quoteDoc.data()?.lead_id || quoteDoc.data()?.leadId;
      } else {
        // Try Quote ID in collectionGroup (V2 compatibility)
        const quoteSnap = await adminDb.collectionGroup("quotes").where("id", "==", referenceId).limit(1).get();
        if (!quoteSnap.empty) {
          leadId = quoteSnap.docs[0].data()?.lead_id || quoteSnap.docs[0].data()?.leadId;
        }
      }
    }

    if (!leadId) {
      return NextResponse.json({ error: "We couldn't find a booking with that reference. Please check and try again." }, { status: 404 });
    }

    // 3. Verify Mobile Number matches the Lead
    const targetLeadDoc = await adminDb.collection("leads").doc(leadId).get();
    if (!targetLeadDoc.exists) {
      return NextResponse.json({ error: "Booking data is corrupted. Please contact support." }, { status: 500 });
    }

    const leadData = targetLeadDoc.data();
    const leadMobile = leadData?.customer_phone?.toString().replace(/^\+?91/, "").replace(/\D/g, "").trim();

    if (leadMobile !== normalizedMobile) {
      // Security measure: Don't reveal that the quote exists but phone is wrong. Keep it ambiguous.
      return NextResponse.json({ error: "The mobile number does not match the booking records." }, { status: 403 });
    }

    // 4. Success! Return leadId for frontend redirection
    return NextResponse.json({ success: true, leadId });

  } catch (error: any) {
    console.error("[Track Auth API] Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
