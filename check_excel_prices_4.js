const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db_dump.json', 'utf8'));

function findDB(namePattern) {
  return db.products.find(p => {
    const s = ((p.display_name||'') + ' ' + (p.technical_name||'') + ' ' + (p.sku||'')).toLowerCase();
    return namePattern.every(w => s.includes(w.toLowerCase()));
  });
}

const toCheck = [
  { pat: ['cp plus', '6mp', 'dome', 'ip'], cost: 5200 },
  { pat: ['cp plus', '6mp', 'bullet', 'ip'], cost: 5250 },
  { pat: ['cp plus', '8mp', 'dome', 'ip'], cost: 7500 },
  { pat: ['cp plus', '8mp', 'bullet', 'ip'], cost: 7500 },
  { pat: ['budget', '5mp', 'dome', 'ip', 'eco'], cost: 1400 },
  { pat: ['budget', '5mp', 'bullet', 'ip', 'eco'], cost: 1450 },
  { pat: ['budget', '5mp', 'dome', 'ip', 'premium'], cost: 2000 },
  { pat: ['budget', '5mp', 'bullet', 'ip', 'premium'], cost: 2050 },
  
  { pat: ['seagate', '1tb'], cost: 9500 },
  { pat: ['seagate', '2tb'], cost: 10900 },
  { pat: ['seagate', '4tb'], cost: 18500 },
  
  { pat: ['cp plus', '16ch', 'nvr'], cost: 8300 },
  { pat: ['cp plus', '32ch', 'nvr'], cost: 15000 },
];

const results = [];
for (const item of toCheck) {
  let p = findDB(item.pat);
  // for NVR exclude DVR
  if (item.pat.includes('nvr')) {
     p = db.products.find(prod => {
       const s = ((prod.display_name||'') + ' ' + (prod.technical_name||'') + ' ' + (prod.sku||'')).toLowerCase();
       return item.pat.every(w => s.includes(w.toLowerCase())) && !s.includes('dvr');
     });
  }
  
  if (p && p.base_cost !== item.cost) {
    results.push({ item: item.pat.join(' '), dbCost: p.base_cost, excelCost: item.cost, id: p.id });
  }
}
console.table(results);
