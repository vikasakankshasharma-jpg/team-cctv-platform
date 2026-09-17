const admin = require("firebase-admin");
require("dotenv").config({ path: ".env.local" });

if (!admin.apps.length) {
  if (process.env.FIREBASE_PRIVATE_KEY) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    admin.initializeApp();
  }
}

async function run() {
  try {
    const db = admin.firestore();
    
    const admins = await db.collection("admins").get();
    console.log("Admins:");
    admins.docs.forEach(d => console.log(d.id, d.data().mobile_number, d.data().is_active));
    
    const sales = await db.collection("salespeople").get();
    console.log("\nSalespeople:");
    sales.docs.forEach(d => console.log(d.id, d.data().mobile_number, d.data().is_active));
    
    const installers = await db.collection("installers").get();
    console.log("\nInstallers:");
    installers.docs.forEach(d => console.log(d.id, d.data().mobile_number, d.data().status));
    
    const promoters = await db.collection("promoters").get();
    console.log("\nPromoters:");
    promoters.docs.forEach(d => console.log(d.id, d.data().mobile_number, d.data().status));
  } catch (e) {
    console.error(e);
  }
}
run();
