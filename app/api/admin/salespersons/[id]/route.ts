import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminApi();
    const { id: paramId } = await params;
    const body = await req.json();
    const { id, created_at, ...data } = body;
    await adminDb.collection("salespeople").doc(paramId).update({
      ...data,
      updated_at: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminApi();
    const { id: paramId } = await params;
    await adminDb.collection("salespeople").doc(paramId).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
