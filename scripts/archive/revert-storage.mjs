import fs from "fs";

let content = fs.readFileSync("lib/product-resolver.ts", "utf8");

const oldLogic = `    if (brandFilter) {
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
    }`;

content = content.replace(oldLogic, "");
fs.writeFileSync("lib/product-resolver.ts", content);
console.log("Reverted storage logic to always pick lowest price");
