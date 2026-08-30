import { test, expect } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

test.describe('P0: Full Cashfree Payment Lifecycle E2E', () => {
  const TEST_LEAD_ID = `E2E_TEST_LEAD_${Date.now()}`;
  const TEST_ORDER_ID = `E2E_ORDER_${Date.now()}`;
  let createdJobId: string | null = null;

  test.beforeAll(async () => {
    await adminDb.collection('leads').doc(TEST_LEAD_ID).set({
      status: 'quoted',
      payment_status: 'pending',
      customer_name: 'E2E Test Customer',
      customer_phone: '+919999999999',
      created_at: new Date(),
      is_test_record: true
    });
    await adminDb.collection('leads').doc(TEST_LEAD_ID).collection('quotes').doc('fake_quote_123').set({
      status: 'draft',
      created_at: new Date()
    });
  });

  test.afterAll(async () => {
    await adminDb.collection('leads').doc(TEST_LEAD_ID).delete();
    if (createdJobId) {
      await adminDb.collection('jobs').doc(createdJobId).delete();
    } else {
      const jobsSnap = await adminDb.collection('jobs').where('dealId', '==', TEST_LEAD_ID).get();
      const batch = adminDb.batch();
      jobsSnap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  });

  test('Invalid signature should be rejected with 401', async ({ request }) => {
    const res = await request.post('/api/webhooks/cashfree', {
      data: { type: 'PAYMENT_SUCCESS_WEBHOOK' },
      headers: { 'x-webhook-signature': 'wrong_signature' }
    });
    expect(res.status()).toBe(401);
  });

  test('Webhook should successfully mark lead as won and generate a pending_dispatch Job', async ({ request }) => {
    const mockPayload = {
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: TEST_ORDER_ID,
          payment_amount: 15000,
          order_tags: {
            lead_id: TEST_LEAD_ID,
            quote_id: 'fake_quote_123'
          }
        }
      }
    };

    const response = await request.post('/api/webhooks/cashfree', {
      data: mockPayload,
      headers: { 'x-webhook-signature': 'dummy_signature' } // Ensure mock logic allows this
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);

    const leadDoc = await adminDb.collection('leads').doc(TEST_LEAD_ID).get();
    const leadData = leadDoc.data();
    expect(leadData?.status).toBe('won');
    
    let jobsSnap: any;
    let attempts = 0;
    while (attempts < 5) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      jobsSnap = await adminDb.collection('jobs').where('dealId', '==', TEST_LEAD_ID).get();
      if (!jobsSnap.empty) break;
      attempts++;
    }
    
    expect(jobsSnap.empty).toBe(false);
    expect(jobsSnap.docs.length).toBe(1);
    createdJobId = jobsSnap.docs[0].id;
  });

  test('Idempotency: Duplicate webhook does not create duplicate job/revenue', async ({ request }) => {
    // Attempting to send the EXACT same success webhook again
    const mockPayload = {
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: TEST_ORDER_ID,
          payment_amount: 15000,
          order_tags: {
            lead_id: TEST_LEAD_ID,
            quote_id: 'fake_quote_123'
          }
        }
      }
    };

    await request.post('/api/webhooks/cashfree', {
      data: mockPayload,
      headers: { 'x-webhook-signature': 'dummy_signature' }
    });

    // Check that we STILL only have 1 job!
    const jobsSnap = await adminDb.collection('jobs').where('dealId', '==', TEST_LEAD_ID).get();
    expect(jobsSnap.docs.length).toBe(1);
  });

  test('Webhook failure handling: TRANSFER_FAILED should update payout request without deducting balance', async ({ request }) => {
    // 1. Seed a pending payout request
    const TEST_PAYOUT_ID = 'test_payout_' + Date.now();
    await adminDb.collection('payout_requests').doc(TEST_PAYOUT_ID).set({
      status: 'processing',
      user_id: 'test_installer_123',
      user_type: 'installer',
      gross_amount: 5000,
      net_amount: 4500,
      tds_amount: 500
    });

    // 2. Seed the installer with 5000 wallet balance
    await adminDb.collection('installers').doc('test_installer_123').set({
      wallet_balance: 5000
    });

    // 3. Send TRANSFER_FAILED webhook
    const mockPayload = {
      type: 'TRANSFER_FAILED',
      transferId: 'transfer_' + TEST_PAYOUT_ID,
      reason: 'Insufficient funds in Nodal Account'
    };

    const response = await request.post('/api/webhooks/cashfree', {
      data: mockPayload,
      headers: { 'x-webhook-signature': 'dummy_signature' }
    });

    expect(response.status()).toBe(200);

    // 4. Validate Payout Request is failed
    const payoutDoc = await adminDb.collection('payout_requests').doc(TEST_PAYOUT_ID).get();
    expect(payoutDoc.data()?.status).toBe('failed');
    expect(payoutDoc.data()?.failure_reason).toBe('Insufficient funds in Nodal Account');

    // 5. Validate Wallet Balance is still 5000 (no inconsistent deduction)
    const installerDoc = await adminDb.collection('installers').doc('test_installer_123').get();
    expect(installerDoc.data()?.wallet_balance).toBe(5000);
    
    // Cleanup
    await adminDb.collection('payout_requests').doc(TEST_PAYOUT_ID).delete();
    await adminDb.collection('installers').doc('test_installer_123').delete();
  });
});

