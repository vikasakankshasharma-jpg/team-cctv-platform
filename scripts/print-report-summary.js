const fs = require('fs');
const report = JSON.parse(fs.readFileSync('secure-easy/full_inventory_audit_report.json', 'utf8'));

console.log('=== MATCHED BY CATEGORY ===');
const cats = {};
report.exactMatches.forEach(m => {
  cats[m.category] = (cats[m.category] || 0) + 1;
});
console.log(cats);

console.log('\n=== ALL 17 ITEMS NOT FOUND ON MEGA COMPU WORLD ===');
report.notFoundOnVendor.forEach((n, idx) => {
  console.log(`${idx + 1}. [${n.id}] ${n.name} | Cat: ${n.category} | Brand: ${n.brand} | Our Customer Price: ₹${n.current_price}`);
  console.log(`   Reason: ${n.reason}`);
});
