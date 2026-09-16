import { useMemo, useState } from "react";
import { Product, Addon, AppSettings, ConfiguratorSelection, PricingResult } from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Filter } from "lucide-react";

const BRAND_DISPLAY: Record<string, string> = {
  "all": "All Brands",
  "budget": "Budget",
  "cpplus": "CP Plus",
  "hikvision": "Hikvision",
  "dahua": "Dahua",
  "prama": "Prama",
  "trueview": "Trueview",
  "secureye": "Secureye",
  "wd": "WD",
  "seagate": "Seagate",
  "d-link": "D-Link",
  "tp-link": "TP-Link",
};

const BRAND_PREFERENCE_MAP: Record<string, string | undefined> = {
  "all": undefined,
  "budget": "Budget Brand",
  "cpplus": "CP Plus",
  "hikvision": "Hikvision",
  "dahua": "Dahua",
  "prama": "Prama",
  "trueview": "Trueview",
  "secureye": "Secureye",
};

function normalizeBrandKey(brandStr: string): string {
  const lower = (brandStr || "").toLowerCase().trim();
  if (lower.includes("budget") || lower.includes("generic") || lower.includes("local") || lower.includes("oem")) return "budget";
  if (lower.includes("cp") || lower.includes("cpplus")) return "cpplus";
  if (lower.includes("hikvision") || lower.includes("hik")) return "hikvision";
  if (lower.includes("dahua") || lower.includes("dah")) return "dahua";
  if (lower.includes("prama")) return "prama";
  if (lower.includes("trueview")) return "trueview";
  if (lower.includes("secureye")) return "secureye";
  return lower;
}

function getRes(p: Product): string {
  let res = p.resolution_mp ? `${p.resolution_mp}MP` : "2MP";
  const name = ((p.technical_name || "") + " " + (p.display_name || "")).toUpperCase();
  if (name.includes("8MP") || name.includes("4K")) return "8MP";
  if (name.includes("6MP")) return "6MP";
  if (name.includes("5MP")) return "5MP";
  if (name.includes("4MP")) return "4MP";
  if (name.includes("3MP")) return "3MP";
  if (name.includes("2MP") || name.includes("1080P")) return "2MP";
  return res;
}

