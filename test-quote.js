require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
});
admin.firestore().collectionGroup('quotes').where('id', '==', 'YZuMxjOxUy5gyQ8W6E6Z').get().then(s => {
    if(!s.empty) console.log(JSON.stringify(s.docs[0].data().items, null, 2));
    else console.log('not found');
});
