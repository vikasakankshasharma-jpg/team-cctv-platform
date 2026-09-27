import { adminDb, adminStorage } from "../lib/firebase-admin";

async function clearCollection(collectionPath: string) {
  const snapshot = await adminDb.collection(collectionPath).get();
  const batchSize = 500;
  
  if (snapshot.size === 0) {
    console.log(`- ${collectionPath} is already empty.`);
    return;
  }

  const batches = [];
  let currentBatch = adminDb.batch();
  let count = 0;

  snapshot.docs.forEach((doc) => {
    currentBatch.delete(doc.ref);
    count++;
    if (count % batchSize === 0) {
      batches.push(currentBatch.commit());
      currentBatch = adminDb.batch();
    }
  });

  if (count % batchSize !== 0) {
    batches.push(currentBatch.commit());
  }

  await Promise.all(batches);
  console.log(`✅ Cleared ${count} documents from ${collectionPath}.`);
}

async function clearStorageFolder(folderPrefix: string) {
  const bucket = adminStorage.bucket();
  const [files] = await bucket.getFiles({ prefix: folderPrefix });
  
  if (files.length === 0) {
    console.log(`- Storage folder /${folderPrefix} is already empty.`);
    return;
  }

  const deletePromises = files.map(file => file.delete());
  await Promise.all(deletePromises);
  console.log(`✅ Deleted ${files.length} files from Storage /${folderPrefix}.`);
}

async function wipeUATData() {
  console.log("⚠️ STARTING UAT DATA WIPE ⚠️");
  console.log("This will delete all test leads, jobs, quotes, and customers. Products and Admins will remain.");

  const collectionsToWipe = [
    "leads",
    "quotes",
    "jobs",
    "serial_assets",
    "warranty_certificates",
    "amc_subscriptions",
    "customers", // Specifically test customer profiles
    "installers", // Test installer profiles
    "salespersons" // Test sales profiles
  ];

  const storageFoldersToWipe = [
    "quotes/",
    "jobs/",
    "leads/"
  ];

  try {
    console.log("\n--- Clearing Firestore Collections ---");
    for (const col of collectionsToWipe) {
      await clearCollection(col);
    }
    
    console.log("\n--- Clearing Firebase Storage ---");
    for (const folder of storageFoldersToWipe) {
      await clearStorageFolder(folder);
    }
    
    // Note: We do NOT delete from Firebase Auth to avoid breaking real accounts,
    // but the Firestore profiles being gone means they will act as brand new users.
    
    console.log("\n🎉 UAT RESET COMPLETE! The system is clean for your first real customer.");
  } catch (error) {
    console.error("\n❌ Error during UAT reset:", error);
  }
}

wipeUATData().then(() => process.exit(0));
