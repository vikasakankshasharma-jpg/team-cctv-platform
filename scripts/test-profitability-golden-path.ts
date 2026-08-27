require("dotenv").config({ path: ".env.local" });
import { adminDb as db } from "../lib/firebase-admin";
import { calculateDealProfitability } from "../lib/profitability-engine";

async function runGoldenPath() {
    console.log("Starting Profitability Golden Path E2E Verification...");
    
    // Test Scenario: Find a deal with an Invoice AND a Warranty Job
    const dealsSnap = await db.collection("deals").limit(20).get();
    let targetDealId = null;
    
    // In a real E2E we would MINT this entire chain from scratch. 
    // Here we will mock an idealized data structure for a Deal to verify the calculation engine logic.
    const mockDealId = "DEAL-PROFIT-TEST";
    
    await db.runTransaction(async (t) => {
        // 1. Mock Invoice (Revenue: 100,000)
        t.set(db.collection("invoices").doc(`INV-${mockDealId}`), {
            dealId: mockDealId,
            status: "PAID",
            totalAmount: 100000,
            createdAt: new Date().toISOString()
        });
        
        // 2. Mock Serial Asset (Purchase Cost: 60,000)
        t.set(db.collection("serial_assets").doc(`SN-${mockDealId}`), {
            dealId: mockDealId,
            status: "INSTALLED",
            unitPurchaseCost: 60000
        });
        
        // 3. Mock Installation Job (Labour: 5,000)
        t.set(db.collection("jobs").doc(`JOB-INST-${mockDealId}`), {
            dealId: mockDealId,
            status: "COMPLETED",
            type: "INSTALLATION",
            labourCost: 5000
        });
        
        // 4. Mock Warranty Job (Labour: 2,000)
        t.set(db.collection("jobs").doc(`JOB-WAR-${mockDealId}`), {
            dealId: mockDealId,
            status: "COMPLETED",
            type: "WARRANTY_SERVICE",
            labourCost: 2000
        });
        
        // 5. Mock Ledger OUT (Warranty Parts: 1,500)
        t.set(db.collection("stock_ledger").doc(`LDG-WAR-${mockDealId}`), {
            referenceId: `JOB-WAR-${mockDealId}`,
            referenceType: "JOB",
            type: "OUT",
            unitCost: 1500,
            quantity: 1
        });
    });

    console.log(`Mock Deal ${mockDealId} created. Running Profitability Engine...`);
    
    const result = await calculateDealProfitability(mockDealId, "2026-08");
    
    const expectedRevenue = 100000;
    const expectedTotalCost = 60000 + 5000 + 2000 + 1500; // 68500
    const expectedGrossProfit = 31500;
    
    console.log("Calculated Result:", JSON.stringify(result, null, 2));
    
    if (result.revenue === expectedRevenue && result.grossProfit === expectedGrossProfit) {
        console.log("✅ GOLDEN PATH PASSED. Profitability Engine correctly traverses the transaction ledger.");
    } else {
        console.error(`❌ GOLDEN PATH FAILED. Expected Profit: ${expectedGrossProfit}, Got: ${result.grossProfit}`);
    }
    
    // Cleanup
    await db.collection("invoices").doc(`INV-${mockDealId}`).delete();
    await db.collection("serial_assets").doc(`SN-${mockDealId}`).delete();
    await db.collection("jobs").doc(`JOB-INST-${mockDealId}`).delete();
    await db.collection("jobs").doc(`JOB-WAR-${mockDealId}`).delete();
    await db.collection("stock_ledger").doc(`LDG-WAR-${mockDealId}`).delete();
}

runGoldenPath().catch(e => { console.error(e); process.exit(1); });
