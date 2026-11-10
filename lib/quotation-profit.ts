/**
 * Quotation Profitability & Margin Intelligence Engine
 * 
 * Provides rigorous, multi-tiered gross profit and margin breakup:
 * 1. Product Margin (WITHOUT Services) - Pure equipment & material profitability
 * 2. Service Margin - Labor, cabling labor, difficulty surcharges, AMC
 * 3. Blended Overall Margin (WITH Services) - Complete turnkey deal profitability
 * 4. Category-level contribution & Supply-only comparison simulation
 */

export interface ItemProfitDetail {
  product_id: string;
  name: string;
  brand?: string;
  category: "camera" | "recorder" | "storage" | "power" | "cable" | "accessory" | "service" | "other";
  category_label: string;
  is_service: boolean;
  qty: number;
  unit_price: number;
  selling_total: number;
  unit_cost: number;
  cost_total: number;
  profit_value: number;
  profit_percent: number;
}

export interface CategoryProfitSummary {
  category: string;
  label: string;
  is_service: boolean;
  item_count: number;
  revenue: number;
  cost: number;
  profit: number;
  margin_percent: number;
}

export interface QuotationProfitBreakup {
  // 1. Products Only (WITHOUT Services)
  products: {
    gross_revenue: number;
    discount_allocated: number;
    revenue: number;           // Ex-tax product selling price (after proportional discount)
    cost: number;              // Total distributor/purchase cost of equipment
    profit: number;            // Product gross profit (₹)
    margin_percent: number;    // Product profit margin (%) -> WITHOUT SERVICES
    item_count: number;
  };
  
  // 2. Services Only
  services: {
    gross_revenue: number;
    discount_allocated: number;
    revenue: number;           // Billed labor, installation, surcharges, service addons
    cost: number;              // Subcontractor/technician payout direct cost
    profit: number;            // Service gross profit (₹)
    margin_percent: number;    // Service margin (%)
    item_count: number;
  };

  // 3. Total Deal (WITH Services)
  overall: {
    gross_subtotal: number;
    discount: number;
    revenue: number;           // Total net taxable amount
    cost: number;              // Total direct cost (products + services)
    profit: number;            // Overall gross profit (₹)
    margin_percent: number;    // Blended gross profit margin (%) -> WITH SERVICES
    gst_rate: number;
    gst_amount: number;
    total_payable: number;     // Grand total payable by customer
  };

  // Health diagnosis & strategic alerts
  health: {
    status: "healthy" | "subsidized" | "low_margin" | "critical";
    badge_text: string;
    description: string;
    warnings: string[];
  };

  // Category-level breakdown (Cameras, Recorders, Storage, Cables, Accessories, Services)
  categories: CategoryProfitSummary[];

  // Detailed items list with individual margins
  items: ItemProfitDetail[];

  // Supply-Only comparison simulation (if customer cancels installation)
  supply_only_estimate: {
    revenue: number;
    cost: number;
    profit: number;
    margin_percent: number;
    total_payable_with_gst: number;
    savings_for_customer: number;
  };
}

const CATEGORY_META: Record<string, { label: string; defaultMargin: number }> = {
  camera: { label: "Cameras (HD / IP / WiFi)", defaultMargin: 0.15 },
  recorder: { label: "Recorders (DVR / NVR)", defaultMargin: 0.15 },
  storage: { label: "Surveillance Storage (HDD / SD)", defaultMargin: 0.07 },
  power: { label: "Power Supplies & PoE", defaultMargin: 0.25 },
  cable: { label: "Cables & Wiring", defaultMargin: 0.40 },
  accessory: { label: "Accessories & Racks", defaultMargin: 0.50 },
  service: { label: "Installation & Services", defaultMargin: 0.30 },
  other: { label: "Miscellaneous Materials", defaultMargin: 0.20 },
};

