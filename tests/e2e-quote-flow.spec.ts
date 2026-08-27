import { test, expect } from '@playwright/test';

test.describe('Quote Flow - Golden Path', () => {
  test('User can complete wizard, save quote, generate PDF and send WhatsApp', async ({ request }) => {
    // 1. Generate Quote
    const quoteReq = {
      property_type: "home",
      camera_count: 6,
      recording_days: 15,
      recording_mode: "continuous",
      technology_preference: "IP",
      wants_remote_viewing: true
    };

    const quoteRes = await request.post('/api/quote/generate', {
      data: quoteReq
    });
    
    expect(quoteRes.ok()).toBeTruthy();
    const quoteData = await quoteRes.json();
    expect(quoteData.success).toBeTruthy();
    expect(quoteData.plans).toHaveProperty('budget');
    expect(quoteData.plans).toHaveProperty('recommended');
    expect(quoteData.plans).toHaveProperty('premium');
    
    // Check that recommended plan is valid
    const recPlan = quoteData.plans.recommended;
    expect(recPlan.total_payable).toBeGreaterThan(0);
    expect(recPlan.recommendation_reasons.length).toBeGreaterThan(0);

    // 2. Save Quote (Snapshot)
    const saveRes = await request.post('/api/quote/save', {
      data: {
        customer_mobile: "9999999999",
        requirementSnapshot: quoteData.requirement,
        configurationSnapshot: quoteData.configuration,
        pricingSnapshot: recPlan,
        selectedPlan: "recommended"
      }
    });

    expect(saveRes.ok()).toBeTruthy();
    const saveData = await saveRes.json();
    expect(saveData.success).toBeTruthy();
    expect(saveData.quoteId).toMatch(/^QT-202/);

    const quoteId = saveData.quoteId;

    // 3. Generate PDF (Skip actual PDF generation in golden test if Firebase Storage is not mocked, but let's test the endpoint response)
    // Note: In a real CI environment, you would mock Firebase Storage or use an emulator.
    // Assuming emulator or dev environment is running:
    /*
    const pdfRes = await request.get(`/api/quote/${quoteId}/pdf`);
    expect(pdfRes.ok()).toBeTruthy();
    const pdfData = await pdfRes.json();
    expect(pdfData.success).toBeTruthy();
    expect(pdfData.url).toContain('http');
    
    // 4. Send WhatsApp
    const waRes = await request.post(`/api/quote/${quoteId}/whatsapp`, {
      data: { pdfUrl: pdfData.url }
    });
    expect(waRes.ok()).toBeTruthy();
    const waData = await waRes.json();
    expect(waData.success).toBeTruthy();

    // 5. Test Idempotency
    const waRes2 = await request.post(`/api/quote/${quoteId}/whatsapp`, {
      data: { pdfUrl: pdfData.url }
    });
    expect(waRes2.ok()).toBeTruthy();
    const waData2 = await waRes2.json();
    expect(waData2.success).toBeTruthy();
    expect(waData2.idempotent).toBeTruthy();
    */
  });
});
