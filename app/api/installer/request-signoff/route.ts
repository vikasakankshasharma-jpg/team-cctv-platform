import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { quoteId } = await req.json();

    if (!quoteId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const quoteRef = adminDb.collection("quotes").doc(quoteId);
    const quoteSnap = await quoteRef.get();

    if (!quoteSnap.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const quoteData = quoteSnap.data();

    await quoteRef.update({
      install_status: "SIGN_OFF_REQUESTED",
      updated_at: serverTimestamp(),
    });

    const advance = 500;
    const deliveryCash = quoteData?.cash_collected_amount || 0;
    let remainingBalance = (quoteData?.total_payable || 0) - advance - deliveryCash;
    if (remainingBalance < 0) remainingBalance = 0;

    const { sendCustomerWhatsApp } = await import("@/lib/notification-service");
    const { resolveCustomerLocale, getCustomerNotifications } = await import("@/lib/whatsapp/customer-notifications-i18n");
    const custLocale = await resolveCustomerLocale({ quoteData, phone: quoteData?.customer_mobile });
    const notif = getCustomerNotifications(custLocale);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com";
    const paymentLink = `${baseUrl}/quote/${quoteData?.lead_id}/review/${quoteId}`; // Direct to their quote page for online payment if needed.

    const msg = notif.installerSignoffRequest({
      balance: remainingBalance.toLocaleString("en-IN"),
      balanceNum: remainingBalance,
      paymentLink,
      otp: String(quoteData?.install_end_otp || ""),
    });

    await sendCustomerWhatsApp(quoteData?.customer_mobile || "", msg);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Installer Request Signoff Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
