const fs = require('fs');
let c = fs.readFileSync('lib/profitability-engine.ts', 'utf8');

c = c.replace(
  'return await calculateDealProfitability(dealId, period);',
  'const res = await calculateDealProfitability(dealId, period); (res as any).isLiveRecalculated = true; return res;'
);

c = c.replace(
  'return await calculateDealProfitability(dealId, period); // recalculate',
  'const res = await calculateDealProfitability(dealId, period); (res as any).isLiveRecalculated = true; return res;'
);

// Specifically handle the second occurrence where it's recalculated
c = c.replace(
    'return await calculateDealProfitability(dealId, period);',
    'const res2 = await calculateDealProfitability(dealId, period); (res2 as any).isLiveRecalculated = true; return res2;'
);

fs.writeFileSync('lib/profitability-engine.ts', c);
console.log('done');
