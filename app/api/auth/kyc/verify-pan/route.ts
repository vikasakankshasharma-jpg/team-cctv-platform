import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth"; // The generic session verifier
import { KycService } from "@/lib/kyc-service";

export async function POST(req: Request) {
  try {
    // 1. Must be logged in (Prevents public bot abuse)
    const session = await verifySession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const { pan_number } = await req.json();

    if (!pan_number || typeof pan_number !== "string" || pan_number.length !== 10) {
      return NextResponse.json({ error: "Valid 10-character PAN number is required" }, { status: 400 });
    }

    // 2. Call Razorpay KYC Service
    const result = await KycService.verifyPAN(pan_number);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
