require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();
db.collection('leads').doc('YH5UB5TEn5av9GvKKUll').collection('quotes').doc('LXd4x9ovFfbgeo9s96e7').get().then(doc => {
    const data = doc.data();
    console.log('\n--- MOTION QUOTE LINE ITEMS ---');
    (data.items || []).forEach(function(item, i) {
        console.log(' ' + (i+1) + '. ' + item.display_name + ' | Qty: ' + item.qty + ' | Unit: Rs.' + item.unit_price + ' | Total: Rs.' + item.line_total);
    });
    console.log('\nSubtotal: Rs.' + data.gross_subtotal);
    console.log('GST: Rs.' + data.gst_amount + ' (' + data.gst_rate + '%)');
    console.log('Total Payable: Rs.' + data.total_payable);
});
