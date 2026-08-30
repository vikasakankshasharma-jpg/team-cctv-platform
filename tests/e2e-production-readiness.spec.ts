import { test, expect } from '@playwright/test';
import { adminDb } from '@/lib/firebase-admin';

// The ultimate capstone E2E test verifying all 8 Security & Contract Gates
test.describe("Capstone Production Readiness: End-to-End Flow & Immutability", () => {
  // Use a longer timeout for true staging E2E tests (Network latency)
  test.setTimeout(180000); // 3 minutes

  const customerId = "cust_capstone_1";
  const quoteId = "qt_capstone_1";
  const invoiceId = "inv_capstone_1";
  const productId = "cam_capstone_1";

  test.beforeAll(async () => {
    // 1. Seed master product pricing (Give 60s for staging)
    test.setTimeout(60000);
    await adminDb.collection("products").doc(productId).set({
      id: productId,
      display_name: "Capstone 4MP Camera",
      base_cost: 1500,
      stock_status: "in_stock",
      is_active: true,
      is_quotation_eligible: true
    });
    
    // Seed Inventory
    await adminDb.collection("inventory").doc(productId).set({
      id: productId,
      total_stock: 10,
      available_stock: 10,
      reserved_stock: 0,
      last_updated: new Date().toISOString()
    });
  });

  test('Gate 1-8: Full Flow Execution', async ({ request }) => {
    const originalQuoteTotal = 5000;
    
    // Gate 1: Quote Snapshot (Sales accepts the requirement)
    await adminDb.collection("quotes").doc(quoteId).set({
      id: quoteId,
      customerId: customerId,
      status: "APPROVED",
      total: originalQuoteTotal,
      created_at: new Date().toISOString(),
      items: [
        { product_id: productId, qty: 2, unit_price: 2500 }
      ]
    });

    // Gate 2: Finance / Invoice Creation
    await adminDb.collection("invoices").doc(invoiceId).set({
      id: invoiceId,
      quote_id: quoteId,
      payment_status: "pending",
      is_supplementary: false,
      total_payable: originalQuoteTotal,
      items: [
        { product_id: productId, qty: 2, unit_price: 2500 }
      ]
    });

    const webhookRes = await request.post('/api/webhooks/payment', {
      headers: {
        'x-webhook-signature': 'CCTV_Staging_Secret_2026_Secure',
      },
      data: {
        transaction_id: "txn_capstone_1",
        order_id: "ord_capstone_1",
        reference_entity_id: invoiceId,
        reference_entity_type: "invoice",
        amount: originalQuoteTotal,
        status: "SUCCESS"
      }
    });
    const webhookData = await webhookRes.json();
    if (!webhookRes.ok()) console.log("WEBHOOK FAILED:", webhookData);
    expect(webhookRes.ok()).toBeTruthy();

    // Verify Inventory Deducted (10 - 2 = 8)
    const invSnap = await adminDb.collection("inventory").doc(productId).get();
    expect(invSnap.data()?.available_stock).toBe(8);

    // Find the dynamically created Job
    const jobsSnap = await adminDb.collection("jobs").where("invoice_ids", "array-contains", invoiceId).get();
    expect(jobsSnap.size).toBe(1);
    const dynamicJob = jobsSnap.docs[0].data();
    const jobId = dynamicJob.id;
    expect(dynamicJob.status).toBe("PENDING_DISPATCH");

    // Operations assigns Job to Installer and adds Site Survey
    await adminDb.collection("jobs").doc(jobId).update({
      status: "ASSIGNED",
      installer_id: "inst1",
      site_survey: { ladder_required: true, furnishing_status: "Furnished" },
      required_materials: [{ product_id: productId, qty: 2 }]
    });

    // Gate 5: Installer Operations API
    // Attempt invalid transition to COMPLETED straight from ASSIGNED
    const transitionRes = await request.post(`/api/operations/jobs/${jobId}/transition`, {
      headers: { cookie: 'admin_session=mock_session_installer_UID_inst1' },
      data: { status: "COMPLETED", note: "Done" }
    });
    expect(transitionRes.status()).toBe(400);

    // Valid transitions
    const validTrans1 = await request.post(`/api/operations/jobs/${jobId}/transition`, {
      headers: { cookie: 'admin_session=mock_session_installer_UID_inst1' },
      data: { status: "IN_PROGRESS", note: "Started" }
    });
    expect(validTrans1.ok()).toBeTruthy();

    const validTrans2 = await request.post(`/api/operations/jobs/${jobId}/transition`, {
      headers: { cookie: 'admin_session=mock_session_installer_UID_inst1' },
      data: { status: "COMPLETED", note: "Finished" }
    });
    expect(validTrans2.ok()).toBeTruthy();

    // Gate 6 & 8: Admin Pricing Mutation & Immutability Contract
    const adminRes = await request.post(`/api/admin/pricing/products/${productId}`, {
      headers: { cookie: 'admin_session=mock_session_super_admin_UID_admin1' },
      data: { base_cost: 3000, stock_status: "in_stock" }
    });
    expect(adminRes.ok()).toBeTruthy();

    // The absolute most important contract: Old quote must remain completely unchanged
    const quoteDoc = await adminDb.collection("quotes").doc(quoteId).get();
    const oldQuote = quoteDoc.data();
    expect(oldQuote?.total).toBe(originalQuoteTotal);
    expect(oldQuote?.items[0].unit_price).toBe(2500);

    // Gate 7: Strict Role Isolation
    const hackRes = await request.post(`/api/admin/pricing/products/${productId}`, {
      headers: { cookie: 'admin_session=mock_session_customer_UID_cust1' },
      data: { base_cost: 1 }
    });
    expect(hackRes.status()).toBe(403);
    
    const hackRes2 = await request.get('/api/operations/jobs', {
      headers: { cookie: 'admin_session=mock_session_customer_UID_cust1' }
    });
    expect(hackRes2.status()).toBe(403);
  });
});

