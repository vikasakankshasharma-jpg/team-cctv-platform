import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { pincode, mobile, code } = await req.json();

    // 1. Basic Validations
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: "Invalid pincode" }, { status: 400 });
    }
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
    }
    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Invalid 6-digit OTP code" }, { status: 400 });
    }

    // 2. Verify OTP
    const isValid = await verifyOtp(mobile, code);
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect or expired OTP" }, { status: 400 });
    }

    // 3. Save to Firestore interest_leads collection
    const leadRef = await adminDb.collection("interest_leads").add({
      pincode,
      mobile_number: mobile,
      createdAt: serverTimestamp(),
      status: "waitlist"
    });

    return NextResponse.json({
      success: true,
      leadId: leadRef.id,
      message: "Interest lead successfully registered!"
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      }
    });
  } catch (error) {
    console.error("[interest-leads error]:", error);
    return NextResponse.json({ error: "Failed to register interest lead" }, { status: 500 });
  }
}
