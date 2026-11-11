import { useMemo, useState, useEffect } from "react";
import { Product, Addon, AppSettings, ConfiguratorSelection, PricingResult } from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Filter, Tag, ChevronDown, ChevronRight, Plus, Trash2, Info, HelpCircle, ShieldCheck, AlertTriangle } from "lucide-react";
import { TagGuideModal } from "./TagGuideModal";
import { StorageAdvisoryModal } from "./StorageAdvisoryModal";
import { useTranslation } from "@/hooks/useTranslation";
import { BookSurveyClient } from "@/components/public/BookSurveyClient";
import { getCanonicalBrandKey, getCanonicalBrandName } from "@/lib/brand-utils";

const BRAND_DISPLAY: Record<string, string> = {
  "all": "All Brands",
  "budget": "Budget",
  "cpplus": "CP Plus",
  "hikvision": "Hikvision",
  "dahua": "Dahua",
  "prama": "Prama",
  "trueview": "Trueview",
  "secureye": "Secureye",
  "wd": "WD",
  "seagate": "Seagate",
  "d-link": "D-Link",
  "tp-link": "TP-Link",
};

function normalizeBrandKey(brandStr: string): string {
  return getCanonicalBrandKey(brandStr);
}

function getRes(p: Product): string {
  let res = p.resolution_mp ? `${p.resolution_mp}MP` : "2MP";
  const name = ((p.technical_name || "") + " " + (p.display_name || "")).toUpperCase();
  if (name.includes("8MP") || name.includes("4K")) return "8MP";
  if (name.includes("6MP")) return "6MP";
  if (name.includes("5MP")) return "5MP";
  if (name.includes("4MP")) return "4MP";
  if (name.includes("3MP")) return "3MP";
  if (name.includes("2MP") || name.includes("1080P")) return "2MP";
  return res;
}



interface DynamicVariantGeneratorProps {
  products: Product[];
  addons: Addon[];
  settings: AppSettings;
  selection: ConfiguratorSelection;
  cablingDone: boolean;
  cablingMeters?: number;
  promoterDiscount?: { percent: number; flat: number };
  evaluatedAddonRules: any;
  activeOffer?: any;
  onSelectCheckout: (pricing: PricingResult) => void;
  onToggleCompare: (pricing: PricingResult) => void;
  selectedCompareItems: PricingResult[];
  onPriceMatch?: (pricing: PricingResult, allVariants?: PricingResult[]) => void;
  onOpenSpecsModal?: () => void;
  onToggleFeatureTag?: (tag: string) => void;
}

