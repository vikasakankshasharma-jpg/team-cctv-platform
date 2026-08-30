import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

import { TwilioWhatsAppProvider } from "@/lib/whatsapp/twilio-provider";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const body = await request.json();
    const { pdfUrl, testMode } = body;

    if (!pdfUrl) {
      return NextResponse.json({ success: false, message: "PDF URL is required" }, { status: 400 });
    }

    // 1. Fetch Quote Snapshot
    const doc = await adminDb.collection("quotes").doc(quoteId).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: "Quote not found" }, { status: 404 });
    }
    const quote = doc.data() as any;

    // 2. Idempotency Check
    const existingDelivery = await adminDb.collection("quoteDeliveries")
      .where("quoteId", "==", quoteId)
      .where("channel", "==", "whatsapp")
      .where("status", "==", "sent")
      .limit(1)
      .get();

    if (!existingDelivery.empty) {
      return NextResponse.json({ 
        success: true, 
        message: "WhatsApp message already sent previously.",
        idempotent: true
      });
    }

    // 3. Send via WhatsApp Provider
    let deliveryResult = { success: false, messageId: "", error: "" };
    
    if (testMode) {
      console.log(`[TEST MODE] Mock WhatsApp sending to ${quote.customer_mobile}`);
      deliveryResult = { success: true, messageId: `mock_${Date.now()}`, error: "" };
    } else {
      const waProvider = new TwilioWhatsAppProvider();
      
      let phone = quote.customer_mobile;

      deliveryResult = (await waProvider.sendQuote({
        phone,
        customerName: quote.customer_name || 'Customer',
        quoteId,
        totalAmount: quote.pricingSnapshot.total_payable,
        pdfUrl,
        selectedPlan: quote.selectedPlan,
        planDetails: {
          cameras: quote.requirementSnapshot.camera_count || 4,
          days: quote.requirementSnapshot.recording_days || 0,
          remote: !!quote.requirementSnapshot.wants_remote_viewing
        }
      })) as any;
    }

    // 4. Save Delivery Record
    const deliveryRecord: any = {
      quoteId,
      channel: "whatsapp",
      status: deliveryResult.success ? "sent" : "failed",
      providerMessageId: deliveryResult.messageId,
      errorDetail: deliveryResult.error,
      sentAt: new Date().toISOString()
    };

    await adminDb.collection("quoteDeliveries").add(deliveryRecord);

    // 5. Update Quote Status
    if (deliveryResult.success) {
      await adminDb.collection("quotes").doc(quoteId).update({
        status: "SENT"
      });
      return NextResponse.json({ success: true, message: "WhatsApp sent successfully" });
    } else {
      await adminDb.collection("quotes").doc(quoteId).update({
        status: "WHATSAPP_FAILED"
      });
      return NextResponse.json({ success: false, message: deliveryResult.error || "WhatsApp delivery failed" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("WhatsApp delivery error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}




