import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// PUT — update a layout
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminApi();
  const { id: paramId } = await params;
  const body = await req.json();
  const { id, created_at, ...data } = body;
  await adminDb.collection("comparison_card_layouts").doc(paramId).update({
    ...data,
    updated_at: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ ok: true });
}

// DELETE — remove a layout
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminApi();
  const { id: paramId } = await params;
  await adminDb.collection("comparison_card_layouts").doc(paramId).delete();
  return NextResponse.json({ ok: true });
}
