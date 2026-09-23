import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Msg91WhatsAppProvider } from "@/lib/whatsapp/msg91-provider";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const body = await request.json();
    const { testMode } = body;

    // 1. Fetch Quote to get customer info
    const quoteDoc = await adminDb.collection("quotes").doc(quoteId).get();
    if (!quoteDoc.exists) {
      return NextResponse.json({ success: false, message: "Quote not found" }, { status: 404 });
    }
    const quote = quoteDoc.data() as any;

    if (!quote.invoice_id) {
      return NextResponse.json({ success: false, message: "Invoice not generated for this quote yet" }, { status: 400 });
    }

    // 2. Fetch Invoice
    const invoiceDoc = await adminDb.collection("invoices").doc(quote.invoice_id).get();
    if (!invoiceDoc.exists) {
      return NextResponse.json({ success: false, message: "Invoice record not found" }, { status: 404 });
    }
    const invoice = invoiceDoc.data() as any;

    // 3. Idempotency Check
    const existingDelivery = await adminDb.collection("quoteDeliveries")
      .where("quoteId", "==", quoteId)
      .where("channel", "==", "whatsapp_invoice")
      .where("status", "==", "sent")
      .limit(1)
      .get();

    if (!existingDelivery.empty) {
      return NextResponse.json({ 
        success: true, 
        message: "Invoice WhatsApp message already sent previously.",
        idempotent: true
      });
    }

    const pdfUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/invoice/${quoteId}/download`;

    // 4. Send via WhatsApp Provider
    let deliveryResult: { success: boolean; messageId?: string; error?: string } = { success: false, messageId: "", error: "" };
    
    if (testMode) {
      console.log(`[TEST MODE] Mock Invoice WhatsApp sending to ${quote.customer_mobile}`);
      deliveryResult = { success: true, messageId: `mock_inv_${Date.now()}`, error: "" };
    } else {
      const waProvider = new Msg91WhatsAppProvider();
      
      deliveryResult = await waProvider.sendInvoice({
        phone: quote.customer_mobile,
        customerName: quote.customer_name || 'Customer',
        pdfUrl: pdfUrl,
        amount: invoice.total_payable
      });
    }

    // 5. Save Delivery Record
    const deliveryRecord: any = {
      quoteId,
      invoiceId: quote.invoice_id,
      channel: "whatsapp_invoice",
      status: deliveryResult.success ? "sent" : "failed",
      providerMessageId: deliveryResult.messageId,
      errorDetail: deliveryResult.error,
      sentAt: new Date().toISOString()
    };

    await adminDb.collection("quoteDeliveries").add(deliveryRecord);

    if (deliveryResult.success) {
      return NextResponse.json({ success: true, message: "Invoice WhatsApp sent successfully" });
    } else {
      return NextResponse.json({ success: false, message: deliveryResult.error || "WhatsApp delivery failed" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Invoice WhatsApp delivery error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
