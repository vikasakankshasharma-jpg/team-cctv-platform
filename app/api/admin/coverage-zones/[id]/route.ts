import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";

// PUT — update a zone
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminApi();
    const body = await req.json();
    await adminDb.collection("coverage_zones").doc(params.id).update(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// DELETE — remove a zone
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminApi();
    await adminDb.collection("coverage_zones").doc(params.id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
