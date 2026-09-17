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
    
    // Add primary admin number
    await db.collection("admins").doc("vikasakankshasharma@gmail.com").set({
      mobile_number: "9587980007",
      is_active: true,
      role: "super_admin",
      name: "Vikas Sharma"
    }, { merge: true });

    // Add secondary admin number just in case
    await db.collection("admins").doc("vikas_mobile2").set({
      mobile_number: "9772699395",
      is_active: true,
      role: "super_admin",
      name: "Vikas Sharma (Mobile 2)"
    }, { merge: true });

    console.log("Admin phone numbers successfully registered!");
  } catch (e) {
    console.error(e);
  }
}
run();
