import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";

// GET all zones
export async function GET() {
  try {
    await requireAdminApi();
    const snap = await adminDb.collection("coverage_zones").orderBy("name").get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST — create new zone
export async function POST(req: Request) {
  try {
    await requireAdminApi();
    const body = await req.json();
    const ref = await adminDb.collection("coverage_zones").add({
      ...body,
      pincodes: body.pincodes || []
    });
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
