import { test, expect } from '@playwright/test';
import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

test.describe('P0: Firestore Security Rules (Zero-Trust Boundary)', () => {
  
  test.beforeAll(async () => {
    const rules = fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8');
    
    // Initialize the test environment (Requires Firebase Local Emulator running on default ports)
    testEnv = await initializeTestEnvironment({
      projectId: 'team-cctv-test',
      firestore: {
        rules,
      },
    });
  });

  test.afterAll(async () => {
    await testEnv.cleanup();
  });

  test.beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // 1. Unauthenticated Access Denial
  test('Unauthenticated user CANNOT read or write to operations data', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    
    // Attempt Read
    const inventoryRef = unauthedDb.collection('inventory').doc('cam_123');
    await assertFails(inventoryRef.get());
    
    const jobsRef = unauthedDb.collection('jobs').doc('job_123');
    await assertFails(jobsRef.get());

    // Attempt Write
    await assertFails(jobsRef.set({ status: 'completed' }));
  });

  // 2. Role-Based Access Controls (Sales vs Ops)
  test('SALES user CAN read jobs but CANNOT write them', async () => {
    const salesDb = testEnv.authenticatedContext('sales_user', { role: 'SALES' }).firestore();
    
    const jobsRef = salesDb.collection('jobs').doc('job_123');
    await assertSucceeds(jobsRef.get());

    // Write MUST fail (deny-by-default on mutations)
    await assertFails(jobsRef.set({ status: 'dispatched' }));
  });

  test('TECHNICIAN user CAN read serial_assets but CANNOT write them', async () => {
    const techDb = testEnv.authenticatedContext('tech_user', { role: 'TECHNICIAN' }).firestore();
    
    const assetRef = techDb.collection('serial_assets').doc('asset_123');
    await assertSucceeds(assetRef.get());

    // Write MUST fail
    await assertFails(assetRef.set({ status: 'INSTALLED' }));
  });

  // 3. Strict Mutation Denial (Even for Admins on core tables)
  test('SUPER_ADMIN CANNOT write directly to inventory via Client SDK', async () => {
    const adminDbClient = testEnv.authenticatedContext('admin_user', { role: 'SUPER_ADMIN' }).firestore();
    
    const inventoryRef = adminDbClient.collection('inventory').doc('cam_123');
    
    // Admin can read
    await assertSucceeds(inventoryRef.get());
    
    // Admin CANNOT write (must use backend API/Admin SDK)
    await assertFails(inventoryRef.set({ availableQty: 100 }));
  });

  // 4. Customer Access Controls
  test('CUSTOMER can ONLY read their own leads', async () => {
    // Seed data bypassing rules
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('leads').doc('lead_cust_1').set({ firebase_uid: 'cust_1' });
      await db.collection('leads').doc('lead_cust_2').set({ firebase_uid: 'cust_2' });
    });

    const custDb = testEnv.authenticatedContext('cust_1').firestore();
    
    // Own lead -> Allowed
    await assertSucceeds(custDb.collection('leads').doc('lead_cust_1').get());
    
    // Other's lead -> Denied
    await assertFails(custDb.collection('leads').doc('lead_cust_2').get());
    
    // Mutation -> Denied
    await assertFails(custDb.collection('leads').doc('lead_cust_1').update({ status: 'won' }));
  });

});
