import fs from "fs";
let content = fs.readFileSync("components/CameraCustomizer.tsx", "utf8");
content = content.replace(/a\.stock_quantity !== "NA"/g, "a.stock_quantity !== -1");
fs.writeFileSync("components/CameraCustomizer.tsx", content);
console.log("Fixed Customizer stock comparison");
