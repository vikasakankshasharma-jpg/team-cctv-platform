import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendCustomerWhatsApp } from "@/lib/notification-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quoteId, paymentType } = body;

    if (!quoteId || typeof quoteId !== "string") {
      return NextResponse.json({ success: false, error: "quoteId is required" }, { status: 400 });
    }

    if (!paymentType || !["delivery_90", "installation_final", "advance_500_cod", "advance_500", "advance"].includes(paymentType)) {
      return NextResponse.json({ success: false, error: "Invalid paymentType" }, { status: 400 });
    }

    // 1. Fetch Quote
    const quoteRef = adminDb.collection("quotes").doc(quoteId);
    let quoteSnap = await quoteRef.get();
    
    // If not found, try leads
    if (!quoteSnap.exists) {
      const leadSnap = await adminDb.collection("leads").doc(quoteId).get();
      if (leadSnap.exists) {
         quoteSnap = leadSnap;
      } else {
        return NextResponse.json({ success: false, error: "Quote/Lead not found" }, { status: 404 });
      }
    }

    const quoteData = quoteSnap.data() as any;

    // 2. Fetch Razorpay Link internally
    // We construct the URL. Since this is server-side, we must use an absolute URL.
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const rpRes = await fetch(`${baseUrl}/api/payment/razorpay-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quoteId,
        paymentType,
        notes: {
          source: "resend_link_api",
          payment_type: paymentType
        }
      })
    });

    const rpData = await rpRes.json();
    if (!rpRes.ok || !rpData.payment_url) {
      throw new Error(rpData.error || "Failed to generate Razorpay link");
    }

    const paymentUrl = rpData.payment_url;
    
    // 3. Compute amounts for messaging
    const serverAmount = Number(
      quoteData.pricingSnapshot?.total_payable ??
      quoteData.total_payable ??
      quoteData.total ??
      0
    );
    const remaining = serverAmount - 500;
    
    let amount = 500;
    let stageName = "Booking Amount (₹500)";

    if (paymentType === "delivery_90") {
      amount = Math.round(remaining * 0.90);
      stageName = "Material Delivery (90%)";
    } else if (paymentType === "installation_final") {
      amount = Math.round(remaining * 0.10);
      stageName = "Installation Final (10%)";
    }
    const customerPhone = quoteData.mobile_number || quoteData.phone;
    const customerName = quoteData.customer_name || "Customer";

    // 4. Send WhatsApp Notification
    if (customerPhone) {
      const waMessage = `Hello ${customerName},

Your payment for *${stageName}* is due.
Amount: ₹${amount.toLocaleString('en-IN')}

Please complete your payment using this secure link:
${paymentUrl}

Thank you,
TEAM CCTV`;

      await sendCustomerWhatsApp(customerPhone, waMessage);
    }

    return NextResponse.json({ 
      success: true, 
      payment_url: paymentUrl 
    });

  } catch (error: any) {
    console.error("Resend Payment Link Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
