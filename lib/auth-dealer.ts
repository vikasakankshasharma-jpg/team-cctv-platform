/**
 * @file lib/auth-dealer.ts
 * @description Server-side session verification for the Franchise Dealer Portal.
 *
 * Uses the `dealer_session` HttpOnly cookie (set via /api/dealer/auth/session).
 * The session cookie contains a Firebase session cookie verified against the
 * franchise_dealers collection by firebase_uid.
 */

import { adminAuth, adminDb } from "./firebase-admin";
import { cookies } from "next/headers";
import { COLLECTIONS } from "./constants";
import type { FranchiseDealer } from "@/types";

export interface DealerSession {
  isAuthenticated: boolean;
  dealerId: string | null;
  dealerName: string | null;
  companyName: string | null;
  uid: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads and verifies the `dealer_session` cookie.
 * Returns a DealerSession — always safe to call (never throws).
 */
export async function verifyDealerSession(): Promise<DealerSession> {
  const EMPTY: DealerSession = {
    isAuthenticated: false,
    dealerId: null,
    dealerName: null,
    companyName: null,
    uid: null,
  };

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("dealer_session")?.value;
  if (!sessionCookie) return EMPTY;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    // Must have dealer role claim
    if (decoded.role !== "franchise_dealer") return EMPTY;

    // Resolve franchise dealer document by firebase_uid
    const snap = await adminDb
      .collection(COLLECTIONS.FRANCHISE_DEALERS)
      .where("firebase_uid", "==", decoded.uid)
      .limit(1)
      .get();

    if (snap.empty) return { ...EMPTY, uid: decoded.uid };

    const doc = snap.docs[0];
    const dealer = doc.data() as FranchiseDealer;

    if (!dealer.is_active) return EMPTY;

    return {
      isAuthenticated: true,
      dealerId: doc.id,
      dealerName: dealer.owner_name,
      companyName: dealer.company_name,
      uid: decoded.uid,
    };
  } catch (err) {
    console.error("[Dealer Auth] Session verification failed:", err);
    return EMPTY;
  }
}

/**
 * Enforces dealer authentication. Throws if not authorized.
 * Use in API routes: `const session = await requireDealerSession();`
 */
export async function requireDealerSession(): Promise<DealerSession> {
  const session = await verifyDealerSession();
  if (!session.isAuthenticated || !session.dealerId) {
    throw new Error("DEALER_UNAUTHORIZED");
  }
  return session;
}

/** Generate a 6-digit numeric OTP */
export function generateDealerOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Returns expiry Date 10 minutes from now */
export function dealerOtpExpiresAt(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}
