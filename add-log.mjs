import fs from "fs";

let content = fs.readFileSync("lib/product-resolver.ts", "utf8");

content = content.replace(
  /if \(filtered\.length === 0\) return cams\[0\]; \/\/ Desperate fallback/,
  `if (filtered.length === 0) { console.log("Desperate fallback for", targetResolution, formFactor, targetTier); return cams[0]; }`
);

fs.writeFileSync("lib/product-resolver.ts", content);
console.log("Updated product-resolver.ts with logging");
