import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

// We want to extract up to case 3, and then append case 4 as the final step.

const headerMatch = content.match(/([\s\S]*?case 3:[\s\S]*?<\/div>\s*\);\s*)/);
if (!headerMatch) throw new Error("Could not find up to case 3");
let newContent = headerMatch[1];

// Add case 4 (which was case 9)
const finalStepMatch = content.match(/case 9:([\s\S]*?return \([\s\S]*?<\/div>\s*\);\s*)/);
if (!finalStepMatch) throw new Error("Could not find case 9");

newContent += `      case 4:` + finalStepMatch[1] + `    }\n  };\n\n`;

// Append the rest of the file
const footerMatch = content.match(/  return \([\s\S]*\}\n/);
if (!footerMatch) throw new Error("Could not find footer");
newContent += footerMatch[0];

// Replace totalSteps
newContent = newContent.replace(/const totalSteps = \d+;/, "const totalSteps = 4;");

fs.writeFileSync("components/wizard/WizardClientV2.tsx", newContent);
console.log("Rewrote WizardClientV2.tsx to 4 steps");
