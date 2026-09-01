const admin = require('firebase-admin');
const fs = require('fs');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

async function clearDummyData() {
  console.log("Starting data wipe...");
  const leadsSnapshot = await db.collection('leads').get();
  
  if (leadsSnapshot.empty) {
    console.log("No leads found.");
    return;
  }
  
  const batch = db.batch();
  let count = 0;
  
  leadsSnapshot.forEach((doc) => {
    // Only delete leads that seem like test data, or just delete all
    batch.delete(doc.ref);
    count++;
  });
  
  await batch.commit();
  console.log(`Successfully deleted ${count} leads.`);
  process.exit(0);
}

clearDummyData().catch(console.error);
