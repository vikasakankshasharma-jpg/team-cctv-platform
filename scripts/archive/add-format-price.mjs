import fs from "fs";
let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

content = content.replace(
  /export function WizardClientV2\(\) \{/,
  `const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p || 0);\n\nexport function WizardClientV2() {`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Added formatPrice");
