import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logs";

export async function POST(req: NextRequest) {
  try {
    // 1. Enterprise Throttling
    const limit = await rateLimit(req, 5, 60_000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many verification attempts. Please try again shortly." }, { status: 429 });
    }

    // 2. Strict Request Validation
    const bodySchema = z.object({
      identifier: z.string().min(1),
      otp: z.string().min(1),
      type: z.enum(["email", "mobile"]),
    });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { identifier, otp, type } = parsed.data;

    // ── EMAIL FLOW ────────────────────────────────────────────────────────────
    if (type === "email") {
      const email = identifier.toLowerCase().trim();
      const otpDoc = await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(email).get();

      if (!otpDoc.exists) {
        return NextResponse.json({ error: "OTP not found or expired." }, { status: 404 });
      }

      const data = otpDoc.data()!;
      const now = new Date();
      const expiry = (data?.expiresAt as any)?.toDate?.();

      if (expiry && now > expiry) {
        await otpDoc.ref.delete();
        return NextResponse.json({ error: "OTP has expired." }, { status: 400 });
      }

      if (data?.otp !== otp) {
        await createAuditLog({
          action: "ADMIN_LOGIN_FAILURE",
          actor_id: "unknown",
          actor_email: email,
          resource_type: "auth",
          metadata: { reason: "INVALID_OTP", type: "email" },
          ...getRequestMetadata(req)
        });
        return NextResponse.json({ error: "Invalid OTP code." }, { status: 400 });
      }

      // Cleanup OTP after successful verification
      await otpDoc.ref.delete();

      // Resolve or Create Firebase User
      let uid: string;
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        uid = userRecord.uid;
      } catch {
        const newUser = await adminAuth.createUser({ 
          email, 
          emailVerified: true, 
          displayName: data?.name || "Master Admin" 
        });
        uid = newUser.uid;
      }

      const role = data?.role || "super_admin";
      await adminAuth.setCustomUserClaims(uid, { role });
      const customToken = await adminAuth.createCustomToken(uid, { role });
      
      await createAuditLog({
        action: "ADMIN_LOGIN",
        actor_id: uid,
        actor_email: email,
        resource_type: "auth",
        metadata: { role, type: "email" },
        ...getRequestMetadata(req)
      });

      return NextResponse.json({ success: true, customToken });
    }

    // ── MOBILE FLOW ───────────────────────────────────────────────────────────
    if (type === "mobile") {
      // Normalize mobile: strip +91 prefix, keep 10 digits
      const normalized = identifier.toString().replace(/^\+?91/, "").replace(/\D/g, "").trim();
      const otpDoc = await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(normalized).get();

      if (!otpDoc.exists) {
        return NextResponse.json({ error: "Unauthorized or OTP expired." }, { status: 403 });
      }

      const data = otpDoc.data()!;
      
      // Handle numeric OTP verification from Firestore
      if (data?.otp !== otp) {
        // Fallback check: if the "otp" field in request is actually a Firebase ID Token 
        // (to maintain compatibility with original client-side Firebase Phone Auth)
        try {
          const decoded = await adminAuth.verifyIdToken(otp);
          const uid = decoded.uid;
          const role = data.role || "super_admin";

          // If it's a salesperson, link their account to this UID
          if (role === "sales_staff") {
            const spSnap = await adminDb.collection("salespeople")
              .where("mobile_number", "==", normalized)
              .limit(1)
              .get();
            
            if (!spSnap.empty) {
              await spSnap.docs[0].ref.update({ firebase_uid: uid });
            }
          }

          await adminAuth.setCustomUserClaims(uid, { role });
          const customToken = await adminAuth.createCustomToken(uid, { role });
          await otpDoc.ref.delete();

          await createAuditLog({
            action: "ADMIN_LOGIN",
            actor_id: uid,
            resource_id: normalized,
            resource_type: "auth",
            metadata: { role, type: "mobile_token" },
            ...getRequestMetadata(req)
          });

          return NextResponse.json({ success: true, customToken });
        } catch {
          await createAuditLog({
            action: "ADMIN_LOGIN_FAILURE",
            actor_id: "unknown",
            resource_id: normalized,
            resource_type: "auth",
            metadata: { reason: "INVALID_TOKEN", type: "mobile" },
            ...getRequestMetadata(req)
          });
          return NextResponse.json({ error: "Invalid OTP code or token." }, { status: 400 });
        }
      }

      // Numeric OTP matched in Firestore
      await otpDoc.ref.delete();

      // For custom numeric OTP, we need to resolve the user by phone number
      const phoneNumber = `+91${normalized}`;
      let uid: string;
      try {
        const userRecord = await adminAuth.getUserByPhoneNumber(phoneNumber);
        uid = userRecord.uid;
      } catch {
        const newUser = await adminAuth.createUser({ 
          phoneNumber,
          displayName: data?.name || "Admin User"
        });
        uid = newUser.uid;
      }

      const role = data.role || "super_admin";
      await adminAuth.setCustomUserClaims(uid, { role });
      const customToken = await adminAuth.createCustomToken(uid, { role });

      return NextResponse.json({ success: true, customToken });
    }

    return NextResponse.json({ error: "Invalid OTP type." }, { status: 400 });

  } catch (error) {
    console.error("🔥 [Admin OTP Verify] Enterprise Security Boundary Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
