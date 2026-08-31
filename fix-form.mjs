import fs from "fs";
let content = fs.readFileSync("lib/product-resolver.ts", "utf8");

content = content.replace(
  /const pForm = \(p\.specifications as any\)\?\.formFactor \|\| p\.type;/g,
  `const pForm = (p.specifications as any)?.formFactor || p.type || (p.display_name?.toLowerCase().includes("bullet") ? "bullet" : (p.display_name?.toLowerCase().includes("dome") ? "dome" : ""));`
);

fs.writeFileSync("lib/product-resolver.ts", content);
console.log("Updated product-resolver.ts for formFactor");
