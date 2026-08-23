import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const { adminDb } = await import("../lib/firebase-admin");
  console.log("Fetching...");
  try {
    const snap = await adminDb.collection("products").limit(1).get();
    console.log("Success! Found:", snap.size);
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run().catch(console.error);
