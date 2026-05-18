import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";

export async function POST(req: NextRequest) {
  try {
    const { mobile, code } = await req.json();

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
    }

    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Invalid 6-digit OTP code" }, { status: 400 });
    }

    const isValid = await verifyOtp(mobile, code);

    if (!isValid) {
      return NextResponse.json({ error: "Incorrect or expired OTP" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully"
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      }
    });
  } catch (error) {
    console.error("[verify-otp error]:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
