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

  const orderedBrandKeys = (settings?.brand_tabs_order && settings.brand_tabs_order.length > 0) 
    ? settings.brand_tabs_order 
    : ["all", "budget", "cpplus", "hikvision", "dahua", "prama", "trueview", "secureye"];

  const targetBrands: { brandKey: string; brandName: string }[] = [];
  orderedBrandKeys.forEach(k => {
    if (k !== "all" && brandSet.has(k)) {
      targetBrands.push({ brandKey: k, brandName: getCanonicalBrandName(k) || k.toUpperCase() });
    }
  });

  // Fallback if none matched
  if (targetBrands.length === 0) {
    targetBrands.push({ brandKey: "budget", brandName: "Budget Brand" });
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

    // 1. Standard Quote
    const standardSel: ConfiguratorSelection = {
      ...selection,
      technology: activeTech === "wireless" ? "Wireless" : activeTech === "ip" ? "IP" : "HD",
      brand_preference: b.brandName,
      outdoor_camera_count: outCount,
      indoor_camera_count: inCount,
      camera_count: totalCams,
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
      (rawStandardPricing as any).is_economy_storage = false;
      brandVariations.push(rawStandardPricing);
      allVariants.push(rawStandardPricing);
    }

    // 2. Economy Storage Match Quote (if requested > 3 days)
    const reqDays = selection.recording_days ?? 15;
    let economyPricing: PricingResult | undefined = undefined;

    if (reqDays > 3) {
      const economySel: ConfiguratorSelection = {
        ...standardSel,
        recording_days: 3, // Forces 500GB HDD / 64GB SD
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
