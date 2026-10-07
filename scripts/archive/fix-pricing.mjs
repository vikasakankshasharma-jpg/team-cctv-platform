import fs from "fs";
let content = fs.readFileSync("lib/pricing-engine-v2.ts", "utf8");

content = content.replace(/req\.technology_preference === "IP"/g, `resolvedSystem.plan_type?.includes("IP")`);
content = content.replace(/req\.technology_preference \|\| "IP"/g, `(resolvedSystem.plan_type?.split("_")[0] || "HD")`);
content = content.replace(/\$\{req\.technology_preference\}/g, `\${resolvedSystem.plan_type?.split("_")[0] || "HD"}`);

fs.writeFileSync("lib/pricing-engine-v2.ts", content);
console.log("Updated pricing-engine-v2.ts");
