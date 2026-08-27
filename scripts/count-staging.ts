import { Firestore } from '@google-cloud/firestore';
const db = new Firestore({
  projectId: 'team-cctv-dr-drill',
  keyFilename: './temp-staging.json',
  databaseId: 'default'
});
async function run() {
  const collections = ['inventory', 'users', 'deals', 'invoices', 'tickets', 'customers', 'serial_assets'];
  console.log("=== STAGING COUNTS ===");
  for (const coll of collections) {
    const snap = await db.collection(coll).count().get();
    console.log(coll + ': ' + snap.data().count);
  }
}
run().catch(console.error);
