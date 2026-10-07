import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");
content = content.replace(
  /availableAddons=\{quoteResult\.addons \|\| \[\]\}/,
  `availableAddons={quoteResult.addons || []}\n        storageDrives={quoteResult.storageDrives || []}`
);
fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Passed storageDrives to CameraCustomizer");
