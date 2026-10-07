import fs from "fs";

let content = fs.readFileSync("lib/product-resolver.ts", "utf8");

content = content.replace(
  /p\.category === 'CAMERA_HD' \|\| p\.category === 'CAMERA_IP'/g,
  `(p.category as any) === 'CAMERA_HD' || (p.category as any) === 'CAMERA_IP'`
);

content = content.replace(
  /p\.category === "CAMERA_HD" \|\| p\.category === "CAMERA_IP"/g,
  `(p.category as any) === "CAMERA_HD" || (p.category as any) === "CAMERA_IP"`
);

fs.writeFileSync("lib/product-resolver.ts", content);
console.log("Fixed product-resolver TS errors again");
