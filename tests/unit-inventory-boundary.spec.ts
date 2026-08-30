import { test, expect } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

test.describe('P0: Inventory Mutation Boundary (Row 18)', () => {
  const TEST_JOB_ID = `INV_BOUND_JOB_${Date.now()}`;
  const TEST_SKU = `SKU_${Date.now()}`;

  test.beforeAll(async () => {
    // 1. Seed Inventory
    await adminDb.collection('inventory').doc(TEST_SKU).set({
      availableQty: 10,
      reservedQty: 2
    });

    // 2. Seed Job
    await adminDb.collection('deals').doc('DEAL_123').set({ status: 'PROCESSING' });
    
    await adminDb.collection('jobs').doc(TEST_JOB_ID).set({
      dealId: 'DEAL_123',
      type: 'INSTALLATION',
      status: 'SCHEDULED',
      bomCameras: [{ product: { id: TEST_SKU }, quantity: 2 }]
    });
  });

  test.afterAll(async () => {
    await adminDb.collection('deals').doc('DEAL_123').delete();
    await adminDb.collection('jobs').doc(TEST_JOB_ID).delete();
    await adminDb.collection('inventory').doc(TEST_SKU).delete();
    
    // Delete ledgers
    const snap = await adminDb.collection('stock_ledger').where('referenceId', '==', TEST_JOB_ID).get();
    const batch = adminDb.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  });

  test('Concurrent double job completion request handles idempotency and prevents double stock deduction', async ({ request }) => {
    // Fire TWO requests at the EXACT same time
    const req1 = request.patch(`/api/operations/jobs/${TEST_JOB_ID}`, {
      data: { status: 'COMPLETED' },
      headers: { Cookie: 'admin_session=mock_session_cookie' } // Mock session
    });
    
    const req2 = request.patch(`/api/operations/jobs/${TEST_JOB_ID}`, {
      data: { status: 'COMPLETED' },
      headers: { Cookie: 'admin_session=mock_session_cookie' } // Mock session
    });

    const [res1, res2] = await Promise.all([req1, req2]);

    // One should succeed, one should fail due to idempotency
    const successCount = [res1.status(), res2.status()].filter(s => s === 200).length;
    const errorCount = [res1.status(), res2.status()].filter(s => s === 400).length;

    expect(successCount).toBe(1);
    expect(errorCount).toBe(1);

    // Verify Inventory was only deducted ONCE
    const invDoc = await adminDb.collection('inventory').doc(TEST_SKU).get();
    const invData = invDoc.data();
    
    expect(invData?.reservedQty).toBe(0);
    expect(invData?.availableQty).toBe(10);
    
    // Verify Ledger count is exactly 2 (1 RELEASE, 1 OUT)
    const ledgers = await adminDb.collection('stock_ledger').where('referenceId', '==', TEST_JOB_ID).get();
    expect(ledgers.docs.length).toBe(2);
  });
});
