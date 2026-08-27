import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const snapshot = await adminDb.collection("quotes")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();
    
    const productCounts: Record<string, { name: string; count: number; totalRevenue: number }> = {};
    let totalQuotesWithAccessories = 0;
    
    snapshot.docs.forEach(doc => {
      const q = doc.data();
      let hasAccessory = false;

      if (q.pricingSnapshot?.items) {
          q.pricingSnapshot.items.forEach((item: any) => {
              if (!productCounts[item.product_id]) {
                  productCounts[item.product_id] = { name: item.display_name, count: 0, totalRevenue: 0 };
              }
              productCounts[item.product_id].count += item.qty;
              productCounts[item.product_id].totalRevenue += item.line_total;

              if (item.product_id.includes("connector") || item.product_id.includes("cable") || item.product_id.includes("cabling")) {
                  hasAccessory = true;
              }
          });
      }
      
      if (hasAccessory) totalQuotesWithAccessories++;
    });

    const products = Object.values(productCounts);
    
    const mostRecommended = [...products].sort((a, b) => b.count - a.count).slice(0, 5);
    const highestGrossing = [...products].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
    
    const totalQuotes = snapshot.docs.length;
    const attachmentRate = totalQuotes > 0 ? Math.round((totalQuotesWithAccessories / totalQuotes) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        mostRecommended,
        highestGrossing,
        attachmentRate
      }
    });
  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
