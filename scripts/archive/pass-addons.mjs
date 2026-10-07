import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

content = content.replace(
  /<CameraCustomizer\s+basePlanId=\{customizerPlanId\}\s+basePlan=\{quoteResult\.plans\[customizerPlanId\]\}\s+requirement=\{quoteResult\.requirement\}/,
  `<CameraCustomizer 
              basePlanId={customizerPlanId}
              basePlan={quoteResult.plans[customizerPlanId]}
              requirement={quoteResult.requirement}
              availableAddons={quoteResult.addons || []}`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Passed availableAddons to CameraCustomizer");
