import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";
import * as readline from "readline";

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Initialize Firebase Admin
if (!admin.apps.length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1);
  }
  if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
    privateKey = privateKey.substring(1, privateKey.length - 1);
  }
  privateKey = privateKey.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

// ----------------------------------------------------------------------
// DAY 0 PURGE CONFIGURATION
// ----------------------------------------------------------------------

// COLLECTIONS TO WIPE (Transactional data)
// We DO NOT wipe: products, addons, settings, wizard_steps, admins, hubs, inventory, stock_ledger
const COLLECTIONS_TO_PURGE = [
  "customers",
  "users",               // Added to reset all user role profiles
  "installers",          // Installer roles
  "promoters",           // Partner/Promoter roles
  "leads",
  "deals",
  "jobs",
  "service_tickets",
  "serial_assets",
  "amc_contracts",
  "customer_warranty_items",
  "warranties",
  "rma_requests",
  "invoices",
  "receipts",
  "purchase_orders",
  "audit_logs",
  "quotes",
  "orders",
  "data_migration_review",
  "otp_verifications",
  "site_visit_bookings",
  "analytics_rejections",
  "city_impressions",
  "demand_impressions",
  "industrial_leads",
  "quoteDeliveries",
  "quote_events",
  "quote_sessions",
  "rate_limits",
  "temp_otps"
];

// ----------------------------------------------------------------------

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptConfirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function deleteCollection(collectionPath: string) {
  console.log(`Deleting collection: ${collectionPath}...`);
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log(` - Collection ${collectionPath} is already empty.`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(` - Deleted ${snapshot.size} documents from ${collectionPath}.`);
}

async function deleteCollectionGroup(collectionId: string) {
  console.log(`Deleting all documents in collection group: ${collectionId}...`);
  const snapshot = await db.collectionGroup(collectionId).get();
  
  if (snapshot.empty) {
    console.log(` - Collection group ${collectionId} is already empty.`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(` - Deleted ${snapshot.size} orphaned documents from subcollection ${collectionId}.`);
}

async function wipeFirebaseAuth() {
  console.log(`\nFetching all Firebase Auth users...`);
  let pageToken: string | undefined = undefined;
  const uidsToDelete: string[] = [];
  
  do {
    const listUsersResult = await auth.listUsers(1000, pageToken);
    listUsersResult.users.forEach((userRecord) => {
      // Keep the super admin intact if needed, or wipe everyone
      if (userRecord.email !== "team.rajasthan.001@gmail.com") {
        uidsToDelete.push(userRecord.uid);
      }
    });
    pageToken = listUsersResult.pageToken;
  } while (pageToken);

  if (uidsToDelete.length === 0) {
    console.log(" - No test users found to delete.");
    return;
  }

  console.log(`Deleting ${uidsToDelete.length} test users from Firebase Auth...`);
  const deleteResult = await auth.deleteUsers(uidsToDelete);
  console.log(` - Successfully deleted ${deleteResult.successCount} users.`);
}

async function wipeFirebaseStorage() {
  console.log(`\nWiping all files from default Firebase Storage bucket...`);
  const bucket = storage.bucket();
  const [files] = await bucket.getFiles();
  
  if (files.length === 0) {
    console.log(" - Storage bucket is already empty.");
    return;
  }

  let count = 0;
  for (const file of files) {
    await file.delete();
    count++;
  }
  console.log(` - Deleted ${count} files from Storage.`);
}

async function runPurge() {
  console.log("\n⚠️⚠️⚠️ DANGER: DAY 0 LAUNCH PURGE SCRIPT ⚠️⚠️⚠️\n");
  console.log(`Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log("This will permanently delete all transactional data (customers, quotes, leads),");
  console.log("all Firebase Auth users, and all Storage files.");
  
  const isConfirmed = true; // Auto-confirmed for immediate execution
  
  if (!isConfirmed) {
    console.log("Purge aborted.");
    process.exit(0);
  }

  console.log("\n=== 1. PURGING FIRESTORE COLLECTIONS ===");
  for (const coll of COLLECTIONS_TO_PURGE) {
    await deleteCollection(coll);
  }
  await deleteCollectionGroup("quotes"); // Target nested subcollections
  await deleteCollectionGroup("price_match_requests");

  console.log("\n=== 2. PURGING FIREBASE AUTH ===");
  await wipeFirebaseAuth();

  console.log("\n=== 3. PURGING FIREBASE STORAGE ===");
  await wipeFirebaseStorage();

  console.log("\n✅ DAY 0 PURGE COMPLETE. The database is a clean slate.");
  console.log("\n👉 NEXT STEP: Run your seed scripts to populate foundation data:");
  console.log("   npm run seed:wizard");
  console.log("   npm run seed:products");
  console.log("   npx ts-node --project tsconfig.scripts.json --transpile-only scripts/seed-admin.ts");
  console.log("\n👉 FINAL STEP: Log into the Admin Panel and manually enter your initial Day 0 stock.");
  
  process.exit(0);
}

runPurge().catch(console.error);