interface DynamicVariantGeneratorProps {
  products: Product[];
  addons: Addon[];
  settings: AppSettings;
  selection: ConfiguratorSelection;
  cablingDone: boolean;
  cablingMeters?: number;
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
  cablingMeters,
  promoterDiscount,
  evaluatedAddonRules,
  activeOffer,
  onSelectCheckout,
  onToggleCompare,
  selectedCompareItems
}: DynamicVariantGeneratorProps) {
  const [activeTech, setActiveTech] = useState<"hd" | "ip">("hd");
  const [activeBrand, setActiveBrand] = useState<string>("all");
  const [activeOutdoorRes, setActiveOutdoorRes] = useState<string>("2MP");
  const [activeIndoorRes, setActiveIndoorRes] = useState<string>("2MP");

  const outdoorCount = selection.outdoor_camera_count !== undefined 
    ? selection.outdoor_camera_count 
    : (selection.indoor_camera_count !== undefined 
        ? Math.max(0, (selection.camera_count || 4) - selection.indoor_camera_count) 
        : Math.ceil((selection.camera_count || 4) / 2));

  const indoorCount = selection.indoor_camera_count !== undefined 
    ? selection.indoor_camera_count 
    : Math.max(0, (selection.camera_count || 4) - outdoorCount);

  const hasOutdoor = outdoorCount > 0;
  const hasIndoor = indoorCount > 0;
  const isMixed = hasOutdoor && hasIndoor;
  
  const { availableBrands, availableResolutions } = useMemo(() => {
    const brandSet = new Set<string>();
    const resSet = new Set<string>();
    
    products.forEach(p => {
      const pTech = (p.technology || "").toUpperCase();
      const pTechs = (p.technologies || []).map((t: string) => t.toUpperCase());
      const isTechMatch = activeTech === "hd" ? 
        (p.category === "cctv_camera" && (pTech === "HD" || pTechs.includes("HD"))) :
        (p.category === "cctv_camera" && (pTech === "IP" || pTechs.includes("IP")));
        
      if (isTechMatch && p.brand) {
        brandSet.add(normalizeBrandKey(p.brand));
        resSet.add(getRes(p));
      }
    });

    const resultBrands: string[] = ["all"];
    const orderedKeys = settings.brand_tabs_order && settings.brand_tabs_order.length > 0 
      ? settings.brand_tabs_order 
      : ["all", "budget", "cpplus", "hikvision", "dahua", "prama", "trueview", "secureye"];
      
    orderedKeys.forEach(k => {
      if (k === "all" || brandSet.has(k)) {
        if (!resultBrands.includes(k)) resultBrands.push(k);
      }
    });

    const orderedRes = ["2MP", "3MP", "4MP", "5MP", "6MP", "8MP", "12MP"];
    const resultRes: string[] = [];
    orderedRes.forEach(r => {
      if (resSet.has(r)) resultRes.push(r);
    });

    return { availableBrands: resultBrands, availableResolutions: resultRes };
  }, [products, activeTech, settings.brand_tabs_order]);

  const targetBrand = availableBrands.includes(activeBrand) ? activeBrand : (availableBrands[0] || "all");
  const targetOutdoorRes = availableResolutions.includes(activeOutdoorRes) ? activeOutdoorRes : (availableResolutions[0] || "2MP");
  const targetIndoorRes = availableResolutions.includes(activeIndoorRes) ? activeIndoorRes : (availableResolutions[0] || "2MP");

  const variants = useMemo(() => {
    const results: PricingResult[] = [];
    const brandsToGenerate: { brand: string, brandKey: string }[] = [];
    
    products.forEach(p => {
      const pTech = (p.technology || "").toUpperCase();
      const pTechs = (p.technologies || []).map((t: string) => t.toUpperCase());
      const isTechMatch = activeTech === "hd" ? 
        (p.category === "cctv_camera" && (pTech === "HD" || pTechs.includes("HD"))) :
        (p.category === "cctv_camera" && (pTech === "IP" || pTechs.includes("IP")));
        
      if (isTechMatch && p.brand) {
        const pBrandKey = normalizeBrandKey(p.brand);
        const brandMatches = targetBrand === "all" || targetBrand === pBrandKey;
        
        if (brandMatches) {
           if (!brandsToGenerate.some(b => b.brandKey === pBrandKey)) {
             brandsToGenerate.push({ brand: p.brand, brandKey: pBrandKey });
           }
        }
      }
    });

    let mixedReqs: any[] = [];
    if (isMixed) {
      mixedReqs = [
        { type: "Outdoor Bullet Camera", count: outdoorCount, resolution: targetOutdoorRes, features: ["bullet"] },
        { type: "Indoor Dome Camera", count: indoorCount, resolution: targetIndoorRes, features: ["dome"] }
      ];
    } else if (hasOutdoor) {
      mixedReqs = [
        { type: "Outdoor Bullet Camera", count: outdoorCount, resolution: targetOutdoorRes, features: ["bullet"] }
      ];
    } else {
      mixedReqs = [
        { type: "Indoor Dome Camera", count: indoorCount, resolution: targetIndoorRes, features: ["dome"] }
      ];
    }

    const enrich = (pricing: any, brandKey: string, brandName: string) => {
      if (!pricing || pricing.error) return null;
      const camItems = pricing.items?.filter((i: any) => products.find(p => p.id === i.product_id)?.category === "cctv_camera");
      const firstCamId = camItems?.[0]?.product_id;
      const camera_device = products.find(p => p.id === firstCamId) ? { ...products.find(p => p.id === firstCamId) } : undefined;
      const strId = pricing.items?.find((i: any) => products.find(p => p.id === i.product_id)?.category === "storage")?.product_id;
      const storage_device = products.find(p => p.id === strId) ? { ...products.find(p => p.id === strId) } : undefined;
      
      if (camera_device) {
        (camera_device as any).brand = brandName;
      }
      if (storage_device) {
        let tb = (storage_device as any).storage_capacity_tb;
        if (!tb) {
          const capStr = ((storage_device as any).capacity || (storage_device as any).display_name || "").toUpperCase();
          const tbMatch = capStr.match(/(\d+)\s*TB/);
          if (tbMatch) tb = parseInt(tbMatch[1], 10);
        }
        (storage_device as any).derivedCapacity = tb ? `${tb}TB` : "HDD";
      }

      const isHybrid = isMixed && targetOutdoorRes !== targetIndoorRes;
      let displayResolution = "2MP Resolution";
      if (isHybrid) {
        displayResolution = `${targetOutdoorRes} Outdoor + ${targetIndoorRes} Indoor`;
      } else if (hasOutdoor && !hasIndoor) {
        displayResolution = `${targetOutdoorRes} Resolution (${outdoorCount} Outdoor)`;
      } else if (hasIndoor && !hasOutdoor) {
        displayResolution = `${targetIndoorRes} Resolution (${indoorCount} Indoor)`;
      } else {
        displayResolution = `${targetOutdoorRes} Resolution`;
      }
      
      return { 
        ...pricing, 
        technology: activeTech.toUpperCase(),
        camera_device: camera_device ? { ...camera_device, derivedResolution: displayResolution } : { derivedResolution: displayResolution, brand: brandName }, 
        storage_device, 
        camera_count: selection.camera_count, 
        storage_days: (pricing as any)._calculated_days || selection.recording_days || 7,
        plan_type: brandKey === "budget" ? "budget" : (targetOutdoorRes === "8MP" || targetIndoorRes === "8MP" ? "premium" : "recommended"),
        is_hybrid: isHybrid,
        mixed_camera_requirements: mixedReqs
      };
    };

    brandsToGenerate.forEach(b => {
      const planType = b.brandKey === "budget" ? "budget" : "recommended";
      const sel: ConfiguratorSelection = {
        ...selection,
        technology: activeTech,
        brand_preference: b.brand,
        mixed_camera_requirements: mixedReqs,
        outdoor_camera_count: outdoorCount,
        indoor_camera_count: indoorCount,
        resolution_preference: targetOutdoorRes === targetIndoorRes ? targetOutdoorRes : "5MP",
        plan_type: planType as any,
      };
      
      // Standard Quote (Requested Storage)
      const rawPricing = calculatePricing({
        selection: sel, products, addons, settings, cablingDone, cablingMeters,
        referralDiscountPercent: promoterDiscount?.percent || 0,
        referralDiscountFlat: promoterDiscount?.flat || 0,
        evaluatedAddonRules, activeOffer,
      });
      
      const enriched = enrich(rawPricing, b.brandKey, b.brand);
      if (enriched) {
        enriched.is_economy_storage = false;
        results.push(enriched);
      }

      // Economy Storage Quote (If requested > 5 days, generate a low-storage variant)
      if (selection.recording_days && selection.recording_days > 5) {
        const economySel: ConfiguratorSelection = {
          ...sel,
          recording_days: 3 // Force 3 days to pick the smallest available HDD (usually 500GB)
        };
        const rawEconomyPricing = calculatePricing({
          selection: economySel, products, addons, settings, cablingDone, cablingMeters,
          referralDiscountPercent: promoterDiscount?.percent || 0,
          referralDiscountFlat: promoterDiscount?.flat || 0,
          evaluatedAddonRules, activeOffer,
        });
        (rawEconomyPricing as any)._calculated_days = 3;
        const enrichedEconomy = enrich(rawEconomyPricing, b.brandKey, b.brand);
        if (enrichedEconomy && enrichedEconomy.total_payable < (enriched?.total_payable || 0)) {
          enrichedEconomy.is_economy_storage = true;
          results.push(enrichedEconomy);
        }
      }
    });

    results.sort((a, b) => a.total_price_inr - b.total_price_inr);
    return results;
  }, [activeTech, targetBrand, targetOutdoorRes, targetIndoorRes, isMixed, hasOutdoor, hasIndoor, outdoorCount, indoorCount, selection, products, addons, settings, cablingDone, promoterDiscount, evaluatedAddonRules, activeOffer]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 items-center">
        {/* Technology Selector */}
        <div className="bg-[#f5f5f7] dark:bg-[#2d2d2f] p-1.5 rounded-full inline-flex relative shadow-inner">
          <button
            onClick={() => setActiveTech("hd")}
            className={`relative z-10 px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${activeTech === "hd" ? "text-white shadow-md" : "text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white"}`}
          >
            {activeTech === "hd" && <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full -z-10" />}
            Standard HD (Analog)
          </button>
          <button
            onClick={() => setActiveTech("ip")}
            className={`relative z-10 px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${activeTech === "ip" ? "text-white shadow-md" : "text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white"}`}
          >
            {activeTech === "ip" && <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full -z-10" />}
            Premium IP (Network)
          </button>
        </div>

        {/* Brand Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <span className="text-sm font-semibold text-[#86868b] mr-2 shrink-0">Brand:</span>
          {availableBrands.map(b => (
            <button
              key={b}
              onClick={() => setActiveBrand(b)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${activeBrand === b ? "bg-[#1d1d1f] text-white border-[#1d1d1f] dark:bg-white dark:text-[#1d1d1f]" : "bg-white dark:bg-[#1d1d1f] text-[#86868b] border-[#d2d2d7] dark:border-[#424245] hover:border-blue-500"}`}
            >
              {BRAND_DISPLAY[b] || b}
            </button>
          ))}
        </div>

        {/* Outdoor Resolution Row (if outdoor cameras exist) */}
        {hasOutdoor && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <span className="text-sm font-semibold text-[#86868b] mr-2 shrink-0 flex items-center gap-1.5">
              <span>Outdoor {isMixed ? `(${outdoorCount} Cams)` : `(${outdoorCount} Cams)`}:</span>
            </span>
            {availableResolutions.map(r => (
              <button
                key={`outdoor-${r}`}
                onClick={() => setActiveOutdoorRes(r)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${activeOutdoorRes === r ? "bg-[#1d1d1f] text-white border-[#1d1d1f] dark:bg-white dark:text-[#1d1d1f]" : "bg-white dark:bg-[#1d1d1f] text-[#86868b] border-[#d2d2d7] dark:border-[#424245] hover:border-blue-500"}`}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {/* Indoor Resolution Row (if indoor cameras exist) */}
        {hasIndoor && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <span className="text-sm font-semibold text-[#86868b] mr-2 shrink-0 flex items-center gap-1.5">
              <span>Indoor {isMixed ? `(${indoorCount} Cams)` : `(${indoorCount} Cams)`}:</span>
            </span>
            {availableResolutions.map(r => (
              <button
                key={`indoor-${r}`}
                onClick={() => setActiveIndoorRes(r)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${activeIndoorRes === r ? "bg-[#1d1d1f] text-white border-[#1d1d1f] dark:bg-white dark:text-[#1d1d1f]" : "bg-white dark:bg-[#1d1d1f] text-[#86868b] border-[#d2d2d7] dark:border-[#424245] hover:border-blue-500"}`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {variants.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-medium">No packages found for these filters.</p>
          <Button variant="link" onClick={() => { setActiveBrand("all"); setActiveOutdoorRes("2MP"); setActiveIndoorRes("2MP"); }}>Clear Filters</Button>
        </div>
      )}

      <div className={`grid gap-6 mt-8 ${variants.length === 1 ? "max-w-md mx-auto" : variants.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-2 lg:grid-cols-3"}`}>
        {variants.map((variant, idx) => {
          if (!variant.camera_device) return null;
          const isSelectedForCompare = selectedCompareItems.some(i => i.camera_device?.id === variant.camera_device?.id && i.plan_type === variant.plan_type);
          
          return (
            <Card 
              key={idx} 
              onClick={() => onSelectCheckout(variant)}
              className={`group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 ${isSelectedForCompare ? "ring-2 ring-blue-600 shadow-lg" : "hover:shadow-md border-[#d2d2d7] dark:border-[#424245]"}`}
            >
              {idx === Math.floor(variants.length / 2) && variants.length > 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-b-xl z-10 flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" /> Recommended
                </div>
              )}
              
              <CardContent className="py-8 px-5 flex flex-col items-center justify-center min-h-[180px]">
                <div className="text-center w-full">
                  <div className="text-base font-black text-[#6366f1] mb-1.5 flex items-center justify-center gap-1.5 flex-wrap">
                    <span>{variant.camera_device?.brand || "Budget"} {variant.plan_type === "budget" ? "Standard" : "Pro"}</span>
                    {variant.is_economy_storage && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-bold">ECONOMY</span>}
                    {(variant as any).is_hybrid && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-bold">HYBRID SETUP</span>}
                  </div>
                  <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                    {variant.camera_device.derivedResolution || "2MP Resolution"}
                  </h3>
                  {variant.is_economy_storage && (
                    <p className="text-xs text-[#86868b] font-medium mb-3">
                      Basic Storage ({variant.storage_device?.derivedCapacity || "500GB"})
                    </p>
                  )}
                  {!variant.is_economy_storage && variant.is_economy_storage !== undefined && (
                    <p className="text-xs text-emerald-600 font-medium mb-3">
                      Requested Storage ({variant.storage_device?.derivedCapacity || "2TB"})
                    </p>
                  )}
                  <div className="flex items-start justify-center">
                    <span className="text-[40px] leading-none font-extrabold text-[#1d1d1f] dark:text-white tracking-tight">
                      ₹{variant.total_payable.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
