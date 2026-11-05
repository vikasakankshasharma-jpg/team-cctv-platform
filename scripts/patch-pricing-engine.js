const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../lib/pricing-engine.ts');
let code = fs.readFileSync(targetPath, 'utf-8');

const isCRLF = code.includes('\r\n');
if (isCRLF) code = code.replace(/\r\n/g, '\n');

// Update allCables to exclude electrical wire from video transmission
const oldCables = `  // 1. Gather all cables for this technology
  const allCables = products.filter(p => 
    p.category === "cable" && 
    (p.technologies || []).includes(effectiveCableTech as any) &&
    p.is_active !== false && p.stock_status !== "out_of_stock"
  );`;

const newCables = `  // 1. Gather all cables for this technology (exclude power-only electrical wire)
  const allCables = products.filter(p => 
    p.category === "cable" && 
    p.subcategory !== "electrical_wire" &&
    !p.display_name?.toLowerCase().includes("electrical") &&
    !p.display_name?.toLowerCase().includes("2-core") &&
    (p.technologies || []).includes(effectiveCableTech as any) &&
    p.is_active !== false && p.stock_status !== "out_of_stock"
  );`;

if (code.includes(oldCables)) {
  code = code.replace(oldCables, newCables);
  if (isCRLF) code = code.replace(/\n/g, '\r\n');
  fs.writeFileSync(targetPath, code, 'utf-8');
  console.log('Successfully updated video cabling filter in pricing-engine.ts!');
} else {
  console.log('Video cabling target not found or already updated.');
}
