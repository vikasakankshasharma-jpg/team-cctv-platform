const fs = require('fs');
const code = `import { useMemo, useState } from "react";
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
  let res = p.resolution_mp ? \`\${p.resolution_mp}MP\` : "2MP";
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
  const [activeBrand, setActiveBrand] = useState<string>("all");
  const [activeResolution, setActiveResolution] = useState<string>("2MP");
  
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

    const resultRes: string[] = ["all"];
    const orderedRes = ["2MP", "3MP", "4MP", "5MP", "6MP", "8MP", "12MP"];
    orderedRes.forEach(r => {
      if (resSet.has(r)) resultRes.push(r);
    });

    return { availableBrands: resultBrands, availableResolutions: resultRes };
  }, [products, activeTech, settings.brand_tabs_order]);

  const targetBrand = availableBrands.includes(activeBrand) ? activeBrand : (availableBrands[0] || "all");
  const targetRes = availableResolutions.includes(activeResolution) ? activeResolution : (availableResolutions[1] || "all");

  const variants = useMemo(() => {
    const results: PricingResult[] = [];
    const pairsToGenerate: { brand: string, brandKey: string, resolution: string }[] = [];
    
    products.forEach(p => {
      const pTech = (p.technology || "").toUpperCase();
      const pTechs = (p.technologies || []).map((t: string) => t.toUpperCase());
      const isTechMatch = activeTech === "hd" ? 
        (p.category === "cctv_camera" && (pTech === "HD" || pTechs.includes("HD"))) :
        (p.category === "cctv_camera" && (pTech === "IP" || pTechs.includes("IP")));
        
      if (isTechMatch && p.brand) {
        const pBrandKey = normalizeBrandKey(p.brand);
        const pRes = getRes(p);
        
        const brandMatches = targetBrand === "all" || targetBrand === pBrandKey;
        const resMatches = targetRes === "all" || targetRes === pRes;
        
        if (brandMatches && resMatches) {
           if (!pairsToGenerate.some(pair => pair.brandKey === pBrandKey && pair.resolution === pRes)) {
             pairsToGenerate.push({ brand: p.brand, brandKey: pBrandKey, resolution: pRes });
           }
        }
      }
    });

    const enrich = (pricing: any, brandKey: string, res: string) => {
      if (!pricing || pricing.error) return null;
      const camId = pricing.items.find((i: any) => products.find(p => p.id === i.product_id)?.category === "cctv_camera")?.product_id;
      const camera_device = products.find(p => p.id === camId);
      const strId = pricing.items.find((i: any) => products.find(p => p.id === i.product_id)?.category === "storage")?.product_id;
      const storage_device = products.find(p => p.id === strId);
      
      if (camera_device) {
        (camera_device as any).derivedResolution = res;
      }
      if (storage_device) {
        let tb = (storage_device as any).storage_capacity_tb;
        if (!tb) {
          const capStr = ((storage_device as any).capacity || storage_device.display_name || "").toUpperCase();
          const tbMatch = capStr.match(/(\d+)\s*TB/);
          if (tbMatch) tb = parseInt(tbMatch[1], 10);
        }
        (storage_device as any).derivedCapacity = tb ? \`\${tb}TB\` : "HDD";
      }
      
      return { 
        ...pricing, 
        camera_device, 
        storage_device, 
        camera_count: selection.camera_count, 
        storage_days: selection.recording_days || 7,
        plan_type: brandKey === "budget" ? "budget" : (res === "8MP" || res === "5MP" ? "premium" : "recommended")
      };
    };

    pairsToGenerate.forEach(pair => {
      const planType = pair.brandKey === "budget" ? "budget" : "recommended";
      const sel: ConfiguratorSelection = {
        ...selection,
        technology: activeTech,
        brand_preference: pair.brand,
        resolution_preference: pair.resolution,
        plan_type: planType as any,
      };
      
      const rawPricing = calculatePricing({
        selection: sel, products, addons, settings, cablingDone,
        referralDiscountPercent: promoterDiscount?.percent || 0,
        referralDiscountFlat: promoterDiscount?.flat || 0,
        evaluatedAddonRules, activeOffer,
      });
      
      const enriched = enrich(rawPricing, pair.brandKey, pair.resolution);
      if (enriched) results.push(enriched);
    });

    results.sort((a, b) => a.total_price_inr - b.total_price_inr);
    return results;
  }, [activeTech, targetBrand, targetRes, selection, products, addons, settings, cablingDone, promoterDiscount, evaluatedAddonRules, activeOffer]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 items-center">
        <div className="bg-[#f5f5f7] dark:bg-[#2d2d2f] p-1.5 rounded-full inline-flex relative shadow-inner">
          <button
            onClick={() => setActiveTech("hd")}
            className={\`relative z-10 px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 \${activeTech === "hd" ? "text-white shadow-md" : "text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white"}\`}
          >
            {activeTech === "hd" && <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full -z-10" />}
            Standard HD (Analog)
          </button>
          <button
            onClick={() => setActiveTech("ip")}
            className={\`relative z-10 px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 \${activeTech === "ip" ? "text-white shadow-md" : "text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white"}\`}
          >
            {activeTech === "ip" && <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full -z-10" />}
            Premium IP (Network)
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 max-w-full no-scrollbar">
          <Filter className="w-4 h-4 text-[#86868b] shrink-0" />
          <span className="text-sm font-semibold text-[#86868b] mr-2 shrink-0">Brand:</span>
          {availableBrands.map(b => (
            <button
              key={b}
              onClick={() => setActiveBrand(b)}
              className={\`px-4 py-1.5 rounded-full text-sm font-bold transition-all shrink-0 \${
                targetBrand === b 
                  ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30" 
                  : "bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7] dark:bg-[#1c1c1e] dark:border-[#424245] dark:text-[#f5f5f7]"
              }\`}
            >
              {BRAND_DISPLAY[b] || (b.charAt(0).toUpperCase() + b.slice(1))}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 max-w-full no-scrollbar">
          <Filter className="w-4 h-4 text-[#86868b] shrink-0" />
          <span className="text-sm font-semibold text-[#86868b] mr-2 shrink-0">Resolution:</span>
          {availableResolutions.map(r => (
            <button
              key={r}
              onClick={() => setActiveResolution(r)}
              className={\`px-4 py-1.5 rounded-full text-sm font-bold transition-all shrink-0 \${
                targetRes === r 
                  ? "bg-slate-800 text-white shadow-sm ring-2 ring-slate-800/30" 
                  : "bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7] dark:bg-[#1c1c1e] dark:border-[#424245] dark:text-[#f5f5f7]"
              }\`}
            >
              {r === "all" ? "All Resolutions" : r}
            </button>
          ))}
        </div>
      </div>

      {variants.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-medium">No packages found for these filters.</p>
          <Button variant="link" onClick={() => { setActiveBrand("all"); setActiveResolution("all"); }}>Clear Filters</Button>
        </div>
      )}

      <div className={\`grid gap-6 mt-8 \${variants.length === 1 ? "max-w-md mx-auto" : variants.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-2 lg:grid-cols-3"}\`}>
        {variants.map((variant, idx) => {
          if (!variant.camera_device) return null;
          const isSelectedForCompare = selectedCompareItems.some(i => i.camera_device?.id === variant.camera_device?.id && i.plan_type === variant.plan_type);
          
          return (
            <Card key={idx} className={\`relative overflow-hidden transition-all duration-300 \${isSelectedForCompare ? "ring-2 ring-blue-600 shadow-lg" : "hover:shadow-md border-[#d2d2d7] dark:border-[#424245]"}\`}>
              {idx === Math.floor(variants.length / 2) && variants.length > 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-b-xl z-10 flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" /> Recommended
                </div>
              )}
              
              <CardContent className="p-6 pt-10">
                <div className="text-center mb-6">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                    {variant.camera_device.brand || "Budget"} {variant.plan_type === "budget" ? "Standard" : "Pro"}
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
                    <span className="text-sm font-bold text-[#1d1d1f] dark:text-white">{variant.camera_device.brand || "Budget"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#f5f5f7] dark:border-[#2d2d2f]">
                    <span className="text-sm text-[#86868b]">Cameras</span>
                    <span className="text-sm font-bold text-[#1d1d1f] dark:text-white">{variant.camera_count}x {activeTech.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#f5f5f7] dark:border-[#2d2d2f]">
                    <span className="text-sm text-[#86868b]">Clarity</span>
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{variant.camera_device.derivedResolution || "2MP"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#f5f5f7] dark:border-[#2d2d2f]">
                    <span className="text-sm text-[#86868b]">Storage</span>
                    <span className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                      {variant.storage_device ? \`\${variant.storage_device.derivedCapacity || "HDD"}\` : "None"} ({variant.storage_days} Days)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#f5f5f7] dark:border-[#2d2d2f]">
                    <span className="text-sm text-[#86868b]">Installation</span>
                    <span className="text-sm font-bold text-emerald-600">Included</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={() => onSelectCheckout(variant)}
                    className={\`w-full font-bold \${idx === Math.floor(variants.length / 2) && variants.length > 1 ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20" : "bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] dark:bg-[#2d2d2f] dark:hover:bg-[#3d3d3f] dark:text-white"}\`}
                  >
                    Select Plan
                  </Button>
                  
                  <button 
                    onClick={() => onToggleCompare(variant)}
                    className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-2 transition-colors"
                  >
                    <div className={\`w-4 h-4 rounded border flex items-center justify-center \${isSelectedForCompare ? "bg-blue-600 border-blue-600" : "border-slate-300"}\`}>
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
`
fs.writeFileSync('components/quotation/DynamicVariantGenerator.tsx', code);
console.log('File successfully written!');