export function classifyItem(id: string = "", name: string = "", category: string = ""): {
  isService: boolean;
  category: "camera" | "recorder" | "storage" | "power" | "cable" | "accessory" | "service" | "other";
  category_label: string;
} {
  const lowerId = String(id || "").toLowerCase();
  const lowerName = String(name || "").toLowerCase();
  const lowerCat = String(category || "").toLowerCase();

  const isService = 
    lowerId.startsWith("labor_") ||
    lowerId.startsWith("surcharge_") ||
    lowerId === "travel_fee" ||
    lowerCat === "service" ||
    lowerName.includes("installation") ||
    lowerName.includes("mounting") ||
    lowerName.includes("fitting") ||
    lowerName.includes("surcharge") ||
    lowerName.includes("arrangement fee") ||
    lowerName.includes("app setup") ||
    lowerName.includes("travel fee") ||
    lowerName.includes("site survey") ||
    lowerName.includes("amc") ||
    lowerName.includes("maintenance");

  let catKey: "camera" | "recorder" | "storage" | "power" | "cable" | "accessory" | "service" | "other" = "other";

  if (isService) {
    catKey = "service";
  } else if (
    lowerId.includes("hdd") ||
    lowerName.includes("hard disk") ||
    lowerName.includes("hdd") ||
    lowerName.includes("microsd") ||
    lowerName.includes("wd purple") ||
    lowerName.includes("seagate") ||
    lowerCat.includes("storage")
  ) {
    catKey = "storage";
  } else if (
    lowerName.includes("camera") ||
    lowerName.includes("dome") ||
    lowerName.includes("bullet") ||
    lowerName.includes("ptz") ||
    lowerCat.includes("camera")
  ) {
    catKey = "camera";
  } else if (
    lowerName.includes("dvr") ||
    lowerName.includes("nvr") ||
    lowerName.includes("recorder") ||
    lowerCat.includes("recorder")
  ) {
    catKey = "recorder";
  } else if (
    lowerName.includes("power") ||
    lowerName.includes("smps") ||
    lowerName.includes("poe") ||
    lowerName.includes("adapter") ||
    lowerCat.includes("power")
  ) {
    catKey = "power";
  } else if (
    lowerName.includes("cable") ||
    lowerName.includes("wire") ||
    lowerName.includes("cat6") ||
    lowerName.includes("3+1") ||
    lowerCat.includes("cable")
  ) {
    catKey = "cable";
  } else if (
    lowerName.includes("box") ||
    lowerName.includes("rack") ||
    lowerName.includes("connector") ||
    lowerName.includes("bnc") ||
    lowerName.includes("dc") ||
    lowerName.includes("rj45") ||
    lowerCat.includes("accessory")
  ) {
    catKey = "accessory";
  }

  return {
    isService,
    category: catKey,
    category_label: CATEGORY_META[catKey]?.label || "Other"
  };
}

/**
 * Calculates full profit and margin breakup from any quote or pricing snapshot.
 * Handles both new pricing engine results and backward-compatible saved quotes.
 */
