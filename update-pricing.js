const fs = require('fs');

let code = fs.readFileSync('lib/pricing-engine-v2.ts', 'utf8');

// 1. Add site prep surcharges after Labor
const sitePrepPricingLogic = `
  // --- Site Preparation Surcharges ---
  // Apply surcharges from configuration if flagged
  const prepCfg = settings.site_preparation || {
    ladderArrangementFee: 500,
    marbleLaborSurcharge: 400,
    metalInstallationSurcharge: 200,
    furnishedSiteSurcharge: 300,
    heavyWallDrillingSurcharge: 600
  };

  const flags = (resolvedSystem as any).site_surcharge_flags || {};
  
  if (flags.requiresLadderFee) {
    lineItems.push({
      product_id: "surcharge_ladder",
      display_name: "Ladder / Scaffolding Arrangement Fee",
      qty: 1,
      unit_price: prepCfg.ladderArrangementFee,
      line_total: prepCfg.ladderArrangementFee
    });
    laborTotal += prepCfg.ladderArrangementFee;
    baseHardwareCost += prepCfg.ladderArrangementFee;
  }

  if (flags.requiresMarbleSurcharge) {
    lineItems.push({
      product_id: "surcharge_marble",
      display_name: "Specialized Drilling (Marble/Stone)",
      qty: 1,
      unit_price: prepCfg.marbleLaborSurcharge,
      line_total: prepCfg.marbleLaborSurcharge
    });
    laborTotal += prepCfg.marbleLaborSurcharge;
    baseHardwareCost += prepCfg.marbleLaborSurcharge;
  }

  if (flags.requiresMetalSurcharge) {
    lineItems.push({
      product_id: "surcharge_metal",
      display_name: "Metal/Pole Installation Surcharge",
      qty: 1,
      unit_price: prepCfg.metalInstallationSurcharge,
      line_total: prepCfg.metalInstallationSurcharge
    });
    laborTotal += prepCfg.metalInstallationSurcharge;
    baseHardwareCost += prepCfg.metalInstallationSurcharge;
  }

  if (flags.requiresFurnishedSurcharge) {
    lineItems.push({
      product_id: "surcharge_furnished",
      display_name: "Furnished Site Care & Cleanup Premium",
      qty: 1,
      unit_price: prepCfg.furnishedSiteSurcharge,
      line_total: prepCfg.furnishedSiteSurcharge
    });
    laborTotal += prepCfg.furnishedSiteSurcharge;
    baseHardwareCost += prepCfg.furnishedSiteSurcharge;
  }

  if (flags.requiresHeavyDrillingSurcharge) {
    lineItems.push({
      product_id: "surcharge_wall_drilling",
      display_name: "Heavy Wall/Floor Penetration Surcharge",
      qty: 1,
      unit_price: prepCfg.heavyWallDrillingSurcharge,
      line_total: prepCfg.heavyWallDrillingSurcharge
    });
    laborTotal += prepCfg.heavyWallDrillingSurcharge;
    baseHardwareCost += prepCfg.heavyWallDrillingSurcharge;
  }

  // --- End Site Preparation Surcharges ---

  // Add-ons`;

code = code.replace(
  '  // Add-ons',
  sitePrepPricingLogic
);

// We need to pass `site_surcharge_flags` from config to `resolvedSystem` inside `resolveProducts`
// But in `app/api/quote/generate/route.ts` it calls `calculatePricingV2` passing `resolvedSystem`.
// I should add `site_surcharge_flags: config.site_surcharge_flags` inside `lib/product-resolver.ts` output.

fs.writeFileSync('lib/pricing-engine-v2.ts', code);
