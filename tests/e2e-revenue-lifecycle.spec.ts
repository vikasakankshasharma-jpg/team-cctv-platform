import { test, expect } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';
import { calculateDealProfitability } from '../lib/profitability-engine';

test.describe('P1 Operations + Financial Chain E2E', () => {
  const TEST_ID = Date.now().toString();
  const LEAD_ID = `L_REV_${TEST_ID}`;
  const SKU_ID = `SKU_${TEST_ID}`;
  const SERIAL_NUM = `SN_${TEST_ID}`;
  let DEAL_ID = '';
  let JOB_ID = '';
  let INVOICE_ID = '';

  test.beforeAll(async () => {
    // 1. Seed Initial Inventory & Product
    await adminDb.collection('products').doc(SKU_ID).set({
      name: 'Test Camera',
      isSerialized: true,
      warrantyPolicy: { customerWarrantyMonths: 12 }
    });

    await adminDb.collection('inventory').doc(SKU_ID).set({
      availableQty: 10,
      reservedQty: 0
    });

    await adminDb.collection('serial_assets').doc(`serial_${SERIAL_NUM}`).set({
      serialNumber: SERIAL_NUM,
      skuId: SKU_ID,
      status: 'IN_STOCK',
      unitPurchaseCost: 2000 // Unit cost for profitability
    });

    // 2. Seed Lead with Quote
    await adminDb.collection('leads').doc(LEAD_ID).set({
      customer_name: 'E2E Lifecycle Tester',
      payment_status: 'pending',
      quote_amount: 5000,
      assigned_installer_id: 'TEST_INSTALLER',
      bomCameras: [{ product: { id: SKU_ID, isSerialized: true }, quantity: 1 }]
    });

    await adminDb.collection('leads').doc(LEAD_ID).collection('quotes').doc(`QUOTE_${TEST_ID}`).set({
      grand_total: 5000,
      bomCameras: [{ product: { id: SKU_ID, isSerialized: true }, quantity: 1 }],
      status: 'pending'
    });
  });

  test.afterAll(async () => {
    // Cleanup
    await adminDb.collection('products').doc(SKU_ID).delete();
    await adminDb.collection('inventory').doc(SKU_ID).delete();
    await adminDb.collection('serial_assets').doc(`serial_${SERIAL_NUM}`).delete();
    await adminDb.collection('leads').doc(LEAD_ID).delete();
    if (DEAL_ID) await adminDb.collection('deals').doc(DEAL_ID).delete();
    if (JOB_ID) await adminDb.collection('jobs').doc(JOB_ID).delete();
    if (INVOICE_ID) await adminDb.collection('invoices').doc(INVOICE_ID).delete();
    
    // Delete ledgers
    if (JOB_ID) {
      const snap = await adminDb.collection('stock_ledger').where('referenceId', '==', JOB_ID).get();
      const batch = adminDb.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  });

  test('Execute complete Revenue Lifecycle Chain', async ({ request }) => {
    // 1. Cashfree Webhook -> Payment Success (Creates Deal & Job)
    const cfPayload = {
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: `order_${LEAD_ID}`,
          order_amount: 5000,
          payment_amount: 5000,
          order_tags: { lead_id: LEAD_ID, quote_id: `QUOTE_${TEST_ID}`, type: 'INSTALLATION' }
        },
        payment: { payment_status: 'SUCCESS' }
      }
    };
    
    // Use an invalid signature with bypass token to mock webhook
    const cfRes = await request.post('/api/webhooks/cashfree', {
      data: cfPayload,
      headers: { 'x-webhook-signature': 'mock', 'x-test-bypass': 'true' }
    });
    console.log("CF WEBHOOK STATUS:", cfRes.status());
    console.log("CF WEBHOOK BODY:", await cfRes.json());
    expect(cfRes.status()).toBe(200);

    // Fetch Deal and Job
    const dealsSnap = await adminDb.collection('deals').where('leadId', '==', LEAD_ID).get();
    expect(dealsSnap.empty).toBe(false);
    DEAL_ID = dealsSnap.docs[0].id;

    const jobsSnap = await adminDb.collection('jobs').where('dealId', '==', DEAL_ID).get();
    expect(jobsSnap.empty).toBe(false);
    JOB_ID = jobsSnap.docs[0].id;

    // 2. Schedule Job (Reserves Inventory)
    const scheduleRes = await request.patch(`/api/operations/jobs/${JOB_ID}`, {
      data: { status: 'SCHEDULED' },
      headers: { Cookie: 'admin_session=mock_session_cookie_ROLE_super_admin' }
    });
    console.log("SCHEDULE JOB STATUS:", scheduleRes.status());
    expect(scheduleRes.status()).toBe(200);

    let invDoc = await adminDb.collection('inventory').doc(SKU_ID).get();
    expect(invDoc.data()?.availableQty).toBe(9);
    expect(invDoc.data()?.reservedQty).toBe(1);

    // 3. Complete Job (Consumes Inventory, Installs Serial Asset)
    const completeRes = await request.patch(`/api/operations/jobs/${JOB_ID}`, {
      data: { 
        status: 'COMPLETED',
        serials: { [SKU_ID]: [SERIAL_NUM] }
      },
      headers: { Cookie: 'admin_session=mock_session_cookie_ROLE_super_admin' }
    });
    console.log("COMPLETE JOB STATUS:", completeRes.status());
    expect(completeRes.status()).toBe(200);

    invDoc = await adminDb.collection('inventory').doc(SKU_ID).get();
    expect(invDoc.data()?.availableQty).toBe(9); // Reserved is consumed
    expect(invDoc.data()?.reservedQty).toBe(0);

    const assetDoc = await adminDb.collection('serial_assets').doc(`serial_${SERIAL_NUM}`).get();
    expect(assetDoc.data()?.status).toBe('INSTALLED');
    expect(assetDoc.data()?.jobId).toBe(JOB_ID);

    // 4. Generate Invoice for Deal
    const invCreateRes = await request.post('/api/finance/invoices', {
      data: { dealId: DEAL_ID },
      headers: { Cookie: 'admin_session=mock_session_cookie_ROLE_super_admin' }
    });
    console.log("INVOICE CREATE STATUS:", invCreateRes.status());
    expect(invCreateRes.status()).toBe(200);
    const invData = await invCreateRes.json();
    INVOICE_ID = invData.invoiceId;
    expect(INVOICE_ID).toBeTruthy();

    const createdInvDoc = await adminDb.collection('invoices').doc(INVOICE_ID).get();
    expect(createdInvDoc.data()?.status).toBe('UNPAID');
    expect(createdInvDoc.data()?.grandTotal).toBe(5000);

    // 5. Pay Invoice (Receipt Generation)
    const receiptRes = await request.post('/api/finance/receipts', {
      data: { invoiceId: INVOICE_ID, amount: 5000, paymentMethod: 'CASH', referenceNumber: 'CASH-1' },
      headers: { Cookie: 'admin_session=mock_session_cookie_ROLE_super_admin' }
    });
    console.log("RECEIPT STATUS:", receiptRes.status());
    expect(receiptRes.status()).toBe(200);

    const paidInvDoc = await adminDb.collection('invoices').doc(INVOICE_ID).get();
    expect(paidInvDoc.data()?.status).toBe('PAID');

    // 6. Profitability Engine Check
    const profitResult = await calculateDealProfitability(DEAL_ID, 'test-month');
    expect(profitResult.revenue).toBe(4237.29); // 5000 / 1.18
    // Cost should be exactly 2000 (Unit Purchase Cost of Serial Asset installed)
    expect(profitResult.costs.purchase).toBe(2000);
    expect(profitResult.grossProfit).toBe(2237.29);
  });
});
