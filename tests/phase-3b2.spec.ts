import { test, expect } from '@playwright/test';

let skuToIdMap: Record<string, string> = {};

test.beforeAll(async ({ request }) => {
  const res = await request.get('/api/build/products');
  if (res.ok()) {
    const data = await res.json();
    data.products.forEach((p: any) => {
      if (p.sku) skuToIdMap[p.sku] = p.id;
    });
  }
});

function getId(sku: string) {
  return skuToIdMap[sku] || sku;
}

test.describe('Phase 3B.2 Manual Golden Tests', () => {

  test('Test 1: Beginner / Smart Wizard', async ({ request }) => {
    const sessionId = "sess-beginner-" + Date.now();
    
    // 1. Wizard Started
    await request.post('/api/analytics/track', { data: { sessionId, source: "wizard", eventType: "SESSION_START", step: 1 } });
    
    // Progress Steps
    await request.post('/api/analytics/track', { data: { sessionId, source: "wizard", eventType: "STEP_VIEWED", step: 2 } });
    await request.post('/api/analytics/track', { data: { sessionId, source: "wizard", eventType: "STEP_VIEWED", step: 3 } });
    await request.post('/api/analytics/track', { data: { sessionId, source: "wizard", eventType: "STEP_VIEWED", step: 4 } });
    
    // Generate Quote
    const quoteReq = {
      property_type: "home",
      camera_count: 4,
      recording_days: 15,
      recording_mode: "continuous",
      technology_preference: "IP",
      wants_remote_viewing: true
    };
    const genRes = await request.post('/api/quote/generate', { data: quoteReq });
    const genData = await genRes.json();
    
    // Save Quote
    const saveRes = await request.post('/api/quote/save', {
      data: {
        customer_mobile: "9999999991",
        requirementSnapshot: genData.requirement,
        configurationSnapshot: genData.configuration,
        pricingSnapshot: genData.plans.recommended,
        selectedPlan: "recommended",
        source: "wizard"
      }
    });
    const saveData = await saveRes.json();
    
    // 2. Quote Generated Analytics
    await request.post('/api/analytics/track', { data: { sessionId, source: "wizard", eventType: "QUOTE_GENERATED", metadata: { quoteId: saveData.quoteId } } });

    // 3. PDF
    const pdfRes = await request.get(`/api/quote/${saveData.quoteId}/pdf`);
    const pdfData = await pdfRes.json();
    expect(pdfData.success).toBeTruthy();
    expect(pdfData.url).toContain('/download');

    // Verify it is downloadable
    const relativeUrl = new URL(pdfData.url).pathname;
    const downloadRes = await request.get(relativeUrl);
    expect(downloadRes.status()).toBe(200);
    expect(downloadRes.headers()['content-type']).toContain('application/pdf');
    
    // 4. WhatsApp
    const waRes = await request.post(`/api/quote/${saveData.quoteId}/whatsapp`, { data: { pdfUrl: pdfData.url, testMode: true } });
    expect(waRes.ok()).toBeTruthy();
  });

  test('Test 2: Higher-value Wizard', async ({ request }) => {
    const sessionId = "sess-highvalue-" + Date.now();
    await request.post('/api/analytics/track', { data: { sessionId, source: "wizard", eventType: "SESSION_START", step: 1 } });
    await request.post('/api/analytics/track', { data: { sessionId, source: "wizard", eventType: "STEP_VIEWED", step: 4 } });
    
    const quoteReq = {
      camera_count: 8,
      recording_days: 30,
      recording_mode: "continuous",
      technology_preference: "IP", // Assume 8MP requested implies Premium plan
      wants_remote_viewing: true
    };
    const genRes = await request.post('/api/quote/generate', { data: quoteReq });
    const genData = await genRes.json();
    
    const saveRes = await request.post('/api/quote/save', {
      data: {
        customer_mobile: "9999999992",
        requirementSnapshot: genData.requirement,
        configurationSnapshot: genData.configuration,
        pricingSnapshot: genData.plans.premium,
        selectedPlan: "premium",
        source: "wizard"
      }
    });
    const saveData = await saveRes.json();
    await request.post('/api/analytics/track', { data: { sessionId, source: "wizard", eventType: "QUOTE_GENERATED", metadata: { quoteId: saveData.quoteId } } });
  });

  test('Test 3: Expert Direct Builder', async ({ request }) => {
    const sessionId = "sess-expert-" + Date.now();
    await request.post('/api/analytics/track', { data: { sessionId, source: "builder", eventType: "SESSION_START", step: 0 } });
    
    const manualConfig = [
      { product_id: getId("STG_DVR_8CH_001"), quantity: 1 },
      { product_id: getId("STG_HDD_2TB_001"), quantity: 1 },
      { product_id: getId("STG_CAM_IP_5MP_001"), quantity: 4 },
      { product_id: getId("STG_CAM_IP_2MP_001"), quantity: 2 },
      { product_id: getId("STG_CAB_CAT6_001"), quantity: 2 }
    ];

    const calcRes = await request.post('/api/build/calculate', { 
      data: { selections: manualConfig, existingEquipment: { cameras: 0, recorderChannels: 0 } } 
    });
    const calcData = await calcRes.json();
    
    const saveRes = await request.post('/api/quote/save', {
      data: {
        customer_mobile: "9999999993",
        pricingSnapshot: calcData.pricing,
        configurationSnapshot: calcData.configuration,
        requirementSnapshot: { camera_count: 6, wants_remote_viewing: true },
        selectedPlan: "recommended",
        source: "builder"
      }
    });
    const saveData = await saveRes.json();
    await request.post('/api/analytics/track', { data: { sessionId, source: "builder", eventType: "QUOTE_GENERATED", metadata: { quoteId: saveData.quoteId } } });
  });

  test('Test 4: Existing System / Upgrade', async ({ request }) => {
    const sessionId = "sess-upgrade-" + Date.now();
    await request.post('/api/analytics/track', { data: { sessionId, source: "builder", eventType: "SESSION_START", step: 0 } });
    
    const manualConfig = [
      { product_id: getId("STG_CAM_HD_5MP_001"), quantity: 2 }
    ];
    const existingEquipment = { has_existing: true, cameras: 4, recorderChannels: 8, storageTb: 2 };
    
    const calcRes = await request.post('/api/build/calculate', { 
      data: { selections: manualConfig, existingEquipment } 
    });
    const calcData = await calcRes.json();
    
    const saveRes = await request.post('/api/quote/save', {
      data: {
        customer_mobile: "9999999994",
        pricingSnapshot: calcData.pricing,
        configurationSnapshot: calcData.configuration,
        requirementSnapshot: { camera_count: 2, wants_remote_viewing: true, existing_equipment: existingEquipment },
        selectedPlan: "recommended",
        source: "builder"
      }
    });
    const saveData = await saveRes.json();
    await request.post('/api/analytics/track', { data: { sessionId, source: "builder", eventType: "QUOTE_GENERATED", metadata: { quoteId: saveData.quoteId } } });
  });

  test('Test 5: Invalid Configuration', async ({ request }) => {
    const sessionId = "sess-invalid-" + Date.now();
    await request.post('/api/analytics/track', { data: { sessionId, source: "builder", eventType: "SESSION_START", step: 0 } });
    
    const manualConfig = [
      { product_id: getId("STG_DVR_4CH_001"), quantity: 1 },
      { product_id: getId("STG_CAM_IP_2MP_001"), quantity: 8 }
    ];

    const calcRes = await request.post('/api/build/calculate', { 
      data: { selections: manualConfig, existingEquipment: { cameras: 0, recorderChannels: 0 } } 
    });
    expect(calcRes.status()).toBe(400);
    const calcData = await calcRes.json();
    
    // Log validation_failed
    await request.post('/api/analytics/track', { data: { sessionId, source: "builder", eventType: "validation_failed", metadata: { error: calcData.message } } });
  });

  test('Test 6: Verify Dashboard Reconciliation', async ({ request }) => {
    const rejRes = await request.get('/api/analytics/rejections');
    const rejData = await rejRes.json();
    
    // Check taxonomy
    expect(rejData.data.breakdown["RECORDER_CAPACITY_EXCEEDED"]).toBeDefined();
    
    const funRes = await request.get('/api/analytics/funnel');
    const funData = await funRes.json();
    expect(funData.data.totalStarted).toBeGreaterThanOrEqual(2);
    // Since 2 wizard sessions were generated successfully
    expect(funData.data.quoteGenerated).toBeGreaterThanOrEqual(2);
  });
});
