const fs = require('fs');
let code = fs.readFileSync('app/api/crm/deals/route.ts', 'utf8');

const oldLogic = `customerId: quote.customerId || "walk-in",`;
const newLogic = `
      customerId: quote.customerId || \`CUST-\${new Date().getFullYear()}-\${Math.floor(10000 + Math.random() * 90000)}\`,
`;
code = code.replace(oldLogic, newLogic.trim());

const batchSet = `batch.set(adminDb.collection("deals").doc(dealId), newDeal);`;
const newBatchSet = `batch.set(adminDb.collection("deals").doc(dealId), newDeal);
    
    // If quote didn't have customerId (legacy), create a walk-in customer record now
    if (!quote.customerId) {
        batch.set(adminDb.collection("customers").doc(newDeal.customerId), {
             id: newDeal.customerId,
             authUid: null,
             name: newDeal.customerName,
             phone: newDeal.customerMobile,
             type: "WALK_IN",
             createdAt: new Date().toISOString()
        });
    }`;

code = code.replace(batchSet, newBatchSet);

fs.writeFileSync('app/api/crm/deals/route.ts', code);
console.log('done');
