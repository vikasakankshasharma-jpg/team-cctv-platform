#!/usr/bin/env node
/**
 * @file scripts/day0-reset.mjs
 * @description Day 0 Production Reset Script — Selectively removes test data
 * while preserving critical business configuration.
 *
 * SAFEGUARDS:
 *   1. DRY_RUN=true by default (zero writes/deletes)
 *   2. Firebase Project ID must match ALLOWED_PROJECT_ID
 *   3. Protected collections NEVER deleted (products, settings, wizard_steps, users)
 *   4. audit_logs PRESERVED (archive, not delete)
 *   5. Explicit typed confirmation required for actual deletion
 *   6. Pre-delete and post-delete counts logged
 *   7. Evidence summary file generated
 *
 * USAGE:
 *   DRY RUN (default, safe):
 *     node scripts/day0-reset.mjs
 *
 *   ACTUAL DELETION (requires typed confirmation):
 *     node scripts/day0-reset.mjs --live
 *
 * ENVIRONMENT:
 *   Reads Firebase credentials from .env.local via dotenv.
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createInterface } from "readline";

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION — EDIT THESE CAREFULLY
// ═══════════════════════════════════════════════════════════════

const ALLOWED_PROJECT_ID = "team-cctv-live-8294";

/** Collections that will NEVER be deleted, no matter what */
const PROTECTED_COLLECTIONS = [
  "products",
  "settings",
  "wizard_steps",
  "users",
  "addons",
  "addon_rules",
  "recommendation_rules",
  "installers",
  "promoters",
  "franchise_dealers",
  "franchise_pricing_overrides",
  "coverage_zones",
  "geo_rules",
  "hubs",
];

/** Collections to delete (test data only) */
const TARGET_COLLECTIONS = [
  "leads",                      // + subcollection: quotes
  "invoices",
  "jobs",
  "payment_transactions",
  "change_orders",
  "commission_records",
  "commission_payouts",
  "otp_verifications",
  "partner_otp_verifications",
  "dealer_otp_verifications",
  "installer_otp_verifications",
  "site_visit_bookings",
  "ledger_transactions",
];

/** Subcollections to recursively delete inside parent docs */
const SUBCOLLECTIONS_MAP = {
  "leads": ["quotes"],
  "wizard_steps": ["questions"],  // NOT deleted — wizard_steps is protected
};

/** audit_logs is PRESERVED — listed here for reporting only */
const PRESERVED_BUT_REPORTED = [
  "audit_logs",
];

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

const IS_DRY_RUN = !process.argv.includes("--live");

// Load .env.local
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (e) {
    console.error("❌ Cannot read .env.local — run from project root.");
    process.exit(1);
  }
}

loadEnv();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

// ═══════════════════════════════════════════════════════════════
// SAFETY CHECKS
// ═══════════════════════════════════════════════════════════════

function failSafe(msg) {
  console.error(`\n🛑 SAFETY CHECK FAILED: ${msg}\n`);
  process.exit(1);
}

if (!projectId) failSafe("FIREBASE_PROJECT_ID is not set.");
if (projectId !== ALLOWED_PROJECT_ID) {
  failSafe(`Project ID mismatch!\n   Expected: ${ALLOWED_PROJECT_ID}\n   Got:      ${projectId}`);
}
if (!clientEmail || !privateKey) {
  failSafe("Firebase credentials (CLIENT_EMAIL / PRIVATE_KEY) missing.");
}

// Verify no protected collection is in the target list
for (const t of TARGET_COLLECTIONS) {
  if (PROTECTED_COLLECTIONS.includes(t)) {
    failSafe(`CRITICAL: Protected collection "${t}" found in TARGET_COLLECTIONS!`);
  }
}

// ═══════════════════════════════════════════════════════════════
// FIREBASE INIT
// ═══════════════════════════════════════════════════════════════

const app = initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
  projectId,
});
const db = getFirestore(app);

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

async function getCollectionCount(collectionPath) {
  try {
    const snapshot = await db.collection(collectionPath).count().get();
    return snapshot.data().count;
  } catch {
    return 0;
  }
}

async function deleteCollectionBatch(collectionRef, batchSize = 100) {
  let totalDeleted = 0;
  let snapshot = await collectionRef.limit(batchSize).get();

  while (!snapshot.empty) {
    const batch = db.batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    totalDeleted += snapshot.size;
    process.stdout.write(`   ...deleted ${totalDeleted} docs\r`);

    if (snapshot.size < batchSize) break;
    snapshot = await collectionRef.limit(batchSize).get();
  }

  return totalDeleted;
}

