import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.city || !body.pincode) {
      return NextResponse.json({ error: "Missing required fields: city, pincode" }, { status: 400 });
    }

    // We store impressions to track intent that didn't convert to a full lead
    await adminDb.collection("demand_impressions").add({
      city: body.city,
      pincode: body.pincode,
      source: body.source || "wizard_step_1",
      created_at: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Impression log error:", error);
    // Return 200 anyway so we don't block the user's flow
    return NextResponse.json({ success: false, error: "Failed to log impression" }, { status: 200 });
  }
}
