const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db_dump.json', 'utf8'));

function findDB(namePattern) {
  return db.products.find(p => {
    const s = ((p.display_name||'') + ' ' + (p.technical_name||'') + ' ' + (p.sku||'')).toLowerCase();
    return namePattern.every(w => s.includes(w.toLowerCase()));
  });
}

const toCheck = [
  // Cameras
  { pat: ['cp plus', '2mp', 'dome', 'ip'], cost: 3100 },
  { pat: ['cp plus', '2mp', 'bullet', 'ip'], cost: 3200 },
  { pat: ['cp plus', '4mp', 'dome', 'ip'], cost: 3900 },
  { pat: ['cp plus', '4mp', 'bullet', 'ip'], cost: 4000 },
  { pat: ['cp plus', '6mp', 'dome', 'ip'], cost: 5200 },
  { pat: ['cp plus', '6mp', 'bullet', 'ip'], cost: 5250 },
  { pat: ['cp plus', '8mp', 'dome', 'ip'], cost: 7500 },
  { pat: ['cp plus', '8mp', 'bullet', 'ip'], cost: 7500 },
  
  // Recorders
  { pat: ['cp plus', '16ch', 'nvr'], cost: 8300 },
  { pat: ['cp plus', '32ch', 'nvr'], cost: 15000 },
  
  // Storage
  { pat: ['seagate', '1tb'], cost: 9500 },
  { pat: ['seagate', '2tb'], cost: 10900 },
  { pat: ['seagate', '4tb'], cost: 18500 },
];

const results = [];
for (const item of toCheck) {
  const p = findDB(item.pat);
  if (p) {
    if (p.base_cost !== item.cost) {
      results.push({ item: item.pat.join(' '), dbCost: p.base_cost, excelCost: item.cost, id: p.id });
    }
  }
}
console.table(results);
