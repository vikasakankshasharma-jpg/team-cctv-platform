import fs from "fs";
let content = fs.readFileSync("components/QuoteComparison.tsx", "utf8");
content = content.replace(/match\(\/d\+TB\|d\+GB\/\)/, "match(/\\d+TB|\\d+GB/)");
fs.writeFileSync("components/QuoteComparison.tsx", content);
console.log("Fixed regex");
