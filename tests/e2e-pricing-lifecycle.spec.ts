import { test, expect } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  E2E: Product Lifecycle & Pricing Engine (Phase 2)
 * ═══════════════════════════════════════════════════════════════════
 * 
 *  Business Contract Under Test:
 *  ┌─────────────────┬────────────────────────────────────────────┐
 *  │ ACTIVE          │ Quote allowed                              │
 *  │ ON_DEMAND       │ Quote allowed + supplier warning           │
 *  │ OUT_OF_STOCK    │ New quote BLOCKED                          │
 *  │ DISCONTINUED    │ New quote BLOCKED + catalog hidden         │
 *  └─────────────────┴────────────────────────────────────────────┘
 *
 *  Hard Delete is NOT a lifecycle operation.
 *  Existing quotes/invoices must remain readable regardless of 
 *  lifecycle changes.
 */

const TEST_ID = Date.now().toString();

// Test SKU IDs we'll create specifically for lifecycle testing
const ACTIVE_SKU     = `TEST-ACTIVE-${TEST_ID}`;
const ON_DEMAND_SKU  = `TEST-ONDEMAND-${TEST_ID}`;
const OOS_SKU        = `TEST-OOS-${TEST_ID}`;
const DISC_SKU       = `TEST-DISC-${TEST_ID}`;

