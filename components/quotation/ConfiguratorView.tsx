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
  Wrench,
  Activity
} from "lucide-react";
import dynamic from "next/dynamic";
import { CompareCards } from "./CompareCards";
import { FullCustomizerPanel } from "./FullCustomizerPanel";
import { AllSystemsGrid } from "./AllSystemsGrid";
import { resolveCardLayout } from "@/lib/card-layout-engine";
import { ExpertFiltersBar } from "./ExpertFiltersBar";

import { SiteDetailsModal } from "./SiteDetailsModal";
import { ShareDialog } from "./ShareDialog";
import { SystemSummary } from "./SystemSummary";
import { ActionPanel } from "./ActionPanel";
import { AddonSelector } from "./AddonSelector";

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
  const [pendingAction, setPendingAction] = useState<"download" | "whatsapp" | "booking" | "accept" | null>(null);
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
    const rawFeaturesArray = Array.isArray(reqFeaturesRaw) ? reqFeaturesRaw : (reqFeaturesRaw ? [reqFeaturesRaw as string] : []);
    
    // Map user-friendly wizard answers to technical tags used by the system
    const requestedFeatures = Array.from(new Set(rawFeaturesArray.map(f => {
      const fl = f.toLowerCase();
      if (fl.includes("night") || fl.includes("color")) return "color";
      if (fl.includes("audio") || fl.includes("mic") || fl.includes("sound")) return "mic";
      if (fl.includes("ptz") || fl.includes("360") || fl.includes("pan") || fl.includes("tilt")) return "ptz";
      if (fl.includes("ultra") || fl.includes("4mp") || fl.includes("5mp") || fl.includes("8mp") || fl.includes("4k")) return "ultra";
      return "";
    }).filter(f => f !== "")));

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
      brand_preference: (lead.wizard_answers["q_brand"] === "recommend" || lead.wizard_answers["q_brand"] === "unsure") ? "all" : (lead.wizard_answers["q_brand"] as string || "all"),
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

  // ── Compute Active Pricing Result (for Summary & Checkout) ────────────────
  const activePricing = useMemo(() => {
    const cT = active_checkout_option?.technology ?? selection.technology;
    const cO = active_checkout_option?.option ?? selection.selected_camera_option;

    return calculatePricing({
      selection: {
        ...selection,
        technology: cT as "HD" | "IP",
        selected_camera_option: typeof cO === "number" ? cO : undefined,
        selected_camera_id: typeof cO === "string" ? cO : undefined,
      },
      products: pricingCache.products,
      addons: pricingCache.addons,
      settings: pricingCache.settings,
      cablingDone,
      referralDiscountPercent: promoterDiscount?.percent || 0,
      referralDiscountFlat: promoterDiscount?.flat || 0,
      evaluatedAddonRules: evaluatedRules,
      activeOffer: lead.active_offer,
    });
  }, [
    active_checkout_option,
    selection,
    pricingCache,
    cablingDone,
    promoterDiscount,
    evaluatedRules,
    lead.active_offer,
  ]);

  const triggerActionWithAddress = (action: "download" | "whatsapp" | "booking" | "accept") => {
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

  const executeAction = async (action: "download" | "whatsapp" | "booking" | "accept", currentLead?: Lead) => {
    const activeLead = currentLead || lead;
    if (action === "download") await handleSaveQuote(activeLead, "draft");
    if (action === "accept") await handleSaveQuote(activeLead, "accepted");
    if (action === "whatsapp") handleWhatsappShare(activeLead);
    if (action === "booking") await handleBooking(activeLead);
  };

  const handleSaveQuote = async (currentLead: Lead, status: "accepted" | "draft" = "draft") => {
    if (!activePricing || !pricingCache.settings) return;
    setIsSaving(true);

    const isAccepted = status === "accepted";
    
    trackEvent(isAccepted ? "quote_accepted" : "download_quote", {
      lead_id: currentLead.id,
      total_value: activePricing.total_payable
    });

    try {
      const payload = {
        lead_id: currentLead.id,
        quoteData: activePricing,
        address: currentLead.address,
        firebase_uid: currentLead.firebase_uid,
        status,
        accepted_at: isAccepted ? new Date().toISOString() : null
      };

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save quote");
      const resData = await res.json();
      const generatedQuoteId = resData.data.id;
      setSavedQuoteId(generatedQuoteId);
      
      if (isAccepted) {
        toast.success("Quotation Accepted! We will contact you shortly.");
      } else {
        toast.success("Detailed Quotation Ready!");
      }

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

          <ExpertFiltersBar />

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
            requestedFeatures={selection.requested_features || []}
            selectedAddons={selection.selected_addons || []}
            promoterDiscount={promoterDiscount}
            evaluatedAddonRules={evaluatedRules}
            activeOffer={lead.active_offer}
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
            activeOffer={lead.active_offer}
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
            <SystemSummary 
              items={activePricing.items} 
              addons={activePricing.addons} 
            />

            {/* What Happens Next Section */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">What Happens Next?</h3>
               </div>
               
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 {[
                   { title: "Site Survey", desc: "Book a visit for a precise wiring measurement." },
                   { title: "Installation", desc: "Professional setup by our certified team." },
                   { title: "Go Live", desc: "System handover with mobile app setup." }
                 ].map((step, i) => (
                   <div key={i} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                     <div className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-1.5">Step 0{i+1}</div>
                     <div className="text-[13px] font-black text-zinc-900 dark:text-white mb-1">{step.title}</div>
                     <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">{step.desc}</p>
                   </div>
                 ))}
               </div>
            </div>

            <AddonSelector 
              addons={pricingCache.addons} 
              evaluatedRules={evaluatedRules} 
              selectedAddonIds={selection.selected_addons} 
              toggleAddon={toggleAddon} 
            />
          </div>

          <ActionPanel 
            pricing={activePricing} 
            settings={pricingCache.settings} 
            isSaving={isSaving} 
            onAction={triggerActionWithAddress} 
          />
          
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