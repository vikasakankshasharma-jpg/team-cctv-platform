const fs = require('fs');
let code = fs.readFileSync('app/api/quotes/manual/route.ts', 'utf8');

const oldLogic = `
    let customer_name = "Manual Walk-in";
    let customer_mobile = "0000000000";

    // If there is a lead_id, fetch customer details
    if (lead_id) {
        const leadDoc = await adminDb.collection("leads").doc(lead_id).get();
        if (leadDoc.exists) {
            customer_name = leadDoc.data()?.customer_name || customer_name;
            customer_mobile = leadDoc.data()?.mobile_number || customer_mobile;
        }
    }
`;

const newLogic = `
    let customer_name = "Manual Walk-in";
    let customer_mobile = "0000000000";
    let customerId = \`CUST-\${year}-\${Math.floor(10000 + Math.random() * 90000)}\`;

    if (lead_id) {
        const leadDoc = await adminDb.collection("leads").doc(lead_id).get();
        if (leadDoc.exists) {
            const data = leadDoc.data();
            customer_name = data?.customer_name || customer_name;
            customer_mobile = data?.mobile_number || customer_mobile;
            
            if (data?.customerId) {
                customerId = data.customerId;
            } else if (data?.firebase_uid) {
                const custDocs = await adminDb.collection("customers").where("authUid", "==", data.firebase_uid).limit(1).get();
                if (!custDocs.empty) {
                    customerId = custDocs.docs[0].id;
                } else {
                    await adminDb.collection("customers").doc(customerId).set({
                        id: customerId,
                        authUid: data.firebase_uid,
                        name: customer_name,
                        phone: customer_mobile,
                        type: "ONLINE_PORTAL",
                        createdAt: new Date().toISOString()
                    });
                }
            } else {
                await adminDb.collection("customers").doc(customerId).set({
                    id: customerId,
                    authUid: null,
                    name: customer_name,
                    phone: customer_mobile,
                    type: "WALK_IN",
                    createdAt: new Date().toISOString()
                });
            }
        }
    } else {
         await adminDb.collection("customers").doc(customerId).set({
             id: customerId,
             authUid: null,
             name: customer_name,
             phone: customer_mobile,
             type: "WALK_IN",
             createdAt: new Date().toISOString()
         });
    }
`;

code = code.replace(oldLogic.trim(), newLogic.trim());

const oldSnapshot = `
      id: quoteId,
      customer_mobile,
      customer_name,
`;
const newSnapshot = `
      id: quoteId,
      customerId,
      customer_mobile,
      customer_name,
`;

code = code.replace(oldSnapshot.trim(), newSnapshot.trim());
fs.writeFileSync('app/api/quotes/manual/route.ts', code);
console.log('done');
