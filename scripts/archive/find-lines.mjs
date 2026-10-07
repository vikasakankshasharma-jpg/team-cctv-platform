import fs from "fs";
let lines = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8").split("\n");
let start = lines.findIndex(l => l.includes("const renderStep = () => {"));
let end = lines.length - 1;
for (let i = lines.length - 1; i > start; i--) {
  if (lines[i].includes("return (")) {
    end = i;
    break;
  }
}
console.log(`Start: ${start}, End: ${end}`);
