import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

const oldSummary = `<li className="flex justify-between">
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
                )}`;

const newSummary = `{finalPlan.items.map((item: any, index: number) => (
                  <li key={index} className="flex justify-between items-start mb-2 pb-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700 pr-4">
                      {item.display_name} <span className="text-gray-400 text-xs ml-1">x{item.qty}</span>
                    </span>
                    <span className="font-medium text-gray-900 whitespace-nowrap">{formatPrice(item.line_total)}</span>
                  </li>
                ))}`;

content = content.replace(oldSummary, newSummary);

const oldButtons = `{pdfUrl ? (
              <>`;
const newButtons = `<Button variant="outline" onClick={() => { setSavedQuoteId(null); setFinalPlan(null); setCustomizerPlanId(null); }} className="w-full">
              Modify My Setup
            </Button>
            {pdfUrl ? (
              <>`;

content = content.replace(oldButtons, newButtons);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Updated WizardClientV2.tsx successfully");
