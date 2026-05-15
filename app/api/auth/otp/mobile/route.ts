import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { generateOtp, otpExpiresAt } from "@/lib/auth-partner";
import { FieldValue } from "firebase-admin/firestore";
import { rateLimit } from "@/lib/rate-limit";

/**
 * ENTERPRISE AUTHENTICATION: MOBILE LOOKUP
 * Migrated from hardcoded whitelist to dynamic Firestore-backed RBAC.
 */
export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (Prevent Brute-Force Discovery)
    const limit = await rateLimit(req, 3, 60_000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
    }

    const { mobile } = await req.json();

    // 2. Normalization
    const normalized = mobile?.toString().replace(/^\+?91/, "").replace(/\D/g, "").trim();

    if (!normalized || normalized.length !== 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit Indian mobile number." }, { status: 400 });
    }

    let role: "super_admin" | "sales_staff" | null = null;
    let userName = "";

    // 3. Dynamic RBAC Lookup
    // A. Check Admin Directory
    const adminSnap = await adminDb.collection("admins")
      .where("mobile_number", "==", normalized)
      .where("is_active", "==", true)
      .limit(1)
      .get();

    if (!adminSnap.empty) {
      role = "super_admin";
      userName = adminSnap.docs[0].data().name || "Administrator";
    }

    // B. Check Sales Staff Directory
    if (!role) {
      const spSnap = await adminDb.collection("salespeople")
        .where("mobile_number", "==", normalized)
        .where("is_active", "==", true)
        .limit(1)
        .get();
      
      if (!spSnap.empty) {
        role = "sales_staff";
        userName = spSnap.docs[0].data().name || "Sales Professional";
      }
    }

    // 4. Security Gate
    if (!role) {
      return NextResponse.json(
        { error: "Unauthorized. This mobile number is not registered in the system." },
        { status: 403 }
      );
    }

    // 5. Generate and Store OTP
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
        role,
        name: userName,
        createdAt: FieldValue.serverTimestamp() 
      });

    // NOTE: Sensitive OTP value is NOT logged in production. 
    // It should be sent via SMS provider (e.g., Twilio/Msg91).
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Auth OTP for ${normalized}: ${otp}`);
    }

    return NextResponse.json({ 
      success: true, 
      e164Mobile,
      message: "Verification code sent."
    });

  } catch (error) {
    console.error("🔥 [Admin Auth Mobile] Critical Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
