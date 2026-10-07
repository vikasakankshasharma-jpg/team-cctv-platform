const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db_dump.json', 'utf8'));

function findDB(namePattern, excludePattern = []) {
  return db.products.find(p => {
    const s = ((p.display_name||'') + ' ' + (p.technical_name||'') + ' ' + (p.sku||'')).toLowerCase();
    const match = namePattern.every(w => s.includes(w.toLowerCase()));
    const exc = excludePattern.length > 0 ? excludePattern.some(w => s.includes(w.toLowerCase())) : false;
    return match && !exc;
  });
}

const toCheck = [
  // HD DVR
  { pat: ['cp plus', '4ch', 'dvr', '2mp'], cost: 3700 },
  { pat: ['cp plus', '8ch', 'dvr', '2mp'], cost: 4800 },
  { pat: ['cp plus', '16ch', 'dvr', '2mp'], cost: 8100 },
  { pat: ['cp plus', '4ch', 'dvr', '5mp'], cost: 5750 },
  { pat: ['cp plus', '8ch', 'dvr', '5mp'], cost: 8100 },
  { pat: ['cp plus', '16ch', 'dvr', '5mp'], cost: 13300 },
  
  // IP NVR
  { pat: ['cp plus', '16ch', 'nvr'], cost: 8300 },
  { pat: ['cp plus', '32ch', 'nvr'], cost: 15000 },
];

const results = [];
for (const item of toCheck) {
  const p = findDB(item.pat, ['dvr-cpp']); // Wait, if I exclude dvr, I exclude the DVRs.
}
