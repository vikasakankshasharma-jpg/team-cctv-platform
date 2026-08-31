import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

async function check() {
  const allProds = await db.collection("products").get();
  console.log("Total Products:", allProds.docs.length);

  const eligProds = await db.collection("products").where("is_quotation_eligible", "==", true).get();
  console.log("Quotation Eligible Products:", eligProds.docs.length);
  
  if (eligProds.docs.length > 0) {
    console.log("Sample eligible:", eligProds.docs[0].data().display_name);
  } else if (allProds.docs.length > 0) {
    console.log("Sample product:", allProds.docs[0].data());
  }
}
check();
