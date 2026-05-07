import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { generateOtp, otpExpiresAt } from "@/lib/auth-partner";
import { FieldValue } from "firebase-admin/firestore";

const AUTHORIZED_MOBILES = ["9772699395"];

export async function POST(req: Request) {
  try {
    const { mobile } = await req.json();

    // Normalize mobile: strip +91 prefix, keep 10 digits
    const normalized = mobile?.toString().replace(/^\+?91/, "").replace(/\D/g, "").trim();

    if (!normalized || normalized.length !== 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit Indian mobile number." }, { status: 400 });
    }

    // Check if it's a super admin
    let role = AUTHORIZED_MOBILES.includes(normalized) ? "super_admin" : null;
    let userName = role === "super_admin" ? "Master Admin" : "";

    // If not super admin, check if it's a salesperson
    if (!role) {
      const spSnap = await adminDb.collection("salespeople")
        .where("mobile_number", "==", normalized)
        .where("is_active", "==", true)
        .limit(1)
        .get();
      
      if (!spSnap.empty) {
        role = "sales_staff";
        userName = spSnap.docs[0].data().name || "Sales Agent";
      }
    }

    if (!role) {
      return NextResponse.json(
        { error: "Unauthorized. This mobile number does not have Admin or Sales privileges." },
        { status: 403 }
      );
    }

    const otp = generateOtp();
    const expiresAt = otpExpiresAt();
    const e164Mobile = `+91${normalized}`;

    // Store OTP for verification
    await adminDb
      .collection(COLLECTIONS.OTP_VERIFICATIONS)
      .doc(normalized)
      .set({ 
        otp, 
        expiresAt, 
        type: "mobile", 
        role: role,
        name: userName,
        createdAt: FieldValue.serverTimestamp() 
      });

    console.log(`✅ [Admin OTP] Mobile lookup validated for +91${normalized}. OTP: ${otp}`);

    return NextResponse.json({ 
      success: true, 
      partnerName: "Master Admin",
      e164Mobile, 
    });
  } catch (error) {
    console.error("[Admin OTP Mobile] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
