import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

// State for customizer
content = content.replace(
  /const \[isEditDrawerOpen, setIsEditDrawerOpen\] = useState\(false\);/,
  `const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);\n  const [customizerPlanId, setCustomizerPlanId] = useState<string | null>(null);`
);

// handleSaveQuote to handleConfirmCustomizer
// Actually, I'll rename handleSaveQuote to saveQuote, and add a customizer step.

const newHandleSaveQuote = `
  const handleSelectBasePlan = (planId: string) => {
    setCustomizerPlanId(planId);
  };

  const handleConfirmCustomizer = async (planType: string, modifiedPricingSnapshot?: any) => {
    const mobile = quoteResult.requirement.customer_mobile;
    const name = quoteResult.requirement.customer_name;
    
    if (!mobile) {
      alert("Mobile number is required.");
      return;
    }
    
    setLoading(true);
    try {
      const pricingToSave = modifiedPricingSnapshot || quoteResult.plans[planType];
      const res = await fetch("/api/quote/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_mobile: mobile,
          customer_name: name,
          requirementSnapshot: quoteResult.requirement,
          configurationSnapshot: quoteResult.configuration,
          pricingSnapshot: pricingToSave,
          selectedPlan: planType
        })
`;

content = content.replace(
  /const handleSaveQuote = async \(planType: string\) => \{[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?selectedPlan: planType[\s\S]*?\}\)/,
  newHandleSaveQuote
);

content = content.replace(
  /<QuoteComparison[\s\S]*?onSelectPlan=\{handleSaveQuote\}/,
  `<QuoteComparison \n            plans={quoteResult.plans}\n            requirement={quoteResult.requirement}\n            onSelectPlan={handleSelectBasePlan}`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Updated WizardClientV2 for customizer transition");
