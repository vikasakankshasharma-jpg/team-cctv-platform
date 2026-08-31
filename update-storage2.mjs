import fs from "fs";
let content = fs.readFileSync("lib/product-resolver.ts", "utf8");

const oldStr = `const storageCands = pool.filter(p => p.category === "storage");
      const sortedStorage = [...storageCands].sort((a, b) => (a.price || 0) - (b.price || 0));`;

const newStr = `const storageCands = pool.filter(p => p.category === "storage");
      let sortedStorage = [...storageCands].sort((a, b) => (a.price || 0) - (b.price || 0));
      
      // BEST STRATEGY: If this is a Premium Brand plan (CP Plus/Hikvision), prefer Premium Storage (Seagate/WD)
      if (brandFilter) {
         const premiumStorage = sortedStorage.filter(p => {
             const lower = (p.brand || p.display_name).toLowerCase();
             return lower.includes("seagate") || lower.includes("wd") || lower.includes("western") || lower.includes("skyhawk") || lower.includes("purple") || lower.includes("toshiba");
         });
         // If premium drives of required capacity exist, use them over budget ones
         if (premiumStorage.length > 0) {
             sortedStorage = premiumStorage;
         }
      }`;

content = content.replace(oldStr, newStr);
fs.writeFileSync("lib/product-resolver.ts", content);
console.log("Updated storage precisely");
