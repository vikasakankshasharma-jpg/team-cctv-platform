import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30"; // 7, 30, all
    
    // In production, we'd use Firestore aggregations.
    // For MVP, since quote volume per month is manageable, we pull them to calculate.
    
    const now = new Date();
    const rangeDate = new Date();
    rangeDate.setDate(now.getDate() - parseInt(range));
    
    let query: FirebaseFirestore.Query = adminDb.collection("quotes");
    if (range !== "all") {
        query = query.where("createdAt", ">=", rangeDate.toISOString());
    }

    const snapshot = await query.get();
    
    let totalQuotes = 0;
    let totalPipelineValue = 0;
    
    snapshot.docs.forEach(doc => {
      const q = doc.data();
      totalQuotes++;
      if (q.pricingSnapshot?.total_payable) {
        totalPipelineValue += q.pricingSnapshot.total_payable;
      }
    });

    const avgQuoteValue = totalQuotes > 0 ? Math.round(totalPipelineValue / totalQuotes) : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalQuotes,
        totalPipelineValue,
        avgQuoteValue
      }
    });
  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
