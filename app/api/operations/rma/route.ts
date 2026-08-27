import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit-logger";
import crypto from "crypto";
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "OPERATIONS"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const requestId = crypto.randomUUID();
    const actorRole = "OPERATIONS";
    const actorUid = "system_generated";
    const { oldSerialNumber, newSerialNumber, reason, customerId, performedBy = "System" } = body;
    
    if (!oldSerialNumber || !newSerialNumber || !reason) {
       return NextResponse.json({ success: false, message: "oldSerialNumber, newSerialNumber, and reason are required" }, { status: 400 });
    }

    let rmaId = "";

    await adminDb.runTransaction(async (transaction) => {
       // 1. Fetch Old Serial Asset
       const oldSnSnapshot = await transaction.get(adminDb.collection("serial_assets").where("serialNumber", "==", oldSerialNumber));
       if (oldSnSnapshot.empty) throw new Error(`Old Serial ${oldSerialNumber} not found`);
       const oldAssetDoc = oldSnSnapshot.docs[0];
       const oldAsset = oldAssetDoc.data();
       
       if (oldAsset.status !== "INSTALLED") {
          throw new Error(`Old Serial ${oldSerialNumber} is not INSTALLED (Current status: ${oldAsset.status})`);
       }
       if (customerId && oldAsset.customerId !== customerId) {
          throw new Error("Customer mismatch: Old asset does not belong to the requested customer.");
       }
       
       // 2. Fetch New Serial Asset
       const newSnSnapshot = await transaction.get(adminDb.collection("serial_assets").where("serialNumber", "==", newSerialNumber));
       if (newSnSnapshot.empty) throw new Error(`New Serial ${newSerialNumber} not found in inventory.`);
       const newAssetDoc = newSnSnapshot.docs[0];
       const newAsset = newAssetDoc.data();
       
       if (newAsset.status !== "IN_STOCK") {
          throw new Error(`New Serial ${newSerialNumber} is not available (Current status: ${newAsset.status})`);
       }
       if (newAsset.skuId !== oldAsset.skuId) {
          throw new Error(`SKU Mismatch: Cannot replace ${oldAsset.skuId} with ${newAsset.skuId}`);
       }
       
       // 3. Prevent duplicate RMA tracking by checking if old serial is already processed (covered by status check above)
       
       const timestamp = new Date().toISOString();
       const arrayUnion = admin.firestore.FieldValue.arrayUnion;

       // 4. Create RMA Ticket (Audit Trail)
       const rmaRef = adminDb.collection("rma_tickets").doc();
       rmaId = rmaRef.id;
       transaction.set(rmaRef, {
          id: rmaId,
          serviceTicketId: body.ticketId || null,
          oldSerialNumber,
          newSerialNumber,
          skuId: oldAsset.skuId,
          customerId: oldAsset.customerId || customerId || null,
          originalJobId: oldAsset.jobId || null,
          reason,
          status: "REPLACED",
          createdAt: timestamp,
          performedBy
       });
       
       // 5. Update Old Asset (Immutable history preserved)
       transaction.update(oldAssetDoc.ref, {
          status: "RMA",
          rmaTicketId: rmaId,
          replacedBy: newSerialNumber,
          auditTrail: arrayUnion({
             status: "RMA",
             timestamp,
             actor: performedBy,
             referenceId: body.ticketId || rmaId,
             notes: `RMA initiated via ticket ${body.ticketId || 'Manual'}. Reason: ${reason}. Replaced by ${newSerialNumber}`
          })
       });
       
       // 6. Update New Asset (Inheriting Customer & Warranty details)
       transaction.update(newAssetDoc.ref, {
          status: "INSTALLED",
          customerId: oldAsset.customerId,
          jobId: oldAsset.jobId,
          dealId: oldAsset.dealId,
          installedAt: timestamp, 
          // Inherit remaining warranty period of old asset
          warrantyStartDate: oldAsset.warrantyStartDate || timestamp,
          warrantyEndDate: oldAsset.warrantyEndDate || undefined,
          replacementOf: oldSerialNumber,
          rmaTicketId: rmaId,
          auditTrail: arrayUnion({
             status: "INSTALLED",
             timestamp,
             actor: performedBy,
             referenceId: rmaId,
             notes: `Installed as Warranty Replacement for ${oldSerialNumber}`
          })
       });
       
       // 7. Update Master Inventory (-1 available, representing the outgoing new unit)
       const invRef = adminDb.collection("inventory").doc(oldAsset.skuId);
       const invDoc = await transaction.get(invRef);
       if (invDoc.exists) {
           const currentAvailable = invDoc.data()!.availableQty;
           transaction.update(invRef, {
               availableQty: currentAvailable - 1
           });
       }
       
       // 8. Log OUT in Stock Ledger (Warranty Replacement)
       const ledgerRef = adminDb.collection("stock_ledger").doc();
       transaction.set(ledgerRef, {
           id: ledgerRef.id,
           skuId: oldAsset.skuId,
           type: "OUT",
           quantity: 1,
           referenceType: "RMA",
           referenceId: rmaId,
           timestamp,
           performedBy,
           notes: `RMA Warranty Replacement. Outgoing SN: ${newSerialNumber}`
       });

       // 9. Audit Log
       AuditLogger.logInTransaction(transaction, {
          actorUid,
          actorRole,
          action: "SERIAL_RMA",
          resourceType: "SERIAL_ASSET",
          resourceId: oldSerialNumber,
          customerId: oldAsset.customerId || customerId || null,
          afterSnapshot: { newSerialNumber },
          reason,
          requestId,
          timestamp,
          success: true
       });
    });

    return NextResponse.json({ success: true, message: "RMA Replacement processed successfully", rmaId });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
