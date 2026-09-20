import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const snap = await adminDb.collection("products")
      .where("is_active", "==", true)
      .where("category", "==", "cctv_camera")
      .where("brand", "==", "Budget Brand")
      .get();
      
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
