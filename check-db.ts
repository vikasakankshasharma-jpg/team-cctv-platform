import { adminDb } from "./lib/firebase-admin";

async function check() {
  const doc = await adminDb.collection('pincode_cache').doc('302001').get();
  console.log("EXISTS:", doc.exists);
  if (doc.exists) {
    console.log("DATA:", JSON.stringify(doc.data(), null, 2));
  }
}

check().catch(console.error);
