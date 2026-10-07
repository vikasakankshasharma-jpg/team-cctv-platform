import fs from "fs";

let content = fs.readFileSync("components/CameraCustomizer.tsx", "utf8");

const importReplacement = `import { useState, useMemo } from "react";
import { CCTVRequirement, PricingResult, Addon, Product } from "@/types";`;

content = content.replace(/import \{ useState, useMemo \} from "react";\nimport \{ CCTVRequirement, PricingResult, Addon \} from "@\/types";/, importReplacement);

const propsReplacement = `interface CameraCustomizerProps {
  basePlanId: string;
  basePlan: PricingResult;
  requirement: CCTVRequirement;
  availableAddons: Addon[];
  storageDrives?: Product[];
  onBack: () => void;
  onConfirm: (modifiedPlan: PricingResult) => void;
  isSaving: boolean;
}

export function CameraCustomizer({ basePlanId, basePlan, requirement, availableAddons, storageDrives, onBack, onConfirm, isSaving }: CameraCustomizerProps) {
  
  const [wantsPremiumStorage, setWantsPremiumStorage] = useState(false);
`;

content = content.replace(/interface CameraCustomizerProps \{[^]+?export function CameraCustomizer\([^)]+\) \{/, propsReplacement);

const storageUpgradeLogic = `
  const storageUpgrade = useMemo(() => {
     if (!storageDrives) return null;
     const currentStorageItem = basePlan.items.find(i => i.product_id.includes("storage") || i.display_name.toLowerCase().includes("hdd") || i.display_name.toLowerCase().includes("hard disk"));
     if (!currentStorageItem) return null;
     
     const tbMatch = currentStorageItem.display_name.match(/(\\d+)\\s*TB/i);
     const gbMatch = currentStorageItem.display_name.match(/(\\d+)\\s*GB/i);
     let tb = 0;
     if (tbMatch) tb = parseInt(tbMatch[1]);
     else if (gbMatch) tb = parseInt(gbMatch[1]) / 1024;
     
     if (tb === 0) return null;
     
     const currentName = currentStorageItem.display_name.toLowerCase();
     if (currentName.includes("seagate") || currentName.includes("wd") || currentName.includes("western") || currentName.includes("purple") || currentName.includes("skyhawk") || currentName.includes("toshiba")) {
         return null; // Already premium
     }
     
     const premiumDrives = storageDrives.filter(p => {
         const pTb = p.storage_capacity_tb || (typeof p.capacity === 'string' ? parseInt(p.capacity.replace('TB', '')) || 0 : 0);
         if (pTb !== tb) return false;
         
         const l = (p.brand || p.display_name).toLowerCase();
         return l.includes("seagate") || l.includes("wd") || l.includes("western") || l.includes("purple") || l.includes("skyhawk") || l.includes("toshiba");
     }).sort((a, b) => (a.price || 0) - (b.price || 0));
     
     if (premiumDrives.length === 0) return null;
     
     const premiumDrive = premiumDrives[0];
     
     // Calculate price diff (Assuming item unit_price is exTax and product price is exTax)
     const diffExTax = (premiumDrive.price || 0) - currentStorageItem.unit_price;
     if (diffExTax <= 0) return null;
     
     return {
         id: premiumDrive.id!,
         name: \`Premium Storage Upgrade: \${premiumDrive.display_name}\`,
         desc: \`Upgrade from standard HDD to \${premiumDrive.brand || 'Premium'} Surveillance-grade Drive (\${tb}TB)\`,
         priceExTax: diffExTax,
         priceIncGst: diffExTax * 1.18,
         currentTb: tb
     };
  }, [basePlan, storageDrives]);
`;

content = content.replace(/const \[upgrades, setUpgrades\] = useState<Record<string, number>>\(\{\}\);/, `const [upgrades, setUpgrades] = useState<Record<string, number>>({});\n` + storageUpgradeLogic);

const modifiedPlanLogic = `  const modifiedPlan = useMemo(() => {
    let plan = JSON.parse(JSON.stringify(basePlan)) as PricingResult;
    let addedExTax = 0;

    Object.entries(upgrades).forEach(([upgId, qty]) => {
      const upgDef = UPGRADES.find(u => u.id === upgId);
      if (!upgDef || qty <= 0) return;
      
      const lineTotalEx = upgDef.priceExTax * qty;
      addedExTax += lineTotalEx;
      
      plan.items.push({
        product_id: upgId,
        display_name: \`\${qty}x Upgrade: \${upgDef.name}\`,
        qty: qty,
        unit_price: upgDef.priceExTax,
        line_total: lineTotalEx,
      });
    });

    if (wantsPremiumStorage && storageUpgrade) {
      addedExTax += storageUpgrade.priceExTax;
      
      // Update the existing item display name to reflect upgrade
      const idx = plan.items.findIndex(i => i.display_name.toLowerCase().includes("hdd") || i.display_name.toLowerCase().includes("hard disk"));
      if (idx !== -1) {
          plan.items[idx].display_name = \`[UPGRADED] \${storageUpgrade.name}\`;
          plan.items[idx].unit_price += storageUpgrade.priceExTax;
          plan.items[idx].line_total += storageUpgrade.priceExTax;
      } else {
          plan.items.push({
            product_id: storageUpgrade.id,
            display_name: storageUpgrade.name,
            qty: 1,
            unit_price: storageUpgrade.priceExTax,
            line_total: storageUpgrade.priceExTax,
          });
      }
    }

    if (addedExTax !== 0) {
      plan.base_hardware_cost += addedExTax;
      plan.finalExTax += addedExTax;
      
      const addedGst = addedExTax * 0.18;
      plan.gstAmount += addedGst;
      plan.total_payable = Math.round(plan.finalExTax + plan.gstAmount);
    }

    return plan;
  }, [basePlan, upgrades, wantsPremiumStorage, storageUpgrade, UPGRADES]);`;

content = content.replace(/const modifiedPlan = useMemo\(\(\) => \{[^]+?\}, \[basePlan, upgrades, UPGRADES\]\);/, modifiedPlanLogic);

const uiStorageCard = `             </CardContent>
           </Card>

           {storageUpgrade && (
           <Card className="border-2 border-blue-100 mb-6 bg-blue-50/50">
             <CardHeader className="pb-3 border-b bg-blue-50/50">
               <CardTitle className="text-xl text-blue-900 flex items-center">
                 <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                 Storage Quality
               </CardTitle>
             </CardHeader>
             <CardContent className="pt-4">
                 <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                   <div>
                     <h4 className="font-bold text-gray-900">Seagate / WD Surveillance HDD</h4>
                     <p className="text-xs text-gray-500">Highly recommended for 24x7 CCTV recording.</p>
                     <div className="text-sm font-semibold mt-1 text-gray-700">
                        + {formatPrice(storageUpgrade.priceIncGst)} total
                     </div>
                   </div>
                   <div>
                     <button 
                       onClick={() => setWantsPremiumStorage(!wantsPremiumStorage)}
                       className={\`px-4 py-2 rounded-lg font-bold transition-all \${wantsPremiumStorage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`}
                     >
                       {wantsPremiumStorage ? 'Added' : 'Upgrade'}
                     </button>
                   </div>
                 </div>
             </CardContent>
           </Card>
           )}

        </div>`;

content = content.replace(/             <\/CardContent>\n           <\/Card>\n\n        <\/div>/, uiStorageCard);

const invoiceDisplay = `              {Object.entries(upgrades).map(([id, qty]) => {
                if (qty === 0) return null;
                const upg = UPGRADES.find(u => u.id === id);
                if (!upg) return null;
                const amount = upg.priceIncGst * qty;
                return (
                  <div key={id} className="flex justify-between items-center text-sm text-blue-700 font-medium">
                    <span>{qty}x {upg.name}</span>
                    <span>{amount > 0 ? '+' : ''}{formatPrice(amount)}</span>
                  </div>
                );
              })}
              
              {wantsPremiumStorage && storageUpgrade && (
                  <div className="flex justify-between items-center text-sm text-blue-700 font-medium">
                    <span>1x Storage Upgrade (Seagate/WD)</span>
                    <span>+{formatPrice(storageUpgrade.priceIncGst)}</span>
                  </div>
              )}
              
              <div className="border-t pt-4 flex justify-between items-center font-bold text-xl">`;

content = content.replace(/              \{Object\.entries\(upgrades\)\.map\(\(\[id, qty\]\) => \{[^]+?\}\)\}\n              \n              <div className="border-t pt-4 flex justify-between items-center font-bold text-xl">/, invoiceDisplay);

fs.writeFileSync("components/CameraCustomizer.tsx", content);
console.log("Injected optional storage upgrade UI and logic");
