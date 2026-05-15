import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logs";
import { verifySession } from "@/lib/auth-server";

// GET all salespersons
export async function GET() {
  const session = await verifySession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const snap = await adminDb.collection("salespeople").orderBy("created_at", "desc").get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Salespersons API GET]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST — create new salesperson
export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session.isAuthenticated || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const ref = await adminDb.collection("salespeople").add({
      ...body,
      is_active: body.is_active ?? true,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    // Audit log
    const { ip, ua } = getRequestMetadata(req);
    await createAuditLog({
      action: "SALESPERSON_CREATE",
      actor_id: session.user?.uid || "system",
      actor_email: session.user?.email || "unknown",
      resource_id: ref.id,
      resource_type: "salesperson",
      metadata: { name: body.name },
      ip_address: ip,
      user_agent: ua
    });

    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (err) {
    console.error("[Salespersons API POST]", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
