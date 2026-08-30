import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { Invoice, InvoiceItemSnapshot } from "@/types";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { quoteId } = data;

    if (!quoteId) {
      return NextResponse.json({ success: false, message: "quoteId is required" }, { status: 400 });
    }

    // Generate Invoice ID
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const invoiceId = `INV-${year}-${randomSuffix}`;

    // Execute within a Firestore Transaction to guarantee idempotency and avoid duplicate invoices
    const result = await adminDb.runTransaction(async (transaction) => {
      const quoteRef = adminDb.collection("quotes").doc(quoteId);
      const quoteDoc = await transaction.get(quoteRef);

      if (!quoteDoc.exists) {
        throw new Error("Quote not found");
      }

      const quoteData = quoteDoc.data()!;
      
      // 1. Idempotency Check
      if (quoteData.status === "INVOICED") {
        throw new Error("ALREADY_INVOICED");
      }

      if (quoteData.status === "DISCARDED" || quoteData.status === "SUPERSEDED") {
        throw new Error("Invalid quote status for invoicing");
      }

      // 2. Map line items to InvoiceItemSnapshot to enforce strict financial contract
      const snapshotItems: InvoiceItemSnapshot[] = quoteData.pricingSnapshot.items.map((item: any) => {
        const i: any = {
          product_id: item.product_id,
          display_name: item.display_name,
          qty: item.qty,
          unit_price: item.unit_price,
          line_total: item.line_total,
          base_cost_at_quote: item.base_cost_at_quote
        };
        if (item.stock_status_at_quote !== undefined) i.stock_status_at_quote = item.stock_status_at_quote;
        if (item.brand !== undefined) i.brand = item.brand;
        return i as InvoiceItemSnapshot;
      });

      // 3. Create the Immutable Invoice Entity
      const invoice: Invoice = {
        id: invoiceId,
        quote_id: quoteId,
        customer_mobile: quoteData.customer_mobile,
        items: snapshotItems,
        subtotal: quoteData.pricingSnapshot.net_taxable_amount,
        gst_amount: quoteData.pricingSnapshot.gst_amount,
        total_payable: quoteData.pricingSnapshot.total_payable,
        payment_status: "unpaid",
        payment_references: [],
        is_supplementary: false,
        created_at: new Date().toISOString()
      };

      const invoiceRef = adminDb.collection("invoices").doc(invoiceId);

      // 4. Perform atomic writes
      transaction.set(invoiceRef, {
        ...invoice,
        _serverCreatedAt: serverTimestamp()
      });

      // Update Quote Status to lock it
      transaction.update(quoteRef, {
        status: "INVOICED",
        invoice_id: invoiceId,
        updatedAt: new Date().toISOString()
      });

      return invoice;
    });

    return NextResponse.json({ success: true, invoice: result });
  } catch (error: any) {
    console.error("Invoice generation error:", error);
    if (error.message === "ALREADY_INVOICED") {
      return NextResponse.json({ success: false, message: "Quote has already been invoiced." }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
