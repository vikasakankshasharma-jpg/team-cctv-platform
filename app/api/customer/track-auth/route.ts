import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting to prevent brute-forcing
    const limit = await rateLimit(req, 15, 60_000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
    }

    const { referenceId: rawReference } = await req.json();

    if (!rawReference || typeof rawReference !== "string") {
      return NextResponse.json({ error: "Booking reference, Quote ID, or Mobile number is required." }, { status: 400 });
    }

    const ref = rawReference.trim();
    const cleanDigits = ref.replace(/\D/g, "");
    const isMobile = cleanDigits.length === 10 && /^[6-9]/.test(cleanDigits);

    // ────────────────────────────────────────────────────────────
    // 2. SEARCH BY 10-DIGIT MOBILE NUMBER
    // ────────────────────────────────────────────────────────────
    if (isMobile) {
      // Find latest lead by mobile number
      const leadSnap = await adminDb
        .collection("leads")
        .where("mobile_number", "==", cleanDigits)
        .orderBy("created_at", "desc")
        .limit(1)
        .get()
        .catch(async () => {
          // Fallback if index missing on created_at
          return adminDb.collection("leads").where("mobile_number", "==", cleanDigits).limit(1).get();
        });

      if (!leadSnap.empty) {
        return NextResponse.json({ success: true, leadId: leadSnap.docs[0].id });
      }

      // Check alternate customer_phone field
      const altLeadSnap = await adminDb
        .collection("leads")
        .where("customer_phone", "==", cleanDigits)
        .limit(1)
        .get();

      if (!altLeadSnap.empty) {
        return NextResponse.json({ success: true, leadId: altLeadSnap.docs[0].id });
      }

      // Check quotes by customer_mobile
      const quoteSnap = await adminDb
        .collection("quotes")
        .where("customer_mobile", "in", [cleanDigits, `+91${cleanDigits}`])
        .orderBy("createdAt", "desc")
        .limit(1)
        .get()
        .catch(async () => {
          return adminDb.collection("quotes").where("customer_mobile", "==", cleanDigits).limit(1).get();
        });

      if (!quoteSnap.empty) {
        const qData = quoteSnap.docs[0].data();
        const targetId = qData.lead_id || qData.leadId || quoteSnap.docs[0].id;
        return NextResponse.json({ success: true, leadId: targetId });
      }

      return NextResponse.json({ 
        error: "No bookings or quotations found for this mobile number. Please check the number or contact support." 
      }, { status: 404 });
    }

    // ────────────────────────────────────────────────────────────
    // 3. SEARCH BY LEAD ID DIRECTLY
    // ────────────────────────────────────────────────────────────
    const leadDoc = await adminDb.collection("leads").doc(ref).get();
    if (leadDoc.exists) {
      return NextResponse.json({ success: true, leadId: leadDoc.id });
    }

    // ────────────────────────────────────────────────────────────
    // 4. SEARCH BY QUOTE ID (Root quotes collection & case variants)
    // ────────────────────────────────────────────────────────────
    // Exact Doc ID
    const quoteDoc = await adminDb.collection("quotes").doc(ref).get();
    if (quoteDoc.exists) {
      const qData = quoteDoc.data();
      const targetId = qData?.lead_id || qData?.leadId || quoteDoc.id;
      return NextResponse.json({ success: true, leadId: targetId });
    }

    // Uppercase Doc ID (e.g. user typed qt-2026-...)
    const upperRef = ref.toUpperCase();
    if (upperRef !== ref) {
      const upperQuoteDoc = await adminDb.collection("quotes").doc(upperRef).get();
      if (upperQuoteDoc.exists) {
        const qData = upperQuoteDoc.data();
        const targetId = qData?.lead_id || qData?.leadId || upperQuoteDoc.id;
        return NextResponse.json({ success: true, leadId: targetId });
      }
    }

    // By quote_id field query
    const quoteFieldSnap = await adminDb.collection("quotes").where("quote_id", "==", ref).limit(1).get();
    if (!quoteFieldSnap.empty) {
      const qData = quoteFieldSnap.docs[0].data();
      const targetId = qData?.lead_id || qData?.leadId || quoteFieldSnap.docs[0].id;
      return NextResponse.json({ success: true, leadId: targetId });
    }

    // ────────────────────────────────────────────────────────────
    // 5. SEARCH BY INVOICE ID / JOB ID / ORDER ID
    // ────────────────────────────────────────────────────────────
    const invDoc = await adminDb.collection("invoices").doc(ref).get();
    if (invDoc.exists) {
      const invData = invDoc.data();
      const targetId = invData?.lead_id || invData?.quote_id || invDoc.id;
      return NextResponse.json({ success: true, leadId: targetId });
    }

    const jobDoc = await adminDb.collection("jobs").doc(ref).get();
    if (jobDoc.exists) {
      const jobData = jobDoc.data();
      const targetId = jobData?.lead_id || jobData?.quote_id || jobDoc.id;
      return NextResponse.json({ success: true, leadId: targetId });
    }

    // ────────────────────────────────────────────────────────────
    // 6. SEARCH IN COLLECTIONGROUP QUOTES (Subcollection compatibility)
    // ────────────────────────────────────────────────────────────
    try {
      const cgQuoteSnap = await adminDb.collectionGroup("quotes").where("id", "==", ref).limit(1).get();
      if (!cgQuoteSnap.empty) {
        const qData = cgQuoteSnap.docs[0].data();
        const parentLeadId = cgQuoteSnap.docs[0].ref.parent?.parent?.id;
        const targetId = parentLeadId || qData?.lead_id || qData?.leadId || cgQuoteSnap.docs[0].id;
        return NextResponse.json({ success: true, leadId: targetId });
      }
    } catch {
      // Ignored
    }

    return NextResponse.json({ 
      error: "We couldn't find a booking with that reference. Please check your Quote ID or enter your 10-digit mobile number." 
    }, { status: 404 });

  } catch (error: any) {
    console.error("[Track Auth API] Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
