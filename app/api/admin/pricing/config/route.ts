import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireRoleApi } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    // Both sales and admin can view pricing logic
    await requireRoleApi(["sales_staff", "super_admin"]);

    const doc = await adminDb.collection("app_config").doc("pricing_engine").get();
    if (!doc.exists) {
      return NextResponse.json({ success: true, data: {} });
    }

    return NextResponse.json({ success: true, data: doc.data() });
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Only super_admin can modify pricing logic
    const session = await requireRoleApi(["super_admin"]);
    
    const configData = await request.json();
    
    const configRef = adminDb.collection("app_config").doc("pricing_engine");

    await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(configRef);
      const oldData = doc.exists ? doc.data() : {};

      const newData = {
        ...oldData,
        ...configData,
        updated_at: new Date().toISOString(),
        updated_by: session.user?.uid
      };

      transaction.set(configRef, newData);

      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        entity_type: "pricing_config",
        entity_id: "pricing_engine",
        action: "updated",
        actor: "super_admin",
        details: { fields_changed: Object.keys(configData), user_id: session.user?.uid },
        created_at: newData.updated_at
      });
    });

    return NextResponse.json({ success: true, message: "Pricing config updated" });
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
