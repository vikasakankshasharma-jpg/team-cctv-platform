import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const hasOpsPower = session.role === "super_admin" || session.permissions?.operations?.manage_hubs === true;
    
    if (!hasOpsPower) {
      return NextResponse.json({ error: "Forbidden. Requires Operations Power." }, { status: 403 });
    }

    const { po_id } = await req.json();
    if (!po_id) {
      return NextResponse.json({ error: "PO ID is required." }, { status: 400 });
    }

    const poRef = adminDb.collection("purchase_orders").doc(po_id);
    const poDoc = await poRef.get();
    
    if (!poDoc.exists) {
      return NextResponse.json({ error: "Purchase Order not found." }, { status: 404 });
    }

    const poData = poDoc.data()!;
    if (poData.status === "received") {
      return NextResponse.json({ error: "Purchase Order has already been received." }, { status: 400 });
    }

    // Start a massive atomic batch to ensure financial and inventory integrity
    const batch = adminDb.batch();

    // 1. Mark PO as Received
    batch.update(poRef, {
      status: "received",
      received_by: session.uid,
      received_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 2. Mathematically add to Hub Inventory Ledger
    const hubId = poData.hub_id;
    const items = poData.items || [];

    for (const item of items) {
      const stockRef = adminDb.collection("hubs").doc(hubId).collection("stock").doc(item.sku);
      batch.set(stockRef, {
        quantity: FieldValue.increment(item.quantity),
        last_unit_price: item.unit_price,
        last_updated: new Date().toISOString()
      }, { merge: true });
    }

    // 3. Create an Account Payable for the Accountant
    const payableRef = adminDb.collection("finance_ledger").doc();
    batch.set(payableRef, {
      type: "account_payable",
      reference_id: po_id,
      reference_type: "purchase_order",
      vendor_id: poData.vendor_id,
      amount: poData.total_amount,
      status: "pending_payment",
      created_at: new Date().toISOString(),
    });

    await batch.commit();

    return NextResponse.json({ success: true, message: "PO received, Inventory updated, and Payable created." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
