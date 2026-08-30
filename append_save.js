const fs = require('fs');
let c = fs.readFileSync('lib/profitability-engine.ts', 'utf8');

c += `

export async function saveProfitabilitySnapshot(snapshot: ProfitabilityResult): Promise<void> {
  const snapshotId = \`\${snapshot.period}_\${snapshot.dealId}\`;
  await adminDb.collection("profitability_snapshots").doc(snapshotId).set(snapshot);
}
`;
fs.writeFileSync('lib/profitability-engine.ts', c);
console.log('done');
