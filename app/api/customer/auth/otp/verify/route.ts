import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const limit = await rateLimit(req, 5, 60_000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
    }

    const { mobile, otp } = await req.json();
    const normalized = mobile?.toString().replace(/^\+?91/, "").replace(/\D/g, "").trim();

    if (!normalized || !otp) {
      return NextResponse.json({ error: "Mobile number and OTP are required." }, { status: 400 });
    }

    const otpDoc = await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(normalized).get();

    if (!otpDoc.exists) {
      return NextResponse.json({ error: "OTP not found or expired. Please request a new code." }, { status: 404 });
    }

    const data = otpDoc.data()!;
    const now = new Date();
    const expiry = (data?.expiresAt as any)?.toDate?.();

    if (expiry && now > expiry) {
      await otpDoc.ref.delete();
      return NextResponse.json({ error: "OTP has expired. Please request a new code." }, { status: 400 });
    }

    // Verify OTP code
    if (data?.otp !== otp.toString().trim()) {
      return NextResponse.json({ error: "Invalid OTP code. Please check and try again." }, { status: 400 });
    }

    // Clean up OTP after successful verification
    await otpDoc.ref.delete();

    // Resolve or Create Firebase Auth User
    const phoneNumber = `+91${normalized}`;
    let uid: string;
    try {
      const userRecord = await adminAuth.getUserByPhoneNumber(phoneNumber);
      uid = userRecord.uid;
    } catch {
      const newUser = await adminAuth.createUser({
        phoneNumber,
        displayName: data?.name || "Customer",
      });
      uid = newUser.uid;
    }

    // Assign customer role claim
    await adminAuth.setCustomUserClaims(uid, { role: "customer" });

    // Link all existing leads belonging to this phone number with this UID
    try {
      const batch = adminDb.batch();
      let hasUpdates = false;

      const leadsSnap = await adminDb.collection("leads")
        .where("mobile_number", "==", normalized)
        .get();

      leadsSnap.docs.forEach((doc) => {
        if (doc.data().firebase_uid !== uid) {
          batch.update(doc.ref, { firebase_uid: uid });
          hasUpdates = true;
        }
      });

      const altLeadsSnap = await adminDb.collection("leads")
        .where("customer_phone", "==", normalized)
        .get();

      altLeadsSnap.docs.forEach((doc) => {
        if (doc.data().firebase_uid !== uid) {
          batch.update(doc.ref, { firebase_uid: uid });
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        await batch.commit();
      }
    } catch (linkError) {
      console.error("[Customer OTP Verify] Lead linkage error:", linkError);
    }

    // Generate Custom Token for Firebase Client SDK
    const customToken = await adminAuth.createCustomToken(uid, { role: "customer" });

    const response = NextResponse.json({
      success: true,
      customToken,
      user: {
        uid,
        mobile: normalized,
        name: data?.name || "Customer",
      },
    });

    // In dev / preview fallback, also set mock session cookie directly for immediate SSR readiness
    if (process.env.NODE_ENV !== "production") {
      response.cookies.set({
        name: "admin_session",
        value: `mock_session_customer_UID_${uid}`,
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      });
    }

    return response;
  } catch (error: any) {
    console.error("[Customer OTP Verify] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
