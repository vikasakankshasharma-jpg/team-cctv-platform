"use client";

import React, { useState, useEffect } from "react";
import { Product, BuilderSelection } from "@/types";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

export default function BuilderClient() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [selections, setSelections] = useState<BuilderSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [pricingResult, setPricingResult] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        source: "builder",
        eventType: "SESSION_START",
        step: 0
      })
    }).catch(console.error);
  }, [sessionId]);

  useEffect(() => {
    if (step > 0) {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          source: "builder",
          eventType: "STEP_VIEWED",
          step
        })
      }).catch(console.error);
    }
  }, [step, sessionId]);
  useEffect(() => {
    // Fetch builder products
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/build/products");
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleSelection = (productId: string, delta: number, type: "main" | "accessory" = "main") => {
    setSelections(prev => {
      const existing = prev.find(s => s.product_id === productId);
      if (existing) {
        const nextQty = existing.quantity + delta;
        if (nextQty <= 0) return prev.filter(s => s.product_id !== productId);
        return prev.map(s => s.product_id === productId ? { ...s, quantity: nextQty } : s);
      } else {
        if (delta <= 0) return prev;
        return [...prev, { product_id: productId, quantity: delta, type }];
      }
    });
  };

  const getQty = (productId: string) => {
    return selections.find(s => s.product_id === productId)?.quantity || 0;
  };

  const [existingEquipment, setExistingEquipment] = useState({ cameras: 0, recorderChannels: 0 });

  const selectedCams = selections.filter(s => {
    const p = products.find(prod => prod.id === s.product_id);
    return p && (p.category === "cctv_camera" || (p.category as any) === "camera");
  });
  const selectedWiredCams = selectedCams.filter(s => {
    const p = products.find(prod => prod.id === s.product_id);
    if (!p) return false;
    const name = (p.display_name || p.technical_name || "").toLowerCase();
    const pid = (p.id || "").toLowerCase();
    const techs = Array.isArray(p.technologies) ? p.technologies.map(t => String(t).toLowerCase()) : [];
    return !(
      techs.includes("wireless") || techs.includes("wifi") || techs.includes("4g") ||
      p.technology === "Wireless" || pid.includes("wifi") || pid.includes("wireless") || pid.includes("4g") ||
      name.includes("wi-fi") || name.includes("wifi") || name.includes("4g") ||
      Boolean(p.has_wifi) || Boolean(p.has_4g_sim)
    );
  });
  const isPureWirelessBuild = selectedCams.length > 0 && selectedWiredCams.length === 0 && existingEquipment.cameras === 0;

  const calculateSystem = async () => {
    setCalculating(true);
    try {
      const res = await fetch("/api/build/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections, existingEquipment })
      });
      const data = await res.json();
      if (data.success) {
        setPricingResult(data.pricing);
        setWarnings(data.warnings || []);
        setStep(7); // Go to Review
      } else {
        alert(t("bld_calc_failed", "Calculation failed: {msg}", { msg: String(data.message || "") }));
      }
    } catch (e) {
      console.error(e);
    }
    setCalculating(false);
  };

  const handleSaveQuote = async () => {
    const mobile = prompt(t("bld_prompt_mobile"));
    if (!mobile) return;
    
    setCalculating(true);
    try {
      const totalCameras = selections.length + existingEquipment.cameras;
      const res = await fetch("/api/quote/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_mobile: mobile,
          requirementSnapshot: { camera_count: totalCameras, is_upgrade: true, existing_equipment: existingEquipment }, // Mock requirement
          configurationSnapshot: selections,
          pricingSnapshot: pricingResult,
          selectedPlan: "recommended", // Unified logic relies on a selected plan
          source: "builder"
        })
      });
      const data = await res.json();
      if (data.success) {
        setSavedQuoteId(data.quoteId);
        
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            source: "builder",
            eventType: "QUOTE_GENERATED",
            metadata: { quoteId: data.quoteId }
          })
        }).catch(console.error);

        // Fire PDF generation in background
        fetch(`/api/quote/${data.quoteId}/pdf`);
      } else {
        alert(t("cfg_err_save"));
      }
    } catch (e) {
      console.error(e);
    }
    setCalculating(false);
  };

  const renderProducts = (category: string) => {
    return products.filter(p => p.category === category).map(p => (
      <div key={p.id} className="border p-4 rounded-xl flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="font-bold break-words leading-snug">{p.display_name}</h3>
          <p className="text-sm text-gray-500">₹{p.unit_price}</p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button onClick={() => handleSelection(p.id!, -1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">-</button>
          <span className="font-medium">{getQty(p.id!)}</span>
          <button onClick={() => handleSelection(p.id!, 1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">+</button>
        </div>
      </div>
    ));
  };

  if (savedQuoteId) {
    return (
      <div className="max-w-3xl mx-auto py-6 md:py-12 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4 leading-tight">{t("bld_ready_title")}</h2>
        <p className="mb-6">{t("bld_quote_id", "Your Quote ID: {id}", { id: savedQuoteId })}</p>
        <a 
          href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "917357612865"}?text=${encodeURIComponent(t("dlq_wa_msg", "Hi TEAM CCTV, please send me the official PDF for my Quote ID: {id}", { id: savedQuoteId }))}`}
          target="_blank"
          rel="noreferrer"
          className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-sm hover:bg-emerald-700 transition-colors inline-block"
        >
          {t("dlq_get_wa")}
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row gap-8">
      {/* Main Builder Area */}
      <div className="flex-1 min-w-0">
        <div className="mb-8">
          <div className="flex flex-wrap gap-x-3 gap-y-2 text-sm font-medium text-gray-400 pb-2">
            {[
              t("bld_st_mode"),
              t("bld_st_existing"),
              t("bld_st_cameras"),
              t("fcp_tab_recorder"),
              t("fcp_tab_storage"),
              t("bld_st_cable"),
              t("bld_st_acc"),
              t("bld_st_review"),
            ].map((name, i) => (
              <span key={i} className={step === i ? "text-blue-600 font-bold" : ""}>{i}. {name}</span>
            ))}
          </div>
        </div>

        {loading ? (
          <div>{t("bld_loading")}</div>
        ) : (
          <div>
            {step === 0 && (
              <div className="text-center py-6 md:py-12">
                <h2 className="text-3xl font-bold mb-8 leading-tight">{t("bld_mode_title")}</h2>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <div 
                    onClick={() => setStep(2)}
                    className="border-2 border-gray-200 hover:border-blue-600 rounded-2xl p-4 md:p-8 cursor-pointer transition-all hover:shadow-lg w-full max-w-sm"
                  >
                    <div className="text-4xl mb-4">🆕</div>
                    <h3 className="text-xl font-bold mb-2 leading-snug">{t("bld_new_title")}</h3>
                    <p className="text-gray-500">{t("bld_new_desc")}</p>
                  </div>
                  <div 
                    onClick={() => setStep(1)}
                    className="border-2 border-gray-200 hover:border-blue-600 rounded-2xl p-4 md:p-8 cursor-pointer transition-all hover:shadow-lg w-full max-w-sm"
                  >
                    <div className="text-4xl mb-4">🔄</div>
                    <h3 className="text-xl font-bold mb-2 leading-snug">{t("bld_upg_title")}</h3>
                    <p className="text-gray-500">{t("bld_upg_desc")}</p>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 leading-snug">{t("bld_ext_title")}</h2>
                <p className="text-gray-500 mb-6">{t("bld_ext_desc")}</p>
                
                <div className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("bld_ext_cams")}</label>
                    <input 
                      type="number" 
                      min="0" 
                      placeholder={t("bld_ext_cams_ph")} 
                      className="w-full border rounded-lg p-3" 
                      value={existingEquipment.cameras}
                      onChange={(e) => setExistingEquipment(prev => ({ ...prev, cameras: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("bld_ext_rec_ch")}</label>
                    <select 
                      className="w-full border rounded-lg p-3"
                      value={existingEquipment.recorderChannels}
                      onChange={(e) => setExistingEquipment(prev => ({ ...prev, recorderChannels: parseInt(e.target.value) || 0 }))}
                    >
                      <option value="0">{t("bld_no_rec")}</option>
                      <option value="4">{t("bld_ch_opt", "{ch} Channel", { ch: "4" })}</option>
                      <option value="8">{t("bld_ch_opt", "{ch} Channel", { ch: "8" })}</option>
                      <option value="16">{t("bld_ch_opt", "{ch} Channel", { ch: "16" })}</option>
                      <option value="32">{t("bld_ch_opt", "{ch} Channel", { ch: "32" })}</option>
                    </select>
                  </div>
                </div>

                <button onClick={() => setStep(2)} className="mt-8 bg-black text-white px-6 py-3 min-h-12 rounded-xl w-full max-w-xl leading-snug">
                  {t("bld_save_ext_btn")}
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 leading-snug">{t("bld_sel_cams")}</h2>
                {renderProducts("cctv_camera")}
                <button onClick={() => setStep(3)} className="mt-6 bg-black text-white px-6 py-3 min-h-12 rounded-xl w-full leading-snug">{t("bld_cont_rec")}</button>
              </div>
            )}
            
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 leading-snug">{t("bld_sel_rec")}</h2>
                {isPureWirelessBuild && (
                  <div className="bg-purple-50 border border-purple-200 text-purple-900 rounded-xl p-4 mb-6">
                    <p className="font-bold text-sm">{t("bld_wifi_banner_t")}</p>
                    <p className="text-xs mt-1 text-purple-800 leading-relaxed">
                      {t("bld_wifi_banner_d")}
                    </p>
                  </div>
                )}
                {renderProducts("recorder")}
                <button onClick={() => setStep(4)} className="mt-6 bg-black text-white px-6 py-3 min-h-12 rounded-xl w-full leading-snug">
                  {isPureWirelessBuild ? t("bld_skip_rec_btn") : t("bld_cont_storage")}
                </button>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 leading-snug">{t("bld_sel_storage")}</h2>
                {isPureWirelessBuild && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 mb-6">
                    <p className="font-bold text-sm">{t("bld_sd_banner_t")}</p>
                    <p className="text-xs mt-1 text-emerald-800 leading-relaxed">
                      {t("bld_sd_banner_d")}
                    </p>
                  </div>
                )}
                {renderProducts("storage")}
                <button onClick={() => setStep(5)} className="mt-6 bg-black text-white px-6 py-3 min-h-12 rounded-xl w-full leading-snug">{t("bld_cont_cable")}</button>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 leading-snug">{t("bld_sel_cable")}</h2>
                {isPureWirelessBuild && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-4 mb-6">
                    <p className="font-bold text-sm">{t("bld_nocable_t")}</p>
                    <p className="text-xs mt-1 text-blue-800 leading-relaxed">
                      {t("bld_nocable_d")}
                    </p>
                  </div>
                )}
                {renderProducts("cable")}
                <button onClick={() => setStep(6)} className="mt-6 bg-black text-white px-6 py-3 min-h-12 rounded-xl w-full leading-snug">
                  {isPureWirelessBuild ? t("bld_skip_cable") : t("bld_cont_acc")}
                </button>
              </div>
            )}

            {step === 6 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 leading-snug">{t("bld_sel_pwr_acc")}</h2>
                {isPureWirelessBuild && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 mb-6">
                    <p className="font-bold text-sm">{t("bld_pwrbox_t")}</p>
                    <p className="text-xs mt-1 text-amber-800 leading-relaxed">
                      {t("bld_pwrbox_d")}
                    </p>
                  </div>
                )}
                {renderProducts("power_supply")}
                {renderProducts("accessory")}
                <button onClick={calculateSystem} disabled={calculating} className="mt-6 bg-blue-600 text-white px-6 py-3 min-h-12 rounded-xl w-full font-bold leading-snug">
                  {calculating ? t("bld_checking") : t("bld_check_btn")}
                </button>
              </div>
            )}

            {step === 7 && pricingResult && (
              <div>
                <h2 className="text-2xl font-bold mb-6 leading-snug">{t("bld_review_title")}</h2>
                
                <div className="bg-green-50 text-green-800 p-4 rounded-xl mb-6 flex items-start">
                  <svg className="w-5 h-5 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <div>
                    <h4 className="font-bold">{t("bld_ready_quote")}</h4>
                    <p className="text-sm">
                      {isPureWirelessBuild
                        ? t("bld_ready_wifi")
                        : t("bld_ready_wired")}
                    </p>
                  </div>
                </div>

                {warnings.length > 0 && (
                  <div className="bg-amber-50 text-amber-900 border border-amber-200 p-4 rounded-xl mb-6">
                    <h4 className="font-bold text-sm mb-1">{t("bld_notes_title")}</h4>
                    <ul className="text-xs list-disc list-inside space-y-1">
                      {warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border rounded-xl divide-y">
                  {pricingResult.items.map((item: any, i: number) => (
                    <div key={i} className="p-4 flex justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium break-words">{item.display_name}</div>
                        <div className="text-sm text-gray-500">{t("qrc_qty_colon", "Qty: {qty}", { qty: String(item.qty) })}</div>
                      </div>
                      <div className="font-medium shrink-0">₹{item.line_total}</div>
                    </div>
                  ))}
                  <div className="p-4 bg-gray-50 flex justify-between gap-3 font-bold text-lg rounded-b-xl">
                    <span>{t("bld_total_payable")}</span>
                    <span className="text-blue-600 shrink-0">₹{pricingResult.total_payable}</span>
                  </div>
                </div>

                <button onClick={handleSaveQuote} disabled={calculating} className="mt-6 bg-black text-white px-6 py-3 min-h-12 rounded-xl w-full text-lg font-bold leading-snug">
                  {calculating ? t("bld_saving") : t("bld_get_quote")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Summary */}
      <div className="w-full md:w-80 shrink-0">
        <div className="bg-gray-50 rounded-2xl p-6 sticky top-6">
          <h3 className="font-bold mb-4 uppercase text-xs tracking-wider text-gray-500">{t("bld_summary_title")}</h3>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between gap-2 text-sm">
              <span>{t("bld_items_selected")}</span>
              <span className="font-medium">{selections.reduce((acc, s) => acc + s.quantity, 0)}</span>
            </div>
            {warnings.length > 0 && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {t("bld_compat_warn")}
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">{t("bld_est_total")}</div>
            <div className="text-2xl font-bold">
              ₹{selections.reduce((acc, sel) => {
                const p = products.find(p => p.id === sel.product_id);
                return acc + (p ? p.unit_price * sel.quantity : 0);
              }, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
