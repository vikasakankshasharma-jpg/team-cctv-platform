import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  const quoteId = "TEST_PARTIAL_QUOTE_" + Date.now();
  const leadId = "TEST_LEAD_" + Date.now();
  
  await adminDb.collection("leads").doc(leadId).set({
    mobile_number: "9587980007",
    customer_name: "Test Visual Partial User",
    status: "won"
  });

  await adminDb.collection("quotes").doc(quoteId).set({
    id: quoteId,
    leadId: leadId,
    lead_id: leadId,
    customer_name: "Test Visual Partial User",
    customer_mobile: "9587980007",
    status: "PARTIAL_PAID",
    payment_status: "partial",
    total_payable: 20000,
    amount_paid: 5000,
    amount_due: 15000,
    pricingSnapshot: {
      total_payable: 20000,
      gross_subtotal: 16949,
      gst_amount: 3051,
      items: [
        { product_id: "prod_1", display_name: "Camera", qty: 4, unit_price: 2000, line_total: 8000, base_cost_at_quote: 1000 }
      ]
    },
    lineItems: [
      { id: "prod_1", name: "Camera", description: "Test", quantity: 4, unitPrice: 2000 }
    ],
    advancePercent: 25,
    createdAt: new Date().toISOString()
  });
  
  // also create the invoice to test PDF
  await adminDb.collection("invoices").doc(quoteId).set({
    id: quoteId,
    quote_id: quoteId,
    customer_mobile: "9587980007",
    items: [
      { product_id: "prod_1", display_name: "Camera", qty: 4, unit_price: 2000, line_total: 8000, base_cost_at_quote: 1000 }
    ],
    subtotal: 16949,
    gst_amount: 3051,
    total_payable: 20000,
    amount_paid: 5000,
    amount_due: 15000,
    payment_status: "partial",
    created_at: new Date().toISOString()
  });

  return NextResponse.json({ url: `/quote/${leadId}/review/${quoteId}` });
}
