const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db_dump.json', 'utf8'));

function findDB(namePattern) {
  return db.products.find(p => {
    const s = ((p.display_name||'') + ' ' + (p.technical_name||'') + ' ' + (p.sku||'')).toLowerCase();
    return namePattern.every(w => s.includes(w.toLowerCase())) && !s.includes('ip');
  });
}

const toCheck = [
  { pat: ['cp plus', '2mp', 'dome', 'b&w'], cost: 1000 },
  { pat: ['cp plus', '2mp', 'bullet', 'b&w'], cost: 1050 },
  { pat: ['cp plus', '2mp', 'dome', 'color'], cost: 1250 },
  { pat: ['cp plus', '2mp', 'bullet', 'color'], cost: 1300 },
  { pat: ['cp plus', '5mp', 'dome', 'color'], cost: 1600 },
  { pat: ['cp plus', '5mp', 'bullet', 'color'], cost: 1650 },
  { pat: ['budget', '2mp', 'dome', 'color'], cost: 700 },
  { pat: ['budget', '2mp', 'bullet', 'color'], cost: 750 },
  
  { pat: ['cp plus', '4ch', 'dvr', '2mp'], cost: 3700 },
  { pat: ['cp plus', '8ch', 'dvr', '2mp'], cost: 4800 },
  { pat: ['cp plus', '16ch', 'dvr', '2mp'], cost: 8100 },
  { pat: ['cp plus', '4ch', 'dvr', '5mp'], cost: 5750 },
  { pat: ['cp plus', '8ch', 'dvr', '5mp'], cost: 8100 },
  { pat: ['cp plus', '16ch', 'dvr', '5mp'], cost: 13300 },
];

const results = [];
for (const item of toCheck) {
  let p = findDB(item.pat);
  if (p && p.base_cost !== item.cost) {
    results.push({ item: item.pat.join(' '), dbCost: p.base_cost, excelCost: item.cost, id: p.id });
  }
}
console.table(results);
