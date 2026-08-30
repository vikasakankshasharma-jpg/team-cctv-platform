const fs = require('fs');
let code = fs.readFileSync('tests/e2e-pricing-lifecycle.spec.ts', 'utf8');

const t5 = `  test('5. Historical quote remains readable after product discontinuation', async ({ request }) => {
    // Save a quote via API instead of direct DB write to verify /api/quote/save
    const savedQuoteId = 'QT-HIST-' + TEST_ID;

    const payload = {
      customer_mobile: '9999999999',
      customer_name: 'Test Customer',
      requirementSnapshot: { camera_count: 4, technology_preference: 'IP' },
      configurationSnapshot: { total_cameras: 4 },
      pricingSnapshot: {
        plan_type: 'recommended',
        items: [
          {
            product_id: ACTIVE_SKU,
            display_name: 'Test Active Camera',
            brand: 'CP Plus',
            unit_price: 5000,
            qty: 4,
            line_total: 20000,
            stock_status_at_quote: 'in_stock',
            base_cost_at_quote: 3000,
          }
        ],
        total_payable: 23600,
        gst_amount: 3600,
      },
      selectedPlan: 'recommended',
      parentQuoteId: savedQuoteId
    };

    const res = await request.post('/api/quote/save', { data: payload });
    
    // Debug if it's 404
    if (!res.ok()) {
      console.log('API Error:', res.status(), await res.text());
    }
    expect(res.ok()).toBeTruthy();

    // Now DISCONTINUE the product
    await adminDb.collection('products').doc(ACTIVE_SKU).update({
      stock_status: 'discontinued',
    });

    // The saved quote should still be fully readable with original data
    const quoteDoc = await adminDb.collection('quotes').doc(savedQuoteId).get();
    expect(quoteDoc.exists).toBe(true);
    
    const quoteData = quoteDoc.data();
    // Verify the snapshot is intact even after product was discontinued
    expect(quoteData?.pricingSnapshot.items[0].product_id).toBe(ACTIVE_SKU);
    expect(quoteData?.pricingSnapshot.items[0].display_name).toBe('Test Active Camera');

    // Cleanup: restore product to ACTIVE for other tests
    await adminDb.collection('products').doc(ACTIVE_SKU).update({
      stock_status: 'in_stock',
    });

    // Cleanup quote
    await adminDb.collection('quotes').doc(savedQuoteId).delete();
  });`;

const t6 = `  test('6. Lifecycle change does NOT alter existing quote snapshot', async ({ request }) => {
    const quoteId = 'QT-LIFECYCLE-' + TEST_ID;
    const originalPrice = 5000;

    const payload = {
      customer_mobile: '8888888888',
      requirementSnapshot: { camera_count: 2 },
      configurationSnapshot: { total_cameras: 2 },
      selectedPlan: 'budget',
      pricingSnapshot: {
        items: [
          { product_id: ACTIVE_SKU, unit_price: originalPrice, qty: 2, line_total: originalPrice * 2 }
        ],
        total_payable: originalPrice * 2 * 1.18,
      },
      parentQuoteId: quoteId
    };

    const res = await request.post('/api/quote/save', { data: payload });
    expect(res.ok()).toBeTruthy();

    // Change the product price and lifecycle
    await adminDb.collection('products').doc(ACTIVE_SKU).update({
      unit_price: 7000, // Price changed!
      stock_status: 'out_of_stock',
    });

    // Re-read the quote
    const quoteDoc = await adminDb.collection('quotes').doc(quoteId).get();
    expect(quoteDoc.data()?.pricingSnapshot.items[0].unit_price).toBe(originalPrice);
    expect(quoteDoc.data()?.pricingSnapshot.items[0].line_total).toBe(originalPrice * 2);

    // Restore product
    await adminDb.collection('products').doc(ACTIVE_SKU).update({
      unit_price: 5000,
      stock_status: 'in_stock',
    });
    
    // Cleanup
    await adminDb.collection('quotes').doc(quoteId).delete();
  });`;

code = code.replace(/test\('5\. Historical quote remains readable after product discontinuation', async \(\) => \{[\s\S]*?await adminDb\.collection\('quotes'\)\.doc\(savedQuoteId\)\.delete\(\);\n  \}\);/m, t5);
code = code.replace(/test\('6\. Lifecycle change does NOT alter existing quote snapshot', async \(\) => \{[\s\S]*?await adminDb\.collection\('quotes'\)\.doc\(quoteId\)\.delete\(\);\n  \}\);/m, t6);

fs.writeFileSync('tests/e2e-pricing-lifecycle.spec.ts', code);
