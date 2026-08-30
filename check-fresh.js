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
db.collection('leads').doc('3aGvL7z8jD4HebmkDqTm').collection('quotes').doc('Pzd6wNfM5E20hKqH87RG').get().then(doc => {
    const data = doc.data();
    console.log('Items:');
    (data.items || []).forEach(function(item, i) {
        console.log('  ' + (i+1) + '. ' + item.display_name + ' x' + item.qty + ' = Rs.' + item.line_total);
    });
    console.log('\nSubtotal:', data.gross_subtotal);
    console.log('GST ' + data.gst_rate + '%:', data.gst_amount);
    console.log('Grand Total:', data.total_payable);
});
