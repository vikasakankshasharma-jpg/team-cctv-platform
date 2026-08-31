import fs from "fs";

let content = fs.readFileSync("test-e2e.mjs", "utf8");
content = content.replace(
  /const planId = "IP_5MP";/,
  `const planId = "Budget_IP_5MP";`
);
fs.writeFileSync("test-e2e.mjs", content);
console.log("Fixed test script");
