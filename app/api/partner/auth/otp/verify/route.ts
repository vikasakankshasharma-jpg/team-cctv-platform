import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const { identifier, otp, type } = await req.json();

    if (!identifier || !otp || !type) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // ── EMAIL OTP FLOW ────────────────────────────────────────────────────────
    if (type === "email") {
      const otpDoc = await adminDb
        .collection(COLLECTIONS.PARTNER_OTP_VERIFICATIONS)
        .doc(identifier.toLowerCase().trim())
        .get();

      if (!otpDoc.exists) {
        return NextResponse.json({ error: "OTP not found or already used." }, { status: 404 });
      }

      const data = otpDoc.data()!;
      const now = new Date();
      const expiry = data.expiresAt?.toDate?.() ?? new Date(0);

      if (now > expiry) {
        await otpDoc.ref.delete();
        return NextResponse.json({ error: "OTP has expired. Please request a new code." }, { status: 400 });
      }

      if (data.otp !== otp) {
        return NextResponse.json({ error: "Invalid OTP code. Please try again." }, { status: 400 });
      }

      // OTP is valid — delete it immediately (single-use)
      await otpDoc.ref.delete();

      const promoterId: string = data.promoterId;
      const email = identifier.toLowerCase().trim();

      // Get or create Firebase Auth user for this email
      let uid: string;
      try {
        const existingUser = await adminAuth.getUserByEmail(email);
        uid = existingUser.uid;
      } catch {
        // User does not exist — create one
        const newUser = await adminAuth.createUser({
          email,
          displayName: (await adminDb.collection(COLLECTIONS.PROMOTERS).doc(promoterId).get()).data()?.name ?? "Partner",
          emailVerified: true,
        });
        uid = newUser.uid;
      }

      // Set / refresh custom claim
      await adminAuth.setCustomUserClaims(uid, { role: "partner" });

      // Link firebase_uid to promoter document (one-time linkage)
      const promoterRef = adminDb.collection(COLLECTIONS.PROMOTERS).doc(promoterId);
      const promoterDoc = await promoterRef.get();
      if (promoterDoc.exists && !promoterDoc.data()?.firebase_uid) {
        await promoterRef.update({ firebase_uid: uid });
      }

      // Create Firebase custom token for the client
      const customToken = await adminAuth.createCustomToken(uid, { role: "partner" });

      return NextResponse.json({ success: true, customToken });
    }

    // ── MOBILE OTP FLOW ────────────────────────────────────────────────────────
    if (type === "mobile") {
      // In mobile flow, `identifier` = normalized mobile number, `otp` = 6 digit code
      const normalized = identifier.toString().replace(/^\+?91/, "").replace(/\D/g, "").trim();
      
      const otpDoc = await adminDb
        .collection(COLLECTIONS.PARTNER_OTP_VERIFICATIONS)
        .doc(normalized)
        .get();

      if (!otpDoc.exists) {
        return NextResponse.json({ error: "OTP not found or already used." }, { status: 404 });
      }

      const data = otpDoc.data()!;
      const now = new Date();
      const expiry = data.expiresAt?.toDate?.() ?? new Date(0);

      if (now > expiry) {
        await otpDoc.ref.delete();
        return NextResponse.json({ error: "OTP has expired. Please request a new code." }, { status: 400 });
      }

      if (data.otp !== otp) {
        return NextResponse.json({ error: "Invalid OTP code. Please try again." }, { status: 400 });
      }

      // OTP is valid — delete it immediately
      await otpDoc.ref.delete();

      // Find partner by mobile_number
      const promoterSnap = await adminDb
        .collection(COLLECTIONS.PROMOTERS)
        .where("mobile_number", "==", normalized)
        .where("is_active", "==", true)
        .limit(1)
        .get();

      if (promoterSnap.empty) {
        return NextResponse.json({ error: "No active partner account found for this phone number." }, { status: 404 });
      }

      const promoterRef = promoterSnap.docs[0].ref;
      const promoterData = promoterSnap.docs[0].data();

      // Resolve Firebase User
      const phoneNumber = `+91${normalized}`;
      let uid: string;
      try {
        const userRecord = await adminAuth.getUserByPhoneNumber(phoneNumber);
        uid = userRecord.uid;
      } catch {
        const newUser = await adminAuth.createUser({
          phoneNumber,
          displayName: promoterData.name ?? "Partner",
        });
        uid = newUser.uid;
      }

      // Set custom claim
      await adminAuth.setCustomUserClaims(uid, { role: "partner" });

      // Link firebase_uid if not already set
      if (!promoterData.firebase_uid) {
        await promoterRef.update({ firebase_uid: uid });
      }

      // Create custom token for session exchange
      const customToken = await adminAuth.createCustomToken(uid, { role: "partner" });

      return NextResponse.json({ success: true, customToken });
    }

    return NextResponse.json({ error: "Invalid OTP type." }, { status: 400 });
  } catch (error) {
    console.error("[Partner OTP Verify] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
