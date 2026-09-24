import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const snap = await adminDb.collection("admins").orderBy("createdAt", "desc").get();
    const staffList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, staffList });
  } catch (error: any) {
    console.error("Error fetching staff:", error);
    return NextResponse.json({ error: "Failed to fetch staff list" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, mobile_number, role_template, is_active, hub_id, permissions } = body;

    if (!email || !name || !mobile_number) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docRef = adminDb.collection("admins").doc(email.toLowerCase().trim());
    
    await docRef.set({
      email: email.toLowerCase().trim(),
      name,
      mobile_number,
      role: role_template || "custom",
      is_active: is_active ?? true,
      hub_id: hub_id || "all",
      permissions: permissions || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true, message: "Staff member saved successfully." });
  } catch (error: any) {
    console.error("Error saving staff:", error);
    return NextResponse.json({ error: "Failed to save staff member" }, { status: 500 });
  }
}
