import { test, expect } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

test.describe('P1 Sales / CRM Chain E2E (Row 21-25)', () => {
  const TEST_ID = Date.now().toString();
  const MOBILE = `99999${TEST_ID.slice(-5)}`;
  let LEAD_ID = '';
  let QUOTE_ID = '';
  let DEAL_ID = '';

  test.afterAll(async () => {
    // Cleanup
    if (LEAD_ID) {
       await adminDb.collection('leads').doc(LEAD_ID).delete();
       if (QUOTE_ID) {
          await adminDb.collection('leads').doc(LEAD_ID).collection('quotes').doc(QUOTE_ID).delete();
       }
    }
    if (QUOTE_ID) await adminDb.collection('quotes').doc(QUOTE_ID).delete();
    if (DEAL_ID) await adminDb.collection('deals').doc(DEAL_ID).delete();
  });

  test('Execute Sales/CRM Workflow', async ({ request }) => {
    // 1. Submit a Lead
    const leadPayload = {
      customer_name: 'CRM Tester',
      mobile_number: MOBILE,
      firebase_uid: `UID_${TEST_ID}`,
      property_type: 'home',
      technology_choice: 'IP',
      cabling_done: false,
      wizard_answers: { pincode: '302001', city: 'Jaipur', state: 'Rajasthan' }
    };

    const subRes1 = await request.post('/api/submissions', { data: leadPayload });
    expect(subRes1.status()).toBe(201);
    const subBody1 = await subRes1.json();
    LEAD_ID = subBody1.data.id;
    expect(LEAD_ID).toBeTruthy();

    // 3. Quote Generation
    // Mock the Quote in the DB directly to avoid complex product resolution in tests
    QUOTE_ID = `QT-${Date.now()}`;
    await adminDb.collection('quotes').doc(QUOTE_ID).set({
      customer_mobile: MOBILE,
      customer_name: "CRM Tester",
      leadId: LEAD_ID,
      status: "pending",
      pricingSnapshot: {
        total_cost: 2000,
        total_payable: 5000
      }
    });

    const rootDoc = await adminDb.collection('quotes').doc(QUOTE_ID).get();
    expect(rootDoc.exists).toBe(true);

    // 4. CRM Quote to Customer Approval (New Pipeline)
    const dealRes = await request.post('/api/crm/request-customer-approval', {
      data: {
        quoteId: QUOTE_ID,
        finalPrice: 5000,
        discountAmount: 100,
        grossProfit: 2000
      },
      headers: { Cookie: 'admin_session=mock_session_super_admin' }
    });
    expect(dealRes.status()).toBe(200);
    const dealBody = await dealRes.json();
    expect(dealBody.success).toBe(true);
    expect(dealBody.approvalLink).toBeDefined();

    // 5. CRM State Integrity Check
    const leadDoc = await adminDb.collection('leads').doc(LEAD_ID).get();
    expect(leadDoc.exists).toBe(true);
    const lead = leadDoc.data();
    
    expect(lead?.status).toBe('pending_customer_approval');
    expect(lead?.active_offer?.value).toBe(100);

    const updatedQuoteDoc = await adminDb.collection('quotes').doc(QUOTE_ID).get();
    const updatedQuote = updatedQuoteDoc.data();
    expect(updatedQuote?.status).toBe('pending_customer_approval');
    expect(updatedQuote?.negotiated_discount).toBe(100);
  });
});
