import { test, expect } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

test.describe('P1 AMC & Service Lifecycle (Rows 31-34)', () => {
  const TEST_ID = Date.now().toString();
  const CUSTOMER_ID = `CUST_${TEST_ID}`;
  const ASSET_ID = `ASSET_${TEST_ID}`;
  const AMC_PLAN_ID = `AMC_PLAN_${TEST_ID}`;
  
  let INSTALL_JOB_ID = '';
  let AMC_CONTRACT_ID = '';
  let TICKET_ID = '';
  let SERVICE_JOB_ID = '';

  test.beforeAll(async () => {
    // 1. Seed AMC Plan
    await adminDb.collection('amc_plans').doc(AMC_PLAN_ID).set({
      name: "Gold Security Plan",
      durationMonths: 12,
      price: 2500,
      includedVisits: 4,
      emergencyVisits: 1,
      labourIncluded: true,
      consumablesIncluded: true,
      hardwareReplacementIncluded: false,
      remoteSupport: true,
      isActive: true,
    });

    // 1.5 Seed Deal
    await adminDb.collection('deals').doc(`DEAL_${TEST_ID}`).set({
      id: `DEAL_${TEST_ID}`,
      status: "PENDING_INSTALL"
    });

    // 2. Seed Initial Install Job
    const jobRef = adminDb.collection('jobs').doc();
    INSTALL_JOB_ID = jobRef.id;
    await jobRef.set({
      id: INSTALL_JOB_ID,
      type: "INSTALLATION",
      customerId: CUSTOMER_ID,
      dealId: `DEAL_${TEST_ID}`,
      status: "PENDING_SCHEDULE",
      bomCameras: [{ product: { id: "CAM1", isSerialized: true }, quantity: 1 }],
      address: { pincode: '302001' }
    });

    // 3. Seed Inventory for Install
    await adminDb.collection('inventory').doc("CAM1").set({ availableQty: 10, reservedQty: 0, costPrice: 100 });
    await adminDb.collection('products').doc("CAM1").set({ id: "CAM1", type: "camera", isSerialized: true, warrantyPolicy: { customerWarrantyMonths: 12 } });
    await adminDb.collection('serial_assets').doc("SN_CAM1").set({ skuId: "CAM1", serialNumber: ASSET_ID, status: "IN_STOCK" });
  });

  test.afterAll(async () => {
    // Cleanup
    await adminDb.collection('amc_plans').doc(AMC_PLAN_ID).delete();
    await adminDb.collection('deals').doc(`DEAL_${TEST_ID}`).delete();
    await adminDb.collection('jobs').doc(INSTALL_JOB_ID).delete();
    await adminDb.collection('inventory').doc("CAM1").delete();
    await adminDb.collection('products').doc("CAM1").delete();
    await adminDb.collection('serial_assets').doc("SN_CAM1").delete();
    await adminDb.collection('serial_assets').doc(ASSET_ID).delete();
    if (AMC_CONTRACT_ID) await adminDb.collection('amc_contracts').doc(AMC_CONTRACT_ID).delete();
    if (TICKET_ID) await adminDb.collection('service_tickets').doc(TICKET_ID).delete();
    if (SERVICE_JOB_ID) await adminDb.collection('jobs').doc(SERVICE_JOB_ID).delete();
  });

  test('Execute AMC Creation and Visit Deduction', async ({ request }) => {
    // 1. Schedule Install Job
    const scheduleRes = await request.patch(`/api/operations/jobs/${INSTALL_JOB_ID}`, {
      data: { status: 'SCHEDULED' },
      headers: { Cookie: 'admin_session=mock_session_cookie_ROLE_super_admin' }
    });
    expect(scheduleRes.status()).toBe(200);

    // 2. Complete Install Job with AMC Attachment
    const completeRes = await request.patch(`/api/operations/jobs/${INSTALL_JOB_ID}`, {
      data: {
        status: 'COMPLETED',
        serials: { "CAM1": [ASSET_ID] },
        amcPlanId: AMC_PLAN_ID,
        amcAgreedPrice: 2000
      },
      headers: { Cookie: 'admin_session=mock_session_cookie_ROLE_super_admin' }
    });
    expect(completeRes.status()).toBe(200);

    // 3. Verify AMC Contract Created
    const amcSnap = await adminDb.collection('amc_contracts').where('customerId', '==', CUSTOMER_ID).get();
    expect(amcSnap.empty).toBe(false);
    const amc = amcSnap.docs[0].data();
    AMC_CONTRACT_ID = amcSnap.docs[0].id;
    expect(amc.usedVisits).toBe(0);
    expect(amc.includedVisits).toBe(4);
    expect(amc.status).toBe('ACTIVE');

    // 4. Create Service Ticket (Should auto-detect AMC Coverage)
    const ticketRes = await request.post('/api/operations/tickets', {
      data: {
        customerId: CUSTOMER_ID,
        category: "TECHNICAL_ISSUE",
        priority: "HIGH",
        affectedAssetIds: [ASSET_ID],
        description: "Camera not recording"
      },
      headers: { Cookie: 'admin_session=mock_session_cookie_ROLE_super_admin' }
    });
    expect(ticketRes.status()).toBe(200);
    const ticketBody = await ticketRes.json();
    TICKET_ID = ticketBody.data.id;
    
    const ticketDoc = await adminDb.collection('service_tickets').doc(TICKET_ID).get();
    const ticketData = ticketDoc.data();
    expect(ticketData?.billingType).toBe('AMC'); // Because AMC is active!
    expect(ticketData?.amcContractId).toBe(AMC_CONTRACT_ID);

    // 5. Create Service Job against Ticket
    // Note: Our manual API for service jobs isn't explicitly tested here, 
    // so we'll mock the Service Job creation directly to test the COMPLETE step (Visit Deduction)
    SERVICE_JOB_ID = `SVC_JOB_${TEST_ID}`;
    await adminDb.collection('jobs').doc(SERVICE_JOB_ID).set({
       type: "service",
       serviceTicketId: TICKET_ID,
       status: "PENDING_SCHEDULE"
    });

    const schSvcRes = await request.patch(`/api/operations/jobs/${SERVICE_JOB_ID}`, { 
      data: { status: 'SCHEDULED' },
      headers: { Cookie: 'admin_session=mock_session_cookie_ROLE_super_admin' }
    });
    expect(schSvcRes.status()).toBe(200);

    // 6. Complete Service Job (Should deduct AMC Visit)
    const compSvcRes = await request.patch(`/api/operations/jobs/${SERVICE_JOB_ID}`, {
      data: { status: 'COMPLETED' },
      headers: { Cookie: 'admin_session=mock_session_cookie_ROLE_super_admin' }
    });
    expect(compSvcRes.status()).toBe(200);

    // 7. Verify AMC Visit Deducted
    const amcDocFinal = await adminDb.collection('amc_contracts').doc(AMC_CONTRACT_ID).get();
    expect(amcDocFinal.data()?.usedVisits).toBe(1);

    // Verify Service Ticket is Resolved
    const ticketDocFinal = await adminDb.collection('service_tickets').doc(TICKET_ID).get();
    expect(ticketDocFinal.data()?.status).toBe('RESOLVED');
  });
});
