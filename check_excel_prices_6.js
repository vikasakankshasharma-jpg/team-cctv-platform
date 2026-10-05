const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db_dump.json', 'utf8'));
const all = [...db.products, ...db.addons];

function findDB(namePattern) {
  return all.find(p => {
    const s = ((p.display_name||'') + ' ' + (p.name||'') + ' ' + (p.sku||'')).toLowerCase();
    return namePattern.every(w => s.includes(w.toLowerCase()));
  });
}

const toCheck = [
  { pat: ['power', '8ch', 'cp'], cost: 600 },
  { pat: ['power', '8ch', 'budget'], cost: 350 },
  { pat: ['90', 'copper', 'cp'], cost: 1350 },
  { pat: ['70', 'coated', 'budget'], cost: 600 },
  { pat: ['305', 'copper', 'cp'], cost: 9500 },
  { pat: ['305', 'coated', 'cp'], cost: 3700 },
  { pat: ['100', 'copper', 'budget'], cost: 1200 },
  { pat: ['305', 'coated', 'budget'], cost: 3200 },
  
  { pat: ['bnc'], cost: 15 },
  { pat: ['dc'], cost: 5 },
  { pat: ['rj45'], cost: 5 },
  { pat: ['hdmi', '1.5'], cost: 60 },
  { pat: ['hdmi', '3'], cost: 120 },
  { pat: ['hdmi', '5'], cost: 180 },
  { pat: ['hdmi', '10'], cost: 300 },
  
  { pat: ['poe', '4ch', 'budget'], cost: 900 },
  { pat: ['poe', '8ch', 'budget'], cost: 1200 },
  { pat: ['poe', '16ch', 'd-link'], cost: 9500 },
  
  { pat: ['junction'], cost: 20 },
  { pat: ['2u'], cost: 350 },
  { pat: ['4u'], cost: 450 },
  { pat: ['pvc'], cost: 450 },
  { pat: ['router'], cost: 1450 },
  { pat: ['display', '19'], cost: 2100 },
];

const results = [];
for (const item of toCheck) {
  let p = findDB(item.pat);
  if (p) {
    const dbCost = p.base_cost || p.unit_price;
    if (dbCost !== item.cost) {
      results.push({ item: item.pat.join(' '), dbCost, excelCost: item.cost, id: p.id });
    }
  } else {
    // console.log("Not found:", item.pat);
  }
}
console.table(results);
