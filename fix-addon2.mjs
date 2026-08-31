import fs from "fs";
let content = fs.readFileSync("types/index.ts", "utf8");
content = content.replace(/  category\?: "upgrade_camera" \| "accessory" \| "service";\n  stock\?: number \| "NA";\n/g, "");
content = content.replace(/category\?: "storage" \| "power" \| "cable" \| "accessory" \| "service" \| string;/g, `category?: "upgrade_camera" | "storage" | "power" | "cable" | "accessory" | "service" | string;`);
fs.writeFileSync("types/index.ts", content);
console.log("Fixed Addon interface");
