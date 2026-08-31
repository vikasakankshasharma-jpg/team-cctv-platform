import fs from "fs";

let content = fs.readFileSync("lib/margin-engine.ts", "utf8");

content = content.replace(
  /const marginMultiplier = 1 \+ \(policy\[marginKey as keyof MarginPolicyConfig\] as any\)\[tier\];/,
  `const tierMap: any = (policy[marginKey as keyof MarginPolicyConfig] as any);
      const marginMultiplier = 1 + (tierMap[tier] ?? tierMap['recommended'] ?? 0.12);`
);

fs.writeFileSync("lib/margin-engine.ts", content);
console.log("Fixed margin engine fallback");
