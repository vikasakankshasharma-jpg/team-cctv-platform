const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\app\\api\\delivery\\dispatch\\route.ts';
let content = fs.readFileSync(filePath, 'utf8');

const injection = `
    // ---> NEW INVENTORY ENGINE: DEDUCT STOCK <---
    try {
      const itemsToDeduct = quoteData.hardware_cart || [];
      const hubId = quoteData.hub_id || "hub_delhi_ncr"; // Fallback to main hub

      if (itemsToDeduct.length > 0) {
        const batch = adminDb.batch();
        for (const item of itemsToDeduct) {
          if (!item.sku) continue;
          const stockRef = adminDb.collection("hubs").doc(hubId).collection("stock").doc(item.sku);
          batch.set(stockRef, {
            quantity: require('firebase-admin/firestore').FieldValue.increment(-item.quantity),
            last_updated: new Date().toISOString()
          }, { merge: true });
        }
        await batch.commit();
        console.log("Successfully deducted stock for quote:", quoteId);
      }
    } catch (invErr) {
      console.error("Inventory deduction failed:", invErr);
      // We don't fail the dispatch if inventory fails, but we log it
    }
    // ---> END INVENTORY ENGINE <---
`;

content = content.replace(
  /\/\/ Update the quote document/,
  injection + '\n    // Update the quote document'
);

fs.writeFileSync(filePath, content);
console.log("Updated dispatch route to deduct inventory");
