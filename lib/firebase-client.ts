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
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import {
  getAuth
} from "firebase/auth";
import {
  getStorage
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
// ─────────────────────────────────────────────

function getClientApp(): FirebaseApp {
  const existingApp = getApps().find(app => app.name === "[DEFAULT]");
  if (existingApp) return existingApp;

  try {
    if (typeof window !== "undefined") {
      console.info("🔒 Firebase Client Init: Project " + firebaseConfig.projectId);
    }
    
    // Validate config before initializing
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("undefined")) {
      throw new Error("auth/invalid-api-key: The Firebase API Key is missing or incorrectly defined.");
    }

    return initializeApp(firebaseConfig);
  } catch (error) {
    const err = error as Error;
    console.error("🔥 Firebase Init Fault:", err.message);
    // If we are in the browser, specifically check for already-initialized errors
    const apps = getApps();
    if (apps.length > 0) return getApp();
    throw error;
  }
}

/** Firebase Client App instance */
export const clientApp = getClientApp();

/** Firestore Client instance */
// Enable offline persistence with multiple tab support
export const db = initializeFirestore(clientApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

/** Firebase Auth Client instance */
export const auth = getAuth(clientApp);

/** Firebase Storage Client instance */
export const storage = getStorage(clientApp);

// ─────────────────────────────────────────────
// Firestore Collection Path Constants
// ─────────────────────────────────────────────

export { COLLECTIONS, SUBCOLLECTIONS, SETTINGS_DOC_ID } from "./constants";
