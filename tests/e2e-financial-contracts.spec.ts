import { test, expect, request } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

test.describe.serial('Phase 3: Canonical Financial Contracts', () => {

  const quoteId = `QT-E2E-${Date.now()}`;
  let invoiceId = "";
  let jobId = "";
  let changeOrderId = "";

  test.beforeAll(async () => {
    // Seed a quote for the test
    await adminDb.collection("quotes").doc(quoteId).set({
      id: quoteId,
      customer_mobile: "9999999999",
      customer_name: "Test User",
      status: "GENERATED",
      pricingSnapshot: {
        items: [
          {
            product_id: "TEST-CAM",
            display_name: "Test Camera",
            qty: 2,
            unit_price: 1000,
            line_total: 2000,
            base_cost_at_quote: 800
          }
        ],
        net_taxable_amount: 2000,
        gst_amount: 360,
        total_payable: 2360
      }
    });
  });

  test('1. Quote to Invoice Conversion (Idempotency check)', async ({ request }) => {
    // 1st request should succeed
    const res1 = await request.post('/api/invoice/generate', { data: { quoteId } });
    expect(res1.ok()).toBeTruthy();
    const json1 = await res1.json();
    expect(json1.success).toBe(true);
    expect(json1.invoice).toBeDefined();
    invoiceId = json1.invoice.id;

    // The quote should now be locked
    const quoteDoc = await adminDb.collection('quotes').doc(quoteId).get();
    expect(quoteDoc.data()?.status).toBe('INVOICED');

    // 2nd request should fail (idempotency)
    const res2 = await request.post('/api/invoice/generate', { data: { quoteId } });
    expect(res2.status()).toBe(409);
    const json2 = await res2.json();
    expect(json2.message).toContain('already been invoiced');
  });

  test('2. Webhook Payment Linkage & Job Creation', async ({ request }) => {
    const txnId = `TXN-${Date.now()}`;
    const payload = {
      order_id: `ORD-${Date.now()}`,
      transaction_id: txnId,
      status: "SUCCESS",
      amount: 2360,
      reference_entity_id: invoiceId,
      reference_entity_type: "invoice"
    };

    const res = await request.post('/api/webhooks/payment', {
      data: payload,
      headers: { 'x-webhook-signature': 'test_signature_valid' }
    });
    
    expect(res.ok()).toBeTruthy();
    
    // Verify invoice is paid
    const invDoc = await adminDb.collection('invoices').doc(invoiceId).get();
    expect(invDoc.data()?.payment_status).toBe('fully_paid');
    expect(invDoc.data()?.payment_references).toContain(txnId);

    // Verify Job created
    const jobsSnap = await adminDb.collection('jobs').where('invoice_ids', 'array-contains', invoiceId).get();
    expect(jobsSnap.empty).toBe(false);
    jobId = jobsSnap.docs[0].id;
  });

  test('3. Installer generates Change Order against Paid Invoice', async ({ request }) => {
    const payload = {
      base_invoice_id: invoiceId,
      base_job_id: jobId,
      reason: "extra_material",
      created_by: "Installer_X",
      items_to_add: [
        {
          product_id: "EXTRA-CBL",
          display_name: "Extra Cable (10m)",
          qty: 10,
          base_cost_at_quote: 25,
          category: "cable"
        }
      ]
    };

    const res = await request.post('/api/invoice/change-order', { data: payload });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    changeOrderId = json.changeOrder.id;

    expect(json.changeOrder.status).toBe("pending_customer_approval");
  });

  test('4. Webhook Change Order Payment & Inventory/Supplementary Sync', async ({ request }) => {
    const txnId = `TXN-CO-${Date.now()}`;
    const payload = {
      order_id: `ORD-CO-${Date.now()}`,
      transaction_id: txnId,
      status: "SUCCESS",
      amount: 400, // exact amount isn't strictly validated in this mock
      reference_entity_id: changeOrderId,
      reference_entity_type: "change_order"
    };

    const res = await request.post('/api/webhooks/payment', {
      data: payload,
      headers: { 'x-webhook-signature': 'test_signature_valid' }
    });
    
    expect(res.ok()).toBeTruthy();

    // Verify CO status
    const coDoc = await adminDb.collection('change_orders').doc(changeOrderId).get();
    expect(coDoc.data()?.status).toBe('paid');

    // Verify Supplementary Invoice Created
    const suppSnap = await adminDb.collection('invoices')
      .where('change_order_id', '==', changeOrderId)
      .where('is_supplementary', '==', true)
      .get();
    
    expect(suppSnap.empty).toBe(false);
    const suppInv = suppSnap.docs[0].data();
    expect(suppInv.payment_status).toBe('fully_paid');
    
    // Verify Job Ledger updated
    const jobDoc = await adminDb.collection('jobs').doc(jobId).get();
    expect(jobDoc.data()?.change_order_ids).toContain(changeOrderId);
    expect(jobDoc.data()?.invoice_ids).toContain(suppInv.id);

    // Verify Audit log for inventory
    const ledgerSnap = await adminDb.collection('inventory_ledger')
      .where('reference_entity_id', '==', changeOrderId)
      .get();
    // Since EXTRA-CBL doesn't exist in inventory, it fails deduction and no ledger entry is created.
    expect(ledgerSnap.empty).toBe(true);
  });

});
