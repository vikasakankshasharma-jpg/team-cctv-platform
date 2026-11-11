import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { getApiMessage, resolveRequestLocale } from "@/lib/i18n/api-messages";

export async function POST(req: Request) {
  let locale = resolveRequestLocale(req);
  try {
    const body = await req.json();
    locale = resolveRequestLocale(req, body);
    const { identifier, otp, type } = body;

    if (!identifier || !otp || !type) {
      return NextResponse.json({ error: getApiMessage(locale, "missing_fields") }, { status: 400 });
    }

    // ── EMAIL OTP FLOW ────────────────────────────────────────────────────────
    if (type === "email") {
      const otpDoc = await adminDb
        .collection(COLLECTIONS.PARTNER_OTP_VERIFICATIONS)
        .doc(identifier.toLowerCase().trim())
        .get();

      if (!otpDoc.exists) {
        return NextResponse.json({ error: getApiMessage(locale, "otp_not_found") }, { status: 404 });
      }

      const data = otpDoc.data()!;
      const now = new Date();
      const expiry = data.expiresAt?.toDate?.() ?? new Date(0);

      if (now > expiry) {
        await otpDoc.ref.delete();
        return NextResponse.json({ error: getApiMessage(locale, "otp_expired") }, { status: 400 });
      }

      if (data.otp !== otp) {
        return NextResponse.json({ error: getApiMessage(locale, "otp_incorrect") }, { status: 400 });
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

    // ── MOBILE / FIREBASE PHONE AUTH FLOW ────────────────────────────────────
    // For mobile, Firebase Phone Auth handles OTP on the client via RecaptchaVerifier.
    // After signInWithPhoneNumber() succeeds on the client, the client calls this route
    // with the Firebase ID token (already has role=null). We upgrade the claim here.
    if (type === "mobile") {
      // In mobile flow, `identifier` = E.164 mobile number, `otp` = Firebase ID token
      const idToken = otp; // Repurpose the otp field to carry the Firebase ID token for mobile flow

      const decoded = await adminAuth.verifyIdToken(idToken);
      const uid = decoded.uid;
      const phoneNumber = decoded.phone_number;

      if (!phoneNumber) {
        return NextResponse.json({ error: getApiMessage(locale, "phone_required") }, { status: 400 });
      }

      // Normalize to 10-digit form for lookup
      const normalized = phoneNumber.replace(/^\+?91/, "").replace(/\D/g, "");

      // Find promoter by mobile_number
      const promoterSnap = await adminDb
        .collection(COLLECTIONS.PROMOTERS)
        .where("mobile_number", "==", normalized)
        .where("is_active", "==", true)
        .limit(1)
        .get();

      if (promoterSnap.empty) {
        return NextResponse.json({ error: getApiMessage(locale, "partner_not_found") }, { status: 404 });
      }

      const promoterRef = promoterSnap.docs[0].ref;
      const promoterData = promoterSnap.docs[0].data();

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

    return NextResponse.json({ error: getApiMessage(locale, "otp_invalid_method") }, { status: 400 });
  } catch (error) {
    console.error("[Partner OTP Verify] Error:", error);
    return NextResponse.json({ error: getApiMessage(locale, "internal_error") }, { status: 500 });
  }
}
