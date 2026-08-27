import * as admin from "firebase-admin";
import { AuditLogger } from "../lib/audit-logger";

const serviceAccount = require("../service-account.json"); 
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function runNegativeTest() {
    console.log("Starting Negative Transaction Audit Test...");
    
    const dummyPoId = "PO-FAIL-TEST";
    const dummySku = "SKU-FAIL-TEST";
    
    try {
        await db.runTransaction(async (transaction) => {
             // 1. Simulate Business Mutation
             const poRef = db.collection("purchase_orders").doc(dummyPoId);
             transaction.set(poRef, { status: "TEST" });
             
             // 2. Simulate Audit Log via AuditLogger
             AuditLogger.logInTransaction(transaction, {
                actorUid: "test",
                actorRole: "ADMIN",
                action: "INVENTORY_RECEIVE",
                resourceType: "PO",
                resourceId: dummyPoId,
                requestId: "REQ-FAIL-TEST",
                timestamp: new Date().toISOString(),
                success: true
             });
             
             // 3. INTENTIONAL FAILURE
             console.log("Forcing transaction to fail by throwing an Error...");
             throw new Error("INTENTIONAL_TRANSACTION_FAILURE");
        });
    } catch (e: any) {
        console.log("Caught expected error:", e.message);
    }
    
    // Verify rollback
    const poDoc = await db.collection("purchase_orders").doc(dummyPoId).get();
    const auditSnap = await db.collection("audit_logs").where("requestId", "==", "REQ-FAIL-TEST").get();
    
    if (!poDoc.exists && auditSnap.empty) {
        console.log("✅ NEGATIVE TEST PASSED: Both business write and audit log were rolled back.");
    } else {
        console.error("❌ NEGATIVE TEST FAILED: Orphaned records found!");
        if (poDoc.exists) console.error(" - Business record (PO) persisted.");
        if (!auditSnap.empty) console.error(" - Audit log persisted.");
    }
}

runNegativeTest().catch(console.error);
