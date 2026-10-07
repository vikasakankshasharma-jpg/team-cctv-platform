import fs from "fs";

let content = fs.readFileSync("app/api/quote/generate/route.ts", "utf8");
content = content.replace(
  /addons: addons,/,
  `addons: addons,\n      storageDrives: catalog.filter(p => p.category === "storage"),`
);
fs.writeFileSync("app/api/quote/generate/route.ts", content);
console.log("Added storageDrives to API response");
