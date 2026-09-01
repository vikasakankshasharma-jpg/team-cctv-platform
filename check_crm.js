const admin = require("firebase-admin");

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

async function checkCRMData() {
  const quoteId = "QT-2026-76800";
  
  console.log("=== CHECKING QUOTE STATUS ===");
  const quote = await db.collection("quotes").doc(quoteId).get();
  console.log(quote.data() ? `Status: ${quote.data().status}\nPaid At: ${quote.data().paid_at}\nJob ID: ${quote.data().job_id}` : "Quote not found");
  
  console.log("\n=== CHECKING JOB DISPATCH TICKET ===");
  const jobs = await db.collection("jobs").where("quote_id", "==", quoteId).get();
  if (jobs.empty) {
    console.log("No jobs found.");
  } else {
    jobs.forEach(doc => {
      const j = doc.data();
      console.log(`Job ID: ${j.id}`);
      console.log(`Status: ${j.status}`);
      console.log(`Type: ${j.type}`);
    });
  }

  console.log("\n=== CHECKING INVENTORY LEDGER ===");
  const ledger = await db.collection("inventory_ledger").where("reference_entity_id", "==", quoteId).get();
  if (ledger.empty) {
    console.log("No ledger entries found.");
  } else {
    ledger.forEach(doc => {
      const l = doc.data();
      console.log(`${l.type.toUpperCase()}: ${l.qty}x ${l.product_id} (Ref: ${l.reference_entity_id})`);
    });
  }

  process.exit(0);
}

checkCRMData();
