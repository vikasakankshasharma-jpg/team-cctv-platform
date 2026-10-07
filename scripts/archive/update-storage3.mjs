import fs from "fs";

let content = fs.readFileSync("lib/product-resolver.ts", "utf8");

// Pass brandFilter to resolveStorageForPermutation
content = content.replace(
  /const storage = resolveStorageForPermutation\(permConfig, pool\);/,
  `const storage = resolveStorageForPermutation(permConfig, pool, brandFilter);`
);

// Update resolveStorageForPermutation signature
content = content.replace(
  /function resolveStorageForPermutation\(config: CCTVConfiguration, pool: Product\[\]\) \{/,
  `function resolveStorageForPermutation(config: CCTVConfiguration, pool: Product[], brandFilter?: string) {`
);

// Update resolving logic
const oldLogic = `    if (valid.length === 0) return undefined;
    return valid.sort((a, b) => getTb(a) - getTb(b))[0];`;

const newLogic = `    if (valid.length === 0) return undefined;
    
    // Group by exact capacity required
    valid.sort((a, b) => getTb(a) - getTb(b));
    const targetTb = getTb(valid[0]);
    const matchedDrives = valid.filter(p => getTb(p) === targetTb);
    
    // Sort matched drives by price ascending to find cheapest
    matchedDrives.sort((a, b) => (a.price || 0) - (b.price || 0));
    
    if (brandFilter) {
       // Premium brand requested -> Prefer Seagate, WD, Toshiba
       const premiumDrives = matchedDrives.filter(p => {
           const l = (p.brand || p.display_name).toLowerCase();
           return l.includes("seagate") || l.includes("wd") || l.includes("western") || l.includes("skyhawk") || l.includes("purple") || l.includes("toshiba");
       });
       if (premiumDrives.length > 0) return premiumDrives[0]; // Cheapest premium drive
    } else {
       // Budget requested -> Prefer generic/budget brand
       const budgetDrives = matchedDrives.filter(p => {
           const l = (p.brand || p.display_name).toLowerCase();
           return l.includes("budget") || l.includes("generic");
       });
       if (budgetDrives.length > 0) return budgetDrives[0]; // Cheapest budget drive
    }
    
    // Fallback to absolute cheapest if specific preference not found
    return matchedDrives[0];`;

content = content.replace(oldLogic, newLogic);

fs.writeFileSync("lib/product-resolver.ts", content);
console.log("Updated storage logic with brandFilter");
