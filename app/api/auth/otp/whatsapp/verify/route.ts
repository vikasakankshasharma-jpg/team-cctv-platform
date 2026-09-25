import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { success } = await rateLimit(req);
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP are required." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    let formattedPhone = cleanPhone;
    if (cleanPhone.length === 10) formattedPhone = "91" + cleanPhone;
    
    let data: any = null;
    let isBypass = false;

    const otpStr = otp.toString().trim();
    if (formattedPhone === "919587980007" && (otpStr === "1234" || otpStr === "123456")) {
      isBypass = true;
      data = { role: "customer" };
    } else if (formattedPhone === "919587980008" && (otpStr === "1234" || otpStr === "123456")) {
      isBypass = true;
      data = { role: "installer" };
    } else if (formattedPhone === "919587980009" && (otpStr === "1234" || otpStr === "123456")) {
      isBypass = true;
      data = { role: "partner" };
    }

    if (isBypass) {
      // BYPASS FOR TEST NUMBERS
    } else {
      const docId = `+${formattedPhone}`;
      const otpDoc = await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(docId).get();

      if (!otpDoc.exists) {
        return NextResponse.json({ error: "OTP expired or not found. Please request a new one." }, { status: 404 });
      }

      data = otpDoc.data()!;
      
      if (data.type !== "whatsapp") {
        return NextResponse.json({ error: "Invalid verification method." }, { status: 400 });
      }

      const now = new Date();
      const expiry = data.expiresAt?.toDate();
      if (expiry && now > expiry) {
        await otpDoc.ref.delete();
        return NextResponse.json({ error: "OTP has expired." }, { status: 400 });
      }

      if (data.otp !== otp.toString().trim()) {
        return NextResponse.json({ error: "Incorrect OTP code." }, { status: 400 });
      }

      // OTP matches! Delete it.
      await otpDoc.ref.delete();
    }

    const docId = `+${formattedPhone}`;

    if (isBypass) {
      return NextResponse.json({ success: true, customToken: "mock-custom-token", role: data.role });
    }

    // Find or create Firebase user
    let uid: string;
    try {
      const userRecord = await adminAuth.getUserByPhoneNumber(docId);
      uid = userRecord.uid;
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        const newUser = await adminAuth.createUser({ phoneNumber: docId });
        uid = newUser.uid;
      } else {
        throw e;
      }
    }

    const role = data.role || "customer";
    const normalized = cleanPhone.length === 12 && cleanPhone.startsWith("91") ? cleanPhone.substring(2) : cleanPhone;

    // Link account UID
    if (role === "sales_staff") {
      const spSnap = await adminDb.collection("salespeople").where("mobile_number", "==", normalized).limit(1).get();
      if (!spSnap.empty) await spSnap.docs[0].ref.update({ firebase_uid: uid });
    } else if (role === "partner") {
      const pSnap = await adminDb.collection("promoters").where("mobile_number", "==", normalized).limit(1).get();
      if (!pSnap.empty) await pSnap.docs[0].ref.update({ firebase_uid: uid });
    } else if (role === "installer") {
      const iSnap = await adminDb.collection("installers").where("mobile_number", "==", normalized).limit(1).get();
      if (!iSnap.empty) await iSnap.docs[0].ref.update({ firebase_uid: uid });
    } else if (role === "customer") {
      try {
        const [leadsSnap, altLeadsSnap] = await Promise.all([
          adminDb.collection("leads").where("mobile_number", "==", normalized).get(),
          adminDb.collection("leads").where("customer_phone", "==", normalized).get(),
        ]);
        const batch = adminDb.batch();
        let hasUpdates = false;
        leadsSnap.docs.forEach((doc) => {
          if (doc.data().firebase_uid !== uid) {
            batch.update(doc.ref, { firebase_uid: uid });
            hasUpdates = true;
          }
        });
        altLeadsSnap.docs.forEach((doc) => {
          if (doc.data().firebase_uid !== uid) {
            batch.update(doc.ref, { firebase_uid: uid });
            hasUpdates = true;
          }
        });
        if (hasUpdates) await batch.commit();
      } catch (err) {
        console.warn("Could not link customer leads to uid:", err);
      }
    }
    
    // Set custom claims and Generate Custom Token
    await adminAuth.setCustomUserClaims(uid, { role });
    const customToken = await adminAuth.createCustomToken(uid, { role });

    return NextResponse.json({ success: true, customToken, role });
  } catch (error: any) {
    console.error("WhatsApp OTP Verify Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
