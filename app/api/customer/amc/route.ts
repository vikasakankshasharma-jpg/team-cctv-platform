import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";

// Customer-facing API: Fetch their warranties and AMC subscriptions
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated || !session.uid) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const uid = session.uid;

    // 1. Find all leads linked to this customer
    const leadsSnap = await adminDb.collection("leads")
      .where("firebase_uid", "==", uid)
      .get();

    const leadIds = leadsSnap.docs.map(d => d.id);

    if (leadIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { warranties: [], amcSubscriptions: [], availablePlans: [] }
      });
    }

    // 2. Find warranty certificates linked to this customer
    const warranties: any[] = [];
    // Firestore "in" queries limited to 30, so batch if needed
    const batches = [];
    for (let i = 0; i < leadIds.length; i += 10) {
      batches.push(leadIds.slice(i, i + 10));
    }

    for (const batch of batches) {
      const snap = await adminDb.collection("warranty_certificates")
        .where("customerId", "in", batch)
        .get();
      snap.docs.forEach(doc => {
        const d = doc.data();
        // Calculate overall expiry from assets
        let latestExpiry = "";
        let isExpired = false;
        if (d.assets && d.assets.length > 0) {
          latestExpiry = d.assets.reduce((max: string, a: any) => 
            a.warrantyEndDate > max ? a.warrantyEndDate : max, "");
          isExpired = new Date(latestExpiry) < new Date();
        }
        warranties.push({
          id: doc.id,
          certNumber: d.certNumber,
          jobId: d.jobId,
          installationDate: d.installationDate,
          assets: d.assets || [],
          status: d.status,
          latestExpiry,
          isExpired,
          issuedAt: d.issuedAt
        });
      });
    }

    // 3. Find active AMC subscriptions
    const amcSubscriptions: any[] = [];
    for (const batch of batches) {
      const snap = await adminDb.collection("amc_subscriptions")
        .where("customerId", "in", batch)
        .get();
      snap.docs.forEach(doc => {
        const d = doc.data();
        const endDate = d.endDate || "";
        const isExpired = endDate ? new Date(endDate) < new Date() : true;
        const daysLeft = endDate ? Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
        amcSubscriptions.push({
          id: doc.id,
          planName: d.planName,
          startDate: d.startDate,
          endDate: d.endDate,
          status: d.status || (isExpired ? "EXPIRED" : "ACTIVE"),
          daysLeft,
          isExpired,
          amountPaid: d.amountPaid || 0,
          warrantyId: d.warrantyId || null,
          paymentId: d.paymentId || null
        });
      });
    }

    // 4. Fetch available AMC plans for purchase
    const plansSnap = await adminDb.collection("amc_plans")
      .where("isActive", "==", true)
      .get();
    const availablePlans = plansSnap.docs.map(doc => doc.data());

    return NextResponse.json({
      success: true,
      data: { warranties, amcSubscriptions, availablePlans }
    });
  } catch (error: any) {
    console.error("[Customer AMC API Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
