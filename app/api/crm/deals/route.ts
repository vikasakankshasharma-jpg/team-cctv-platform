import { NextResponse } from "next/server";
import { adminDb, arrayUnion } from "@/lib/firebase-admin";
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

    // 1. Fetch Quote
    const quoteRef = adminDb.collection("quotes").doc(quoteId);
    const quoteDoc = await quoteRef.get();
    
    if (!quoteDoc.exists) {
      return NextResponse.json({ success: false, message: "Quote not found" }, { status: 404 });
    }
    
    const quote = quoteDoc.data()!;
    
    // Check if already won/converted
    if (quote.leadStatus === "WON") {
      const existingDeals = await adminDb.collection("deals").where("quoteSnapshotId", "==", quoteId).get();
      if (!existingDeals.empty) {
        return NextResponse.json({ success: false, message: "Deal already exists for this quote" }, { status: 400 });
      }
    }

    // 2. Mint Deal
    const dealId = `DL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    
    const newDeal = {
      id: dealId,
      quoteSnapshotId: quoteId,
      customerId: quote.customerId || `CUST-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: quote.customer_name || "Unknown",
      customerMobile: quote.customer_mobile || "Unknown",
      salespersonId: quote.assignedTo || "unassigned",
      baseCost: quote.pricingSnapshot?.total_cost || 0,
      listPrice: quote.pricingSnapshot?.total_payable || 0,
      finalPrice,
      discountAmount,
      grossProfit,
      status: "PENDING_PAYMENT",
      createdAt: new Date().toISOString()
    };
    
    // 3. Perform Transaction (Create Deal + Freeze Quote)
    const batch = adminDb.batch();
    
    batch.set(adminDb.collection("deals").doc(dealId), newDeal);
    
    // If quote didn't have customerId (legacy), create a walk-in customer record now
    if (!quote.customerId) {
        batch.set(adminDb.collection("customers").doc(newDeal.customerId), {
             id: newDeal.customerId,
             authUid: null,
             name: newDeal.customerName,
             phone: newDeal.customerMobile,
             type: "WALK_IN",
             createdAt: new Date().toISOString()
        });
    }
    batch.update(quoteRef, {
      leadStatus: "WON",
      expectedValue: finalPrice, // update intelligence to match reality
      isFrozen: true // Phase 6.4: Freeze QuoteSnapshot
    });
    
    // 4. Log Follow-up for audit
    batch.update(quoteRef, {
      follow_ups: arrayUnion({
        note: `Deal created successfully. Final Price: ₹${finalPrice.toLocaleString()}, Discount: ₹${discountAmount.toLocaleString()}`,
        nextFollowUpDate: null,
        priority: "high",
        timestamp: new Date().toISOString(),
        author: "System"
      })
    });
    
    await batch.commit();

    return NextResponse.json({ success: true, dealId });
  } catch (error: any) {
    console.error("Deal Conversion Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}


