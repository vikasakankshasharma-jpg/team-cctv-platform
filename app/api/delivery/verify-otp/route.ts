import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { quoteId, otp, cashCollected, cashAmount } = await req.json();

    if (!quoteId || !otp) {
      return NextResponse.json({ error: "Missing quoteId or otp" }, { status: 400 });
    }

    const quoteRef = adminDb.collection("quotes").doc(quoteId);
    const quoteDoc = await quoteRef.get();

    if (!quoteDoc.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const quoteData = quoteDoc.data() as any;

    if (quoteData.delivery_otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (quoteData.delivery_status === "DELIVERED") {
      return NextResponse.json({ error: "Already delivered" }, { status: 400 });
    }

    // Generate Installer OTPs
    const installStartOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const installEndOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const updatePayload: any = {
      delivery_status: "DELIVERED",
      install_start_otp: installStartOtp,
      install_end_otp: installEndOtp,
      delivered_at: new Date().toISOString(),
      updated_at: serverTimestamp(),
    };

    // If this is a cash collection
    if (cashCollected && cashAmount) {
      updatePayload.cash_collection_status = "COLLECTED_BY_STAFF";
      updatePayload.cash_collected_amount = cashAmount;
      updatePayload.cash_collected_at = serverTimestamp();

      await adminDb.collection("pending_cash_settlements").add({
        quote_id: quoteId,
        staff_name: quoteData.assigned_delivery_staff?.name || null,
        staff_phone: quoteData.assigned_delivery_staff?.phone || null,
        amount: cashAmount,
        status: "pending",
        collected_at: new Date().toISOString(),
        settled_at: null,
      });
    }

    await quoteRef.update(updatePayload);

    // Update job status if exists
    if (quoteData.job_id) {
      await adminDb.collection("jobs").doc(quoteData.job_id).update({
        status: "DELIVERED",
        delivered_at: new Date().toISOString(),
        updated_at: serverTimestamp(),
      });
    }

    const { sendCustomerWhatsApp } = await import("@/lib/notification-service");
    
    // Notify Customer Handover & provide Start OTP
    await sendCustomerWhatsApp(
      quoteData.customer_mobile || "",
      `✅ Material delivery confirmed! Your installation will be scheduled soon. An installer will contact you shortly.\n\nWhen the installer arrives, please share your Installation Start OTP: *${installStartOtp}* to begin the work.`
    );

    // Notify Installer (if assigned)
    if (quoteData.assigned_installer?.phone) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com";
      const installerLink = `${baseUrl}/installer/${quoteId}`;
      await sendCustomerWhatsApp(quoteData.assigned_installer.phone, `Items have been delivered to ${quoteData.customer_name}'s site. You are clear to proceed with installation. Access your portal here: ${installerLink}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delivery verify OTP error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
