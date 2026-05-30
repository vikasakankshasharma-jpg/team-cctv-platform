import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { amount } = await req.json();
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Determine user type and fetch wallet balance
    let userType: "installer" | "promoter" = "installer";
    let userDoc = await adminDb.collection("installers").doc(userId).get();
    
    if (!userDoc.exists) {
      userType = "promoter";
      userDoc = await adminDb.collection("promoters").doc(userId).get();
    }

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const walletBalance = userData?.wallet_balance || 0;

    if (walletBalance < amount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    // Calculate TDS
    const tdsPercent = 2;
    const tdsAmount = (amount * tdsPercent) / 100;
    const netAmount = amount - tdsAmount;

    // Create payout request
    const payoutRef = adminDb.collection("payout_requests").doc();
    const payoutData = {
      id: payoutRef.id,
      user_id: userId,
      user_type: userType,
      user_name: userData?.name || "Unknown",
      gross_amount: amount,
      tds_percent: tdsPercent,
      tds_amount: tdsAmount,
      net_amount: netAmount,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await payoutRef.set(payoutData);

    return NextResponse.json({ message: "Payout request submitted successfully", payoutId: payoutRef.id });
  } catch (error: any) {
    console.error("Payout request error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
