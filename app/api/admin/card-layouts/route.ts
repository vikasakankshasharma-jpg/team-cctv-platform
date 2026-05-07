import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// GET all layouts
export async function GET() {
  await requireAdminApi();
  const snap = await adminDb.collection("comparison_card_layouts").orderBy("priority").get();
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(data);
}

// POST — create new layout
export async function POST(req: Request) {
  await requireAdminApi();
  const body = await req.json();
  const ref = await adminDb.collection("comparison_card_layouts").add({
    ...body,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ id: ref.id }, { status: 201 });
}
