"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import { toast } from "sonner";
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
  Loader2,
  ChevronDown,
  Minus,
  Plus,
  CreditCard,
  Truck,
  Handshake,
  Wrench
} from "lucide-react";
import dynamic from "next/dynamic";
import { CompareCards } from "./CompareCards";
import { FullCustomizerPanel } from "./FullCustomizerPanel";
import { AllSystemsGrid } from "./AllSystemsGrid";
import { resolveCardLayout } from "@/lib/card-layout-engine";

import { SiteDetailsModal } from "./SiteDetailsModal";
import { ShareDialog } from "./ShareDialog";

import type { Lead, Product, Addon, AddonRule, AppSettings, PricingResult, Address, RecommendationRule, RecommendedOutput, CardLayoutRule } from "@/types";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/components/shared/TrackingProvider";

interface ConfiguratorViewProps {
  lead: Lead;
  pricingCache: {
    products: Product[];
    addons: Addon[];
    addon_rules: AddonRule[];
    settings: AppSettings;
    recommendation_rules: RecommendationRule[];
    card_layouts: CardLayoutRule[];
  };
  promoterDiscount?: {
    percent: number;
    flat: number;
  };
  customLayoutId?: string | null;
}

export function ConfiguratorView({ lead: initialLead, pricingCache, promoterDiscount, customLayoutId }: ConfiguratorViewProps) {
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

    trackEvent("view_quote", {
      lead_id: lead.id,
      property_type: lead.property_type,
      technology: lead.technology_choice
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cablingDone = lead.cabling_done;
  const propertyType = lead.property_type;
  
  const requirements = useMemo(() => {
    const reqValues = lead.wizard_answers["q_features"];
    return Array.isArray(reqValues) ? reqValues : (reqValues ? [reqValues] : []);
  }, [lead.wizard_answers]);

  // ── Memoized addon rule evaluation — single source of truth for the whole page
  // Must be declared AFTER cablingDone, propertyType, requirements
  const evaluatedRules = useMemo(() => evaluateAddonRules(
    pricingCache.addon_rules,
    selection,
    cablingDone,
    propertyType,
    requirements
  ), [pricingCache.addon_rules, selection, cablingDone, propertyType, requirements]);

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

  // Init Compare Options — Technology-Aware Smart Card Preselection
  // Rules:
  //   Customer chose IP       → 3 IP cards (Budget / Recommended / Premium)
  //   Customer chose HD       → 2 HD cards + 1 IP Upgrade suggestion
  //   Customer "not sure"     → Mixed (HD Budget + IP Recommended + IP Premium)
  // Uses a ref to ensure this only runs ONCE per page load.
  useEffect(() => {
    if (compareInitialized.current) return;
    if (pricingCache.products.length === 0) return;

    compareInitialized.current = true;

    // Use the admin-controlled Card Layout Engine
    const resolved = resolveCardLayout(pricingCache.card_layouts, {
      technology: selection.technology || "any",
      propertyType: lead.property_type,
      cameraCount: selection.camera_count,
      customLayoutId: customLayoutId || undefined
    });

    const defaults = resolved.cards;

    setCompareOptions(defaults);
    // Find the card that is marked as recommended/featured, or fallback to the middle one
    const recommendedCard = defaults.find(c => {
       // Check if this card matches the activeRecommendation from engine
       return c.technology === selection.technology && c.option === activeRecommendation?.camera_option;
    }) || defaults[1];

    setActiveCheckoutOption({ technology: recommendedCard.technology, option: recommendedCard.option });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingCache.products.length, activeRecommendation?.camera_option, selection.technology]);

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
  }, [selection, pricingCache, cablingDone, propertyType, requirements, setPricingResults, promoterDiscount, lead.active_offer]);

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
    trackEvent("download_quote", {
      lead_id: currentLead.id,
      total_value: pricing_results.recommended.total_payable
    });

    try {
      const payload = {
        lead_id: currentLead.id,
        quoteData: pricing_results.recommended,
        address: currentLead.address,
        firebase_uid: currentLead.firebase_uid // ownership verification
      };

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save quote");
      const { id: generatedQuoteId } = await res.json();
      setSavedQuoteId(generatedQuoteId);
      
      router.push(`/quote/${currentLead.id}/review/${generatedQuoteId}`);
    } catch (err) {
      console.error(err);
      toast.error("Error saving your quote. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBooking = async (currentLead: Lead) => {
    if (!currentLead.address) return;
    setIsSaving(true);
    trackEvent("book_visit", {
      lead_id: currentLead.id,
      pincode: currentLead.address.pincode
    });
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: currentLead.id,
          address: currentLead.address,
          quote_id: savedQuoteId || "pending",
          firebase_uid: currentLead.firebase_uid // ownership verification
        })
      });
      if (res.ok) toast.success("Visit Booked! Our technician will reach you shortly.");
      else toast.error("Booking failed. Please try again.");
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
    <div className="flex flex-col gap-8 sm:gap-16 relative">
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50/20 blur-[150px] -z-10 rounded-full" />

      {/* ── Hero Section: Top Recommendations ─────────────────────────────── */}
      <div className="w-full max-w-7xl mx-auto px-2 md:px-4 mb-12 lg:mb-16">
        <div className="space-y-6">
          {/* ── Section header ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="inline-flex self-start items-center gap-2 bg-zinc-900 border border-zinc-800 text-white font-black px-4 py-1.5 rounded-full text-[9px] uppercase tracking-widest leading-none">
              <Zap className="w-3 h-3 text-blue-500" />
              Top Recommendations
            </div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">Compare Featured Systems</h2>
          </div>

          {/* ── Recommendation reason banner ───────────────────────────────── */}
          {activeRecommendation && (
            <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl animate-in fade-in duration-500">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-0.5">
                  ⭐ Our Recommendation — {lead.property_type.charAt(0).toUpperCase() + lead.property_type.slice(1)} Setup
                </div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-snug">
                  {activeRecommendation.reason}
                </p>
              </div>
            </div>
          )}

          {/* ── Compare Cards ──────────────────────────────────────────────── */}
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
            customerTechnology={selection.technology}
            promoterDiscount={promoterDiscount}
            evaluatedAddonRules={evaluatedRules}
          />
        </div>
      </div>

      {/* ── Explore Section: Filters + Grid ───────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-7xl mx-auto px-2 md:px-4">
        
        {/* ── Left Sidebar: Filters ────────────────────────────────────── */}
        <div className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-24 z-20 space-y-6">
          <FullCustomizerPanel />
        </div>

        {/* ── Right Content: Results ───────────────────────────────────── */}
        <div className="flex-1 w-full min-w-0">
          

          {/* ── All Systems Grid (Amazon-like View) ────────────────────────── */}
          <AllSystemsGrid 
            pricingCache={pricingCache}
            cablingDone={cablingDone}
            promoterDiscount={promoterDiscount}
            evaluatedRules={evaluatedRules}
          />
          
        </div>
      </div>

        {/* Global Controls: Camera Count & Recording Days */}
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 bg-zinc-50 dark:bg-zinc-900/40 p-5 md:p-8 rounded-[24px] md:rounded-[40px] border border-zinc-100 dark:border-zinc-800 shadow-xl">
           <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">System Camera Count</label>
                <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">{selection.camera_count} Cameras</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => updateSelection({ camera_count: Math.max(1, selection.camera_count - 1) })}
                  className="w-8 h-8 shrink-0 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90"
                ><Minus className="w-4 h-4" /></button>
                <input 
                  type="range" 
                  min="1" max="16" step="1"
                  value={selection.camera_count}
                  onChange={(e) => updateSelection({ camera_count: parseInt(e.target.value) })}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-900 dark:accent-blue-600 hover:accent-blue-600 transition-all flex-1"
                />
                <button 
                  onClick={() => updateSelection({ camera_count: Math.min(16, selection.camera_count + 1) })}
                  className="w-8 h-8 shrink-0 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90"
                ><Plus className="w-4 h-4" /></button>
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">Global Recording Days</label>
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 px-3 py-1 rounded-full border border-zinc-100 dark:border-zinc-800">
                  <Calendar className="w-3 h-3 text-blue-500" />
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1" max="365"
                    value={selection.recording_days}
                    onChange={(e) => updateSelection({ recording_days: parseInt(e.target.value) || 7 })}
                    className="w-10 bg-transparent text-xs font-black text-zinc-900 dark:text-white focus:outline-none"
                  />
                  <span className="text-[10px] font-black text-zinc-400 uppercase">Days</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => updateSelection({ recording_days: Math.max(7, selection.recording_days - 1) })}
                  className="w-8 h-8 shrink-0 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90"
                ><Minus className="w-4 h-4" /></button>
                <input 
                  type="range" 
                  min="7" max="60" step="1"
                  value={selection.recording_days}
                  onChange={(e) => updateSelection({ recording_days: parseInt(e.target.value) })}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-900 dark:accent-blue-600 hover:accent-blue-600 transition-all flex-1"
                />
                <button 
                  onClick={() => updateSelection({ recording_days: Math.min(60, selection.recording_days + 1) })}
                  className="w-8 h-8 shrink-0 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90"
                ><Plus className="w-4 h-4" /></button>
              </div>
           </div>
        </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[32px] sm:rounded-[48px] border border-zinc-100 dark:border-zinc-800 shadow-[0_40px_100px_rgba(0,0,0,0.08)] p-5 sm:p-8 md:p-12 max-w-5xl mx-auto w-full backdrop-blur-md">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          
          {/* LEFT COLUMN: Configuration Breakdown — shown second on mobile */}
          <div className="flex-1 space-y-8 sm:space-y-12 order-2 lg:order-1">
            
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
                 
                 const cp = calculatePricing({ 
                    selection: { 
                      ...selection, 
                      technology: cTech as "HD" | "IP", 
                      selected_camera_option: typeof cOpt === "number" ? cOpt : undefined,
                      selected_camera_id: typeof cOpt === "string" ? cOpt : undefined,
                    }, 
                    products: pricingCache.products, 
                    addons: pricingCache.addons, 
                    settings: pricingCache.settings, 
                    cablingDone, 
                    referralDiscountPercent: promoterDiscount?.percent || 0, 
                    referralDiscountFlat: promoterDiscount?.flat || 0, 
                    evaluatedAddonRules: evaluatedRules,
                    activeOffer: lead.active_offer
                 });

                 return (
                    <div className="rounded-[24px] border border-zinc-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
                      <div className="px-4 py-3 sm:px-5 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                         <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Scope of Work & Materials</span>
                         <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Amount</span>
                      </div>
                      <div className="divide-y divide-zinc-100 dark:border-zinc-800/50">
                        {cp.items.map((item) => (
                          <div key={item.product_id} className="flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5">
                            <div className="flex items-start gap-3 min-w-0">
                              <span className="w-6 h-6 mt-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-[10px] font-black text-zinc-600 dark:text-zinc-400 shrink-0">
                                 {item.qty}x
                              </span>
                              <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 leading-snug">
                                {item.display_name}
                              </span>
                            </div>
                            <span className="text-[13px] font-black text-zinc-900 dark:text-white text-right shrink-0 mt-0.5">
                              ₹{item.line_total.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                        
                        {cp.addons.map((addon) => (
                          <div key={addon.addon_id} className="flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5">
                            <div className="flex items-start gap-3 min-w-0">
                              <span className="w-6 h-6 mt-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[10px] font-black text-blue-600 dark:text-blue-400 shrink-0">
                                 {addon.qty ?? 1}x
                              </span>
                              <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 leading-snug">
                                {addon.display_name}
                              </span>
                            </div>
                            <span className="text-[13px] font-black text-zinc-900 dark:text-white text-right shrink-0 mt-0.5">
                              {addon.price < 0 ? "-" : ""}₹{Math.abs(addon.price).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
               })()}
            </div>

            {/* Extra Features */}
            {pricingCache.addons.filter(a => {
              const ruleStatus = evaluatedRules[a.id!];
              return a.is_active && ruleStatus && ruleStatus.action !== "hide";
            }).length > 0 && (
              <div className="space-y-6">
                <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                   <Zap className="w-5 h-5 text-blue-500" /> Extra Features
                </h3>
                <div className="space-y-3">
                  {pricingCache.addons.filter(a => a.is_active).map(addon => {
                    const ruleStatus = evaluatedRules[addon.id!];
                    if (ruleStatus?.action === "hide" || (!ruleStatus)) return null;
                    const isMandatory = ruleStatus.action === "show_mandatory";
                    const isSelected = isMandatory || selection.selected_addons.includes(addon.id!);

                    return (
                      <label 
                        key={addon.id} 
                        className={`flex items-center gap-4 p-4 rounded-[24px] border-2 transition-all duration-300 cursor-pointer group/addon ${
                          isSelected 
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm" 
                          : "border-transparent bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${
                          isSelected ? "bg-blue-600 border-blue-600 scale-110 shadow-lg shadow-blue-600/30" : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 group-hover/addon:border-zinc-400"
                        }`}>
                           {isSelected && <Check className="w-3.5 h-3.5 text-white font-black" />}
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={isSelected}
                          disabled={isMandatory}
                          onChange={() => toggleAddon(addon.id!)}
                        />
                        <div className="flex-1">
                          <div className={`font-black text-[10px] leading-tight uppercase tracking-tight transition-colors ${isSelected ? "text-blue-900 dark:text-blue-100" : "text-zinc-900 dark:text-white"}`}>{addon.display_name}</div>
                          <div className={`text-[10px] font-bold mt-1 tracking-widest transition-colors ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"}`}>+₹{addon.price.toLocaleString('en-IN')}</div>
                        </div>
                        {isMandatory && <span className="text-[8px] uppercase font-black text-zinc-400 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">Included</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Checkout & Actions — shown FIRST on mobile */}
          <div className="lg:w-[400px] order-1 lg:order-2">
            <div className="sticky top-8 space-y-4 sm:space-y-6">
               
               {/* Total Investment Card */}
               <div className="bg-zinc-900 dark:bg-zinc-950 p-6 sm:p-8 rounded-[28px] sm:rounded-[32px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-48 h-48 bg-blue-500/20 blur-[50px] rounded-full pointer-events-none" />
                  
                   <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Total Investment</div>
                   {(() => {
                     const cT = active_checkout_option?.technology ?? selection.technology;
                     const cO = active_checkout_option?.option   ?? selection.selected_camera_option;
                     const cp = calculatePricing({ selection: { ...selection, technology: cT as "HD" | "IP", selected_camera_option: typeof cO === "number" ? cO : undefined, selected_camera_id: typeof cO === "string" ? cO : undefined }, products: pricingCache.products, addons: pricingCache.addons, settings: pricingCache.settings, cablingDone, referralDiscountPercent: promoterDiscount?.percent || 0, referralDiscountFlat: promoterDiscount?.flat || 0, evaluatedAddonRules: evaluatedRules, activeOffer: lead.active_offer });
                     return <div className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 transition-all duration-300">&#x20B9;{cp.total_payable.toLocaleString('en-IN')}</div>;
                   })()}
                  
                  <div className="pt-6 border-t border-zinc-800 flex justify-between items-center">
                     <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Incl. GST & Labor</span>
                     <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <Check className="w-2.5 h-2.5" /> Best Value Match
                     </div>
                  </div>
               </div>

               {/* Payment Terms + AMC Trust Block — shown ABOVE action buttons so customer sees full picture first */}
               <div className="p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-4">
                 <div className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Payment Schedule</div>
                 
                 <div className="grid grid-cols-3 gap-2">
                   <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 text-center gap-1.5 shadow-sm">
                     <CreditCard className="w-4 h-4 text-blue-500" />
                     <span className="text-[10px] font-black text-zinc-900 dark:text-white">10%</span>
                     <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Advance</span>
                   </div>
                   <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 text-center gap-1.5 shadow-sm">
                     <Truck className="w-4 h-4 text-blue-500" />
                     <span className="text-[10px] font-black text-zinc-900 dark:text-white">80%</span>
                     <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Delivery</span>
                   </div>
                   <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 text-center gap-1.5 shadow-sm">
                     <Handshake className="w-4 h-4 text-emerald-500" />
                     <span className="text-[10px] font-black text-zinc-900 dark:text-white">10%</span>
                     <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Handover</span>
                   </div>
                 </div>

                 <div className="pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                   <div className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">Optional After-Sales (AMC)</div>
                   <div className="flex gap-2">
                     <div className="flex-1 flex flex-col p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/50">
                       <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">1 Year</span>
                       <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{pricingCache.settings.amc_1yr_pct ?? 15}% of total</span>
                     </div>
                     <div className="flex-1 flex flex-col p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/50">
                       <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">2 Year</span>
                       <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{pricingCache.settings.amc_2yr_pct ?? 20}% of total</span>
                     </div>
                     <div className="flex-1 flex flex-col p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/50">
                       <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">3 Year</span>
                       <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{pricingCache.settings.amc_3yr_pct ?? 25}% of total</span>
                     </div>
                   </div>
                   <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                     <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"><Wrench className="w-3 h-3"/> Post-Handover Visit</span>
                     <span className="text-[10px] font-black text-zinc-900 dark:text-white">&#x20B9;{pricingCache.settings.visit_charge ?? 300} / visit</span>
                   </div>
                 </div>
               </div>

               {/* Action Buttons — below payment terms so customer is informed before committing */}
               <div className="space-y-3 sm:space-y-4">
                 <button
                   onClick={() => triggerActionWithAddress("download")}
                   disabled={isSaving}
                   className="group relative w-full h-14 sm:h-18 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-[0.3em] rounded-[28px] sm:rounded-[32px] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 overflow-hidden touch-manipulation"
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

                 <div className="grid grid-cols-2 gap-3 sm:gap-4">
                   <button
                     onClick={() => triggerActionWithAddress("whatsapp")}
                     className="group relative h-14 sm:h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl sm:rounded-3xl flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 overflow-hidden touch-manipulation"
                   >
                     <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> WhatsApp
                     <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </button>
                   <button
                     onClick={() => triggerActionWithAddress("booking")}
                     className="h-14 sm:h-16 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white font-black uppercase text-[10px] tracking-widest rounded-2xl sm:rounded-3xl flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-95 border border-zinc-200 dark:border-zinc-700 shadow-lg touch-manipulation"
                   >
                     <Calendar className="w-4 h-4" /> Book Visit
                   </button>
                 </div>
               </div>

               {/* Terms Disclaimer */}
               <div className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed space-y-1 px-1">
                 <p>• Product warranty as per company terms & conditions.</p>
                 <p>• Warranty does not cover physically damaged accessories.</p>
                 <p>• AMC includes site visits & labour — no product cost.</p>
                 <p>• Quote valid for {pricingCache.settings.quote_validity_days ?? 15} days from issue date.</p>
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