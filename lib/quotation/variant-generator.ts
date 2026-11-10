/**
 * @file lib/quotation/variant-generator.ts
 * @description Headless server-authoritative variant generator for TEAM CCTV.
 * Dynamically computes ALL valid brand packages and price ranges matching customer requirements.
 * Used across Web API, Server Components, and WhatsApp Bot.
 */

import { Product, Addon, AppSettings, ConfiguratorSelection, PricingResult } from "../../types";
import { calculatePricing } from "../pricing-engine";
import { getCanonicalBrandKey, getCanonicalBrandName } from "../brand-utils";

export const DEFAULT_500GB_HDD: Product = {
  id: "budget_hdd_500gb",
  display_name: "Budget Brand 500GB HDD",
  technical_name: "Budget Brand 500GB Surveillance HDD",
  brand: "Budget Brand",
  category: "storage",
  storage_type: "Surveillance HDD",
  storage_capacity_tb: 0.5,
  storage_tb: 0.5,
  capacity: "500GB",
  technologies: ["Common", "HD", "IP"],
  technology: "Common",
  unit_price: 2646,
  base_cost: 1800,
  is_active: true,
  is_quotation_eligible: true,
  stock_status: "in_stock"
};

export interface BrandPriceSummary {
  brandKey: string;
  brandName: string;
  minPrice: number;
  maxPrice: number;
  standardQuote: PricingResult;
  economyQuote?: PricingResult;
  colorNightQuote?: PricingResult;
  variations: PricingResult[];
}

export interface CatalogGenerationResult {
  brandSummaries: BrandPriceSummary[];
  allVariants: PricingResult[];
  lowestOverallQuote: PricingResult | null;
  recommendedQuote: PricingResult | null;
  totalVariationsCount: number;
}

