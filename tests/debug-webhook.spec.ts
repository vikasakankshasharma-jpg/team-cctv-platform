import { test, expect } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

test('Check webhook 404', async ({ request }) => {
  const TEST_ID = Date.now().toString();
  const LEAD_ID = L_REV_;
  const cfPayload = {
    type: 'PAYMENT_SUCCESS_WEBHOOK',
    data: {
      order: {
        order_id: order_,
        order_amount: 5000,
        payment_amount: 5000,
        order_tags: { lead_id: LEAD_ID, quote_id: QUOTE_, type: 'INSTALLATION' }
      },
      payment: { payment_status: 'SUCCESS' }
    }
  };
  
  const cfRes = await request.post('/api/webhooks/cashfree', {
    data: cfPayload,
    headers: { 'x-webhook-signature': 'mock', 'x-test-bypass': 'true' }
  });
  console.log('Status:', cfRes.status());
  console.log('Body:', await cfRes.json());
});
