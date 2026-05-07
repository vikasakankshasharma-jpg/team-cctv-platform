import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// PUT — update a salesperson
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminApi();
    const body = await req.json();
    const { id, created_at, ...data } = body;
    await adminDb.collection("salespeople").doc(params.id).update({
      ...data,
      updated_at: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// DELETE — remove a salesperson
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminApi();
    await adminDb.collection("salespeople").doc(params.id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
