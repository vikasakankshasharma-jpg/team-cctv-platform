"use client";

import React, { useState, useMemo } from "react";
import { PricingResult, CCTVRequirement } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings2, ArrowLeftRight, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface QuoteComparisonProps {
  plans: Record<string, PricingResult>;
  requirement: CCTVRequirement;
  onSelectPlan: (planId: string) => void;
  onEditConfiguration: () => void;
}

export function QuoteComparison({ plans, requirement, onSelectPlan, onEditConfiguration }: QuoteComparisonProps) {
  const { t } = useTranslation();
  const translateTechLabel = (techName: string) => {
    if (techName === "HD") return t("iqr_standard_hd");
    if (techName === "IP") return t("iqr_digital_ip");
    if (techName === "Wireless" || techName === "WiFi") return t("dvg_wireless_full");
    if (techName === "Hybrid") return t("dvg_hybrid_full");
    return techName;
  };
  const isHybridReq = (Number(requirement.wifi_camera_count) > 0 && (Number(requirement.outdoor_camera_count) > 0 || Number(requirement.indoor_camera_count) > 0)) || String(requirement.technology_choice || "").toLowerCase() === "hybrid";
  const lockedTech = requirement.installation_type === "addon" && requirement.existing_technology ? requirement.existing_technology as "HD" | "IP" : null;
  const defaultTech = isHybridReq ? "Hybrid" : ((requirement.technology_choice || requirement.technology_preference || "HD") as "HD" | "IP" | "Wireless" | "Hybrid");
  const [activeTech, setActiveTech] = useState<"HD" | "IP" | "Wireless" | "Hybrid">((lockedTech as any) || defaultTech);
  const [activeBrand, setActiveBrand] = useState<string>("All");
  
  // State for side-by-side comparison mode
  const [showComparison, setShowComparison] = useState(false);
  const [selectedToCompare, setSelectedToCompare] = useState<string[]>([]);

  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const brands = useMemo(() => {
     const bSet = new Set<string>();
     Object.keys(plans).forEach(key => {
        const matchesActiveTech = activeTech === "Hybrid" ? (key.includes("_Hybrid_") || key.includes("_HD_")) : key.includes("_" + activeTech + "_");
        if (matchesActiveTech) {
           const parts = key.split("_");
           if (parts.length >= 3) {
              bSet.add(parts[0]);
           }
        }
     });
     const list = Array.from(bSet);
     return list.includes("Budget") ? ["Budget", ...list.filter(b => b !== "Budget")] : list;
  }, [plans, activeTech]);

  React.useEffect(() => {
     if (brands.length > 0 && activeBrand !== "All" && !brands.includes(activeBrand)) {
      setActiveBrand("All");
   }
  }, [brands, activeBrand]);

  const uniqueMps = useMemo(() => {
    const mps = new Set<string>();
    Object.keys(plans).forEach(key => {
      const matchesActiveTech = activeTech === "Hybrid" ? (key.includes("_Hybrid_") || key.includes("_HD_")) : key.includes("_" + activeTech + "_");
      if (matchesActiveTech) {
        if (activeBrand === "All" || key.startsWith(activeBrand + "_")) {
           mps.add(key.split("_")[2]);
        }
      }
    });
    return Array.from(mps).filter(Boolean).sort((a,b) => parseInt(a) - parseInt(b));
  }, [plans, activeTech, activeBrand]);

  const [activeResolution, setActiveResolution] = useState<string>("");

  React.useEffect(() => {
    if (activeBrand === "All" && activeResolution === "All") {
       if (uniqueMps.length > 0) setActiveResolution(uniqueMps[Math.floor(uniqueMps.length / 2)] || uniqueMps[0]);
    } else if (activeResolution !== "All" && activeResolution !== "" && !uniqueMps.includes(activeResolution)) {
       if (uniqueMps.length > 0) setActiveResolution(uniqueMps[Math.floor(uniqueMps.length / 2)] || uniqueMps[0]);
    } else if (activeResolution === "" && uniqueMps.length > 0) {
       setActiveResolution(uniqueMps[Math.floor(uniqueMps.length / 2)] || uniqueMps[0]);
    }
  }, [activeBrand, activeResolution, uniqueMps]);

  const plansToRender = useMemo(() => {
    const resolveKey = (b: string, tech: string, mp: string) => {
      if (tech === "Hybrid") {
        if (plans[`${b}_Hybrid_${mp}`]) return `${b}_Hybrid_${mp}`;
        if (plans[`${b}_HD_${mp}`]) return `${b}_HD_${mp}`;
      }
      return `${b}_${tech}_${mp}`;
    };

    if (activeBrand === "All" && activeResolution !== "All") {
      return brands.map(b => {
        const key = resolveKey(b, activeTech, activeResolution);
        return { key, plan: plans[key] };
      }).filter(p => p.plan);
    }
    if (activeBrand !== "All" && activeResolution === "All") {
      return uniqueMps.map(mp => {
        const key = resolveKey(activeBrand, activeTech, mp);
        return { key, plan: plans[key] };
      }).filter(p => p.plan);
    }
    if (activeBrand !== "All" && activeResolution !== "All") {
      const key = resolveKey(activeBrand, activeTech, activeResolution);
      return plans[key] ? [{ key, plan: plans[key] }] : [];
    }
    return [];
  }, [activeBrand, activeTech, activeResolution, brands, uniqueMps, plans]);

  const totalCams = requirement.installation_type === "addon" ? (requirement.indoor_camera_count || 0) + (requirement.outdoor_camera_count || 0) : requirement.camera_count || 0;

  const renderCard = (planKey: string, plan: PricingResult, isMain: boolean = false) => {
    const keyParts = planKey.split("_");
    const brandName = keyParts[0];
    const tech = keyParts[1];
    const mp = keyParts.length > 2 ? keyParts[2] : "";
    
    const isWireless = tech === "Wireless" || tech === "WiFi";
    const storageItem = plan.items.find((i: any) => i.category === "storage");
    const storageCap = storageItem ? storageItem.display_name.match(/\d+TB|\d+GB/)?.[0] || t("cmp_included") : t("qc_none");
    const storageDisplay = isWireless && storageItem && storageItem.qty > 1 
      ? t("qc_cap_sd_cards", "{cap} ({count}x SD Cards)", { cap: storageCap, count: String(storageItem.qty) })
      : isWireless && storageItem 
        ? t("qc_cap_microsd", "{cap} (MicroSD)", { cap: storageCap })
        : storageCap;
    
    const recorderItem = plan.items.find((i: any) => i.category === "recorder");
    const recorderDisplay = isWireless 
      ? t("qc_rec_wifi_app")
      : recorderItem 
        ? (recorderItem.display_name.includes("8 Ch") ? t("qc_ch_n", "{ch}-Channel", { ch: "8" }) : recorderItem.display_name.includes("16 Ch") ? t("qc_ch_n", "{ch}-Channel", { ch: "16" }) : recorderItem.display_name.includes("32 Ch") ? t("qc_ch_n", "{ch}-Channel", { ch: "32" }) : t("qc_ch_n", "{ch}-Channel", { ch: "4" })) 
        : t("qc_existing");

    return (
      <Card key={planKey} className={`flex flex-col transition-all duration-200 ${isMain ? 'border-primary shadow-xl ring-2 ring-primary/20' : 'hover:shadow-md'}`}>
        <CardHeader className={isMain ? "bg-primary/5 pb-6" : ""}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {brandName}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
              {mp}
            </span>
          </div>
          <CardTitle className={`text-center text-gray-700 tracking-wide font-semibold break-words leading-snug ${isMain ? 'text-xl' : 'text-sm'}`}>
            {t("qc_cams_header", "{count}x {tech} Cameras", { count: String(totalCams), tech: translateTechLabel(tech) })}
          </CardTitle>
          <div className={`text-center font-black mt-3 ${isMain ? 'text-4xl text-primary' : 'text-3xl text-gray-900'}`}>{formatPrice(plan.total_payable)}</div>
          <div className="text-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
            {t("qc_gst_fitting")}
          </div>
        </CardHeader>
        <CardContent className="flex-grow pt-4">
          <ul className={`space-y-3 ${isMain ? 'text-base' : 'text-sm'}`}>
            <li className="flex justify-between gap-3 border-b pb-2">
              <span className="text-gray-500">{t("fcp_lbl_brand")}</span> 
              <span className="font-semibold text-gray-900 text-right">{brandName}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-gray-500">{t("qc_clarity")}</span> 
              <span className="font-medium text-primary font-bold text-right">{mp}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-gray-500">{t("fcp_tab_storage")}</span> 
              <span className="font-medium text-right">{t("qc_storage_days", "{storage} ({days} Days)", { storage: storageDisplay, days: String(requirement.recording_days || 0) })}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-gray-500">{t("fcp_tab_recorder")}</span> 
              <span className="font-medium text-right">{recorderDisplay}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-gray-500">{t("qc_installation")}</span> 
              <span className="font-medium text-right">{t("cmp_included")}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-gray-500">{t("qc_internet")}</span> 
              <span className="font-semibold text-xs text-right">
                {requirement.broadband_status === "independent_4g"
                  ? t("qc_net_4g")
                  : (plan.addons?.some((a: any) => a.addon_id === "ACC-WIFI-EXTENDER" || a.display_name?.toLowerCase().includes("extender")) || requirement.broadband_status === "wifi_extender")
                  ? t("qc_net_ext")
                  : (plan.addons?.some((a: any) => a.addon_id === "ACC-4G-ROUTER" || a.display_name?.toLowerCase().includes("router")) || requirement.broadband_status === "sim_router")
                  ? t("qc_net_router")
                  : t("qc_net_cust_free")}
              </span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="pt-4 flex flex-col gap-2">
          <Button className="w-full font-bold h-auto min-h-10 py-2.5 whitespace-normal text-center leading-snug" size={isMain ? "lg" : "default"} onClick={() => onSelectPlan(planKey)}>
            {isMain ? t("qc_sel_cont") : t("qc_select")}
          </Button>
          {!isMain && (
            <Button variant="outline" className="w-full h-auto min-h-10 py-2 whitespace-normal text-center leading-snug" onClick={() => {
              setSelectedToCompare(prev => prev.includes(planKey) ? prev.filter(p => p !== planKey) : [...prev, planKey].slice(0, 3));
            }}>
              {selectedToCompare.includes(planKey) ? t("qc_rem_compare") : t("qc_compare")}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  if (showComparison) {
    const comparePlans = Object.entries(plans).filter(([key]) => selectedToCompare.includes(key));
    return (
      <div className="flex flex-col space-y-6 w-full animate-in fade-in">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-zinc-50 p-4 rounded-lg border border-zinc-200 gap-4">
          <h3 className="text-lg font-bold text-zinc-800">{t("qc_comp_title")}</h3>
          <Button variant="outline" className="h-auto min-h-10 py-2 whitespace-normal" onClick={() => setShowComparison(false)}>
            {t("qc_back_opts")}
          </Button>
        </div>
        {comparePlans.length === 0 ? (
          <div className="text-center py-4 md:py-10 text-gray-500">{t("qc_empty_comp")}</div>
        ) : (
          <div className="overflow-x-auto border border-zinc-200 rounded-xl bg-white shadow-sm">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="p-4 border-b border-r bg-zinc-50 w-[160px] sm:w-[200px] text-zinc-500 font-semibold align-bottom">{t("qc_features")}</th>
                  {comparePlans.map(([key, plan]) => {
                     const parts = key.split("_");
                     return (
                        <th key={key} className="p-6 border-b border-r text-center align-top relative min-w-[220px]">
                          <button 
                            onClick={() => setSelectedToCompare(prev => prev.filter(p => p !== key))} 
                            className="absolute top-3 right-3 text-zinc-400 hover:text-red-500 transition-colors p-1 bg-white rounded-full hover:bg-red-50"
                            title={t("qc_rem_compare")}
                          >
                             <X size={18} />
                          </button>
                          <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                             <Badge variant="outline" className="bg-blue-50 text-blue-700 font-bold">{parts[0]}</Badge>
                             <Badge variant="outline" className="bg-zinc-100 text-zinc-800 font-bold">{parts[2]}</Badge>
                          </div>
                          <div className="text-sm font-semibold text-zinc-500 mb-2">{t("qc_cams_header", "{count}x {tech} Cameras", { count: String(totalCams), tech: translateTechLabel(parts[1]) })}</div>
                          <div className="text-3xl font-black text-zinc-900 mb-1">{formatPrice(plan.total_payable)}</div>
                          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-4">{t("qc_gst_fitting")}</div>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm h-auto min-h-11 py-2.5 whitespace-normal leading-snug" size="lg" onClick={() => onSelectPlan(key)}>{t("qc_sel_pkg")}</Button>
                        </th>
                     )
                  })}
                </tr>
              </thead>
              <tbody className="text-sm sm:text-base">
                 <tr className="hover:bg-zinc-50/50 transition-colors">
                   <td className="p-4 border-b border-r font-semibold text-zinc-700 bg-zinc-50/50">{t("fcp_lbl_brand")}</td>
                   {comparePlans.map(([key]) => <td key={key} className="p-4 border-b border-r text-center font-bold text-zinc-900">{key.split("_")[0]}</td>)}
                 </tr>
                 <tr className="hover:bg-zinc-50/50 transition-colors">
                   <td className="p-4 border-b border-r font-semibold text-zinc-700 bg-zinc-50/50">{t("qc_clarity_res")}</td>
                   {comparePlans.map(([key]) => <td key={key} className="p-4 border-b border-r text-center font-medium text-blue-700">{key.split("_")[2]}</td>)}
                 </tr>
                 <tr className="hover:bg-zinc-50/50 transition-colors">
                   <td className="p-4 border-b border-r font-semibold text-zinc-700 bg-zinc-50/50">{t("qc_storage_drive")}</td>
                   {comparePlans.map(([key, plan]) => {
                      const isPlanWireless = key.includes("_Wireless_") || key.includes("_WiFi_");
                      const item = plan.items.find((i: any) => i.category === "storage");
                      const cap = item ? item.display_name.match(/\d+TB|\d+GB/)?.[0] || t("cmp_included") : t("qc_none");
                      const val = isPlanWireless && item && item.qty > 1
                        ? t("qc_cap_sd_cards", "{cap} ({count}x SD Cards)", { cap, count: String(item.qty) })
                        : isPlanWireless && item
                          ? t("qc_cap_microsd", "{cap} (MicroSD)", { cap })
                          : item ? cap : t("qc_none_live");
                      return <td key={key} className="p-4 border-b border-r text-center">{val}</td>;
                   })}
                 </tr>
                 <tr className="hover:bg-zinc-50/50 transition-colors">
                   <td className="p-4 border-b border-r font-semibold text-zinc-700 bg-zinc-50/50">{t("qc_rec_unit")}</td>
                   {comparePlans.map(([key, plan]) => {
                      const isPlanWireless = key.includes("_Wireless_") || key.includes("_WiFi_");
                      if (isPlanWireless) {
                        return <td key={key} className="p-4 border-b border-r text-center text-zinc-500 font-medium">{t("qc_rec_wifi_app")}</td>;
                      }
                      const item = plan.items.find((i: any) => i.category === "recorder");
                      const val = item ? (item.display_name.includes("8 Ch") ? t("qc_ch_n", "{ch}-Channel", { ch: "8" }) : item.display_name.includes("16 Ch") ? t("qc_ch_n", "{ch}-Channel", { ch: "16" }) : item.display_name.includes("32 Ch") ? t("qc_ch_n", "{ch}-Channel", { ch: "32" }) : t("qc_ch_n", "{ch}-Channel", { ch: "4" })) : t("qc_existing");
                      return <td key={key} className="p-4 border-b border-r text-center">{val}</td>;
                   })}
                 </tr>
                 <tr className="hover:bg-zinc-50/50 transition-colors">
                   <td className="p-4 border-b border-r font-semibold text-zinc-700 bg-zinc-50/50">{t("qc_installation")}</td>
                   {comparePlans.map(([key]) => <td key={key} className="p-4 border-b border-r text-center text-green-600 font-bold bg-green-50/30">{t("cmp_included")}</td>)}
                 </tr>
                 <tr className="hover:bg-zinc-50/50 transition-colors">
                   <td className="p-4 border-b border-r font-semibold text-zinc-700 bg-zinc-50/50">{t("qc_internet_wifi")}</td>
                   {comparePlans.map(([key, p]) => {
                     const hasRouter = (p as any).addons?.some((a: any) => a.addon_id === "ACC-4G-ROUTER" || a.display_name?.toLowerCase().includes("router")) || requirement.broadband_status === "sim_router";
                     return (
                       <td key={key} className="p-4 border-b border-r text-center font-medium">
                         {requirement.broadband_status === "independent_4g"
                            ? t("qc_net_4g")
                            : ((p as any).addons?.some((a: any) => a.addon_id === "ACC-WIFI-EXTENDER" || a.display_name?.toLowerCase().includes("extender")) || requirement.broadband_status === "wifi_extender")
                            ? t("qc_net_ext")
                            : hasRouter
                            ? t("qc_net_router")
                            : t("qc_net_cust")}
                       </td>
                     );
                   })}
                 </tr>
                 <tr className="hover:bg-zinc-50/50 transition-colors">
                   <td className="p-4 border-b border-r font-semibold text-zinc-700 bg-zinc-50/50">{t("qc_warranty")}</td>
                   {comparePlans.map(([key]) => <td key={key} className="p-4 border-b border-r text-center font-medium">{t("qc_1yr_onsite")}</td>)}
                 </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col space-y-6 w-full animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-blue-50 p-4 rounded-lg border border-blue-100 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-blue-900">{t("qc_vars_title")}</h3>
          <p className="text-sm text-blue-700">
            {t("qc_vars_desc")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-auto min-h-9 py-2 whitespace-normal text-left" onClick={() => setShowComparison(true)}>
            <ArrowLeftRight className="w-4 h-4 mr-2 shrink-0" />
            {t("qc_compare_btn", "Compare Side-by-Side ({count})", { count: String(selectedToCompare.length) })}
          </Button>
          <Button variant="outline" size="sm" className="h-auto min-h-9 py-2 whitespace-normal text-left" onClick={onEditConfiguration}>
            <Settings2 className="w-4 h-4 mr-2 shrink-0" />
            {t("qc_edit_req")}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left: Options panel */}
        <div className="col-span-1 md:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4">{t("qc_step_tech")}</h4>
            <div className="flex flex-col space-y-2">
              <button onClick={() => !lockedTech && setActiveTech("HD")} disabled={!!lockedTech && lockedTech !== "HD"} className={`px-4 py-3 rounded-lg text-sm font-bold text-left transition-all border leading-snug ${activeTech === "HD" ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {t("wz_standard_hd_analog")}
              </button>
              <button onClick={() => !lockedTech && setActiveTech("IP")} disabled={!!lockedTech && lockedTech !== "IP"} className={`px-4 py-3 rounded-lg text-sm font-bold text-left transition-all border leading-snug ${activeTech === "IP" ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {t("qc_digital_ip_net")}
              </button>
              <button onClick={() => !lockedTech && setActiveTech("Wireless")} disabled={!!lockedTech && (lockedTech as any) !== "Wireless"} className={`px-4 py-3 rounded-lg text-sm font-bold text-left transition-all border leading-snug ${activeTech === "Wireless" ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {t("ecd_tech_wifi")}
              </button>
              <button onClick={() => !lockedTech && setActiveTech("Hybrid")} className={`px-4 py-3 rounded-lg text-sm font-bold text-left transition-all border flex flex-wrap items-center justify-between gap-2 leading-snug ${activeTech === "Hybrid" ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <span>{t("dvg_hybrid_full")}</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.5 rounded-full uppercase shrink-0">{t("qc_wired_wifi")}</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4">{t("qc_step_brand")}</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant={activeBrand === "All" ? "default" : "outline"} className={`cursor-pointer px-4 py-2 text-sm transition-all ${activeBrand === "All" ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600 border-gray-300'}`} onClick={() => setActiveBrand("All")}>{t("qc_all_brands")}</Badge>
              {brands.map(b => (
                <Badge key={b} variant={activeBrand === b ? "default" : "outline"} className={`cursor-pointer px-4 py-2 text-sm transition-all ${activeBrand === b ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600 border-gray-300'}`} onClick={() => setActiveBrand(b)}>
                  {b}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4">{t("qc_step_quality")}</h4>
            <div className="flex flex-wrap gap-2">
              {activeBrand !== "All" && (
                  <Badge variant={activeResolution === "All" ? "default" : "outline"} className={`cursor-pointer px-4 py-2 text-sm transition-all ${activeResolution === "All" ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600 border-gray-300'}`} onClick={() => setActiveResolution("All")}>
                    {t("qc_all_qualities")}
                  </Badge>
                )}
                {uniqueMps.map((mp) => (
                  <Badge key={mp} variant={activeResolution === mp ? "default" : "outline"} className={`cursor-pointer px-4 py-2 text-sm transition-all ${activeResolution === mp ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600 border-gray-300'}`} onClick={() => setActiveResolution(mp)}>
                    {mp}
                  </Badge>
                ))}
            </div>
          </div>
        </div>

        {/* Right: Main Card */}
        <div className="col-span-1 md:col-span-7 flex flex-col justify-start items-center pt-4">
          <div className="w-full">
            {plansToRender.length > 0 ? (
              <div className="relative w-full">
                {plansToRender.length === 1 ? (
                  <div className="max-w-md mx-auto">
                    {renderCard(plansToRender[0].key, plansToRender[0].plan, true)}
                    <div className="mt-4 flex justify-center">
                      <Button variant="outline" className="text-sm font-medium h-auto min-h-9 py-2 whitespace-normal text-center" onClick={() => {
                        setSelectedToCompare(prev => prev.includes(plansToRender[0].key) ? prev.filter(p => p !== plansToRender[0].key) : [...prev, plansToRender[0].key].slice(0, 3));
                      }}>
                        {selectedToCompare.includes(plansToRender[0].key) ? t("qc_added_comp") : t("qc_add_sbs_comp")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {plansToRender.map(p => (
                      <div key={p.key}>
                        {renderCard(p.key, p.plan, true)}
                        <div className="mt-4 flex justify-center">
                          <Button variant="outline" className="text-sm font-medium h-auto min-h-9 py-2 whitespace-normal text-center" onClick={() => {
                            setSelectedToCompare(prev => prev.includes(p.key) ? prev.filter(item => item !== p.key) : [...prev, p.key].slice(0, 3));
                          }}>
                            {selectedToCompare.includes(p.key) ? t("qc_added_comp") : t("qc_add_comp")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-4 md:p-10 text-center text-gray-500">
                {t("qc_no_match")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
