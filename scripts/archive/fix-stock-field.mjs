import fs from "fs";
let content = fs.readFileSync("components/CameraCustomizer.tsx", "utf8");
content = content.replace(/a\.stock /g, "a.stock_quantity ");
content = content.replace(/a\.stock\)/g, "a.stock_quantity)");
content = content.replace(/a\.stock !== 0/g, "a.stock_quantity !== 0");
content = content.replace(/a\.stock !== "NA"/g, "a.stock_quantity !== -1");
content = content.replace(/typeof a\.stock === "number" \? a\.stock : Infinity/g, "typeof a.stock_quantity === 'number' ? (a.stock_quantity === -1 ? 0 : a.stock_quantity) : Infinity");
fs.writeFileSync("components/CameraCustomizer.tsx", content);
console.log("Fixed Customizer stock field");
