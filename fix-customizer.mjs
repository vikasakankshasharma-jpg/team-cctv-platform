import fs from "fs";
let content = fs.readFileSync("components/CameraCustomizer.tsx", "utf8");
content = content.replace(/,\s*base_cost_at_quote: upgDef\.priceExTax/g, "");
fs.writeFileSync("components/CameraCustomizer.tsx", content);
console.log("Removed base_cost_at_quote");
