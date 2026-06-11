import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendAdminNotification } from "@/lib/notification-service";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { phone, requested_camera_count, property_type, technology, consent } = data;

    if (!phone || !requested_camera_count) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docRef = adminDb.collection("industrial_leads").doc();
    const newLead = {
      id: docRef.id,
      phone,
      requested_camera_count,
      property_type,
      technology,
      consent,
      status: "new",
      created_at: new Date()
    };

    await docRef.set(newLead);

    await sendAdminNotification(`🚨 New Industrial Lead!\nPhone: ${phone}\nCameras: ${requested_camera_count}\nType: ${property_type || "N/A"}`);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
