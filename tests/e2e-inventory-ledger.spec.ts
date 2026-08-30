import { test, expect } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';
import { InventoryEngine } from '../lib/inventory-engine';

test.describe.serial('Phase 3: Inventory Ledger API (Production Readiness)', () => {

  const productId1 = `PROD-INV-A-${Date.now()}`;
  const productId2 = `PROD-INV-B-${Date.now()}`;
  const invoiceId = `INV-MOCK-${Date.now()}`;

  test.beforeAll(async () => {
    // Seed Inventory
    await adminDb.collection("inventory").doc(productId1).set({
      id: productId1,
      total_stock: 10,
      available_stock: 10,
      reserved_stock: 0,
      last_updated: new Date().toISOString()
    });

    await adminDb.collection("inventory").doc(productId2).set({
      id: productId2,
      total_stock: 2,
      available_stock: 2,
      reserved_stock: 0,
      last_updated: new Date().toISOString()
    });
  });

  test('1. Successful Atomic Deduction & Ledger Generation', async () => {
    
    // Perform deduction
    const result = await adminDb.runTransaction(async (t) => {
      return await InventoryEngine.attemptDeduction(
        t,
        [
          { product_id: productId1, qty: 3 },
          { product_id: productId2, qty: 1 }
        ],
        invoiceId,
        "invoice"
      );
    });

    expect(result.success).toBe(true);
    
    // Verify Product 1 Stock
    const doc1 = await adminDb.collection("inventory").doc(productId1).get();
    expect(doc1.data()?.total_stock).toBe(7);
    expect(doc1.data()?.available_stock).toBe(7);

    // Verify Product 2 Stock
    const doc2 = await adminDb.collection("inventory").doc(productId2).get();
    expect(doc2.data()?.total_stock).toBe(1);
    expect(doc2.data()?.available_stock).toBe(1);

    // Verify Ledger Entries
    const ledgerSnap = await adminDb.collection("inventory_ledger")
      .where("reference_entity_id", "==", invoiceId)
      .where("type", "==", "consumption")
      .get();
    
    expect(ledgerSnap.size).toBe(2);
    const entries = ledgerSnap.docs.map(d => d.data());
    const prod1Entry = entries.find(e => e.product_id === productId1);
    expect(prod1Entry?.qty).toBe(-3);
  });

  test('2. Atomic Failure / No Partial Deduction on Insufficient Stock', async () => {
    
    // Current stock is P1=7, P2=1. We will ask for P1=2 (available) and P2=5 (insufficient).
    const result = await adminDb.runTransaction(async (t) => {
      return await InventoryEngine.attemptDeduction(
        t,
        [
          { product_id: productId1, qty: 2 },
          { product_id: productId2, qty: 5 }
        ],
        `INV-MOCK-FAIL-${Date.now()}`,
        "invoice"
      );
    });

    // Expect failure
    expect(result.success).toBe(false);
    expect(result.insufficientItems).toContain(productId2);

    // Verify NO stock was partially deducted
    const doc1 = await adminDb.collection("inventory").doc(productId1).get();
    expect(doc1.data()?.available_stock).toBe(7); // remained 7

    const doc2 = await adminDb.collection("inventory").doc(productId2).get();
    expect(doc2.data()?.available_stock).toBe(1); // remained 1
  });

  test('3. Successful Reversal Transaction', async () => {
    const reversalId = `REV-MOCK-${Date.now()}`;

    // Reverse the 3 items of P1 and 1 item of P2 from test 1
    await adminDb.runTransaction(async (t) => {
      return await InventoryEngine.reverseDeduction(
        t,
        [
          { product_id: productId1, qty: 3 },
          { product_id: productId2, qty: 1 }
        ],
        reversalId,
        "manual"
      );
    });

    // Verify Stock is restored
    const doc1 = await adminDb.collection("inventory").doc(productId1).get();
    expect(doc1.data()?.available_stock).toBe(10); 

    const doc2 = await adminDb.collection("inventory").doc(productId2).get();
    expect(doc2.data()?.available_stock).toBe(2); 

    // Verify Ledger Reversal Entry
    const ledgerSnap = await adminDb.collection("inventory_ledger")
      .where("reference_entity_id", "==", reversalId)
      .where("type", "==", "reversal")
      .get();
    
    expect(ledgerSnap.size).toBe(2);
    const entries = ledgerSnap.docs.map(d => d.data());
    const prod1Entry = entries.find(e => e.product_id === productId1);
    expect(prod1Entry?.qty).toBe(3); // Positive amount for reversal
  });

});
