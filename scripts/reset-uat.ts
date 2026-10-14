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
 * - Real sales profile for Vikas Kumar Sharma (`salespeople`) is PRESERVED.
 * - Territory configuration (`geo_pincodes`, `geo_tehsils`, `coverage_zones`, `service_areas`, `pincode_cache`) is PRESERVED.
 * - Platform core configuration (`settings`, `wizard_steps`, `amc_plans`) is PRESERVED.
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { adminDb, adminStorage } from "../lib/firebase-admin";

async function clearCollection(collectionPath: string) {
  try {
    const colRef = adminDb.collection(collectionPath);
    const snap = await colRef.limit(1).get();
    if (snap.empty) {
      console.log(`- ${collectionPath} is already empty.`);
      return;
    }
    // recursiveDelete safely handles documents and any nested subcollections
    await adminDb.recursiveDelete(colRef);
    console.log(`✅ Cleared all documents and subcollections from ${collectionPath}.`);
  } catch (err: any) {
    console.warn(`⚠️ Error clearing collection ${collectionPath}:`, err.message);
  }
}

async function cleanProducts() {
  const snapshot = await adminDb.collection("products").get();
  let deletedCount = 0;
  let preservedCount = 0;

  for (const doc of snapshot.docs) {
    const id = doc.id;
    const isTest = 
      id.startsWith("PROD-ADMIN-") ||
      id.startsWith("PROD-LIVE-") ||
      id.startsWith("SKU_") ||
      id === "CAM1" ||
      id === "cam_capstone_1" ||
      id.toLowerCase().includes("test");

    if (isTest) {
      await doc.ref.delete();
      deletedCount++;
    } else {
      preservedCount++;
    }
  }
  console.log(`✅ Products: purged ${deletedCount} synthetic test product(s), preserved ${preservedCount} genuine catalog products.`);
}

async function cleanInventory() {
  const snapshot = await adminDb.collection("inventory").get();
  let deletedCount = 0;

  for (const doc of snapshot.docs) {
    const id = doc.id;
    const isTest = 
      id.startsWith("PROD-INV-A-") ||
      id.startsWith("PROD-INV-B-") ||
      id.startsWith("SKU_") ||
      id === "CAM1" ||
      id === "cam_capstone_1" ||
      id.toLowerCase().includes("test");

    if (isTest) {
      await doc.ref.delete();
      deletedCount++;
    }
  }
  console.log(`✅ Inventory: purged ${deletedCount} synthetic test stock item(s).`);
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
  console.log("⚠️ STARTING COMPREHENSIVE DAY-0 UAT CLEAN SLATE PURGE ⚠️");
  console.log("Wiping all test leads, quotes, jobs, and invoices.");
  console.log("Genuine catalog products, admins, installers, and territories will remain.");
  console.log("=================================================\n");

  const collectionsToWipe = [
    "quotes",
    "leads",
    "industrial_leads",
    "interest_leads",
    "followup_tasks",
    "quoteDeliveries",
    "quote_events",
    "quote_sessions",
    "jobs",
    "invoices",
    "customers",
    "orders",
    "deals",
    "change_orders",
    "payout_requests",
    "purchase_orders",
    "inventory_ledger",
    "stock_ledger",
    "site_visit_bookings",
    "service_tickets",
    "serial_assets",
    "warranty_certificates",
    "customer_warranty_items",
    "amc_subscriptions",
    "amc_contracts",
    "rma_tickets",
    "profitability_snapshots",
    "rate_limits",
    "city_impressions",
    "demand_impressions",
    "otp_verifications",
    "audit_logs",
    "pricing_audit_logs",
    "whatsapp_sessions"
  ];

  const storageFoldersToWipe = [
    "quotes/",
    "jobs/",
    "leads/",
    "invoices/"
  ];

  try {
    console.log("--- 1. Recursively Clearing Transactional Collections ---");
    for (const col of collectionsToWipe) {
      await clearCollection(col);
    }
    
    console.log("\n--- 2. Sanitizing Products & Inventory ---");
    await cleanProducts();
    await cleanInventory();

    console.log("\n--- 3. Sanitizing Role Profiles ---");
    await cleanInstallers();
    await cleanAdmins();

    console.log("\n--- 4. Clearing Generated Storage Assets ---");
    for (const folder of storageFoldersToWipe) {
      await clearStorageFolder(folder);
    }
    
    console.log("\n=================================================");
    console.log("🎉 COMPREHENSIVE DAY-0 CLEAN SLATE RESET COMPLETE!");
    console.log("The platform is 100% pristine and ready for your first live customer.");
    console.log("=================================================");
  } catch (error) {
    console.error("\n❌ Error during Day-0 reset:", error);
    process.exit(1);
  }
}

wipeUATData().then(() => process.exit(0));
