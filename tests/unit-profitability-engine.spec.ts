import { test, expect } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';
import { calculateDealProfitability } from '../lib/profitability-engine';

test.describe('P0: Profitability Source-of-Truth', () => {
  const TEST_DEAL_ID = `PROFIT_TEST_${Date.now()}`;
  
  test.afterAll(async () => {
    // Cleanup
    const del = async (col: string) => {
      const snap = await adminDb.collection(col).where('dealId', '==', TEST_DEAL_ID).get();
      const batch = adminDb.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    };
    await del('invoices');
    await del('serial_assets');
    await del('jobs');
    await adminDb.collection('profitability_snapshots').doc(`2026-08_${TEST_DEAL_ID}`).delete();
  });

  test('calculates gross profit correctly from immutable transaction data', async () => {
    // Seed Invoice (Revenue: 20000)
    await adminDb.collection('invoices').add({
      dealId: TEST_DEAL_ID,
      totalAmount: 20000,
      status: 'PAID',
      createdAt: new Date().toISOString()
    });

    // Seed Serial Asset (Cost: 10000)
    await adminDb.collection('serial_assets').add({
      dealId: TEST_DEAL_ID,
      unitPurchaseCost: 10000,
      status: 'INSTALLED'
    });

    // Seed Installation Job (Cost: 2000)
    await adminDb.collection('jobs').add({
      dealId: TEST_DEAL_ID,
      type: 'INSTALLATION',
      status: 'COMPLETED',
      labourCost: 2000,
      updatedAt: new Date().toISOString()
    });

    // Calculate
    const result = await calculateDealProfitability(TEST_DEAL_ID, '2026-08');
    
    expect(result.revenue).toBe(20000);
    expect(result.costs.purchase).toBe(10000);
    expect(result.costs.installation).toBe(2000);
    
    // Gross Profit = 20000 - 12000 = 8000
    expect(result.grossProfit).toBe(8000);
    expect(result.sourceRefs.length).toBe(3); // Invoice, Asset, Job
  });
});
