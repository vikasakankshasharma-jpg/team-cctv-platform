"use client";

import { useEffect, useState, useMemo } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import { PlanCard } from "./PlanCard";
import { calculatePricing } from "@/lib/pricing-engine";
import { evaluateAddonRules } from "@/lib/addon-rules";
import { SlidersHorizontal, Share2, Download, Calendar, ArrowRight, ShieldCheck, Zap, Info, Check } from "lucide-react";
import { SiteDetailsModal } from "./SiteDetailsModal";
import type { Lead, Product, Addon, AddonRule, AppSettings, PricingResult, Address } from "@/types";
import { useRouter } from "next/navigation";

interface ConfiguratorViewProps {
  lead: Lead;
  pricingCache: {
    products: Product[];
    addons: Addon[];
    addon_rules: AddonRule[];
    settings: AppSettings;
  };
}

const QUALITY_TIERS: ("good" | "very_clear" | "crystal_clear")[] = ["good", "very_clear", "crystal_clear"];
const STORAGE_TIERS: (7 | 15 | 30)[] = [7, 15, 30];

export function ConfiguratorView({ lead: initialLead, pricingCache }: ConfiguratorViewProps) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead>(initialLead);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"download" | "whatsapp" | "booking" | null>(null);

  const { 
    setPricingCache, 
    selection, 
    updateSelection, 
    pricing_results, 
    setPricingResults,
    toggleAddon
  } = useConfiguratorStore();

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setPricingCache(pricingCache);
    updateSelection({
      technology: lead.technology_choice || "HD"
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cablingDone = lead.cabling_done;
  const propertyType = lead.property_type;
  
  const requirements = useMemo(() => {
    const reqValues = lead.wizard_answers["q_features"];
    return Array.isArray(reqValues) ? reqValues : (reqValues ? [reqValues] : []);
  }, [lead.wizard_answers]);

  useEffect(() => {
    if (!pricingCache.settings) return;

    const evaluatedRules = evaluateAddonRules(
      pricingCache.addon_rules,
      selection,
      cablingDone,
      propertyType,
      requirements
    );

    const calcTier = (type: "budget" | "recommended" | "premium"): PricingResult => {
      const variation = { ...selection, plan_type: type };
      
      const currentQualityIdx = QUALITY_TIERS.indexOf(selection.picture_quality);
      const currentStorageIdx = STORAGE_TIERS.indexOf(selection.recording_days);

      if (type === "budget") {
        variation.picture_quality = QUALITY_TIERS[Math.max(0, currentQualityIdx - 1)];
        variation.recording_days = STORAGE_TIERS[Math.max(0, currentStorageIdx - 1)];
      } else if (type === "premium") {
        variation.picture_quality = QUALITY_TIERS[Math.min(QUALITY_TIERS.length - 1, currentQualityIdx + 1)];
        variation.recording_days = STORAGE_TIERS[Math.min(STORAGE_TIERS.length - 1, currentStorageIdx + 1)];
      }

      return calculatePricing({
        selection: variation,
        products: pricingCache.products,
        addons: pricingCache.addons,
        settings: pricingCache.settings,
        cablingDone,
        referralDiscountPercent: 0, 
        evaluatedAddonRules: evaluatedRules
      });
    };

    setPricingResults({
      budget: calcTier("budget"),
      recommended: calcTier("recommended"),
      premium: calcTier("premium"),
    });
    
  }, [selection, pricingCache, cablingDone, propertyType, requirements, setPricingResults]);

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
    setSaveSuccess(false);

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
      setSaveSuccess(true);
      
      const pdfRes = await fetch(`/api/quotes/${generatedQuoteId}/pdf?leadId=${currentLead.id}`);
      if (pdfRes.ok) {
         const contentType = pdfRes.headers.get("Content-Type");
         if (contentType === "application/pdf") {
            const blob = await pdfRes.blob();
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, "_blank");
         } else {
            const { url } = await pdfRes.json();
            if (url) window.open(url, "_blank");
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
          quote_id: "mock-quote-id"
        })
      });
      if (res.ok) alert("✅ Visit Booked! Our technician will reach you shortly at your pinpoint location.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWhatsappShare = (currentLead: Lead) => {
    const res = pricing_results.recommended!;
    const addr = currentLead.address;
    const message = `*📄 TEAM CCTV - Site Visit & Quote*\n--------------------------\n*Hi ${currentLead.customer_name},*\n\nHere is your tailored setup details:\n\n📍 *Site Address:* ${addr?.pincode}, ${addr?.landmark1}\n🎯 *Pinpoint:* ${addr?.coordinates.lat.toFixed(4)}, ${addr?.coordinates.lng.toFixed(4)}\n🎥 *Cameras:* ${selection.camera_count}x (${selection.picture_quality.toUpperCase()})\n\n*💰 TOTAL ESTIMATE:* *₹${res.total_payable.toLocaleString()}*\n\n--------------------------\n*View Full Details:* ${window.location.href}\n--------------------------`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/91${currentLead.mobile_number}?text=${encoded}`, "_blank");
  };

  if (!pricing_results.recommended) return <div className="animate-pulse flex space-y-4 flex-col h-96 bg-zinc-200 rounded-xl" />;

  return (
    <div className="flex flex-col gap-16 relative">
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50/20 blur-[150px] -z-10 rounded-full" />

      {/* Premium Tech Toggle Group */}
      <div className="flex flex-col items-center gap-6">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-white font-black px-4 py-1.5 rounded-full text-[9px] uppercase tracking-widest leading-none">
           <Zap className="w-3 h-3 text-blue-500" />
           Recommended Plans
        </div>
        <div className="bg-zinc-100 p-2 rounded-[32px] flex relative shadow-inner w-full max-w-md border border-zinc-200/50">
          <button
            onClick={() => updateSelection({ technology: "HD" })}
            className={`flex-1 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] transition-all z-10 ${
              selection.technology === "HD" ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Standard (HD)
          </button>
          <button
            onClick={() => updateSelection({ technology: "IP" })}
            className={`flex-1 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] transition-all z-10 ${
              selection.technology === "IP" ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Smart (IP)
          </button>
          <div 
            className={`absolute top-2 bottom-2 w-[calc(50%-4px)] bg-white rounded-[24px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-transform duration-500 ease-out`}
            style={{ transform: selection.technology === "IP" ? "translateX(100%)" : "translateX(0%)" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-stretch max-w-7xl mx-auto w-full px-1">
        <PlanCard 
          title="Essential" 
          pricing={pricing_results.budget!} 
          onSelect={() => {
            const currentQualityIdx = QUALITY_TIERS.indexOf(selection.picture_quality);
            const currentStorageIdx = STORAGE_TIERS.indexOf(selection.recording_days);
            updateSelection({ 
              picture_quality: QUALITY_TIERS[Math.max(0, currentQualityIdx - 1)],
              recording_days: STORAGE_TIERS[Math.max(0, currentStorageIdx - 1)]
            });
          }}
        />
        
        <PlanCard 
          title="Standard" 
          badge="Best Value"
          recommendation
          pricing={pricing_results.recommended!} 
          isSelected={true} 
          onSelect={() => {}}
        />
        
        <PlanCard 
          title="Best Quality" 
          pricing={pricing_results.premium!} 
          onSelect={() => {
            const currentQualityIdx = QUALITY_TIERS.indexOf(selection.picture_quality);
            const currentStorageIdx = STORAGE_TIERS.indexOf(selection.recording_days);
            updateSelection({ 
              picture_quality: QUALITY_TIERS[Math.min(QUALITY_TIERS.length - 1, currentQualityIdx + 1)],
              recording_days: STORAGE_TIERS[Math.min(STORAGE_TIERS.length - 1, currentStorageIdx + 1)]
            });
          }}
        />
      </div>

      <div className="bg-white rounded-[48px] border border-zinc-100 shadow-[0_40px_100px_rgba(0,0,0,0.08)] p-10 md:p-14 max-w-5xl mx-auto w-full group">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-zinc-50 pb-12">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                  <SlidersHorizontal className="w-5 h-5" />
               </div>
               <h2 className="text-3xl font-black text-zinc-900 tracking-tighter">Adjust Your System</h2>
            </div>
            <p className="text-zinc-400 font-medium text-lg leading-relaxed">
              Change the options below to see the new price in real-time. Our system updates the setup for you instantly.
            </p>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pricing Policy Active</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-16 md:gap-24">
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex justify-between items-center group/label">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Number of Cameras</label>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{selection.camera_count} Cameras</span>
              </div>
              <input 
                type="range" 
                min="1" max="16" step="1"
                value={selection.camera_count}
                onChange={(e) => updateSelection({ camera_count: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-zinc-900 hover:accent-blue-600 transition-all"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Picture Quality</label>
              <div className="relative">
                <select 
                  value={selection.picture_quality}
                  onChange={(e) => updateSelection({ picture_quality: e.target.value as any })}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-[24px] px-6 py-4 font-black text-xs uppercase tracking-widest text-zinc-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="good">1080P Full HD (Standard)</option>
                  <option value="very_clear">5MP Super HD (Enhanced)</option>
                  <option value="crystal_clear">8MP 4K Ultra (Crystalline)</option>
                </select>
                <Info className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Recording Days (Memory)</label>
              <div className="grid grid-cols-3 gap-3">
                {[7, 15, 30].map(days => (
                  <button
                    key={days}
                    onClick={() => updateSelection({ recording_days: days as any })}
                    className={`h-14 rounded-2xl font-black text-xs transition-all ${
                      selection.recording_days === days 
                      ? "bg-zinc-900 text-white shadow-xl shadow-zinc-900/10" 
                      : "bg-zinc-50 text-zinc-400 hover:text-zinc-600 border border-zinc-100 hover:border-zinc-200"
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-10">
            <div className="flex-1 space-y-4">
               <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Extra Features</h4>
               <div className="space-y-3">
                {pricingCache.addons.filter(a => a.is_active).map(addon => {
                  const ruleStatus = evaluateAddonRules(pricingCache.addon_rules, selection, cablingDone, propertyType, requirements)[addon.id!];
                  if (ruleStatus?.action === "hide" || (!ruleStatus)) return null;
                  const isMandatory = ruleStatus.action === "show_mandatory";
                  const isSelected = isMandatory || selection.selected_addons.includes(addon.id!);

                  return (
                    <label 
                      key={addon.id} 
                      className={`flex items-center gap-4 p-4 rounded-3xl border transition-all cursor-pointer group/addon ${
                        isSelected 
                        ? "border-blue-100 bg-blue-50/20" 
                        : "border-zinc-50 bg-white hover:border-zinc-200"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isSelected ? "bg-blue-600 border-blue-600" : "border-zinc-200 bg-white group-hover/addon:border-zinc-300"
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
                        <div className="font-black text-[10px] text-zinc-900 leading-tight uppercase tracking-tight">{addon.display_name}</div>
                        <div className="text-[10px] text-blue-600 font-bold mt-1 tracking-widest">+₹{addon.price.toLocaleString('en-IN')}</div>
                      </div>
                      {isMandatory && <span className="text-[8px] uppercase font-black text-zinc-400 px-2 py-0.5 bg-zinc-100 rounded-full">Included</span>}
                    </label>
                  );
                })}
               </div>
            </div>

            <div className="space-y-4 pt-10 border-t border-zinc-50">
              <button 
                onClick={() => triggerActionWithAddress("download")}
                disabled={isSaving}
                className="group relative w-full h-18 bg-zinc-900 hover:bg-blue-600 text-white font-black uppercase text-xs tracking-[0.3em] rounded-[32px] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 overflow-hidden"
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
                  className="h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                >
                  <Share2 className="w-4 h-4" /> WhatsApp
                </button>
                <button 
                  onClick={() => triggerActionWithAddress("booking")}
                  className="h-16 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black uppercase text-[10px] tracking-widest rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-95 border border-blue-100"
                >
                  <Calendar className="w-4 h-4" /> Book Visit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddressModal && (
        <SiteDetailsModal 
          initialPincode={lead.address?.pincode}
          onConfirm={handleAddressConfirm}
          onClose={() => setShowAddressModal(false)}
        />
      )}

    </div>
  );
}
const Loader2 = ({ className }: { className?: string }) => <Zap className={className} />;
