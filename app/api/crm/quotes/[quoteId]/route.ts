import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    
    let quoteDoc = await adminDb.collection("quotes").doc(quoteId).get();
    let quoteData: any = quoteDoc.exists ? quoteDoc.data() : null;

    let leadId = quoteData?.leadId || quoteData?.lead_id || quoteId;
    let leadDoc = await adminDb.collection("leads").doc(leadId).get();
    let leadData: any = leadDoc.exists ? leadDoc.data() : null;

    if (!quoteData && !leadData) {
      return NextResponse.json({ success: false, message: "Lead/Quote not found" }, { status: 404 });
    }

    // Merge comprehensive lead & quote data
    const isPaid = quoteData?.status === "PAID" || quoteData?.status === "BOOKED" || !!quoteData?.payment_id || !!quoteData?.advance_paid;
    const isSiteVisit = quoteData?.status === "site_visit" || leadData?.status === "site_visit" || !!quoteData?.site_visit_date || !!leadData?.site_visit_date;

    const mergedData = {
      id: quoteId,
      quoteId: quoteData?.id || quoteId,
      leadId: leadId,
      customer_name: quoteData?.customer_name || leadData?.customer_name || quoteData?.billing_details?.contact_name || "Unknown Customer",
      customer_mobile: quoteData?.customer_mobile || leadData?.mobile_number || "",
      source: quoteData?.source || leadData?.source || "wizard",
      status: quoteData?.status || leadData?.status || "GENERATED",
      leadStatus: quoteData?.leadStatus || (isPaid ? "WON" : isSiteVisit ? "SITE_VISIT" : "NEW"),
      isPaid,
      
      // Commercial & Pricing Snapshot
      pricingSnapshot: quoteData?.pricingSnapshot || {
        total_payable: quoteData?.total_payable || 0,
        finalPrice: quoteData?.total_payable || 0
      },
      requirementSnapshot: quoteData?.requirementSnapshot || leadData?.wizard_answers || {},
      
      // Billing Details (merged)
      billing_details: quoteData?.billing_details || leadData?.billing_details || null,
      
      // Site Visit Details
      site_visit_date: quoteData?.site_visit_date || leadData?.site_visit_date || null,
      site_visit_slot: quoteData?.site_visit_slot || leadData?.site_visit_slot || null,
      special_notes: quoteData?.special_notes || leadData?.special_notes || "",
      address: quoteData?.address || leadData?.address || null,
      
      // Intelligence & CRM
      intentScore: quoteData?.intentScore || (isPaid ? "Hot" : isSiteVisit ? "Warm" : "Cold"),
      probabilityPercent: quoteData?.probabilityPercent || (isPaid ? 100 : isSiteVisit ? 75 : 25),
      expectedValue: quoteData?.expectedValue || quoteData?.pricingSnapshot?.finalPrice || quoteData?.total_payable || 0,
      nextActionDate: quoteData?.nextActionDate || quoteData?.followUpDate || quoteData?.site_visit_date || null,
      nextActionType: quoteData?.nextActionType || (isSiteVisit ? "Site Visit" : "Follow-up"),
      follow_ups: quoteData?.follow_ups || [],
      
      createdAt: quoteData?.createdAt || quoteData?.created_at || leadData?.created_at || new Date().toISOString()
    };
    
    return NextResponse.json({ success: true, data: mergedData });
  } catch (error: any) {
    console.error("Error fetching lead:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const body = await request.json();
    
    const allowedUpdates = [
      "leadStatus", 
      "assignedTo", 
      "intentScore", 
      "installationType", 
      "expectedClosingDate", 
      "probabilityPercent", 
      "expectedValue", 
      "nextActionDate", 
      "nextActionType",
      "billing_details",
      "site_visit_date",
      "site_visit_slot",
      "special_notes",
      "address"
    ];
    const updates: any = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }
    
    if (Object.keys(updates).length > 0) {
      const quoteRef = adminDb.collection("quotes").doc(quoteId);
      const quoteDoc = await quoteRef.get();
      if (quoteDoc.exists) {
        await quoteRef.update(updates);
        const qData = quoteDoc.data();
        if (qData?.leadId || qData?.lead_id) {
          const leadRef = adminDb.collection("leads").doc(qData.leadId || qData.lead_id);
          const leadDoc = await leadRef.get();
          if (leadDoc.exists) {
            await leadRef.update(updates);
          }
        }
      } else {
        const leadRef = adminDb.collection("leads").doc(quoteId);
        const leadDoc = await leadRef.get();
        if (leadDoc.exists) {
          await leadRef.update(updates);
        }
      }
    }
    
    return NextResponse.json({ success: true, message: "Updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
