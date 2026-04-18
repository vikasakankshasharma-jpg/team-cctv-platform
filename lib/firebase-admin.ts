/**
 * @file lib/firebase-admin.ts
 * @description Firebase Admin SDK initialization for server-side use ONLY.
 *
 * IMPORTANT:
 *  - This file must NEVER be imported from any client-side component or hook.
 *  - It is only safe to import in:
 *      • Next.js API Routes (/app/api/**)
 *      • Server Components that run exclusively on the server
 *      • Firebase Cloud Functions (/functions/src/**)
 *
 * The Admin SDK is initialized once using environment variables.
 * Credentials are sourced from FIREBASE_* env vars — never from a committed JSON file.
 *
 * Required environment variables (set in .env.local):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY      ← include literal \n characters in the .env value
 *   FIREBASE_STORAGE_BUCKET
 */

import admin from "firebase-admin";
import type { App } from "firebase-admin/app";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

// ─────────────────────────────────────────────
// Singleton initialization — only initialize once across hot reloads
// ─────────────────────────────────────────────

function getAdminApp(): App {
  // Check if an admin app is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  const isPlaceholder = !privateKey || privateKey.includes("YOUR_PRIVATE_KEY_HERE");

  if (isPlaceholder || !projectId || !clientEmail || !storageBucket) {
    console.warn("⚠️ Firebase Admin credentials are using placeholders or are missing. Admin Panel will run in Read-Only / Mock mode.");
    
    // Attempt to return a minimal app to prevent total crash
    return initializeApp({
      projectId: projectId || "mock-project",
    }, "mock-safe-app");
  }

  // privateKey from .env has literal \n — replace with actual newlines
  const formattedKey = privateKey.replace(/\\n/g, "\n");

  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      }),
      storageBucket,
    });
  } catch (error: any) {
    console.warn("⚠️ Firebase Admin Key Invalid. Initializing unauthenticated mock app.", error.message);
    return initializeApp({ projectId }, "mock-app");
  }
}

// ─────────────────────────────────────────────
// Exported service instances
// ─────────────────────────────────────────────

/** Firebase Admin App instance */
export const adminApp = getAdminApp();

/** Firestore Admin instance — use for all server-side DB operations */
export const adminDb = getFirestore(adminApp);

/** Firebase Auth Admin instance — use to verify ID tokens and set custom claims */
export const adminAuth = getAuth(adminApp);

/** Firebase Storage Admin instance — use to generate signed URLs / upload PDFs */
export const adminStorage = getStorage(adminApp);

// ─────────────────────────────────────────────
// Server-side Auth Helpers
// ─────────────────────────────────────────────

/**
 * Extracts and verifies a Firebase ID token from the Authorization header.
 * Returns the decoded token with custom claims, or throws if invalid.
 *
 * Usage in API route:
 *   const token = await verifyBearerToken(request);
 *   if (token.role !== "super_admin") return forbidden();
 */
export async function verifyBearerToken(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or malformed Authorization header");
  }

  const idToken = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  return decodedToken;
}

/**
 * Sets custom role claims on a Firebase user.
 * Must be called server-side by a super_admin only.
 *
 * @param uid    - Firebase UID of the user
 * @param role   - "super_admin" | "sales_staff"
 */
export async function setUserRole(uid: string, role: "super_admin" | "sales_staff") {
  await adminAuth.setCustomUserClaims(uid, { role });
}

/**
 * Firestore server timestamp helper.
 * Use this instead of new Date() for consistent server timestamps.
 */
export const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp();

/**
 * Firestore array union helper for append-only arrays (e.g., follow_up_notes).
 */
export const arrayUnion = (...items: unknown[]) =>
  admin.firestore.FieldValue.arrayUnion(...items);

/**
 * Firestore increment helper for counters (e.g., total_leads_referred).
 */
export const increment = (n: number) => admin.firestore.FieldValue.increment(n);
