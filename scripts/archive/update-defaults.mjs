import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

content = content.replace(
  /recording_days: 15,/,
  `recording_days: 7,`
);
content = content.replace(
  /recording_mode: "continuous",/,
  `recording_mode: "motion",`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Updated default state for recording");
