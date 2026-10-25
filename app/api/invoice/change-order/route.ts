import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { ChangeOrder, Invoice, Job, InvoiceItemSnapshot } from "@/types";
import { MarginEngine, DEFAULT_MARGIN_POLICY } from "@/lib/margin-engine";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      base_invoice_id, 
      base_job_id, 
      lead_id, 
      reason, 
      items_to_add, 
      created_by,
      payment_method 
    } = data;

    if (!base_invoice_id || !items_to_add || items_to_add.length === 0) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const changeOrderId = `CO-${year}-${randomSuffix}`;
    const supplementaryInvoiceId = `INV-${year}-${randomSuffix}-S1`;

    const result = await adminDb.runTransaction(async (transaction) => {
      // 1. Resolve Base Document (Check invoices, quotes)
      let resolvedBaseInvoiceId = base_invoice_id;
      let customerMobile = "";

      const invoiceRef = adminDb.collection("invoices").doc(base_invoice_id);
      const invoiceDoc = await transaction.get(invoiceRef);

      if (invoiceDoc.exists) {
        const invoiceData = invoiceDoc.data() as Invoice;
        resolvedBaseInvoiceId = invoiceDoc.id;
        customerMobile = invoiceData.customer_mobile || "";
      } else {
        // Fallback: Check quotes collection
        const quoteRef = adminDb.collection("quotes").doc(base_invoice_id);
        const quoteDoc = await transaction.get(quoteRef);

        if (quoteDoc.exists) {
          const qData = quoteDoc.data() as any;
          customerMobile = qData.customer_mobile || qData.customer?.phone || "";
          resolvedBaseInvoiceId = qData.invoice_id || base_invoice_id;
        } else {
          // Check query by quote_id in invoices
          const invSnap = await adminDb.collection("invoices").where("quote_id", "==", base_invoice_id).limit(1).get();
          if (!invSnap.empty) {
            resolvedBaseInvoiceId = invSnap.docs[0].id;
            customerMobile = (invSnap.docs[0].data() as Invoice).customer_mobile || "";
          }
        }
      }

      // 2. Resolve Base Job (non-blocking)
      let resolvedJobId = base_job_id || "job_default";
      if (base_job_id && base_job_id !== "job_default") {
        const jobRef = adminDb.collection("jobs").doc(base_job_id);
        const jobDoc = await transaction.get(jobRef);
        if (jobDoc.exists) {
          resolvedJobId = jobDoc.id;
        }
      }

      // 3. Price items deterministically
      const snapshotItems: InvoiceItemSnapshot[] = [];
      let calculatedSubtotal = 0;

      for (const item of items_to_add) {
        let unitPriceExTax = Number(item.unit_price || 0);

        if (!unitPriceExTax && item.base_cost_at_quote) {
          const unitCalc = MarginEngine.calculateUnitPricing(
            item.base_cost_at_quote, 
            item.category || 'accessory', 
            'recommended', 
            DEFAULT_MARGIN_POLICY
          );
          unitPriceExTax = unitCalc.sellingPriceExTax;
        }

        const lineTotal = unitPriceExTax * item.qty;
        calculatedSubtotal += lineTotal;

        snapshotItems.push({
          product_id: item.product_id,
          display_name: item.display_name,
          qty: item.qty,
          unit_price: unitPriceExTax,
          line_total: lineTotal,
          base_cost_at_quote: item.base_cost_at_quote || Math.round(unitPriceExTax * 0.75),
          category: item.category || 'accessory'
        } as any);
      }

      const gstAmount = Math.round(calculatedSubtotal * 0.18);
      const totalPayable = calculatedSubtotal + gstAmount;

      const isCashPaid = payment_method === "cash";

      // 4. Create Change Order Entity
      const changeOrder: ChangeOrder = {
        id: changeOrderId,
        base_invoice_id: resolvedBaseInvoiceId,
        base_job_id: resolvedJobId,
        supplementary_quote_id: `SQ-${year}-${randomSuffix}`,
        reason: reason || "On-site extra requirements discovered during installation",
        items: snapshotItems,
        subtotal: calculatedSubtotal,
        gst_amount: gstAmount,
        total_payable: totalPayable,
        status: isCashPaid ? "approved" : "pending_customer_approval",
        created_by: created_by || "installer",
        created_at: new Date().toISOString()
      };

      const coRef = adminDb.collection("change_orders").doc(changeOrderId);
      transaction.set(coRef, { 
        ...changeOrder, 
        payment_status: isCashPaid ? "paid" : "unpaid",
        payment_method: payment_method || "qr_upi",
        lead_id: lead_id || null,
        _serverCreatedAt: serverTimestamp() 
      });

      // 5. Create Supplementary Tax Invoice Entity (GST Section 15 & 34)
      const suppInvoice: Invoice = {
        id: supplementaryInvoiceId,
        quote_id: base_invoice_id,
        customer_mobile: customerMobile,
        items: snapshotItems,
        subtotal: calculatedSubtotal,
        gst_amount: gstAmount,
        total_payable: totalPayable,
        amount_paid: isCashPaid ? totalPayable : 0,
        amount_due: isCashPaid ? 0 : totalPayable,
        payment_status: isCashPaid ? "paid" : "unpaid",
        payment_references: isCashPaid ? ["CASH_COLLECTED_ON_SITE"] : [],
        is_supplementary: true,
        base_invoice_id: resolvedBaseInvoiceId,
        created_at: new Date().toISOString()
      };

      const suppInvRef = adminDb.collection("invoices").doc(supplementaryInvoiceId);
      transaction.set(suppInvRef, {
        ...suppInvoice,
        change_order_id: changeOrderId,
        _serverCreatedAt: serverTimestamp()
      });

      // 6. Audit Log
      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        entity_type: "change_order",
        entity_id: changeOrderId,
        action: "created",
        actor: created_by || "installer",
        details: { 
          base_invoice_id: resolvedBaseInvoiceId, 
          supplementary_invoice_id: supplementaryInvoiceId,
          subtotal: calculatedSubtotal,
          total_payable: totalPayable,
          payment_method 
        },
        created_at: new Date().toISOString()
      });

      return {
        ...changeOrder,
        supplementary_invoice_id: supplementaryInvoiceId
      };
    });

    return NextResponse.json({ success: true, changeOrder: result });
  } catch (error: any) {
    console.error("Change order error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
