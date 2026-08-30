require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
});
const db = admin.firestore();
db.collection('leads').orderBy('created_at', 'desc').limit(1).get().then(async snap => {
    if (snap.empty) { console.log('No leads'); return; }
    const leadDoc = snap.docs[0];
    console.log('Lead:', leadDoc.id, '- Name:', leadDoc.data().customer_name, '- Mobile:', leadDoc.data().mobile_number);
    const quotesSnap = await db.collection('leads').doc(leadDoc.id).collection('quotes').limit(1).get();
    if (quotesSnap.empty) { console.log('No quotes'); return; }
    const quoteDoc = quotesSnap.docs[0];
    const data = quoteDoc.data();
    console.log('\nQuote ID:', quoteDoc.id);
    console.log('Total Payable:', data.total_payable);
    console.log('Items count:', (data.items || []).length);
    console.log('\nItems:');
    (data.items || []).forEach(function(item, i) {
        console.log('  ' + (i+1) + '. ' + item.display_name + ' x' + item.qty + ' = Rs.' + item.line_total);
    });
    console.log('\nGST:', data.gst_amount, '(' + data.gst_rate + '%)');
    console.log('Subtotal:', data.gross_subtotal);
    console.log('Grand Total:', data.total_payable);
});