export function DynamicVariantGenerator({
  products,
  addons,
  settings,
  selection,
  cablingDone,
  cablingMeters,
  promoterDiscount,
  evaluatedAddonRules,
  activeOffer,
  onSelectCheckout,
  onToggleCompare,
  selectedCompareItems,
  onPriceMatch,
  onOpenSpecsModal,
  onToggleFeatureTag
}: DynamicVariantGeneratorProps) {
  const { t } = useTranslation();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);

  const toggleBucketFeature = (bucketId: string, featureTag: string) => {
    setCameraBuckets(prev => prev.map(b => {
      if (b.id !== bucketId) return b;
      const currentFeats: string[] = b.features || [];
      const exists = currentFeats.includes(featureTag);
      const newFeats = exists 
        ? currentFeats.filter((f: string) => f !== featureTag) 
        : [...currentFeats, featureTag];
      return { ...b, features: newFeats };
    }));
  };
  // Check if hybrid setup (both wired and wireless cameras requested — never misclassify pure wireless)
  const isHybridInitial = (() => {
    const selTech = String(selection.technology || "").toLowerCase();
    const isPureWirelessSel =
      (selTech === "wireless" || selTech === "wifi" || selTech === "4g_solar") &&
      !(selection as any).is_hybrid;
    const hasMixedHybridReqs =
      Array.isArray(selection.mixed_camera_requirements) &&
      selection.mixed_camera_requirements.some((r) => r.technology === "Wireless") &&
      selection.mixed_camera_requirements.some((r) => r.technology && r.technology !== "Wireless");
    return (
      selTech === "hybrid" ||
      Boolean((selection as any).is_hybrid) ||
      hasMixedHybridReqs ||
      (!isPureWirelessSel &&
        Number(selection.wifi_camera_count) > 0 &&
        (Number(selection.outdoor_camera_count) > 0 || Number(selection.indoor_camera_count) > 0))
    );
  })();

  // Auto-select based on selection.technology, session storage, or default
  const [activeTech, setActiveTech] = useState<"hd" | "ip" | "wireless" | "hybrid">(() => {
    if (isHybridInitial) return "hybrid";
    const selTech = String(selection.technology || "").toLowerCase();
    if (selTech === "wireless" || selTech === "wifi" || selTech === "4g_solar") return "wireless";
    if (selTech === "hybrid") return "hybrid";
    if (selTech === "ip") return "ip";
    if (selTech === "hd") return "hd";
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('quote_active_tech');
      if (saved === 'hd' || saved === 'ip' || saved === 'wireless' || saved === 'hybrid') return saved as any;
    }
    return "hd";
  });
  
  const [hybridWiredTech, setHybridWiredTech] = useState<"all" | "hd" | "ip">(() => {
    const pref = String((selection as any).hybrid_wired_technology || "").toUpperCase();
    if (pref === "IP") return "ip";
    if (pref === "HD") return "hd";
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('quote_hybrid_wired_tech');
      if (saved === 'all' || saved === 'hd' || saved === 'ip') return saved as any;
    }
    return "all";
  });
  const [showModeSwitcher, setShowModeSwitcher] = useState(false);

  const initialBrand = selection.brand_preference ? normalizeBrandKey(selection.brand_preference) : "all";
  const [activeBrand, setActiveBrand] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('quote_active_brand');
      if (saved) return saved;
    }
    return initialBrand;
  });

  const [selectedStorageDays, setSelectedStorageDays] = useState<number>(() => {
    return Number(selection.recording_days) || 15;
  });

  const [selectedStorageBrand, setSelectedStorageBrand] = useState<string>(() => {
    return (selection as any).preferred_storage_brand || "all";
  });

  const [selectedSensorType, setSelectedSensorType] = useState<string>(() => {
    return (selection as any).sensor_preference || "all";
  });

  const isFiltered = activeBrand !== "all" || selectedStorageDays !== 15 || selectedStorageBrand !== "all" || selectedSensorType !== "all" || (activeTech === "hybrid" && hybridWiredTech !== "all");
  const handleResetFilters = () => {
    setActiveBrand("all");
    setSelectedStorageDays(15);
    setSelectedStorageBrand("all");
    setSelectedSensorType("all");
    setHybridWiredTech("all");
    setShowModeSwitcher(false);
  };

  useEffect(() => {
    if (selection.recording_days) {
      setSelectedStorageDays(Number(selection.recording_days));
    }
  }, [selection.recording_days]);

  // Sync activeTech when selection.technology changes externally
  useEffect(() => {
    const selTech = String(selection.technology || "").toLowerCase();
    if (isHybridInitial || selTech === "hybrid") {
      setActiveTech("hybrid");
      setShowModeSwitcher(false);
    } else if (selTech === "wireless" || selTech === "wifi" || selTech === "4g_solar") {
      setActiveTech("wireless");
    } else if (selTech === "ip") {
      setActiveTech("ip");
    } else if (selTech === "hd") {
      setActiveTech("hd");
    }
  }, [selection.technology, isHybridInitial]);

  // Persist selections to session storage to remember them when returning from Full Quote view
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('quote_active_tech', activeTech);
    }
  }, [activeTech]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('quote_hybrid_wired_tech', hybridWiredTech);
    }
  }, [hybridWiredTech]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('quote_active_brand', activeBrand);
    }
  }, [activeBrand]);
  
  const isInitialWireless = activeTech === "wireless";
  const [cameraBuckets, setCameraBuckets] = useState<any[]>(() => {
    // If we are editing a quote that already has mixed requirements, load them!
    if (selection.mixed_camera_requirements && selection.mixed_camera_requirements.length > 0) {
      return selection.mixed_camera_requirements.map(req => {
        const tLower = (req.type || "").toLowerCase();
        const techStr = String(req.technology || "").toUpperCase();
        let conn: "wired" | "wifi" | "4g" = "wired";
        if (tLower.includes("4g") || (req.features && req.features.includes("4g"))) conn = "4g";
        else if (tLower.includes("wifi") || tLower.includes("wi-fi") || tLower.includes("wireless") || techStr === "WIRELESS" || techStr === "WIFI") conn = "wifi";
        else if (activeTech === "wireless") conn = "wifi";

        const isPtz = tLower.includes("ptz") || tLower.includes("360") || (req.features && req.features.includes("ptz"));
        const isFixed = tLower.includes("fixed") || (conn === "wifi" && !isPtz && (tLower.includes("dome") || tLower.includes("bullet")));

        return {
          id: Math.random().toString(36).substring(7),
          type: tLower.includes("outdoor") ? "outdoor" : "indoor",
          subType: isPtz ? "ptz" : isFixed ? "fixed" : undefined,
          count: req.count || 1,
          resolution: req.resolution || "2MP",
          connection: conn,
          features: req.features ? [...req.features] : []
        };
      });
    }

    const buckets: any[] = [];
    const isWirelessMode = activeTech === "wireless";
    const wifiCount = Number(selection.wifi_camera_count) || 0;
    
    const outCount = selection.outdoor_camera_count !== undefined 
      ? selection.outdoor_camera_count 
      : (selection.indoor_camera_count !== undefined 
          ? Math.max(0, (selection.camera_count || 4) - selection.indoor_camera_count - (isWirelessMode ? 0 : wifiCount)) 
          : Math.ceil((selection.camera_count || 4) / 2));
          
    const inCount = selection.indoor_camera_count !== undefined 
      ? selection.indoor_camera_count 
      : Math.max(0, (selection.camera_count || 4) - outCount - (isWirelessMode ? 0 : wifiCount));

    const defaultConn: "wired" | "wifi" | "4g" = isWirelessMode 
      ? (selection.broadband_status === "independent_4g" ? "4g" : "wifi") 
      : "wired";

    const initFeats = (selection.requested_features || []).filter(f => {
      const fl = f.toLowerCase();
      return fl !== "outdoor" && fl !== "indoor" && fl !== "bullet" && fl !== "dome";
    });

    if (outCount > 0) {
      buckets.push({ id: Math.random().toString(36).substring(7), type: "outdoor", count: outCount, resolution: "2MP", connection: defaultConn, features: [...initFeats] });
    }
    if (inCount > 0) {
      buckets.push({ id: Math.random().toString(36).substring(7), type: "indoor", count: inCount, resolution: "2MP", connection: defaultConn, features: [...initFeats] });
    }
    // If hybrid setup has wifi cameras and we are in wired/hybrid mode:
    if (!isWirelessMode && wifiCount > 0) {
      const selAny = selection as any;
      const wifiInPtz = Number(selAny.wifi_indoor_ptz_count) || 0;
      const wifiInFixed = Number(selAny.wifi_indoor_fixed_count) || 0;
      const wifiOutBullet = Number(selAny.wifi_outdoor_bullet_count) || 0;
      const wifiOutPtz = Number(selAny.wifi_outdoor_ptz_count) || 0;
      const wifi4g = Number(selAny.wifi_4g_count) || 0;
      const hasGranularWifi = (wifiInPtz + wifiInFixed + wifiOutBullet + wifiOutPtz + wifi4g) > 0;
      const wifiIn = Number(selAny.wifi_indoor_count);
      const wifiOut = Number(selAny.wifi_outdoor_count);

      if (hasGranularWifi) {
        if (wifiInPtz > 0) buckets.push({ id: Math.random().toString(36).substring(7), type: "indoor", subType: "ptz", count: wifiInPtz, resolution: "3MP", connection: "wifi", features: Array.from(new Set([...initFeats, "ptz", "2-way"])) });
        if (wifiInFixed > 0) buckets.push({ id: Math.random().toString(36).substring(7), type: "indoor", subType: "fixed", count: wifiInFixed, resolution: "3MP", connection: "wifi", features: Array.from(new Set([...initFeats, "2-way"])) });
        if (wifiOutBullet > 0) buckets.push({ id: Math.random().toString(36).substring(7), type: "outdoor", subType: "fixed", count: wifiOutBullet, resolution: "3MP", connection: "wifi", features: Array.from(new Set([...initFeats, "color"])) });
        if (wifiOutPtz > 0) buckets.push({ id: Math.random().toString(36).substring(7), type: "outdoor", subType: "ptz", count: wifiOutPtz, resolution: "3MP", connection: "wifi", features: Array.from(new Set([...initFeats, "ptz", "color"])) });
        if (wifi4g > 0) buckets.push({ id: Math.random().toString(36).substring(7), type: "outdoor", count: wifi4g, resolution: "3MP", connection: "4g", features: Array.from(new Set([...initFeats, "4g", "sim"])) });
      } else if (!isNaN(wifiIn) && !isNaN(wifiOut) && (wifiIn > 0 || wifiOut > 0)) {
        if (wifiIn > 0) {
          buckets.push({ id: Math.random().toString(36).substring(7), type: "indoor", subType: "ptz", count: wifiIn, resolution: "3MP", connection: "wifi", features: [...initFeats, "ptz", "2-way"] });
        }
        if (wifiOut > 0) {
          buckets.push({ id: Math.random().toString(36).substring(7), type: "outdoor", subType: "fixed", count: wifiOut, resolution: "3MP", connection: "wifi", features: [...initFeats, "color"] });
        }
      } else {
        const fallbackConn: "wifi" | "4g" = selAny.is_4g || selection.broadband_status === "independent_4g" ? "4g" : "wifi";
        buckets.push({ id: Math.random().toString(36).substring(7), type: "indoor", subType: fallbackConn === "wifi" ? "ptz" : undefined, count: wifiCount, resolution: "3MP", connection: fallbackConn, features: fallbackConn === "4g" ? [...initFeats, "4g", "sim"] : [...initFeats, "ptz", "2-way"] });
      }
    }
    if (buckets.length === 0 && selection.camera_count) {
      buckets.push({ id: Math.random().toString(36).substring(7), type: "outdoor", count: selection.camera_count, resolution: "2MP", connection: defaultConn, features: [...initFeats] });
    }
    return buckets;
  });

  const outdoorCount = cameraBuckets.filter(b => b.type === "outdoor").reduce((sum, b) => sum + b.count, 0);
  const indoorCount = cameraBuckets.filter(b => b.type === "indoor").reduce((sum, b) => sum + b.count, 0);
  const colorCount = cameraBuckets.filter(b => (b.features || []).includes("color")).reduce((sum, b) => sum + b.count, 0);
  const micCount = cameraBuckets.filter(b => (b.features || []).includes("mic") || (b.features || []).includes("2-way")).reduce((sum, b) => sum + b.count, 0);
  const twoWayCount = cameraBuckets.filter(b => (b.features || []).includes("2-way")).reduce((sum, b) => sum + b.count, 0);
  const ptzCount = cameraBuckets.filter(b => (b.features || []).includes("ptz")).reduce((sum, b) => sum + b.count, 0);
  const wifiCount = cameraBuckets.filter(b => b.connection === "wifi").reduce((sum, b) => sum + b.count, 0);
  const cellularCount = cameraBuckets.filter(b => b.connection === "4g").reduce((sum, b) => sum + b.count, 0);
  const totalHardwareCount = cameraBuckets.reduce((sum, b) => sum + b.count, 0);
  const isWirelessScope = activeTech === "wireless";
  const totalWiredCount = cameraBuckets.filter(b => !isWirelessScope && (b.connection === "wired" || !b.connection)).reduce((sum, b) => sum + b.count, 0);
  const totalWifiCount = cameraBuckets.filter(b => isWirelessScope || b.connection === "wifi" || b.connection === "4g").reduce((sum, b) => sum + b.count, 0);
  const hasOutdoor = outdoorCount > 0;
  const hasIndoor = indoorCount > 0;
  const isMixed = hasOutdoor && hasIndoor;
  
  const { availableBrands, availableResolutions } = useMemo(() => {
    const brandSet = new Set<string>();
    const resSet = new Set<string>();
    
    products.forEach(p => {
      const pTech = (p.technology || "").toUpperCase();
      const pTechs = (p.technologies || []).map((t: string) => t.toUpperCase());
      const isTechMatch = activeTech === "hd" 
        ? (p.category === "cctv_camera" && (pTech === "HD" || pTechs.includes("HD")))
        : activeTech === "ip"
        ? (p.category === "cctv_camera" && (pTech === "IP" || pTechs.includes("IP")))
        : activeTech === "hybrid"
        ? (p.category === "cctv_camera" && (pTech === "HD" || pTechs.includes("HD") || pTech === "IP" || pTechs.includes("IP")))
        : (p.category === "cctv_camera" && (pTech === "WIRELESS" || pTech === "WIFI" || pTechs.includes("WIRELESS") || pTechs.includes("WIFI") || !!p.has_wifi || !!p.has_4g_sim));
        
      if (isTechMatch && p.brand) {
        brandSet.add(normalizeBrandKey(p.brand));
        resSet.add(getRes(p));
      }
    });

    const resultBrands: string[] = ["all"];
    const orderedKeys = settings.brand_tabs_order && settings.brand_tabs_order.length > 0 
      ? settings.brand_tabs_order 
      : ["all", "aproducts", "cpplus", "hikvision", "prama", "secureye", "trueview", "hifocus", "budget", "dahua"];
      
    orderedKeys.forEach(k => {
      if (k === "all" || brandSet.has(k)) {
        if (!resultBrands.includes(k)) resultBrands.push(k);
      }
    });

    brandSet.forEach(k => {
      if (!resultBrands.includes(k)) resultBrands.push(k);
    });

    const orderedRes = ["2MP", "3MP", "4MP", "5MP", "6MP", "8MP", "12MP"];
    const resultRes: string[] = [];
    orderedRes.forEach(r => {
      if (resSet.has(r)) resultRes.push(r);
    });

    return { availableBrands: resultBrands, availableResolutions: resultRes };
  }, [products, activeTech, settings.brand_tabs_order]);

  const targetBrand = availableBrands.includes(activeBrand) ? activeBrand : (availableBrands[0] || "all");

  // Helper to get available resolutions per bucket connection type based on active inventory and selected brand
  const getResolutionsForBucket = (b: any) => {
    const isWirelessConn = b.connection === "wifi" || b.connection === "4g" || activeTech === "wireless";
    const connResolutions = new Set<string>();
    products.forEach(p => {
      const pTech = (p.technology || "").toUpperCase();
      const pTechs = (p.technologies || []).map((t: string) => t.toUpperCase());
      const isConnMatch = isWirelessConn
        ? (p.category === "cctv_camera" && (pTech === "WIRELESS" || pTech === "WIFI" || pTechs.includes("WIRELESS") || pTechs.includes("WIFI") || !!p.has_wifi || !!p.has_4g_sim))
        : activeTech === "ip"
        ? (p.category === "cctv_camera" && (pTech === "IP" || pTechs.includes("IP")))
        : activeTech === "hybrid"
        ? (p.category === "cctv_camera" && (pTech === "HD" || pTechs.includes("HD") || pTech === "IP" || pTechs.includes("IP")))
        : (p.category === "cctv_camera" && (pTech === "HD" || pTechs.includes("HD")));
      
      if (isConnMatch && p.brand) {
        if (targetBrand === "all" || normalizeBrandKey(p.brand) === targetBrand) {
          connResolutions.add(getRes(p));
        }
      }
    });
    const orderedRes = ["2MP", "3MP", "4MP", "5MP", "6MP", "8MP", "12MP"];
    const filtered = orderedRes.filter(r => connResolutions.has(r));
    return filtered.length > 0 ? filtered : (availableResolutions.length > 0 ? availableResolutions : ["2MP"]);
  };

  // Helper to get available features in inventory for a specific camera bucket
  const getAvailableFeaturesForBucket = (b: any) => {
    const isWirelessConn = b.connection === "wifi" || b.connection === "4g" || activeTech === "wireless";
    
    // Find matching camera products in inventory
    const matchingCameras = products.filter(p => {
      if (p.category !== "cctv_camera") return false;
      const pTech = (p.technology || "").toUpperCase();
      const pTechs = (p.technologies || []).map((t: string) => t.toUpperCase());
      
      const isConnMatch = isWirelessConn
        ? (pTech === "WIRELESS" || pTech === "WIFI" || pTechs.includes("WIRELESS") || pTechs.includes("WIFI") || !!p.has_wifi || !!p.has_4g_sim)
        : activeTech === "ip"
        ? (pTech === "IP" || pTechs.includes("IP"))
        : activeTech === "hybrid"
        ? (pTech === "HD" || pTechs.includes("HD") || pTech === "IP" || pTechs.includes("IP"))
        : (pTech === "HD" || pTechs.includes("HD"));
        
      if (!isConnMatch) return false;
      
      if (targetBrand !== "all") {
        const pBrand = normalizeBrandKey(p.brand || "");
        if (pBrand !== targetBrand) return false;
      }
      return true;
    });

    const hasColor = matchingCameras.some(p => 
      p.has_color === true || 
      p.has_colorvu === true || 
      (p.features || []).includes("color") || 
      (p.features || []).includes("colorvu") || 
      (p.features || []).includes("dual_light") || 
      p.night_vision_type === "color" || 
      p.night_vision_type === "dual_light" || 
      p.display_name?.toLowerCase().includes("colorvu") || 
      p.display_name?.toLowerCase().includes("full color") || 
      p.display_name?.toLowerCase().includes("night color")
    );

    const hasMic = matchingCameras.some(p => 
      p.has_mic === true || 
      p.has_audio === true || 
      (p.features || []).includes("mic") || 
      (p.features || []).includes("audio") || 
      p.display_name?.toLowerCase().includes("with audio") || 
      p.display_name?.toLowerCase().includes("with mic")
    );

    const hasTwoWay = matchingCameras.some(p => 
      (p.has_two_way === true || 
       p.has_speaker === true || 
       p.has_2way_audio === true || 
       (p.features || []).includes("2-way") || 
       (p.features || []).includes("two-way")) && 
      !p.display_name?.toLowerCase().includes("without two-way")
    );

    const hasPtz = matchingCameras.some(p => 
      (p.has_ptz === true || 
       (p.features || []).includes("ptz") || 
       p.form_factor === "ptz" || 
       p.form_factor === "outdoor_pt" || 
       p.form_factor === "indoor_pt" || 
       p.display_name?.toLowerCase().includes("ptz") || 
       p.display_name?.toLowerCase().includes("pt camera")) && 
      p.has_ptz !== false
    );

    const available: { tag: string; label: string; title: string }[] = [];
    if (hasColor) {
      available.push({ tag: "color", label: t("dvg_feat_color_lbl"), title: t("dvg_feat_color_title") });
    }
    if (hasMic) {
      available.push({ tag: "mic", label: t("dvg_feat_mic_lbl"), title: t("dvg_feat_mic_title") });
    }
    if (hasTwoWay) {
      available.push({ tag: "2-way", label: t("dvg_feat_2way_lbl"), title: t("dvg_feat_2way_title") });
    }
    if (hasPtz) {
      available.push({ tag: "ptz", label: t("dvg_feat_ptz_lbl"), title: t("dvg_feat_ptz_title") });
    }
    return available;
  };

  // Prune any bucket features that are not available in the active technology / brand inventory
  useEffect(() => {
    setCameraBuckets(prev => prev.map(bucket => {
      const availableTags = getAvailableFeaturesForBucket(bucket).map(f => f.tag);
      const validFeatures = (bucket.features || []).filter((f: string) => availableTags.includes(f));
      if (validFeatures.length !== (bucket.features || []).length) {
        return { ...bucket, features: validFeatures };
      }
      return bucket;
    }));
  }, [activeTech, targetBrand]);

  const buildBucketCameraReq = (bkt: any, isWirelessScope: boolean, wiredTech: "HD" | "IP") => {
    const conn = isWirelessScope ? (bkt.connection === "4g" ? "4g" : "wifi") : (bkt.connection || "wired");
    const bucketResList = getResolutionsForBucket(bkt);
    const res = bucketResList.includes(bkt.resolution)
      ? bkt.resolution
      : (bucketResList.includes("3MP") ? "3MP" : (bucketResList.includes("2MP") ? "2MP" : (bucketResList[0] || "2MP")));

    let baseFeatures: string[] = [];
    if (conn === "4g") {
      baseFeatures = bkt.type === "outdoor" ? ["outdoor", "4g", "sim"] : ["indoor", "4g", "sim"];
    } else if (conn === "wifi") {
      const wantsPtz = bkt.subType === "ptz" || (bkt.features || []).includes("ptz") || (bkt.type === "indoor" && bkt.subType !== "fixed");
      baseFeatures = bkt.type === "outdoor"
        ? (wantsPtz ? ["bullet", "wireless", "wifi", "ptz"] : ["bullet", "wireless", "wifi"])
        : (wantsPtz ? ["dome", "wireless", "wifi", "ptz"] : ["dome", "wireless", "wifi"]);
    } else {
      baseFeatures = bkt.type === "outdoor" ? ["bullet", "outdoor"] : ["dome", "indoor"];
    }
    const extra = bkt.features && Array.isArray(bkt.features) ? bkt.features : [];
    const allFeatures = Array.from(new Set([...baseFeatures, ...extra]));

    if (conn === "4g") {
      return {
        type: bkt.type === "outdoor" ? "Outdoor 4G SIM Camera" : "Indoor 4G SIM Camera",
        count: bkt.count,
        resolution: res,
        technology: "Wireless",
        features: allFeatures
      };
    }
    if (conn === "wifi") {
      return {
        type: bkt.type === "outdoor" ? "Outdoor Wi-Fi Camera" : "Indoor Wi-Fi Camera",
        count: bkt.count,
        resolution: res,
        technology: "Wireless",
        features: allFeatures
      };
    }
    return {
      type: bkt.type === "outdoor" ? "Outdoor Bullet Camera" : "Indoor Dome Camera",
      count: bkt.count,
      resolution: res,
      technology: wiredTech,
      features: allFeatures
    };
  };

  const { variants: allComputedVariants, allHybridCount } = useMemo(() => {
    const results: PricingResult[] = [];
    const brandsToGenerate: { brand: string, brandKey: string }[] = [];

    // Effective products strictly sourced from database catalog (zero fake products)
    const effectiveProducts = [...products];
    
    effectiveProducts.forEach(p => {
      const pTech = (p.technology || "").toUpperCase();
      const pTechs = (p.technologies || []).map((t: string) => t.toUpperCase());
      const isTechMatch = activeTech === "hd" 
        ? (p.category === "cctv_camera" && (pTech === "HD" || pTechs.includes("HD")))
        : activeTech === "ip"
        ? (p.category === "cctv_camera" && (pTech === "IP" || pTechs.includes("IP")))
        : activeTech === "hybrid"
        ? (p.category === "cctv_camera" && (pTech === "HD" || pTechs.includes("HD") || pTech === "IP" || pTechs.includes("IP")))
        : (p.category === "cctv_camera" && (pTech === "WIRELESS" || pTech === "WIFI" || pTechs.includes("WIRELESS") || pTechs.includes("WIFI") || !!p.has_wifi || !!p.has_4g_sim));
        
      if (isTechMatch && p.brand) {
        const pBrandKey = normalizeBrandKey(p.brand);
        const brandMatches = targetBrand === "all" || targetBrand === pBrandKey;
        
        if (brandMatches) {
           if (!brandsToGenerate.some(b => b.brandKey === pBrandKey)) {
             brandsToGenerate.push({ brand: p.brand, brandKey: pBrandKey });
           }
        }
      }
    });

    const isWireless = activeTech === "wireless";
    const defaultWiredTech: "HD" | "IP" = activeTech === "ip" ? "IP" : "HD";
    let mixedReqs: any[] = cameraBuckets.filter(b => b.count > 0).map(b =>
      buildBucketCameraReq(b, isWireless, defaultWiredTech)
    );
    const enrich = (pricing: any, brandKey: string, brandName: string, wiredTech?: "HD" | "IP") => {
      if (!pricing || pricing.error) return null;
      const camItems = pricing.items?.filter((i: any) => effectiveProducts.find(p => p.id === i.product_id)?.category === "cctv_camera");
      const firstCamId = camItems?.[0]?.product_id;
      const camera_device = effectiveProducts.find(p => p.id === firstCamId) ? { ...effectiveProducts.find(p => p.id === firstCamId) } : undefined;
      const storageItems = pricing.items?.filter((i: any) => effectiveProducts.find(p => p.id === i.product_id)?.category === "storage") || [];
      const isSdStorageItem = (item: any) => {
        const prod = effectiveProducts.find(p => p.id === item?.product_id) as any;
        const nameLower = (prod?.display_name || item?.display_name || "").toLowerCase();
        return prod?.subcategory === "sd_card" || nameLower.includes("microsd") || nameLower.includes("sd card");
      };
      const sdStrItem = storageItems.find(isSdStorageItem);
      const hddStrItem = storageItems.find((i: any) => !isSdStorageItem(i));
      const strItem = (activeTech === "wireless" ? sdStrItem : hddStrItem) || storageItems[0];

      const hydrateStorageMeta = (item: any) => {
        if (!item) return undefined;
        const baseProd = effectiveProducts.find(p => p.id === item.product_id);
        if (!baseProd) return undefined;
        const dev: any = { ...baseProd };
        let cap = dev.capacity;
        if (!cap) {
          const capStr = (dev.technical_name || dev.display_name || "").toUpperCase();
          const gbMatch = capStr.match(/(\d+)\s*GB/i);
          const tbMatch = capStr.match(/(\d+)\s*TB/i);
          if (gbMatch) cap = `${gbMatch[1]}GB`;
          else if (tbMatch) cap = `${tbMatch[1]}TB`;
          else if (dev.storage_capacity_tb) {
            const tbVal = dev.storage_capacity_tb;
            cap = tbVal < 1 ? `${Math.round(tbVal * 1000)}GB` : `${tbVal}TB`;
          }
        }
        const isSd = dev.subcategory === "sd_card" || (dev.display_name || "").toLowerCase().includes("sd") || (dev.display_name || "").toLowerCase().includes("microsd");
        dev.derivedCapacity = cap ? (isSd ? `${cap} MicroSD` : cap) : (isSd ? "MicroSD" : "HDD");
        dev.is_refurbished =
          dev.is_refurbished === true ||
          dev.brand === "Budget Brand" ||
          (dev.brand || "").toLowerCase().includes("budget") ||
          (dev.id || "").startsWith("HDD-BUD-") ||
          (typeof cap === "string" && cap.includes("500GB"));
        return { dev, cap, isSd };
      };

      const primaryMeta = hydrateStorageMeta(strItem);
      const secondaryMeta = activeTech === "hybrid" && hddStrItem && sdStrItem
        ? hydrateStorageMeta(sdStrItem)
        : undefined;
      const storage_device = primaryMeta?.dev;
      const secondary_storage_device = secondaryMeta?.dev;
      let actualCalculatedDays = 7;
      
      if (camera_device) {
        (camera_device as any).brand = brandName;
      }
      if (primaryMeta && storage_device) {
        const { cap, isSd } = primaryMeta;

        // Technology-aware dynamic backup days
        if (isSd || activeTech === "wireless") {
          // Wireless cameras have dedicated MicroSD cards (each camera records to its own card)
          const cardGb = (typeof cap === "string" && cap.includes("256GB")) ? 256
            : (typeof cap === "string" && cap.includes("128GB")) ? 128
            : (typeof cap === "string" && cap.includes("32GB")) ? 32 : 64;
          const dailyGbPerCam = 4.5; // per camera daily for wireless motion
          actualCalculatedDays = (strItem as any)?.approx_days || Math.max(1, Math.floor(cardGb / dailyGbPerCam));
        } else {
          // Wired HD Analog & IP Network (Centralized Shared HDD)
          const capacityGb = (storage_device as any).storage_capacity_tb 
            ? (storage_device as any).storage_capacity_tb * 1000 
            : (typeof cap === "string" && cap.includes("500GB")) ? 500
            : (typeof cap === "string" && cap.includes("1TB")) ? 1000
            : (typeof cap === "string" && cap.includes("2TB")) ? 2000
            : (typeof cap === "string" && cap.includes("4TB")) ? 4000
            : (typeof cap === "string" && cap.includes("6TB")) ? 6000 : 1000;

          const effectiveCamCount = Math.max(1, totalWiredCount > 0 ? totalWiredCount : totalHardwareCount);
          const isIP = activeTech === "ip" || (activeTech === "hybrid" && wiredTech === "IP");
          const dailyGbPerCam = 14.0;
          actualCalculatedDays = (strItem as any)?.approx_days || Math.max(1, Math.floor(capacityGb / (effectiveCamCount * dailyGbPerCam)));
        }
      }

      // Extract actual resolutions delivered in the quote (to handle fallbacks, e.g. when a brand lacks 2MP IP)
      let actualResolutions: string[] = [];
      let outdoorProvided: string | null = null;
      let indoorProvided: string | null = null;

      pricing.items.forEach((item: any) => {
        const product = products.find(p => p.id === item.product_id);
        const lowerName = (item.display_name || "").toLowerCase();
        const isCamera = product ? product.category === "cctv_camera" : lowerName.includes("camera");
        if (!isCamera) return;

        // Items typically look like: "Outdoor Bullet Camera: Budget Brand 5MP IP Dome..."
        const match = item.display_name.match(/(\d+(?:\.\d+)?)MP/i);
        if (match) {
          const res = match[0].toUpperCase();
          actualResolutions.push(res);
          if (lowerName.includes("outdoor")) outdoorProvided = res;
          if (lowerName.includes("indoor")) indoorProvided = res;
        }
      });
      
      let outdoorRequested = mixedReqs.find(r => r.type.toLowerCase().includes("outdoor"))?.resolution;
      let indoorRequested = mixedReqs.find(r => r.type.toLowerCase().includes("indoor"))?.resolution;
      
      let substitutionNotes: string[] = [];
      if (outdoorRequested && outdoorProvided && outdoorRequested !== outdoorProvided) {
        substitutionNotes.push(t("dvg_sub_outdoor", "{count} Outdoor", { count: String(outdoorProvided) }));
      }
      if (indoorRequested && indoorProvided && indoorRequested !== indoorProvided) {
        substitutionNotes.push(t("dvg_sub_indoor", "{count} Indoor", { count: String(indoorProvided) }));
      }

      let substitutionMessage = "";
      if (substitutionNotes.length > 0) {
        substitutionMessage = t("dvg_sub_upgrade", "💡 Includes {notes} upgrade based on brand availability.", {
          notes: substitutionNotes.join(` ${t("dvg_and")} `),
        });
      }

      // Deduplicate
      const uniqueActualRes = Array.from(new Set(actualResolutions));
      
      // If we couldn't find any resolutions in the items, fallback to the requested ones
      const resolvedRes = uniqueActualRes.length > 0 ? uniqueActualRes : Array.from(new Set(mixedReqs.map(r => r.resolution)));
      const isHybrid = resolvedRes.length > 1;
      let displayResolution = resolvedRes[0] ? `${resolvedRes[0]} ${t("wz_resolution")}` : `2MP ${t("wz_resolution")}`;
      
      if (totalWiredCount > 0 && totalWifiCount > 0) {
        displayResolution = t("dvg_res_hybrid_line", "{wired} Wired + {wifi} Smart Wi-Fi", {
          wired: String(totalWiredCount),
          wifi: String(totalWifiCount),
        });
      } else if (isHybrid) {
        displayResolution = `${t("wz_mixed_resolutions")} (${resolvedRes.join(", ")})`;
      } else if (hasOutdoor && !hasIndoor) {
        displayResolution = `${resolvedRes[0] || "2MP"} ${t("wz_resolution")} (${outdoorCount} ${t("wz_outdoor")})`;
      } else if (hasIndoor && !hasOutdoor) {
        displayResolution = `${resolvedRes[0] || "2MP"} ${t("wz_resolution")} (${indoorCount} ${t("wz_indoor")})`;
      }
      
      return { 
        ...pricing, 
        technology: activeTech === "wireless" ? "Wireless" : activeTech === "hybrid" ? "Hybrid" : activeTech.toUpperCase(),
        hybridWiredTech: wiredTech || (activeTech === "ip" ? "IP" : "HD"),
        camera_device: camera_device ? { ...camera_device, derivedResolution: displayResolution } : { derivedResolution: displayResolution, brand: brandName }, 
        storage_device,
        secondary_storage_device,
        camera_count: totalHardwareCount, 
        storage_days: actualCalculatedDays,
        plan_type: brandKey === "budget" ? "budget" : (Array.from(new Set(mixedReqs.map(r => r.resolution))).includes("8MP") ? "premium" : "recommended"),
        is_hybrid: isHybrid,
        mixed_camera_requirements: mixedReqs,
        substitution_message: substitutionMessage
      };
    };

    const wiredBuckets = cameraBuckets.filter(b => !isWireless && (b.connection === "wired" || !b.connection));
    const wifiBuckets = cameraBuckets.filter(b => isWireless || b.connection === "wifi" || b.connection === "4g");
    const totalWiredCount = wiredBuckets.reduce((sum, b) => sum + b.count, 0);
    const totalWifiCount = wifiBuckets.reduce((sum, b) => sum + b.count, 0);
    const totalHardwareCount = totalWiredCount + totalWifiCount;

    const wiredTechsToRun: ("HD" | "IP")[] = 
      activeTech === "hybrid"
        ? ["HD", "IP"]
        : activeTech === "ip"
        ? ["IP"]
        : ["HD"];

    brandsToGenerate.forEach(b => {
      const uniqueRes = Array.from(new Set(mixedReqs.map(r => r.resolution)));
      const isEconomy = selectedStorageDays === 7;
      const targetStorageTB = isEconomy ? 0.5
        : selectedStorageDays === 15 ? 1.0
        : selectedStorageDays === 30 ? 2.0
        : selectedStorageDays === 60 ? 4.0 : 1.0;

      wiredTechsToRun.forEach(currentWiredTech => {
        // Verify brand has camera matching current wired tech
        const brandHasMatchingCam = effectiveProducts.some(p => {
          if (p.category !== "cctv_camera") return false;
          if (normalizeBrandKey(p.brand || "") !== b.brandKey) return false;
          const pTech = (p.technology || "").toUpperCase();
          const pTechs = (p.technologies || []).map((t: string) => t.toUpperCase());
          if (activeTech === "wireless") {
            return pTech === "WIRELESS" || pTech === "WIFI" || pTechs.includes("WIRELESS") || pTechs.includes("WIFI") || !!p.has_wifi || !!p.has_4g_sim;
          }
          return pTech === currentWiredTech || pTechs.includes(currentWiredTech);
        });
        if (!brandHasMatchingCam) return;

        // Dynamic mixed requirements with currentWiredTech for wired cameras
        const techMixedReqs = cameraBuckets.filter(bkt => bkt.count > 0).map(bkt =>
          buildBucketCameraReq(bkt, isWireless, currentWiredTech)
        );

        // Check if brand has ColorVu / Full Color cameras in catalog for this currentWiredTech
        const brandHasColor = effectiveProducts.some(p => {
          if (p.category !== "cctv_camera") return false;
          if (normalizeBrandKey(p.brand || "") !== b.brandKey) return false;
          const pTech = (p.technology || "").toUpperCase();
          const pTechs = (p.technologies || []).map((t: string) => t.toUpperCase());
          const isTechMatch = activeTech === "wireless"
            ? (pTech === "WIRELESS" || pTech === "WIFI" || pTechs.includes("WIRELESS") || pTechs.includes("WIFI") || !!p.has_wifi || !!p.has_4g_sim)
            : (pTech === currentWiredTech || pTechs.includes(currentWiredTech));
          if (!isTechMatch) return false;
          return p.has_color === true || p.has_colorvu === true || (p.features || []).includes("color") || (p.features || []).includes("colorvu") || (p.features || []).includes("dual_light") || p.night_vision_type === "color" || p.night_vision_type === "dual_light" || (p.display_name || "").toLowerCase().includes("colorvu") || (p.display_name || "").toLowerCase().includes("full color");
        });

        // 1. Standard IR Variation (Lowest Entry Price)
        if (selectedSensorType === "all" || selectedSensorType === "standard_ir") {
          const standardReqs = techMixedReqs.map(r => ({
            ...r,
            features: (r.features || []).filter((f: string) => f !== "color" && f !== "colorvu" && f !== "dual_light")
          }));
          const selStandard: ConfiguratorSelection = {
            ...selection,
            technology: (activeTech === "wireless" ? "Wireless" : currentWiredTech) as any,
            hybrid_wired_technology: currentWiredTech,
            is_hybrid: activeTech === "hybrid",
            brand_preference: b.brand,
            mixed_camera_requirements: standardReqs,
            outdoor_camera_count: cameraBuckets.filter(bkt => bkt.type === "outdoor" && bkt.connection !== "wifi" && bkt.connection !== "4g").reduce((sum, bkt) => sum + bkt.count, 0),
            indoor_camera_count: cameraBuckets.filter(bkt => bkt.type === "indoor" && bkt.connection !== "wifi" && bkt.connection !== "4g").reduce((sum, bkt) => sum + bkt.count, 0),
            wifi_camera_count: totalWifiCount,
            camera_count: totalHardwareCount,
            resolution_preference: uniqueRes.length === 1 ? uniqueRes[0] : (currentWiredTech === "IP" ? "3MP" : "2MP"),
            plan_type: "budget", // Pick lowest entry price camera!
            sensor_preference: "standard_ir",
            preferred_storage_brand: selectedStorageBrand !== "all" ? selectedStorageBrand : undefined,
            recording_days: selectedStorageDays,
            is_economy_storage: isEconomy as any,
            target_storage_tb: targetStorageTB,
          };

          const rawStandard = calculatePricing({
            selection: selStandard, products: effectiveProducts, addons, settings, cablingDone, cablingMeters,
            referralDiscountPercent: promoterDiscount?.percent || 0,
            referralDiscountFlat: promoterDiscount?.flat || 0,
            evaluatedAddonRules, activeOffer,
          });

          const enrichedStandard = enrich(rawStandard, b.brandKey, b.brand, currentWiredTech);
          if (enrichedStandard) {
            enrichedStandard.is_economy_storage = isEconomy;
            (enrichedStandard as any).sensor_type = "standard_ir";
            (enrichedStandard as any).hybridWiredTech = currentWiredTech;
            if (activeTech === "hybrid") {
              (enrichedStandard as any).key_difference = currentWiredTech === "IP"
                ? t("dvg_diff_ir_ip")
                : t("dvg_diff_ir_hd");
            } else {
              (enrichedStandard as any).key_difference = t("dvg_diff_ir_low");
            }
            results.push(enrichedStandard);
          }
        }

        // 2. 24/7 ColorVu / Full Color Variation
        if (brandHasColor && (selectedSensorType === "all" || selectedSensorType === "colorvu")) {
          const colorReqs = techMixedReqs.map(r => ({
            ...r,
            features: Array.from(new Set([...(r.features || []), "color"]))
          }));
          const selColor: ConfiguratorSelection = {
            ...selection,
            technology: (activeTech === "wireless" ? "Wireless" : currentWiredTech) as any,
            hybrid_wired_technology: currentWiredTech,
            is_hybrid: activeTech === "hybrid",
            brand_preference: b.brand,
            mixed_camera_requirements: colorReqs,
            outdoor_camera_count: cameraBuckets.filter(bkt => bkt.type === "outdoor" && bkt.connection !== "wifi" && bkt.connection !== "4g").reduce((sum, bkt) => sum + bkt.count, 0),
            indoor_camera_count: cameraBuckets.filter(bkt => bkt.type === "indoor" && bkt.connection !== "wifi" && bkt.connection !== "4g").reduce((sum, bkt) => sum + bkt.count, 0),
            wifi_camera_count: totalWifiCount,
            camera_count: totalHardwareCount,
            resolution_preference: uniqueRes.length === 1 ? uniqueRes[0] : (currentWiredTech === "IP" ? "3MP" : "2MP"),
            plan_type: "recommended",
            sensor_preference: "colorvu",
            requested_features: Array.from(new Set([...(selection.requested_features || []), "color"])),
            preferred_storage_brand: selectedStorageBrand !== "all" ? selectedStorageBrand : undefined,
            recording_days: selectedStorageDays,
            is_economy_storage: isEconomy as any,
            target_storage_tb: targetStorageTB,
          };

          const rawColor = calculatePricing({
            selection: selColor, products: effectiveProducts, addons, settings, cablingDone, cablingMeters,
            referralDiscountPercent: promoterDiscount?.percent || 0,
            referralDiscountFlat: promoterDiscount?.flat || 0,
            evaluatedAddonRules, activeOffer,
          });

          const enrichedColor = enrich(rawColor, b.brandKey, b.brand, currentWiredTech);
          if (enrichedColor) {
            enrichedColor.is_economy_storage = isEconomy;
            (enrichedColor as any).sensor_type = "colorvu";
            (enrichedColor as any).hybridWiredTech = currentWiredTech;
            if (activeTech === "hybrid") {
              (enrichedColor as any).key_difference = currentWiredTech === "IP"
                ? t("dvg_diff_color_ip")
                : t("dvg_diff_color_hd");
            } else {
              (enrichedColor as any).key_difference = t("dvg_diff_color_day");
            }
            
            // Only add if it's different from standard or if standard wasn't added
            const alreadyHasSamePrice = results.some(r => 
              normalizeBrandKey(r.camera_device?.brand || "") === b.brandKey && 
              r.total_payable === enrichedColor.total_payable && 
              (r as any).sensor_type === "standard_ir" &&
              (r as any).hybridWiredTech === currentWiredTech
            );
            if (!alreadyHasSamePrice) {
              results.push(enrichedColor);
            }
          }
        }
      });
    });

    // Sort full results by price (low to high)
    results.sort((a, b) => a.total_payable - b.total_payable);

    return {
      variants: results,
      allHybridCount: activeTech === "hybrid" ? results.length : 0,
    };
  }, [activeTech, targetBrand, cameraBuckets, isMixed, hasOutdoor, hasIndoor, outdoorCount, indoorCount, selection, products, addons, settings, cablingDone, cablingMeters, promoterDiscount, evaluatedAddonRules, activeOffer, availableResolutions, selectedStorageDays, selectedStorageBrand, selectedSensorType, t]);

  const variants = useMemo<PricingResult[]>(() => {
    const filtered = activeTech === "hybrid" && hybridWiredTech !== "all"
      ? allComputedVariants.filter((v: any) => v.hybridWiredTech === (hybridWiredTech === "ip" ? "IP" : "HD"))
      : allComputedVariants;

    const sorted = [...filtered].sort((a, b) => a.total_payable - b.total_payable);
    const recIndex = Math.floor(sorted.length / 2);
    return sorted.map((v, idx): PricingResult => ({
      ...v,
      is_recommended: idx === recIndex && sorted.length > 1 && !v.is_economy_storage,
    }));
  }, [allComputedVariants, activeTech, hybridWiredTech]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Quick guide details */}
      <div className="w-full max-w-2xl mx-auto">
        <details className="w-full group bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl overflow-hidden text-xs sm:text-sm">
          <summary className="px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between cursor-pointer font-medium text-blue-900 dark:text-blue-200 select-none">
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm">{t("dvg_how_to_custom")}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              <span className="group-open:hidden">{t("dvg_quick_guide")}</span>
              <span className="hidden group-open:inline">{t("dvg_hide")}</span>
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div className="px-3 pb-3 pt-1 sm:px-4 text-blue-800/90 dark:text-blue-300/90 text-xs leading-relaxed border-t border-blue-100/60 dark:border-blue-900/40">
            {t("dvg_guide_p1")} <strong>{t("dvg_plus_variant")}</strong> {t("dvg_guide_p2")}
          </div>
        </details>
      </div>

      {/* Sticky Filter Bar: Technology & Brand Selectors */}
      <div className="sticky top-14 md:top-20 z-30 w-full max-w-2xl mx-auto bg-[#f5f5f7]/95 dark:bg-black/95 backdrop-blur-md pt-1.5 pb-2 px-2 sm:px-3 border-b border-zinc-200/80 dark:border-zinc-800/80 shadow-xs sm:rounded-2xl transition-all space-y-2">
        {/* Technology Selector - Segmented Switcher (hidden in Hybrid setups where dedicated Hybrid bar owns filtering) */}
        {(activeTech !== "hybrid" || showModeSwitcher) && (
        <div className="w-full bg-zinc-100 dark:bg-zinc-800/70 p-1 rounded-2xl sm:rounded-full grid grid-cols-2 sm:grid-cols-4 gap-1 shadow-inner border border-zinc-200/50 dark:border-zinc-700/50">
          <button
            type="button"
            onClick={() => { setActiveTech("hd"); setShowModeSwitcher(false); setCameraBuckets(prev => prev.map(b => ({ ...b, connection: "wired" }))); }}
            className={`relative z-10 px-1 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl sm:rounded-full transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${activeTech === "hd" ? "bg-blue-600 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"}`}
          >
            <span className="leading-tight text-center">
              <span className="sm:hidden">{t("dvg_hd_short")}</span>
              <span className="hidden sm:inline">{t("wz_standard_hd_analog")}</span>
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-tight sm:tracking-wider whitespace-normal text-center leading-tight ${activeTech === 'hd' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'}`}>
              {t("wz_lowest_price")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTech("ip"); setShowModeSwitcher(false); setCameraBuckets(prev => prev.map(b => ({ ...b, connection: "wired" }))); }}
            className={`relative z-10 px-1 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl sm:rounded-full transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${activeTech === "ip" ? "bg-blue-600 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"}`}
          >
            <span className="leading-tight text-center">
              <span className="sm:hidden">{t("dvg_ip_short")}</span>
              <span className="hidden sm:inline">{t("wz_premium_ip_network")}</span>
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight sm:tracking-wider whitespace-normal text-center leading-tight ${activeTech === 'ip' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}`}>
              {t("dvg_ip_tag")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTech("wireless"); setShowModeSwitcher(false); setCameraBuckets(prev => prev.map(b => ({ ...b, connection: b.connection === "4g" ? "4g" : "wifi" }))); }}
            className={`relative z-10 px-1 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl sm:rounded-full transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${activeTech === "wireless" ? "bg-blue-600 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"}`}
          >
            <span className="leading-tight text-center">
              <span className="sm:hidden">{t("dvg_wireless_short")}</span>
              <span className="hidden sm:inline">{t("dvg_wireless_full")}</span>
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-tight sm:tracking-wider whitespace-normal text-center leading-tight ${activeTech === 'wireless' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300'}`}>
              {selection.power_wiring_option === "wire_needed" ? t("dvg_no_video_cable") : t("dvg_zero_wiring")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTech("hybrid");
              setShowModeSwitcher(false);
              setCameraBuckets(prev => {
                const hasW = prev.some(b => b.connection === "wired" || !b.connection);
                const hasWifi = prev.some(b => b.connection === "wifi" || b.connection === "4g");
                if (hasW && hasWifi) return prev;
                if (!hasWifi && prev.length > 1) {
                  return prev.map((b, idx) => idx === prev.length - 1 ? { ...b, connection: "wifi" } : { ...b, connection: "wired" });
                } else if (!hasWifi && prev.length === 1 && prev[0].count > 1) {
                  const half = Math.floor(prev[0].count / 2);
                  return [
                    { ...prev[0], count: prev[0].count - half, connection: "wired" },
                    { id: Math.random().toString(36).substring(7), type: "outdoor", count: half, resolution: prev[0].resolution, connection: "wifi", features: [...(prev[0].features || [])] }
                  ];
                } else if (!hasW && prev.length > 1) {
                  return prev.map((b, idx) => idx === 0 ? { ...b, connection: "wired" } : b);
                }
                return prev;
              });
            }}
            className={`relative z-10 px-1 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl sm:rounded-full transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${activeTech === "hybrid" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"}`}
          >
            <span className="leading-tight text-center">
              <span className="sm:hidden">{t("dvg_hybrid_short")}</span>
              <span className="hidden sm:inline">{t("dvg_hybrid_full")}</span>
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-tight sm:tracking-wider whitespace-normal text-center leading-tight ${activeTech === 'hybrid' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'}`}>
              {t("dvg_hybrid_tag")}
            </span>
          </button>
        </div>
        )}

        {/* Hybrid Backbone Sub-Bar */}
        {activeTech === "hybrid" && (
          <div className="w-full bg-linear-to-r from-indigo-50/90 via-purple-50/90 to-pink-50/90 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border border-purple-200/80 dark:border-purple-800/60 p-2 sm:p-2.5 rounded-xl flex flex-col gap-2 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center justify-between sm:justify-start gap-2 text-xs min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="font-extrabold text-purple-900 dark:text-purple-200 flex items-center gap-1 shrink-0">
                    <span>⚡</span> {t("dvg_wired_backbone")}
                  </span>
                  {totalWiredCount > 0 && totalWifiCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200/70 dark:border-purple-700/60 whitespace-nowrap">
                      {t("dvg_res_hybrid_line", "{wired} Wired + {wifi} Smart Wi-Fi", { wired: String(totalWiredCount), wifi: String(totalWifiCount) })}
                    </span>
                  )}
                  <span className="text-[11px] text-purple-700/90 dark:text-purple-300/90 hidden md:inline truncate">
                    {t("dvg_compare_backbone")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModeSwitcher(v => !v)}
                  className="text-[10px] font-bold text-purple-700 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white underline underline-offset-2 shrink-0 cursor-pointer sm:hidden"
                >
                  {showModeSwitcher ? t("dvg_hide") : t("dvg_change_setup_mode", "Switch Setup")}
                </button>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 p-1 rounded-lg border border-purple-200/70 dark:border-purple-800/50 flex-1 sm:flex-initial shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setHybridWiredTech("all")}
                    className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      hybridWiredTech === "all"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {t("dvg_all_hybrid", undefined, { count: String(allHybridCount) })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHybridWiredTech("hd")}
                    className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
                      hybridWiredTech === "hd"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <span>🏷️</span> {t("dvg_hd_dvr")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHybridWiredTech("ip")}
                    className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
                      hybridWiredTech === "ip"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <span>💎</span> {t("dvg_ip_nvr")}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModeSwitcher(v => !v)}
                  className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-white/70 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900 border border-purple-200/80 dark:border-purple-800/60 transition-colors cursor-pointer shrink-0"
                >
                  {showModeSwitcher ? t("dvg_hide") : t("dvg_change_setup_mode", "Switch Setup")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compact Dropdown Filter Toolbar */}
        <div className="w-full pt-1.5 pb-0.5 border-t border-zinc-200/70 dark:border-zinc-800/70 space-y-1.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            {/* 1. Camera Brand Dropdown */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <span>📹</span> {t("wz_brand") || "Brand"}
              </label>
              <select
                value={activeBrand}
                onChange={(e) => setActiveBrand(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] sm:text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="all">{t("dvg_all_brands_cnt", "All Brands ({count})", { count: String(availableBrands.filter(b => b !== "all").length) })}</option>
                {availableBrands.filter(b => b !== "all").map(b => (
                  <option key={b} value={b}>
                    {b === "budget" ? t("dvg_brand_budget_lbl", "Budget Brand") : BRAND_DISPLAY[b] || getCanonicalBrandName(b) || b}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Recording Retention Dropdown */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <span>💾</span> {t("dvg_ret_days_lbl")}
              </label>
              <select
                value={selectedStorageDays}
                onChange={(e) => setSelectedStorageDays(Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] sm:text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                {activeTech === "wireless" ? (
                  <>
                    <option value={15}>{t("dvg_ret_15d_sd")}</option>
                    <option value={7}>{t("dvg_ret_7d_sd")}</option>
                    <option value={30}>{t("dvg_ret_30d_sd")}</option>
                    <option value={60}>{t("dvg_ret_60d_sd")}</option>
                  </>
                ) : activeTech === "hybrid" ? (
                  <>
                    <option value={15}>{t("dvg_ret_15d_hyb", "15 Days (1TB + 64GB SD) • Standard")}</option>
                    <option value={7}>{t("dvg_ret_7d_hyb", "7 Days (500GB + 32GB SD) • Economy")}</option>
                    <option value={30}>{t("dvg_ret_30d_hyb", "30 Days (2TB + 128GB SD) • Extended")}</option>
                    <option value={60}>{t("dvg_ret_60d_hyb", "60 Days (4TB + 256GB SD) • Heavy")}</option>
                  </>
                ) : (
                  <>
                    <option value={15}>{t("dvg_ret_15d_hdd")}</option>
                    <option value={7}>{t("dvg_ret_7d_hdd")}</option>
                    <option value={30}>{t("dvg_ret_30d_hdd")}</option>
                    <option value={60}>{t("dvg_ret_60d_hdd")}</option>
                  </>
                )}
              </select>
            </div>

            {/* 3. Storage Drive Brand Dropdown */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <span>💽</span> {t("dvg_storage_drive_lbl")}
              </label>
              {activeTech === "wireless" ? (
                <div className="w-full px-2 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700 text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 break-words leading-snug">
                  {t("dvg_ded_microsd")}
                </div>
              ) : (
                <select
                  value={selectedStorageBrand}
                  onChange={(e) => setSelectedStorageBrand(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] sm:text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="all">{t("dvg_all_storage_brands")}</option>
                  <option value="seagate">{t("dvg_str_seagate")}</option>
                  <option value="wd">{t("dvg_str_wd")}</option>
                  <option value="toshiba">{t("dvg_str_toshiba")}</option>
                  <option value="budget">{t("dvg_str_budget")}</option>
                </select>
              )}
            </div>

            {/* 4. Night Vision / Sensor Dropdown */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <span>👁️</span> {t("dvg_night_vision_lbl")}
              </label>
              <select
                value={selectedSensorType}
                onChange={(e) => setSelectedSensorType(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] sm:text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="all">{t("dvg_all_sensors")}</option>
                <option value="standard_ir">{t("dvg_sensor_ir")}</option>
                <option value="colorvu">{t("dvg_sensor_color")}</option>
              </select>
            </div>
          </div>

          {/* Filter Status Strip & Quick Reset */}
          <div className="flex items-center justify-between pt-1 px-0.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium">
              <span className="font-bold text-zinc-900 dark:text-white">
                {variants.length}
              </span>
              <span>{variants.length === 1 ? t("dvg_var_singular") : t("dvg_var_plural")}</span>
            </div>
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 cursor-pointer transition-all"
              >
                <span>{t("dvg_reset_filters")}</span>
                <span>✕</span>
              </button>
            )}
          </div>
        </div>

        {/* Economy Storage Global Advisory Banner */}
        {selectedStorageDays === 7 && (
          <div className="w-full mt-2.5 p-2.5 sm:p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-left animate-in fade-in">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    {t("dvg_econ_title")}
                  </span>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                    {t("dvg_econ_days")}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-snug">
                  {t("dvg_econ_warn")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setShowStorageModal(true)}
                className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline px-1.5 py-1 cursor-pointer"
              >
                {t("dvg_learn_more")}
              </button>
              <button
                type="button"
                onClick={() => setSelectedStorageDays(15)}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer flex items-center gap-1"
              >
                <span>{t("dvg_switch_1tb")}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 items-center">
        {/* Real-time System Composition & Specification Breakdown */}
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-[#1d1d1f] p-3 sm:p-3.5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                {t("dvg_sys_overview")}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white shadow-xs">
                {totalHardwareCount} {totalHardwareCount === 1 ? t("wz_camera") : t("wz_cameras")} {t("dvg_total_word")}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 cursor-pointer"
                title={t("dvg_feat_guide_title")}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{t("dvg_feat_guide")}</span>
              </button>
              
              <button
                type="button"
                onClick={onOpenSpecsModal}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:underline px-2 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 cursor-pointer"
                title={t("dvg_checklist_title")}
              >
                <span>{t("dvg_checklist")}</span>
              </button>
            </div>
          </div>

          {/* Real-time Specification Breakup Tags */}
          <div className="flex flex-wrap items-center gap-1.5 py-0.5 text-[11px]">
            {outdoorCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🌧️</span> {outdoorCount} {t("dvg_tag_weather")}
              </span>
            )}
            {indoorCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🏠</span> {indoorCount} {t("dvg_tag_indoor")}
              </span>
            )}
            {colorCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🌙</span> {colorCount} {t("dvg_tag_color")}
              </span>
            )}
            {micCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🎙️</span> {micCount} {t("dvg_tag_audio")}
              </span>
            )}
            {twoWayCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🗣️</span> {twoWayCount} {t("dvg_tag_2way")}
              </span>
            )}
            {ptzCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🔄</span> {ptzCount} {t("dvg_feat_ptz")}
              </span>
            )}
            {cellularCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🛰️</span> {cellularCount} {t("dvg_feat_4g")}
              </span>
            )}
            {wifiCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>📶</span> {wifiCount} {t("dvg_wireless_full")}
              </span>
            )}
            {colorCount === 0 && micCount === 0 && twoWayCount === 0 && ptzCount === 0 && (
              <span className="text-gray-400 dark:text-zinc-500 text-[11px] italic">
                {t("dvg_tip_toggle")}
              </span>
            )}
          </div>
        </div>

        {/* Camera Buckets UI */}
        <div className="flex flex-col gap-2.5 sm:gap-3 items-center w-full max-w-2xl mx-auto mt-2">
          {cameraBuckets.map((bucket) => (
            <div key={bucket.id} className="w-full bg-white dark:bg-[#1d1d1f] p-3 sm:p-3.5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
              {/* Header row: Camera Type & Actions */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${bucket.type === 'outdoor' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    {bucket.type === 'outdoor' ? t("wz_outdoor_cameras") : t("wz_indoor_cameras")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setCameraBuckets(prev => {
                      const newBuckets = [...prev];
                      const index = newBuckets.findIndex(b => b.id === bucket.id);
                      if (bucket.count > 1) {
                        newBuckets[index] = { ...bucket, count: Math.ceil(bucket.count / 2) };
                        newBuckets.splice(index + 1, 0, { id: Math.random().toString(36).substring(7), type: bucket.type, count: Math.floor(bucket.count / 2), resolution: bucket.resolution, connection: bucket.connection, features: [...(bucket.features || [])] });
                      } else {
                        newBuckets.splice(index + 1, 0, { id: Math.random().toString(36).substring(7), type: bucket.type, count: 1, resolution: bucket.resolution, connection: bucket.connection, features: [...(bucket.features || [])] });
                      }
                      return newBuckets;
                    })}
                    className="px-2.5 py-1 flex items-center gap-1 text-[11px] font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200 transition-colors"
                    title={t("dvg_add_var_title")}
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t("dvg_variant_btn")}</span>
                  </button>
                  {cameraBuckets.length > 1 && (
                    <button 
                      onClick={() => setCameraBuckets(prev => prev.filter(b => b.id !== bucket.id))}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                      title={t("dvg_remove_row")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Controls row: Quantity, Resolution & Connection Dropdowns */}
              <div className="grid gap-2 sm:gap-2.5 grid-cols-2 sm:grid-cols-3">
                {/* Quantity Dropdown */}
                <div className="relative">
                  <label className="block text-[10px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    {t("wz_quantity")}
                  </label>
                  <select
                    value={bucket.count}
                    onChange={(e) => {
                      const newCount = parseInt(e.target.value, 10);
                      setCameraBuckets(prev => prev.map(b => b.id === bucket.id ? { ...b, count: newCount } : b));
                    }}
                    className="w-full py-2 px-3 text-xs sm:text-sm font-bold bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-8 transition-all"
                  >
                    {Array.from(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 24, 32, bucket.count])).sort((a,b)=>a-b).map(num => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? t("wz_camera") : t("wz_cameras")}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 bottom-2.5 pointer-events-none" />
                </div>

                {/* Resolution Dropdown */}
                <div className="relative">
                  <label className="block text-[10px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    {t("wz_resolution")}
                  </label>
                  <select
                    value={bucket.resolution}
                    onChange={(e) => {
                      const newRes = e.target.value;
                      setCameraBuckets(prev => prev.map(b => b.id === bucket.id ? { ...b, resolution: newRes } : b));
                    }}
                    className="w-full py-2 px-3 text-xs sm:text-sm font-bold bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-8 transition-all"
                  >
                    {getResolutionsForBucket(bucket).map(r => (
                      <option key={r} value={r}>
                        {r} {r === '2MP' ? t('wz_2mp_full_hd') : r === '3MP' ? t('wz_3mp_2k') : r === '4MP' ? t('wz_4mp_ultra_hd') : r === '5MP' ? t('wz_5mp_pro_clarity') : r === '8MP' ? t('wz_8mp_4k_ultra') : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 bottom-2.5 pointer-events-none" />
                </div>

                {/* Connection Dropdown - Seamless per-camera toggling */}
                {(
                  <div className="relative col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                      {t("dvg_connection")}
                    </label>
                    <select
                      value={bucket.connection || (activeTech === 'wireless' ? 'wifi' : 'wired')}
                      onChange={(e) => {
                        const newConn = e.target.value as "wired" | "wifi" | "4g";
                        const next = cameraBuckets.map(b => b.id === bucket.id ? { ...b, connection: newConn } : b);
                        setCameraBuckets(next);
                        const hasW = next.some(b => b.connection === "wired" || !b.connection);
                        const hasWifi = next.some(b => b.connection === "wifi" || b.connection === "4g");
                        if (hasW && hasWifi) {
                          setActiveTech("hybrid");
                          setShowModeSwitcher(false);
                        } else if (hasWifi && !hasW) {
                          setActiveTech("wireless");
                        } else if (hasW && !hasWifi) {
                          setActiveTech("hd");
                        }
                      }}
                      className="w-full py-2 px-3 text-xs sm:text-sm font-bold bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-8 transition-all"
                    >
                      <option value="wired">{t("dvg_conn_wired")}</option>
                      <option value="wifi">{t("dvg_conn_wifi")}</option>
                      <option value="4g">{t("dvg_conn_4g")}</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 bottom-2.5 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Per-Bucket Specific Features */}
              <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800/80">
                <div className="flex flex-wrap items-center justify-between mb-1.5 gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                    {t("dvg_features_cam", "Features ({count} cameras):", { count: String(bucket.count) })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>{t("dvg_feat_guide")}</span>
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Weatherproof IP67 is standard on all outdoor cameras */}
                  {bucket.type === 'outdoor' && (
                    <span 
                      title={t("dvg_ip67_title")}
                      className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1 select-none"
                    >
                      <span>🌧️</span>
                      <span>{t("dvg_ip67_std")}</span>
                      <span className="text-[9px] bg-emerald-600 text-white px-1 rounded-sm font-semibold">{t("dvg_std_badge")}</span>
                    </span>
                  )}

                  {/* 4G SIM is standard when 4G connection is selected */}
                  {bucket.connection === '4g' && (
                    <span className="px-2 py-1 text-[11px] font-bold rounded-lg bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 flex items-center gap-1 select-none">
                      <span>🛰️</span>
                      <span>{t("dvg_4g_cell")}</span>
                      <span className="text-[9px] bg-purple-600 text-white px-1 rounded-sm font-semibold">{t("dvg_built_in")}</span>
                    </span>
                  )}

                  {/* Toggleable features - Dynamically filtered to only show features available in active product inventory */}
                  {getAvailableFeaturesForBucket(bucket).map(feat => {
                    const isChecked = (bucket.features || []).includes(feat.tag);
                    return (
                      <button
                        key={feat.tag}
                        type="button"
                        onClick={() => toggleBucketFeature(bucket.id, feat.tag)}
                        title={feat.title}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 border cursor-pointer ${
                          isChecked
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800/80 dark:text-zinc-200 dark:border-zinc-700 hover:text-blue-600"
                        }`}
                      >
                        <span>{feat.label}</span>
                        {isChecked ? (
                          <span className="text-[10px] ml-0.5 font-bold">✓</span>
                        ) : (
                          <span className="text-[10px] text-gray-400 ml-0.5">+</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Informative feature badge for this bucket */}
              <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800/80">
                <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  <span className="text-xs">
                    {bucket.connection === "wifi" ? "📶" : bucket.connection === "4g" ? "🛰️" : "🔌"}
                  </span>
                  <span className="leading-snug">
                    {bucket.connection === "wifi" ? (
                      bucket.type === "outdoor" ? t("dvg_line_wifi_out") : t("dvg_line_wifi_in")
                    ) : bucket.connection === "4g" ? (
                      bucket.type === "outdoor" ? t("dvg_line_4g_out") : t("dvg_line_4g_in")
                    ) : (
                      bucket.type === "outdoor"
                        ? t("dvg_line_wired_out", "Outdoor Bullet • Central {rec} + Cabling", { rec: activeTech === "ip" ? "NVR" : "DVR" })
                        : t("dvg_line_wired_in", "Indoor Dome • Central {rec} + Cabling", { rec: activeTech === "ip" ? "NVR" : "DVR" })
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex gap-3 mt-2">
             <button 
               onClick={() => setCameraBuckets(prev => [...prev, { id: Math.random().toString(36).substring(7), type: "outdoor", count: 1, resolution: "2MP", connection: activeTech === "wireless" ? "wifi" : "wired", features: [] }])}
               className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-4 py-2 rounded-full border border-blue-200/60 dark:border-blue-800/50 shadow-xs transition-colors"
             >
               <span>+</span>  {t("wz_add_outdoor")}
                                       </button>
             <button 
               onClick={() => setCameraBuckets(prev => [...prev, { id: Math.random().toString(36).substring(7), type: "indoor", count: 1, resolution: "2MP", connection: activeTech === "wireless" ? "wifi" : "wired", features: [] }])}
               className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-4 py-2 rounded-full border border-blue-200/60 dark:border-blue-800/50 shadow-xs transition-colors"
             >
               <span>+</span>  {t("wz_add_indoor")}
                                       </button>
          </div>
        </div>
      </div>

      {variants.length === 0 && (
        <div className="w-full">
          {outdoorCount + indoorCount > 16 ? (
            <div className="w-full max-w-4xl mx-auto border border-blue-100 dark:border-blue-900/30 rounded-2xl overflow-hidden bg-white dark:bg-[#1d1d1f] shadow-sm mt-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-blue-50/80 dark:bg-blue-900/20 p-6 text-center border-b border-blue-100 dark:border-blue-900/30">
                <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-300 mb-2">{t("dvg_custom_title")}</h3>
                <p className="text-blue-700/80 dark:text-blue-400/80 max-w-xl mx-auto">
                  {t("dvg_custom_desc", "A {count}-camera installation requires specialized design. Our experts will prepare a custom quote for you.", { count: String(outdoorCount + indoorCount) })}
                </p>
              </div>
              <div className="p-6 md:p-8 bg-slate-50 dark:bg-zinc-900/30">
                <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800">
                  <BookSurveyClient />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 md:py-12 bg-white dark:bg-[#1d1d1f] rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700">
              <p className="text-slate-500 dark:text-zinc-400 font-medium">{t("wz_no_packages_found_for_these_fi")}</p>
              <Button variant="link" onClick={() => { setActiveBrand("all"); setCameraBuckets(prev => prev.map(b => ({ ...b, resolution: "2MP" }))); }}>{t("wz_clear_filters")}</Button>
            </div>
          )}
        </div>
      )}

      {variants.length > 0 && (
        <div className="mt-8 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white">{t("wz_available_packages")}</h2>
            {activeTech === "hybrid" && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {hybridWiredTech === "all" ? t("dvg_filter_all") : hybridWiredTech === "ip" ? t("dvg_filter_ip") : t("dvg_filter_hd")}
              </span>
            )}
          </div>

          {activeTech === "hybrid" && (
            <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/50 rounded-xl p-3 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  {t("dvg_hybrid_guide_title")}
                </p>
                <p className="text-[11.5px] text-purple-800 dark:text-purple-300 leading-relaxed">
                  • <strong>{t("dvg_hybrid_hd_label")}</strong> {t("dvg_hybrid_hd_desc")}<br />
                  • <strong>{t("dvg_hybrid_ip_label")}</strong> {t("dvg_hybrid_ip_desc")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`grid gap-6 ${variants.length === 1 ? "max-w-md mx-auto" : variants.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-2 lg:grid-cols-3"}`}>
        {variants.map((variant, idx) => {
          if (!variant.camera_device) return null;
          const isSelectedForCompare = selectedCompareItems.some(i => i.camera_device?.id === variant.camera_device?.id && i.plan_type === variant.plan_type);
          
          return (
            <Card 
              key={idx} 
              onClick={() => onSelectCheckout(variant)}
              className={`group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 ${isSelectedForCompare ? "ring-2 ring-blue-600 shadow-lg" : "hover:shadow-md border-[#d2d2d7] dark:border-[#424245]"}`}
            >
              {variant.is_economy_storage && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-b-xl z-10 flex items-center gap-1 shadow-sm">
                  <Tag className="w-3 h-3" />  {t("wz_economy_match")}
                                          </div>
              )}
              {((variant as any).hybridWiredTech && totalWiredCount > 0 && totalWifiCount > 0) && (
                <div className={`absolute top-0 right-3 px-2.5 py-0.5 rounded-b-lg text-[9px] font-black uppercase tracking-wider z-10 shadow-2xs ${
                  (variant as any).hybridWiredTech === "IP"
                    ? "bg-purple-600 text-white"
                    : "bg-indigo-600 text-white"
                }`}>
                  {(variant as any).hybridWiredTech === "IP" ? t("dvg_badge_ip_hybrid") : t("dvg_badge_hd_hybrid")}
                </div>
              )}
              
              <CardContent className="py-4 md:py-8 px-5 flex flex-col items-center justify-center min-h-[180px]">
                <div className="text-center w-full">
                  <div className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5 flex items-center justify-center gap-1.5 flex-wrap">
                    <span>{variant.camera_device?.brand || "Budget"}</span>
                    {(() => {
                      const b = (variant.camera_device?.brand || "").toLowerCase();
                      if (b.includes("hikvision")) return <span className="text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 px-2 py-0.5 rounded-full">{t("dvg_brand_hik")}</span>;
                      if (b.includes("cp") || b.includes("plus")) return <span className="text-[9px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200 px-2 py-0.5 rounded-full">{t("dvg_brand_cp")}</span>;
                      if (b.includes("trueview")) return <span className="text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 px-2 py-0.5 rounded-full">{t("dvg_brand_tv")}</span>;
                      if (b.includes("prama")) return <span className="text-[9px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200 px-2 py-0.5 rounded-full">{t("dvg_brand_prama")}</span>;
                      return null;
                    })()}
                  </div>
                  <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                    {variant.camera_device.derivedResolution || "2MP Resolution"}
                  </h3>
                  
                  {/* Key Difference Badge */}
                  {variant.key_difference && (
                    <div className="mb-2 flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-2xs ${
                        (variant as any).sensor_type === "colorvu"
                          ? "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800"
                          : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800"
                      }`}>
                        <span>{variant.key_difference}</span>
                      </span>
                    </div>
                  )}
                  
                  {/* Hybrid Architecture Breakdown Badge */}
                  {(totalWiredCount > 0 && totalWifiCount > 0) && (
                    <div className="flex flex-col items-center gap-1 mb-2">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border shadow-2xs ${
                        (variant as any).hybridWiredTech === "IP"
                          ? "bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200"
                          : "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                      }`}>
                        {(variant as any).hybridWiredTech === "IP" ? (
                          <>
                            <span className="text-purple-600 dark:text-purple-400">{t("dvg_card_ip_hybrid")}</span>
                            <span>{t("dvg_hybrid_ip_mix", "{wired} Wired (IP NVR & PoE) + {wifi}", { wired: String(totalWiredCount), wifi: `${totalWifiCount} ${t("dvg_wireless_full")}` })}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-indigo-600 dark:text-indigo-400">{t("dvg_card_hd_hybrid")}</span>
                            <span>{t("dvg_hybrid_hd_mix", "{wired} Wired (HD DVR) + {wifi}", { wired: String(totalWiredCount), wifi: `${totalWifiCount} ${t("dvg_wireless_full")}` })}</span>
                          </>
                        )}
                      </div>
                      <span className="text-[9.5px] font-medium text-slate-500 dark:text-zinc-400">
                        {(variant as any).hybridWiredTech === "IP"
                          ? t("dvg_ip_hw_line")
                          : t("dvg_hd_hw_line")}
                      </span>
                    </div>
                  )}
                  
                  {/* Package Feature Badges */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2.5">
                    {colorCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1">
                        <span>🌙</span> {t("est_res_color")}
                      </span>
                    )}
                    {micCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 flex items-center gap-1">
                        <span>🎙️</span> {t("feat_mic")}
                      </span>
                    )}
                    {outdoorCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                        <span>🌧️</span> {t("dvg_ip67_std")}
                      </span>
                    )}
                    {twoWayCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 flex items-center gap-1">
                        <span>🗣️</span> {t("dvg_2way_talk")}
                      </span>
                    )}
                    {ptzCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 flex items-center gap-1">
                        <span>🔄</span> {t("dvg_feat_ptz")}
                      </span>
                    )}
                    {cellularCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 flex items-center gap-1">
                        <span>🛰️</span> {t("dvg_feat_4g")}
                      </span>
                    )}
                  </div>
                  {(variant as any).substitution_message && (
                    <p className="text-[11px] text-amber-700 font-medium mb-3 max-w-[95%] mx-auto bg-amber-50 px-2 py-1 rounded-md border border-amber-200 leading-tight">
                      {(variant as any).substitution_message}
                    </p>
                  )}
                  {variant.is_economy_storage && (
                    <div className="flex flex-col items-center justify-center mb-3 gap-1">
                      <p className="text-xs text-[#86868b] font-medium">
                        {variant.technology === "Wireless"
                          ? t("dvg_basic_storage_wifi", undefined, { cap: variant.storage_device?.derivedCapacity || "64GB MicroSD" })
                          : variant.technology === "Hybrid" && (variant as any).secondary_storage_device
                          ? t("dvg_basic_storage_hybrid", "Basic: {hdd} + {sd}/Wi-Fi Cam", {
                              hdd: variant.storage_device?.derivedCapacity || "500GB HDD",
                              sd: (variant as any).secondary_storage_device?.derivedCapacity || "32GB MicroSD",
                            })
                          : t("dvg_basic_storage_wired", undefined, { cap: variant.storage_device?.derivedCapacity || "500GB HDD" })
                        }
                      </p>
                      {(variant as any).original_payable && (variant as any).original_payable > variant.total_payable ? (
                        <p className="text-[11px] bg-green-50 text-green-700 px-2.5 py-1 rounded-md border border-green-200 font-bold inline-block">
                          {t("dvg_save_backup", undefined, {
                            amount: ((variant as any).original_payable - variant.total_payable).toLocaleString('en-IN'),
                            days: String(variant.storage_days),
                            reqDays: String((variant as any).requested_days),
                          })}
                        </p>
                      ) : null}
                    </div>
                  )}
                  {!variant.is_economy_storage && variant.is_economy_storage !== undefined && (
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium mb-2">
                      {variant.technology === "Wireless"
                        ? t("dvg_req_storage_wifi", undefined, { cap: variant.storage_device?.derivedCapacity || "128GB MicroSD", days: String(variant.storage_days) })
                        : variant.technology === "Hybrid" && (variant as any).secondary_storage_device
                        ? t("dvg_req_storage_hybrid", "Storage: {hdd} (Wired) + {sd}/Wi-Fi Cam · ~{days} Days", {
                            hdd: variant.storage_device?.derivedCapacity || "1TB",
                            sd: (variant as any).secondary_storage_device?.derivedCapacity || "64GB MicroSD",
                            days: String(variant.storage_days),
                          })
                        : `${t("wz_requested_storage_")}${variant.storage_device?.derivedCapacity || "1TB"}) · ~${variant.storage_days} ${t("wz_days")}`
                      }
                    </p>
                  )}

                  {/* Refurbished / Economy Storage Transparency Alert */}
                  {variant.storage_device?.is_refurbished && (
                    <div className="w-full my-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-[11px] font-bold flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="leading-snug text-left">
                          {variant.technology === "Wireless"
                            ? t("dvg_econ_alert_wifi", undefined, { days: String(variant.storage_days) })
                            : t("dvg_econ_alert_wired", undefined, { days: String(variant.storage_days) })
                          }
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowStorageModal(true);
                        }}
                        className="text-[10px] font-extrabold text-amber-800 dark:text-amber-200 hover:underline flex items-center gap-0.5 shrink-0 ml-1 cursor-pointer bg-amber-100/90 dark:bg-amber-900/60 px-1.5 py-0.5 rounded-md"
                        title={t("dvg_advisory_title")}
                      >
                        <span>{t("dvg_advisory")}</span>
                        <Info className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {!variant.storage_device?.is_refurbished && variant.storage_device && (
                    <div className="w-full my-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {variant.technology === "Wireless"
                          ? t("dvg_sd_assurance", "100% High Endurance MicroSD · ~{days} Days Backup per Camera · Official Warranty", { days: String(variant.storage_days) })
                          : variant.technology === "Hybrid" && (variant as any).secondary_storage_device
                          ? t("dvg_hybrid_assurance", "100% Genuine {brand} HDD + High Endurance MicroSD · ~{days} Days · Official Warranty", {
                              brand: variant.storage_device?.brand || "Surveillance",
                              days: String(variant.storage_days),
                            })
                          : t("dvg_hdd_assurance", "100% Genuine 24×7 {brand} HDD · ~{days} Days Backup · 3-Yr Warranty", { brand: variant.storage_device?.brand || "Surveillance", days: String(variant.storage_days) })
                        }
                      </span>
                    </div>
                  )}
                  <div className="flex items-start justify-center">
                    <span className="text-[32px] sm:text-[40px] leading-none font-extrabold text-[#1d1d1f] dark:text-white tracking-tight">
                      ₹{variant.total_payable.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                    {t("dvg_or_from")} <span className="text-blue-600 dark:text-blue-400 font-bold">{t("dvg_per_mo_emi", "{amt}/mo (EMI)", { amt: `₹${Math.round((variant.total_payable * 1.06) / 12).toLocaleString('en-IN')}` })}</span>
                  </div>
                  <div className="mt-3 w-full">
                    <div className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all group-hover:bg-blue-700">
                      <span>{t("dvg_select_proceed")}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 w-full flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onPriceMatch) {
                          onPriceMatch(variant, variants);
                        } else {
                          onSelectCheckout(variant);
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 transition-all hover:scale-[1.02] shadow-xs cursor-pointer w-full"
                    >
                      <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{t("dvg_match_price")}</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Educational Layman Guide Modal */}
      <TagGuideModal 
        isOpen={showGuideModal} 
        onClose={() => setShowGuideModal(false)} 
      />

      {/* Storage Transparency & Advisory Modal */}
      <StorageAdvisoryModal
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
        onUpgradeTo1TB={() => setSelectedStorageDays(15)}
        currentDays={selectedStorageDays}
      />
    </div>
  );
}
