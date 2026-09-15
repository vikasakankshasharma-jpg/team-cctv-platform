const { adminDb } = require('./lib/firebase-admin');
const { SETTINGS_DOC_ID } = require('./lib/firebase-client');

async function run() {
  const doc = await adminDb.collection('settings').doc('GLOBAL_SETTINGS').get();
  console.log('default_cable_length_per_camera:', doc.data()?.default_cable_length_per_camera);
}
run();
