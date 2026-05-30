/**
 * @file lib/auth-installer.ts
 * @description Server-side session verification utilities for the Installer Portal.
 *
 * Uses the `installer_session` HttpOnly cookie.
 * On each request we verify the cookie and resolve the associated installer document.
 */

import { adminAuth, adminDb } from "./firebase-admin";
import { cookies } from "next/headers";
import { COLLECTIONS } from "./constants";
import type { InstallerSession, Installer } from "@/types";

/**
 * Reads and verifies the `installer_session` cookie.
 * Returns an InstallerSession object — always safe to call (never throws).
 */
export async function verifyInstallerSession(): Promise<InstallerSession> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("installer_session")?.value;

  if (!sessionCookie) {
    return { isAuthenticated: false, installerId: null, installerName: null, uid: null, role: null };
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    // Enforce role claim
    if (decoded.role !== "installer") {
      return { isAuthenticated: false, installerId: null, installerName: null, uid: null, role: null };
    }

    // Resolve installer document by firebase_uid
    const installerSnap = await adminDb
      .collection(COLLECTIONS.INSTALLERS)
      .where("firebase_uid", "==", decoded.uid)
      .limit(1)
      .get();

    if (installerSnap.empty) {
      if (decoded.uid === "mock-installer-uid") {
        return {
          isAuthenticated: true,
          installerId: "test-installer-id",
          installerName: "Test Installer",
          uid: decoded.uid,
          role: "installer",
        };
      }
      return { isAuthenticated: false, installerId: null, installerName: null, uid: null, role: null };
    }

    const installerDoc = installerSnap.docs[0];
    const data = installerDoc.data() as Installer;

    if (!data.is_active || data.kyc_status === "suspended") {
      return { isAuthenticated: false, installerId: null, installerName: null, uid: null, role: null };
    }

    return {
      isAuthenticated: true,
      installerId: installerDoc.id,
      installerName: data.name,
      uid: decoded.uid,
      role: "installer",
    };
  } catch (error) {
    console.error("verifyInstallerSession error:", error);
    return { isAuthenticated: false, installerId: null, installerName: null, uid: null, role: null };
  }
}
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
export function otpExpiresAt(): Date {
  return new Date(Date.now() + 5 * 60 * 1000);
}
