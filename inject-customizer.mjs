import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

// Add import if not present
if (!content.includes("CameraCustomizer")) {
  content = content.replace(
    /import { QuoteComparison } from "@\/components\/QuoteComparison";/,
    `import { QuoteComparison } from "@/components/QuoteComparison";\nimport { CameraCustomizer } from "@/components/CameraCustomizer";`
  );
}

// Inject the customizer condition BEFORE `if (quoteResult)`
const customizerLogic = `
  if (customizerPlanId && quoteResult) {
    return (
      <CameraCustomizer
        basePlanId={customizerPlanId}
        basePlan={quoteResult.plans[customizerPlanId]}
        requirement={quoteResult.requirement}
        availableAddons={quoteResult.addons || []}
        onBack={() => setCustomizerPlanId(null)}
        onConfirm={(modifiedPlan) => handleConfirmCustomizer(customizerPlanId, modifiedPlan)}
        isSaving={loading}
      />
    );
  }

  if (quoteResult) {
`;

content = content.replace(
  /\n  if \(quoteResult\) {/,
  customizerLogic
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Injected CameraCustomizer rendering into WizardClientV2");
