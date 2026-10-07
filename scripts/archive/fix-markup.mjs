import fs from "fs";
let content = fs.readFileSync("lib/margin-engine.ts", "utf8");

content = content.replace(
  /markup = policy\.anchor_margin\[tier\];/g,
  `markup = policy.anchor_margin[tier] ?? policy.anchor_margin['recommended'] ?? 0.12;`
);

content = content.replace(
  /markup = policy\.accessory_margin\[tier\];/g,
  `markup = policy.accessory_margin[tier] ?? policy.accessory_margin['recommended'] ?? 0.65;`
);

fs.writeFileSync("lib/margin-engine.ts", content);
console.log("Fixed margin engine markups for dynamic tiers");
