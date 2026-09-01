const admin = require('firebase-admin');

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
  console.log("Starting quotes wipe...");
  const quotesSnapshot = await db.collection('quotes').get();
  
  if (quotesSnapshot.empty) {
    console.log("No quotes found.");
    return;
  }
  
  const batch = db.batch();
  let count = 0;
  
  quotesSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
    count++;
    if(count === 490) {
      console.log("Max batch size reached");
    }
  });
  
  await batch.commit();
  console.log(`Successfully deleted ${count} quotes.`);
  process.exit(0);
}

clearDummyData().catch(console.error);
