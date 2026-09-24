const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\app\\api\\webhooks\\razorpay\\route.ts';
let content = fs.readFileSync(filePath, 'utf8');

const warrantyInjection = `
          // --- AUTO-MINT WARRANTY CERTIFICATE ---
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

          const warrantyRef = adminDb.collection("warranties").doc();
          await warrantyRef.set({
             id: warrantyRef.id,
             quote_id: quoteId,
             lead_id: leadId,
             status: "active",
             starts_at: new Date().toISOString(),
             expires_at: oneYearFromNow.toISOString(),
             total_amc_visits_allowed: 2,
             amc_visits_used: 0,
             hardware_coverage_months: 12,
             created_at: new Date(),
             updated_at: new Date()
          });

          console.log(`[Razorpay Webhook]: Minted 1-Year Warranty ${warrantyRef.id} for Quote ${quoteId}`);
          
          await addLeadActivity(leadId, "system", `System automatically minted 1-Year Warranty Certificate (ID: ${warrantyRef.id}) after final payment.`);
          // --------------------------------------
`;

// Insert it right after:
// const iQuoteData = iQuoteDoc.data() as any;
// await iQuoteRef.update({...}) // it usually updates the quote.
// Let's find a safe spot inside `if (paymentType === "installation_final") {` block, before the `return`

content = content.replace(/(} else if \(paymentType === "installation_final"\) \{[\s\S]*?console\.log\(`\[Razorpay Webhook\]: Final installation payment[^`]*`\);)/, (match) => {
  return match + '\n' + warrantyInjection;
});

fs.writeFileSync(filePath, content);
console.log("Injected Warranty Auto-Mint into Webhook");
