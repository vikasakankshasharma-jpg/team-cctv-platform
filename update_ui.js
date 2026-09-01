const fs = require("fs");
let text = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");
let replacement = fs.readFileSync("C:/Users/hp/.gemini/antigravity/brain/a1a0a74c-ede4-4dcc-84de-4e2ec5b4b775/scratch/replacement.txt", "utf8");

const oldBlockStart = text.indexOf("if (savedQuoteId) {");
const nextBlockStart = text.indexOf("if (customizerPlanId && quoteResult) {");

if (oldBlockStart !== -1 && nextBlockStart !== -1) {
    const newText = text.substring(0, oldBlockStart) + replacement + "\n    " + text.substring(nextBlockStart);
    fs.writeFileSync("components/wizard/WizardClientV2.tsx", newText);
} else {
    console.log("Could not find blocks");
}
