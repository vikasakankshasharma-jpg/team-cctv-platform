"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import { toast } from "sonner";
import { calculatePricing } from "@/lib/pricing-engine";
import { evaluateAddonRules } from "@/lib/addon-rules";
import { getRecommendedOption } from "@/lib/recommendation-engine";
import { CompareCards } from "./CompareCards";
import { SpecCompareTable } from "./SpecCompareTable";
import { FullCustomizerPanel } from "./FullCustomizerPanel";
import { SmartContextBar } from "./SmartContextBar";
import { SiteDetailsModal } from "./SiteDetailsModal";
import { ShareDialog } from "./ShareDialog";
import { useRealtimeInventory } from "@/hooks/useRealtimeInventory";

import type { Lead, Product, Addon, AddonRule, AppSettings, PricingResult, Address, RecommendationRule, CardLayoutRule } from "@/types";
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
  promoterDiscount?: { percent: number; flat: number; };
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
    compare_options,
    active_checkout_option,
    setCompareOptions,
    setActiveCheckoutOption
  } = useConfiguratorStore();

  const [isSaving, setIsSaving] = useState(false);

  // Real-Time Inventory Sync
  const { products: liveProducts, addons: liveAddons } = useRealtimeInventory(pricingCache.products, pricingCache.addons);
  const currentProducts = liveProducts.length > 0 ? liveProducts : pricingCache.products;
  const currentAddons = liveAddons.length > 0 ? liveAddons : pricingCache.addons;

  // Initial Setup
  useEffect(() => {
    setPricingCache({
      ...pricingCache,
      products: currentProducts,
      addons: currentAddons
    });
    
    const initialCamCount = parseInt(lead.wizard_answers["q_cam_count"] as string) || 4;
    const initialDays = parseInt(lead.wizard_answers["q_storage"] as string) || 15;
    
    const wantsAmcRaw = lead.wizard_answers["q_amc"];
    const wantsAmc = typeof wantsAmcRaw === 'string' ? wantsAmcRaw === 'true' : !!wantsAmcRaw;

    const reqFeaturesRaw = lead.wizard_answers["q_special_features"] || lead.wizard_answers["q_features"];
    const rawFeaturesArray = Array.isArray(reqFeaturesRaw) ? reqFeaturesRaw : (reqFeaturesRaw ? [reqFeaturesRaw as string] : []);
    
    const requestedFeatures = Array.from(new Set(rawFeaturesArray.map(f => {
      const fl = f.toLowerCase();
      if (fl.includes("night") || fl.includes("color")) return "color";
      if (fl.includes("audio") || fl.includes("mic") || fl.includes("sound")) return "mic";
      if (fl.includes("ptz") || fl.includes("360") || fl.includes("pan") || fl.includes("tilt")) return "ptz";
      if (fl.includes("ultra") || fl.includes("4mp") || fl.includes("5mp") || fl.includes("8mp") || fl.includes("4k")) return "4mp";
      if (fl.includes("stqc")) return "stqc";
      return "";
    }).filter(f => f !== "")));

    const surfaceRaw = lead.wizard_answers["q_surface"];
    const surfaceTypes = Array.isArray(surfaceRaw) ? surfaceRaw : (surfaceRaw ? [surfaceRaw as string] : []);

    const generalAddonsRaw = lead.wizard_answers["q_general_addons"];
    const rawAddonsArray = Array.isArray(generalAddonsRaw) ? generalAddonsRaw : (generalAddonsRaw ? [generalAddonsRaw as string] : []);
    const selectedAddons = rawAddonsArray.filter(a => a !== "none").map(a => `addon_${a}`);

    let mappedBrand = lead.wizard_answers["q_brand"] as string || "all";
    if (mappedBrand === "recommend" || mappedBrand === "unsure") mappedBrand = "all";
    if (mappedBrand === "cpplus") mappedBrand = "CP-Plus";

    updateSelection({
      technology: lead.technology_choice || "HD",
      camera_count: initialCamCount,
      recording_days: initialDays,
      ceiling_height: (lead.wizard_answers["q_height"] as any) || "standard",
      wants_amc: wantsAmc,
      requested_features: requestedFeatures,
      surface_types: surfaceTypes,
      selected_addons: selectedAddons,
      brand_preference: mappedBrand,
      installation_timeline: (lead.wizard_answers["q_timeline"] as string) || "research",
      property_type: lead.property_type,
    });

    trackEvent("view_quote", { lead_id: lead.id, property_type: lead.property_type, technology: lead.technology_choice });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProducts, currentAddons]);

  const cablingDone = lead.cabling_done;
  const propertyType = lead.property_type;
  
  const requirements = useMemo(() => {
    const reqValues = lead.wizard_answers["q_special_features"] || lead.wizard_answers["q_features"];
    return Array.isArray(reqValues) ? reqValues : (reqValues ? [reqValues] : []);
  }, [lead.wizard_answers]);

  const evaluatedRules = useMemo(() => evaluateAddonRules(
    pricingCache.addon_rules, selection, cablingDone, propertyType, requirements
  ), [pricingCache.addon_rules, selection, cablingDone, propertyType, requirements]);

  const activeRecommendation = useMemo(() => {
    return getRecommendedOption(pricingCache.recommendation_rules, selection, propertyType);
  }, [selection, pricingCache.recommendation_rules, propertyType]);

  useEffect(() => {
    if (activeRecommendation && activeRecommendation.camera_option !== selection.selected_camera_option && !active_checkout_option) {
      updateSelection({ selected_camera_option: activeRecommendation.camera_option });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRecommendation?.camera_option]);

  useEffect(() => {
    if (currentProducts.length === 0) return;
    const currentTech = (!selection.technology) ? "IP" : selection.technology;
    const dynamicCards: Array<{technology: "HD" | "IP"; option: number}> = [
      { technology: currentTech as "HD" | "IP", option: 1 },
      { technology: currentTech as "HD" | "IP", option: 2 },
      { technology: currentTech as "HD" | "IP", option: 3 }
    ];
    setCompareOptions(dynamicCards);

    const recommendedCard = dynamicCards.find(c => c.technology === currentTech && c.option === activeRecommendation?.camera_option) || dynamicCards[1];
    if (!active_checkout_option || active_checkout_option.technology !== currentTech) {
      setActiveCheckoutOption({ technology: recommendedCard.technology, option: recommendedCard.option });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProducts.length, selection.technology, selection.brand_preference, selection.requested_features, selection.max_budget, selection.resolution_preference]);

  useEffect(() => {
    if (!pricingCache.settings) return;
    const timeout = setTimeout(() => {
      const calcTier = (type: "budget" | "recommended" | "premium"): PricingResult => {
        const variation = { ...selection, plan_type: type };
        if (type === "budget") variation.picture_quality = "good";
        if (type === "premium") variation.picture_quality = "crystal_clear";
        
        return calculatePricing({
          selection: variation, products: currentProducts, addons: currentAddons,
          settings: pricingCache.settings, cablingDone, referralDiscountPercent: promoterDiscount?.percent || 0,
          referralDiscountFlat: promoterDiscount?.flat || 0, evaluatedAddonRules: evaluatedRules, activeOffer: lead.active_offer
        });
      };
      setPricingResults({ budget: calcTier("budget"), recommended: calcTier("recommended"), premium: calcTier("premium") });
    }, 300);
    return () => clearTimeout(timeout);
  }, [selection, currentProducts, currentAddons, pricingCache.settings, cablingDone, propertyType, requirements, setPricingResults, promoterDiscount, lead.active_offer, evaluatedRules]);

  const activePricing = useMemo(() => {
    const cT = active_checkout_option?.technology ?? selection.technology;
    const cO = active_checkout_option?.option ?? selection.selected_camera_option;
    return calculatePricing({
      selection: { ...selection, technology: cT as "HD" | "IP", selected_camera_option: typeof cO === "number" ? cO : undefined, selected_camera_id: typeof cO === "string" ? cO : undefined },
      products: currentProducts, addons: currentAddons, settings: pricingCache.settings, cablingDone,
      referralDiscountPercent: promoterDiscount?.percent || 0, referralDiscountFlat: promoterDiscount?.flat || 0,
      evaluatedAddonRules: evaluatedRules, activeOffer: lead.active_offer,
    });
  }, [active_checkout_option, selection, currentProducts, currentAddons, pricingCache.settings, cablingDone, promoterDiscount, evaluatedRules, lead.active_offer]);

  const addonsTotal = useMemo(() => {
    if (!activePricing) return 0;
    return activePricing.items
      .filter((item: any) => item.category === "addon")
      .reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
  }, [activePricing]);

  const basePricing = useMemo(() => {
    const cT = selection.technology || "IP";
    const baseOption = typeof active_checkout_option?.option === "number" ? active_checkout_option.option : (selection.selected_camera_option || 2);
    
    return calculatePricing({
      selection: { 
        ...selection, 
        technology: cT as "HD" | "IP", 
        selected_camera_option: baseOption,
        selected_camera_id: undefined,
        selected_recorder_id: undefined,
        selected_storage_id: undefined,
        selected_power_id: undefined,
        selected_addons: []
      },
      products: currentProducts, addons: currentAddons, settings: pricingCache.settings, cablingDone,
      referralDiscountPercent: promoterDiscount?.percent || 0, referralDiscountFlat: promoterDiscount?.flat || 0,
      evaluatedAddonRules: evaluatedRules, activeOffer: lead.active_offer,
    });
  }, [active_checkout_option, selection, currentProducts, currentAddons, pricingCache.settings, cablingDone, promoterDiscount, evaluatedRules, lead.active_offer]);

  const customizationDiff = activePricing.total_payable - basePricing.total_payable;

  const baseOptionNum = typeof active_checkout_option?.option === "number" ? active_checkout_option.option : (selection.selected_camera_option || 2);
  const baseTierName = baseOptionNum === 1 ? "Standard" : baseOptionNum === 3 ? "Elite" : "Professional";

  const isCustomized = typeof active_checkout_option?.option === "string" 
    || !!selection.selected_camera_id 
    || !!selection.selected_recorder_id 
    || !!selection.selected_storage_id 
    || !!selection.selected_power_id 
    || (selection.selected_addons && selection.selected_addons.length > 0);

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
    if (action === "whatsapp") setShowShareDialog(true);
    if (action === "booking") await handleBooking(activeLead);
  };

  const handleSaveQuote = async (currentLead: Lead, status: "accepted" | "draft" = "draft") => {
    if (!activePricing || !pricingCache.settings) return;
    setIsSaving(true);
    const isAccepted = status === "accepted";
    
    trackEvent(isAccepted ? "quote_accepted" : "download_quote", { lead_id: currentLead.id, total_value: activePricing.total_payable });

    try {
      const cT = active_checkout_option?.technology ?? selection.technology;
      const cO = active_checkout_option?.option ?? selection.selected_camera_option;

      const payload = {
        lead_id: currentLead.id,
        selection: {
          lead_id: currentLead.id, plan_type: selection.plan_type || "recommended", technology: cT as "HD" | "IP",
          camera_count: selection.camera_count, picture_quality: selection.picture_quality || "good", recording_days: selection.recording_days,
          selected_addons: selection.selected_addons || [], selected_camera_option: typeof cO === "number" ? cO : undefined,
          selected_camera_id: typeof cO === "string" ? cO : undefined, expected_total_payable: activePricing.total_payable,
          brand_preference: selection.brand_preference, resolution_preference: selection.resolution_preference,
          property_type: selection.property_type, requested_features: selection.requested_features, max_budget: selection.max_budget,
        },
        address: currentLead.address, firebase_uid: currentLead.firebase_uid, status, accepted_at: isAccepted ? new Date().toISOString() : null
      };

      const res = await fetch("/api/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Failed to save quote");
      const resData = await res.json();
      setSavedQuoteId(resData.data.id);
      
      if (isAccepted) toast.success("Quotation Accepted! We will contact you shortly.");
      else toast.success("Detailed Quotation Ready!");

      router.push(`/quote/${currentLead.id}/review/${resData.data.id}`);
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
    trackEvent("book_visit", { lead_id: currentLead.id, pincode: currentLead.address.pincode });
    try {
      const res = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: currentLead.id, address: currentLead.address, quote_id: savedQuoteId || "pending", firebase_uid: currentLead.firebase_uid })
      });
      if (res.ok) toast.success("Visit Booked! Our technician will reach you shortly.");
      else toast.error("Booking failed. Please try again.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!pricing_results.recommended) return <div className="animate-pulse flex space-y-4 flex-col h-96 bg-zinc-200 rounded-xl" />;

  return (
    <div className="flex flex-col gap-12 sm:gap-20 relative">
      
      {/* 3-CARD COMPARISON & SPEC TABLE - APPLE AESTHETIC */}
      <div className="w-full max-w-7xl mx-auto px-4">
        
        {/* Curated Packages Segment */}
        <div className="mb-16">
          <div className="text-center mb-10">
             <h2 className="text-3xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">Curated Packages</h2>
             <p className="text-[15px] text-[#86868b] mt-2">Select a foundation that fits your needs. You can fully customize it later.</p>
          </div>
          
          <CompareCards
            compareOptions={compare_options}
            activeCheckoutOption={active_checkout_option}
            onSelectCheckout={setActiveCheckoutOption}
            selection={selection}
            products={currentProducts}
            addons={currentAddons}
            settings={pricingCache.settings}
            cablingDone={cablingDone}
            recommendation={activeRecommendation}
            customerTechnology={selection.technology}
            promoterDiscount={promoterDiscount}
            evaluatedAddonRules={evaluatedRules}
            activeOffer={lead.active_offer}
          />
        </div>

        {/* Spec Table Segment */}
        <div className="mb-16">
          <div className="text-center mb-8">
             <h3 className="text-2xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">Compare technical specifications.</h3>
          </div>
          
          <SpecCompareTable
            compareOptions={compare_options}
            products={currentProducts}
            selection={selection}
            settings={pricingCache.settings}
            cablingDone={cablingDone}
          />
        </div>
      </div>

      <div className="h-px w-full max-w-4xl mx-auto bg-[#d2d2d7] dark:bg-[#424245]" />

      {/* FULL CUSTOMIZER - "Build Your Own" */}
      <div id="build-your-own" className="w-full max-w-7xl mx-auto px-4 scroll-mt-24">
        <div className="text-center mb-10">
           <h2 className="text-3xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">Build your own system.</h2>
           <p className="text-[15px] text-[#86868b] mt-2">Fine-tune every aspect of your security configuration.</p>
        </div>
        
        <FullCustomizerPanel />
      </div>

      {/* STICKY CHECKOUT BAR (Apple Style) */}
      <SmartContextBar 
        totalPrice={activePricing.total_payable}
        customizationDiff={customizationDiff}
        baseTierName={baseTierName}
        isCustomized={isCustomized}
        onAction={triggerActionWithAddress} 
        isSaving={isSaving} 
      />

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