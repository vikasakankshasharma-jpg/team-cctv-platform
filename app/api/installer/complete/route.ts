import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { quoteId, otp, cashCollected, cashAmount } = await req.json();

    if (!quoteId || !otp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const quoteRef = adminDb.collection("quotes").doc(quoteId);
    const quoteSnap = await quoteRef.get();

    if (!quoteSnap.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const quoteData = quoteSnap.data();

    if (quoteData?.install_end_otp !== otp) {
      return NextResponse.json({ error: "Invalid Final OTP" }, { status: 400 });
    }

    const updatePayload: any = {
      install_status: "COMPLETED",
      install_completed_at: serverTimestamp(),
      installation_completed_at: new Date().toISOString(),
      updated_at: serverTimestamp(),
    };

    if (cashCollected && cashAmount > 0) {
      updatePayload.installer_cash_status = "COLLECTED_BY_INSTALLER";
      updatePayload.installer_cash_amount = cashAmount;
    }

    await quoteRef.update(updatePayload);

    // Calculate final payment
    const totalPayable = quoteData?.pricingSnapshot?.total_payable || quoteData?.total_payable || 0;
    const finalAmount = Math.round((totalPayable - 500) * 0.10);
    const isPaid = quoteData?.payment_status === "paid" || quoteData?.payment_status === "captured" || quoteData?.status === "PAID";

    if (finalAmount > 0 && !isPaid) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com";
        const res = await fetch(`${appUrl}/api/payment/razorpay-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteId,
            leadId: quoteData?.lead_id,
            payment_type: "installation_final"
          })
        });
        const linkData = await res.json();
        
        if (linkData.success && linkData.payment_url && quoteData?.customer_mobile) {
          const { sendCustomerWhatsApp } = await import("@/lib/notification-service");
          await sendCustomerWhatsApp(
            quoteData.customer_mobile,
            `🎉 Installation Complete! Please complete the final payment of ₹${finalAmount} to receive your Warranty Certificate: ${linkData.payment_url}`
          );
        }
      } catch (err) {
        console.error("Failed to create razorpay link or send WA", err);
      }
    } else if (isPaid) {
      // Trigger warranty immediately
      try {
        const { sendCustomerWhatsApp } = await import("@/lib/notification-service");
        if (quoteData?.customer_mobile) {
          await sendCustomerWhatsApp(
            quoteData.customer_mobile,
            `🎉 Installation Complete! Your CCTV system is fully installed. Your Warranty Certificate is being generated and will be sent shortly. Thank you for choosing TEAM CCTV! 🛡️`
          );
        }
        if (quoteData?.job_id) {
          await adminDb.collection("jobs").doc(quoteData.job_id).update({
            status: "COMPLETED",
            completed_at: new Date().toISOString(),
            updated_at: serverTimestamp(),
          });
          
          // Attempt to trigger warranty certificate generation
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com";
          fetch(`${appUrl}/api/operations/jobs/${quoteData.job_id}/warranty`, {
            method: "POST"
          }).catch(console.error);
        }
      } catch (err) {
        console.error("Failed to trigger warranty", err);
      }
    }

    // If there is an associated lead, we should mark the lead as installed/completed too.
    if (quoteData?.lead_id) {
      await adminDb.collection("leads").doc(quoteData.lead_id).update({
        status: "installed",
        updated_at: serverTimestamp()
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Installer Complete Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
