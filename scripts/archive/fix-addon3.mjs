import fs from "fs";
let content = fs.readFileSync("types/index.ts", "utf8");
content = content.replace(/  category\?: "upgrade_camera" \| "accessory" \| "service";\n/g, "");
fs.writeFileSync("types/index.ts", content);
console.log("Fixed duplicate category in Addon interface");
