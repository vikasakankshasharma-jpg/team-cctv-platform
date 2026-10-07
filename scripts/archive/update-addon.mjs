import fs from "fs";
let content = fs.readFileSync("types/index.ts", "utf8");
content = content.replace(
  /unit_multiplier\?: "none" \| "camera_count";/,
  `unit_multiplier?: "none" | "camera_count";\n  category?: "upgrade_camera" | "accessory" | "service";\n  stock?: number | "NA";`
);
fs.writeFileSync("types/index.ts", content);
console.log("Updated Addon interface");
