import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { Resend } from "resend";
import { rateLimit } from "@/lib/rate-limit";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logs";
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  // 1. Rate Limiting
  const { success } = await rateLimit(req);
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { ip, ua } = getRequestMetadata(req);

    // 2. Dynamic RBAC Lookup
    const adminSnap = await adminDb.collection("admins")
      .where("email", "==", normalizedEmail)
      .where("is_active", "==", true)
      .limit(1)
      .get();

    if (adminSnap.empty) {
      // Audit failure
      await createAuditLog({
        action: "ADMIN_LOGIN_FAILURE",
        actor_id: "guest",
        actor_email: normalizedEmail,
        resource_type: "auth",
        ip_address: ip,
        user_agent: ua,
        metadata: { reason: "Email not in authorized admin collection or inactive" }
      });
      return NextResponse.json({ error: "Unauthorized. This email does not have Admin privileges." }, { status: 403 });
    }

    const adminData = adminSnap.docs[0].data();
    const userName = adminData.name || name || "Master Admin";
    const role = adminData.role || "super_admin";

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.info(`[Auth] Generating OTP for ${email}`);

    // Save to Firestore
    await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(normalizedEmail).set({
      otp,
      expiresAt,
      name: userName,
      role: role,
      type: "email",
      createdAt: new Date(),
    });

    // Send Real Email via Resend
    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: "TEAM CCTV <onboarding@resend.dev>", 
          to: email,
          subject: `${otp} is your TEAM Elite Verification Code`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #f9f9f9; border-radius: 24px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #000; font-size: 24px; font-weight: 900; letter-spacing: -1px; margin: 0;">TEAM CCTV</h1>
                <p style="color: #666; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px;">Smart Security Ecosystem</p>
              </div>
              
              <div style="background-color: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
                <p style="color: #444; font-size: 16px; margin-bottom: 24px;">Hello Admin,</p>
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">To access the Command Centre, please use the following verification code:</p>
                
                <div style="background-color: #f1f5f9; padding: 24px; border-radius: 16px; display: inline-block;">
                  <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #1e293b;">${otp}</span>
                </div>
                
                <p style="color: #94a3b8; font-size: 11px; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">This code expires in 10 minutes.</p>
              </div>
              
              <div style="text-align: center; margin-top: 40px;">
                <p style="color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} TEAM Smart Security Systems. All rights reserved.</p>
              </div>
            </div>
          `
        });

        if (error) {
          console.error("❌ [Resend] API Error:", error);
          throw new Error("Failed to send email via provider.");
        }

        console.log(`✅ [Resend] Successfully sent OTP to ${email}`, data);
      } catch (err: any) {
        console.error("❌ [Resend] Transport Error:", err);
        // We don't throw here to allow the user to see the OTP in console if they are the admin
      }
    } else {
      console.warn("⚠️ [Resend] API Key missing. Logging OTP to console:", otp);
    }

    return NextResponse.json({ success: true, message: "OTP sent to your email." });
  } catch (error: any) {
    console.error("🔥 Email OTP Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
