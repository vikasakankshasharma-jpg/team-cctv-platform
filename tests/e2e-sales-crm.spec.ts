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

    // 2. Duplicate Submission Handling
    const subRes2 = await request.post('/api/submissions', { data: leadPayload });
    expect(subRes2.status()).toBe(201); // Can be 201 or 200, but should return SAME ID
    const subBody2 = await subRes2.json();
    
    // Assert Deduplication (Schema drift check!)
    expect(subBody2.data.id).toBe(LEAD_ID);

    // 3. Quote Generation
    // We use the canonical CRM quote endpoint: /api/quote/save
    const quotePayload = {
      customer_mobile: MOBILE,
      customer_name: "CRM Tester",
      leadId: LEAD_ID,
      leadStatus: "PENDING",
      configurationSnapshot: {
        resolvedSystem: {
          cameras: [],
          recorder: null,
          storage: null,
          accessories: []
        }
      },
      pricingSnapshot: {
        total_cost: 2000,
        total_payable: 5000
      },
      requirementSnapshot: {
        camera_count: 4
      },
      selectedPlan: "recommended"
    };
    
    const quoteRes = await request.post('/api/quote/save', { data: quotePayload });
    expect(quoteRes.status()).toBe(200);
    const quoteBody = await quoteRes.json();
    expect(quoteBody.success).toBe(true);
    QUOTE_ID = quoteBody.quoteId;

    // Check Quote Persistence Schema (Root must exist for CRM)
    const rootDoc = await adminDb.collection('quotes').doc(QUOTE_ID).get();
    expect(rootDoc.exists).toBe(true);

    // 4. CRM Quote to Deal Conversion
    // We'll hit the CRM endpoint to convert quote to deal
    const dealRes = await request.post('/api/crm/deals', {
      data: {
        quoteId: QUOTE_ID,
        finalPrice: 5000,
        discountAmount: 100,
        grossProfit: 2000
      },
      headers: { Cookie: 'admin_session=mock_session_cookie_ROLE_super_admin' }
    });
    expect(dealRes.status()).toBe(200);
    const dealBody = await dealRes.json();
    DEAL_ID = dealBody.dealId;

    // 5. Deal Integrity Check
    const dealDoc = await adminDb.collection('deals').doc(DEAL_ID).get();
    expect(dealDoc.exists).toBe(true);
    const deal = dealDoc.data();
    
    // CRM must store leadId consistently!
    expect(deal?.leadId).toBe(LEAD_ID);
    expect(deal?.quoteSnapshotId).toBe(QUOTE_ID);
  });
});
