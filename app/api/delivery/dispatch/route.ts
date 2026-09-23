import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { quoteId, staffName, staffPhone, staffRole, deliveryMethod } = await req.json();

    if (!quoteId || !staffName || !staffPhone || !staffRole || !deliveryMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const quoteRef = adminDb.collection("quotes").doc(quoteId);
    const quoteDoc = await quoteRef.get();

    if (!quoteDoc.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const quoteData = quoteDoc.data() as any;

    if (quoteData.delivery_status === "DISPATCHED" || quoteData.delivery_status === "DELIVERED") {
      return NextResponse.json({ error: "Already dispatched or delivered" }, { status: 400 });
    }

    // Calculate 90% delivery payment amount
    const totalPayable = quoteData.pricingSnapshot?.total_payable || quoteData.total_payable || 0;
    const paymentAmount = Math.round((totalPayable - 500) * 0.90);

    // Generate 4 digit OTP
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Generate a unique delivery_token
    const deliveryToken = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    
    // Generate Razorpay Payment Link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com";
    let paymentUrl = "";
    
    try {
      const paymentRes = await fetch(`${baseUrl}/api/payment/razorpay-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: paymentAmount,
          customerName: quoteData.customer_name || "Customer",
          customerPhone: quoteData.customer_mobile || "",
          customerEmail: quoteData.customer_email || "customer@example.com",
          description: `Delivery Payment (90%) for Quote ${quoteData.quote_id || quoteId}`,
          quoteId: quoteId,
          notes: {
            payment_type: "delivery_90",
            quoteId: quoteId
          }
        }),
      });
      
      if (paymentRes.ok) {
        const paymentData = await paymentRes.json();
        paymentUrl = paymentData.paymentLink || paymentData.short_url || "";
      } else {
        console.error("Failed to generate payment link:", await paymentRes.text());
      }
    } catch (paymentErr) {
      console.error("Error calling payment link API:", paymentErr);
    }

    // Update the quote document
    await quoteRef.update({
      delivery_status: "DISPATCHED",
      delivery_otp: deliveryOtp,
      delivery_token: deliveryToken,
      delivery_method: deliveryMethod,
      assigned_delivery_staff: {
        name: staffName,
        phone: staffPhone,
        role: staffRole // "installer" | "salesperson" | "internal_staff" | "third_party"
      },
      dispatched_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    // Also update the associated Job to status DISPATCHED
    if (quoteData.job_id) {
      try {
        const jobRef = adminDb.collection("jobs").doc(quoteData.job_id);
        await jobRef.update({
          status: "DISPATCHED",
          updated_at: serverTimestamp(),
        });
      } catch (jobErr) {
        console.error("Error updating job status:", jobErr);
      }
    }

    // We can also trigger WhatsApp notifications here
    const { sendCustomerWhatsApp } = await import("@/lib/notification-service");
    
    // To Customer
    let customerMessage = `Hello ${quoteData.customer_name || 'Customer'}, your CCTV materials have been dispatched! Please complete your payment of ₹${paymentAmount} to receive your secure Delivery OTP: ${paymentUrl}`;
    
    if (staffRole !== "third_party") {
      customerMessage += `\n\nAlternatively, you can pay in cash to the delivery person.`;
    }
    
    await sendCustomerWhatsApp(quoteData.customer_mobile || "", customerMessage);

    // To Staff
    const magicLink = `${baseUrl}/d/${deliveryToken}`;
    let staffMessage = `New Delivery Assigned! Customer: ${quoteData.customer_name} at ${quoteData.address?.full_address || 'Customer site'}. Click here to verify delivery and enter the customer's OTP: ${magicLink}`;
    
    if (staffRole !== "third_party") {
      staffMessage += `\n\nCash to collect (if customer opts for cash): ₹${paymentAmount}`;
    }
    
    await sendCustomerWhatsApp(staffPhone, staffMessage);

    return NextResponse.json({ success: true, deliveryToken, paymentUrl });
  } catch (error: any) {
    console.error("Delivery dispatch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
