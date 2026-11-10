"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import { toast } from "sonner";
import { calculatePricing } from "@/lib/pricing-engine";
import { evaluateAddonRules } from "@/lib/addon-rules";
import { getRecommendedOption } from "@/lib/recommendation-engine";
import { CompareCards } from "./CompareCards";
import { SpecCompareTable } from "./SpecCompareTable";
import { DynamicVariantGenerator } from "./DynamicVariantGenerator";
import { CompareTray } from "./CompareTray";
import { Button } from "@/components/ui/button";
import { FullCustomizerPanel } from "./FullCustomizerPanel";
import { InstantQuotationReview } from "./InstantQuotationReview";
import { SmartContextBar } from "./SmartContextBar";
import { BaseQuoteSummary } from "./BaseQuoteSummary";
import { TranslatedText } from "@/components/shared/TranslatedText";
import dynamic from "next/dynamic";
import { Shield, ChevronDown, ChevronRight, CheckCircle2, Sparkles, ArrowLeftRight } from "lucide-react";
import { SiteDetailsModal } from "./SiteDetailsModal";
import { SpecificationChecklistModal } from "./SpecificationChecklistModal";
import { ShareDialog } from "./ShareDialog";
import { CompetitorQuoteUploader, SelectedPackageInfo } from "@/components/shared/CompetitorQuoteUploader";
import { useRealtimeInventory } from "@/hooks/useRealtimeInventory";

import type { Lead, Product, Addon, AddonRule, AppSettings, PricingResult, Address, RecommendationRule, CardLayoutRule } from "@/types";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/components/shared/TrackingProvider";
import { useTranslation } from "@/hooks/useTranslation";

interface ConfiguratorViewProps {
  lead: Lead;
  pricingCache: {
    products: Product[];
    addons: Addon[];
    addon_rules: AddonRule[];
    settings: AppSettings;
    recommendation_rules: RecommendationRule[];
    card_layouts: CardLayoutRule[];
    geoRules?: any[];
  };
  promoterDiscount?: { percent: number; flat: number; };
  customLayoutId?: string | null;
}

