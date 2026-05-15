import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { generateDealerOtp, dealerOtpExpiresAt } from "@/lib/auth-dealer";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Enterprise Security Boundary: Rate Limiting
    const limit = await rateLimit(request, 5, 60_000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
    }

    const body = await request.json();
    const { mobile_number, action, otp } = body;

    if (!mobile_number || !/^\d{10}$/.test(mobile_number)) {
      return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
    }

    // 1. SEND OTP
    if (action === "send") {
      // Verify the dealer exists and is active
      const dealerSnap = await adminDb
        .collection(COLLECTIONS.FRANCHISE_DEALERS)
        .where("mobile_number", "==", mobile_number)
        .limit(1)
        .get();

      if (dealerSnap.empty) {
        return NextResponse.json(
          { error: "This mobile number is not registered as a franchise dealer." },
          { status: 404 }
        );
      }

      const dealer = dealerSnap.docs[0].data();
      if (!dealer.is_active) {
        return NextResponse.json(
          { error: "Your dealer account is inactive. Please contact admin." },
          { status: 403 }
        );
      }

      const generatedOtp = generateDealerOtp();
      const expiresAt = dealerOtpExpiresAt();

      // Store OTP in Firestore
      await adminDb.collection(COLLECTIONS.DEALER_OTP_VERIFICATIONS).doc(mobile_number).set({
        otp: generatedOtp,
        expires_at: expiresAt,
        created_at: serverTimestamp(),
      });

      // In production, you would trigger a real SMS service here.
      // For now, we log it and return success.
      console.log(`[Dealer OTP] Sending ${generatedOtp} to ${mobile_number}`);

      return NextResponse.json({ success: true, message: "OTP sent" });
    }

    // 2. VERIFY OTP
    if (action === "verify") {
      if (!otp || otp.length !== 6) {
        return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 });
      }

      const otpDoc = await adminDb.collection(COLLECTIONS.DEALER_OTP_VERIFICATIONS).doc(mobile_number).get();
      if (!otpDoc.exists) {
        return NextResponse.json({ error: "OTP not found or expired" }, { status: 404 });
      }

      const data = otpDoc.data();
      if (data?.otp !== otp) {
        return NextResponse.json({ error: "Incorrect OTP" }, { status: 400 });
      }

      const expiresAt = data?.expires_at?.toDate();
      if (expiresAt < new Date()) {
        return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
      }

      // Cleanup OTP
      await otpDoc.ref.delete();

      // Get dealer details
      const dealerSnap = await adminDb
        .collection(COLLECTIONS.FRANCHISE_DEALERS)
        .where("mobile_number", "==", mobile_number)
        .limit(1)
        .get();
      
      const dealerDoc = dealerSnap.docs[0];
      const dealer = dealerDoc.data();

      // Create a custom token for the dealer
      // We will add the franchise_dealer role claim during session creation
      const customToken = await adminAuth.createCustomToken(dealer.firebase_uid || dealerDoc.id);

      return NextResponse.json({ 
        success: true, 
        custom_token: customToken,
        // For development, we return the id_token if we have it, 
        // but typically we'd exchange customToken for idToken on the client.
        // Let's return the custom token as "id_token" for simplicity in this specific mock flow
        id_token: customToken 
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[Dealer OTP API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
