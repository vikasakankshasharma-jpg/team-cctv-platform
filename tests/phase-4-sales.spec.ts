import { test, expect } from '@playwright/test';

test.describe('Phase 4 Sales Workflow', () => {
  let createdQuoteId: string;

  test('Test 1: Manual Quote generation appears in CRM', async ({ request }) => {
    // 1. Generate a manual quote
    const manualQuoteBody = {
      items: [
        { product_id: "test-cam", display_name: "5MP Camera", brand: "TestBrand", qty: 4, unit_price: 2000, line_total: 8000 }
      ],
      subtotal: 8000,
      total_payable: 8000,
      installation_cost: 0,
      discount_amount: 0,
      discount_percent: 0,
      note: "Test manual note"
    };

    const saveRes = await request.post('/api/quotes/manual', {
      data: manualQuoteBody
    });
    
    expect(saveRes.status()).toBe(201);
    const saveData = await saveRes.json();
    createdQuoteId = saveData.id;
    expect(createdQuoteId).toContain('QT-');

    // 2. Check if it appears in Lead Management (GET /api/crm/quotes)
    const leadsRes = await request.get('/api/crm/quotes');
    expect(leadsRes.status()).toBe(200);
    const leadsData = await leadsRes.json();
    
    const ourLead = leadsData.data.find((l: any) => l.id === createdQuoteId);
    expect(ourLead).toBeDefined();
    expect(ourLead.source).toBe('manual');
    expect(ourLead.leadStatus).toBe('NEW');
    expect(ourLead.total_payable).toBe(8000);
  });

  test('Test 2: Follow-up appending and Status Transition', async ({ request }) => {
    expect(createdQuoteId).toBeDefined();
    
    // 1. Add follow up
    const followUpRes = await request.post(`/api/crm/quotes/${createdQuoteId}/followup`, {
      data: {
        note: "Called customer, wants discount",
        nextFollowUpDate: "2026-10-15"
      }
    });
    expect(followUpRes.status()).toBe(200);

    // 2. Verify state transition and follow-up was appended
    const detailRes = await request.get(`/api/crm/quotes/${createdQuoteId}`);
    expect(detailRes.status()).toBe(200);
    const detailData = await detailRes.json();
    
    expect(detailData.data.leadStatus).toBe('FOLLOW_UP'); // Transitioned automatically
    expect(detailData.data.follow_ups.length).toBe(1);
    expect(detailData.data.follow_ups[0].note).toBe("Called customer, wants discount");
  });

  test('Test 3: Lead Status Manual Update', async ({ request }) => {
    // 1. Change status to WON
    const updateRes = await request.patch(`/api/crm/quotes/${createdQuoteId}`, {
      data: { leadStatus: "WON" }
    });
    expect(updateRes.status()).toBe(200);

    // 2. Verify update
    const detailRes = await request.get(`/api/crm/quotes/${createdQuoteId}`);
    expect(detailRes.status()).toBe(200);
    const detailData = await detailRes.json();
    expect(detailData.data.leadStatus).toBe('WON');
  });
});
