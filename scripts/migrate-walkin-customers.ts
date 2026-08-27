import * as admin from "firebase-admin";

const serviceAccount = require("../service-account.json"); // Assuming they have it

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function migrate() {
    console.log("Starting Migration: Converting 'walk-in' to distinct Customers...");
    
    // 1. Find all deals with 'walk-in'
    const dealsSnap = await db.collection("deals").where("customerId", "==", "walk-in").get();
    console.log(`Found ${dealsSnap.size} deals with 'walk-in' customerId`);
    
    for (const dealDoc of dealsSnap.docs) {
        const deal = dealDoc.data();
        
        // Check if we can identify the customer by phone
        if (deal.customerMobile && deal.customerMobile !== "0000000000") {
            const custSnap = await db.collection("customers").where("phone", "==", deal.customerMobile).get();
            let customerId = "";
            
            if (!custSnap.empty) {
                customerId = custSnap.docs[0].id;
            } else {
                customerId = `CUST-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
                await db.collection("customers").doc(customerId).set({
                    id: customerId,
                    authUid: null,
                    name: deal.customerName || "Unknown",
                    phone: deal.customerMobile,
                    type: "WALK_IN",
                    createdAt: new Date().toISOString(),
                    migrationNote: "Auto-migrated from walk-in deal"
                });
            }
            
            console.log(`Migrating Deal ${dealDoc.id} to Customer ${customerId}`);
            await dealDoc.ref.update({ customerId });
            
            // Migrate down-stream records (Jobs, Assets, Invoices, AMC)
            await migrateDownstream(dealDoc.id, customerId);
            
        } else {
            console.warn(`[DATA_MIGRATION_REVIEW] Deal ${dealDoc.id} has no valid mobile number. Added to review queue.`);
            await db.collection("data_migration_review").add({
                type: "AMBIGUOUS_CUSTOMER",
                resourceType: "DEAL",
                resourceId: dealDoc.id,
                dealData: deal
            });
        }
    }
    
    console.log("Migration Complete.");
}

async function migrateDownstream(dealId: string, customerId: string) {
    const batch = db.batch();
    
    // Jobs
    const jobsSnap = await db.collection("jobs").where("dealId", "==", dealId).get();
    jobsSnap.docs.forEach(d => batch.update(d.ref, { customerId }));
    
    // Assets
    const assetsSnap = await db.collection("serial_assets").where("dealId", "==", dealId).get();
    assetsSnap.docs.forEach(d => batch.update(d.ref, { customerId }));
    
    // Invoices
    const invoicesSnap = await db.collection("invoices").where("dealId", "==", dealId).get();
    invoicesSnap.docs.forEach(d => batch.update(d.ref, { customerId }));
    
    // AMC Contracts
    const amcSnap = await db.collection("amc_contracts").where("dealId", "==", dealId).get();
    amcSnap.docs.forEach(d => batch.update(d.ref, { customerId }));
    
    await batch.commit();
}

migrate().catch(console.error);
