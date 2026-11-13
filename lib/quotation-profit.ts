/**
 * Quotation Profitability & Margin Intelligence Engine
 *
 * Provides rigorous, multi-layered gross & net pocket profit breakup:
 * 1. Product Margin (WITHOUT Services) - Pure equipment & material profitability
 * 2. Service Margin - Installation labor, Paid/Free AMC contracts, travel, difficulty surcharges, MINUS Referral/Partner commissions
 * 3. Combined Deal Margin (WITH Services) - Turnkey contribution after direct costs + referral commissions
 * 4. True Net Pocket Profit - After Payment Gateway MDR (+GST), 1st-yr onsite warranty reserve & job consumables
 * 5. Category-level contribution & Supply-only comparison simulation
 */

import { calculateCommission, resolvePromoterCommission } from "./commission";
import { reverseInclusiveGst, roundCurrency } from "./gst-utils";

export type ProfitItemCategory =
  | "camera"
  | "recorder"
  | "storage"
  | "power"
  | "cable"
  | "accessory"
  | "service"
  | "amc"
  | "commission"
  | "other";

export interface ItemProfitDetail {
  product_id: string;
  name: string;
  brand?: string;
  category: ProfitItemCategory;
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

export interface ProfitBreakupAmcSubscription {
  id?: string;
  planName?: string;
  amountPaid?: number;
  exTaxAmount?: number;
  isComplimentary?: boolean;
  includedVisits?: number;
  usedVisits?: number;
  actualAmcCost?: number;
  source?: string;
}

export interface ProfitBreakupContext {
  referral_code?: string | null;
  promoter_id?: string | null;
  promoter?: any;
  salesperson?: any;
  actual_commissions?: Array<{
    id?: string;
    user_type?: string;
    commission_amount?: number;
    status?: string;
    source?: string;
  }>;
  installer_payout_bonus?: number;
  amc_subscriptions?: ProfitBreakupAmcSubscription[];
  payment_method?: string;
  actual_pg_fee?: number | null;
  actual_pg_tax?: number | null;
  warranty_visits_cost?: number | null;
  logistics_cost?: number | null;
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

  // 2. Services Only (Labor + Paid/Free AMC + Surcharges - Referral Commission)
  services: {
    gross_revenue: number;
    discount_allocated: number;
    revenue: number;           // Billed labor, surcharges, Paid AMC contracts (after quote discount)
    cost: number;              // Tech labor + AMC fulfillment cost + referral commission deduction
    profit: number;            // Net Service profit (₹) after Paid AMC & Referral Commissions
    margin_percent: number;    // Net Service margin (%)
    item_count: number;
    // Granular Service Waterfall fields
    ops_revenue?: number;
    ops_cost?: number;
    ops_profit?: number;
    amc_revenue?: number;
    amc_cost?: number;
    amc_profit?: number;
    referral_commission_cost?: number;
    referral_commission_label?: string;
    referral_commission_source?: "actual" | "projected" | "none";
  };

  // 3. Total Deal (WITH Services & Commissions)
  overall: {
    gross_subtotal: number;
    discount: number;
    revenue: number;           // Total net taxable amount (incl. Paid AMC)
    cost: number;              // Total direct cost (products + services + referral commission)
    profit: number;            // Combined Deal profit (₹) before PG/Warranty overheads
    margin_percent: number;    // Blended deal margin (%) -> WITH SERVICES
    gst_rate: number;
    gst_amount: number;
    total_payable: number;     // Grand total payable by customer
  };

  // 4. Operating Overheads & True Net Pocket Profit
  overheads?: {
    payment_gateway_fee: number;
    payment_gateway_is_actual: boolean;
    warranty_reserve: number;
    logistics_consumables: number;
    installer_payout_bonus: number;
    total_overheads: number;
    net_profit: number;        // True pocket profit after PG MDR, warranty reserve & consumables
    net_margin_percent: number;
  };

  // Health diagnosis & strategic alerts
  health: {
    status: "healthy" | "subsidized" | "low_margin" | "critical";
    badge_text: string;
    description: string;
    warnings: string[];
  };

