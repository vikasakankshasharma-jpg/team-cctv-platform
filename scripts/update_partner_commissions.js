const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\app\\(partner)\\partner\\commissions\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const importInjection = `import { TaxationEngine } from "@/lib/taxation-engine";\n`;

content = content.replace(
  /import type \{ CommissionRecord, Lead \} from "@\/types";/,
  `import type { CommissionRecord, Lead } from "@/types";\n${importInjection}`
);

// We need to fetch promoter document to check PAN and calculate TDS correctly.
const fetchPromoterInjection = `
  const promoterDoc = await adminDb.collection(COLLECTIONS.PROMOTERS).doc(promoterId).get();
  const promoterData = promoterDoc.data();
  const hasValidPan = !!(promoterData?.pan_number && promoterData.pan_number.length === 10);
`;

content = content.replace(
  /const commsSnap = await adminDb/,
  `${fetchPromoterInjection}\n  const commsSnap = await adminDb`
);

// Replace the summary aggregation
const newSummaryAggregation = `
  let totalEarned = 0;
  let totalPending = 0;
  let totalPaid = 0;

  for (const rec of records) {
    totalEarned += rec.commission_amount;
    if (rec.status === 'pending') totalPending += rec.commission_amount;
    if (rec.status === 'paid') totalPaid += rec.commission_amount;
  }

  // Calculate strict TDS via the engine for the pending amount (or total year depending on design, but let's just do it over totalEarned to show their net liability)
  const tdsCalculation = await TaxationEngine.calculate194H(totalEarned, 0, hasValidPan);
  
  const summary = {
    totalEarned,
    totalPending,
    totalPaid,
    tdsDeducted: tdsCalculation.tdsAmount,
    netPayable: tdsCalculation.netPayable,
    tdsRatePercent: tdsCalculation.tdsRatePercent,
    hasValidPan
  };
`;

content = content.replace(
  /const summary = records\.reduce\([\s\S]*?\), \{ totalEarned: 0, totalPending: 0, totalPaid: 0 \}\);/,
  newSummaryAggregation
);

fs.writeFileSync(filePath, content);
console.log("Updated Partner Commissions Page backend logic.");
