import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await adminDb.collection("addons").where("is_active", "==", true).get();
  const addons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  return NextResponse.json({ addons });
}