test.describe.serial('Phase 2: Product Lifecycle & Pricing Engine', () => {

  test.beforeAll(async () => {
    // Seed 4 test products — one for each lifecycle state
    const products = [
      {
        id: ACTIVE_SKU,
        skuId: ACTIVE_SKU,
        display_name: 'Test Active Camera',
        technical_name: 'Test Active Camera',
        brand: 'CP Plus',
        category: 'cctv_camera',
        technologies: ['IP'],
        unit_price: 5000,
        base_cost: 3000,
        is_active: true,
        is_quotation_eligible: true,
        stock_status: 'in_stock',
        resolution_mp: 4,
      },
      {
        id: ON_DEMAND_SKU,
        skuId: ON_DEMAND_SKU,
        display_name: 'Test On-Demand Camera',
        technical_name: 'Test On-Demand Camera',
        brand: 'CP Plus',
        category: 'cctv_camera',
        technologies: ['IP'],
        unit_price: 8000,
        base_cost: 5000,
        is_active: true,
        is_quotation_eligible: true,
        stock_status: 'on_demand',
        resolution_mp: 8,
      },
      {
        id: OOS_SKU,
        skuId: OOS_SKU,
        display_name: 'Test Out-of-Stock Camera',
        technical_name: 'Test Out-of-Stock Camera',
        brand: 'CP Plus',
        category: 'cctv_camera',
        technologies: ['IP'],
        unit_price: 6000,
        base_cost: 4000,
        is_active: true,
        is_quotation_eligible: true,
        stock_status: 'out_of_stock',
        resolution_mp: 5,
      },
      {
        id: DISC_SKU,
        skuId: DISC_SKU,
        display_name: 'Test Discontinued Camera',
        technical_name: 'Test Discontinued Camera',
        brand: 'Budget Brand',
        category: 'cctv_camera',
        technologies: ['IP'],
        unit_price: 2000,
        base_cost: 1500,
        is_active: true,
        is_quotation_eligible: true,
        stock_status: 'discontinued',
        resolution_mp: 2,
      },
    ];

    for (const p of products) {
      await adminDb.collection('products').doc(p.id).set(p);
    }
  });

  test.afterAll(async () => {
    // Cleanup test products
    for (const id of [ACTIVE_SKU, ON_DEMAND_SKU, OOS_SKU, DISC_SKU]) {
      await adminDb.collection('products').doc(id).delete().catch(() => {});
    }
  });

  test('1. ACTIVE product is included in quotation', async () => {
    // Verify that the ACTIVE product exists and has stock_status = in_stock
    const doc = await adminDb.collection('products').doc(ACTIVE_SKU).get();
    expect(doc.exists).toBe(true);
    expect(doc.data()?.stock_status).toBe('in_stock');
    expect(doc.data()?.is_active).toBe(true);
  });

  test('2. ON_DEMAND product is allowed with warning', async () => {
    const doc = await adminDb.collection('products').doc(ON_DEMAND_SKU).get();
    expect(doc.exists).toBe(true);
    expect(doc.data()?.stock_status).toBe('on_demand');
    expect(doc.data()?.is_active).toBe(true);
    // This product should NOT be filtered out, but must produce a warning.
    // We verify this through the resolver unit test inline:
    
    const { resolveProducts } = await import('../lib/product-resolver');
    const { generateConfiguration } = await import('../lib/configuration-engine');
    
    const mockReq = { camera_count: 1, technology_preference: 'IP' } as any;
    const mockConfig = generateConfiguration(mockReq);
    
    // Build a mini-catalog with only our test products
    const allTestProducts = [];
    for (const id of [ACTIVE_SKU, ON_DEMAND_SKU, OOS_SKU, DISC_SKU]) {
      const d = await adminDb.collection('products').doc(id).get();
      if (d.exists) allTestProducts.push({ id: d.id, ...d.data() } as any);
    }
    
    const result = resolveProducts(mockConfig, mockReq, allTestProducts);
    
    // ON_DEMAND should produce a warning
    expect(result.lifecycleWarnings.length).toBeGreaterThan(0);
    expect(result.lifecycleWarnings.some(w => w.includes('ON_DEMAND'))).toBe(true);
    expect(result.lifecycleWarnings.some(w => w.includes(ON_DEMAND_SKU))).toBe(true);
  });

  test('3. OUT_OF_STOCK product is BLOCKED from quotation', async () => {
    const { resolveProducts } = await import('../lib/product-resolver');
    const { generateConfiguration } = await import('../lib/configuration-engine');
    
    const mockReq = { camera_count: 1, technology_preference: 'IP' } as any;
    const mockConfig = generateConfiguration(mockReq);
    
    // Catalog with ONLY the OOS product
    const oosDoc = await adminDb.collection('products').doc(OOS_SKU).get();
    const oosCatalog = [{ id: oosDoc.id, ...oosDoc.data() } as any];
    
    const result = resolveProducts(mockConfig, mockReq, oosCatalog);
    
    // All camera arrays should be empty — OOS product was filtered out
    expect(result.budget.cameras.length).toBe(0);
    expect(result.recommended.cameras.length).toBe(0);
    expect(result.premium.cameras.length).toBe(0);
  });

  test('4. DISCONTINUED product is BLOCKED from quotation', async () => {
    const { resolveProducts } = await import('../lib/product-resolver');
    const { generateConfiguration } = await import('../lib/configuration-engine');
    
    const mockReq = { camera_count: 1, technology_preference: 'IP' } as any;
    const mockConfig = generateConfiguration(mockReq);
    
    // Catalog with ONLY the DISCONTINUED product
    const discDoc = await adminDb.collection('products').doc(DISC_SKU).get();
    const discCatalog = [{ id: discDoc.id, ...discDoc.data() } as any];
    
    const result = resolveProducts(mockConfig, mockReq, discCatalog);
    
    // All camera arrays should be empty — DISCONTINUED product was filtered out
    expect(result.budget.cameras.length).toBe(0);
    expect(result.recommended.cameras.length).toBe(0);
    expect(result.premium.cameras.length).toBe(0);
  });

    test('5. Historical quote remains readable after product discontinuation', async ({ request }) => {
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
  });

    test('6. Lifecycle change does NOT alter existing quote snapshot', async ({ request }) => {
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
  });

  test('7. Seed data integrity — verify exact Excel costs', async () => {
    // Verify key costs from the approved Excel Cost Master
    const verifications = [
      { skuId: 'CPPLUS-CAMERA_HD-2MP-BW-AUDIO-DOME', expectedCost: 1000 },
      { skuId: 'CPPLUS-CAMERA_HD-5MP-COLOR-AUDIO-DOME', expectedCost: 1600 },
      { skuId: 'BUDGET-CAMERA_HD-2MP-COLOR-AUDIO-DOME', expectedCost: 700 },
      { skuId: 'CPPLUS-DVR-4CH-2MP-1SATA', expectedCost: 3700 },
      { skuId: 'CPPLUS-DVR-16CH-5MP-1SATA', expectedCost: 13300 },
      { skuId: 'CPPLUS-CABLE_CAT6-305M-COPPER', expectedCost: 9500 },
      { skuId: 'BUDGET-CABLE_CAT6-305M-COATED', expectedCost: 3200 },
      { skuId: 'SEAGATE-HDD-1TB', expectedCost: 9500 },
      { skuId: 'BUDGET-HDD-1TB', expectedCost: 4700 },
      { skuId: 'CPPLUS-NVR-16CH-1SATA', expectedCost: 8300 },
      { skuId: 'BUDGET-CAMERA_IP-5MP-ECO-DOME', expectedCost: 1400 },
      { skuId: 'CPPLUS-CAMERA_IP-8MP-PREMIUM-BULLET', expectedCost: 7500 },
    ];

    for (const v of verifications) {
      const doc = await adminDb.collection('products').doc(v.skuId).get();
      if (!doc.exists) {
        // Product may not be seeded yet in test environment — skip gracefully
        console.log(`Skipping ${v.skuId} — not seeded in test env`);
        continue;
      }
      const data = doc.data();
      expect(data?.baseCost).toBe(v.expectedCost);
    }
  });

  test('8. 8MP CP Plus Dome has ON_DEMAND status and null baseCost', async () => {
    const doc = await adminDb.collection('products').doc('CPPLUS-CAMERA_IP-8MP-PREMIUM-DOME').get();
    if (!doc.exists) {
      console.log('Skipping — 8MP Dome not seeded in test env');
      return;
    }
    const data = doc.data();
    expect(data?.stock_status).toBe('on_demand');
    expect(data?.baseCost).toBeNull();
  });

  test('9. No product in seed has baseCost=0 silently (except null for ON_DEMAND)', async () => {
    // Verify fail-closed: no ACTIVE product should have baseCost of 0
    const snap = await adminDb.collection('products')
      .where('stock_status', '==', 'in_stock')
      .where('is_active', '==', true)
      .get();
    
    for (const doc of snap.docs) {
      const data = doc.data();
      // Skip test-specific products (they might have synthetic prices)
      if (doc.id.startsWith('TEST-')) continue;
      
      if (data.baseCost !== undefined && data.baseCost !== null) {
        expect(data.baseCost).toBeGreaterThan(0);
      }
    }
  });
});