async function deleteCollectionWithSubcollections(collectionName) {
  const subcols = SUBCOLLECTIONS_MAP[collectionName] || [];
  let totalDeleted = 0;

  if (subcols.length > 0) {
    // First delete all subcollection docs
    const parentDocs = await db.collection(collectionName).listDocuments();
    for (const parentDoc of parentDocs) {
      for (const subName of subcols) {
        const subRef = parentDoc.collection(subName);
        const subCount = await deleteCollectionBatch(subRef);
        totalDeleted += subCount;
        if (subCount > 0) {
          console.log(`   ↳ ${parentDoc.id}/${subName}: ${subCount} docs deleted`);
        }
      }
    }
  }

  // Then delete the parent collection docs
  const parentDeleted = await deleteCollectionBatch(db.collection(collectionName));
  totalDeleted += parentDeleted;

  return totalDeleted;
}

function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  const startTime = new Date();

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║          DAY 0 PRODUCTION RESET SCRIPT                     ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log(`║  Mode:       ${IS_DRY_RUN ? "🟡 DRY RUN (no deletions)" : "🔴 LIVE DELETE"}                   ║`);
  console.log(`║  Project:    ${projectId.padEnd(38)}       ║`);
  console.log(`║  Timestamp:  ${startTime.toISOString().padEnd(38)}       ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log();

  // ── Phase 1: Protected Collections Audit ──────────────────
  console.log("━━━ PHASE 1: Protected Collections (WILL NOT BE TOUCHED) ━━━");
  const protectedCounts = {};
  for (const col of PROTECTED_COLLECTIONS) {
    const count = await getCollectionCount(col);
    protectedCounts[col] = count;
    console.log(`  🛡️  ${col.padEnd(35)} ${String(count).padStart(6)} docs  [PROTECTED]`);
  }
  console.log();

  // ── Phase 2: Preserved Collections Report ─────────────────
  console.log("━━━ PHASE 2: Preserved Collections (ARCHIVED, NOT DELETED) ━━━");
  const preservedCounts = {};
  for (const col of PRESERVED_BUT_REPORTED) {
    const count = await getCollectionCount(col);
    preservedCounts[col] = count;
    console.log(`  📁  ${col.padEnd(35)} ${String(count).padStart(6)} docs  [PRESERVED]`);
  }
  console.log();

  // ── Phase 3: Target Collections — Pre-Delete Counts ───────
  console.log("━━━ PHASE 3: Target Collections (TEST DATA — TO BE DELETED) ━━━");
  const preCounts = {};
  let totalTargetDocs = 0;

  for (const col of TARGET_COLLECTIONS) {
    const count = await getCollectionCount(col);
    preCounts[col] = count;
    totalTargetDocs += count;

    // Count subcollections too
    const subcols = SUBCOLLECTIONS_MAP[col] || [];
    let subTotal = 0;
    if (subcols.length > 0 && count > 0) {
      const parentDocs = await db.collection(col).listDocuments();
      for (const parentDoc of parentDocs) {
        for (const subName of subcols) {
          const subCount = await getCollectionCount(`${col}/${parentDoc.id}/${subName}`);
          subTotal += subCount;
        }
      }
    }

    const subLabel = subTotal > 0 ? ` (+${subTotal} in subcollections)` : "";
    totalTargetDocs += subTotal;
    console.log(`  🗑️  ${col.padEnd(35)} ${String(count).padStart(6)} docs${subLabel}`);
  }

  console.log();
  console.log(`  ════════════════════════════════════════════════════`);
  console.log(`  TOTAL DOCUMENTS TO DELETE: ${totalTargetDocs}`);
  console.log(`  ════════════════════════════════════════════════════`);
  console.log();

  // ── DRY RUN EXIT ──────────────────────────────────────────
  if (IS_DRY_RUN) {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║  🟡 DRY RUN COMPLETE — No data was modified or deleted.    ║");
    console.log("║                                                            ║");
    console.log("║  To perform actual deletion, run:                          ║");
    console.log("║    node scripts/day0-reset.mjs --live                      ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");

    // Generate evidence file even in dry run
    generateEvidence(startTime, preCounts, {}, protectedCounts, preservedCounts, true);
    return;
  }

  // ── LIVE MODE: Triple Confirmation ────────────────────────
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  🔴 LIVE DELETE MODE                                       ║");
  console.log("║                                                            ║");
  console.log("║  This will PERMANENTLY DELETE test data from:              ║");
  console.log(`║  Project: ${projectId.padEnd(46)}    ║`);
  console.log("║                                                            ║");
  console.log("║  Protected collections will NOT be affected.               ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log();

  const answer1 = await askConfirmation(
    "⚠️  Type exactly DELETE-TEST-DATA to proceed: "
  );
  if (answer1 !== "DELETE-TEST-DATA") {
    console.log("\n❌ Confirmation failed. Aborting.\n");
    process.exit(1);
  }

  const answer2 = await askConfirmation(
    `⚠️  Confirm project ID (type "${ALLOWED_PROJECT_ID}"): `
  );
  if (answer2 !== ALLOWED_PROJECT_ID) {
    console.log("\n❌ Project ID confirmation failed. Aborting.\n");
    process.exit(1);
  }

  console.log();
  console.log("━━━ PHASE 4: Executing Deletion ━━━");
  console.log();

  const postCounts = {};
  const deletionResults = {};

  for (const col of TARGET_COLLECTIONS) {
    if (preCounts[col] === 0) {
      const subcols = SUBCOLLECTIONS_MAP[col] || [];
      if (subcols.length === 0) {
        console.log(`  ⏭️  ${col}: 0 docs — skipped`);
        deletionResults[col] = 0;
        continue;
      }
    }

    console.log(`  🗑️  Deleting: ${col}...`);
    const deleted = await deleteCollectionWithSubcollections(col);
    deletionResults[col] = deleted;
    console.log(`  ✅  ${col}: ${deleted} total docs deleted`);
  }

  console.log();

  // ── Phase 5: Post-Delete Verification ─────────────────────
  console.log("━━━ PHASE 5: Post-Delete Verification ━━━");

  let verifyPassed = true;
  for (const col of TARGET_COLLECTIONS) {
    const remaining = await getCollectionCount(col);
    postCounts[col] = remaining;
    const status = remaining === 0 ? "✅ CLEAN" : "⚠️  REMAINING";
    if (remaining > 0) verifyPassed = false;
    console.log(`  ${status}  ${col.padEnd(35)} ${remaining} docs remaining`);
  }

  console.log();
  console.log("━━━ Protected Collections Verification ━━━");
  let protectedIntact = true;
  for (const col of PROTECTED_COLLECTIONS) {
    const currentCount = await getCollectionCount(col);
    const originalCount = protectedCounts[col];
    const status = currentCount === originalCount ? "✅ INTACT" : "⚠️  CHANGED";
    if (currentCount !== originalCount) protectedIntact = false;
    console.log(`  ${status}  ${col.padEnd(35)} ${originalCount} → ${currentCount}`);
  }

  console.log();
  console.log("╔══════════════════════════════════════════════════════════════╗");
  if (verifyPassed && protectedIntact) {
    console.log("║  ✅ DAY 0 RESET COMPLETE — Database is clean & verified.   ║");
  } else {
    console.log("║  ⚠️  RESET COMPLETED WITH WARNINGS — Review above output. ║");
  }
  console.log(`║  Timestamp: ${new Date().toISOString().padEnd(46)}  ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");

  generateEvidence(startTime, preCounts, postCounts, protectedCounts, preservedCounts, false, deletionResults);
}

