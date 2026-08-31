import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

const renderQuoteComparison = `
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Compare Options</h2>
            <Button variant="ghost" onClick={() => setQuoteResult(null)}>? Back to Wizard</Button>
          </div>
          
          {customizerPlanId ? (
            <CameraCustomizer 
              basePlanId={customizerPlanId}
              basePlan={quoteResult.plans[customizerPlanId]}
              requirement={quoteResult.requirement}
              onBack={() => setCustomizerPlanId(null)}
              onConfirm={(modifiedPlan) => handleConfirmCustomizer(customizerPlanId, modifiedPlan)}
              isSaving={loading}
            />
          ) : (
            <QuoteComparison 
              plans={quoteResult.plans}
              requirement={quoteResult.requirement}
              onSelectPlan={handleSelectBasePlan}
              onEditConfiguration={() => setIsEditDrawerOpen(true)}
            />
          )}

          <EditConfigurationDrawer 
            isOpen={isEditDrawerOpen}
`;

content = content.replace(
  /<div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">[\s\S]*?<EditConfigurationDrawer \n\s*isOpen=\{isEditDrawerOpen\}/,
  renderQuoteComparison
);

content = content.replace(
  /import \{ QuoteComparison \} from "\.\/QuoteComparison";/g,
  `import { QuoteComparison } from "../QuoteComparison";\nimport { CameraCustomizer } from "../CameraCustomizer";`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Injected CameraCustomizer into render block");
