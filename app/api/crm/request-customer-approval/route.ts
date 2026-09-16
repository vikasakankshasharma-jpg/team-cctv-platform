import { NextResponse } from "next/server";
import { adminDb, serverTimestamp, arrayUnion } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    if (!(await checkRole(request, ["SUPER_ADMIN", "ADMIN", "SALES"]))) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { quoteId, discountAmount, finalPrice, grossProfit } = body;
    
    if (!quoteId) {
      return NextResponse.json({ success: false, message: "Quote ID required" }, { status: 400 });
    }

    // CRM fetches from `/api/crm/quotes/:id` which queries the quotes root collection
    // Let's query across all quotes or find the quote by ID directly.
    let actualQuoteRef: any = null;
    let actualLeadId: string | null = null;
    
    const globalQuoteDoc = await adminDb.collection("quotes").doc(quoteId).get();
    
    if (globalQuoteDoc.exists) {
        actualQuoteRef = globalQuoteDoc.ref;
        actualLeadId = globalQuoteDoc.data()?.leadId;
    } else {
        // Search in leads subcollection
        const leadsSnap = await adminDb.collection("leads").get();
        for (const lead of leadsSnap.docs) {
            const subQuote = await lead.ref.collection("quotes").doc(quoteId).get();
            if (subQuote.exists) {
                actualQuoteRef = subQuote.ref;
                actualLeadId = lead.id;
                break;
            }
        }
    }

    if (!actualQuoteRef) {
        return NextResponse.json({ success: false, message: "Quote not found" }, { status: 404 });
    }

    // Update lead status
    if (actualLeadId) {
        await adminDb.collection("leads").doc(actualLeadId).update({
            status: "pending_customer_approval",
            active_offer: {
                type: "discount_flat",
                value: discountAmount,
                campaign_id: "salesperson_negotiation"
            },
            follow_up_notes: arrayUnion(`Salesperson sent revised quote (discount: ₹${discountAmount}) to customer for approval.`),
            updated_at: serverTimestamp()
        });
    }

    // We update the quote itself
    await actualQuoteRef.update({
        status: "pending_customer_approval",
        negotiated_discount: discountAmount,
        negotiated_final_price: finalPrice,
    });
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com";
    const approvalLink = `${baseUrl}/quote/${actualLeadId}/review/${quoteId}`;

    return NextResponse.json({ success: true, leadId: actualLeadId, quoteId: quoteId, approvalLink });
  } catch (error: any) {
    console.error("Customer Approval Request Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