export function calculateQuotationProfitBreakup(
  pricing: any,
  settings?: any
): QuotationProfitBreakup {
  if (!pricing) {
    return createEmptyProfitBreakup();
  }

  const rawItems: any[] = Array.isArray(pricing.items) ? pricing.items : [];
  const rawAddons: any[] = Array.isArray(pricing.addons) ? pricing.addons : [];
  
  // Labor margin / technician payout cost ratio from settings (e.g. 70% of retail goes to technician/direct cost)
  const laborCostMarginPercent = Number(settings?.labor_cost_margin_percent ?? 0);
  const minMarginThreshold = Number(settings?.minimum_margin_threshold ?? 15);

  const processedItems: ItemProfitDetail[] = [];

  // Check if labor is explicitly represented in rawItems
  let hasExplicitLaborInItems = false;

  for (const it of rawItems) {
    const id = it.product_id || it.id || "";
    const name = it.display_name || it.name || "Item";
    const brand = it.brand || "";
    const qty = Math.max(1, Number(it.qty || it.quantity || 1));
    const unitPrice = Number(it.unit_price ?? it.price ?? 0);
    const lineTotal = Number(it.line_total ?? (unitPrice * qty));

    const { isService, category, category_label } = classifyItem(id, name, it.category);
    if (isService && (name.toLowerCase().includes("installation") || name.toLowerCase().includes("mounting") || id.startsWith("labor_"))) {
      hasExplicitLaborInItems = true;
    }

    // Determine unit cost
    let unitCost: number;
    if (it.base_cost_at_quote !== undefined && it.base_cost_at_quote !== null) {
      unitCost = Number(it.base_cost_at_quote);
    } else if (it.base_cost !== undefined && it.base_cost !== null) {
      unitCost = Number(it.base_cost);
    } else if (isService) {
      // For surcharges: pass-through 0% margin (cost = price)
      if (id.startsWith("surcharge_") || name.toLowerCase().includes("surcharge") || id === "travel_fee") {
        unitCost = unitPrice;
      } else if (name.toLowerCase().includes("wireless") || id.includes("wireless")) {
        unitCost = Number(settings?.cost_labor_wireless_per_camera ?? 200);
      } else if (name.toLowerCase().includes("ip") || id.includes("ip")) {
        unitCost = Number(id.includes("fitting") ? (settings?.cost_labor_ip_fitting_only ?? 180) : (settings?.cost_labor_ip_per_camera ?? 300));
      } else if (name.toLowerCase().includes("fitting") || id.includes("fitting")) {
        unitCost = Number(settings?.cost_labor_hd_fitting_only ?? 120);
      } else if (id.includes("conduit") || name.toLowerCase().includes("conduit")) {
        unitCost = Number(settings?.cost_conduit_per_meter ?? 12);
      } else if (id.includes("visit") || name.toLowerCase().includes("visit") || name.toLowerCase().includes("mobilization")) {
        unitCost = Number(settings?.cost_labor_visit_charge ?? 300);
      } else {
        unitCost = Number(settings?.cost_labor_hd_per_camera ?? (laborCostMarginPercent > 0 ? Math.round(unitPrice * (laborCostMarginPercent / 100)) : 250));
      }
    } else {
      // Estimate based on category default markup: price = cost * (1 + margin) => cost = price / (1 + margin)
      const defMargin = CATEGORY_META[category]?.defaultMargin || 0.15;
      unitCost = Math.round(unitPrice / (1 + defMargin));
    }

    const costTotal = Math.round(unitCost * qty);
    const profitValue = lineTotal - costTotal;
    const profitPercent = lineTotal > 0 ? Number(((profitValue / lineTotal) * 100).toFixed(2)) : 0;

    processedItems.push({
      product_id: id,
      name,
      brand,
      category,
      category_label,
      is_service: isService,
      qty,
      unit_price: unitPrice,
      selling_total: lineTotal,
      unit_cost: unitCost,
      cost_total: costTotal,
      profit_value: profitValue,
      profit_percent: profitPercent
    });
  }

  // If labor_cost is recorded at the root pricing level but not present as a line item, inject it
  const rootLaborCost = Number(pricing.labor_cost || 0);
  if (rootLaborCost > 0 && !hasExplicitLaborInItems) {
    const laborPayoutCost = Math.round(rootLaborCost * (laborCostMarginPercent / 100));
    const profitVal = rootLaborCost - laborPayoutCost;
    const profitPct = rootLaborCost > 0 ? Number(((profitVal / rootLaborCost) * 100).toFixed(2)) : 0;

    processedItems.push({
      product_id: "labor_installation_summary",
      name: "Standard Camera Installation & App Setup",
      category: "service",
      category_label: "Installation & Services",
      is_service: true,
      qty: 1,
      unit_price: rootLaborCost,
      selling_total: rootLaborCost,
      unit_cost: laborPayoutCost,
      cost_total: laborPayoutCost,
      profit_value: profitVal,
      profit_percent: profitPct
    });
  }

  // Addons processing
  for (const ad of rawAddons) {
    const id = ad.addon_id || ad.id || "";
    const name = ad.display_name || ad.name || "Addon";
    const qty = Math.max(1, Number(ad.qty || 1));
    const price = Number(ad.price ?? ad.unit_price ?? 0);
    const lineTotal = price * qty;

    const { isService, category, category_label } = classifyItem(id, name, ad.category);

    let unitCost: number;
    if (ad.base_cost_at_quote !== undefined && ad.base_cost_at_quote !== null) {
      unitCost = Number(ad.base_cost_at_quote);
    } else if (ad.base_cost !== undefined && ad.base_cost !== null) {
      unitCost = Number(ad.base_cost);
    } else if (isService) {
      unitCost = Math.round(price * (laborCostMarginPercent / 100));
    } else {
      const defMargin = CATEGORY_META[category]?.defaultMargin || 0.25;
      unitCost = Math.round(price / (1 + defMargin));
    }

    const costTotal = Math.round(unitCost * qty);
    const profitValue = lineTotal - costTotal;
    const profitPercent = lineTotal > 0 ? Number(((profitValue / lineTotal) * 100).toFixed(2)) : 0;

    processedItems.push({
      product_id: id,
      name,
      category,
      category_label,
      is_service: isService,
      qty,
      unit_price: price,
      selling_total: lineTotal,
      unit_cost: unitCost,
      cost_total: costTotal,
      profit_value: profitValue,
      profit_percent: profitPercent
    });
  }

  // Aggregation
  let productGross = 0;
  let productCost = 0;
  let productCount = 0;

  let serviceGross = 0;
  let serviceCost = 0;
  let serviceCount = 0;

  const categoryMap = new Map<string, CategoryProfitSummary>();

  for (const item of processedItems) {
    if (item.is_service) {
      serviceGross += item.selling_total;
      serviceCost += item.cost_total;
      serviceCount += item.qty;
    } else {
      productGross += item.selling_total;
      productCost += item.cost_total;
      productCount += item.qty;
    }

    const cKey = item.category;
    if (!categoryMap.has(cKey)) {
      categoryMap.set(cKey, {
        category: cKey,
        label: item.category_label,
        is_service: item.is_service,
        item_count: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin_percent: 0
      });
    }

    const cData = categoryMap.get(cKey)!;
    cData.item_count += item.qty;
    cData.revenue += item.selling_total;
    cData.cost += item.cost_total;
  }

  // Finalize Category Summaries
  const categories: CategoryProfitSummary[] = Array.from(categoryMap.values()).map(cat => {
    const profit = cat.revenue - cat.cost;
    const margin = cat.revenue > 0 ? Number(((profit / cat.revenue) * 100).toFixed(2)) : 0;
    return {
      ...cat,
      profit,
      margin_percent: margin
    };
  });

  // Sort categories: cameras first, recorders, storage, cables, accessories, then services
  const catOrder = ["camera", "recorder", "storage", "power", "cable", "accessory", "other", "service"];
  categories.sort((a, b) => catOrder.indexOf(a.category) - catOrder.indexOf(b.category));

  // Discounts & Subtotals
  const totalGrossSubtotal = productGross + serviceGross;
  const recordedGrossSubtotal = Number(pricing.gross_subtotal || totalGrossSubtotal);
  const totalDiscount = Math.max(0, Number(pricing.referral_discount || pricing.discount_amount || 0));

  // Proportional discount allocation
  const effectiveBase = totalGrossSubtotal > 0 ? totalGrossSubtotal : recordedGrossSubtotal;
  const productDiscount = effectiveBase > 0 ? Math.round(totalDiscount * (productGross / effectiveBase)) : 0;
  const serviceDiscount = Math.max(0, totalDiscount - productDiscount);

  const productNet = Math.max(0, productGross - productDiscount);
  const serviceNet = Math.max(0, serviceGross - serviceDiscount);

  const productProfit = productNet - productCost;
  const productMarginPercent = productNet > 0 ? Number(((productProfit / productNet) * 100).toFixed(2)) : 0;

  const serviceProfit = serviceNet - serviceCost;
  const serviceMarginPercent = serviceNet > 0 ? Number(((serviceProfit / serviceNet) * 100).toFixed(2)) : 0;

  const overallNetRevenue = productNet + serviceNet;
  const overallCost = productCost + serviceCost;
  const overallProfit = overallNetRevenue - overallCost;
  const overallMarginPercent = overallNetRevenue > 0 ? Number(((overallProfit / overallNetRevenue) * 100).toFixed(2)) : 0;

  const gstRate = Number(pricing.gst_rate ?? 18);
  const gstAmount = Number(pricing.gst_amount ?? Math.round(overallNetRevenue * (gstRate / 100)));
  const totalPayable = Number(pricing.total_payable ?? (overallNetRevenue + gstAmount));

  // Health Diagnosis & Warnings
  const warnings: string[] = [];
  let status: "healthy" | "subsidized" | "low_margin" | "critical" = "healthy";
  let badge_text = "Healthy Deal (Strong Product Margin)";
  let description = "Both product margin and overall turnkey profitability exceed target operational thresholds.";

  if (productMarginPercent < 0 || overallMarginPercent < 5) {
    status = "critical";
    badge_text = "Critical Margin Risk";
    description = "Deal is operating at or near negative margin. Any on-site rework or warranty replacement will generate a net loss.";
    warnings.push(`Extreme risk: Overall margin is only ${overallMarginPercent}% (Product: ${productMarginPercent}%)`);
  } else if (productMarginPercent < 10 && overallMarginPercent >= minMarginThreshold) {
    status = "subsidized";
    badge_text = "Service Subsidized (Low Material Margin)";
    description = "Hardware is priced near distributor cost; profitability is almost entirely dependent on installation labor.";
    warnings.push(`Product margin is compressed to ${productMarginPercent}%. If the client cancels installation, hardware profit will be razor-thin.`);
  } else if (overallMarginPercent < minMarginThreshold) {
    status = "low_margin";
    badge_text = `Low Margin Alert (< ${minMarginThreshold}%)`;
    description = `Total blended margin (${overallMarginPercent}%) is below your company target of ${minMarginThreshold}%.`;
    warnings.push(`Target threshold is ${minMarginThreshold}%, but this deal provides ${overallMarginPercent}%.`);
  }

  // Supply-Only comparison simulation
  const supplyOnlyPayable = Math.round(productNet * (1 + gstRate / 100));
  const savingsForCustomer = Math.max(0, totalPayable - supplyOnlyPayable);

  return {
    products: {
      gross_revenue: productGross,
      discount_allocated: productDiscount,
      revenue: productNet,
      cost: productCost,
      profit: productProfit,
      margin_percent: productMarginPercent,
      item_count: productCount
    },
    services: {
      gross_revenue: serviceGross,
      discount_allocated: serviceDiscount,
      revenue: serviceNet,
      cost: serviceCost,
      profit: serviceProfit,
      margin_percent: serviceMarginPercent,
      item_count: serviceCount
    },
    overall: {
      gross_subtotal: effectiveBase,
      discount: totalDiscount,
      revenue: overallNetRevenue,
      cost: overallCost,
      profit: overallProfit,
      margin_percent: overallMarginPercent,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      total_payable: totalPayable
    },
    health: {
      status,
      badge_text,
      description,
      warnings
    },
    categories,
    items: processedItems,
    supply_only_estimate: {
      revenue: productNet,
      cost: productCost,
      profit: productProfit,
      margin_percent: productMarginPercent,
      total_payable_with_gst: supplyOnlyPayable,
      savings_for_customer: savingsForCustomer
    }
  };
}

function createEmptyProfitBreakup(): QuotationProfitBreakup {
  return {
    products: {
      gross_revenue: 0,
      discount_allocated: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
      margin_percent: 0,
      item_count: 0
    },
    services: {
      gross_revenue: 0,
      discount_allocated: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
      margin_percent: 0,
      item_count: 0
    },
    overall: {
      gross_subtotal: 0,
      discount: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
      margin_percent: 0,
      gst_rate: 18,
      gst_amount: 0,
      total_payable: 0
    },
    health: {
      status: "healthy",
      badge_text: "No Quote Data",
      description: "No items available to calculate profit breakup.",
      warnings: []
    },
    categories: [],
    items: [],
    supply_only_estimate: {
      revenue: 0,
      cost: 0,
      profit: 0,
      margin_percent: 0,
      total_payable_with_gst: 0,
      savings_for_customer: 0
    }
  };
}
