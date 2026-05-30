import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }
  try {
    const { role } = await request.json();
    let uid = "";
    let tokenRole = "";
    switch (role) {
      case "admin": 
        uid = "mock-admin-uid"; 
        tokenRole = "super_admin";
        break;
      case "salesperson": 
        uid = "mock-salesperson-uid"; 
        tokenRole = "sales_staff";
        break;
      case "dealer": 
        uid = "mock-dealer-uid"; 
        tokenRole = "partner";
        
        // Ensure promoter exists in DB for this UID
        const snap = await adminDb.collection("promoters").where("firebase_uid", "==", uid).get();
        if (snap.empty) {
          await adminDb.collection("promoters").add({
            firebase_uid: uid,
            name: "Mock Dealer E2E",
            business_name: "Mock Dealer LLC",
            is_active: true,
            created_at: new Date()
          });
        }
        break;
      default: return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const customToken = await adminAuth.createCustomToken(uid, { role: tokenRole });
    return NextResponse.json({ customToken });
  } catch (error: any) {
    console.error("E2E Login API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
