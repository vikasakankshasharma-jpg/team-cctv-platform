import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

content = content.replace(
  "{pdfUrl ? (",
  `<Button variant="outline" onClick={() => { setSavedQuoteId(null); setFinalPlan(null); setCustomizerPlanId(null); setStep(1); }} className="w-full">
              Modify My Setup
            </Button>
            {pdfUrl ? (`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Replaced Buttons");
