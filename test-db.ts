import { adminDb } from './lib/firebase-admin';
import { SETTINGS_DOC_ID } from './lib/firebase-client';

async function run() {
  const doc = await adminDb.collection('settings').doc(SETTINGS_DOC_ID).get();
  console.log('DB VALUE default_cable_length_per_camera:', doc.data()?.default_cable_length_per_camera);
}
run();
