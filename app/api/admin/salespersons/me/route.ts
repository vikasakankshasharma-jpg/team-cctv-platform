import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth-server";
import { findSalespersonByUid } from "@/lib/salesperson-utils";

export async function GET() {
  try {
    const session = await verifySession();

    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.role;
    const isSalesperson = role === "sales_staff";
    const isAdmin = role === "admin" || role === "super_admin";

    if (!isSalesperson && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Sales staff or Admin access required" }, { status: 403 });
    }

    // If salesperson, resolve their profile by firebase_uid
    if (isSalesperson) {
      const sp = await findSalespersonByUid(session.user.uid);
      if (!sp) {
        return NextResponse.json({
          id: session.user.uid,
          name: "Sales Agent",
          role: "sales_staff",
          max_discount_approval_percent: 10,
          is_active: true
        });
      }

      return NextResponse.json({
        id: sp.id,
        name: sp.name,
        mobile_number: sp.mobile_number,
        role: "sales_staff",
        max_discount_approval_percent: sp.max_discount_approval_percent ?? 10,
        commission_slabs: sp.commission_slabs ?? [],
        assigned_zone_ids: sp.assigned_zone_ids ?? [],
        territory: sp.territory ?? null,
        is_active: sp.is_active ?? true
      });
    }

    // Admin view
    return NextResponse.json({
      id: session.user.uid,
      name: session.user.email?.split("@")[0] || "Admin",
      email: session.user.email || "admin@teamcctv.com",
      role: session.role || "admin",
      max_discount_approval_percent: 25,
      is_active: true
    });
  } catch (error: any) {
    console.error("[Salesperson /me GET Error]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
