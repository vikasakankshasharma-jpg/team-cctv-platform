import fs from "fs";
const lines = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8").split("\n");
const start = lines.findIndex(l => l.includes("const handleSaveQuote"));
const block = lines.slice(start + 35, start + 70);
console.log(block.join("\n"));
