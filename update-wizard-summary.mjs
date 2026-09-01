import fs from "fs";
let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

content = content.replace(
  /const \[savedQuoteId, setSavedQuoteId\] = useState<string \| null>\(null\);/,
  `const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [finalPlan, setFinalPlan] = useState<any>(null);`
);

content = content.replace(
  /const pricingToSave = modifiedPricingSnapshot \|\| quoteResult\.plans\[planType\];/,
  `const pricingToSave = modifiedPricingSnapshot || quoteResult.plans[planType];
        setFinalPlan(pricingToSave);`
);

// Format the final summary
const summaryUI = `
          <h2 className="text-3xl font-bold mb-2">Your Quotation is Ready!</h2>
          <p className="text-gray-600 mb-6">Quote ID: {savedQuoteId}</p>

          {finalPlan && (
            <div className="bg-gray-50 border rounded-xl p-6 text-left mb-8 max-w-lg mx-auto shadow-sm">
              <h3 className="font-bold text-lg border-b pb-3 mb-4 text-gray-800">Final System Configuration</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Hardware & Cameras</span>
                  <span className="font-semibold text-gray-900">{formatPrice(finalPlan.base_hardware_cost)}</span>
                </li>
                {finalPlan.cabling_cost > 0 && (
                  <li className="flex justify-between">
                    <span className="text-gray-600">Estimated Cabling</span>
                    <span className="font-semibold text-gray-900">{formatPrice(finalPlan.cabling_cost)}</span>
                  </li>
                )}
                {finalPlan.labor_cost > 0 && (
                  <li className="flex justify-between">
                    <span className="text-gray-600">Installation Labor</span>
                    <span className="font-semibold text-gray-900">{formatPrice(finalPlan.labor_cost)}</span>
                  </li>
                )}
                {finalPlan.addons_total > 0 && (
                  <li className="flex justify-between">
                    <span className="text-gray-600">Optional Upgrades</span>
                    <span className="font-semibold text-gray-900">{formatPrice(finalPlan.addons_total)}</span>
                  </li>
                )}
                <li className="flex justify-between border-t pt-3 mt-3">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-semibold text-gray-900">{formatPrice(finalPlan.gst_amount)}</span>
                </li>
                <li className="flex justify-between border-t pt-3 mt-3 text-lg">
                  <span className="font-bold text-gray-900">Total Quotation</span>
                  <span className="font-bold text-primary">{formatPrice(finalPlan.total_payable)}</span>
                </li>
              </ul>
            </div>
          )}

          <div className="space-y-4 max-w-sm mx-auto">
`;

content = content.replace(
  /<h2 className="text-3xl font-bold mb-2">Your Quotation is Ready!<\/h2>\r?\n\s*<p className="text-gray-600 mb-8">Quote ID: \{savedQuoteId\}<\/p>\r?\n\r?\n\s*<div className="space-y-4 max-w-sm mx-auto">/,
  summaryUI
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Updated WizardClientV2.tsx with final summary");
