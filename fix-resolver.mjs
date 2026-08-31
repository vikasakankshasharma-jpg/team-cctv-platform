const fs = require("fs");
let content = fs.readFileSync("lib/product-resolver.ts", "utf8");

content = content.replace(
  "(p.technologies || []).includes(config.technology as any)",
  "((p.technologies || []).includes(config.technology as any) || p.technology === config.technology)"
);

fs.writeFileSync("lib/product-resolver.ts", content);
console.log("Updated product-resolver.ts for recorders");