// ═══════════════════════════════════════════════════════════════
// EVIDENCE FILE
// ═══════════════════════════════════════════════════════════════

function generateEvidence(startTime, preCounts, postCounts, protectedCounts, preservedCounts, isDryRun, deletionResults = {}) {
  const endTime = new Date();
  const evidence = {
    script: "day0-reset.mjs",
    mode: isDryRun ? "DRY_RUN" : "LIVE_DELETE",
    project_id: projectId,
    started_at: startTime.toISOString(),
    completed_at: endTime.toISOString(),
    duration_seconds: Math.round((endTime - startTime) / 1000),
    protected_collections: protectedCounts,
    preserved_collections: preservedCounts,
    target_collections_before: preCounts,
    target_collections_after: postCounts,
    deletion_results: deletionResults,
  };

  const filename = `day0-reset-evidence-${isDryRun ? "dryrun" : "live"}-${startTime.toISOString().replace(/[:.]/g, "-")}.json`;
  const filepath = resolve(process.cwd(), "scripts", filename);
  writeFileSync(filepath, JSON.stringify(evidence, null, 2));
  console.log(`\n📄 Evidence file saved: ${filepath}\n`);
}

// ═══════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════

main().catch((err) => {
  console.error("\n💥 FATAL ERROR:", err.message);
  console.error(err.stack);
  process.exit(1);
});
