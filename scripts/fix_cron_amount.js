const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\app\\api\\cron\\auto-chaser\\route.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Inside the for loop, we have:
// const res = await msg91.sendQuoteFollowup({
//   phone: lead.phone,
//   customerName: lead.name || "Customer"
// });

// We need to fetch the amount. lead.total_payable exists in our database if a quote was accepted.
// If it's just "contacted", they might not have accepted a quote, so maybe we pull the latest quote.
// Let's replace the sendQuoteFollowup payload in both if branches

const newPayloadBlock = `
        let quoteAmount = lead.total_payable || "your custom price";
        if (!lead.total_payable) {
           // Try to find the latest quote
           const qs = await adminDb.collection("quotes").where("lead_id", "==", leadId).orderBy("created_at", "desc").limit(1).get();
           if (!qs.empty) {
             quoteAmount = qs.docs[0].data().total_payable || quoteAmount;
           }
        }

        const res = await msg91.sendQuoteFollowup({
          phone: lead.phone,
          customerName: lead.name || "Customer",
          amount: quoteAmount
        });
`;

content = content.replace(/const res = await msg91\.sendQuoteFollowup\(\{[\s\S]*?\}\);/g, newPayloadBlock);

fs.writeFileSync(filePath, content);
console.log("Updated auto-chaser cron to pass amount parameter");
