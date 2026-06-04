import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  const snap = await adminDb.collection("products").get();
  const docs = snap.docs.map(d => ({id: d.id, ...d.data()}));
  return NextResponse.json({ count: docs.length, docs });
}
