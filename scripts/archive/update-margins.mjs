import fs from "fs";

// 1. Update lib/margin-engine.ts
let marginContent = fs.readFileSync("lib/margin-engine.ts", "utf8");
marginContent = marginContent.replace(
  /calculateUnitPricing\(\s*baseCost: number,\s*vendorCategory: string,\s*tier: PlanType,\s*policy: MarginPolicyConfig = DEFAULT_MARGIN_POLICY\s*\): PricingCalculationResult \{/,
  `calculateUnitPricing(
    baseCost: number, 
    vendorCategory: string, 
    tier: PlanType, 
    policy: MarginPolicyConfig = DEFAULT_MARGIN_POLICY,
    productBrand?: string
  ): PricingCalculationResult {`
);

marginContent = marginContent.replace(
  /if \(category === 'anchor'\) \{\s*markup = policy\.anchor_margin\[tier\];\s*\}/,
  `if (category === 'anchor') {
      markup = policy.anchor_margin[tier];
      
      const vCat = (vendorCategory || '').toLowerCase();
      const pBrand = (productBrand || '').toLowerCase();

      // HDD: 5%
      if (vCat === 'storage' || vCat === 'hard disk') {
        markup = 0.05;
      }
      
      // CP Plus CCTV Camera & Recorder: 10%
      // Budget CCTV Camera: 30%
      else if (vCat.includes('camera') || vCat === 'cctv_camera' || vCat === 'recorder' || vCat === 'dvr' || vCat === 'nvr') {
        if (pBrand.includes('cp plus') || pBrand.includes('cpplus')) {
          markup = 0.10;
        } else if (pBrand.includes('budget')) {
          markup = 0.30;
        }
      }
    }`
);
fs.writeFileSync("lib/margin-engine.ts", marginContent);

// 2. Update lib/pricing-engine-v2.ts
let pricingContent = fs.readFileSync("lib/pricing-engine-v2.ts", "utf8");

pricingContent = pricingContent.replace(
  /const calc = MarginEngine\.calculateUnitPricing\(baseCost, cam\.product\.category, planType, marginPolicy\);/g,
  `const calc = MarginEngine.calculateUnitPricing(baseCost, cam.product.category, planType, marginPolicy, cam.product.brand);`
);

pricingContent = pricingContent.replace(
  /const calc = MarginEngine\.calculateUnitPricing\(baseCost, resolvedSystem\.recorder\.category, planType, marginPolicy\);/g,
  `const calc = MarginEngine.calculateUnitPricing(baseCost, resolvedSystem.recorder.category, planType, marginPolicy, resolvedSystem.recorder.brand);`
);

pricingContent = pricingContent.replace(
  /const calc = MarginEngine\.calculateUnitPricing\(baseCost, resolvedSystem\.storage\.category, planType, marginPolicy\);/g,
  `const calc = MarginEngine.calculateUnitPricing(baseCost, resolvedSystem.storage.category, planType, marginPolicy, resolvedSystem.storage.brand);`
);

pricingContent = pricingContent.replace(
  /const calc = MarginEngine\.calculateUnitPricing\(baseCost, resolvedSystem\.power\.category, planType, marginPolicy\);/g,
  `const calc = MarginEngine.calculateUnitPricing(baseCost, resolvedSystem.power.category, planType, marginPolicy, resolvedSystem.power.brand);`
);

fs.writeFileSync("lib/pricing-engine-v2.ts", pricingContent);

console.log("Updated both files");
