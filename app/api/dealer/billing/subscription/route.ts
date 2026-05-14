import { NextRequest, NextResponse } from "next/server";
import { requireDealerSession } from "@/lib/auth-dealer";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { createSubscription, createSubscriptionPlan } from "@/lib/cashfree";

export async function POST(request: NextRequest) {
  try {
    const session = await requireDealerSession();
    const dealerId = session.dealerId!;

    // 1. Get Dealer Info
    const dealerDoc = await adminDb.collection(COLLECTIONS.FRANCHISE_DEALERS).doc(dealerId).get();
    if (!dealerDoc.exists) throw new Error("Dealer not found");
    const dealer = dealerDoc.data()!;

    // 2. Ensure a Plan exists for this dealer's specific fee
    // (We could also have a global plan_id if all dealers pay the same)
    const planId = `plan_franchise_${dealer.franchise_fee_monthly}`;
    
    try {
      await createSubscriptionPlan({
        plan_id: planId,
        plan_name: `Franchise Fee - ₹${dealer.franchise_fee_monthly}`,
        plan_type: "PERIODIC",
        plan_amount: dealer.franchise_fee_monthly,
        plan_currency: "INR",
        plan_interval_type: "MONTH",
        plan_intervals: 1
      });
    } catch (e) {
      // Plan might already exist, ignore error if it's "Plan ID already exists"
      console.log("Plan creation skipped (might exist):", e);
    }

    // 3. Create Subscription
    const subscriptionId = `subs_${dealerId}_${Date.now()}`;
    const sub = await createSubscription({
      subscription_id: subscriptionId,
      plan_id: planId,
      customer_details: {
        customer_id: dealerId,
        customer_name: dealer.owner_name,
        customer_email: dealer.email || "admin@teamcctv.in",
        customer_phone: dealer.mobile_number
      },
      subscription_meta: {
        return_url: `${request.nextUrl.origin}/dealer/dashboard?status=subscription_success`,
        notify_url: `${request.nextUrl.origin}/api/webhooks/cashfree`
      }
    });

    return NextResponse.json({ 
      success: true, 
      subs_session_id: sub.subs_session_id,
      subscription_id: subscriptionId 
    });
  } catch (err: any) {
    console.error("[Dealer Billing API]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
