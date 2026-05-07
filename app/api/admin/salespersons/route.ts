import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// GET all salespersons
export async function GET() {
  try {
    await requireAdminApi();
    const snap = await adminDb.collection("salespeople").orderBy("created_at", "desc").get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST — create new salesperson
export async function POST(req: Request) {
  try {
    await requireAdminApi();
    const body = await req.json();
    const ref = await adminDb.collection("salespeople").add({
      ...body,
      is_active: body.is_active ?? true,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
