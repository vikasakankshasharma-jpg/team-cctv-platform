import { test, expect } from '@playwright/test';
import { evaluateServiceEligibility } from '../lib/service-eligibility';
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

const createMockDoc = (data: any) => ({
  get: async () => ({
    exists: !!data,
    data: () => data
  })
});

test.describe('Service Eligibility Waterfall', () => {
  let originalCollection: any;
  const now = new Date();
  const future = new Date(now.getTime() + 86400000 * 10).toISOString(); // +10 days
  const past = new Date(now.getTime() - 86400000 * 10).toISOString();   // -10 days

  test.beforeAll(() => {
    originalCollection = adminDb.collection;
  });

  test.afterAll(() => {
    (adminDb as any).collection = originalCollection;
  });

  test('1. FREE_INSTALLATION_WARRANTY is granted within 7 days', async () => {
    (adminDb as any).collection = (colName: string) => {
      if (colName === 'serial_assets') {
        return {
          doc: () => createMockDoc({
            installationWarrantyEndDate: future,
            warrantyEndDate: future
          })
        };
      }
      return createMockQuery([]);
    };

    const result = await evaluateServiceEligibility('cust_123', 'asset_123');
    expect(result.eligibility).toBe('FREE_INSTALLATION_WARRANTY');
  });

  test('2. FREE_PRODUCT_WARRANTY falls back correctly when install warranty expired', async () => {
    (adminDb as any).collection = (colName: string) => {
      if (colName === 'serial_assets') {
        return {
          doc: () => createMockDoc({
            installationWarrantyEndDate: past, // Expired
            warrantyEndDate: future            // Still valid
          })
        };
      }
      return createMockQuery([]);
    };

    const result = await evaluateServiceEligibility('cust_123', 'asset_123');
    expect(result.eligibility).toBe('FREE_PRODUCT_WARRANTY');
  });

  test('3. AMC_COVERAGE decrements remaining visits if hardware warranty expired', async () => {
    (adminDb as any).collection = (colName: string) => {
      if (colName === 'serial_assets') {
        return {
          doc: () => createMockDoc({
            installationWarrantyEndDate: past, // Expired
            warrantyEndDate: past              // Expired
          })
        };
      }
      if (colName === 'amc_contracts') {
        return createMockQuery([{
          id: 'amc_123',
          status: 'ACTIVE',
          startDate: past,
          endDate: future,
          includedVisits: 4,
          usedVisits: 1 // 3 visits remaining
        }]);
      }
      return createMockQuery([]);
    };

    const result = await evaluateServiceEligibility('cust_123', 'asset_123');
    expect(result.eligibility).toBe('AMC_COVERAGE');
    expect(result.amcContractId).toBe('amc_123');
  });

  test('4. CHARGEABLE triggers when all warranties and AMC expire', async () => {
    (adminDb as any).collection = (colName: string) => {
      if (colName === 'serial_assets') {
        return {
          doc: () => createMockDoc({
            installationWarrantyEndDate: past, 
            warrantyEndDate: past              
          })
        };
      }
      if (colName === 'amc_contracts') {
        return createMockQuery([{
          id: 'amc_123',
          status: 'ACTIVE',
          startDate: past,
          endDate: future,
          includedVisits: 4,
          usedVisits: 4 // No visits remaining!
        }]);
      }
      return createMockQuery([]);
    };

    const result = await evaluateServiceEligibility('cust_123', 'asset_123');
    expect(result.eligibility).toBe('CHARGEABLE');
  });

  test('Fallback for non-serialized SKU checks customer_warranty_items', async () => {
    (adminDb as any).collection = (colName: string) => {
      if (colName === 'customer_warranty_items') {
        return createMockQuery([{
          skuId: 'sku_123',
          installationWarrantyEndDate: past,
          warrantyEndDate: future // Still active product warranty
        }]);
      }
      return createMockQuery([]);
    };

    // Note: assetId is undefined, skuId is provided
    const result = await evaluateServiceEligibility('cust_123', undefined, 'sku_123');
    expect(result.eligibility).toBe('FREE_PRODUCT_WARRANTY');
  });
});
