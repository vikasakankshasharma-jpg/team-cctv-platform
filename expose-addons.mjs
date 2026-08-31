import fs from "fs";
let content = fs.readFileSync("app/api/quote/generate/route.ts", "utf8");
content = content.replace(
  /plans: quotePlans,\n\s*lifecycleWarnings/,
  `plans: quotePlans,\n      addons: addons,\n      lifecycleWarnings`
);
fs.writeFileSync("app/api/quote/generate/route.ts", content);
console.log("Exposed addons in generate route");
