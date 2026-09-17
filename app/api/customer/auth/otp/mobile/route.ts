import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { generateOtp, otpExpiresAt } from "@/lib/auth-partner";
import { FieldValue } from "firebase-admin/firestore";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const limit = await rateLimit(req, 5, 60_000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
    }

    const { mobile } = await req.json();
    const normalized = mobile?.toString().replace(/^\+?91/, "").replace(/\D/g, "").trim();

    if (!normalized || normalized.length !== 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit Indian mobile number." }, { status: 400 });
    }

    // Attempt to lookup customer name from recent leads
    let customerName = "Valued Customer";
    const leadSnap = await adminDb.collection("leads")
      .where("mobile_number", "==", normalized)
      .limit(1)
      .get();

    if (!leadSnap.empty) {
      const data = leadSnap.docs[0].data();
      if (data.customer_name) {
        customerName = data.customer_name;
      }
    } else {
      const altSnap = await adminDb.collection("leads")
        .where("customer_phone", "==", normalized)
        .limit(1)
        .get();
      if (!altSnap.empty) {
        const data = altSnap.docs[0].data();
        if (data.customer_name) customerName = data.customer_name;
      }
    }

    const otp = generateOtp();
    const expiresAt = otpExpiresAt();
    const e164Mobile = `+91${normalized}`;

    await adminDb
      .collection(COLLECTIONS.OTP_VERIFICATIONS)
      .doc(normalized)
      .set({
        otp,
        expiresAt,
        type: "mobile",
        role: "customer",
        name: customerName,
        createdAt: FieldValue.serverTimestamp(),
      });

    console.log(`[CUSTOMER OTP] Mobile: +91${normalized} (${customerName}) | OTP: ${otp}`);

    return NextResponse.json({
      success: true,
      e164Mobile,
      customerName,
      message: "Verification code sent.",
      // Provide OTP in non-production for fast testing
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
    });
  } catch (error) {
    console.error("[Customer OTP Mobile] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
