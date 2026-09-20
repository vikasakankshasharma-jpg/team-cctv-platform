import { useMemo, useState } from "react";
import { Product, Addon, AppSettings, ConfiguratorSelection, PricingResult } from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Filter, Tag } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

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

const DEFAULT_500GB_HDD: Product = {
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
  const { t } = useTranslation();
  const initialTech = (selection.technology?.toLowerCase() === "ip") ? "ip" : "hd";
  const [activeTech, setActiveTech] = useState<"hd" | "ip">(initialTech);
  const initialBrand = selection.brand_preference ? normalizeBrandKey(selection.brand_preference) : "all";
  const [activeBrand, setActiveBrand] = useState<string>(initialBrand);
  const [sortBy, setSortBy] = useState<string>("price_asc");
  
  const [cameraBuckets, setCameraBuckets] = useState<any[]>(() => {
    // If we are editing a quote that already has mixed requirements, load them!
    if (selection.mixed_camera_requirements && selection.mixed_camera_requirements.length > 0) {
      return selection.mixed_camera_requirements.map(req => ({
        id: Math.random().toString(36).substring(7),
        type: req.type.toLowerCase().includes("outdoor") ? "outdoor" : "indoor",
        count: req.count,
        resolution: req.resolution || "2MP"
      }));
    }

    const buckets: any[] = [];
    const outCount = selection.outdoor_camera_count !== undefined 
      ? selection.outdoor_camera_count 
      : (selection.indoor_camera_count !== undefined 
          ? Math.max(0, (selection.camera_count || 4) - selection.indoor_camera_count) 
          : Math.ceil((selection.camera_count || 4) / 2));
          
    const inCount = selection.indoor_camera_count !== undefined 
      ? selection.indoor_camera_count 
      : Math.max(0, (selection.camera_count || 4) - outCount);

    if (outCount > 0) {
      buckets.push({ id: Math.random().toString(36).substring(7), type: "outdoor", count: outCount, resolution: "2MP" });
    }
    if (inCount > 0) {
      buckets.push({ id: Math.random().toString(36).substring(7), type: "indoor", count: inCount, resolution: "2MP" });
    }
    if (buckets.length === 0 && selection.camera_count) {
      buckets.push({ id: Math.random().toString(36).substring(7), type: "outdoor", count: selection.camera_count, resolution: "2MP" });
    }
    return buckets;
  });

  const outdoorCount = cameraBuckets.filter(b => b.type === "outdoor").reduce((sum, b) => sum + b.count, 0);
  const indoorCount = cameraBuckets.filter(b => b.type === "indoor").reduce((sum, b) => sum + b.count, 0);
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
  const variants = useMemo(() => {
    const results: PricingResult[] = [];
    const brandsToGenerate: { brand: string, brandKey: string }[] = [];

    // Ensure 500GB HDD is present in effectiveProducts so low-storage quotes can always calculate
    const effectiveProducts = [...products];
    const has500GB = effectiveProducts.some(p => {
      const text = ((p.display_name || "") + " " + (p.technical_name || "") + " " + (p.capacity || "")).toLowerCase();
      return p.category === "storage" && (text.includes("500gb") || p.storage_capacity_tb === 0.5 || p.storage_tb === 0.5);
    });
    if (!has500GB) {
      effectiveProducts.push(DEFAULT_500GB_HDD);
    }
    
    effectiveProducts.forEach(p => {
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

    let mixedReqs: any[] = cameraBuckets.filter(b => b.count > 0).map(b => {
      const res = availableResolutions.includes(b.resolution) ? b.resolution : (availableResolutions.includes("2MP") ? "2MP" : (availableResolutions[0] || "2MP"));
      return {
        type: b.type === "outdoor" ? "Outdoor Bullet Camera" : "Indoor Dome Camera",
        count: b.count,
        resolution: res,
        features: b.type === "outdoor" ? ["bullet"] : ["dome"]
      };
    });

    const enrich = (pricing: any, brandKey: string, brandName: string) => {
      if (!pricing || pricing.error) return null;
      const camItems = pricing.items?.filter((i: any) => effectiveProducts.find(p => p.id === i.product_id)?.category === "cctv_camera");
      const firstCamId = camItems?.[0]?.product_id;
      const camera_device = effectiveProducts.find(p => p.id === firstCamId) ? { ...effectiveProducts.find(p => p.id === firstCamId) } : undefined;
      const strId = pricing.items?.find((i: any) => effectiveProducts.find(p => p.id === i.product_id)?.category === "storage")?.product_id;
      const storage_device = effectiveProducts.find(p => p.id === strId) ? { ...effectiveProducts.find(p => p.id === strId) } : undefined;
      
      if (camera_device) {
        (camera_device as any).brand = brandName;
      }
      if (storage_device) {
        let cap = (storage_device as any).capacity;
        if (!cap) {
          const capStr = ((storage_device as any).technical_name || (storage_device as any).display_name || "").toUpperCase();
          const gbMatch = capStr.match(/(\d+)\s*GB/i);
          const tbMatch = capStr.match(/(\d+)\s*TB/i);
          if (gbMatch) cap = `${gbMatch[1]}GB`;
          else if (tbMatch) cap = `${tbMatch[1]}TB`;
          else if ((storage_device as any).storage_capacity_tb) {
            const tbVal = (storage_device as any).storage_capacity_tb;
            cap = tbVal < 1 ? `${Math.round(tbVal * 1000)}GB` : `${tbVal}TB`;
          }
        }
        (storage_device as any).derivedCapacity = cap || "HDD";
      }

      // Extract actual resolutions delivered in the quote (to handle fallbacks, e.g. when a brand lacks 2MP IP)
      let actualResolutions: string[] = [];
      let outdoorProvided: string | null = null;
      let indoorProvided: string | null = null;

      pricing.items.forEach((item: any) => {
        // Items typically look like: "Outdoor Bullet Camera: Budget Brand 5MP IP Dome..."
        const match = item.display_name.match(/(\d+(?:\.\d+)?)MP/i);
        if (match) {
          const res = match[0].toUpperCase();
          actualResolutions.push(res);
          const lowerName = item.display_name.toLowerCase();
          if (lowerName.includes("outdoor")) outdoorProvided = res;
          if (lowerName.includes("indoor")) indoorProvided = res;
        }
      });
      
      let outdoorRequested = mixedReqs.find(r => r.type === "Outdoor Bullet Camera")?.resolution;
      let indoorRequested = mixedReqs.find(r => r.type === "Indoor Dome Camera")?.resolution;
      
      let substitutionNotes: string[] = [];
      if (outdoorRequested && outdoorProvided && outdoorRequested !== outdoorProvided) {
        substitutionNotes.push(`${outdoorProvided} Outdoor`);
      }
      if (indoorRequested && indoorProvided && indoorRequested !== indoorProvided) {
        substitutionNotes.push(`${indoorProvided} Indoor`);
      }

      let substitutionMessage = "";
      if (substitutionNotes.length > 0) {
        substitutionMessage = `💡 Includes ${substitutionNotes.join(" and ")} upgrade based on brand availability.`;
      }

      // Deduplicate
      const uniqueActualRes = Array.from(new Set(actualResolutions));
      
      // If we couldn't find any resolutions in the items, fallback to the requested ones
      const resolvedRes = uniqueActualRes.length > 0 ? uniqueActualRes : Array.from(new Set(mixedReqs.map(r => r.resolution)));
      const isHybrid = resolvedRes.length > 1;
      let displayResolution = resolvedRes[0] ? `${resolvedRes[0]} Resolution` : "2MP Resolution";
      
      if (isHybrid) {
        displayResolution = `Mixed Resolutions (${resolvedRes.join(", ")})`;
      } else if (hasOutdoor && !hasIndoor) {
        displayResolution = `${resolvedRes[0] || "2MP"} Resolution (${outdoorCount} Outdoor)`;
      } else if (hasIndoor && !hasOutdoor) {
        displayResolution = `${resolvedRes[0] || "2MP"} Resolution (${indoorCount} Indoor)`;
      }
      
      return { 
        ...pricing, 
        technology: activeTech.toUpperCase(),
        camera_device: camera_device ? { ...camera_device, derivedResolution: displayResolution } : { derivedResolution: displayResolution, brand: brandName }, 
        storage_device, 
        camera_count: outdoorCount + indoorCount, 
        storage_days: (pricing as any)._calculated_days || selection.recording_days || 7,
        plan_type: brandKey === "budget" ? "budget" : (Array.from(new Set(mixedReqs.map(r => r.resolution))).includes("8MP") ? "premium" : "recommended"),
        is_hybrid: isHybrid,
        mixed_camera_requirements: mixedReqs,
        substitution_message: substitutionMessage
      };
    };

    brandsToGenerate.forEach(b => {
      const uniqueRes = Array.from(new Set(mixedReqs.map(r => r.resolution)));
      const planType = b.brandKey === "budget" ? "budget" : (uniqueRes.includes("8MP") ? "premium" : "recommended");
      const sel: ConfiguratorSelection = {
        ...selection,
        technology: (activeTech === "ip" ? "IP" : "HD") as any,
        brand_preference: b.brand,
        mixed_camera_requirements: mixedReqs,
        outdoor_camera_count: outdoorCount,
        indoor_camera_count: indoorCount,
        camera_count: outdoorCount + indoorCount,
        resolution_preference: uniqueRes.length === 1 ? uniqueRes[0] : "5MP",
        plan_type: planType as any,
      };
      
      // Standard Quote (Requested Storage)
      const rawPricing = calculatePricing({
        selection: sel, products: effectiveProducts, addons, settings, cablingDone, cablingMeters,
        referralDiscountPercent: promoterDiscount?.percent || 0,
        referralDiscountFlat: promoterDiscount?.flat || 0,
        evaluatedAddonRules, activeOffer,
      });
      
      const enriched = enrich(rawPricing, b.brandKey, b.brand);
      if (enriched) {
        enriched.is_economy_storage = false;
        results.push(enriched);
      }

      // Economy Storage Quote (If requested > 3 days, generate a low-storage variant)
      const reqDays = selection.recording_days ?? 7;
      if (reqDays > 3) {
        const economySel: ConfiguratorSelection = {
          ...sel,
          technology: (activeTech === "ip" ? "IP" : "HD") as any,
          recording_days: 3 // Force 3 days to pick the smallest available HDD (usually 500GB)
        };
        const rawEconomyPricing = calculatePricing({
          selection: economySel, products: effectiveProducts, addons, settings, cablingDone, cablingMeters,
          referralDiscountPercent: promoterDiscount?.percent || 0,
          referralDiscountFlat: promoterDiscount?.flat || 0,
          evaluatedAddonRules, activeOffer,
        });
        (rawEconomyPricing as any)._calculated_days = 3;
        const enrichedEconomy = enrich(rawEconomyPricing, b.brandKey, b.brand);
        if (enrichedEconomy && enriched && enrichedEconomy.total_payable < enriched.total_payable) {
          enrichedEconomy.is_economy_storage = true;
          (enrichedEconomy as any).original_payable = enriched.total_payable;
          (enrichedEconomy as any).requested_days = reqDays;
          results.push(enrichedEconomy);
        }
      }
    });

    // Default sorting (price ascending) to determine 'recommended' baseline
    results.sort((a, b) => a.total_price_inr - b.total_price_inr);
    
    // Tag the recommended item (middle item of default sort, non-economy)
    const recIndex = Math.floor(results.length / 2);
    results.forEach((v, idx) => {
      (v as any).is_recommended = (idx === recIndex && results.length > 1 && !v.is_economy_storage);
    });

    // Apply active sort
    if (sortBy === "price_asc") {
      results.sort((a, b) => a.total_payable - b.total_payable);
    } else if (sortBy === "price_desc") {
      results.sort((a, b) => b.total_payable - a.total_payable);
    } else if (sortBy === "brand") {
      results.sort((a, b) => (a.camera_device?.brand || "").localeCompare(b.camera_device?.brand || ""));
    }

    return results;
  }, [activeTech, targetBrand, cameraBuckets, isMixed, hasOutdoor, hasIndoor, outdoorCount, indoorCount, selection, products, addons, settings, cablingDone, promoterDiscount, evaluatedAddonRules, activeOffer, availableResolutions, sortBy]);

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
            
                                  {t("wz_standard_hd_analog")}
                                </button>
          <button
            onClick={() => setActiveTech("ip")}
            className={`relative z-10 px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${activeTech === "ip" ? "text-white shadow-md" : "text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white"}`}
          >
            {activeTech === "ip" && <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full -z-10" />}
            
                                  {t("wz_premium_ip_network")}
                                </button>
        </div>

        {/* Brand Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <span className="text-sm font-semibold text-[#86868b] mr-2 shrink-0">{t("wz_brand")}</span>
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

        {/* Camera Buckets UI */}
        <div className="flex flex-col gap-3 items-center w-full max-w-2xl mx-auto mt-2">
          {cameraBuckets.map((bucket) => (
            <div key={bucket.id} className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full bg-white dark:bg-[#1d1d1f] p-3 rounded-2xl border border-[#e5e5ea] dark:border-[#424245] shadow-sm relative transition-all hover:shadow-md">
              <div className="flex items-center gap-2 w-full md:w-auto md:min-w-[5rem]">
                <span className="text-[13px] font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider">
                  {bucket.type === 'outdoor' ? 'OUTDOOR' : 'INDOOR'}
                </span>
              </div>

              {/* Stepper */}
              <div className="flex items-center border border-[#d2d2d7] dark:border-[#424245] rounded-full overflow-hidden bg-[#f5f5f7] dark:bg-[#2d2d2f] shrink-0">
                 <button 
                   onClick={() => setCameraBuckets(prev => prev.map(b => b.id === bucket.id ? { ...b, count: Math.max(0, b.count - 1) } : b))}
                   className="px-3 py-1.5 hover:bg-[#e5e5ea] dark:hover:bg-[#424245] text-[#1d1d1f] dark:text-white font-medium transition-colors"
                 >
                   -
                 </button>
                 <span className="px-3 py-1.5 text-sm font-semibold min-w-[2.5rem] text-center text-[#1d1d1f] dark:text-white bg-white dark:bg-[#1d1d1f]">
                   {bucket.count}
                 </span>
                 <button 
                   onClick={() => setCameraBuckets(prev => prev.map(b => b.id === bucket.id ? { ...b, count: b.count + 1 } : b))}
                   className="px-3 py-1.5 hover:bg-[#e5e5ea] dark:hover:bg-[#424245] text-[#1d1d1f] dark:text-white font-medium transition-colors"
                 >
                   +
                 </button>
              </div>

              {/* Resolution Picker */}
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                 {availableResolutions.map(r => (
                   <button
                     key={r}
                     onClick={() => setCameraBuckets(prev => prev.map(b => b.id === bucket.id ? { ...b, resolution: r } : b))}
                     className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all shrink-0 ${bucket.resolution === r ? "bg-[#1d1d1f] text-white border-[#1d1d1f] dark:bg-white dark:text-[#1d1d1f]" : "bg-white dark:bg-[#1d1d1f] text-[#86868b] border-[#d2d2d7] dark:border-[#424245] hover:border-blue-500"}`}
                   >
                     {r}
                   </button>
                 ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 ml-auto md:ml-2 border-l border-[#e5e5ea] dark:border-[#424245] pl-2">
                 <button 
                   onClick={() => setCameraBuckets(prev => {
                     const newBuckets = [...prev];
                     const index = newBuckets.findIndex(b => b.id === bucket.id);
                     if (bucket.count > 1) {
                       newBuckets[index] = { ...bucket, count: Math.ceil(bucket.count / 2) };
                       newBuckets.splice(index + 1, 0, { id: Math.random().toString(36).substring(7), type: bucket.type, count: Math.floor(bucket.count / 2), resolution: bucket.resolution });
                     } else {
                       newBuckets.splice(index + 1, 0, { id: Math.random().toString(36).substring(7), type: bucket.type, count: 1, resolution: bucket.resolution });
                     }
                     return newBuckets;
                   })}
                   className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] dark:bg-[#2d2d2f] dark:hover:bg-[#424245] text-[#1d1d1f] dark:text-white transition-colors"
                   title="Split into another row"
                 >
                   
                                             {t("wz_split")}
                                           </button>
                 {cameraBuckets.length > 1 && (
                   <button 
                     onClick={() => setCameraBuckets(prev => prev.filter(b => b.id !== bucket.id))}
                     className="px-3 py-1.5 text-xs font-semibold rounded-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 transition-colors"
                     title="Remove this row"
                   >
                     
                                                   {t("wz_remove")}
                                                 </button>
                 )}
              </div>
            </div>
          ))}
          
          <div className="flex gap-3 mt-2">
             <button 
               onClick={() => setCameraBuckets(prev => [...prev, { id: Math.random().toString(36).substring(7), type: "outdoor", count: 1, resolution: "2MP" }])}
               className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-4 py-2 rounded-full transition-colors"
             >
               <span>+</span>  {t("wz_add_outdoor")}
                                       </button>
             <button 
               onClick={() => setCameraBuckets(prev => [...prev, { id: Math.random().toString(36).substring(7), type: "indoor", count: 1, resolution: "2MP" }])}
               className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-4 py-2 rounded-full transition-colors"
             >
               <span>+</span>  {t("wz_add_indoor")}
                                       </button>
          </div>
        </div>
      </div>

      {variants.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-medium">{t("wz_no_packages_found_for_these_fi")}</p>
          <Button variant="link" onClick={() => { setActiveBrand("all"); setCameraBuckets(prev => prev.map(b => ({ ...b, resolution: "2MP" }))); }}>{t("wz_clear_filters")}</Button>
        </div>
      )}

      {variants.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 mb-4">
          <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white">{t("wz_available_packages")}</h2>
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <label className="text-sm font-medium text-slate-500">{t("wz_sort_by")}</label>
            <select 
              className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="price_asc">{t("wz_price_low_to_high")}</option>
              <option value="price_desc">{t("wz_price_high_to_low")}</option>
              <option value="brand">{t("wz_brand")}</option>
            </select>
          </div>
        </div>
      )}

      <div className={`grid gap-6 ${variants.length === 1 ? "max-w-md mx-auto" : variants.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-2 lg:grid-cols-3"}`}>
        {variants.map((variant, idx) => {
          if (!variant.camera_device) return null;
          const isSelectedForCompare = selectedCompareItems.some(i => i.camera_device?.id === variant.camera_device?.id && i.plan_type === variant.plan_type);
          
          return (
            <Card 
              key={idx} 
              onClick={() => onSelectCheckout(variant)}
              className={`group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 ${isSelectedForCompare ? "ring-2 ring-blue-600 shadow-lg" : "hover:shadow-md border-[#d2d2d7] dark:border-[#424245]"}`}
            >
              {(variant as any).is_recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-b-xl z-10 flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" />  {t("wz_recommended")}
                                          </div>
              )}
              {variant.is_economy_storage && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-b-xl z-10 flex items-center gap-1 shadow-sm">
                  <Tag className="w-3 h-3" />  {t("wz_economy_match")}
                                          </div>
              )}
              
              <CardContent className="py-8 px-5 flex flex-col items-center justify-center min-h-[180px]">
                <div className="text-center w-full">
                  <div className="text-base font-black text-[#6366f1] mb-1.5 flex items-center justify-center gap-1.5 flex-wrap">
                    <span>{variant.camera_device?.brand || "Budget"}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                    {variant.camera_device.derivedResolution || "2MP Resolution"}
                  </h3>
                  {(variant as any).substitution_message && (
                    <p className="text-[11px] text-amber-700 font-medium mb-3 max-w-[95%] mx-auto bg-amber-50 px-2 py-1 rounded-md border border-amber-200 leading-tight">
                      {(variant as any).substitution_message}
                    </p>
                  )}
                  {variant.is_economy_storage && (
                    <div className="flex flex-col items-center justify-center mb-3 gap-1">
                      <p className="text-xs text-[#86868b] font-medium">
                        
                                                              {t("wz_basic_storage_")}{variant.storage_device?.derivedCapacity || "500GB"})
                      </p>
                      <p className="text-[11px] bg-green-50 text-green-700 px-2.5 py-1 rounded-md border border-green-200 font-bold inline-block">
                        
                                                              {t("wz_save_")}{((variant as any).original_payable - variant.total_payable).toLocaleString('en-IN')}  {t("wz_3_days_vs")} {(variant as any).requested_days}  {t("wz_days")}
                                                            </p>
                    </div>
                  )}
                  {!variant.is_economy_storage && variant.is_economy_storage !== undefined && (
                    <p className="text-xs text-emerald-600 font-medium mb-3">
                      
                                                        {t("wz_requested_storage_")}{variant.storage_device?.derivedCapacity || "2TB"}) - {variant.storage_days}  {t("wz_days")}
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
