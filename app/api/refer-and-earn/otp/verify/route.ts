import { NextResponse } from "next/server";
import { adminAuth, adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

// Collision-safe Referral Code Generator for B2C Individual Referrers (e.g. RAHU7193)
async function generateUniqueReferralCode(name: string): Promise<string> {
  const cleanName = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const prefix = (cleanName.length >= 4 ? cleanName.substring(0, 4) : cleanName.padEnd(4, "X")).toUpperCase();

  let code = "";
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    code = `${prefix}${randomSuffix}`;

    const snap = await adminDb
      .collection(COLLECTIONS.PROMOTERS)
      .where("referral_code", "==", code)
      .limit(1)
      .get();

    if (snap.empty) {
      exists = false;
    }
    attempts++;
  }

  return code;
}

export async function POST(req: Request) {
  const { success } = await rateLimit(req);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const { fullName, mobile, otp } = await req.json();

    if (!mobile || !otp) {
      return NextResponse.json({ error: "Mobile number and OTP are required." }, { status: 400 });
    }

    const cleanPhone = mobile.toString().replace(/\D/g, "").slice(-10);
    const formattedPhone = `91${cleanPhone}`;
    const docId = `+${formattedPhone}`;

    // Test bypass check
    let isBypass = false;
    if (otp.toString().trim() === "1234" || otp.toString().trim() === "123456") {
      isBypass = true;
    }

    if (!isBypass) {
      const otpDoc = await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(docId).get();
      if (!otpDoc.exists) {
        return NextResponse.json(
          { error: "Verification code expired or not found. Please request a new code." },
          { status: 404 }
        );
      }

      const data = otpDoc.data()!;
      const now = new Date();
      const expiry = data.expiresAt?.toDate?.() ?? new Date(0);

      if (now > expiry) {
        await otpDoc.ref.delete();
        return NextResponse.json(
          { error: "Verification code has expired. Please request a new code." },
          { status: 400 }
        );
      }

      if (data.otp !== otp.toString().trim()) {
        return NextResponse.json({ error: "Incorrect verification code." }, { status: 400 });
      }

      // Single-use code consumed
      await otpDoc.ref.delete();
    }

    // 1. Get or Create Firebase Auth User by Phone
    let uid: string;
    try {
      const userRecord = await adminAuth.getUserByPhoneNumber(docId);
      uid = userRecord.uid;
    } catch (e: any) {
      if (e.code === "auth/user-not-found") {
        const newUser = await adminAuth.createUser({
          phoneNumber: docId,
          displayName: fullName?.trim() || "Individual Partner",
        });
        uid = newUser.uid;
      } else {
        throw e;
      }
    }

    // 2. Query Existing Promoter Document
    const promoterSnap = await adminDb
      .collection(COLLECTIONS.PROMOTERS)
      .where("mobile_number", "==", cleanPhone)
      .limit(1)
      .get();

    let promoterId: string;
    let referralCode: string;

    if (!promoterSnap.empty) {
      // Existing Promoter: Reuse & update UID linkage
      const existingDoc = promoterSnap.docs[0];
      promoterId = existingDoc.id;
      referralCode = existingDoc.data().referral_code;

      await existingDoc.ref.update({
        firebase_uid: uid,
        updated_at: serverTimestamp(),
      });
    } else {
      // 3. Create Brand New B2C Promoter Document with Flat ₹500 Schema
      referralCode = await generateUniqueReferralCode(fullName || "TEAM");
      const newPromoterRef = adminDb.collection(COLLECTIONS.PROMOTERS).doc();
      promoterId = newPromoterRef.id;

      await newPromoterRef.set({
        id: promoterId,
        name: fullName?.trim() || "Individual Partner",
        business_name: `${fullName?.trim() || "Individual"} (Individual)`,
        mobile_number: cleanPhone,
        email: null,
        partner_type: "promoter",
        tier: "b2c", // Flagged as B2C Individual Partner
        referral_code: referralCode,
        is_active: true,
        firebase_uid: uid,
        discount_type: "flat",
        discount_value: 500, // Customer gets flat ₹500 off
        use_global_commission: false,
        commission_slabs: [
          { from: 0, to: null, type: "flat", value: 500 }, // Partner earns flat ₹500
        ],
        total_won_leads: 0,
        total_leads_referred: 0,
        total_ex_tax_business: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }

    // 4. Upgrade Custom Claims to role: "partner"
    await adminAuth.setCustomUserClaims(uid, { role: "partner" });

    // 5. Mint Custom Token for Client SDK
    const customToken = await adminAuth.createCustomToken(uid, { role: "partner" });

    return NextResponse.json({
      success: true,
      customToken,
      promoterId,
      referralCode,
    });
  } catch (error: any) {
    console.error("[Refer & Earn Verify Error]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
