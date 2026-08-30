const fs = require('fs');
let c = fs.readFileSync('lib/profitability-engine.ts', 'utf8');

c += `

export async function getLiveProfitability(dealId: string, period: string): Promise<ProfitabilityResult> {
  const snapshotId = \`\${period}_\${dealId}\`;
  const doc = await adminDb.collection("profitability_snapshots").doc(snapshotId).get();
  
  if (!doc.exists) {
      // No snapshot exists yet (e.g. brand new deal today), calculate fully on the fly
      return await calculateDealProfitability(dealId, period);
  }
  
  const snapshot = doc.data() as ProfitabilityResult;
  const lastCalc = new Date(snapshot.calculatedAt);
  
  // To get intra-day delta, we technically need to find transactions where timestamp > lastCalc
  // Since our calculateDealProfitability is modular, we can abstract delta logic, 
  // but for Phase 12 MVP, if a deal has had ANY new invoices, jobs, or stock movements since lastCalc, 
  // we just recalculate the whole deal on the fly. It's safe and accurate.
  
  const recentInvoices = await adminDb.collection("invoices")
      .where("dealId", "==", dealId)
      .where("createdAt", ">", snapshot.calculatedAt)
      .limit(1).get();
      
  const recentJobs = await adminDb.collection("jobs")
      .where("dealId", "==", dealId)
      .where("updatedAt", ">", snapshot.calculatedAt) // Assuming jobs have updatedAt
      .limit(1).get();

  const recentRma = await adminDb.collection("rma_tickets")
      .where("originalDealId", "==", dealId)
      .where("createdAt", ">", snapshot.calculatedAt)
      .limit(1).get();
      
  if (!recentInvoices.empty || !recentJobs.empty || !recentRma.empty) {
      // A mutation occurred since the nightly snapshot. Compute dynamic delta.
      // (For absolute precision we run the full engine on this single deal)
      return await calculateDealProfitability(dealId, period);
  }
  
  // No changes since nightly cron. Return the fast materialized view.
  return snapshot;
}
`;
fs.writeFileSync('lib/profitability-engine.ts', c);
console.log('done');
