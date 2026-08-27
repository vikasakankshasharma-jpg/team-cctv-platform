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
      return {
        id: data.id || doc.id,
        customer_name: data.customer_name || "Unknown",
        customer_mobile: data.customer_mobile,
        source: data.source || "unknown",
        total_payable: data.pricingSnapshot?.total_payable || 0,
        selectedPlan: data.selectedPlan || "none",
        status: data.status,
        leadStatus: data.leadStatus || "NEW",
        createdAt: data.createdAt,
        
        // Intelligence
        intentScore: data.intentScore,
        probabilityPercent: data.probabilityPercent || 0,
        expectedValue: data.expectedValue || (data.pricingSnapshot?.finalPrice || data.pricingSnapshot?.total_payable || 0),
        nextActionDate: data.nextActionDate || data.followUpDate,
        nextActionType: data.nextActionType
      };
    });

    return NextResponse.json({ success: true, data: leads });
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
