import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { success } = await rateLimit(req);
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    
    let formattedPhone = cleanPhone;
    if (cleanPhone.length === 10) {
      formattedPhone = "91" + cleanPhone;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
      formattedPhone = cleanPhone;
    } else {
      return NextResponse.json({ error: "Invalid phone number format." }, { status: 400 });
    }

    let role = "customer";
    let userName = "Valued Customer";
    const normalized = cleanPhone.length === 12 ? cleanPhone.substring(2) : cleanPhone;

    // RBAC Lookup
    const adminSnap = await adminDb.collection("admins").where("mobile_number", "==", normalized).where("is_active", "==", true).limit(1).get();
    if (!adminSnap.empty) { role = "super_admin"; userName = adminSnap.docs[0].data().name || "Administrator"; }
    else {
      const spSnap = await adminDb.collection("salespeople").where("mobile_number", "==", normalized).where("is_active", "==", true).limit(1).get();
      if (!spSnap.empty) { role = "sales_staff"; userName = spSnap.docs[0].data().name || "Sales Professional"; }
      else {
        const partnerSnap = await adminDb.collection("promoters").where("mobile_number", "==", normalized).where("status", "==", "approved").limit(1).get();
        if (!partnerSnap.empty) { role = "partner"; userName = partnerSnap.docs[0].data().name || "Partner"; }
        else {
          const instSnap = await adminDb.collection("installers").where("mobile_number", "==", normalized).where("status", "in", ["active", "approved"]).limit(1).get();
          if (!instSnap.empty) { role = "installer"; userName = instSnap.docs[0].data().name || "Installer"; }
        }
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.info(`[Mtalkz SMS] Generating OTP for ${formattedPhone} (Role: ${role})`);

    await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(`+${formattedPhone}`).set({
      otp,
      expiresAt,
      type: "sms",
      role,
      name: userName,
      createdAt: new Date(),
    });

    const MTALKZ_API_KEY = process.env.MTALKZ_API_KEY;
    const MTALKZ_SENDER_ID = process.env.MTALKZ_SENDER_ID || "MTALKZ";
    const MTALKZ_TEMPLATE = process.env.MTALKZ_TEMPLATE || "{OTP} is your OTP for CCTV Quotation. Please use it before it expires.";

    if (!MTALKZ_API_KEY) {
      return NextResponse.json({ error: "Mtalkz SMS service is not configured on the server." }, { status: 500 });
    }

    // Replace {OTP} with actual OTP
    const message = MTALKZ_TEMPLATE.replace("{OTP}", otp).replace("{#var#}", otp);

    const payload = {
      apikey: MTALKZ_API_KEY,
      senderid: MTALKZ_SENDER_ID,
      number: formattedPhone,
      message: message,
      format: "json",
      digit: "6",
      otptimeout: "120"
    };

    const response = await fetch("https://msg.mtalkz.com/V2/http-api-sms.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch(e) {
      responseData = { raw: responseText };
    }

    // Mtalkz usually returns something like { "status": "OK", ... }
    if (!response.ok || responseData.status === "ERROR" || responseText.toLowerCase().includes("error")) {
      const errorMsg = responseData?.message || responseData?.msg || responseData?.error || responseData?.description || (typeof responseData?.raw === 'string' ? responseData.raw : "Failed to send SMS via Mtalkz.");
      return NextResponse.json({ error: errorMsg, details: responseData }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "SMS OTP sent via Mtalkz." });
  } catch (error: any) {
    console.error("SMS OTP Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
