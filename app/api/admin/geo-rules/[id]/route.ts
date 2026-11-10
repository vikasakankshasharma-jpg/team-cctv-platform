import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminApi();
    const { id } = await params;
    const body = await req.json();

    const { id: _, created_at, ...updates } = body;

    await adminDb.collection("geo_pricing_rules").doc(id).set({
      ...updates,
      updated_at: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminApi();
    const { id } = await params;
    await adminDb.collection("geo_pricing_rules").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message === "Unauthorized" ? 401 : 500 });
  }
}
