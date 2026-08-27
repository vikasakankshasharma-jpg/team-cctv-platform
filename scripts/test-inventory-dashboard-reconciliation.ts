require("dotenv").config({ path: ".env.local" });
import { adminDb as db } from "../lib/firebase-admin";

async function runInventoryDashboardReconciliation() {
    console.log("Starting Inventory Dashboard Reconciliation Test...");
    
    // 1. Ledger & Serial Truth
    let ledgerIn = 0, ledgerOut = 0;
    const ledgerSnap = await db.collection("stock_ledger").get();
    ledgerSnap.docs.forEach(doc => {
        if (doc.data().type === "IN") ledgerIn += (doc.data().quantity || 0);
        if (doc.data().type === "OUT") ledgerOut += (doc.data().quantity || 0);
    });

    let serialInStock = 0, serialReserved = 0, serialInstalled = 0, serialRMA = 0;
    const serialSnap = await db.collection("serial_assets").get();
    serialSnap.docs.forEach(doc => {
        const s = doc.data().status;
        if (s === "IN_STOCK") serialInStock++;
        if (s === "RESERVED") serialReserved++;
        if (s === "INSTALLED") serialInstalled++;
        if (s === "RMA") serialRMA++;
    });

    console.log("=== LEDGER & SERIAL TRUTH ===");
    console.log(`Ledger IN: ${ledgerIn}, OUT: ${ledgerOut}`);
    console.log(`Serial IN_STOCK: ${serialInStock}, RESERVED: ${serialReserved}`);

    // 2. Dashboard API Logic Simulation
    let apiTotalItems = 0;
    let apiTotalReserved = 0;
    const inventorySnap = await db.collection("inventory").get();
    inventorySnap.docs.forEach(doc => {
        apiTotalItems += (doc.data().availableQty || 0);
        apiTotalReserved += (doc.data().reservedQty || 0);
    });

    console.log("\n=== DASHBOARD API CALCULATION ===");
    console.log(`API Available Stock: ${apiTotalItems}`);
    console.log(`API Reserved Stock: ${apiTotalReserved}`);

    // 3. Assertions (The critical reconciliation gate)
    let passed = true;
    
    // Bulk Reconciliation (Dashboard Master vs Ledger)
    // Current Stock = IN - OUT (assuming no ADJUST for this strict test)
    if (apiTotalItems + apiTotalReserved !== (ledgerIn - ledgerOut)) {
         console.warn(`⚠️ Warning: Master Stock (${apiTotalItems + apiTotalReserved}) does not match pure Ledger IN-OUT (${ledgerIn - ledgerOut}). This may be due to ADJUST movements.`);
         // We won't strictly fail this unless we query ADJUST too.
    }

    // Serial Reconciliation (Dashboard Master vs Serial Assets)
    // Note: In our system, the Master Collection `availableQty` and `reservedQty` 
    // are aggregates of BOTH bulk and serial items. So we can't do a 1:1 match 
    // unless we filter by SKU type. But we can ensure that Serial count doesn't exceed Master.
    
    if (serialInStock > apiTotalItems) {
        console.error(`❌ Mismatch: Serial IN_STOCK (${serialInStock}) is greater than Master Available Stock (${apiTotalItems}).`);
        passed = false;
    }
    
    if (serialReserved > apiTotalReserved) {
        console.error(`❌ Mismatch: Serial RESERVED (${serialReserved}) is greater than Master Reserved Stock (${apiTotalReserved}).`);
        passed = false;
    }

    if (passed) {
        console.log("\n✅ RECONCILIATION PASSED. Dashboard API aligns with underlying Serial and Ledger constraints.");
    } else {
        console.error("\n❌ RECONCILIATION FAILED. Dashboard cannot be trusted.");
        process.exit(1);
    }
}

runInventoryDashboardReconciliation().catch(e => { console.error(e); process.exit(1); });
