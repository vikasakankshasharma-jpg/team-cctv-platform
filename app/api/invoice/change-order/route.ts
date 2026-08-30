import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { ChangeOrder, Invoice, Job, InvoiceItemSnapshot } from "@/types";
import { MarginEngine, DEFAULT_MARGIN_POLICY } from "@/lib/margin-engine"; // For deterministic subtotal/GST on added items

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { base_invoice_id, base_job_id, reason, items_to_add, created_by } = data;

    if (!base_invoice_id || !base_job_id || !items_to_add || items_to_add.length === 0) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const changeOrderId = `CO-${year}-${randomSuffix}`;

    const result = await adminDb.runTransaction(async (transaction) => {
      // 1. Verify Base Invoice exists and is fully paid
      const invoiceRef = adminDb.collection("invoices").doc(base_invoice_id);
      const invoiceDoc = await transaction.get(invoiceRef);
      if (!invoiceDoc.exists) throw new Error("Base invoice not found");
      const invoiceData = invoiceDoc.data() as Invoice;

      if (invoiceData.payment_status !== "fully_paid") {
        throw new Error("Cannot create a Change Order against an unpaid invoice.");
      }

      // 2. Verify Base Job exists
      const jobRef = adminDb.collection("jobs").doc(base_job_id);
      const jobDoc = await transaction.get(jobRef);
      if (!jobDoc.exists) throw new Error("Base job not found");

      // 3. Price the new items using Canonical Margin Engine to ensure no hardcoding
      const mappedLineItems: any[] = [];
      const snapshotItems: InvoiceItemSnapshot[] = [];

      for (const item of items_to_add) {
         // Using the base cost provided, calculate the ex-tax price deterministically
         const unitCalc = MarginEngine.calculateUnitPricing(item.base_cost_at_quote, item.category || 'accessory', 'recommended', DEFAULT_MARGIN_POLICY);
         
         mappedLineItems.push({ sellingPriceExTax: unitCalc.sellingPriceExTax, qty: item.qty });
         const i: any = {
           product_id: item.product_id,
           display_name: item.display_name,
           qty: item.qty,
           unit_price: unitCalc.sellingPriceExTax,
           line_total: unitCalc.sellingPriceExTax * item.qty,
           base_cost_at_quote: item.base_cost_at_quote
         };
         if (item.stock_status_at_quote !== undefined) i.stock_status_at_quote = item.stock_status_at_quote;
         if (item.brand !== undefined) i.brand = item.brand;
         snapshotItems.push(i);
      }

      // 4. Calculate Subtotal, GST and Rounding deterministically
      const totals = MarginEngine.calculateDocumentTotals(mappedLineItems, 0, 1.0, DEFAULT_MARGIN_POLICY);

      // 5. Create Change Order Entity
      const changeOrder: ChangeOrder = {
        id: changeOrderId,
        base_invoice_id,
        base_job_id,
        supplementary_quote_id: `SQ-${year}-${randomSuffix}`, // Mocked ref to a generated quote
        reason,
        items: snapshotItems,
        subtotal: totals.finalExTax,
        gst_amount: totals.gstAmount,
        total_payable: totals.totalPayable,
        status: "pending_customer_approval",
        created_by,
        created_at: new Date().toISOString()
      };

      const coRef = adminDb.collection("change_orders").doc(changeOrderId);
      transaction.set(coRef, { ...changeOrder, _serverCreatedAt: serverTimestamp() });

      // 6. Audit Log
      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        entity_type: "change_order",
        entity_id: changeOrderId,
        action: "created",
        actor: "installer",
        details: { base_invoice_id, subtotal: totals.finalExTax },
        created_at: new Date().toISOString()
      });

      return changeOrder;
    });

    return NextResponse.json({ success: true, changeOrder: result });
  } catch (error: any) {
    console.error("Change order error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
