import fs from "fs";
let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

content = content.replace(/const handleSaveQuote = async \(planType: "budget" \| "recommended" \| "premium"\) => \{/, `const handleSaveQuote = async (planType: string) => {`);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Updated handleSaveQuote");
