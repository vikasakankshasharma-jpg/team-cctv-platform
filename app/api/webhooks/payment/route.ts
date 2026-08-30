import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Invoice, Job, ChangeOrder } from "@/types";
import { InventoryEngine } from "@/lib/inventory-engine";
import { isPaymentsDisabled } from "@/lib/kill-switch";

function verifyWebhookSignature(payload: any, signature: string | null) {
  if (process.env.NODE_ENV === "test" || process.env.FIRESTORE_EMULATOR_HOST) {
    return signature === "test_signature_valid";
  }
  return signature === process.env.PAYMENT_WEBHOOK_SECRET;
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-webhook-signature");
    const payload = await request.json();
    const { order_id, transaction_id, status, amount, reference_entity_id, reference_entity_type } = payload;

    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 401 });
    }

    if (!transaction_id || !reference_entity_id || !reference_entity_type) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    // Kill Switch: Payments Disabled Guard
    // Still allow FAILED status webhooks through (to record failures), but block SUCCESS processing
    if (status !== "FAILED" && await isPaymentsDisabled()) {
      console.warn(`[KillSwitch] Payment webhook BLOCKED — payments disabled. txn=${transaction_id}`);
      return NextResponse.json(
        { success: false, message: "Payment processing is temporarily disabled. Transaction not processed." },
        { status: 503 }
      );
    }

    const result = await adminDb.runTransaction(async (transaction) => {
      // 1. Idempotency Check
      const txnRef = adminDb.collection("payment_transactions").doc(transaction_id);
      const txnDoc = await transaction.get(txnRef);
      if (txnDoc.exists) {
        return { success: true, message: "Webhook already processed (Idempotent)" };
      }

      if (reference_entity_type === "invoice") {
        const invoiceRef = adminDb.collection("invoices").doc(reference_entity_id);
        const invoiceDoc = await transaction.get(invoiceRef);
        if (!invoiceDoc.exists) throw new Error("Invoice not found");
        
        const invoiceData = invoiceDoc.data() as Invoice;

        if (status === "FAILED") {
          const auditRef = adminDb.collection("audit_logs").doc();
          transaction.set(auditRef, {
            id: auditRef.id, entity_type: "invoice", entity_id: reference_entity_id, action: "payment_failed", actor: "webhook", details: { transaction_id, amount }, created_at: new Date().toISOString()
          });
          transaction.set(txnRef, { id: transaction_id, transaction_id, order_id, reference_entity_id, reference_entity_type, amount, status: "FAILED", created_at: new Date().toISOString() });
          return { success: true, message: "Failed payment recorded" };
        }

        if (invoiceData.payment_status === "fully_paid") {
           return { success: true, message: "Invoice already fully paid" };
        }

        // --- INVENTORY PHASE ---
        // We only deduct inventory for the base invoice (supplementary invoices do it via change order)
        let inventoryResult: { success: boolean; insufficientItems?: string[] } = { success: true, insufficientItems: [] };
        if (!invoiceData.is_supplementary) {
           inventoryResult = await InventoryEngine.attemptDeduction(
             transaction,
             invoiceData.items.map((i: any) => ({ product_id: i.product_id, qty: i.qty })),
             invoiceData.id,
             "invoice"
           );
        }

        const updatedRefs = [...(invoiceData.payment_references || []), transaction_id];
        transaction.update(invoiceRef, {
          payment_status: "fully_paid",
          payment_references: updatedRefs
        });

        if (!invoiceData.is_supplementary) {
          const jobId = `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const jobRef = adminDb.collection("jobs").doc(jobId);
          
          // Job Status logic based on Inventory availability
          const jobStatus = inventoryResult.success ? "PENDING_DISPATCH" : "BACKORDERED";
          
          const newJob: Job = {
            id: jobId,
            lead_id: "TBD",
            quote_id: invoiceData.quote_id,
            invoice_ids: [invoiceData.id],
            change_order_ids: [],
            address: { pincode: "000000", landmark1: "", landmark2: "", full_address: "", coordinates: { lat: 0, lng: 0 } },
            type: "installation",
            status: jobStatus as any, // casting due to type extension
            created_at: new Date().toISOString()
          };
          transaction.set(jobRef, newJob);

          const auditJobRef = adminDb.collection("audit_logs").doc();
          transaction.set(auditJobRef, {
            id: auditJobRef.id, entity_type: "job", entity_id: jobId, action: "created", actor: "system", details: { invoice_id: invoiceData.id, inventory_status: inventoryResult.success ? "cleared" : "backordered" }, created_at: new Date().toISOString()
          });
        }

        transaction.set(txnRef, { id: transaction_id, transaction_id, order_id, reference_entity_id, reference_entity_type, amount, status: "SUCCESS", created_at: new Date().toISOString() });

        const auditRef = adminDb.collection("audit_logs").doc();
        transaction.set(auditRef, {
          id: auditRef.id, entity_type: "invoice", entity_id: reference_entity_id, action: "payment_success", actor: "webhook", details: { transaction_id, amount }, created_at: new Date().toISOString()
        });

        return { success: true, message: "Payment processed for Invoice", backordered: !inventoryResult.success };

      } else if (reference_entity_type === "change_order") {
        
        const coRef = adminDb.collection("change_orders").doc(reference_entity_id);
        const coDoc = await transaction.get(coRef);
        if (!coDoc.exists) throw new Error("Change Order not found");

        const coData = coDoc.data() as ChangeOrder;

        if (status === "FAILED") {
          transaction.set(txnRef, { id: transaction_id, transaction_id, order_id, reference_entity_id, reference_entity_type, amount, status: "FAILED", created_at: new Date().toISOString() });
          return { success: true, message: "Failed payment recorded" };
        }

        if (coData.status === "paid") {
          return { success: true, message: "Change order already paid" };
        }

        const jobRef = adminDb.collection("jobs").doc(coData.base_job_id);
        const jobDoc = await transaction.get(jobRef);

        // --- INVENTORY PHASE ---
        const inventoryResult = await InventoryEngine.attemptDeduction(
          transaction,
          coData.items.map(i => ({ product_id: i.product_id, qty: i.qty })),
          coData.id,
          "change_order"
        );

        transaction.update(coRef, { status: "paid" });

        const suppInvoiceId = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-EXT`;
        const suppInvRef = adminDb.collection("invoices").doc(suppInvoiceId);
        
        const suppInvoice: Invoice = {
          id: suppInvoiceId,
          quote_id: coData.supplementary_quote_id,
          base_invoice_id: coData.base_invoice_id,
          customer_mobile: "inherited_from_base",
          items: coData.items,
          subtotal: coData.subtotal,
          gst_amount: coData.gst_amount,
          total_payable: coData.total_payable,
          payment_status: "fully_paid",
          payment_references: [transaction_id],
          is_supplementary: true,
          change_order_id: coData.id,
          created_at: new Date().toISOString()
        };
        transaction.set(suppInvRef, suppInvoice);

        if (jobDoc.exists) {
          const jobData = jobDoc.data() as Job;
          const updatedCoIds = [...(jobData.change_order_ids || []), coData.id];
          const updatedInvIds = [...(jobData.invoice_ids || []), suppInvoiceId];
          
          const updatePayload: any = { change_order_ids: updatedCoIds, invoice_ids: updatedInvIds };
          
          if (!inventoryResult.success && (jobData.status as string) !== "BACKORDERED") {
             updatePayload.status = "BACKORDERED";
             updatePayload.inventory_alert = `Missing items for CO ${coData.id}: ${inventoryResult.insufficientItems?.join(", ")}`;
          }
          
          transaction.update(jobRef, updatePayload);
        }

        transaction.set(txnRef, { id: transaction_id, transaction_id, order_id, reference_entity_id, reference_entity_type, amount, status: "SUCCESS", created_at: new Date().toISOString() });

        const auditRef = adminDb.collection("audit_logs").doc();
        transaction.set(auditRef, {
          id: auditRef.id, entity_type: "change_order", entity_id: reference_entity_id, action: "payment_success", actor: "webhook", details: { transaction_id, amount, supp_invoice_id: suppInvoiceId, inventory_cleared: inventoryResult.success }, created_at: new Date().toISOString()
        });

        return { success: true, message: "Payment processed for Change Order, Inventory updated, Supplementary Invoice generated.", backordered: !inventoryResult.success };
      }
      
      throw new Error("Unknown reference_entity_type");
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Payment webhook error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
