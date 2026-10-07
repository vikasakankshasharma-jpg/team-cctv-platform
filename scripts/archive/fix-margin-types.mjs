import fs from "fs";

let content = fs.readFileSync("lib/margin-engine.ts", "utf8");

content = content.replace(
  /const tierMap: any = \(policy\[marginKey as keyof MarginPolicyConfig\] as any\);\n\s*const marginMultiplier = 1 \+ \(tierMap\[tier\] \?\? tierMap\['recommended'\] \?\? 0\.12\);/,
  `const policyVal: any = policy[marginKey as keyof MarginPolicyConfig];
      let marginVal = 0;
      if (typeof policyVal === "number") marginVal = policyVal;
      else if (typeof policyVal === "object" && policyVal !== null) {
          marginVal = policyVal[tier] ?? policyVal['recommended'] ?? 0.15;
      }
      const marginMultiplier = 1 + marginVal;`
);

fs.writeFileSync("lib/margin-engine.ts", content);
console.log("Fixed margin engine policyVal handling");
