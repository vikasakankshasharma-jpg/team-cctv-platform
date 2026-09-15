import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const status = searchParams.get("status"); // LeadStatus filter
    const source = searchParams.get("source"); // wizard, builder, manual

    let query: FirebaseFirestore.Query = adminDb.collection("quotes");

    if (status) {
      query = query.where("leadStatus", "==", status);
    }
    if (source) {
      query = query.where("source", "==", source);
    }

    // Default sorting by most recent
    query = query.orderBy("createdAt", "desc").limit(limit);

    const snapshot = await query.get();
    const leads = snapshot.docs.map(doc => {
      const data = doc.data();
      const isPaid = data.status === "PAID" || data.status === "BOOKED" || !!data.payment_id || !!data.advance_paid;
      const isSiteVisit = data.status === "site_visit" || data.leadStatus === "SITE_VISIT" || !!data.site_visit_date;
      
      let computedLeadStatus = data.leadStatus || "NEW";
      if (isPaid && computedLeadStatus !== "WON") computedLeadStatus = "WON";
      else if (isSiteVisit && computedLeadStatus === "NEW") computedLeadStatus = "SITE_VISIT";

      return {
        id: data.id || doc.id,
        leadId: data.leadId || data.lead_id || data.id || doc.id,
        customer_name: data.customer_name || data.billing_details?.contact_name || data.billing_details?.company_name || "Unknown",
        customer_mobile: data.customer_mobile || data.billing_details?.contact_mobile || "",
        source: data.source || "wizard",
        total_payable: data.pricingSnapshot?.total_payable || data.total_payable || 0,
        selectedPlan: data.selectedPlan || data.pricingSnapshot?.selectedPlan || "Standard",
        status: data.status || (isPaid ? "PAID" : "GENERATED"),
        leadStatus: computedLeadStatus,
        isPaid,
        
        // Billing & GST Details
        billing_details: data.billing_details || null,
        is_business: !!data.billing_details?.is_business,
        company_name: data.billing_details?.company_name || null,
        gstin: data.billing_details?.gstin || null,
        
        // Site Visit Info
        site_visit_date: data.site_visit_date || null,
        site_visit_slot: data.site_visit_slot || null,
        special_notes: data.special_notes || null,
        
        createdAt: data.createdAt || data.created_at || new Date().toISOString(),
        
        // Intelligence
        intentScore: data.intentScore || (isPaid ? "Hot" : isSiteVisit ? "Warm" : "Cold"),
        probabilityPercent: data.probabilityPercent || (isPaid ? 100 : isSiteVisit ? 75 : 25),
        expectedValue: data.expectedValue || (data.pricingSnapshot?.finalPrice || data.pricingSnapshot?.total_payable || data.total_payable || 0),
        nextActionDate: data.nextActionDate || data.followUpDate || data.site_visit_date || null,
        nextActionType: data.nextActionType || (isSiteVisit ? "Site Visit" : "Follow-up")
      };
    });

    return NextResponse.json({ success: true, data: leads });
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
