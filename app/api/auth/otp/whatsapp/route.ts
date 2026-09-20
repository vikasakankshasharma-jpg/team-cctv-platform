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

    console.info(`[WhatsApp] Generating OTP for ${formattedPhone} (Role: ${role})`);

    await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(`+${formattedPhone}`).set({
      otp,
      expiresAt,
      type: "whatsapp",
      role,
      name: userName,
      createdAt: new Date(),
    });

    const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
    const MSG91_WHATSAPP_NUMBER = process.env.MSG91_WHATSAPP_NUMBER;

    if (!MSG91_AUTH_KEY || !MSG91_WHATSAPP_NUMBER) {
      return NextResponse.json({ error: "MSG91 WhatsApp service is not configured correctly." }, { status: 500 });
    }

    const payload = {
      integrated_number: MSG91_WHATSAPP_NUMBER,
      content_type: "template",
      payload: {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: "cctv_update",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: otp }]
            }
          ]
        }
      }
    };

    const response = await fetch("https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/", {
      method: "POST",
      headers: {
        "authkey": MSG91_AUTH_KEY,
        "Content-Type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok || responseData.hasError) {
      console.error("[MSG91 WhatsApp] API Error:", responseData);
      return NextResponse.json({ error: "Failed to send WhatsApp OTP via MSG91." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "WhatsApp OTP sent." });
  } catch (error: any) {
    console.error("WhatsApp OTP Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
