const fs = require('fs');
let text = fs.readFileSync('app/api/operations/jobs/[jobId]/route.ts', 'utf8');
const search = 'const amcData = amcDoc.data()!;';
const replace = 'const amcData = amcDoc.data()!;\n                       if (amcData.usedVisits >= amcData.includedVisits) throw new Error("AMC Visit Deduction Failed: No visits remaining in this AMC Contract.");';
text = text.replace(search, replace);
fs.writeFileSync('app/api/operations/jobs/[jobId]/route.ts', text);
console.log('done');
