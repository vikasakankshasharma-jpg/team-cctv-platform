import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    // Only allow in test/dev environment
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { role } = await request.json();
    
    if (!role) {
      return NextResponse.json({ success: false, message: "Missing role" }, { status: 400 });
    }

    const uid = `test-${role}-${Date.now()}`;
    const customToken = await adminAuth.createCustomToken(uid, { role });

    return NextResponse.json({ success: true, customToken });
  } catch (error: any) {
    console.error("Test Login Minting Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
