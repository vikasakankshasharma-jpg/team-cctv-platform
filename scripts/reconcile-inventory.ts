require("dotenv").config({ path: ".env.local" });
import { adminDb as db } from "../lib/firebase-admin";

async function runReconciliation() {
    console.log("Starting Inventory Reconciliation Check...");
    let discrepancies = 0;

    // 1. Fetch Inventory Master (The "Summary")
    const inventorySnap = await db.collection("inventory").get();
    
    for (const doc of inventorySnap.docs) {
        const item = doc.data();
        const skuId = doc.id;
        console.log(`\nChecking SKU: ${skuId} (${item.displayName})`);
        
        // 2. Fetch Stock Ledger (The "Source of Truth" for bulk quantities)
        const ledgerSnap = await db.collection("stock_ledger").where("skuId", "==", skuId).get();
        let derivedStock = 0;
        
        ledgerSnap.docs.forEach(lDoc => {
            const entry = lDoc.data();
            if (entry.type === "IN") derivedStock += entry.quantity;
            else if (entry.type === "OUT") derivedStock -= entry.quantity;
            else if (entry.type === "ADJUST_UP") derivedStock += entry.quantity;
            else if (entry.type === "ADJUST_DOWN") derivedStock -= entry.quantity;
        });
        
        // Compare Bulk Current Stock
        const currentStock = item.availableQty + (item.reservedQty || 0); // reserved stock is still physically in warehouse
        if (derivedStock !== currentStock) {
            console.error(`[MISMATCH] SKU ${skuId}: Master Stock = ${currentStock}, Ledger Derived = ${derivedStock}`);
            discrepancies++;
        } else {
            console.log(`[PASS] SKU ${skuId} Ledger matches Master Stock (${currentStock})`);
        }

        // 3. Fetch Serial Assets (The "Source of Truth" for serialized items)
        // If this item is serialized, the number of registered serials should exactly match the ledger INs/Adjustments
        const serialsSnap = await db.collection("serial_assets").where("skuId", "==", skuId).get();
        
        if (!serialsSnap.empty) {
            let inStock = 0;
            let reserved = 0;
            let installed = 0;
            let rma = 0;
            
            serialsSnap.docs.forEach(sDoc => {
                const s = sDoc.data();
                if (s.status === "IN_STOCK") inStock++;
                if (s.status === "RESERVED") reserved++;
                if (s.status === "INSTALLED") installed++;
                if (s.status === "RMA" || s.status === "RETIRED") rma++;
            });
            
            const totalRegistered = inStock + reserved + installed + rma;
            console.log(`  -> Serials breakdown: IN_STOCK(${inStock}), RESERVED(${reserved}), INSTALLED(${installed}), RMA(${rma}) | TOTAL: ${totalRegistered}`);
            
            // Reconcile Available Qty specifically for Serialized items
            if (item.availableQty !== inStock) {
                console.error(`[MISMATCH] SKU ${skuId}: Master AvailableQty (${item.availableQty}) !== Serial Assets IN_STOCK (${inStock})`);
                discrepancies++;
            }
            if ((item.reservedQty || 0) !== reserved) {
                 console.error(`[MISMATCH] SKU ${skuId}: Master ReservedQty (${item.reservedQty || 0}) !== Serial Assets RESERVED (${reserved})`);
                 discrepancies++;
            }
        }
    }
    
    console.log("\n=================================");
    if (discrepancies === 0) {
        console.log("✅ INVENTORY RECONCILIATION PASSED.");
    } else {
        console.error(`❌ RECONCILIATION FAILED. Found ${discrepancies} discrepancies.`);
    }
}

runReconciliation().catch(console.error);
