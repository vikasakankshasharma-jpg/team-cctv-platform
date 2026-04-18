/**
 * @file lib/firebase-client.ts
 * @description Firebase Client SDK initialization for browser-side use.
 *
 * IMPORTANT:
 *  - This file is safe to import in React components, hooks, and client-side utilities.
 *  - It uses the PUBLIC Firebase config (NEXT_PUBLIC_* env vars — safe to expose).
 *  - Uses the modular Firebase v10+ API (tree-shakeable).
 *  - Initialized as a singleton to prevent re-initialization on hot reloads.
 *
 * Required environment variables (set in .env.local):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import {
  getAuth,
  type Auth,
} from "firebase/auth";
import {
  getStorage,
  type FirebaseStorage,
} from "firebase/storage";

// ─────────────────────────────────────────────
// Firebase Client Configuration
// All values are NEXT_PUBLIC_ — safe to ship to the browser
// ─────────────────────────────────────────────

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// ─────────────────────────────────────────────
// Singleton App Instance
// getApps() check prevents re-initialization during Next.js hot reload
// ─────────────────────────────────────────────

function getClientApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  // Build-time safety: If API key is missing (during next build), return a mock app
  // This prevents the 'auth/invalid-api-key' error from crashing the pre-rendering phase.
  const isBuildPhase = !firebaseConfig.apiKey || firebaseConfig.apiKey === "undefined";
  
  if (isBuildPhase) {
    console.log("🚀 Next.js Build Phase detected. Initializing Firebase Mock App.");
    return initializeApp({
      apiKey: "mock-api-key",
      authDomain: "mock.firebaseapp.com",
      projectId: "mock-project",
    }, "build-mock-app");
  }

  return initializeApp(firebaseConfig);
}

/** Firebase Client App instance */
export const clientApp: FirebaseApp = getClientApp();

/** Firestore Client instance — use for real-time reads in components */
export const db: Firestore = getFirestore(clientApp);

/** Firebase Auth Client instance — use for Phone Auth OTP and session state */
export const auth: Auth = getAuth(clientApp);

/** Firebase Storage Client instance — use for uploading/downloading files */
export const storage: FirebaseStorage = getStorage(clientApp);

// ─────────────────────────────────────────────
// Firestore Collection Path Constants
// Centralised so path strings are never duplicated across the codebase
// ─────────────────────────────────────────────

export const COLLECTIONS = {
  USERS: "users",
  LEADS: "leads",
  PRODUCTS: "products",
  ADDONS: "addons",
  ADDON_RULES: "addon_rules",
  WIZARD_STEPS: "wizard_steps",
  PROMOTERS: "promoters",
  COMMISSION_RULES: "commission_rules",
  COMMISSION_RECORDS: "commission_records",
  COMMISSION_PAYOUTS: "commission_payouts",
  OTP_VERIFICATIONS: "otp_verifications",
  SITE_VISIT_BOOKINGS: "site_visit_bookings",
  SETTINGS: "settings",
} as const;

/** Subcollection name constants */
export const SUBCOLLECTIONS = {
  QUOTES: "quotes",
  QUESTIONS: "questions",
  OPTIONS: "options",
} as const;

/** The single settings document ID */
export const SETTINGS_DOC_ID = "app_config";
