import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const { identifier, otp, type } = await req.json();

    if (!identifier || !otp || !type) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (type === "email") {
      const email = identifier.toLowerCase().trim();
      const otpDoc = await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(email).get();

      if (!otpDoc.exists) {
        return NextResponse.json({ error: "OTP not found or expired." }, { status: 404 });
      }

      const data = otpDoc.data()!;
      const now = new Date();
      const expiry = (data?.expiresAt as any)?.toDate?.();

      if (expiry && now > expiry) {
        await otpDoc.ref.delete();
        return NextResponse.json({ error: "OTP has expired." }, { status: 400 });
      }

      if (data?.otp !== otp) {
        return NextResponse.json({ error: "Invalid OTP code." }, { status: 400 });
      }

      await otpDoc.ref.delete();

      let uid: string;
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        uid = userRecord.uid;
      } catch {
        const newUser = await adminAuth.createUser({ email, emailVerified: true, displayName: "Master Admin" });
        uid = newUser.uid;
      }

      const role = data?.role || "super_admin";
      await adminAuth.setCustomUserClaims(uid, { role });
      const customToken = await adminAuth.createCustomToken(uid, { role });
      
      return NextResponse.json({ success: true, customToken });
    }

    if (type === "mobile") {
      const idToken = otp; // OTP field carries Firebase ID token for mobile flow
      const decoded = await adminAuth.verifyIdToken(idToken);
      const uid = decoded.uid;
      const phoneNumber = decoded.phone_number;

      if (!phoneNumber) {
        return NextResponse.json({ error: "Phone number not found in token." }, { status: 400 });
      }

      const normalized = phoneNumber.replace(/^\+?91/, "").replace(/\D/g, "");
      const otpDoc = await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(normalized).get();

      if (!otpDoc.exists) {
        return NextResponse.json({ error: "Unauthorized mobile number." }, { status: 403 });
      }

      const spData = otpDoc.data()!;
      const role = spData.role || "super_admin";

      // If it's a salesperson, link their account to this UID
      if (role === "sales_staff") {
        const spSnap = await adminDb.collection("salespeople")
          .where("mobile_number", "==", normalized)
          .limit(1)
          .get();
        
        if (!spSnap.empty) {
          await spSnap.docs[0].ref.update({ firebase_uid: uid });
        }
      }

      await adminAuth.setCustomUserClaims(uid, { role });
      const customToken = await adminAuth.createCustomToken(uid, { role });

      return NextResponse.json({ success: true, customToken });
    }

    return NextResponse.json({ error: "Invalid OTP type." }, { status: 400 });
  } catch (error) {
    console.error("🔥 OTP Verification Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
