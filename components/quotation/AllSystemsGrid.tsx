"use client";

import { useMemo } from "react";
import { Check, ShieldCheck, Zap, Monitor, Camera, Image as ImageIcon } from "lucide-react";
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
}

export function AllSystemsGrid({ pricingCache, cablingDone, promoterDiscount, evaluatedRules }: AllSystemsGridProps) {
  const { selection, active_checkout_option, setActiveCheckoutOption } = useConfiguratorStore();

  const allKits = useMemo(() => {
    // 1. Get all active cameras
    let cameras = pricingCache.products.filter(p => p.category === "camera" && p.is_active);

    // 2. Filter by Technology
    if (selection.technology && selection.technology !== "both" as any) {
      cameras = cameras.filter(p => p.technology === selection.technology);
    }

    // 3. Filter by Brand
    if (selection.brand_preference && selection.brand_preference !== "all") {
      cameras = cameras.filter(p => p.brand?.toLowerCase() === selection.brand_preference?.toLowerCase());
    }

    // 4. Filter by Features
    if (selection.requested_features && selection.requested_features.length > 0) {
      cameras = cameras.filter(cam => {
        if (!cam.features) return false;
        return selection.requested_features!.every(reqFeat => cam.features!.includes(reqFeat));
      });
    }

    // 5. Generate Kit Pricing for each camera
    let kits = cameras.map(cam => {
      // Build a selection specific to this camera
      const kitSelection: ConfiguratorSelection = {
        ...selection,
        technology: cam.technology as "HD" | "IP",
        selected_camera_id: cam.id,
        plan_type: "recommended", // Base line
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
        evaluatedAddonRules: evaluatedRules
      });

      // Find the recorder and storage from the priced items
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

    // 6. Filter by Budget (now we have the exact total_payable)
    if (selection.max_budget) {
      kits = kits.filter(k => k.pricing.total_payable <= selection.max_budget!);
    }

    // 7. Sort by Focus Point
    if (selection.focus_point === "quality") {
      kits.sort((a, b) => b.pricing.total_payable - a.pricing.total_payable);
    } else {
      kits.sort((a, b) => a.pricing.total_payable - b.pricing.total_payable);
    }

    return kits;
  }, [selection, pricingCache, cablingDone, promoterDiscount, evaluatedRules]);

  if (allKits.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl mt-8">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <Camera className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">No Kits Found</h3>
        <p className="text-sm font-medium text-zinc-500 mt-1 max-w-sm text-center">
          We couldn&apos;t find any systems matching your exact filters. Try increasing your budget or removing some must-have features.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">
          All Available Kits
        </h3>
        <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
          {allKits.length} Results
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {allKits.map((kit) => {
          const isSelected = active_checkout_option?.technology === kit.camera.technology && 
                             active_checkout_option?.option === kit.camera.id; // Using ID as option for direct selection

          return (
            <div 
              key={kit.camera.id}
              className={`flex flex-col sm:flex-row bg-white dark:bg-zinc-900 border ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'} rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md`}
            >
              {/* Product Image Placeholder */}
              <div className="w-full sm:w-40 h-40 sm:h-auto bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-zinc-100 dark:border-zinc-800 shrink-0 relative p-4">
                {kit.camera.image_url ? (
                  <img src={kit.camera.image_url} alt={kit.camera.display_name} className="object-contain w-full h-full" />
                ) : (
                  <div className="flex flex-col items-center opacity-40">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-center">{kit.camera.brand || "System Kit"}</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-[9px] font-black uppercase tracking-wider shadow-sm">
                  {kit.camera.technology} System
                </div>
              </div>

              {/* Product Details */}
              <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <h4 className="text-sm font-black text-zinc-900 dark:text-white leading-snug line-clamp-2">
                    {selection.camera_count} Channel {kit.camera.brand} CCTV Combo Set - {kit.camera.display_name}
                  </h4>
                  
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 line-clamp-1">{selection.camera_count}x {kit.camera.display_name}</span>
                    </div>
                    {kit.recorderItem && (
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 line-clamp-1">1x {kit.recorderItem.display_name}</span>
                      </div>
                    )}
                    {kit.storageItem && (
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 line-clamp-1">1x {kit.storageItem.display_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-black text-zinc-900 dark:text-white leading-none">
                      ₹{kit.pricing.total_payable.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                      Incl. GST & Install
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      // Note: We use the camera ID as the option here since it's a specific camera
                      setActiveCheckoutOption({ technology: kit.camera.technology as "HD"|"IP", option: kit.camera.id as any });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      isSelected 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {isSelected ? "Selected" : "Select Kit"}
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
