import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

const oldOptions = `{[15, 30, 45, 60].map(days => (`;
const newOptions = `{[0, 7, 15, 30, 45, 60].map(days => (`;

content = content.replace(oldOptions, newOptions);

const oldLabel = `{days} Days`;
const newLabel = `{days === 0 ? "No Recording" : \`\${days} Days\`}`;

content = content.replace(oldLabel, newLabel);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Added 0 and 7 days to UI");
