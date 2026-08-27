import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
const app = initializeApp({
  projectId: "team-cctv-dr-drill",
  apiKey: "mock-api-key-for-client-sdk"
});
const db = getFirestore(app, "default");
async function run() {
  console.log("=== SECURITY SMOKE TESTS ===");
  try {
    await setDoc(doc(db, "inventory", "hack-sku"), { qty: 9999 });
    console.log("FAIL: Client inventory mutation allowed!");
  } catch (e: any) {
    if (e.code === "permission-denied") {
      console.log("[PASS] Client inventory mutation -> Permission Denied");
    } else {
      console.log("ERROR: Client inventory mutation -> " + e.code);
    }
  }
  try {
    await getDoc(doc(db, "customers", "CUST-OTHER"));
    console.log("FAIL: Cross-customer access allowed!");
  } catch (e: any) {
    if (e.code === "permission-denied") {
      console.log("[PASS] Cross-customer read -> Permission Denied (403)");
    } else {
      console.log("ERROR: Cross-customer read -> " + e.code);
    }
  }
  process.exit(0);
}
run().catch(console.error);
