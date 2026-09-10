"use client";

import { useMemo, useState } from "react";
import type { Product, AppSettings, ConfiguratorSelection, PricingResult, Addon } from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Info, Shield, HardDrive, Wrench, Settings2, Sparkles, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const BRAND_DISPLAY: Record<string, string> = {
  "cpplus": "CP Plus", "cp-plus": "CP Plus", "cp plus": "CP Plus",
  "wd": "WD",
  "seagate": "Seagate",
  "prama": "Prama",
  "hikvision": "Hikvision",
  "dahua": "Dahua",
  "trueview": "Trueview",
  "d-link": "D-Link",
  "tp-link": "TP-Link",
};

interface DynamicVariantGeneratorProps {
  products: Product[];
  addons: Addon[];
  settings: AppSettings;
  selection: ConfiguratorSelection;
  cablingDone: boolean;
  promoterDiscount?: { percent: number; flat: number };
  evaluatedAddonRules: any;
  activeOffer?: any;
  onSelectCheckout: (pricing: PricingResult) => void;
  onToggleCompare: (pricing: PricingResult) => void;
  selectedCompareItems: PricingResult[];
}

export function DynamicVariantGenerator({
  products,
  addons,
  settings,
  selection,
  cablingDone,
  promoterDiscount,
  evaluatedAddonRules,
  activeOffer,
  onSelectCheckout,
  onToggleCompare,
  selectedCompareItems
}: DynamicVariantGeneratorProps) {
  const [activeTech, setActiveTech] = useState<"hd" | "ip">("hd");
  
  // Get available brands for the active tech
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    // Always include Budget
    brands.add("budget");
    
    products.forEach(p => {
      const isTechMatch = activeTech === "hd" ? 
        (p.category === "cctv_camera" && p.technologies?.includes("HD")) :
        (p.category === "cctv_camera" && p.technologies?.includes("IP"));
        
      if (isTechMatch && p.brand && p.brand.toLowerCase() !== "generic") {
        brands.add(p.brand.toLowerCase());
      }
    });
    
    return Array.from(brands).sort((a, b) => {
      if (a === "budget") return -1;
      if (b === "budget") return 1;
      return a.localeCompare(b);
    });
  }, [products, activeTech]);

  const [activeBrand, setActiveBrand] = useState<string>("budget");

  // Ensure active brand is valid when tech changes
  if (!availableBrands.includes(activeBrand) && availableBrands.length > 0) {
    setActiveBrand(availableBrands[0]);
  }

  // Generate variants for this tech+brand combo
  const variants = useMemo(() => {
    // We'll generate a 2MP and 5MP (or similar) variant
    const results: PricingResult[] = [];
    
    // 1. Budget variant (typically 2MP)
    const budgetSelection: ConfiguratorSelection = {
      ...selection,
      technology: activeTech,
      brand_preference: activeBrand === "budget" ? undefined : (activeBrand || undefined),
      plan_type: "budget",
      selected_camera_option: 1, // Forces budget/entry tier in pricing engine
    };
    
    const enrich = (pricing: any) => {
      if (!pricing || pricing.error) return null;
      const camId = pricing.items.find((i: any) => products.find(p => p.id === i.product_id)?.category === "cctv_camera")?.product_id;
      const camera_device = products.find(p => p.id === camId);
      const strId = pricing.items.find((i: any) => products.find(p => p.id === i.product_id)?.category === "storage")?.product_id;
      const storage_device = products.find(p => p.id === strId);
      
      if (camera_device) {
        let res = camera_device.resolution_mp ? `${camera_device.resolution_mp}MP` : "2MP";
        const name = (camera_device.technical_name || "") + (camera_device.display_name || "");
        if (name.includes("5MP")) res = "5MP";
        else if (name.includes("4MP")) res = "4MP";
        else if (name.includes("3MP")) res = "3MP";
        else if (name.includes("8MP") || name.includes("4K")) res = "8MP";
        (camera_device as any).derivedResolution = res;
      }

      // Derive storage capacity with fallback parsing
      if (storage_device) {
        let tb = (storage_device as any).storage_capacity_tb;
        if (!tb) {
          const capStr = ((storage_device as any).capacity || storage_device.display_name || "").toUpperCase();
          const tbMatch = capStr.match(/(\d+)\s*TB/);
          if (tbMatch) tb = parseInt(tbMatch[1], 10);
          else {
            const gbMatch = capStr.match(/(\d+)\s*GB/);
            if (gbMatch) tb = parseInt(gbMatch[1], 10) / 1024;
          }
        }
        (storage_device as any).derivedCapacity = tb ? `${tb}TB` : "HDD";
      }
      
      return { ...pricing, camera_device, storage_device, camera_count: selection.camera_count, storage_days: selection.recording_days || 7 };
    };

    const budgetPricing = calculatePricing({
      selection: budgetSelection, products, addons, settings, cablingDone,
      referralDiscountPercent: promoterDiscount?.percent || 0,
      referralDiscountFlat: promoterDiscount?.flat || 0,
      evaluatedAddonRules, activeOffer,
    });
    const enrichedBudget = enrich(budgetPricing);
    if (enrichedBudget) results.push(enrichedBudget);

    // 2. Premium variant (typically 5MP or higher res)
    const premiumSelection: ConfiguratorSelection = {
      ...selection,
      technology: activeTech,
      brand_preference: activeBrand === "budget" ? undefined : (activeBrand || undefined),
      plan_type: "premium",
      selected_camera_option: 3, // Forces premium tier in pricing engine
    };
    
    const premiumPricing = calculatePricing({
      selection: premiumSelection, products, addons, settings, cablingDone,
      referralDiscountPercent: promoterDiscount?.percent || 0,
      referralDiscountFlat: promoterDiscount?.flat || 0,
      evaluatedAddonRules, activeOffer,
    });
    const enrichedPremium = enrich(premiumPricing);
    if (enrichedPremium) results.push(enrichedPremium);

    return results;
  }, [activeTech, activeBrand, selection, products, addons, settings, cablingDone, promoterDiscount, evaluatedAddonRules, activeOffer]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Toggles */}
      <div className="flex flex-col gap-4 items-center">
        {/* Tech Toggle */}
        <div className="bg-[#f5f5f7] dark:bg-[#2d2d2f] p-1.5 rounded-full inline-flex relative shadow-inner">
          <button
            onClick={() => setActiveTech("hd")}
            className={`relative z-10 px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${activeTech === "hd" ? "text-white shadow-md" : "text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white"}`}
          >
            {activeTech === "hd" && (
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full -z-10" />
            )}
            Standard HD (Analog)
          </button>
          <button
            onClick={() => setActiveTech("ip")}
            className={`relative z-10 px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${activeTech === "ip" ? "text-white shadow-md" : "text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white"}`}
          >
            {activeTech === "ip" && (
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full -z-10" />
            )}
            Premium IP (Network)
          </button>
        </div>

        {/* Brand Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 max-w-full no-scrollbar">
          <span className="text-sm font-semibold text-[#86868b] mr-2 shrink-0">Brand:</span>
          {availableBrands.map(b => (
            <button
              key={b}
              onClick={() => setActiveBrand(b)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors shrink-0 ${
                activeBrand === b 
                  ? "bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400" 
                  : "bg-white border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7] dark:bg-[#1c1c1e] dark:border-[#424245] dark:text-[#f5f5f7]"
              }`}
            >
              {b === "budget" ? "Budget" : BRAND_DISPLAY[b] || b}
            </button>
          ))}
        </div>
      </div>

      {/* Variant Cards */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {variants.map((variant, idx) => {
          if (!variant.camera_device) return null;
          
          const isSelectedForCompare = selectedCompareItems.some(i => i.camera_device?.id === variant.camera_device?.id && i.plan_type === variant.plan_type);
          
          return (
            <Card key={idx} className={`relative overflow-hidden transition-all duration-300 ${isSelectedForCompare ? "ring-2 ring-blue-600 shadow-lg" : "hover:shadow-md border-[#d2d2d7] dark:border-[#424245]"}`}>
              {idx === 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-b-xl z-10 flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" /> Recommended
                </div>
              )}
              
              <CardContent className="p-6 pt-10">
                <div className="text-center mb-6">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                    {variant.plan_type === "budget" ? "Standard" : "Premium"}
                  </div>
                  <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white mb-2">
                    {variant.camera_device.derivedResolution || "2MP"} Resolution
                  </h3>
                  <div className="text-4xl font-black tracking-tight text-[#1d1d1f] dark:text-white">
                    ₹{variant.total_payable.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center py-2 border-b border-[#f5f5f7] dark:border-[#2d2d2f]">
                    <span className="text-sm text-[#86868b]">Brand</span>
                    <span className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                      {variant.camera_device.brand || "Budget"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#f5f5f7] dark:border-[#2d2d2f]">
                    <span className="text-sm text-[#86868b]">Cameras</span>
                    <span className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                      {variant.camera_count}x {activeTech.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#f5f5f7] dark:border-[#2d2d2f]">
                    <span className="text-sm text-[#86868b]">Clarity</span>
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {variant.camera_device.derivedResolution || "2MP"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#f5f5f7] dark:border-[#2d2d2f]">
                    <span className="text-sm text-[#86868b]">Storage</span>
                    <span className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                      {variant.storage_device ? `${variant.storage_device.derivedCapacity || "HDD"}` : "None"} ({variant.storage_days} Days)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#f5f5f7] dark:border-[#2d2d2f]">
                    <span className="text-sm text-[#86868b]">Installation</span>
                    <span className="text-sm font-bold text-emerald-600">
                      Included
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={() => onSelectCheckout(variant)}
                    className={`w-full font-bold ${idx === 1 ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20" : "bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] dark:bg-[#2d2d2f] dark:hover:bg-[#3d3d3f] dark:text-white"}`}
                  >
                    Select Plan
                  </Button>
                  
                  <button 
                    onClick={() => onToggleCompare(variant)}
                    className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-2 transition-colors"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelectedForCompare ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}>
                      {isSelectedForCompare && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {isSelectedForCompare ? "Added to Compare" : "Add to Compare"}
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

