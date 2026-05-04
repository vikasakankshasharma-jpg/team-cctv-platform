/**
 * @file lib/auth-partner.ts
 * @description Server-side session verification utilities for the Partner Portal.
 *
 * Uses the `partner_session` HttpOnly cookie (created via /api/partner/auth/session).
 * The session cookie contains a Firebase ID token with custom claim { role: "partner" }.
 * On each request we verify the cookie and resolve the associated promoter document.
 */

import { adminAuth, adminDb } from "./firebase-admin";
import { cookies } from "next/headers";
import { COLLECTIONS } from "./constants";
import type { PartnerSession, Promoter } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// SESSION VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads and verifies the `partner_session` cookie.
 * Returns a PartnerSession object — always safe to call (never throws).
 */
export async function verifyPartnerSession(): Promise<PartnerSession> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("partner_session")?.value;

  if (!sessionCookie) {
    return { isAuthenticated: false, promoterId: null, promoterName: null, uid: null, role: null };
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    // Enforce role claim
    if (decoded.role !== "partner") {
      return { isAuthenticated: false, promoterId: null, promoterName: null, uid: null, role: null };
    }

    // Resolve promoter document by firebase_uid
    const promoterSnap = await adminDb
      .collection(COLLECTIONS.PROMOTERS)
      .where("firebase_uid", "==", decoded.uid)
      .limit(1)
      .get();

    if (promoterSnap.empty) {
      return { isAuthenticated: false, promoterId: null, promoterName: null, uid: decoded.uid, role: null };
    }

    const promoterDoc = promoterSnap.docs[0];
    const promoter = promoterDoc.data() as Promoter;

    return {
      isAuthenticated: true,
      promoterId: promoterDoc.id,
      promoterName: promoter.name,
      uid: decoded.uid,
      role: "partner",
    };
  } catch (error) {
    console.error("[Partner Auth] Session verification failed:", error);
    return { isAuthenticated: false, promoterId: null, promoterName: null, uid: null, role: null };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE GUARD (throws on failure — use in API routes)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enforces partner authentication. Throws a Response-compatible error if not authorized.
 * Use in API routes: `const session = await requirePartnerSession();`
 */
export async function requirePartnerSession(): Promise<PartnerSession> {
  const session = await verifyPartnerSession();
  if (!session.isAuthenticated || !session.promoterId) {
    throw new Error("PARTNER_UNAUTHORIZED");
  }
  return session;
}

// ─────────────────────────────────────────────────────────────────────────────
// OTP HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Generate a 6-digit numeric OTP */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Returns expiry Date 10 minutes from now */
export function otpExpiresAt(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}
