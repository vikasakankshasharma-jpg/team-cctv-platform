import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const invSnapshot = await adminDb.collection("inventory").get();
    const ledgerSnapshot = await adminDb.collection("stock_ledger").get();
    
    const inventory = invSnapshot.docs.map(d => d.data());
    const ledger = ledgerSnapshot.docs.map(d => d.data());
    
    const issues: any[] = [];
    let checkedCount = 0;

    for (const item of inventory) {
      checkedCount++;
      const skuLedger = ledger.filter(l => l.skuId === item.id);
      
      let calcAvailable = 0;
      let calcReserved = 0;
      
      for (const entry of skuLedger) {
         if (entry.type === "IN" || entry.type === "ADJUST") {
            calcAvailable += entry.quantity;
         } else if (entry.type === "OUT") {
            calcAvailable -= entry.quantity;
         } else if (entry.type === "RESERVE") {
            calcAvailable -= entry.quantity;
            calcReserved += entry.quantity;
         } else if (entry.type === "RELEASE") {
            calcAvailable += entry.quantity;
            calcReserved -= entry.quantity;
         }
      }
      
      if (item.availableQty !== calcAvailable || item.reservedQty !== calcReserved) {
         issues.push({
            skuId: item.id,
            displayName: item.displayName,
            masterAvailable: item.availableQty,
            ledgerAvailable: calcAvailable,
            masterReserved: item.reservedQty,
            ledgerReserved: calcReserved
         });
      }
    }
    
    return NextResponse.json({ 
       success: true, 
       skusChecked: checkedCount,
       issuesFound: issues.length,
       issues 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
