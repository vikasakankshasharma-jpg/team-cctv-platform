import fs from "fs";
let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");
let lines = content.split('\n');
console.log(lines.slice(820).join('\n'));
