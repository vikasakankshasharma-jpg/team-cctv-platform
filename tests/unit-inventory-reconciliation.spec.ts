import { test, expect } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

// Simple mock for Firebase query chain
const createMockQuery = (docs: any[]) => {
  const query: any = {
    where: () => query,
    get: async () => ({
      docs: docs.map(d => ({
        id: d.id || Math.random().toString(),
        data: () => d
      })),
      empty: docs.length === 0
    })
  };
  return query;
};

// Reusable function that mirrors the business logic of scripts/reconcile-inventory.ts
async function runReconciliation() {
  const discrepancies: string[] = [];
  const inventorySnap = await adminDb.collection("inventory").get();
  
  for (const doc of inventorySnap.docs) {
      const item = doc.data();
      const skuId = doc.id;
      
      const ledgerSnap = await adminDb.collection("stock_ledger").where("skuId", "==", skuId).get();
      let derivedStock = 0;
      
      ledgerSnap.docs.forEach(lDoc => {
          const entry = lDoc.data();
          if (entry.type === "IN") derivedStock += entry.quantity;
          else if (entry.type === "OUT") derivedStock -= entry.quantity;
          else if (entry.type === "ADJUST_UP") derivedStock += entry.quantity;
          else if (entry.type === "ADJUST_DOWN") derivedStock -= entry.quantity;
      });
      
      const currentStock = item.availableQty + (item.reservedQty || 0);
      if (derivedStock !== currentStock) {
          discrepancies.push(`[MISMATCH] SKU ${skuId}: Master Stock = ${currentStock}, Ledger Derived = ${derivedStock}`);
      }

      const serialsSnap = await adminDb.collection("serial_assets").where("skuId", "==", skuId).get();
      if (!serialsSnap.empty) {
          let inStock = 0;
          let reserved = 0;
          
          serialsSnap.docs.forEach(sDoc => {
              const s = sDoc.data();
              if (s.status === "IN_STOCK") inStock++;
              if (s.status === "RESERVED") reserved++;
          });
          
          if (item.availableQty !== inStock) {
              discrepancies.push(`[MISMATCH] SKU ${skuId}: Master AvailableQty (${item.availableQty}) !== Serial Assets IN_STOCK (${inStock})`);
          }
          if ((item.reservedQty || 0) !== reserved) {
               discrepancies.push(`[MISMATCH] SKU ${skuId}: Master ReservedQty (${item.reservedQty || 0}) !== Serial Assets RESERVED (${reserved})`);
          }
      }
  }
  return discrepancies;
}

test.describe('Phase 8: Inventory Reconciliation Engine', () => {
  let originalCollection: any;

  test.beforeAll(() => {
    originalCollection = adminDb.collection;
  });

  test.afterAll(() => {
    (adminDb as any).collection = originalCollection;
  });

  test('should pass reconciliation when Ledger, Inventory, and Serials match exactly', async () => {
    (adminDb as any).collection = (colName: string) => {
      if (colName === 'inventory') {
        return createMockQuery([{ id: 'cam_123', availableQty: 5, reservedQty: 2 }]);
      }
      if (colName === 'stock_ledger') {
        return createMockQuery([
          { type: 'IN', quantity: 10 },
          { type: 'OUT', quantity: 3 }, // 10 - 3 = 7 (matches available 5 + reserved 2)
        ]);
      }
      if (colName === 'serial_assets') {
        return createMockQuery([
          // Need 5 IN_STOCK and 2 RESERVED to match inventory
          { status: 'IN_STOCK' }, { status: 'IN_STOCK' }, { status: 'IN_STOCK' }, { status: 'IN_STOCK' }, { status: 'IN_STOCK' },
          { status: 'RESERVED' }, { status: 'RESERVED' },
          { status: 'INSTALLED' }, { status: 'INSTALLED' }, { status: 'INSTALLED' } // The 3 OUTs
        ]);
      }
      return createMockQuery([]);
    };

    const discrepancies = await runReconciliation();
    expect(discrepancies).toHaveLength(0); // Perfect match
  });

  test('should fail reconciliation if Ledger math drifts from Master Inventory', async () => {
    (adminDb as any).collection = (colName: string) => {
      if (colName === 'inventory') {
        return createMockQuery([{ id: 'cam_123', availableQty: 5, reservedQty: 0 }]); // Total 5
      }
      if (colName === 'stock_ledger') {
        return createMockQuery([
          { type: 'IN', quantity: 10 },
          { type: 'OUT', quantity: 2 }, // Derived = 8 (Mismatch!)
        ]);
      }
      if (colName === 'serial_assets') return createMockQuery([]);
      return createMockQuery([]);
    };

    const discrepancies = await runReconciliation();
    expect(discrepancies).toHaveLength(1);
    expect(discrepancies[0]).toContain('Master Stock = 5, Ledger Derived = 8');
  });

  test('should fail reconciliation if Serial Asset statuses do not match Available/Reserved', async () => {
    (adminDb as any).collection = (colName: string) => {
      if (colName === 'inventory') {
        return createMockQuery([{ id: 'cam_123', availableQty: 5, reservedQty: 2 }]); // Total 7
      }
      if (colName === 'stock_ledger') {
        return createMockQuery([ { type: 'IN', quantity: 7 } ]); // Derived = 7 (Bulk matches)
      }
      if (colName === 'serial_assets') {
        return createMockQuery([
          { status: 'IN_STOCK' }, { status: 'IN_STOCK' }, { status: 'IN_STOCK' }, { status: 'IN_STOCK' }, // Only 4 IN_STOCK (Mismatch: expects 5)
          { status: 'RESERVED' }, { status: 'RESERVED' }, { status: 'RESERVED' } // 3 RESERVED (Mismatch: expects 2)
        ]);
      }
      return createMockQuery([]);
    };

    const discrepancies = await runReconciliation();
    expect(discrepancies).toHaveLength(2);
    expect(discrepancies.some(d => d.includes('Master AvailableQty (5) !== Serial Assets IN_STOCK (4)'))).toBeTruthy();
    expect(discrepancies.some(d => d.includes('Master ReservedQty (2) !== Serial Assets RESERVED (3)'))).toBeTruthy();
  });
});
