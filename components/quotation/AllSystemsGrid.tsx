"use client";

import { useMemo } from "react";
import { Check, ShieldCheck, Zap, Monitor, Camera, Image as ImageIcon, Star, ShoppingBag, ArrowRight } from "lucide-react";
import { useConfiguratorStore } from "@/store/configurator";
import { calculatePricing } from "@/lib/pricing-engine";
import { ConfiguratorSelection, Product, Addon, AppSettings, AddonRuleResult } from "@/types";

interface AllSystemsGridProps {
  pricingCache: {
    products: Product[];
    addons: Addon[];
    settings: AppSettings;
  };
  cablingDone: boolean;
  promoterDiscount?: { percent: number; flat: number };
  evaluatedRules: Record<string, AddonRuleResult>;
  activeOffer?: any;
}

export function AllSystemsGrid({ pricingCache, cablingDone, promoterDiscount, evaluatedRules, activeOffer }: AllSystemsGridProps) {
  const { selection, active_checkout_option, setActiveCheckoutOption } = useConfiguratorStore();

  const allKits = useMemo(() => {
    let cameras = pricingCache.products.filter(p => p.category === "camera" && p.is_active);

    if (selection.technology && selection.technology !== "both" as any) {
      cameras = cameras.filter(p => p.technology === selection.technology);
    }

    const bp = selection.brand_preference?.toLowerCase();
    if (bp && bp !== "all" && bp !== "recommend" && bp !== "unsure") {
      cameras = cameras.filter(p => p.brand?.toLowerCase() === bp);
    }

    if (selection.requested_features && selection.requested_features.length > 0) {
      cameras = cameras.filter(cam => {
        const camFeats = (cam.features || []).map(f => f.toLowerCase());
        const name = (cam.display_name + " " + cam.technical_name).toLowerCase();
        const check = (tag: string) => camFeats.includes(tag) || name.includes(tag);

        return selection.requested_features!.every(reqFeat => {
          const rf = reqFeat.toLowerCase();
          if (rf === "mic" || rf === "audio") return check("mic") || check("audio");
          if (rf === "color" || rf === "color_night") return check("color") || check("color_night");
          return check(rf);
        });
      });
    }

    let kits = cameras.map(cam => {
      const kitSelection: ConfiguratorSelection = {
        ...selection,
        technology: cam.technology as "HD" | "IP",
        selected_camera_id: cam.id,
        plan_type: "recommended",
        selected_addons: [],
      };

      const pricing = calculatePricing({
        selection: kitSelection,
        products: pricingCache.products,
        addons: pricingCache.addons,
        settings: pricingCache.settings,
        cablingDone,
        referralDiscountPercent: promoterDiscount?.percent || 0,
        referralDiscountFlat: promoterDiscount?.flat || 0,
        evaluatedAddonRules: evaluatedRules,
        activeOffer
      });

      const recorderItem = pricing.items.find(i => pricingCache.products.find(p => p.id === i.product_id)?.category === "recorder");
      const storageItem = pricing.items.find(i => {
        const p = pricingCache.products.find(p => p.id === i.product_id);
        return p?.category === "accessory" && p.technical_name.toLowerCase().includes("hdd");
      });

      return {
        camera: cam,
        pricing,
        recorderItem,
        storageItem,
      };
    });

    if (selection.max_budget) {
      kits = kits.filter(k => k.pricing.total_payable <= selection.max_budget!);
    }

    if (selection.focus_point === "quality") {
      kits.sort((a, b) => b.pricing.total_payable - a.pricing.total_payable);
    } else {
      kits.sort((a, b) => a.pricing.total_payable - b.pricing.total_payable);
    }

    return kits;
  }, [selection, pricingCache, cablingDone, promoterDiscount, evaluatedRules, activeOffer]);

  if (allKits.length === 0) {
    return (
      <div className="w-full py-24 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[40px] mt-8">
        <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-xl border border-zinc-100 dark:border-zinc-700">
          <Camera className="w-10 h-10 text-zinc-300" />
        </div>
        <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">No Matching Systems</h3>
        <p className="text-xs font-bold text-zinc-400 mt-2 max-w-xs text-center uppercase tracking-widest leading-loose">
          Try broadening your filters or adjusting your budget to see more options.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-5 h-5 text-zinc-900 dark:text-white" />
          <h3 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.3em]">
            Found {allKits.length} Configurations
          </h3>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sort By:</span>
           <select className="bg-transparent text-[10px] font-black text-blue-600 uppercase tracking-widest focus:outline-none">
              <option>Relevance</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {allKits.map((kit, idx) => {
          const isSelected = active_checkout_option?.technology === kit.camera.technology && 
                             active_checkout_option?.option === kit.camera.id;

          const isBestSeller = idx === 0 && selection.focus_point === "price";
          const isSmartChoice = idx === 0 && selection.focus_point === "quality";

          return (
            <div 
              key={kit.camera.id}
              className={`group flex flex-col sm:flex-row bg-white dark:bg-zinc-900 border ${
                isSelected 
                ? 'border-blue-500 shadow-[0_20px_50px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20' 
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xl'
              } rounded-[32px] overflow-hidden transition-all duration-500 relative`}
            >
              {/* Badges */}
              {isBestSeller && (
                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-500/20 flex items-center gap-1.5 animate-pulse">
                  <Star className="w-3 h-3 fill-white" /> Best Seller
                </div>
              )}
              {isSmartChoice && (
                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-600/20 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" /> Smart Choice
                </div>
              )}

              {/* Image Section */}
              <div className="w-full sm:w-[220px] h-[220px] sm:h-auto bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-zinc-100 dark:border-zinc-800 shrink-0 relative p-8 group-hover:bg-white dark:group-hover:bg-zinc-800 transition-colors duration-500">
                {kit.camera.image_url ? (
                  <img 
                    src={kit.camera.image_url} 
                    alt={kit.camera.display_name} 
                    className="object-contain w-full h-full transform group-hover:scale-110 transition-transform duration-700" 
                  />
                ) : (
                  <div className="flex flex-col items-center opacity-20 group-hover:opacity-40 transition-opacity">
                    <Camera className="w-16 h-16 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">{kit.camera.brand || "Standard"}</span>
                  </div>
                )}
                
                <div className="absolute bottom-4 right-4 flex gap-1">
                   {kit.camera.technology === "IP" ? (
                      <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white" title="Digital IP">
                         <Cpu className="w-3.5 h-3.5" />
                      </div>
                   ) : (
                      <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-white" title="Analog HD">
                         <Monitor className="w-3.5 h-3.5" />
                      </div>
                   )}
                </div>
              </div>

              {/* Content Section */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{kit.camera.brand || "Standard"} Surveillance</div>
                      <h4 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors duration-300 min-h-[3.5rem] line-clamp-2">
                        {selection.camera_count} Channel {kit.camera.brand ? kit.camera.brand + " " : ""}Elite Kit
                      </h4>
                      <p className="text-[11px] font-bold text-zinc-500 line-clamp-1 italic tracking-wide">{kit.camera.display_name}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 min-h-[110px]">
                      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                          <Camera className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Optics</div>
                          <div className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 truncate">
                            {selection.camera_count}x {kit.camera.brand ? kit.camera.brand + " " : ""}{kit.camera.display_name}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                          <Zap className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Processor</div>
                          <div className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 truncate">
                            1x {kit.recorderItem?.brand ? kit.recorderItem.brand + " " : ""}{kit.recorderItem?.display_name || "Smart Recorder"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                      <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                         <ShieldCheck className="w-3 h-3" /> Fully Installed Price
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-black text-zinc-900 dark:text-white leading-none">₹</span>
                        <span className="text-3xl font-black text-zinc-900 dark:text-white leading-none tracking-tighter">
                          {kit.pricing.total_payable.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                         <span>No Cost EMI available</span>
                         <span className="w-1 h-1 rounded-full bg-zinc-200" />
                         <span className="text-blue-500">Free Install</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setActiveCheckoutOption({ technology: kit.camera.technology as "HD"|"IP", option: kit.camera.id as any })}
                      className={`h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 group/btn ${
                        isSelected 
                          ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30 ring-4 ring-blue-600/10" 
                          : "bg-zinc-900 dark:bg-zinc-950 text-white hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-600/20"
                      }`}
                    >
                      {isSelected ? (
                        <>Selected <Check className="w-4 h-4" /></>
                      ) : (
                        <>Build Kit <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  </div>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Cpu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="16" x="4" y="4" rx="2" />
      <rect width="6" height="6" x="9" y="9" rx="1" />
      <path d="M15 2v2" />
      <path d="M15 20v2" />
      <path d="M2 15h2" />
      <path d="M2 9h2" />
      <path d="M20 15h2" />
      <path d="M20 9h2" />
      <path d="M9 2v2" />
      <path d="M9 20v2" />
    </svg>
  )
}
