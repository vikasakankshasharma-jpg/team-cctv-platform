const admin = require('firebase-admin'); admin.initializeApp(); admin.firestore().collection('staged_products').count().get().then(s => { console.log('Count:', s.data().count); process.exit(0); });
