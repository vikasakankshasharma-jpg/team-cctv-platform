import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const [
      pendingOfflineSnap,
      pendingCommissionsSnap,
      inventorySnap,
      stalledDispatchesSnap,
      priceMatchesSnap,
      staleLeadsSnap,
      escalatedLeadsSnap,
      pendingDeliveriesSnap,
      pendingCashSnap
    ] = await Promise.all([
      // 1. Finance: Offline Verifications
      adminDb.collection("offline_verifications").where("status", "==", "pending").get(),
      
      // 2. Finance: Pending Commissions
      adminDb.collection("commission_records").where("status", "==", "pending").get(),
      
      // 3. Operations: Inventory
      adminDb.collection("inventory").get(), // We have to filter low stock in memory if minStockLevel is dynamic
      
      // 4. Operations: Stalled Dispatches (Paid but not dispatched)
      adminDb.collection("quotes")
        .where("status", "in", ["PAID", "BOOKED"])
        .where("delivery_status", "==", "PENDING")
        .get(),
        
      // 5. Sales: Price Matches
      adminDb.collection("price_match_requests").where("status", "==", "pending").get(),
      
      // 6. Sales: Stale Leads (fetch all 'new', filter in memory to avoid index errors)
      adminDb.collection("leads")
        .where("status", "==", "new")
        .get(),
        
      // 7. Sales: Escalated Leads
      adminDb.collection("leads").where("is_escalated", "==", true).get(),

      // 8. Operations: Pending Deliveries (dispatched but not yet delivered)
      adminDb.collection("quotes")
        .where("delivery_status", "==", "DISPATCHED")
        .get(),

      // 9. Finance: Pending Cash Settlements (staff collected cash, not yet deposited)
      adminDb.collection("pending_cash_settlements").where("status", "==", "pending").get()
    ]);

    // Helper to safely serialize Firestore data
    const serializeDoc = (doc: any) => {
      const data = doc.data();
      // Basic shallow serialization for known timestamp fields
      if (data.created_at?.toDate) data.created_at = data.created_at.toDate().toISOString();
      if (data.updated_at?.toDate) data.updated_at = data.updated_at.toDate().toISOString();
      if (data.paid_at?.toDate) data.paid_at = data.paid_at.toDate().toISOString();
      return { id: doc.id, ...data };
    };

    // Format Finance
    const pendingOffline = pendingOfflineSnap.docs.map(serializeDoc);
    const pendingCommissions = pendingCommissionsSnap.docs.map(serializeDoc);

    // Format Operations
    const inventory = inventorySnap.docs.map(serializeDoc);
    const lowStock = inventory.filter(i => (i.availableQty || 0) <= (i.minStockLevel || 0));
    
    // For stalled dispatches, we also need to ensure they were paid > 24 hours ago.
    let stalledDispatches = stalledDispatchesSnap.docs.map(serializeDoc);
    stalledDispatches = stalledDispatches.filter(q => {
      if (!q.paid_at) return true;
      const paidAt = new Date(q.paid_at);
      return paidAt < twentyFourHoursAgo;
    });

    // Format Sales
    const priceMatches = priceMatchesSnap.docs.map(serializeDoc);
    const escalatedLeads = escalatedLeadsSnap.docs.map(serializeDoc);
    
    let staleLeads = staleLeadsSnap.docs.map(serializeDoc);
    staleLeads = staleLeads.filter(l => {
      if (!l.created_at) return false;
      const createdAt = new Date(l.created_at);
      return createdAt <= fortyEightHoursAgo;
    });

    // Format Deliveries & Cash
    const pendingDeliveries = pendingDeliveriesSnap.docs.map(serializeDoc);
    const pendingCash = pendingCashSnap.docs.map(serializeDoc);

    return NextResponse.json({
      success: true,
      finance: {
        offline: pendingOffline,
        commissions: pendingCommissions,
        pendingCash,
      },
      operations: {
        lowStock,
        stalledDispatches,
        pendingDeliveries,
      },
      sales: {
        priceMatches,
        staleLeads,
        escalatedLeads
      }
    });

  } catch (error: any) {
    console.error("Action Center API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
