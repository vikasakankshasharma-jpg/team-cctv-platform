import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { pincode, idToken } = await req.json();

    // 1. Basic Validations
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: "Invalid pincode" }, { status: 400 });
    }
    if (!idToken) {
      return NextResponse.json({ error: "Missing Firebase ID token" }, { status: 400 });
    }

    // 2. Verify Firebase ID Token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (e) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const mobile = decodedToken.phone_number || "unknown";

    // 3. Save to Firestore interest_leads collection
    const leadRef = await adminDb.collection("interest_leads").add({
      pincode,
      mobile_number: mobile,
      firebase_uid: decodedToken.uid,
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
