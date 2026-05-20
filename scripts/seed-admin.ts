/**
 * @file scripts/seed-admin.ts
 * @description Seeds admin credentials into Firestore for both:
 *   1. `admins` collection  — required by /api/auth/otp/email (RBAC gate)
 *   2. `otp_verifications`  — pre-seeded OTP for mobile login (no real SMS needed)
 *
 * The email flow generates a REAL OTP via Resend and sends it to the inbox.
 * The mobile flow uses a pre-seeded static OTP (Firebase blocks SMS on localhost).
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json --transpile-only scripts/seed-admin.ts
 */

import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ─── Firebase Admin Init ──────────────────────────────────────────────────────
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
  });
}

const db = admin.firestore();

// ─── Credentials ──────────────────────────────────────────────────────────────
const ADMIN_MOBILE  = "9772699395";
const ADMIN_EMAIL   = "team.rajasthan.001@gmail.com";
const ADMIN_NAME    = "Super Admin";
const MOBILE_OTP    = "123456";          // static OTP for mobile (localhost)
const EXPIRY_MINS   = 60;               // OTP valid for 60 minutes

// ─── Seed Function ────────────────────────────────────────────────────────────
async function seedAdmin() {
  console.log("\n🚀  Seeding Admin Credentials");
  console.log("    Project :", process.env.FIREBASE_PROJECT_ID);
  console.log("─".repeat(55));

  const expiresAt = new Date(Date.now() + EXPIRY_MINS * 60 * 1000);

  // ── 1. Upsert into `admins` collection (RBAC gate for email OTP route) ──────
  const adminDocRef = db.collection("admins").doc(ADMIN_EMAIL);
  await adminDocRef.set(
    {
      email: ADMIN_EMAIL,
      mobile_number: ADMIN_MOBILE,   // field name used by /api/auth/otp/mobile
      name: ADMIN_NAME,
      role: "super_admin",
      is_active: true,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log(`\n  ✅  [admins] Upserted → ${ADMIN_EMAIL}`);
  console.log(`      Role    : super_admin`);
  console.log(`      Active  : true`);

  // ── 2. Seed `otp_verifications` for MOBILE (static OTP, localhost-safe) ─────
  await db.collection("otp_verifications").doc(ADMIN_MOBILE).set({
    otp: MOBILE_OTP,
    role: "super_admin",
    name: ADMIN_NAME,
    type: "mobile",
    expiresAt,
    seeded_at: new Date().toISOString(),
  });
  console.log(`\n  ✅  [otp_verifications] Mobile OTP seeded → ${ADMIN_MOBILE}`);
  console.log(`      OTP     : ${MOBILE_OTP}  (static — Firebase blocks real SMS on localhost)`);
  console.log(`      Expires : ${expiresAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`);

  // ── 3. Email OTP is handled live by Resend (no pre-seed needed) ──────────────
  console.log(`\n  ℹ️   [email] No pre-seed needed for email OTP.`);
  console.log(`      The login page will call /api/auth/otp/email which:`);
  console.log(`        • Verifies ${ADMIN_EMAIL} exists in \`admins\` collection ✅`);
  console.log(`        • Generates a real random OTP`);
  console.log(`        • Sends it to your inbox via Resend ✅`);

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(55));
  console.log("✅  All done! How to log in:\n");
  console.log("  📧  EMAIL (recommended for localhost)");
  console.log(`      → Go to http://localhost:3000/admin/login`);
  console.log(`      → Select "Email" tab`);
  console.log(`      → Enter: ${ADMIN_EMAIL}`);
  console.log(`      → Click "Send Auth Code"`);
  console.log(`      → Check inbox for real OTP from Resend\n`);
  console.log("  📱  MOBILE (localhost-safe with static OTP)");
  console.log(`      → Go to http://localhost:3000/admin/login`);
  console.log(`      → Select "Mobile" tab`);
  console.log(`      → Enter: ${ADMIN_MOBILE}`);
  console.log(`      → Click "Send Auth Code"`);
  console.log(`      → Use OTP: ${MOBILE_OTP}`);
  console.log(`      → (Expires: ${expiresAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST)`);
  console.log("\n  ⚠️   Mobile OTP expires in 60 min. Re-run this script to refresh.");
  console.log("─".repeat(55) + "\n");

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("\n❌  Seed failed:", err.message || err);
  process.exit(1);
});
