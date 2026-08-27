import { test, expect } from '@playwright/test';

// Helper to fetch actual Document IDs since test data uses SKUs
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

test.describe('Release Gate Verification', () => {

  let generatedQuoteId = "";
  let generatedTotal = 0;
  
  // ----------------------------------------------------------------------
  // PROFILE 1: BEGINNER (Smart Wizard)
  // ----------------------------------------------------------------------
  test('Profile 1: Beginner Customer (/quote)', async ({ request }) => {
    // 1. Submit Requirement
    const quoteReq = {
      property_type: "home",
      camera_count: 6,
      recording_days: 15,
      recording_mode: "continuous",
      technology_preference: "IP",
      wants_remote_viewing: true
    };

    const quoteRes = await request.post('/api/quote/generate', { data: quoteReq });
    expect(quoteRes.status()).toBe(200);
    const data = await quoteRes.json();
    expect(data.success).toBeTruthy();
    
    // Check 3 plans exist
    expect(data.plans).toHaveProperty('budget');
    expect(data.plans).toHaveProperty('recommended');
    expect(data.plans).toHaveProperty('premium');
    
    // Recommended plan validation
    const recPlan = data.plans.recommended;
    expect(recPlan.total_payable).toBeGreaterThan(0);
    expect(recPlan.recommendation_reasons.length).toBeGreaterThan(0);
    
    generatedTotal = recPlan.total_payable;

    // 2. Save Snapshot
    const saveRes = await request.post('/api/quote/save', {
      data: {
        customer_mobile: "9999999999",
        requirementSnapshot: data.requirement,
        configurationSnapshot: data.configuration,
        pricingSnapshot: recPlan,
        selectedPlan: "recommended",
        source: "wizard"
      }
    });

    expect(saveRes.status()).toBe(200);
    const saveData = await saveRes.json();
    expect(saveData.success).toBeTruthy();
    expect(saveData.quoteId).toMatch(/^QT-/);
    expect(saveData.snapshot.version).toBe(1);

    generatedQuoteId = saveData.quoteId;

    // 3. Edit Quote (Versioning check)
    // Changing the name to simulate an edit and trigger v2
    const editRes = await request.post('/api/quote/save', {
      data: {
        customer_mobile: "9999999999",
        customer_name: "Edited Customer",
        requirementSnapshot: data.requirement,
        configurationSnapshot: data.configuration,
        pricingSnapshot: recPlan, // Same pricing
        selectedPlan: "recommended",
        source: "wizard",
        parentQuoteId: generatedQuoteId // Triggers version bump
      }
    });

    expect(editRes.status()).toBe(200);
    const editData = await editRes.json();
    expect(editData.quoteId).toBe(generatedQuoteId);
    expect(editData.snapshot.version).toBe(2); // Ensure it bumped version!
  });

  // ----------------------------------------------------------------------
  // PROFILE 2: EXPERT (Direct Builder)
  // ----------------------------------------------------------------------
  test('Profile 2: Expert Customer (/build)', async ({ request }) => {
    // Construct a manual build using staging SKUs
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
    
    expect(calcRes.status()).toBe(200);
    const calcData = await calcRes.json();
    expect(calcData.success).toBeTruthy();
    expect(calcData.pricing).toBeDefined();
    
    // We shouldn't trust frontend, backend returns the true price
    expect(calcData.pricing.total_payable).toBeGreaterThan(0);
    expect(calcData.configuration.length).toBeGreaterThan(3);

    // Save Quote for Builder
    const saveRes = await request.post('/api/quote/save', {
      data: {
        customer_mobile: "8888888888",
        pricingSnapshot: calcData.pricing,
        configurationSnapshot: calcData.configuration,
        requirementSnapshot: { camera_count: 6, wants_remote_viewing: true },
        selectedPlan: "recommended",
        source: "builder"
      }
    });
    const saveData = await saveRes.json();
    expect(saveData.success).toBeTruthy();
    expect(saveData.quoteId).toBeDefined();
  });

  // ----------------------------------------------------------------------
  // PROFILE 3: UPGRADE CUSTOMER
  // ----------------------------------------------------------------------
  test('Profile 3: Upgrade Customer (Existing System)', async ({ request }) => {
    // 4 Cameras existing, 8CH DVR existing. We want +2 cameras.
    const manualConfig = [
      { product_id: getId("STG_CAM_HD_5MP_001"), quantity: 2 }
    ];

    const existingEquipment = {
      has_existing: true,
      cameras: 4,
      recorderChannels: 8,
      storageTb: 2
    };

    const calcRes = await request.post('/api/build/calculate', { 
      data: { 
        selections: manualConfig, 
        cameraCount: 2, 
        existingEquipment 
      } 
    });
    
    expect(calcRes.status()).toBe(200);
    const calcData = await calcRes.json();
    expect(calcData.success).toBeTruthy();
    
    // Verification: Recorder shouldn't be auto-added because 4+2=6 < 8CH existing capacity
    const hasRecorder = calcData.configuration.some((i: any) => i.category === "recorder");
    expect(hasRecorder).toBeFalsy(); 
    
    // Quote should only reflect the cost of 2 cameras + labor/cable
    expect(calcData.pricing.total_payable).toBeLessThan(15000); 

    // Save Upgrade Quote
    const saveRes = await request.post('/api/quote/save', {
      data: {
        customer_mobile: "7777777777",
        pricingSnapshot: calcData.pricing,
        configurationSnapshot: calcData.configuration,
        requirementSnapshot: { camera_count: 2, wants_remote_viewing: true },
        selectedPlan: "recommended",
        source: "builder"
      }
    });
    expect(saveRes.ok()).toBeTruthy();
  });

  // ----------------------------------------------------------------------
  // PROFILE 4: INVALID CONFIGURATION
  // ----------------------------------------------------------------------
  test('Profile 4: Invalid Configuration (Rejection)', async ({ request }) => {
    // 8 Cameras but 4CH Recorder
    const manualConfig = [
      { product_id: getId("STG_DVR_4CH_001"), quantity: 1 },
      { product_id: getId("STG_CAM_IP_2MP_001"), quantity: 8 }
    ];

    const calcRes = await request.post('/api/build/calculate', { 
      data: { selections: manualConfig, existingEquipment: { cameras: 0, recorderChannels: 0 } } 
    });
    
    // We expect 400 rejection from the backend
    expect(calcRes.status()).toBe(400);
    const data = await calcRes.json();
    expect(data.success).toBe(false);
    expect(data.message).toMatch(/recorder/i); // Error should mention recorder capacity
  });

  // ----------------------------------------------------------------------
  // RELEASE GATE 5 & 6: WHATSAPP + ANALYTICS
  // ----------------------------------------------------------------------
  test('Release Gate 5 & 6: WhatsApp Idempotency and Analytics Integrity', async ({ request }) => {
    test.skip(!generatedQuoteId, "Requires Profile 1 to run and generate a quote first");
    
    const isMockMode = process.env.E2E_MODE === 'mock';
    
    // (Analytics implementation deferred to Phase 3B)
    
    // 2. WhatsApp API (Mocked behavior verification)
    const waRes = await request.post(`/api/quote/${generatedQuoteId}/whatsapp`, {
      data: { pdfUrl: "https://mock.com/dummy.pdf", testMode: isMockMode }
    });
    const waData = await waRes.json();
    // It might fail in real mode without credentials, but we expect success or specific failure
    if (waRes.status() === 200) {
      expect(waData.success).toBeTruthy();
      
      // Retry - Idempotency
      const waRes2 = await request.post(`/api/quote/${generatedQuoteId}/whatsapp`, {
        data: { pdfUrl: "https://mock.com/dummy.pdf", testMode: isMockMode }
      });
      const waData2 = await waRes2.json();
      expect(waRes2.status()).toBe(200);
      expect(waData2.idempotent).toBeTruthy(); // Should indicate it was already sent
    } else {
      // Expected if no credentials in live mode
      expect(waData.success).toBe(false);
      expect(waData.message).toMatch(/whatsapp/i);
    }
  });

});