export function ConfiguratorView({ lead: initialLead, pricingCache, promoterDiscount, customLayoutId }: ConfiguratorViewProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [lead, setLead] = useState<Lead>(initialLead);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"download" | "whatsapp" | "booking" | "accept" | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [savedPdfUrl, setSavedPdfUrl] = useState<string | null>(null);
  const [showSpecsModal, setShowSpecsModal] = useState(false);

  // Dynamic Compare UX state
  const [selectedCompareItems, setSelectedCompareItems] = useState<PricingResult[]>([]);
  const [viewMode, setViewMode] = useState<"catalog" | "compare" | "addons">("catalog");

  // Price Match
  const [showPriceMatchUploader, setShowPriceMatchUploader] = useState(false);
  const [priceMatchSubmitted, setPriceMatchSubmitted] = useState(false);
  const [isPriceMatchSubmitting, setIsPriceMatchSubmitting] = useState(false);
  const [priceMatchPackage, setPriceMatchPackage] = useState<SelectedPackageInfo | null>(null);
  const [availablePriceMatchPackages, setAvailablePriceMatchPackages] = useState<SelectedPackageInfo[]>([]);



  const { 
    setPricingCache, 
    selection, 
    updateSelection, 
    pricing_results, 
    setPricingResults,
    compare_options,
    active_checkout_option,
    setCompareOptions,
    setActiveCheckoutOption,
    is_compare_mode,
    base_quote_pricing,
    base_tier_name: store_base_tier_name
  } = useConfiguratorStore();

  const [isSaving, setIsSaving] = useState(false);

  const getPackageInfoFromPricing = useCallback((pricing: PricingResult): SelectedPackageInfo => {
    const brand = pricing.camera_device?.brand || "Smart CCTV";
    const resolution = pricing.camera_device?.derivedResolution || (pricing.technology === "Wireless" ? "WiFi HD" : "2MP");
    const tech = pricing.technology === "Wireless" ? "Wireless" : pricing.technology === "IP" ? "IP" : "HD";
    const camCount = selection.camera_count || 4;
    const storageLabel = pricing.is_economy_storage
      ? "Economy Storage"
      : pricing.storage_device?.derivedCapacity
      ? `${pricing.storage_device.derivedCapacity} Storage`
      : "";

    const title = storageLabel
      ? `${camCount}-Camera ${brand} ${resolution} ${tech} Package (${storageLabel})`
      : `${camCount}-Camera ${brand} ${resolution} ${tech} Package`;

    return {
      title,
      price: pricing.total_payable,
      brand,
      resolution,
      cameraCount: camCount,
      technology: pricing.technology
    };
  }, [selection.camera_count]);

  const handleOpenPriceMatch = useCallback((pricing?: PricingResult, allVariants?: PricingResult[]) => {
    if (pricing) {
      setPriceMatchPackage(getPackageInfoFromPricing(pricing));
    } else if (pricing_results.recommended) {
      setPriceMatchPackage(getPackageInfoFromPricing(pricing_results.recommended));
    }

    if (allVariants && allVariants.length > 0) {
      const pkgList = allVariants.map(v => getPackageInfoFromPricing(v));
      const uniqueList = pkgList.filter((pkg, idx, self) => 
        idx === self.findIndex(p => p.title === pkg.title)
      );
      setAvailablePriceMatchPackages(uniqueList);
    } else if (availablePriceMatchPackages.length === 0) {
      const storeVariants = [pricing_results.budget, pricing_results.recommended, pricing_results.premium].filter(Boolean) as PricingResult[];
      if (storeVariants.length > 0) {
        const pkgList = storeVariants.map(v => getPackageInfoFromPricing(v));
        const uniqueList = pkgList.filter((pkg, idx, self) => 
          idx === self.findIndex(p => p.title === pkg.title)
        );
        setAvailablePriceMatchPackages(uniqueList);
      }
    }

    setShowPriceMatchUploader(true);
    setTimeout(() => {
      const el = document.getElementById("price-match-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [getPackageInfoFromPricing, pricing_results, availablePriceMatchPackages.length]);

  // Specification Requirements Checklist is accessible on-demand via the ⚙️ Checklist button

  const handleApplySpecs = (newTags: string[]) => {
    updateSelection({ requested_features: newTags });
    if (typeof window !== "undefined" && lead?.id) {
      sessionStorage.setItem(`specs_seen_${lead.id}`, "true");
    }
  };

  const handleToggleFeatureTag = (tag: string) => {
    const current = selection.requested_features || [];
    const lowerTag = tag.toLowerCase();
    const exists = current.some(t => t.toLowerCase() === lowerTag);
    const updated = exists 
      ? current.filter(t => t.toLowerCase() !== lowerTag)
      : [...current, tag];
    updateSelection({ requested_features: updated });
  };

  // Setup manual scroll restoration to prevent Next.js from aggressively restoring scroll position
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = 'manual';
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      
      return () => {
        window.history.scrollRestoration = 'auto';
      };
    }
  }, []);

  // Compare Tray toggle handler
  const handleToggleCompare = (pricing: PricingResult) => {
    setSelectedCompareItems(prev => {
      const exists = prev.some(p => p.plan_type === pricing.plan_type && p.technology === pricing.technology);
      if (exists) {
        return prev.filter(p => !(p.plan_type === pricing.plan_type && p.technology === pricing.technology));
      }
      if (prev.length >= 3) {
        toast.error("You can compare up to 3 quotes at a time.");
        return prev;
      }
      return [...prev, pricing];
    });
  };

  // Real-Time Inventory Sync
  const { products: liveProducts, addons: liveAddons } = useRealtimeInventory(pricingCache.products, pricingCache.addons);
  const currentProducts = liveProducts.length > 0 ? liveProducts : pricingCache.products;
  const currentAddons = liveAddons.length > 0 ? liveAddons : pricingCache.addons;

  // Initial Setup & State Initialization (Unified to prevent render cascades)
  useEffect(() => {
    const getNum = (v1: any, v2: any, fallback: number) => {
      if (v1 !== undefined && v1 !== null && v1 !== "") { const n = parseInt(String(v1), 10); if (!isNaN(n)) return n; }
      if (v2 !== undefined && v2 !== null && v2 !== "") { const n = parseInt(String(v2), 10); if (!isNaN(n)) return n; }
      return fallback;
    };
    
    const initialCamCount = getNum(lead.wizard_answers?.["camera_count"], lead.wizard_answers?.["q_cam_count"], 4);
    const initialDays = getNum(lead.wizard_answers?.["recording_days"], lead.wizard_answers?.["q_storage"], 15);
    
    const wantsAmcRaw = lead.wizard_answers?.["wants_amc"] ?? lead.wizard_answers?.["q_amc"];
    const wantsAmc = typeof wantsAmcRaw === 'string' ? wantsAmcRaw === 'true' : !!wantsAmcRaw;

    const reqFeaturesRaw = lead.wizard_answers?.["q_special_features"] || lead.wizard_answers?.["q_features"];
    const rawFeaturesArray = Array.isArray(reqFeaturesRaw) ? reqFeaturesRaw : (reqFeaturesRaw ? [reqFeaturesRaw as string] : []);
    
    const envRaw = lead.wizard_answers?.["q_environment"];
    const envArray = Array.isArray(envRaw) ? envRaw : (envRaw ? [envRaw as string] : []);
    
    const formRaw = lead.wizard_answers?.["q_form_factor"];
    const formArray = Array.isArray(formRaw) ? formRaw : (formRaw ? [formRaw as string] : []);

    const combinedRaw = [...rawFeaturesArray, ...envArray, ...formArray];
    
    const requestedFeatures = Array.from(new Set(combinedRaw.map(f => {
      const fl = f.toLowerCase();
      if (fl.includes("night") || fl.includes("color")) return "color";
      if (fl.includes("2-way") || fl.includes("two-way") || fl.includes("two way")) return "2-way";
        if (fl.includes("audio") || fl.includes("mic") || fl.includes("sound")) return "mic";
      if (fl.includes("ptz") || fl.includes("360") || fl.includes("pan") || fl.includes("tilt")) return "ptz";
      if (fl.includes("ultra") || fl.includes("4mp") || fl.includes("5mp") || fl.includes("8mp") || fl.includes("4k")) return "4mp";
      if (fl.includes("stqc")) return "stqc";
      if (fl.includes("indoor") || fl.includes("dome")) return "dome";
      if (fl.includes("outdoor") || fl.includes("bullet")) return "bullet";
      return "";
    }).filter(f => f !== "")));

    const surfaceRaw = lead.wizard_answers?.["q_surface"];
    const surfaceTypes = Array.isArray(surfaceRaw) ? surfaceRaw : (surfaceRaw ? [surfaceRaw as string] : []);

    const generalAddonsRaw = lead.wizard_answers?.["q_general_addons"];
    const rawAddonsArray = Array.isArray(generalAddonsRaw) ? generalAddonsRaw : (generalAddonsRaw ? [generalAddonsRaw as string] : []);
    const selectedAddons = rawAddonsArray.filter(a => a !== "none").map(a => `addon_${a}`);

    let mappedBrand = (lead.wizard_answers?.["q_brand"] as string) || "all";
    if (mappedBrand === "recommend" || mappedBrand === "unsure") mappedBrand = "all";
    if (mappedBrand === "cpplus") mappedBrand = "CP-Plus";

    const mixedReqs = (lead.wizard_answers?.["mixed_camera_requirements"] as any[]) || undefined;

    // Normalize "Analog" to "HD"
    const rawTech = (lead.wizard_answers?.["q_tech"] as string) || lead.technology_choice || "HD";
    const wifiCountVal = Number(lead.wizard_answers?.["wifi_camera_count"]) || 0;
    const outdoorCountVal = Number(lead.wizard_answers?.["outdoor_camera_count"]) || 0;
    const indoorCountVal = Number(lead.wizard_answers?.["indoor_camera_count"]) || 0;
    const totalSplitCount = outdoorCountVal + indoorCountVal;
    const wiredCountVal = totalSplitCount > wifiCountVal ? (totalSplitCount - wifiCountVal) : 0;
    const isHybridSetup = (wifiCountVal > 0 && wiredCountVal > 0) || String(rawTech).toLowerCase() === "hybrid";

    const normalizedTech: "HD" | "IP" | "Wireless" = 
      isHybridSetup ? (String(rawTech).toLowerCase().includes("ip") ? "IP" : "HD")
      : (rawTech === "Analog" || rawTech === "analog" || rawTech === "HD" || rawTech === "hd") ? "HD"
      : (rawTech === "WiFi" || rawTech === "wifi" || rawTech === "Wireless" || rawTech === "wireless") ? "Wireless"
      : "IP";

    const initialSelection = {
      ...selection,
      technology: isHybridSetup ? "hybrid" : normalizedTech,
      hybrid_wired_technology: (String(rawTech).toLowerCase().includes("ip") ? "IP" : "HD") as "HD" | "IP",
      is_hybrid: isHybridSetup,
      camera_count: initialCamCount,
      indoor_camera_count: lead.wizard_answers?.["indoor_camera_count"] !== undefined ? Number(lead.wizard_answers["indoor_camera_count"]) : undefined,
      outdoor_camera_count: lead.wizard_answers?.["outdoor_camera_count"] !== undefined ? Number(lead.wizard_answers["outdoor_camera_count"]) : undefined,
      wifi_camera_count: lead.wizard_answers?.["wifi_camera_count"] !== undefined ? Number(lead.wizard_answers["wifi_camera_count"]) : undefined,
      wifi_indoor_count: lead.wizard_answers?.["wifi_indoor_count"] !== undefined ? Number(lead.wizard_answers["wifi_indoor_count"]) : undefined,
      wifi_outdoor_count: lead.wizard_answers?.["wifi_outdoor_count"] !== undefined ? Number(lead.wizard_answers["wifi_outdoor_count"]) : undefined,
      wifi_indoor_ptz_count: lead.wizard_answers?.["wifi_indoor_ptz_count"] !== undefined ? Number(lead.wizard_answers["wifi_indoor_ptz_count"]) : undefined,
      wifi_indoor_fixed_count: lead.wizard_answers?.["wifi_indoor_fixed_count"] !== undefined ? Number(lead.wizard_answers["wifi_indoor_fixed_count"]) : undefined,
      wifi_outdoor_bullet_count: lead.wizard_answers?.["wifi_outdoor_bullet_count"] !== undefined ? Number(lead.wizard_answers["wifi_outdoor_bullet_count"]) : undefined,
      wifi_outdoor_ptz_count: lead.wizard_answers?.["wifi_outdoor_ptz_count"] !== undefined ? Number(lead.wizard_answers["wifi_outdoor_ptz_count"]) : undefined,
      wifi_4g_count: lead.wizard_answers?.["wifi_4g_count"] !== undefined ? Number(lead.wizard_answers["wifi_4g_count"]) : undefined,
      is_4g: !!lead.wizard_answers?.["is_4g"] || !!lead.wizard_answers?.["has_4g_sim"] || lead.wizard_answers?.["broadband_status"] === "independent_4g",
      mixed_camera_requirements: mixedReqs,
      recording_days: initialDays,
      recording_mode: ((lead.wizard_answers?.["recording_mode"] as string) || (lead.wizard_answers?.["q_recording_mode"] as string) || "motion") as "continuous" | "motion" | "smart",
      ceiling_height: (lead.wizard_answers?.["q_height"] as any) || "standard",
      wants_amc: wantsAmc,
      requested_features: requestedFeatures,
      surface_types: surfaceTypes,
      selected_addons: selectedAddons,
      brand_preference: mappedBrand,
      installation_timeline: (lead.timeline as string) || (lead.wizard_answers?.["q_timeline"] as string) || (lead.wizard_answers?.["timeline"] as string) || (lead.wizard_answers?.["installation_timeline"] as string) || "asap",
      property_type: lead.property_type,
      lead_pincode: lead.address?.pincode || (lead.wizard_answers?.lead_pincode as string) || "",
      wants_remote_viewing: lead.wizard_answers?.["q_remote_viewing"] === "yes",
      power_wiring_option: (lead.wizard_answers?.["power_wiring_option"] as any) || "socket_available",
      power_cable_meters: typeof lead.wizard_answers?.["power_cable_meters"] === "number" ? lead.wizard_answers["power_cable_meters"] : undefined,
      total_power_cable_meters: typeof lead.wizard_answers?.["total_power_cable_meters"] === "number" ? lead.wizard_answers["total_power_cable_meters"] : undefined,
      total_cable_length_meters: typeof lead.wizard_answers?.["total_cable_length_meters"] === "number" ? lead.wizard_answers["total_cable_length_meters"] : undefined,
      cable_length_meters: typeof lead.wizard_answers?.["cable_length_meters"] === "number" ? lead.wizard_answers["cable_length_meters"] : undefined,
      broadband_status: (() => {
        const raw = lead.wizard_answers?.["broadband_status"] || lead.wizard_answers?.["q_broadband"] || (lead as any).broadband_status;
        if (raw === "wifi_extender" || raw === "sim_router" || raw === "independent_4g" || raw === "no") {
          return raw;
        }
        return "yes";
      })(),
    };

    // Calculate Recommendation Synchronously
    const recommendation = getRecommendedOption(pricingCache.recommendation_rules, initialSelection as any, lead.property_type);
    if (recommendation) {
      initialSelection.selected_camera_option = recommendation.camera_option;
    }

    // Determine Dynamic Cards
    const dynamicCards: Array<{technology: "HD" | "IP" | "Wireless"; option: number}> = [
      { technology: normalizedTech, option: 1 },
      { technology: normalizedTech, option: 2 },
      { technology: normalizedTech, option: 3 }
    ];
    
    const recCard = dynamicCards.find(c => c.technology === normalizedTech && c.option === recommendation?.camera_option) || dynamicCards[1];

    // Batch update Zustand store in one pass
    setPricingCache({
      ...pricingCache,
      products: currentProducts,
      addons: currentAddons
    });
    updateSelection(initialSelection);
    setCompareOptions(dynamicCards);
    setActiveCheckoutOption({ technology: recCard.technology, option: recCard.option });

    trackEvent("view_quote", { lead_id: lead.id, property_type: lead.property_type, technology: lead.technology_choice });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProducts, currentAddons]);

  const cablingDone = selection.cabling_done !== undefined ? Boolean(selection.cabling_done) : Boolean(lead.cabling_done);
  const propertyType = lead.property_type;
  
  const cablingMeters = useMemo(() => {
    if (cablingDone) return 0;
    
    // We must pass PER CAMERA meters because calculateCabling multiplies by camera_count
    const totalMeters = selection.total_cable_length_meters || lead.wizard_answers?.total_cable_length_meters;
    if (typeof totalMeters === "number" && totalMeters > 0) {
      const wiredCount = (Number(selection.outdoor_camera_count) || 0) + (Number(selection.indoor_camera_count) || 0);
      const effectiveWiredCount = wiredCount > 0 ? wiredCount : (selection.camera_count || 4);
      return totalMeters / effectiveWiredCount;
    }
    
    const perCamMeters = selection.cable_length_meters || lead.wizard_answers?.cable_length_meters;
    if (typeof perCamMeters === "number" && perCamMeters > 0) return perCamMeters;
    
    return 15; // default 15m per camera
  }, [cablingDone, selection.total_cable_length_meters, selection.cable_length_meters, lead.wizard_answers, selection.camera_count]);
  
  const requirements = useMemo(() => {
    const reqValues = lead.wizard_answers?.["q_special_features"] || lead.wizard_answers?.["q_features"];
    return Array.isArray(reqValues) ? reqValues : (reqValues ? [reqValues] : []);
  }, [lead.wizard_answers]);

  const activeRecommendation = useMemo(() => {
    return getRecommendedOption(pricingCache.recommendation_rules, selection as any, lead.property_type);
  }, [pricingCache.recommendation_rules, selection, lead.property_type]);

  const evaluatedRules = useMemo(() => evaluateAddonRules(
    pricingCache.addon_rules, selection, cablingDone, propertyType, requirements
  ), [pricingCache.addon_rules, selection, cablingDone, propertyType, requirements]);

  useEffect(() => {
    if (!pricingCache.settings) return;
    
    const calcTier = (type: "budget" | "recommended" | "premium"): PricingResult => {
      const variation = { ...selection, plan_type: type };
      if (type === "budget") variation.picture_quality = "good";
      if (type === "premium") variation.picture_quality = "crystal_clear";
      
      return calculatePricing({
        selection: variation, products: currentProducts, addons: currentAddons,
        settings: pricingCache.settings, cablingDone, cablingMeters, referralDiscountPercent: promoterDiscount?.percent || 0,
        referralDiscountFlat: promoterDiscount?.flat || 0, evaluatedAddonRules: evaluatedRules, activeOffer: lead.active_offer, geoRules: pricingCache.geoRules, locationParams: { pincode: (lead.address?.pincode || lead.wizard_answers?.lead_pincode || lead.wizard_answers?.pincode) as string | undefined } });
    };
    
    setPricingResults({ budget: calcTier("budget"), recommended: calcTier("recommended"), premium: calcTier("premium") });
  }, [selection, currentProducts, currentAddons, pricingCache.settings, cablingDone, cablingMeters, propertyType, requirements, setPricingResults, promoterDiscount, lead.active_offer, evaluatedRules]);

  const activePricing = useMemo(() => {
    const cT = active_checkout_option?.technology ?? selection.technology;
    const cO = active_checkout_option?.option ?? selection.selected_camera_option;
    const isCameraSku = typeof cO === "string" && !["budget", "recommended", "premium"].includes(cO);
    return calculatePricing({
      selection: { 
        ...selection, 
        technology: (cT === "Wireless" || cT === "wireless" || cT === "WIFI" || cT === "WiFi") ? "Wireless" : (cT as "HD" | "IP"), 
        plan_type: (typeof cO === "string" && ["budget", "recommended", "premium"].includes(cO)) ? (cO as any) : selection.plan_type,
        selected_camera_option: typeof cO === "number" ? cO : undefined, 
        selected_camera_id: selection.selected_camera_id || (isCameraSku ? cO : undefined),
        recording_days: active_checkout_option?.storage_days ?? selection.recording_days
      },
      products: currentProducts, addons: currentAddons, settings: pricingCache.settings, cablingDone, cablingMeters,
      referralDiscountPercent: promoterDiscount?.percent || 0, referralDiscountFlat: promoterDiscount?.flat || 0,
      evaluatedAddonRules: evaluatedRules, activeOffer: lead.active_offer, geoRules: pricingCache.geoRules, locationParams: { pincode: (lead.address?.pincode || lead.wizard_answers?.lead_pincode || lead.wizard_answers?.pincode) as string | undefined } });
  }, [active_checkout_option, selection, currentProducts, currentAddons, pricingCache.settings, cablingDone, cablingMeters, promoterDiscount, evaluatedRules, lead.active_offer]);

  const addonsTotal = useMemo(() => {
    if (!activePricing) return 0;
    return activePricing.items
      .filter((item: any) => item.category === "addon")
      .reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
  }, [activePricing]);

  const basePricing = useMemo(() => {
    if (is_compare_mode && base_quote_pricing) return base_quote_pricing;
    const cT = selection.technology || "IP";
    const baseOption = typeof active_checkout_option?.option === "number" ? active_checkout_option.option : (selection.selected_camera_option || 2);
    
    return calculatePricing({
      selection: { 
        ...selection, 
        technology: (cT === "Wireless" || cT === "wireless" || cT === "WIFI" || cT === "WiFi") ? "Wireless" : (cT as "HD" | "IP"), 
        selected_camera_option: baseOption,
        selected_camera_id: undefined,
        selected_recorder_id: undefined,
        selected_storage_id: undefined,
        selected_power_id: undefined,
        selected_addons: []
      },
      products: currentProducts, addons: currentAddons, settings: pricingCache.settings, cablingDone, cablingMeters,
      referralDiscountPercent: promoterDiscount?.percent || 0, referralDiscountFlat: promoterDiscount?.flat || 0,
      evaluatedAddonRules: evaluatedRules, activeOffer: lead.active_offer, geoRules: pricingCache.geoRules, locationParams: { pincode: (lead.address?.pincode || lead.wizard_answers?.lead_pincode || lead.wizard_answers?.pincode) as string | undefined } });
  }, [active_checkout_option, selection, currentProducts, currentAddons, pricingCache.settings, cablingDone, promoterDiscount, evaluatedRules, lead.active_offer, is_compare_mode, base_quote_pricing]);

  const customizationDiff = activePricing.total_payable - basePricing.total_payable;

  const baseOptionNum = typeof active_checkout_option?.option === "number" ? active_checkout_option.option : (selection.selected_camera_option || 2);
  const baseTierName = (is_compare_mode && store_base_tier_name) ? store_base_tier_name : (activePricing.camera_device?.brand ? `${activePricing.camera_device.brand} Package` : "Selected Package");

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

      const isWireless = (cT === "Wireless" || cT === "wireless" || cT === "WIFI" || cT === "WiFi");
      const normalizedTech: "HD" | "IP" | "Wireless" = isWireless ? "Wireless" : (cT as "HD" | "IP");
      const effectivePlanType = (typeof cO === "string" && ["budget", "recommended", "premium"].includes(cO))
        ? (cO as any)
        : (selection.plan_type || "recommended");
      const effectiveDays = active_checkout_option?.storage_days ?? selection.recording_days;
      const effectivePincode = selection.lead_pincode || currentLead.address?.pincode || (currentLead.wizard_answers?.lead_pincode as string) || (currentLead.wizard_answers?.customer_pincode as string) || (currentLead.wizard_answers?.pincode as string) || "";

      // Extract resolved mixed camera IDs from activePricing if present
      const resolvedMixedIds: Record<string, string> = { ...(selection.selected_mixed_camera_ids || {}) };
      if (activePricing.items && selection.mixed_camera_requirements) {
        for (const req of selection.mixed_camera_requirements) {
          if (!resolvedMixedIds[req.type]) {
            const foundItem = activePricing.items.find((i: any) => i.display_name?.startsWith(`${req.type}:`));
            if (foundItem?.product_id) {
              resolvedMixedIds[req.type] = foundItem.product_id;
            }
          }
        }
      }

      let effectiveQuality = selection.picture_quality || "good";
      let effectiveResPref = selection.resolution_preference;
      if (effectivePlanType === "budget" || cO === 1) {
        effectiveQuality = "good";
        effectiveResPref = "2MP";
      } else if (effectivePlanType === "premium" || cO === 3) {
        effectiveQuality = "crystal_clear";
        effectiveResPref = undefined;
      }

      const payload = {
        lead_id: currentLead.id,
        selection: {
          ...selection,
          lead_id: currentLead.id,
          plan_type: effectivePlanType,
          technology: normalizedTech,
          camera_count: selection.camera_count,
          indoor_camera_count: selection.indoor_camera_count ?? (lead.wizard_answers?.indoor_camera_count !== undefined ? Number(lead.wizard_answers.indoor_camera_count) : undefined),
          outdoor_camera_count: selection.outdoor_camera_count ?? (lead.wizard_answers?.outdoor_camera_count !== undefined ? Number(lead.wizard_answers.outdoor_camera_count) : undefined),
          mixed_camera_requirements: selection.mixed_camera_requirements,
          selected_mixed_camera_ids: Object.keys(resolvedMixedIds).length > 0 ? resolvedMixedIds : undefined,
          picture_quality: effectiveQuality,
          recording_days: effectiveDays,
          selected_addons: selection.selected_addons || [],
          selected_camera_option: typeof cO === "number" ? cO : undefined,
          selected_camera_id: selection.selected_camera_id || (typeof cO === "string" && !["budget", "recommended", "premium"].includes(cO) ? cO : undefined) || activePricing.camera_device?.id,
          selected_recorder_id: selection.selected_recorder_id || activePricing.recorder_device?.id,
          selected_storage_id: selection.selected_storage_id || activePricing.storage_device?.id,
          selected_power_id: selection.selected_power_id || activePricing.power_device?.id,
          expected_total_payable: activePricing.total_payable,
          brand_preference: selection.brand_preference,
          resolution_preference: effectiveResPref,
          property_type: selection.property_type,
          requested_features: selection.requested_features,
          max_budget: selection.max_budget,
          cable_length_meters: selection.cable_length_meters || lead.wizard_answers?.cable_length_meters,
          total_cable_length_meters: selection.total_cable_length_meters || lead.wizard_answers?.total_cable_length_meters,
          wifi_camera_count: selection.wifi_camera_count ?? (typeof lead.wizard_answers?.["wifi_camera_count"] === "number" ? lead.wizard_answers["wifi_camera_count"] : undefined),
          power_wiring_option: selection.power_wiring_option || (lead.wizard_answers?.["power_wiring_option"] as any) || "socket_available",
          power_cable_meters: selection.power_cable_meters ?? (typeof lead.wizard_answers?.["power_cable_meters"] === "number" ? lead.wizard_answers["power_cable_meters"] : undefined),
          total_power_cable_meters: selection.total_power_cable_meters ?? (typeof lead.wizard_answers?.["total_power_cable_meters"] === "number" ? lead.wizard_answers["total_power_cable_meters"] : undefined),
          broadband_status: selection.broadband_status || (lead.wizard_answers?.["broadband_status"] as any) || (lead.wizard_answers?.["q_broadband"] as any) || "yes",
          lead_pincode: effectivePincode,
        },
        address: currentLead.address,
        firebase_uid: currentLead.firebase_uid,
        status,
        accepted_at: isAccepted ? new Date().toISOString() : null
      };

      const res = await fetch("/api/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error("Quote save failed:", errorData);
        const errMsg = errorData?.error?.message 
          || errorData?.message 
          || (typeof errorData?.error === "string" ? errorData.error : null) 
          || "Failed to save quote";
        throw new Error(errMsg);
      }
      const resData = await res.json();
      setSavedQuoteId(resData.data.id);
      
      if (isAccepted) toast.success("Quotation Accepted! We will contact you shortly.");
      else toast.success("Detailed Quotation Ready!");

      router.push(`/quote/${currentLead.id}/review/${resData.data.id}`);
    } catch (err: any) {
      console.error(err);
      const msg = typeof err?.message === "string" && err.message !== "[object Object]"
        ? err.message
        : "Error saving your quote. Please try again.";
      toast.error(msg);
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

  const handleSelectPackageAndReview = (pricing: any) => {
    const camItem = pricing.items?.find((i: any) => currentProducts.find(p => p.id === i.product_id)?.category === "cctv_camera");
    const recItem = pricing.items?.find((i: any) => currentProducts.find(p => p.id === i.product_id)?.category === "recorder");
    const strItem = pricing.items?.find((i: any) => currentProducts.find(p => p.id === i.product_id)?.category === "storage");

    const rawTech = String(pricing.hybridWiredTech || pricing.technology || selection.technology || "HD");
    const tech: "HD" | "IP" | "Wireless" = 
      (rawTech.toLowerCase() === "wireless" || rawTech.toLowerCase() === "wifi") ? "Wireless" : 
      (rawTech.toUpperCase() === "IP" ? "IP" : "HD");

    const mixedReqs = pricing.mixed_camera_requirements || selection.mixed_camera_requirements;
    const totalCams = mixedReqs && mixedReqs.length > 0
      ? mixedReqs.reduce((sum: number, r: any) => sum + (Number(r.count) || 0), 0)
      : (pricing.camera_count || selection.camera_count || 4);

    // 1. Lock selected package configuration into store
    setActiveCheckoutOption({ technology: tech, option: pricing.plan_type, storage_days: pricing.storage_days });
    updateSelection({
      selected_camera_id: undefined,
      selected_recorder_id: undefined,
      selected_power_id: undefined,
      selected_storage_id: undefined,
      technology: (pricing.hybridWiredTech || pricing.technology === "Hybrid" || (pricing as any).is_hybrid || selection.is_hybrid) ? "hybrid" : tech,
      hybrid_wired_technology: ((pricing as any).hybridWiredTech || (tech === "IP" ? "IP" : "HD")) as "HD" | "IP",
      is_hybrid: Boolean((pricing as any).hybridWiredTech || pricing.technology === "Hybrid" || (pricing as any).is_hybrid || selection.is_hybrid),
      plan_type: pricing.plan_type,
      camera_count: totalCams,
      brand_preference: pricing.camera_device?.brand || selection.brand_preference,
      resolution_preference: pricing.mixed_camera_requirements?.[0]?.resolution || selection.resolution_preference,
      mixed_camera_requirements: mixedReqs,
      recording_days: pricing.storage_days,
    });

    // 2. Open Instant Quotation Review & Add-ons view
    setViewMode("addons");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Compute feature tags that are supported by active products in the selected technology
  const availableFeatureTags = useMemo(() => {
    const selTech = String(selection.technology || "").toUpperCase();
    const isWireless = selTech === "WIRELESS" || selTech === "WIFI";
    const isIp = selTech === "IP";

    const matchingCameras = currentProducts.filter(p => {
      if (p.category !== "cctv_camera") return false;
      const pTech = (p.technology || "").toUpperCase();
      const pTechs = (p.technologies || []).map((t: string) => t.toUpperCase());
      const isMatch = isWireless
        ? (pTech === "WIRELESS" || pTech === "WIFI" || pTechs.includes("WIRELESS") || pTechs.includes("WIFI") || !!p.has_wifi || !!p.has_4g_sim)
        : isIp
        ? (pTech === "IP" || pTechs.includes("IP"))
        : (pTech === "HD" || pTechs.includes("HD"));
      return isMatch;
    });

    const tags: string[] = ["outdoor"]; // Weatherproof is standard on all outdoor cameras
    if (matchingCameras.some(p => p.has_color || p.has_colorvu || JSON.stringify(p).toLowerCase().includes("color"))) tags.push("color");
    if (matchingCameras.some(p => p.has_mic || p.has_audio || JSON.stringify(p).toLowerCase().includes("mic") || JSON.stringify(p).toLowerCase().includes("audio"))) tags.push("mic");
    if (matchingCameras.some(p => p.has_two_way || p.has_speaker || JSON.stringify(p).toLowerCase().includes("two-way") || JSON.stringify(p).toLowerCase().includes("2-way"))) tags.push("2-way");
    if (matchingCameras.some(p => p.has_ptz || JSON.stringify(p).toLowerCase().includes("ptz") || JSON.stringify(p).toLowerCase().includes("pan-tilt") || JSON.stringify(p).toLowerCase().includes("360"))) tags.push("ptz");
    return tags;
  }, [currentProducts, selection.technology]);

    if (!pricing_results.recommended) return <div className="animate-pulse flex space-y-4 flex-col h-96 bg-zinc-200 rounded-xl" />;

  return (
    <div className={`flex flex-col relative pb-28 ${viewMode === 'addons' ? 'gap-2 sm:gap-4' : 'gap-5 sm:gap-14'}`}>
      
      {/* DYNAMIC CATALOG VARIATIONS & SPEC TABLE - APPLE AESTHETIC */}
      {viewMode !== 'addons' && (
        <div className="w-full max-w-7xl mx-auto px-4">
        
        {/* Dynamic Generator vs Compare Mode */}
        {viewMode === 'catalog' && (
          <div className="mb-8 sm:mb-16">
            <div className="text-center mb-4 sm:mb-8">
              <h2 className="text-xl sm:text-3xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">{t("wz_build_your_quotation")}</h2>
              <p className="text-xs sm:text-[15px] text-[#86868b] mt-1 sm:mt-2">{t("wz_select_your_preferred_technolo")}</p>
            </div>
            <DynamicVariantGenerator
              products={currentProducts}
              addons={currentAddons}
              settings={pricingCache.settings}
              selection={selection}
              cablingDone={cablingDone}
              cablingMeters={cablingMeters}
              promoterDiscount={promoterDiscount}
              evaluatedAddonRules={evaluatedRules}
              activeOffer={lead.active_offer}
              onSelectCheckout={handleSelectPackageAndReview}
              onToggleCompare={handleToggleCompare}
              selectedCompareItems={selectedCompareItems}
              onPriceMatch={handleOpenPriceMatch}
              onOpenSpecsModal={() => setShowSpecsModal(true)}
              onToggleFeatureTag={handleToggleFeatureTag}
            />
            <CompareTray
              selectedItems={selectedCompareItems}
              onRemove={(pricing) => handleToggleCompare(pricing)}
              onCompareNow={() => {
                setViewMode("compare");
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {viewMode === 'compare' && (
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">{t("wz_quote_comparison")}</h2>
                <p className="text-[15px] text-[#86868b] mt-1">{t("wz_comparing")} {selectedCompareItems.length}  {t("wz_selected_variants_side_by_side")}</p>
              </div>
              <Button variant="outline" onClick={() => setViewMode('catalog')} className="rounded-full">
                <ArrowLeftRight className="w-4 h-4 mr-2" />  {t("wz_back_to_generator")}
                                            </Button>
            </div>
            
            {/* Reuse existing CompareCards with the compare_options format it expects */}
            <CompareCards
              compareOptions={selectedCompareItems.map(p => ({ technology: p.technology as string, option: p.plan_type }))}
              activeCheckoutOption={active_checkout_option}
              onSelectCheckout={(option) => {
                const matched = selectedCompareItems.find(p => p.technology === option.technology && p.plan_type === option.option);
                if (matched) {
                  handleSelectPackageAndReview(matched);
                } else {
                  handleSaveQuote(lead, "draft");
                }
              }}
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
              leadId={lead.id}
              customerName={lead.customer_name}
              customerPhone={lead.mobile_number}
            />

            <div className="mb-20 hidden md:block border-t border-[#f5f5f7] dark:border-[#2d2d2f] pt-16 mt-16">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">{t("wz_compare_camera_details")}</h3>
              </div>
              <SpecCompareTable
                compareOptions={selectedCompareItems.map(p => ({ technology: p.technology as string, option: p.plan_type }))}
                products={currentProducts}
                selection={selection}
                settings={pricingCache.settings}
                cablingDone={cablingDone}
              />
            </div>
          </div>
        )}

        {/* PRICE MATCH — Subtle inline link (Only in catalog view) */}
        {viewMode === 'catalog' && (
          <div id="price-match-section" className="mb-16 scroll-mt-24">
            {priceMatchSubmitted ? (
              <div className="max-w-xl mx-auto rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 md:p-8 sm:p-12 text-center shadow-sm animate-in fade-in zoom-in-95 duration-500">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">{t("wz_quote_received")}</h4>
                <p className="text-[15px] text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                  {t("wz_weaposve_received_your_quote_o")}
                </p>
              </div>
            ) : showPriceMatchUploader ? (
              <div className="max-w-xl mx-auto animate-in slide-in-from-top-4 fade-in duration-400">
                <CompetitorQuoteUploader
                  leadId={lead.id!}
                  customerName={lead.customer_name}
                  selectedPackage={priceMatchPackage}
                  availablePackages={availablePriceMatchPackages}
                  onSelectPackage={(pkg) => setPriceMatchPackage(pkg)}
                  onSubmit={async (data) => {
                    setIsPriceMatchSubmitting(true);
                    try {
                      const res = await fetch(`/api/leads/${lead.id}/price-match`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                      });
                      if (!res.ok) throw new Error("Failed to submit price match");
                      setPriceMatchSubmitted(true);
                      setShowPriceMatchUploader(false);
                    } catch (err) {
                      console.error(err);
                      throw err;
                    } finally {
                      setIsPriceMatchSubmitting(false);
                    }
                  }}
                  onCancel={() => setShowPriceMatchUploader(false)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
                  {t("wz_already_have_a_quote_from_anot")}
                </span>
                <button
                  onClick={() => handleOpenPriceMatch()}
                  className="group inline-flex items-center gap-1 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                >
                  {t("wz_upload_it_for_a_guaranteed_bes")}
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* FULL INSTANT QUOTATION REVIEW & ADD-ONS */}
      {viewMode === 'addons' && (
        <div id="quotation-review" className="w-full scroll-mt-24">
          <InstantQuotationReview
            lead={lead}
            activePricing={activePricing}
            products={currentProducts}
            addons={currentAddons}
            settings={pricingCache.settings}
            onBack={() => {
              setViewMode('catalog');
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            onProceedToActualQuotation={() => handleSaveQuote(lead, "draft")}
            isSaving={isSaving}
            onDownloadPdf={() => triggerActionWithAddress("download")}
            onShareWhatsApp={() => triggerActionWithAddress("whatsapp")}
          />
        </div>
      )}

      {/* STICKY CHECKOUT BAR (Apple Style) */}
      {viewMode === 'addons' && (
        <SmartContextBar 
          totalPrice={activePricing.total_payable}
          customizationDiff={customizationDiff}
          baseTierName={baseTierName}
          isCustomized={isCustomized}
          onAction={triggerActionWithAddress} 
          onProceedToFinalQuote={() => handleSaveQuote(lead, "draft")}
          isSaving={isSaving} 
          lead={lead}
          quote={activePricing}
          settings={pricingCache.settings}
        />
      )}

      {showAddressModal && (
        <SiteDetailsModal 
          initialPincode={lead.address?.pincode || (lead.wizard_answers?.lead_pincode as string) || ""}
          onConfirm={handleAddressConfirm}
          onClose={() => setShowAddressModal(false)}
        />
      )}

      <SpecificationChecklistModal
        isOpen={showSpecsModal}
        onClose={() => setShowSpecsModal(false)}
        onApply={handleApplySpecs}
        currentTags={selection.requested_features || []}
        outdoorCount={selection.outdoor_camera_count}
        indoorCount={selection.indoor_camera_count}
        wifiCount={selection.wifi_camera_count}
        availableFeatureTags={availableFeatureTags}
      />

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
          contactPhone={"+91 73576 12865"}
          onClose={() => setShowShareDialog(false)}
        />
      )}

          </div>
  );
}
