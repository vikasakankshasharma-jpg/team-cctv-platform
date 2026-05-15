import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logs";
import { verifySession } from "@/lib/auth-server";
import type { FranchiseDealer } from "@/types";

// GET /api/admin/franchises — list all franchise dealers
export async function GET() {
  const session = await verifySession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let snap;
    try {
      snap = await adminDb.collection("franchise_dealers").orderBy("created_at", "desc").get();
    } catch {
      snap = await adminDb.collection("franchise_dealers").get();
    }
    const dealers = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(dealers);
  } catch (err) {
    console.error("[Franchises API GET]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/franchises — create a new franchise dealer
export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session.isAuthenticated || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Basic validation
    if (!body.company_name?.trim()) {
      return NextResponse.json({ error: "company_name is required" }, { status: 400 });
    }
    if (!body.mobile_number?.trim()) {
      return NextResponse.json({ error: "mobile_number is required" }, { status: 400 });
    }

    const docRef = adminDb.collection("franchise_dealers").doc();
    const payload: Omit<FranchiseDealer, "id"> = {
      company_name:           body.company_name.trim(),
      owner_name:             body.owner_name?.trim() || "",
      mobile_number:          body.mobile_number.trim(),
      email:                  body.email?.trim() || "",
      is_active:              body.is_active ?? true,
      territory_exclusivity:  body.territory_exclusivity ?? true,
      assigned_pincodes:      Array.isArray(body.assigned_pincodes) ? body.assigned_pincodes : [],
      assigned_cities:        Array.isArray(body.assigned_cities)   ? body.assigned_cities   : [],
      assigned_states:        Array.isArray(body.assigned_states)   ? body.assigned_states   : [],
      assigned_zone_ids:      [],
      franchise_fee_monthly:  Number(body.franchise_fee_monthly) || 5000,
      commission_percent:     Number(body.commission_percent)    || 6,
      total_leads_received:   0,
      total_leads_won:        0,
      total_ex_tax_business:  0,
      total_commission_due:   0,
      total_commission_paid:  0,
      created_at:             serverTimestamp(),
      updated_at:             serverTimestamp(),
    };

    await docRef.set(payload);

    // Audit log
    const { ip, ua } = getRequestMetadata(request);
    await createAuditLog({
      action: "FRANCHISE_CREATE",
      actor_id: session.user?.uid || "system",
      actor_email: session.user?.email || "unknown",
      resource_id: docRef.id,
      resource_type: "franchise_dealer",
      metadata: { company_name: payload.company_name },
      ip_address: ip,
      user_agent: ua
    });

    return NextResponse.json({ id: docRef.id, message: "Franchise dealer created" }, { status: 201 });
  } catch (err) {
    console.error("[Franchises API POST]", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
