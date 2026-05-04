"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import { PlanCard } from "./PlanCard";
import { calculatePricing } from "@/lib/pricing-engine";
import { evaluateAddonRules } from "@/lib/addon-rules";
import { getRecommendedOption } from "@/lib/recommendation-engine";
import { 
  SlidersHorizontal, 
  Share2, 
  Download, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Info, 
  Check, 
  Loader2 
} from "lucide-react";
import dynamic from "next/dynamic";
import { ComparisonTable } from "./ComparisonTable";
import { CompareCards } from "./CompareCards";

const SiteDetailsModal = dynamic(() => import("./SiteDetailsModal").then(mod => mod.SiteDetailsModal), {
  loading: () => <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[100] animate-pulse" />
});

const ShareDialog = dynamic(() => import("./ShareDialog").then(mod => mod.ShareDialog), {
  loading: () => null
});

import type { Lead, Product, Addon, AddonRule, AppSettings, PricingResult, Address, RecommendationRule, RecommendedOutput } from "@/types";
import { useRouter } from "next/navigation";

interface ConfiguratorViewProps {
  lead: Lead;
  pricingCache: {
    products: Product[];
    addons: Addon[];
    addon_rules: AddonRule[];
    settings: AppSettings;
    recommendation_rules: RecommendationRule[];
  };
  promoterDiscount?: {
    percent: number;
    flat: number;
  };
}

