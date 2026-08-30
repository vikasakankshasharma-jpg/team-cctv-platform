import { adminDb } from "./firebase-admin";
import { InventoryItem, InventoryLedgerEntry } from "@/types";

export interface StockDeductionRequest {
  product_id: string;
  qty: number;
}

export class InventoryEngine {
  /**
   * Deducts stock for a list of items atomically within an existing Firestore transaction.
   * Enforces "No partial deduction" - if any item is out of stock, the entire stock deduction fails (returns false),
   * but it DOES NOT throw an error, allowing the caller (e.g. Payment Webhook) to proceed and mark the Job as backordered.
   * 
   * Note: Firestore transactions require all reads before all writes.
   * 
   * @param transaction The active Firestore transaction.
   * @param items The items to deduct.
   * @param reference_id The Job, Invoice, or ChangeOrder ID.
   * @param reference_type The type of the reference entity.
   * @returns { success: boolean, insufficientItems?: string[] }
   */
  static async attemptDeduction(
    transaction: FirebaseFirestore.Transaction,
    items: StockDeductionRequest[],
    reference_id: string,
    reference_type: "job" | "invoice" | "change_order"
  ): Promise<{ success: boolean; insufficientItems?: string[] }> {
    
    // Group identical product IDs and ignore non-hardware items (like labor/surcharges)
    const deductionMap = new Map<string, number>();
    for (const item of items) {
      if (item.product_id.startsWith("labor_") || item.product_id.startsWith("surcharge_")) continue;
      
      const current = deductionMap.get(item.product_id) || 0;
      deductionMap.set(item.product_id, current + item.qty);
    }

    const uniqueProductIds = Array.from(deductionMap.keys());
    if (uniqueProductIds.length === 0) {
      return { success: true }; // Nothing to deduct (e.g. only labor)
    }

    // --- PHASE 1: READS ---
    const inventoryDocs = new Map<string, FirebaseFirestore.DocumentSnapshot>();
    for (const pid of uniqueProductIds) {
      const ref = adminDb.collection("inventory").doc(pid);
      const doc = await transaction.get(ref);
      inventoryDocs.set(pid, doc);
    }

    // --- PHASE 2: VALIDATION (No side-effects yet) ---
    const insufficientItems: string[] = [];
    
    for (const pid of uniqueProductIds) {
      const requiredQty = deductionMap.get(pid)!;
      const doc = inventoryDocs.get(pid);
      
      let available = 0;
      if (doc && doc.exists) {
        const data = doc.data() as InventoryItem;
        available = data.available_stock;
      }

      if (available < requiredQty) {
        insufficientItems.push(pid);
      }
    }

    // Atomic Failure: No partial deduction
    if (insufficientItems.length > 0) {
      return { success: false, insufficientItems };
    }

    // --- PHASE 3: WRITES ---
    const now = new Date().toISOString();
    
    for (const pid of uniqueProductIds) {
      const requiredQty = deductionMap.get(pid)!;
      const doc = inventoryDocs.get(pid)!;
      const invRef = adminDb.collection("inventory").doc(pid);
      
      // Calculate new stock
      let newTotal = 0;
      let newAvailable = 0;
      let newReserved = 0;

      if (doc.exists) {
         const data = doc.data() as InventoryItem;
         newTotal = data.total_stock - requiredQty;
         newReserved = data.reserved_stock;
         newAvailable = newTotal - newReserved;
      } else {
         // Should realistically never happen since validation would catch available < requiredQty,
         // but written for type safety.
         throw new Error("Critical Inventory Integrity Error");
      }

      // Update Inventory Item
      transaction.update(invRef, {
        total_stock: newTotal,
        available_stock: newAvailable,
        last_updated: now
      });

      // Write Ledger Entry (Immutable Log)
      const ledgerRef = adminDb.collection("inventory_ledger").doc();
      const ledgerEntry: InventoryLedgerEntry = {
        id: ledgerRef.id,
        product_id: pid,
        qty: -requiredQty, // Negative for consumption
        type: "consumption",
        reference_entity_id: reference_id,
        reference_entity_type: reference_type,
        created_at: now
      };
      transaction.set(ledgerRef, ledgerEntry);
    }

    return { success: true };
  }

  /**
   * Reverses an inventory deduction atomically. Used for Refunds/Cancellations.
   */
  static async reverseDeduction(
    transaction: FirebaseFirestore.Transaction,
    items: StockDeductionRequest[],
    reference_id: string, // The ID of the cancellation/refund event
    reference_type: "manual" | "job"
  ): Promise<void> {
    
    const deductionMap = new Map<string, number>();
    for (const item of items) {
      if (item.product_id.startsWith("labor_") || item.product_id.startsWith("surcharge_")) continue;
      const current = deductionMap.get(item.product_id) || 0;
      deductionMap.set(item.product_id, current + item.qty);
    }

    const uniqueProductIds = Array.from(deductionMap.keys());
    if (uniqueProductIds.length === 0) return;

    // --- READS ---
    const inventoryDocs = new Map<string, FirebaseFirestore.DocumentSnapshot>();
    for (const pid of uniqueProductIds) {
      const ref = adminDb.collection("inventory").doc(pid);
      const doc = await transaction.get(ref);
      inventoryDocs.set(pid, doc);
    }

    // --- WRITES ---
    const now = new Date().toISOString();
    
    for (const pid of uniqueProductIds) {
      const returnedQty = deductionMap.get(pid)!;
      const doc = inventoryDocs.get(pid)!;
      const invRef = adminDb.collection("inventory").doc(pid);
      
      let newTotal = returnedQty;
      let newAvailable = returnedQty;
      let newReserved = 0;

      if (doc.exists) {
         const data = doc.data() as InventoryItem;
         newTotal = data.total_stock + returnedQty;
         newReserved = data.reserved_stock;
         newAvailable = newTotal - newReserved;
         
         transaction.update(invRef, {
           total_stock: newTotal,
           available_stock: newAvailable,
           last_updated: now
         });
      } else {
         const newItem: InventoryItem = {
            id: pid,
            total_stock: returnedQty,
            available_stock: returnedQty,
            reserved_stock: 0,
            last_updated: now
         };
         transaction.set(invRef, newItem);
      }

      // Write Ledger Entry (Immutable Log for Reversal)
      const ledgerRef = adminDb.collection("inventory_ledger").doc();
      const ledgerEntry: InventoryLedgerEntry = {
        id: ledgerRef.id,
        product_id: pid,
        qty: returnedQty, // Positive for reversal/returns
        type: "reversal",
        reference_entity_id: reference_id,
        reference_entity_type: reference_type,
        created_at: now
      };
      transaction.set(ledgerRef, ledgerEntry);
    }
  }
}