export function generateAllCatalogVariations(params: {
  selection: ConfiguratorSelection;
  products: Product[];
  addons: Addon[];
  settings: AppSettings;
  cablingDone?: boolean;
  cablingMeters?: number;
  promoterDiscount?: { percent: number; flat: number };
  evaluatedAddonRules?: any;
  activeOffer?: any;
}): CatalogGenerationResult {
  const {
    selection,
    products,
    addons,
    settings,
    cablingDone = false,
    cablingMeters,
    promoterDiscount,
    evaluatedAddonRules,
    activeOffer,
  } = params;

  const rawTech = String(selection.technology || "HD").toLowerCase();
  const activeTech: "hd" | "ip" | "wireless" = 
    rawTech === "wireless" || rawTech === "wifi" ? "wireless" :
    rawTech === "ip" ? "ip" : "hd";

  // Effective products strictly sourced from database catalog (zero fake products)
  const effectiveProducts = [...products];

  // Find all active brands in this technology
  const brandSet = new Set<string>();
  effectiveProducts.forEach(p => {
    const pTech = (p.technology || "").toUpperCase();
    const pTechs = (p.technologies || []).map((t: string) => t.toUpperCase());
    const isTechMatch = activeTech === "hd" 
      ? (p.category === "cctv_camera" && (pTech === "HD" || pTechs.includes("HD")))
      : activeTech === "ip"
      ? (p.category === "cctv_camera" && (pTech === "IP" || pTechs.includes("IP")))
      : (p.category === "cctv_camera" && (pTech === "WIRELESS" || pTech === "WIFI" || pTechs.includes("WIRELESS") || pTechs.includes("WIFI") || !!p.has_wifi || !!p.has_4g_sim));
      
    if (isTechMatch && p.brand) {
      brandSet.add(getCanonicalBrandKey(p.brand));
    }
  });

  const defaultBrandOrder = ["all", "aproducts", "budget", "cpplus", "hikvision", "dahua", "prama", "trueview", "secureye"];
  const orderedBrandKeys = (settings?.brand_tabs_order && settings.brand_tabs_order.length > 0) 
    ? settings.brand_tabs_order 
    : defaultBrandOrder;

  const targetBrands: { brandKey: string; brandName: string }[] = [];
  const seenBrandKeys = new Set<string>();

  const addTargetBrand = (k: string) => {
    if (!k || k === "all") return;
    let canonicalKey = k;
    if (!brandSet.has(canonicalKey)) {
      if (canonicalKey === "budget" && brandSet.has("aproducts")) canonicalKey = "aproducts";
      else if (canonicalKey === "aproducts" && brandSet.has("budget")) canonicalKey = "budget";
    }
    if (brandSet.has(canonicalKey) && !seenBrandKeys.has(canonicalKey)) {
      seenBrandKeys.add(canonicalKey);
      const displayName = getCanonicalBrandName(canonicalKey) || (canonicalKey === "aproducts" ? "A+ Products (Budget)" : canonicalKey.toUpperCase());
      targetBrands.push({ brandKey: canonicalKey, brandName: displayName });
    }
  };

  // Add according to preferred order first
  orderedBrandKeys.forEach(addTargetBrand);

  // Guarantee any remaining brand in brandSet (e.g. Dahua, Secureye, A+ Products) is never omitted
  brandSet.forEach(k => {
    addTargetBrand(k);
  });

  // Fallback if none matched
  if (targetBrands.length === 0) {
    targetBrands.push({ brandKey: "aproducts", brandName: "A+ Products (Budget)" });
  }

  const allVariants: PricingResult[] = [];
  const brandSummaries: BrandPriceSummary[] = [];

  const totalCams = selection.camera_count || 4;
  const outCount = selection.outdoor_camera_count !== undefined 
    ? selection.outdoor_camera_count 
    : Math.ceil(totalCams / 2);
  const inCount = selection.indoor_camera_count !== undefined 
    ? selection.indoor_camera_count 
    : Math.max(0, totalCams - outCount);

  targetBrands.forEach(b => {
    const brandVariations: PricingResult[] = [];

    // Check if customer explicitly chose 7-day Economy Storage (500GB HDD match)
    const isEconomyRequested = selection.recording_days === 7 || (selection as any).is_economy_storage === true;
    const targetStorageTB = isEconomyRequested ? 0.5 
      : (selection.recording_days === 15 ? 1.0 
      : (selection.recording_days === 30 ? 2.0 
      : (selection.recording_days === 60 ? 4.0 : 1.0)));

    // 1. Standard Quote
    const standardSel: ConfiguratorSelection = {
      ...selection,
      technology: activeTech === "wireless" ? "Wireless" : activeTech === "ip" ? "IP" : "HD",
      brand_preference: b.brandName,
      outdoor_camera_count: outCount,
      indoor_camera_count: inCount,
      camera_count: totalCams,
      is_economy_storage: isEconomyRequested as any,
      target_storage_tb: targetStorageTB,
    };

    const rawStandardPricing = calculatePricing({
      selection: standardSel,
      products: effectiveProducts,
      addons,
      settings,
      cablingDone,
      cablingMeters,
      referralDiscountPercent: promoterDiscount?.percent || 0,
      referralDiscountFlat: promoterDiscount?.flat || 0,
      evaluatedAddonRules,
      activeOffer,
    });

    if (!rawStandardPricing.error) {
      (rawStandardPricing as any).brandKey = b.brandKey;
      (rawStandardPricing as any).brandName = b.brandName;
      (rawStandardPricing as any).is_economy_storage = isEconomyRequested;
      brandVariations.push(rawStandardPricing);
      allVariants.push(rawStandardPricing);
    }

    // 2. Enhanced Color Night Vision / 2K Resolution Package (ColorVu / Guard+ with Mic)
    let colorNightPricing: PricingResult | undefined = undefined;
    const colorNightSel: ConfiguratorSelection = {
      ...standardSel,
      resolution_preference: "3MP",
      requested_features: ["color_night_vision", "mic"],
    };

    const rawColorNightPricing = calculatePricing({
      selection: colorNightSel,
      products: effectiveProducts,
      addons,
      settings,
      cablingDone,
      cablingMeters,
      referralDiscountPercent: promoterDiscount?.percent || 0,
      referralDiscountFlat: promoterDiscount?.flat || 0,
      evaluatedAddonRules,
      activeOffer,
    });

    if (!rawColorNightPricing.error && rawColorNightPricing.total_payable !== rawStandardPricing.total_payable) {
      (rawColorNightPricing as any).brandKey = b.brandKey;
      (rawColorNightPricing as any).brandName = b.brandName;
      (rawColorNightPricing as any).is_color_night = true;
      colorNightPricing = rawColorNightPricing;
      brandVariations.push(rawColorNightPricing);
      allVariants.push(rawColorNightPricing);
    }

    // 3. Economy Storage Match Quote (500GB HDD / 64GB SD)
    // If standard was calculated with 1TB+ HDD (e.g. 15 or 30 days), compute the 500GB Economy Match savings
    let economyPricing: PricingResult | undefined = undefined;

    if (!isEconomyRequested) {
      const economySel: ConfiguratorSelection = {
        ...standardSel,
        recording_days: 7, // 7 Days Economy Match
        is_economy_storage: true as any,
        target_storage_tb: 0.5 as any,
      };

      const rawEconomyPricing = calculatePricing({
        selection: economySel,
        products: effectiveProducts,
        addons,
        settings,
        cablingDone,
        cablingMeters,
        referralDiscountPercent: promoterDiscount?.percent || 0,
        referralDiscountFlat: promoterDiscount?.flat || 0,
        evaluatedAddonRules,
        activeOffer,
      });

      if (!rawEconomyPricing.error && rawEconomyPricing.total_payable < (rawStandardPricing.total_payable || Infinity)) {
        (rawEconomyPricing as any).brandKey = b.brandKey;
        (rawEconomyPricing as any).brandName = b.brandName;
        (rawEconomyPricing as any).is_economy_storage = true;
        (rawEconomyPricing as any).savingsAmount = (rawStandardPricing.total_payable || 0) - rawEconomyPricing.total_payable;
        economyPricing = rawEconomyPricing;
        brandVariations.push(rawEconomyPricing);
        allVariants.push(rawEconomyPricing);
      }
    } else {
      // If 7 days was requested, standard IS already the economy package!
      economyPricing = rawStandardPricing;
    }

    if (brandVariations.length > 0) {
      const prices = brandVariations.map(v => v.total_payable);
      brandSummaries.push({
        brandKey: b.brandKey,
        brandName: b.brandName,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        standardQuote: rawStandardPricing,
        economyQuote: economyPricing,
        colorNightQuote: colorNightPricing,
        variations: brandVariations,
      });
    }
  });

  // Sort overall variants ascending by price
  allVariants.sort((a, b) => a.total_payable - b.total_payable);

  const lowestOverallQuote = allVariants.length > 0 ? allVariants[0] : null;
  const recommendedQuote = allVariants.find(v => (v as any).brandKey === "cpplus" || (v as any).brandKey === "hikvision") || lowestOverallQuote;

  return {
    brandSummaries,
    allVariants,
    lowestOverallQuote,
    recommendedQuote,
    totalVariationsCount: allVariants.length,
  };
}
