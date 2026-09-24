const admin = require('firebase-admin');

// Initialize Firebase Admin (Uses default credential if running locally with Google Cloud CLI, 
// or requires service account. We'll use the existing .env or credential path if needed.
// Since this is a local script, we will just provide the boilerplate for the user to run).
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();
  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

async function nukeDatabase() {
  console.log("🚀 INITIATING DAY-0 FACTORY RESET...");
  
  const collectionsToWipe = [
    "leads",
    "quotes",
    "payments",
    "warranties",
    "support_tickets",
    "site_surveys",
    "feedbacks",
    "lead_timeline"
  ];

  for (const coll of collectionsToWipe) {
    console.log(`🗑️ Wiping collection: ${coll}...`);
    await deleteCollection(coll);
    console.log(`✅ Cleared ${coll}.`);
  }

  // Also clear the 9999999999 test user from Firebase Auth
  try {
    const user = await admin.auth().getUserByPhoneNumber("+919999999999");
    await admin.auth().deleteUser(user.uid);
    console.log("✅ Cleared Test User from Auth.");
  } catch (e) {
    // User might not exist
  }

  console.log("🎉 FACTORY RESET COMPLETE. The platform is ready for public launch!");
  process.exit(0);
}

nukeDatabase();
