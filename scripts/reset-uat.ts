/**
 * @file scripts/reset-uat.ts
 * @description Day-0 Clean Slate Purge Script.
 * Wipes all test quotes, leads, jobs, invoices, customer profiles, and synthetic test data
 * from Firestore and Firebase Storage, preparing the platform for live public launch.
 * 
 * STRICT INVARIANTS:
 * - Genuine catalog products (`products`) are PRESERVED.
 * - Genuine super admins (`admins`) are PRESERVED.
 * - Real installer profile for Vikas Kumar Sharma (`installers`) is PRESERVED with metrics reset to 0.
 * - Territory configuration (`geo_pincodes`, `geo_tehsils`, `coverage_zones`) is PRESERVED.
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { adminDb, adminStorage } from "../lib/firebase-admin";

async function clearCollection(collectionPath: string) {
  const snapshot = await adminDb.collection(collectionPath).get();
  const batchSize = 400;
  
  if (snapshot.size === 0) {
    console.log(`- ${collectionPath} is already empty.`);
    return;
  }

  const batches = [];
  let currentBatch = adminDb.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    currentBatch.delete(doc.ref);
    count++;
    if (count % batchSize === 0) {
      batches.push(currentBatch.commit());
      currentBatch = adminDb.batch();
    }
  }

  if (count % batchSize !== 0) {
    batches.push(currentBatch.commit());
  }

  await Promise.all(batches);
  console.log(`✅ Cleared ${count} documents from ${collectionPath}.`);
}

async function cleanInstallers() {
  const snapshot = await adminDb.collection("installers").get();
  let deletedCount = 0;
  let resetCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const isTest = 
      doc.id.toLowerCase().includes("test") ||
      (data.name && data.name.toLowerCase().includes("test")) ||
      (data.email && data.email.toLowerCase().includes("test"));

    if (isTest) {
      await doc.ref.delete();
      deletedCount++;
    } else {
      // Genuine installer (e.g. Vikas Kumar Sharma) - reset metrics for Day 0
      await doc.ref.update({
        jobs_completed: 0,
        wallet_balance: 0,
        sla_breaches: 0,
        avg_rating: 5,
        sla_score: 100
      });
      resetCount++;
    }
  }
  console.log(`✅ Installers: purged ${deletedCount} test installer(s), reset metrics for ${resetCount} genuine installer(s).`);
}

async function cleanAdmins() {
  const snapshot = await adminDb.collection("admins").get();
  let deletedCount = 0;

  for (const doc of snapshot.docs) {
    const isTest = 
      doc.id === "test@example.com" || 
      doc.id.toLowerCase().includes("test") ||
      (doc.data().email && doc.data().email.toLowerCase().includes("test"));

    if (isTest) {
      await doc.ref.delete();
      deletedCount++;
    }
  }
  console.log(`✅ Admins: purged ${deletedCount} test staff account(s), preserved genuine super admins.`);
}

async function clearStorageFolder(folderPrefix: string) {
  try {
    const bucket = adminStorage.bucket();
    const [files] = await bucket.getFiles({ prefix: folderPrefix });
    
    if (files.length === 0) {
      console.log(`- Storage folder /${folderPrefix} is already empty.`);
      return;
    }

    const deletePromises = files.map(file => file.delete());
    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${files.length} file(s) from Storage /${folderPrefix}.`);
  } catch (err: any) {
    console.warn(`⚠️ Storage folder /${folderPrefix} skipped:`, err.message);
  }
}

async function wipeUATData() {
  console.log("=================================================");
  console.log("⚠️ STARTING DAY-0 UAT CLEAN SLATE PURGE ⚠️");
  console.log("Wiping all test leads, quotes, jobs, and invoices.");
  console.log("Genuine catalog products, admins, and territories will remain.");
  console.log("=================================================\n");

  const collectionsToWipe = [
    "quotes",
    "leads",
    "jobs",
    "invoices",
    "customers",
    "orders",
    "site_visit_bookings",
    "service_tickets",
    "serial_assets",
    "warranty_certificates",
    "amc_subscriptions",
    "city_impressions",
    "demand_impressions",
    "salespersons"
  ];

  const storageFoldersToWipe = [
    "quotes/",
    "jobs/",
    "leads/",
    "invoices/"
  ];

  try {
    console.log("--- 1. Clearing Transactional Collections ---");
    for (const col of collectionsToWipe) {
      await clearCollection(col);
    }
    
    console.log("\n--- 2. Sanitizing Role Profiles ---");
    await cleanInstallers();
    await cleanAdmins();

    console.log("\n--- 3. Clearing Generated Storage Assets ---");
    for (const folder of storageFoldersToWipe) {
      await clearStorageFolder(folder);
    }
    
    console.log("\n=================================================");
    console.log("🎉 DAY-0 CLEAN SLATE RESET COMPLETE!");
    console.log("The platform is pristine and ready for your first live customer.");
    console.log("=================================================");
  } catch (error) {
    console.error("\n❌ Error during Day-0 reset:", error);
    process.exit(1);
  }
}

wipeUATData().then(() => process.exit(0));
