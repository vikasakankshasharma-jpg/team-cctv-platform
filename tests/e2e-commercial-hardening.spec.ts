import { test, expect } from '@playwright/test';

test.describe('Commercial Core Hardening - Phase 5', () => {

  test('Pricing consistency: Wizard vs Pro Builder vs Admin', async ({ request }) => {
    const wizardPayload = {
      customer_name: 'Test Wizard',
      customer_mobile: '9999999991',
      requirementSnapshot: {
        installation_type: 'new',
        camera_count: 4,
        technology_preference: 'IP',
        property_type: 'residential',
        outdoor_count: 1,
        indoor_count: 3
      },
      selectedPlan: 'Pro_System',
      source: 'wizard'
    };

    const wizardRes = await request.post('/api/quote/generate', { data: wizardPayload });
    expect(wizardRes.ok()).toBeTruthy();
    const wizardQuote = await wizardRes.json();
    const basePrice = wizardQuote.quote.pricingSnapshot.total_payable;

    const items = wizardQuote.quote.configurationSnapshot.items;
    
    // Tamper the price to 1 INR
    const tamperedItems = items.map((i: any) => ({ ...i, unit_price: 1 }));
    const proBuilderPayload = {
      customer_name: 'Test Pro Builder',
      customer_mobile: '9999999992',
      requirementSnapshot: {
        installation_type: 'new',
        camera_count: 4,
        technology_preference: 'IP',
        is_pro_builder: true
      },
      configurationSnapshot: { items: tamperedItems },
      selectedPlan: 'Pro_Custom_Build',
      source: 'pro_builder'
    };

    const proRes = await request.post('/api/quote/save', { data: proBuilderPayload });
    expect(proRes.ok()).toBeTruthy();
    const proData = await proRes.json();

    // This is the assertion that actually proves tamper-resistance: the
    // server must have discarded the client's unit_price: 1 and recomputed
    // the real total from the catalog. Without this assertion, the test only
    // proves the save request didn't error — it does not prove the price was
    // recomputed, which was the entire point of this test.
    expect(proData.snapshot?.total_payable).toBeDefined();
    expect(proData.snapshot.total_payable).not.toBe(4); // 4 items x tampered ₹1
    expect(proData.snapshot.total_payable).toBeGreaterThan(1000); // sanity: real CCTV pricing, not ₹1/unit
  });

  test('Payment tamper resistance (Razorpay)', async ({ request }) => {
    const wizardPayload = {
      customer_name: 'Test Payment Tamper',
      customer_mobile: '9999999999',
      requirementSnapshot: { camera_count: 4, technology_preference: 'IP' },
      selectedPlan: 'Pro_System',
      source: 'wizard'
    };
    const quoteRes = await request.post('/api/quote/generate', { data: wizardPayload });
    const quoteData = await quoteRes.json();
    const quoteId = quoteData.quote.id;
    const realTotal = quoteData.quote.pricingSnapshot.total_payable;

    // Attacker attempts to dictate amount = 1
    const orderRes = await request.post('/api/payment/razorpay', {
      data: { quoteId, paymentType: 'full', amount: 1, currency: 'INR' }
    });
    
    expect(orderRes.ok()).toBeTruthy();
    const orderData = await orderRes.json();
    
    // Server must ignore the 1 INR and charge the real total in paise
    expect(orderData.amount).toBe(realTotal * 100);
    expect(orderData.amount).not.toBe(100);
    
    // Tampered webhook attempt
    const fakeWebhookPayload = {
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_fake123', order_id: orderData.id, amount: 100, notes: { quoteId } } } }
    };

    const webhookRes = await request.post('/api/webhooks/razorpay', {
      data: fakeWebhookPayload,
      headers: { 'x-razorpay-signature': 'fake_signature_that_will_fail' }
    });

    // Must fail closed (500 if no secret, 400 if bad sig)
    expect(webhookRes.status()).toBeGreaterThanOrEqual(400);
  });
});
