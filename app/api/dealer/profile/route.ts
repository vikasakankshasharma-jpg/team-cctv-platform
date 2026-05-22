import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("dealer_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // In production, we decode JWT. For now we assume sessionCookie contains dealerId directly
    // since we use simple auth for this demo.
    const payload = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
    const dealerId = payload.dealerId;

    if (!dealerId) {
      return NextResponse.json({ error: "Invalid Session" }, { status: 401 });
    }

    const body = await req.json();
    const { sla_operating_hours } = body;

    await adminDb.collection("franchises").doc(dealerId).update({
      sla_operating_hours
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Dealer Profile Update Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
