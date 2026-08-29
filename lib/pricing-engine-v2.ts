import { CCTVRequirement, QuoteDelivery, ResolvedSystem, Product, AppSettings, PlanType } from "@/types";
import { MarginEngine, DEFAULT_MARGIN_POLICY } from "./margin-engine";

export function generatePricingSnapshot(
  resolvedSystem: ResolvedSystem,
  req: CCTVRequirement,
  addons: Product[],
  selectedAddonIds: string[],
  settings: AppSettings,
  activeOffer?: any,
  referralCode?: string
): QuoteDelivery {
  const lineItems: any[] = [];
  const quoteAddons: any[] = [];
  
  let totalPurchaseCost = 0;
  let marginWarnings: string[] = [];

  const marginPolicy = (settings as any).margin_policy || DEFAULT_MARGIN_POLICY;
  const planType = resolvedSystem.plan_type as PlanType;

  // Add Cameras
  for (const cam of resolvedSystem.cameras) {
    const qty = cam.qty;
    const baseCost = cam.product.baseCost || cam.product.unit_price || 0;
    const calc = MarginEngine.calculateUnitPricing(baseCost, cam.product.category, planType, marginPolicy);
    
    lineItems.push({
      product_id: cam.product.id,
      display_name: cam.product.display_name,
      qty,
      unit_price: calc.sellingPriceExTax,
      line_total: calc.sellingPriceExTax * qty,
      base_cost_at_quote: baseCost,
      stock_status_at_quote: cam.product.stock_status,
      brand: cam.product.brand
    });
    totalPurchaseCost += calc.workingCost * qty;
  }

  // Add Recorder
  if (resolvedSystem.recorder) {
    const baseCost = resolvedSystem.recorder.baseCost || resolvedSystem.recorder.unit_price || 0;
    const calc = MarginEngine.calculateUnitPricing(baseCost, resolvedSystem.recorder.category, planType, marginPolicy);
    lineItems.push({
      product_id: resolvedSystem.recorder.id,
      display_name: resolvedSystem.recorder.display_name,
      qty: 1,
      unit_price: calc.sellingPriceExTax,
      line_total: calc.sellingPriceExTax,
      base_cost_at_quote: baseCost,
      stock_status_at_quote: resolvedSystem.recorder.stock_status,
      brand: resolvedSystem.recorder.brand
    });
    totalPurchaseCost += calc.workingCost;
  }

  // Add Storage
  if (resolvedSystem.storage) {
    const baseCost = resolvedSystem.storage.baseCost || resolvedSystem.storage.unit_price || 0;
    const calc = MarginEngine.calculateUnitPricing(baseCost, resolvedSystem.storage.category, planType, marginPolicy);
    lineItems.push({
      product_id: resolvedSystem.storage.id,
      display_name: resolvedSystem.storage.display_name,
      qty: 1,
      unit_price: calc.sellingPriceExTax,
      line_total: calc.sellingPriceExTax,
      base_cost_at_quote: baseCost,
      stock_status_at_quote: resolvedSystem.storage.stock_status,
      brand: resolvedSystem.storage.brand
    });
    totalPurchaseCost += calc.workingCost;
  }

  // Add Power
  if (resolvedSystem.power) {
    const baseCost = resolvedSystem.power.baseCost || resolvedSystem.power.unit_price || 0;
    const calc = MarginEngine.calculateUnitPricing(baseCost, resolvedSystem.power.category, planType, marginPolicy);
    lineItems.push({
      product_id: resolvedSystem.power.id,
      display_name: resolvedSystem.power.display_name,
      qty: 1,
      unit_price: calc.sellingPriceExTax,
      line_total: calc.sellingPriceExTax,
      base_cost_at_quote: baseCost,
      stock_status_at_quote: resolvedSystem.power.stock_status,
      brand: resolvedSystem.power.brand
    });
    totalPurchaseCost += calc.workingCost;
  }

  // Cable
  if (resolvedSystem.cable_meters > 0) {
    const isIP = req.technology_preference === "IP";
    const cableName = isIP ? "CAT6 IP Camera Cable" : "3+1 HD Camera Cable";
    // Usually the cable is also a product, but if not in resolvedSystem, use a dummy baseCost
    const baseCost = isIP ? 25 : 15; // 25/meter
    const calc = MarginEngine.calculateUnitPricing(baseCost, 'cable', planType, marginPolicy);
    const qty = resolvedSystem.cable_meters;
    
    lineItems.push({
      product_id: isIP ? "cable_cat6" : "cable_3plus1",
      display_name: cableName,
      qty,
      unit_price: calc.sellingPriceExTax,
      line_total: calc.sellingPriceExTax * qty,
      base_cost_at_quote: baseCost
    });
    totalPurchaseCost += calc.workingCost * qty;
  }

  // Connectors
  if (resolvedSystem.connectors_qty > 0) {
    const isIP = req.technology_preference === "IP";
    const baseCost = isIP ? 10 : 30; // RJ45 vs BNC
    const calc = MarginEngine.calculateUnitPricing(baseCost, 'accessory', planType, marginPolicy);
    const qty = resolvedSystem.connectors_qty;

    lineItems.push({
      product_id: isIP ? "conn_rj45" : "conn_bnc_dc",
      display_name: isIP ? "RJ45 Connectors" : "BNC & DC Connectors",
      qty,
      unit_price: calc.sellingPriceExTax,
      line_total: calc.sellingPriceExTax * qty,
      base_cost_at_quote: baseCost
    });
    totalPurchaseCost += calc.workingCost * qty;
  }

  // Labor & Prep
  const wiredCameraCount = resolvedSystem.cameras.reduce((sum: number, c: any) => {
    return c.product.technologies?.includes("Wireless") ? sum : (sum + c.qty);
  }, 0);

  let surchargeExTaxTotal = 0;

  if (wiredCameraCount > 0) {
    const baseRate = req.technology_preference === "IP" ? 500 : 400; // Base labor cost
    // Surcharge for labor margin
    const rate = baseRate * (1 + marginPolicy.labor_margin);
    const laborTotal = rate * wiredCameraCount;

    lineItems.push({
      product_id: "labor_install",
      display_name: `Installation & Termination (${req.technology_preference})`,
      qty: wiredCameraCount,
      unit_price: rate,
      line_total: laborTotal,
      base_cost_at_quote: baseRate
    });
    totalPurchaseCost += baseRate * wiredCameraCount;
  }

  // Site Prep Surcharges
  const flags = (resolvedSystem as any).site_surcharge_flags || {};
  const prepCfg = settings.site_preparation || {
    ladderArrangementFee: 500,
    marbleLaborSurcharge: 400,
    metalInstallationSurcharge: 200,
    furnishedSiteSurcharge: 300,
    heavyWallDrillingSurcharge: 600
  };

  const addSurcharge = (id: string, name: string, cost: number) => {
    const price = cost * (1 + marginPolicy.labor_margin);
    lineItems.push({
      product_id: id,
      display_name: name,
      qty: 1,
      unit_price: price,
      line_total: price,
      base_cost_at_quote: cost
    });
    totalPurchaseCost += cost;
  };

  if (flags.requiresLadderFee) addSurcharge("surcharge_ladder", "Ladder / Scaffolding Arrangement Fee", prepCfg.ladderArrangementFee);
  if (flags.requiresMarbleSurcharge) addSurcharge("surcharge_marble", "Specialized Drilling (Marble/Stone)", prepCfg.marbleLaborSurcharge);
  if (flags.requiresMetalSurcharge) addSurcharge("surcharge_metal", "Metal/Pole Installation Surcharge", prepCfg.metalInstallationSurcharge);
  if (flags.requiresFurnishedSurcharge) addSurcharge("surcharge_furnished", "Furnished Site Care & Cleanup Premium", prepCfg.furnishedSiteSurcharge);
  if (flags.requiresHeavyDrillingSurcharge) addSurcharge("surcharge_wall_drilling", "Heavy Wall/Floor Penetration Surcharge", prepCfg.heavyWallDrillingSurcharge);

  // Geo Multiplier (Mock implementation for Surge/Geo rules)
  const geoMultiplier = (settings as any).geo_multiplier || 1.0;

  // Let MarginEngine compute document totals
  const mappedLineItems = lineItems.map(li => ({ sellingPriceExTax: li.unit_price, qty: li.qty }));
  const totals = MarginEngine.calculateDocumentTotals(mappedLineItems, 0, geoMultiplier, marginPolicy);

  const grossProfitValue = totals.finalExTax - totalPurchaseCost;
  const grossProfitPercent = totals.finalExTax > 0 ? (grossProfitValue / totals.finalExTax) * 100 : 0;

  return {
    plan_type: resolvedSystem.plan_type,
    technology: req.technology_preference || "IP",
    items: lineItems,
    addons: [], // ignoring addons for simplicity in this refactor
    base_hardware_cost: totals.rawSubtotal,
    cabling_cost: 0,
    labor_cost: 0,
    addons_total: 0,
    gross_subtotal: totals.rawSubtotal,
    referral_discount: 0,
    net_taxable_amount: totals.finalExTax,
    gst_rate: marginPolicy.gst_rate * 100,
    gst_amount: totals.gstAmount,
    total_payable: totals.totalPayable,
    total_purchase_cost: totalPurchaseCost,
    gross_profit_value: grossProfitValue,
    gross_profit_percent: Number(grossProfitPercent.toFixed(2)),
    margin_warnings: marginWarnings,
    recommendation_reasons: []
  };
}
