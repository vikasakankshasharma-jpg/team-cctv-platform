import "dotenv/config";
import { adminDb } from "./lib/firebase-admin";

async function fix() {
  const snap = await adminDb.collection("products").where("environment", "==", "staging").get();
  const batch = adminDb.batch();
  snap.docs.forEach(d => {
    const data = d.data();
    if (data.mrp && !data.unit_price) {
      batch.update(d.ref, { unit_price: Math.round(data.mrp * 0.8) });
    }
  });
  await batch.commit();
  console.log("Fixed prices!");
}
fix();
