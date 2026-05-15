import { NextRequest, NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logs";
import { verifySession } from "@/lib/auth-server";

// GET /api/admin/franchises/[id]
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const doc = await adminDb.collection("franchise_dealers").doc(id).get();
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: doc.id, ...doc.data() });
}

// PUT /api/admin/franchises/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  if (!session.isAuthenticated || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    // Strip id and server fields to prevent overwriting
    const { id: _id, created_at: _ca, ...updateData } = body;
    await adminDb.collection("franchise_dealers").doc(id).update({
      ...updateData,
      updated_at: serverTimestamp(),
    });

    // Audit log
    const { ip, ua } = getRequestMetadata(request);
    await createAuditLog({
      action: "FRANCHISE_UPDATE",
      actor_id: session.user?.uid || "system",
      actor_email: session.user?.email || "unknown",
      resource_id: id,
      resource_type: "franchise_dealer",
      metadata: { updated_fields: Object.keys(updateData) },
      ip_address: ip,
      user_agent: ua
    });

    return NextResponse.json({ message: "Updated" });
  } catch (err) {
    console.error("[Franchises API PUT]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/admin/franchises/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  if (!session.isAuthenticated || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await adminDb.collection("franchise_dealers").doc(id).delete();

    // Audit log
    const { ip, ua } = getRequestMetadata(request);
    await createAuditLog({
      action: "FRANCHISE_DELETE",
      actor_id: session.user?.uid || "system",
      actor_email: session.user?.email || "unknown",
      resource_id: id,
      resource_type: "franchise_dealer",
      metadata: { id },
      ip_address: ip,
      user_agent: ua
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("[Franchises API DELETE]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
