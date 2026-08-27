import { adminDb } from "./firebase-admin";

export type BillingEligibility = "FREE_INSTALLATION_WARRANTY" | "FREE_PRODUCT_WARRANTY" | "AMC_COVERAGE" | "CHARGEABLE";

export async function evaluateServiceEligibility(
   customerId: string, 
   assetId?: string, 
   skuId?: string
): Promise<{ eligibility: BillingEligibility, reason: string, amcContractId?: string }> {
   
   const now = new Date();
   
   // 1. If physical asset is provided, check its snapshot warranty
   if (assetId) {
      const assetDoc = await adminDb.collection("serial_assets").doc(assetId).get();
      if (assetDoc.exists) {
         const asset = assetDoc.data()!;
         
         if (asset.installationWarrantyEndDate) {
            if (new Date(asset.installationWarrantyEndDate) >= now) {
               return { eligibility: "FREE_INSTALLATION_WARRANTY", reason: "Within 7-day installation warranty period." };
            }
         }
         
         if (asset.warrantyEndDate) {
            if (new Date(asset.warrantyEndDate) >= now) {
               return { eligibility: "FREE_PRODUCT_WARRANTY", reason: "Product is within active customer warranty." };
            }
         }
      }
   }
   
   // 2. If non-serialized SKU is provided, check customer warranty items
   if (skuId && !assetId) {
      const cwSnapshot = await adminDb.collection("customer_warranty_items")
         .where("customerId", "==", customerId)
         .where("skuId", "==", skuId)
         .get();
         
      if (!cwSnapshot.empty) {
         // Sort to find the latest valid coverage
         const items = cwSnapshot.docs.map(d => d.data());
         for (const item of items) {
             if (item.installationWarrantyEndDate && new Date(item.installationWarrantyEndDate) >= now) {
                return { eligibility: "FREE_INSTALLATION_WARRANTY", reason: "Within installation warranty period for non-serialized item." };
             }
             if (item.warrantyEndDate && new Date(item.warrantyEndDate) >= now) {
                return { eligibility: "FREE_PRODUCT_WARRANTY", reason: "Non-serialized item is within active customer warranty." };
             }
         }
      }
   }
   
   // 3. Fallback to AMC Contract check
   const amcSnapshot = await adminDb.collection("amc_contracts")
       .where("customerId", "==", customerId)
       .where("status", "==", "ACTIVE")
       .get();
       
   if (!amcSnapshot.empty) {
       const contracts = amcSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
       // Filter active by date
       const activeContract = contracts.find(c => new Date(c.startDate) <= now && new Date(c.endDate) >= now);
       
       if (activeContract) {
           if (activeContract.usedVisits < activeContract.includedVisits) {
               return { 
                  eligibility: "AMC_COVERAGE", 
                  reason: `Covered by AMC (${activeContract.planName}). Using 1 of remaining ${activeContract.includedVisits - activeContract.usedVisits} visits.`,
                  amcContractId: activeContract.id
               };
           }
       }
   }

   // 4. Default to Chargeable
   return { eligibility: "CHARGEABLE", reason: "Out of warranty and no active/available AMC coverage." };
}

