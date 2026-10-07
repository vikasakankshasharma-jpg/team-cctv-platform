import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");
content = content.replace(
  /<h2 className="text-3xl font-semibold mb-2">Recording & Backup<\/h2>/,
  `<h2 className="text-3xl font-semibold mb-2">Recording & Storage Backup</h2>`
);
content = content.replace(
  /<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">/,
  `<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Forced UI change");