export function ConfiguratorView({ lead: initialLead, pricingCache, promoterDiscount }: ConfiguratorViewProps) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead>(initialLead);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"download" | "whatsapp" | "booking" | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [savedPdfUrl, setSavedPdfUrl] = useState<string | null>(null);

  const { 
    setPricingCache, 
    selection, 
    updateSelection, 
    pricing_results, 
    setPricingResults,
    toggleAddon,
    compare_options,
    active_checkout_option,
    setCompareOptions,
    setActiveCheckoutOption
  } = useConfiguratorStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [compareLimit, setCompareLimit] = useState(false); // replaces browser alert
  const compareInitialized = useRef(false); // prevent re-init on every checkout click

  // 1. Initial Selection Setup from Lead Data
  useEffect(() => {
    setPricingCache(pricingCache);
    
    const initialCamCount = parseInt(lead.wizard_answers["q_cam_count"] as string) || 4;
    const initialDays = parseInt(lead.wizard_answers["q_storage"] as string) || 15;
    
    const wantsAmcRaw = lead.wizard_answers["q_amc"];
    const wantsAmc = typeof wantsAmcRaw === 'string' ? wantsAmcRaw === 'true' : !!wantsAmcRaw;

    const reqFeaturesRaw = lead.wizard_answers["q_features"];
    const requestedFeatures = Array.isArray(reqFeaturesRaw) ? reqFeaturesRaw : (reqFeaturesRaw ? [reqFeaturesRaw as string] : []);

    const surfaceRaw = lead.wizard_answers["q_surface"];
    const surfaceTypes = Array.isArray(surfaceRaw) ? surfaceRaw : (surfaceRaw ? [surfaceRaw as string] : []);

    updateSelection({
      technology: lead.technology_choice || "HD",
      camera_count: initialCamCount,
      recording_days: initialDays,
      ceiling_height: (lead.wizard_answers["q_height"] as any) || "standard",
      wants_amc: wantsAmc,
      requested_features: requestedFeatures,
      surface_types: surfaceTypes,
      brand_preference: (lead.wizard_answers["q_brand"] as string) || "recommend",
      installation_timeline: (lead.wizard_answers["q_timeline"] as string) || "research",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cablingDone = lead.cabling_done;
  const propertyType = lead.property_type;
  
  const requirements = useMemo(() => {
    const reqValues = lead.wizard_answers["q_features"];
    return Array.isArray(reqValues) ? reqValues : (reqValues ? [reqValues] : []);
  }, [lead.wizard_answers]);

  // 2. Dynamic Recommendation Evaluation
  const activeRecommendation = useMemo(() => {
    return getRecommendedOption(
      pricingCache.recommendation_rules,
      selection,
      propertyType
    );
  }, [selection, pricingCache.recommendation_rules, propertyType]);

  // Sync selection with recommendation pre-select if tech matches
  useEffect(() => {
    if (activeRecommendation && activeRecommendation.camera_option !== selection.selected_camera_option && !active_checkout_option) {
      updateSelection({ selected_camera_option: activeRecommendation.camera_option });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRecommendation?.camera_option]);

  // Init Compare Options on Load â€“ compute premium based on brand & resolution
  // Uses a ref to ensure this only runs ONCE per page load, regardless of checkout changes.
  useEffect(() => {
    if (compareInitialized.current) return;
    if (pricingCache.products.length === 0) return;

    compareInitialized.current = true;

    const recOption = activeRecommendation?.camera_option || 2;
    const recTech = selection.technology;

    const recTechName = recTech === "IP" ? `cam_ip_opt${recOption}` : `cam_hd_opt${recOption}`;
    const recProduct = pricingCache.products.find(p => p.technical_name === recTechName);
    const recBrand = recProduct?.brand;
    const recResolution = recProduct?.technical_name?.includes('5mp') ? 5
      : recProduct?.technical_name?.includes('4mp') ? 4 : 2;

    const getMp = (tn: string) =>
      tn.includes('5mp') ? 5 : tn.includes('4mp') ? 4 : 2;

    // 1ï¸âƒ£ Higher-resolution SAME brand
    let premiumProduct = pricingCache.products.find(p =>
      p.is_active &&
      p.brand === recBrand &&
      p.technology === recTech &&
      getMp(p.technical_name ?? '') > recResolution
    );

    // 2ï¸âƒ£ Higher-resolution ANY brand (fallback)
    if (!premiumProduct) {
      premiumProduct = pricingCache.products.find(p =>
        p.is_active &&
        p.technology === recTech &&
        getMp(p.technical_name ?? '') > recResolution
      );
    }

    const premiumOption = premiumProduct
      ? parseInt(premiumProduct.technical_name?.match(/opt(\d+)/)?.[1] ?? `${recOption + 1}`)
      : recOption + 1;

    const defaults: Array<{ technology: "HD" | "IP"; option: number }> = [
      { technology: "HD", option: 1 },        // Essential  â€“ cheapest HD
      { technology: "IP", option: recOption }, // Recommended â€“ admin rule
      { technology: "IP", option: premiumOption }, // Premium â€“ higher res / diff brand
    ];

    setCompareOptions(defaults);
    setActiveCheckoutOption(defaults[1]); // default checkout = Recommended
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingCache.products.length, activeRecommendation?.camera_option]);

  // Handle Toggle Compare from Table (inline limit message replaces browser alert)
  const handleToggleCompare = (opt: { technology: "HD" | "IP"; option: number }) => {
    const exists = compare_options.find(
      c => c.technology === opt.technology && c.option === opt.option
    );
    if (exists) {
      setCompareLimit(false);
      setCompareOptions(
        compare_options.filter(
          c => !(c.technology === opt.technology && c.option === opt.option)
        )
      );
    } else {
      if (compare_options.length >= 3) {
        setCompareLimit(true);
        setTimeout(() => setCompareLimit(false), 3000);
        return;
      }
      setCompareLimit(false);
      setCompareOptions([...compare_options, opt]);
    }
  };

  // 3. Pricing Calculation Loop (Debounced for performance)
  useEffect(() => {
    if (!pricingCache.settings) return;

    const timeout = setTimeout(() => {
      const evaluatedRules = evaluateAddonRules(
        pricingCache.addon_rules,
        selection,
        cablingDone,
        propertyType,
        requirements
      );

      const calcTier = (type: "budget" | "recommended" | "premium"): PricingResult => {
        const variation = { ...selection, plan_type: type };
        if (type === "budget") variation.picture_quality = "good";
        if (type === "premium") variation.picture_quality = "crystal_clear";
        
          return calculatePricing({
            selection: variation,
            products: pricingCache.products,
            addons: pricingCache.addons,
            settings: pricingCache.settings,
            cablingDone,
            referralDiscountPercent: promoterDiscount?.percent || 0,
            referralDiscountFlat: promoterDiscount?.flat || 0,
            evaluatedAddonRules: evaluatedRules,
            activeOffer: lead.active_offer
          });
        };

      setPricingResults({
        budget: calcTier("budget"),
        recommended: calcTier("recommended"),
        premium: calcTier("premium"),
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [selection, pricingCache, cablingDone, propertyType, requirements, setPricingResults, promoterDiscount]);

  const triggerActionWithAddress = (action: "download" | "whatsapp" | "booking") => {
    if (!lead.address) {
      setPendingAction(action);
      setShowAddressModal(true);
    } else {
      executeAction(action);
    }
  };

  const handleAddressConfirm = (addressData: Address) => {
    const updatedLead = { ...lead, address: addressData };
    setLead(updatedLead);
    setShowAddressModal(false);
    if (pendingAction) {
      executeAction(pendingAction, updatedLead);
      setPendingAction(null);
    }
  };

  const executeAction = async (action: "download" | "whatsapp" | "booking", currentLead?: Lead) => {
    const activeLead = currentLead || lead;
    if (action === "download") await handleSaveQuote(activeLead);
    if (action === "whatsapp") handleWhatsappShare(activeLead);
    if (action === "booking") await handleBooking(activeLead);
  };

  const handleSaveQuote = async (currentLead: Lead) => {
    if (!pricing_results.recommended || !pricingCache.settings) return;
    setIsSaving(true);

    try {
      const payload = {
        lead_id: currentLead.id,
        quoteData: pricing_results.recommended,
        address: currentLead.address
      };

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save quote");
      const { id: generatedQuoteId } = await res.json();
      setSavedQuoteId(generatedQuoteId);
      
      const pdfRes = await fetch(`/api/quotes/${generatedQuoteId}/pdf?leadId=${currentLead.id}`);
      if (pdfRes.ok) {
         const contentType = pdfRes.headers.get("Content-Type");
         if (contentType === "application/pdf") {
            const blob = await pdfRes.blob();
            const blobUrl = URL.createObjectURL(blob);
            setSavedPdfUrl(blobUrl);
            window.open(blobUrl, "_blank");
         } else {
            const { url } = await pdfRes.json();
            if (url) {
              setSavedPdfUrl(url);
              window.open(url, "_blank");
            }
         }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving your quote. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBooking = async (currentLead: Lead) => {
    if (!currentLead.address) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: currentLead.id,
          address: currentLead.address,
          quote_id: savedQuoteId || "pending"
        })
      });
      if (res.ok) alert("âœ… Visit Booked! Our technician will reach you shortly.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWhatsappShare = (currentLead: Lead) => {
    setShowShareDialog(true);
  };

  if (!pricing_results.recommended) return <div className="animate-pulse flex space-y-4 flex-col h-96 bg-zinc-200 rounded-xl" />;

  return (
    <div className="flex flex-col gap-16 relative">
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50/20 blur-[150px] -z-10 rounded-full" />      <div className="flex flex-col items-center gap-12">
        <div className="w-full max-w-6xl mx-auto space-y-6">
           <div className="flex flex-col items-center gap-3 mb-8">
              <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-white font-black px-4 py-1.5 rounded-full text-[9px] uppercase tracking-widest leading-none">
                 <Zap className="w-3 h-3 text-blue-500" />
                 Smart Comparison
              </div>
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase text-center">Choose Your Tier</h2>
           </div>
           
           <CompareCards 
              compareOptions={compare_options}
              activeCheckoutOption={active_checkout_option}
              onSelectCheckout={setActiveCheckoutOption}
              cameraCount={selection.camera_count}
              recordingDays={selection.recording_days}
              products={pricingCache.products}
              addons={pricingCache.addons}
              settings={pricingCache.settings}
              cablingDone={cablingDone}
              recommendation={activeRecommendation}
              promoterDiscount={promoterDiscount}
              evaluatedAddonRules={evaluateAddonRules(pricingCache.addon_rules, selection, cablingDone, propertyType, requirements)}
           />
        </div>

        {/* Global Controls: Camera Count & Recording Days */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 bg-zinc-50 dark:bg-zinc-900/40 p-4 md:p-8 rounded-[32px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800 shadow-xl">
           <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">System Camera Count</label>
                <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">{selection.camera_count} Cameras</span>
              </div>
              <input 
                type="range" 
                min="1" max="16" step="1"
                value={selection.camera_count}
                onChange={(e) => updateSelection({ camera_count: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-900 dark:accent-blue-600 hover:accent-blue-600 transition-all"
              />
           </div>

           <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Global Recording Days</label>
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 px-3 py-1 rounded-full border border-zinc-100 dark:border-zinc-800">
                  <Calendar className="w-3 h-3 text-blue-500" />
                  <input 
                    type="number"
                    min="1" max="365"
                    value={selection.recording_days}
                    onChange={(e) => updateSelection({ recording_days: parseInt(e.target.value) || 7 })}
                    className="w-10 bg-transparent text-xs font-black text-zinc-900 dark:text-white focus:outline-none"
                  />
                  <span className="text-[10px] font-black text-zinc-400 uppercase">Days</span>
                </div>
              </div>
              <input 
                type="range" 
                min="7" max="60" step="1"
                value={selection.recording_days}
                onChange={(e) => updateSelection({ recording_days: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-900 dark:accent-blue-600 hover:accent-blue-600 transition-all"
              />
           </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-2 md:px-4 space-y-8 md:space-y-12">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                 <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">Technical Comparison</h2>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Select hardware to see instant quote impact</p>
              </div>
           </div>
           {activeRecommendation && (
              <div className="hidden md:flex items-center gap-3 px-5 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Expert Advice</span>
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">{activeRecommendation.reason}</span>
                  </div>
              </div>
           )}
        </div>

        <ComparisonTable 
          cameraCount={selection.camera_count}
          recordingDays={selection.recording_days}
          products={pricingCache.products}
          addons={pricingCache.addons}
          settings={pricingCache.settings}
          cablingDone={cablingDone}
          
          compareOptions={compare_options}
          onToggleCompare={handleToggleCompare}
          activeCheckoutOption={active_checkout_option}
          onSelectCheckout={setActiveCheckoutOption}
          
          recommendation={activeRecommendation}
          promoterDiscount={promoterDiscount}
          evaluatedAddonRules={evaluateAddonRules(pricingCache.addon_rules, selection, cablingDone, propertyType, requirements)}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900/40 rounded-[48px] border border-zinc-100 dark:border-zinc-800 shadow-[0_40px_100px_rgba(0,0,0,0.08)] p-8 md:p-12 max-w-5xl mx-auto w-full backdrop-blur-md">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* LEFT COLUMN: Configuration Breakdown */}
          <div className="flex-1 space-y-12">
            
            {/* System Summary */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">System Summary</h3>
               </div>
               
               {/* System Summary - mirrors the SELECTED comparison card */}
               {(() => {
                 const cTech = active_checkout_option?.technology ?? selection.technology;
                 const cOpt  = active_checkout_option?.option   ?? selection.selected_camera_option;
                 const cTn   = `${cTech === 'IP' ? 'cam_ip' : 'cam_hd'}_opt${cOpt}`;
                 const cProd = pricingCache.products.find(p => p.technical_name === cTn);
                 const cRes  = cProd?.technical_name?.includes('5mp') ? '5MP Ultra-HD'
                   : cProd?.technical_name?.includes('4mp') ? '4MP Pro-HD' : '2MP Standard-HD';
                 return (
                   <div className="p-8 rounded-[32px] bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 space-y-4">
                     <div className="flex justify-between items-center text-sm">
                       <span className="font-bold text-zinc-400">Camera Model</span>
                       <span className="font-black text-zinc-900 dark:text-white text-right text-xs max-w-[55%] truncate" title={cProd?.display_name}>
                         {cProd?.display_name?.split(' (')[0] ?? `${cTech} Option ${cOpt}`}
                       </span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <span className="font-bold text-zinc-400">Resolution</span>
                       <span className="font-black text-zinc-900 dark:text-white uppercase tracking-widest">{cRes}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <span className="font-bold text-zinc-400">System Type</span>
                       <span className="font-black text-zinc-900 dark:text-white uppercase tracking-widest">{cTech} / {cTech === 'IP' ? 'NVR' : 'DVR'}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <span className="font-bold text-zinc-400">Storage</span>
                       <span className="font-black text-zinc-900 dark:text-white uppercase tracking-widest">{selection.recording_days} Days Backup</span>
                     </div>
                   </div>
                 );
               })()}
            </div>

            {/* Extra Features */}
            {pricingCache.addons.filter(a => {
              const evaluatedRules = evaluateAddonRules(pricingCache.addon_rules, selection, cablingDone, propertyType, requirements);
              const ruleStatus = evaluatedRules[a.id!];
              return a.is_active && ruleStatus && ruleStatus.action !== "hide";
            }).length > 0 && (
              <div className="space-y-6">
                <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                   <Zap className="w-5 h-5 text-blue-500" /> Extra Features
                </h3>
                <div className="space-y-3">
                  {pricingCache.addons.filter(a => a.is_active).map(addon => {
                    const evaluatedRules = evaluateAddonRules(pricingCache.addon_rules, selection, cablingDone, propertyType, requirements);
                    const ruleStatus = evaluatedRules[addon.id!];
                    if (ruleStatus?.action === "hide" || (!ruleStatus)) return null;
                    const isMandatory = ruleStatus.action === "show_mandatory";
                    const isSelected = isMandatory || selection.selected_addons.includes(addon.id!);

                    return (
                      <label 
                        key={addon.id} 
                        className={`flex items-center gap-4 p-4 rounded-3xl border transition-all cursor-pointer group/addon ${
                          isSelected 
                          ? "border-blue-100 bg-blue-50/20 dark:border-blue-500/20 dark:bg-blue-500/5" 
                          : "border-zinc-50 dark:border-zinc-800 bg-white dark:bg-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isSelected ? "bg-blue-600 border-blue-600" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 group-hover/addon:border-zinc-300"
                        }`}>
                           {isSelected && <Check className="w-3 h-3 text-white font-black" />}
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={isSelected}
                          disabled={isMandatory}
                          onChange={() => toggleAddon(addon.id!)}
                        />
                        <div className="flex-1">
                          <div className="font-black text-[10px] text-zinc-900 dark:text-white leading-tight uppercase tracking-tight">{addon.display_name}</div>
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1 tracking-widest">+â‚¹{addon.price.toLocaleString('en-IN')}</div>
                        </div>
                        {isMandatory && <span className="text-[8px] uppercase font-black text-zinc-400 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">Included</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Checkout & Actions */}
          <div className="lg:w-[400px]">
            <div className="sticky top-8 space-y-6">
               
               {/* Total Investment Card */}
               <div className="bg-zinc-900 dark:bg-zinc-950 p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-48 h-48 bg-blue-500/20 blur-[50px] rounded-full pointer-events-none" />
                  
                   <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Total Investment</div>
                   {(() => {
                     const cT = active_checkout_option?.technology ?? selection.technology;
                     const cO = active_checkout_option?.option   ?? selection.selected_camera_option;
                     const eR = evaluateAddonRules(pricingCache.addon_rules, selection, cablingDone, propertyType, requirements);
                     const cp = calculatePricing({ selection: { ...selection, technology: cT, selected_camera_option: cO }, products: pricingCache.products, addons: pricingCache.addons, settings: pricingCache.settings, cablingDone, referralDiscountPercent: promoterDiscount?.percent || 0, referralDiscountFlat: promoterDiscount?.flat || 0, evaluatedAddonRules: eR });
                     return <div className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">&#x20B9;{cp.total_payable.toLocaleString('en-IN')}</div>;
                   })()}
                  
                  <div className="pt-6 border-t border-zinc-800 flex justify-between items-center">
                     <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Incl. GST & Labor</span>
                     <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <Check className="w-2.5 h-2.5" /> Best Value Match
                     </div>
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="space-y-4">
                 <button 
                   onClick={() => triggerActionWithAddress("download")}
                   disabled={isSaving}
                   className="group relative w-full h-18 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-[0.3em] rounded-[32px] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 overflow-hidden"
                 >
                   {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                     <>
                       <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" /> 
                       Download Full Quote 
                       <ArrowRight className="w-4 h-4 translate-y-[1px]" />
                     </>
                   )}
                   <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </button>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <button 
                     onClick={() => triggerActionWithAddress("whatsapp")}
                     className="group relative h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 overflow-hidden"
                   >
                     <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> WhatsApp
                     <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </button>
                   <button 
                     onClick={() => triggerActionWithAddress("booking")}
                     className="h-16 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white font-black uppercase text-[10px] tracking-widest rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-95 border border-zinc-200 dark:border-zinc-700 shadow-lg"
                   >
                     <Calendar className="w-4 h-4" /> Book Visit
                   </button>
                 </div>
               </div>

               {/* Payment Terms + AMC Trust Block */}
               <div className="p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 space-y-3">
                 <div className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3">Payment Terms</div>
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] font-bold text-zinc-500">Advance (Booking)</span>
                   <span className="text-[10px] font-black text-zinc-900 dark:text-white">10%</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] font-bold text-zinc-500">Material Delivery</span>
                   <span className="text-[10px] font-black text-zinc-900 dark:text-white">80%</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] font-bold text-zinc-500">Final Handover</span>
                   <span className="text-[10px] font-black text-zinc-900 dark:text-white">10%</span>
                 </div>
                 <div className="pt-3 mt-1 border-t border-dashed border-zinc-200 dark:border-zinc-800 space-y-1.5">
                   <div className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-2">After-Sales</div>
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-zinc-500">AMC 1 Year</span>
                     <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">5% of Total</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-zinc-500">AMC 2 Year</span>
                     <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">8% of Total</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-zinc-500">AMC 3 Year</span>
                     <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">10% of Total</span>
                   </div>
                   <div className="flex justify-between items-center pt-1">
                     <span className="text-[10px] font-bold text-zinc-500">Post-Handover Visit</span>
                     <span className="text-[10px] font-black text-zinc-900 dark:text-white">&#x20B9;300 / visit</span>
                   </div>
                 </div>
               </div>

               {/* Terms Disclaimer */}
               <div className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-600 leading-relaxed space-y-1 px-1">
                 <p># Product warranty as per company terms & conditions.</p>
                 <p># Warranty does not cover physically damaged accessories.</p>
                 <p># AMC includes site visits & labour — no product cost.</p>
                 <p># Quote valid for {pricingCache.settings.quote_validity_days ?? 15} days from issue date.</p>
               </div>

            </div>
          </div>
          
        </div>
      </div>

      {showAddressModal && (
        <SiteDetailsModal 
          initialPincode={lead.address?.pincode || (lead.wizard_answers?.lead_pincode as string) || ""}
          onConfirm={handleAddressConfirm}
          onClose={() => setShowAddressModal(false)}
        />
      )}

      {showShareDialog && pricing_results.budget && (
        <ShareDialog
          leadId={lead.id!}
          quoteId={savedQuoteId || "draft"}
          customerName={lead.customer_name}
          customerMobile={lead.mobile_number || ""}
          lowestPrice={pricing_results.budget.total_payable}
          propertyType={lead.property_type}
          whatsappTemplate={pricingCache.settings.whatsapp_template}
          pdfUrl={savedPdfUrl || undefined}
          contactPhone={"+91 97726 99395"}
          onClose={() => setShowShareDialog(false)}
        />
      )}

    </div>
  );
}