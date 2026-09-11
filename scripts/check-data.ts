import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { adminDb } from '../lib/firebase-admin';

async function run() {
  const leads = await adminDb.collection('leads').get();
  console.log('--- LEADS ---');
  leads.forEach(doc => console.log(doc.id, ':', doc.data().customer_name, '|', doc.data().mobile_number));
  
  const prods = await adminDb.collection('products').get();
  let hik = 0, dah = 0;
  prods.forEach(doc => {
    if(doc.data().brand === 'Hikvision') hik++;
    if(doc.data().brand === 'Dahua') dah++;
  });
  console.log('Hikvision:', hik, 'Dahua:', dah);
}
run().catch(console.dir);
