import fs from "fs";
let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

content = content.replace(
  /const totalSteps = 4;/,
  `const totalSteps = req.installation_type === "new" ? 4 : 5;`
);

content = content.replace(
  /Step \{step\} of \{totalSteps\}/,
  `Step {req.installation_type === "new" && step === 5 ? 4 : step} of {totalSteps}`
);
content = content.replace(
  /width: \`\$\{\(step \/ totalSteps\) \* 100\}%\`\}/,
  `width: \`\${((req.installation_type === "new" && step === 5 ? 4 : step) / totalSteps) * 100}%\`}`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Updated steps logic");