  // Category-level breakdown (Cameras, Recorders, Storage, Power, Cables, Accessories, Services, AMC, Commission)
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

const CATEGORY_META: Record<ProfitItemCategory, { label: string; defaultMargin: number }> = {
  camera: { label: "Cameras (HD / IP / WiFi)", defaultMargin: 0.15 },
  recorder: { label: "Recorders (DVR / NVR)", defaultMargin: 0.15 },
  storage: { label: "Surveillance Storage (HDD / SD)", defaultMargin: 0.07 },
  power: { label: "Power Supplies & PoE", defaultMargin: 0.25 },
  cable: { label: "Cables & Wiring", defaultMargin: 0.40 },
  accessory: { label: "Accessories & Racks", defaultMargin: 0.50 },
  service: { label: "Installation & Labor", defaultMargin: 0.30 },
  amc: { label: "Paid & Promo AMC Contracts", defaultMargin: 0.65 },
  commission: { label: "Referral & Partner Commission", defaultMargin: 0 },
  other: { label: "Miscellaneous Materials", defaultMargin: 0.20 },
};

export function classifyItem(id: string = "", name: string = "", category: string = ""): {
  isService: boolean;
  category: ProfitItemCategory;
  category_label: string;
} {
  const lowerId = String(id || "").toLowerCase();
  const lowerName = String(name || "").toLowerCase();
  const lowerCat = String(category || "").toLowerCase().trim();

  // Fast-path when pricing engine explicitly stamps a canonical ProfitItemCategory
  // Still distinguish AMC ("amc_*" / "promo_free_amc") and Commission ("commission_*") inside "service".
  const isExplicitAmc = lowerId.startsWith("amc_") || lowerId === "promo_free_amc" || lowerCat === "amc";
  const isExplicitCommission = lowerId.startsWith("commission_") || lowerCat === "commission";
  if (isExplicitAmc) {
    return { isService: true, category: "amc", category_label: CATEGORY_META.amc.label };
  }
  if (isExplicitCommission) {
    return { isService: true, category: "commission", category_label: CATEGORY_META.commission.label };
  }
  const canonicalHardwareCats: ProfitItemCategory[] = [
    "camera", "recorder", "storage", "power", "cable", "accessory"
  ];
  if (lowerCat === "service") {
    return { isService: true, category: "service", category_label: CATEGORY_META.service.label };
  }
  if ((canonicalHardwareCats as string[]).includes(lowerCat)) {
    const exactCat = lowerCat as ProfitItemCategory;
    return {
      isService: false,
      category: exactCat,
      category_label: CATEGORY_META[exactCat]?.label || "Other"
    };
  }

  const isService =
    lowerId.startsWith("labor_") ||
    lowerId.startsWith("svc-") ||
    lowerId.startsWith("svc_") ||
    lowerId.startsWith("surcharge_") ||
    lowerId.startsWith("commission_") ||
    lowerId.startsWith("amc_") ||
    lowerId === "travel_fee" ||
    lowerId === "promo_free_amc" ||
    lowerCat === "service" ||
    lowerCat === "amc" ||
    lowerCat === "commission" ||
    lowerName.includes("installation") ||
    lowerName.includes("mounting") ||
    lowerName.includes("fitting") ||
    lowerName.includes("surcharge") ||
    lowerName.includes("arrangement fee") ||
    lowerName.includes("app setup") ||
    lowerName.includes("travel fee") ||
    lowerName.includes("site survey") ||
    /\bamc\b/.test(lowerName) ||
    lowerName.includes("maintenance") ||
    /\bcommissions?\b/.test(lowerName) ||
    lowerName.includes("referral reward");

  let catKey: ProfitItemCategory = "other";

  if (isService) {
    if (
      lowerId.startsWith("commission_") ||
      lowerCat === "commission" ||
      /\bcommissions?\b/.test(lowerName) ||
      lowerName.includes("referral reward")
    ) {
      catKey = "commission";
    } else if (
      lowerId.startsWith("amc_") ||
      lowerId === "promo_free_amc" ||
      lowerCat === "amc" ||
      /\bamc\b/.test(lowerName) ||
      lowerName.includes("maintenance contract")
    ) {
      catKey = "amc";
    } else {
      catKey = "service";
    }
  } else if (
    lowerId.startsWith("cab-") ||
    lowerCat.includes("cable") ||
    lowerName.includes("cable") ||
    lowerName.includes("wire") ||
    lowerName.includes("cat6") ||
    lowerName.includes("3+1") ||
    lowerName.includes("coax") ||
    lowerName.includes("conduit") ||
    lowerName.includes("hdmi")
  ) {
    // Must check cables BEFORE cameras so "3+1 HD Camera Cable" classifies as cable, not camera!
    catKey = "cable";
  } else if (
    lowerId.startsWith("acc_") ||
    lowerId.startsWith("acc-") ||
    lowerId.startsWith("connector_") ||
    lowerCat.includes("accessory") ||
    lowerCat.includes("mount") ||
    lowerCat.includes("rack") ||
    lowerCat.includes("network") ||
    lowerCat.includes("display") ||
    lowerName.includes("junction box") ||
    /\b(junction|pvc|weatherproof)\s*box\b/.test(lowerName) ||
    /\b4x4\b/.test(lowerName) ||
    lowerName.includes("rack") ||
    lowerName.includes("connector") ||
    lowerName.includes("bnc") ||
    lowerName.includes("rj45") ||
    lowerName.includes("balun") ||
    lowerName.includes("mount") ||
    lowerName.includes("bracket") ||
    lowerName.includes("router") ||
    lowerName.includes("extender") ||
    lowerName.includes("display") ||
    lowerName.includes("monitor") ||
    /\bdc\b/.test(lowerName)
  ) {
    // Check accessories/mounts BEFORE cameras so "Camera Junction Box" does not classify as camera!
    catKey = "accessory";
  } else if (
    lowerId.includes("hdd") ||
    lowerId.includes("microsd") ||
    lowerId.includes("-sd-") ||
    lowerId.startsWith("sd-") ||
    lowerCat.includes("storage") ||
    lowerName.includes("hard disk") ||
    lowerName.includes("hdd") ||
    lowerName.includes("microsd") ||
    lowerName.includes("sd card") ||
    lowerName.includes("memory card") ||
    lowerName.includes("wd purple") ||
    lowerName.includes("seagate")
  ) {
    catKey = "storage";
  } else if (
    lowerCat.includes("power") ||
    lowerName.includes("power supply") ||
    lowerName.includes("smps") ||
    /\bpoe\b/.test(lowerName) ||
    lowerName.includes("adapter") ||
    /\bups\b/.test(lowerName) ||
    lowerName.includes("power")
  ) {
    // Check power BEFORE cameras so "Camera Power Supply" classifies as power!
    catKey = "power";
  } else if (
    lowerCat.includes("recorder") ||
    lowerName.includes("dvr") ||
    lowerName.includes("nvr") ||
    lowerName.includes("xvr") ||
    lowerName.includes("recorder")
  ) {
    catKey = "recorder";
  } else if (
    lowerCat.includes("camera") ||
    lowerName.includes("camera") ||
    lowerName.includes("dome") ||
    lowerName.includes("bullet") ||
    /\bptz\b/.test(lowerName) ||
    lowerName.includes("turret")
  ) {
    catKey = "camera";
  }

  return {
    isService,
    category: catKey,
    category_label: CATEGORY_META[catKey]?.label || "Other"
  };
}

/**
 * Calculates full profit and margin breakup from any quote or pricing snapshot,
 * including Paid AMC Contracts, Free Promo AMC Liabilities, Referral/Partner Commissions,
 * and Operating Overheads (Payment Gateway MDR, Warranty Reserve, Job Consumables).
 */
export function calculateQuotationProfitBreakup(
  pricing: any,
  settings?: any,
  context?: ProfitBreakupContext
): QuotationProfitBreakup {
  if (!pricing) {
    return createEmptyProfitBreakup();
  }

  const rawItems: any[] = Array.isArray(pricing.items) ? pricing.items : [];
  const rawAddons: any[] = Array.isArray(pricing.addons) ? pricing.addons : [];

  const laborCostMarginPercent = Number(settings?.labor_cost_margin_percent ?? 0);
  const minMarginThreshold = Number(settings?.minimum_margin_threshold ?? 15);
  const amcFulfillmentPct = Number(settings?.amc_fulfillment_cost_percent ?? 35);
  const travelFeePayoutPct = Number(settings?.travel_fee_payout_percent ?? 85);
  const gstRate = Number(pricing.gst_rate ?? settings?.gst_rate ?? 18);

  const processedItems: ItemProfitDetail[] = [];
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

    const promoVisitReserve = Math.round(Number(settings?.cost_labor_visit_charge ?? 300) * 2);
    let unitCost: number;
    if (id === "promo_free_amc") {
      const explicitCost = Number(it.base_cost_at_quote ?? it.base_cost ?? 0);
      unitCost = explicitCost > 0 ? explicitCost : promoVisitReserve;
    } else if (it.base_cost_at_quote !== undefined && it.base_cost_at_quote !== null) {
      unitCost = Number(it.base_cost_at_quote);
    } else if (it.base_cost !== undefined && it.base_cost !== null) {
      unitCost = Number(it.base_cost);
    } else if (isService) {
      if (id === "travel_fee") {
        unitCost = Math.round(unitPrice * (travelFeePayoutPct / 100));
      } else if (id.startsWith("surcharge_") || name.toLowerCase().includes("surcharge")) {
        unitCost = unitPrice;
      } else if (category === "amc") {
        unitCost = Math.round(Math.max(0, unitPrice) * (amcFulfillmentPct / 100));
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

  // If labor_cost is recorded at root level but absent from line items, inject fallback labor item
  const rootLaborCost = Number(pricing.labor_cost || 0);
  if (rootLaborCost > 0 && !hasExplicitLaborInItems) {
    const ratio = laborCostMarginPercent > 0 ? laborCostMarginPercent : 60;
    const laborPayoutCost = Math.round(rootLaborCost * (ratio / 100));
    const profitVal = rootLaborCost - laborPayoutCost;
    const profitPct = rootLaborCost > 0 ? Number(((profitVal / rootLaborCost) * 100).toFixed(2)) : 0;

    processedItems.push({
      product_id: "labor_installation_summary",
      name: "Standard Camera Installation & App Setup",
      category: "service",
      category_label: CATEGORY_META.service.label,
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

  // Addons processing (avoid duplicate if already serialized inside rawItems)
  const existingItemIds = new Set(processedItems.map(i => i.product_id).filter(Boolean));
  let quotedAmcNetRevenue = 0;

  for (const ad of rawAddons) {
    const id = ad.addon_id || ad.id || "";
    if (id && id !== "promo_free_amc" && existingItemIds.has(id)) {
      continue;
    }
    const name = ad.display_name || ad.name || "Addon";
    const qty = Math.max(1, Number(ad.qty || 1));
    const price = Number(ad.price ?? ad.unit_price ?? 0);
    const lineTotal = Number(ad.line_total ?? (price * qty));

    const { isService, category, category_label } = classifyItem(id, name, ad.category);

    const promoVisitReserve = Math.round(Number(settings?.cost_labor_visit_charge ?? 300) * 2);
    let unitCost: number;
    if (id === "promo_free_amc") {
      const explicitCost = Number(ad.base_cost_at_quote ?? ad.base_cost ?? 0);
      unitCost = explicitCost > 0 ? explicitCost : promoVisitReserve;
    } else if (ad.base_cost_at_quote !== undefined && ad.base_cost_at_quote !== null) {
      unitCost = Number(ad.base_cost_at_quote);
    } else if (ad.base_cost !== undefined && ad.base_cost !== null) {
      unitCost = Number(ad.base_cost);
    } else if (category === "amc") {
      unitCost = Math.round(Math.max(0, price) * (amcFulfillmentPct / 100));
    } else if (isService) {
      const ratio = laborCostMarginPercent > 0 ? laborCostMarginPercent : 60;
      unitCost = Math.round(Math.max(0, price) * (ratio / 100));
    } else {
      const defMargin = CATEGORY_META[category]?.defaultMargin || 0.25;
      unitCost = Math.round(price / (1 + defMargin));
    }

    if (category === "amc") {
      quotedAmcNetRevenue += lineTotal;
    }

    const costTotal = Math.round(unitCost * qty);
    const profitValue = lineTotal - costTotal;
    const profitPercent = lineTotal > 0 ? Number(((profitValue / lineTotal) * 100).toFixed(2)) : (costTotal > 0 ? -100 : 0);

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

  // Standalone / Linked Paid AMC Subscriptions & Contracts (counted in Service bucket)
  const standaloneAmcSubs = Array.isArray(context?.amc_subscriptions) ? context!.amc_subscriptions! : [];
  const hasQuotedPromoFreeAmc = processedItems.some(i => i.product_id === "promo_free_amc");
  let standaloneAmcRevenue = 0;
  let standaloneAmcPaidGross = 0;

  for (const sub of standaloneAmcSubs) {
    const rawPaid = Number(sub.amountPaid ?? 0);
    const isComplimentary = Boolean(sub.isComplimentary) || rawPaid <= 0;

    if (isComplimentary) {
      // Only add complimentary visit cost if promo_free_amc isn't already accounted for in addons AND actual visits/cost exist
      const actualFreeCost = Number(sub.actualAmcCost ?? ((sub.usedVisits || 0) * Number(settings?.cost_labor_visit_charge ?? 300)));
      if (!hasQuotedPromoFreeAmc && actualFreeCost > 0) {
        processedItems.push({
          product_id: sub.id ? `amc_free_${sub.id}` : "amc_complimentary",
          name: `${sub.planName || "Complimentary AMC"} (${sub.usedVisits || 1} visit${(sub.usedVisits || 1) > 1 ? "s" : ""})`,
          category: "amc",
          category_label: CATEGORY_META.amc.label,
          is_service: true,
          qty: 1,
          unit_price: 0,
          selling_total: 0,
          unit_cost: actualFreeCost,
          cost_total: actualFreeCost,
          profit_value: -actualFreeCost,
          profit_percent: 0
        });
      }
      continue;
    }

    // Prevent double-counting when checkout AMC addon also created an amc_subscriptions mirror record
    if (
      quotedAmcNetRevenue > 0 &&
      (sub.source === "checkout_addon" || Math.abs(rawPaid - Math.round(quotedAmcNetRevenue * (1 + gstRate / 100))) <= 15 || Math.abs(rawPaid - quotedAmcNetRevenue) <= 15)
    ) {
      continue;
    }

    const amcRevExTax = sub.exTaxAmount !== undefined ? Math.round(sub.exTaxAmount) : Math.round(rawPaid / (1 + gstRate / 100));
    const estVisitCost = Math.max(
      Math.round(amcRevExTax * (amcFulfillmentPct / 100)),
      (Number(sub.usedVisits) || 0) * Number(settings?.cost_labor_visit_charge ?? 300)
    );
    const amcCost = sub.actualAmcCost !== undefined ? Math.round(sub.actualAmcCost) : estVisitCost;
    const amcProfitVal = amcRevExTax - amcCost;
    const amcMarginPct = amcRevExTax > 0 ? Number(((amcProfitVal / amcRevExTax) * 100).toFixed(2)) : 0;

    standaloneAmcRevenue += amcRevExTax;
    standaloneAmcPaidGross += rawPaid;

    processedItems.push({
      product_id: sub.id ? `amc_sub_${sub.id}` : "amc_subscription",
      name: `${sub.planName || "Paid AMC Service Contract"} (Service Plan)`,
      category: "amc",
      category_label: CATEGORY_META.amc.label,
      is_service: true,
      qty: 1,
      unit_price: amcRevExTax,
      selling_total: amcRevExTax,
      unit_cost: amcCost,
      cost_total: amcCost,
      profit_value: amcProfitVal,
      profit_percent: amcMarginPct
    });
  }

  // Quote-level Totals BEFORE standalone AMC & Commission (for accurate discount allocation)
  let quoteProductGross = 0;
  let productCost = 0;
  let productCount = 0;

  let quoteOpsServiceGross = 0;
  let opsServiceCost = 0;
  let serviceCount = 0;

  for (const item of processedItems) {
    if (item.is_service) {
      if (!item.product_id.startsWith("amc_sub_") && !item.product_id.startsWith("amc_free_") && item.product_id !== "amc_subscription" && item.product_id !== "amc_complimentary") {
        quoteOpsServiceGross += item.selling_total;
      }
      opsServiceCost += item.cost_total;
      serviceCount += item.qty;
    } else {
      quoteProductGross += item.selling_total;
      productCost += item.cost_total;
      productCount += item.qty;
    }
  }

  // Discounts & Subtotals (Proportional allocation across quote products vs quote services)
  const quoteGrossSubtotal = quoteProductGross + quoteOpsServiceGross;
  const recordedGrossSubtotal = Number(pricing.gross_subtotal || quoteGrossSubtotal);
  const totalDiscount = Math.max(0, Number(pricing.referral_discount || pricing.discount_amount || 0));

  const effectiveBase = quoteGrossSubtotal > 0 ? quoteGrossSubtotal : recordedGrossSubtotal;
  const productDiscount = effectiveBase > 0 ? Math.round(totalDiscount * (quoteProductGross / effectiveBase)) : 0;
  const serviceDiscount = Math.max(0, totalDiscount - productDiscount);

  const productNet = Math.max(0, quoteProductGross - productDiscount);
  const quoteServiceNet = Math.max(0, quoteOpsServiceGross - serviceDiscount);
  const opsServiceRevenue = quoteServiceNet + standaloneAmcRevenue;

  const productProfit = productNet - productCost;
  const productMarginPercent = productNet > 0 ? Number(((productProfit / productNet) * 100).toFixed(2)) : 0;

  const opsServiceProfit = opsServiceRevenue - opsServiceCost;

  // Referral / Partner / Salesperson Commission Deduction (User rule: counts inside Services)
  const fallbackQuoteGross = roundCurrency(Math.max(0, productNet + quoteServiceNet));
  const preliminaryQuoteNetTaxable = Math.max(
    0,
    Number(
      pricing.net_taxable_amount ??
        reverseInclusiveGst(fallbackQuoteGross, gstRate).taxableAmount
    )
  );

  let referralCommissionCost = 0;
  let referralCommissionLabel = "None";
  let referralCommissionSource: "actual" | "projected" | "none" = "none";
  let installerBonusFromRecords = 0;

  const actualCommissions = Array.isArray(context?.actual_commissions)
    ? context!.actual_commissions!.filter(c => c && c.status !== "cancelled" && c.status !== "rejected")
    : [];

  if (actualCommissions.length > 0) {
    let salesAndPromoComm = 0;
    const labels: string[] = [];
    for (const rec of actualCommissions) {
      const amt = Number(rec.commission_amount || 0);
      if (amt <= 0) continue;
      if (rec.user_type === "installer") {
        installerBonusFromRecords += amt;
      } else {
        salesAndPromoComm += amt;
        labels.push(rec.user_type === "salesperson" ? "Sales" : "Referral");
      }
    }
    if (salesAndPromoComm > 0) {
      referralCommissionCost = Math.round(salesAndPromoComm);
      referralCommissionLabel = `${Array.from(new Set(labels)).join(" + ")} Commission (Actual)`;
      referralCommissionSource = "actual";
    }
  }

  const hasReferralTag = Boolean(
    context?.promoter ||
    context?.promoter_id ||
    context?.referral_code ||
    pricing.promoter_id ||
    pricing.referral_code ||
    pricing.referral_code_used ||
    (Number(pricing.referral_discount || 0) > 0 && !pricing.discount_amount)
  );

  if (referralCommissionSource === "none" && (hasReferralTag || context?.salesperson) && preliminaryQuoteNetTaxable > 0) {
    let projectedTotal = 0;
    const labelParts: string[] = [];

    if (hasReferralTag) {
      const promoRes = resolvePromoterCommission(
        preliminaryQuoteNetTaxable,
        context?.promoter,
        Number(settings?.promoter_commission_percent ?? 2)
      );
      if (promoRes.amount > 0) {
        projectedTotal += promoRes.amount;
        labelParts.push(promoRes.label);
      }
    }

    if (context?.salesperson) {
      const sp = context.salesperson;
      let spComm = 0;
      if (sp.use_global_commission && Array.isArray(sp.commission_slabs) && sp.commission_slabs.length > 0) {
        spComm = calculateCommission(preliminaryQuoteNetTaxable, sp.commission_slabs);
      } else if (sp.discount_type === "percent" && sp.discount_value) {
        spComm = preliminaryQuoteNetTaxable * (Number(sp.discount_value) / 100);
      } else if (sp.discount_type === "flat" && sp.discount_value) {
        spComm = Number(sp.discount_value);
      }
      if (spComm > 0) {
        projectedTotal += spComm;
        labelParts.push("Salesperson Commission");
      }
    }

    if (projectedTotal > 0) {
      referralCommissionCost = Math.round(projectedTotal);
      referralCommissionLabel = labelParts.join(" + ") + " (Projected)";
      referralCommissionSource = "projected";
    }
  }

  if (referralCommissionCost > 0) {
    processedItems.push({
      product_id: "commission_referral",
      name: referralCommissionLabel,
      category: "commission",
      category_label: CATEGORY_META.commission.label,
      is_service: true,
      qty: 1,
      unit_price: 0,
      selling_total: 0,
      unit_cost: referralCommissionCost,
      cost_total: referralCommissionCost,
      profit_value: -referralCommissionCost,
      profit_percent: 0
    });
  }

  // Build Category Map from all processed items (now including standalone Paid AMC + Referral Commission)
  const categoryMap = new Map<string, CategoryProfitSummary>();
  let totalAmcRevenue = 0;
  let totalAmcCost = 0;

  for (const item of processedItems) {
    if (item.category === "amc") {
      totalAmcRevenue += item.selling_total;
      totalAmcCost += item.cost_total;
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

  const categories: CategoryProfitSummary[] = Array.from(categoryMap.values()).map(cat => {
    const profit = Math.round((cat.revenue - cat.cost) * 100) / 100;
    const margin = cat.revenue > 0 ? Number(((profit / cat.revenue) * 100).toFixed(2)) : (cat.cost > 0 ? -100 : 0);
    return {
      ...cat,
      revenue: Math.round(cat.revenue * 100) / 100,
      cost: Math.round(cat.cost * 100) / 100,
      profit,
      margin_percent: margin
    };
  });

  const catOrder = ["camera", "recorder", "storage", "power", "cable", "accessory", "other", "service", "amc", "commission"];
  categories.sort((a, b) => catOrder.indexOf(a.category) - catOrder.indexOf(b.category));

  // Service Totals (Inclusive of Paid AMC revenue/costs and Referral Commission deduction)
  const serviceNet = opsServiceRevenue;
  const serviceCost = opsServiceCost + referralCommissionCost;
  const serviceProfit = Math.round((serviceNet - serviceCost) * 100) / 100;
  const serviceMarginPercent = serviceNet > 0
    ? Number(((serviceProfit / serviceNet) * 100).toFixed(2))
    : (serviceCost > 0 ? -100 : 0);

  // Overall Deal Totals (Before PG MDR, Warranty Reserve & Consumables Overheads)
  const overallNetRevenue = Math.round((productNet + serviceNet) * 100) / 100;
  const overallCost = Math.round((productCost + serviceCost) * 100) / 100;
  const overallProfit = Math.round((overallNetRevenue - overallCost) * 100) / 100;
  const overallMarginPercent = overallNetRevenue > 0 ? Number(((overallProfit / overallNetRevenue) * 100).toFixed(2)) : 0;

  const fallbackTotalPayable = roundCurrency(Math.max(0, productNet + quoteServiceNet));
  const hasExplicitTotalPayable = pricing.total_payable !== undefined && pricing.total_payable !== null;
  const hasExplicitGstAmount = pricing.gst_amount !== undefined && pricing.gst_amount !== null;
  const baseTotalPayable = hasExplicitTotalPayable
    ? Number(pricing.total_payable)
    : fallbackTotalPayable;
  const baseGstAmount = hasExplicitGstAmount
    ? Number(pricing.gst_amount)
    : reverseInclusiveGst(baseTotalPayable, gstRate).gstAmount;
  const standaloneAmcGst = Math.max(0, standaloneAmcPaidGross - standaloneAmcRevenue);
  const gstAmount = roundCurrency(baseGstAmount + standaloneAmcGst);
  const totalPayable = roundCurrency(baseTotalPayable + standaloneAmcPaidGross);

  // Operating Overheads (Payment Gateway MDR, 1st-Yr Warranty Visit Reserve, Consumables & Logistics)
  const pgFeePct = Number(settings?.payment_gateway_fee_percent ?? 2.36);
  const hasActualPgFee = context?.actual_pg_fee !== undefined && context?.actual_pg_fee !== null;
  const isCashOrDirectBank = context?.payment_method === "cash" || context?.payment_method === "bank_transfer" || context?.payment_method === "upi_direct";

  const paymentGatewayFee = hasActualPgFee
    ? Math.round(Number(context!.actual_pg_fee))
    : (isCashOrDirectBank || totalPayable <= 0 || overallNetRevenue <= 0 ? 0 : Math.round(totalPayable * (pgFeePct / 100)));

  const warrantyPct = Number(settings?.warranty_reserve_percent ?? 2);
  const warrantyReserve = context?.warranty_visits_cost !== undefined && context?.warranty_visits_cost !== null
    ? Math.round(Number(context.warranty_visits_cost))
    : Math.round(productNet * (warrantyPct / 100));

  const hasInstallOrCableWork = processedItems.some(
    i => i.is_service && i.category !== "commission" && i.category !== "amc"
  );
  const logisticsConsumables = context?.logistics_cost !== undefined && context?.logistics_cost !== null
    ? Math.round(Number(context.logistics_cost))
    : (hasInstallOrCableWork ? Number(settings?.logistics_consumables_per_job ?? 150) : 0);

  const installerPayoutBonus = Math.round(Number(context?.installer_payout_bonus ?? installerBonusFromRecords ?? 0));

  const totalOverheads = paymentGatewayFee + warrantyReserve + logisticsConsumables + installerPayoutBonus;
  const netProfit = Math.round((overallProfit - totalOverheads) * 100) / 100;
  const netMarginPercent = overallNetRevenue > 0 ? Number(((netProfit / overallNetRevenue) * 100).toFixed(2)) : 0;

  // Health Diagnosis & Warnings
  const warnings: string[] = [];
  let status: "healthy" | "subsidized" | "low_margin" | "critical" = "healthy";
  let badge_text = "Healthy Deal (Strong Product Margin)";
  let description = "Product margin, service margin, and net pocket profitability meet operational targets.";

  if (productMarginPercent < 0 || overallMarginPercent < 5 || netMarginPercent < 0) {
    status = "critical";
    badge_text = "Critical Margin Risk";
    description = "Deal is operating near zero or negative net pocket margin after referral commissions and overheads.";
    warnings.push(`Extreme risk: Blended margin is ${overallMarginPercent}%, Net Pocket margin is ${netMarginPercent}% (Product: ${productMarginPercent}%)`);
  } else if (productMarginPercent < 10 && overallMarginPercent >= minMarginThreshold) {
    status = "subsidized";
    badge_text = "Service Subsidized (Low Material Margin)";
    description = "Hardware is priced near distributor cost; profitability depends heavily on installation labor and Paid AMC.";
    warnings.push(`Product margin is compressed to ${productMarginPercent}%. If the client cancels installation, hardware profit will be razor-thin.`);
  } else if (overallMarginPercent < minMarginThreshold) {
    status = "low_margin";
    badge_text = `Low Margin Alert (< ${minMarginThreshold}%)`;
    description = `Total blended margin (${overallMarginPercent}%) is below your company target of ${minMarginThreshold}%.`;
    warnings.push(`Target threshold is ${minMarginThreshold}%, but this deal provides ${overallMarginPercent}% blended margin (${netMarginPercent}% net after overheads).`);
  }

  if (referralCommissionCost > 0) {
    warnings.push(`Referral/Partner deduction: ₹${referralCommissionCost.toLocaleString("en-IN")} (${referralCommissionLabel}) counted in Services.`);
  }
  if (hasQuotedPromoFreeAmc) {
    const promoCost = processedItems.filter(i => i.category === "amc").reduce((s, i) => s + i.cost_total, 0);
    if (promoCost > 0) {
      warnings.push(`Free 1st-Yr AMC promo obligation adds ₹${promoCost.toLocaleString("en-IN")} in estimated Service fulfillment cost.`);
    }
  }
  if (totalOverheads > 0) {
    warnings.push(
      `Overheads deduct ₹${totalOverheads.toLocaleString("en-IN")} (PG Fee: ₹${paymentGatewayFee.toLocaleString("en-IN")}, Warranty Reserve: ₹${warrantyReserve.toLocaleString("en-IN")}, Consumables: ₹${logisticsConsumables.toLocaleString("en-IN")}), leaving ₹${netProfit.toLocaleString("en-IN")} (${netMarginPercent}%) Net Pocket Profit.`
    );
  }

  // Supply-Only comparison simulation (hardware revenue is already GST-inclusive)
  const supplyOnlyPayable = reverseInclusiveGst(productNet, gstRate).grossAmount;
  const savingsForCustomer = Math.max(0, roundCurrency(totalPayable - supplyOnlyPayable));

  return {
    products: {
      gross_revenue: productGrossOrValue(quoteProductGross),
      discount_allocated: productDiscount,
      revenue: productNet,
      cost: productCost,
      profit: productProfit,
      margin_percent: productMarginPercent,
      item_count: productCount
    },
    services: {
      gross_revenue: quoteOpsServiceGross + standaloneAmcRevenue,
      discount_allocated: serviceDiscount,
      revenue: serviceNet,
      cost: serviceCost,
      profit: serviceProfit,
      margin_percent: serviceMarginPercent,
      item_count: serviceCount,
      ops_revenue: opsServiceRevenue,
      ops_cost: opsServiceCost,
      ops_profit: opsServiceProfit,
      amc_revenue: totalAmcRevenue,
      amc_cost: totalAmcCost,
      amc_profit: totalAmcRevenue - totalAmcCost,
      referral_commission_cost: referralCommissionCost,
      referral_commission_label: referralCommissionLabel,
      referral_commission_source: referralCommissionSource
    },
    overall: {
      gross_subtotal: effectiveBase + standaloneAmcRevenue,
      discount: totalDiscount,
      revenue: overallNetRevenue,
      cost: overallCost,
      profit: overallProfit,
      margin_percent: overallMarginPercent,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      total_payable: totalPayable
    },
    overheads: {
      payment_gateway_fee: paymentGatewayFee,
      payment_gateway_is_actual: hasActualPgFee,
      warranty_reserve: warrantyReserve,
      logistics_consumables: logisticsConsumables,
      installer_payout_bonus: installerPayoutBonus,
      total_overheads: totalOverheads,
      net_profit: netProfit,
      net_margin_percent: netMarginPercent
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

function productGrossOrValue(v: number): number {
  return Math.round(v || 0);
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
      item_count: 0,
      ops_revenue: 0,
      ops_cost: 0,
      ops_profit: 0,
      amc_revenue: 0,
      amc_cost: 0,
      amc_profit: 0,
      referral_commission_cost: 0,
      referral_commission_label: "None",
      referral_commission_source: "none"
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
    overheads: {
      payment_gateway_fee: 0,
      payment_gateway_is_actual: false,
      warranty_reserve: 0,
      logistics_consumables: 0,
      installer_payout_bonus: 0,
      total_overheads: 0,
      net_profit: 0,
      net_margin_percent: 0
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
