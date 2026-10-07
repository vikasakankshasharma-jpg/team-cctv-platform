import fs from "fs";

let content = fs.readFileSync("app/api/quote/generate/route.ts", "utf8");
content = content.replace(
  /p\.category === "CAMERA_HD" \|\| p\.category === "CAMERA_IP"/g,
  `(p.category as any) === "CAMERA_HD" || (p.category as any) === "CAMERA_IP"`
);
fs.writeFileSync("app/api/quote/generate/route.ts", content);

let content2 = fs.readFileSync("lib/product-resolver.ts", "utf8");
content2 = content2.replace(
  /p\.category === "CAMERA_HD" \|\| p\.category === "CAMERA_IP"/g,
  `(p.category as any) === "CAMERA_HD" || (p.category as any) === "CAMERA_IP"`
);
fs.writeFileSync("lib/product-resolver.ts", content2);

console.log("Fixed TS errors");
