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
// Get the latest lead's quote
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
    console.log('Config snapshot count:', (data.configuration_snapshot || []).length);
    console.log('\nItems:');
    console.log(JSON.stringify(data.items, null, 2));
    console.log('\nConfig Snapshot:');
    console.log(JSON.stringify(data.configuration_snapshot, null, 2));
});
