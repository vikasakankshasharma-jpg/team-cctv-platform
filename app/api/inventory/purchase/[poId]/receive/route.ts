import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { AuditLogger } from "@/lib/audit-logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ poId: string }> }
) {
  try {
    const { poId } = await params;
    const body = await request.json(); 
    const { receivedItems, performedBy = "Admin" } = body;
    const requestId = `REQ-${Date.now()}`;
    const actorUid = "system_generated"; // In real usage, extracted from session
    const actorRole = "OPERATIONS";
    const timestamp = new Date().toISOString();

    const poRef = adminDb.collection("purchase_orders").doc(poId);

    await adminDb.runTransaction(async (transaction) => {
       const poDoc = await transaction.get(poRef);
       if (!poDoc.exists) {
          throw new Error("PO not found");
       }
       
       const po = poDoc.data()!;
       if (po.status === "RECEIVED") {
          throw new Error("PO already fully received"); // Idempotency Guard
       }
       
       const updatedItems = [];
       for (const item of po.items) {
          const received = receivedItems.find((r: any) => r.skuId === item.skuId);
          if (received && received.qty > 0) {
             const newReceivedQty = (item.receivedQty || 0) + received.qty;
             if (newReceivedQty > item.orderedQty) {
                throw new Error(`Cannot receive more than ordered for ${item.skuId}`);
             }
             
             // Phase 10: Serial Registration
             const isSerialized = item.isSerialized === true; // Assume Catalog populates this to PO, or fetch Product Master if needed
             const providedSerials = received.serials || [];
             
             if (isSerialized) {
                if (providedSerials.length !== received.qty) {
                   throw new Error(`SKU ${item.skuId} is serialized. Expected ${received.qty} serial numbers, got ${providedSerials.length}`);
                }
                
                // Duplicate check in payload
                const uniqueSerials = new Set(providedSerials);
                if (uniqueSerials.size !== providedSerials.length) {
                   throw new Error(`Duplicate serial numbers found in payload for ${item.skuId}`);
                }
                
                // Duplicate check in DB
                for (const sn of providedSerials) {
                   const existingSn = await transaction.get(adminDb.collection("serial_assets").where("serialNumber", "==", sn));
                   if (!existingSn.empty) {
                      throw new Error(`Serial Number ${sn} already exists in the system!`);
                   }
                }
                
                // Create SerialAssets
                for (const sn of providedSerials) {
                   const serialRef = adminDb.collection("serial_assets").doc();
                   transaction.set(serialRef, {
                      id: serialRef.id,
                      serialNumber: sn,
                      skuId: item.skuId,
                      productName: item.displayName,
                      status: "IN_STOCK",
                      purchaseOrderId: poId,
                      receivedAt: timestamp,
                      auditTrail: [{
                         status: "IN_STOCK",
                         timestamp,
                         actor: performedBy,
                         referenceId: poId,
                         notes: "Received from Supplier"
                      }]
                   });
                }
             }
             
             // 1. Read Inventory Master
             const inventoryRef = adminDb.collection("inventory").doc(item.skuId);
             const invDoc = await transaction.get(inventoryRef);
             
             if (invDoc.exists) {
                const currentAvail = invDoc.data()!.availableQty || 0;
                transaction.update(inventoryRef, {
                   availableQty: currentAvail + received.qty,
                   lastRestockedDate: timestamp
                });
             } else {
                transaction.set(inventoryRef, {
                   id: item.skuId,
                   displayName: item.displayName,
                   availableQty: received.qty,
                   reservedQty: 0,
                   lastRestockedDate: timestamp
                });
             }
             
             // 2. Create Stock Ledger Entry (IN)
             const ledgerRef = adminDb.collection("stock_ledger").doc();
             transaction.set(ledgerRef, {
                id: ledgerRef.id,
                skuId: item.skuId,
                type: "IN",
                quantity: received.qty,
                referenceType: "PURCHASE_ORDER",
                referenceId: poId,
                timestamp,
                performedBy,
                notes: `Received from PO ${poId}` + (isSerialized ? ` (Serials attached)` : ``)
             });

             // 3. Attach Audit Log inside transaction
             AuditLogger.logInTransaction(transaction, {
                actorUid,
                actorRole,
                action: "INVENTORY_RECEIVE",
                resourceType: "PURCHASE_ORDER_ITEM",
                resourceId: `${poId}_${item.skuId}`,
                afterSnapshot: { skuId: item.skuId, qty: received.qty },
                reason: `PO Receive: ${poId}`,
                requestId,
                timestamp,
                success: true
             });
             
             updatedItems.push({ ...item, receivedQty: newReceivedQty });
          } else {
             updatedItems.push(item);
          }
       }

       // Check if fully received
       const isFullyReceived = updatedItems.every((i: any) => i.receivedQty >= i.orderedQty);
       
       transaction.update(poRef, {
          items: updatedItems,
          status: isFullyReceived ? "RECEIVED" : "PARTIAL_RECEIVED"
       });
    });

    return NextResponse.json({ success: true, message: "PO Received and Inventory Updated (Atomic)" });
  } catch (error: any) {
    console.error("PO Receive Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
