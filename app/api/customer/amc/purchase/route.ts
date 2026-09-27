import { NextRequest, NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";

// Customer purchases an AMC plan
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated || !session.uid) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, warrantyId, paymentId } = body;

    if (!planId) {
      return NextResponse.json({ success: false, message: "Plan ID is required" }, { status: 400 });
    }

    // 1. Validate the plan exists
    const planDoc = await adminDb.collection("amc_plans").doc(planId).get();
    if (!planDoc.exists) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 });
    }
    const plan = planDoc.data()!;

    // 2. Check for existing active subscription
    if (warrantyId) {
      const existingSnap = await adminDb.collection("amc_subscriptions")
        .where("warrantyId", "==", warrantyId)
        .where("status", "==", "ACTIVE")
        .get();
      if (!existingSnap.empty) {
        return NextResponse.json({ success: false, message: "An active AMC already exists for this warranty." }, { status: 409 });
      }
    }

    // 3. Create the subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (plan.durationMonths || 12));

    const ref = adminDb.collection("amc_subscriptions").doc();
    const subscription = {
      id: ref.id,
      customerId: session.uid,
      planId,
      planName: plan.name,
      warrantyId: warrantyId || null,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      durationMonths: plan.durationMonths || 12,
      amountPaid: plan.price || 0,
      paymentId: paymentId || null,
      status: "ACTIVE",
      includedVisits: plan.includedVisits || 0,
      visitsUsed: 0,
      createdAt: serverTimestamp(),
    };

    await ref.set(subscription);

    return NextResponse.json({
      success: true,
      data: { subscriptionId: ref.id, ...subscription },
      message: "AMC activated successfully!"
    });
  } catch (error: any) {
    console.error("[Customer AMC Purchase Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
