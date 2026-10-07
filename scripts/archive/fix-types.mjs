import fs from "fs";
let content = fs.readFileSync("components/QuoteComparison.tsx", "utf8");

content = content.replace(
  /plan\.items\.find\(i => i\.category === "storage"\)/g,
  `plan.items.find((i: any) => i.category === "storage")`
);

content = content.replace(
  /plan\.items\.find\(i => i\.category === "recorder"\)/g,
  `plan.items.find((i: any) => i.category === "recorder")`
);

fs.writeFileSync("components/QuoteComparison.tsx", content);
console.log("Fixed typings in QuoteComparison");
