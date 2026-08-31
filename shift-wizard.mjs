import fs from "fs";
let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

content = content.replace("const totalSteps = 10;", "const totalSteps = 9;");

// Remove case 4 block
content = content.replace(/case 4:\s*return \([\s\S]*?<\/div>\s*\);\s*(case 5:)/, "$1");

// Now we have case 5, 6, 7, 8, 9, 10 remaining but totalSteps is 9.
// We must shift cases 5-10 down to 4-9.
content = content.replace(/case 5:/g, "case 4:");
content = content.replace(/case 6:/g, "case 5:");
content = content.replace(/case 7:/g, "case 6:");
content = content.replace(/case 8:/g, "case 7:");
content = content.replace(/case 9:/g, "case 8:");
content = content.replace(/case 10:/g, "case 9:");

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Updated WizardClientV2.tsx");
