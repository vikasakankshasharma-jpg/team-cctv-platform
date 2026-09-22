const fs = require('fs');
let content = fs.readFileSync('app/api/quotes/route.ts', 'utf8');

const search1 = 'const quoteRef = adminDb.collection("leads").doc(lead_id).collection("quotes").doc();';
const replace1 = 'const quoteId = adminDb.collection("quotes").doc().id;\n    const subQuoteRef = adminDb.collection("leads").doc(lead_id).collection("quotes").doc(quoteId);\n    const rootQuoteRef = adminDb.collection("quotes").doc(quoteId);';
content = content.replace(search1, replace1);

const search2 = 'const quotePromise = quoteRef.set({';
const replace2 = 'const quoteData = {';
content = content.replace(search2, replace2);

content = content.replace(/recalculated_on_server: true,\s*\}\);\s*\/\/\s*5\.\s*Update Lead Status/g, 'recalculated_on_server: true,\n      lead_id: lead_id // Ensure lead_id is present for root collection queries\n    };\n\n    const quotePromise1 = subQuoteRef.set(quoteData);\n    const quotePromise2 = rootQuoteRef.set(quoteData);\n\n    // 5. Update Lead Status');

content = content.replace(/last_quote_id: quoteRef\.id,/g, 'last_quote_id: quoteId,');
content = content.replace(/await Promise\.all\(\[quotePromise, leadPromise\]\);/g, 'await Promise.all([quotePromise1, quotePromise2, leadPromise]);');
content = content.replace(/resource_id: quoteRef\.id,/g, 'resource_id: quoteId,');
content = content.replace(/id: quoteRef\.id,/g, 'id: quoteId,');

fs.writeFileSync('app/api/quotes/route.ts', content);
