import { test, expect, request } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

test.describe.serial('Phase 4D: Admin Pricing API & Immutable Contracts', () => {
  const productId = `PROD-ADMIN-${Date.now()}`;
  const oldQuoteId = `QT-ADMIN-${Date.now()}`;

  test.beforeAll(async () => {
    // Seed product
    await adminDb.collection("products").doc(productId).set({
      id: productId,
      base_cost: 1000,
      stock_status: "in_stock",
      is_quotation_eligible: true
    });

    // Seed Quote (Snapshot should be immutable)
    await adminDb.collection("quotes").doc(oldQuoteId).set({
      id: oldQuoteId,
      items: [
        { product_id: productId, qty: 1, unit_price: 1500, base_cost_at_quote: 1000 }
      ],
      total_payable: 1770
    });
  });

  test('1. RBAC Isolation: Customers & Installers cannot mutate pricing', async ({ request }) => {
    // Customer
    const res1 = await request.post(`/api/admin/pricing/products/${productId}`, {
      headers: { cookie: 'admin_session=mock_session_customer_UID_1' },
      data: { base_cost: 2000 }
    });
    expect(res1.status()).toBe(403);

    // Installer
    const res2 = await request.post(`/api/admin/pricing/products/${productId}`, {
      headers: { cookie: 'admin_session=mock_session_installer_UID_2' },
      data: { base_cost: 2000 }
    });
    expect(res2.status()).toBe(403);
    
    // Sales staff read-only (POST config should fail)
    const res3 = await request.post(`/api/admin/pricing/config`, {
      headers: { cookie: 'admin_session=mock_session_sales_staff_UID_3' },
      data: { site_preparation: { ladderArrangementFee: 600 } }
    });
    expect(res3.status()).toBe(403);
  });

  test('2. Admin Mutation & Audit Trail', async ({ request }) => {
    // Admin updates product
    const resProd = await request.post(`/api/admin/pricing/products/${productId}`, {
      headers: { cookie: 'admin_session=mock_session_super_admin_UID_admin1' },
      data: { base_cost: 1200, stock_status: "ON_DEMAND" }
    });
    expect(resProd.ok()).toBeTruthy();

    const prodDoc = await adminDb.collection("products").doc(productId).get();
    expect(prodDoc.data()?.base_cost).toBe(1200);
    expect(prodDoc.data()?.stock_status).toBe("ON_DEMAND");

    // Verify Audit
    const auditSnap = await adminDb.collection("audit_logs")
      .where("entity_id", "==", productId)
      .where("action", "==", "price_or_status_updated")
      .get();
    expect(auditSnap.empty).toBe(false);

    // Admin updates config
    const resConfig = await request.post(`/api/admin/pricing/config`, {
      headers: { cookie: 'admin_session=mock_session_super_admin_UID_admin1' },
      data: { site_preparation: { ladderArrangementFee: 700 } }
    });
    expect(resConfig.ok()).toBeTruthy();

    const configDoc = await adminDb.collection("app_config").doc("pricing_engine").get();
    expect(configDoc.data()?.site_preparation?.ladderArrangementFee).toBe(700);
  });

  test('3. Immutability: Master price change does NOT affect existing Quote', async () => {
    // Check old quote
    const quoteDoc = await adminDb.collection("quotes").doc(oldQuoteId).get();
    const item = quoteDoc.data()?.items[0];

    // Master base_cost is now 1200, but quote MUST remain 1000
    expect(item.base_cost_at_quote).toBe(1000);
    expect(item.unit_price).toBe(1500);
    expect(quoteDoc.data()?.total_payable).toBe(1770);
  });

  test('4. Config API returns updated config', async ({ request }) => {
    const res = await request.get(`/api/admin/pricing/config`, {
      headers: { cookie: 'admin_session=mock_session_super_admin_UID_admin1' }
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    
    expect(json.data.site_preparation.ladderArrangementFee).toBe(700);
  });
});
