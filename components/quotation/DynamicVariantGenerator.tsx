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
  // Check if hybrid setup (both wired and wireless cameras requested)
  const isHybridInitial = (Number(selection.wifi_camera_count) > 0 && (Number(selection.outdoor_camera_count) > 0 || Number(selection.indoor_camera_count) > 0)) || selection.technology === "hybrid" || (selection as any).is_hybrid;

  // Auto-select based on selection.technology, session storage, or default
  const [activeTech, setActiveTech] = useState<"hd" | "ip" | "wireless" | "hybrid">(() => {
    if (isHybridInitial) return "hybrid";
    const selTech = String(selection.technology || "").toLowerCase();
    if (selTech === "wireless" || selTech === "wifi") return "wireless";
    if (selTech === "hybrid") return "hybrid";
    if (selTech === "ip") return "ip";
    if (selTech === "hd") return "hd";
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('quote_active_tech');
      if (saved === 'hd' || saved === 'ip' || saved === 'wireless' || saved === 'hybrid') return saved as any;
    }
    return "hd";
  });
  
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
    } else if (selTech === "wireless" || selTech === "wifi") {
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
        else if (tLower.includes("wifi") || tLower.includes("wireless") || techStr === "WIRELESS" || techStr === "WIFI") conn = "wifi";
        else if (activeTech === "wireless") conn = "wifi";

        return {
          id: Math.random().toString(36).substring(7),
          type: tLower.includes("outdoor") ? "outdoor" : "indoor",
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
    // If hybrid setup has wifi cameras and we are in wired tab:
    if (!isWirelessMode && wifiCount > 0) {
      const wifiIn = Number((selection as any).wifi_indoor_count);
      const wifiOut = Number((selection as any).wifi_outdoor_count);
      if (!isNaN(wifiIn) && !isNaN(wifiOut) && (wifiIn > 0 || wifiOut > 0)) {
        if (wifiIn > 0) {
          buckets.push({ id: Math.random().toString(36).substring(7), type: "indoor", count: wifiIn, resolution: "3MP", connection: "wifi", features: [...initFeats, "ptz", "2-way"] });
        }
        if (wifiOut > 0) {
          buckets.push({ id: Math.random().toString(36).substring(7), type: "outdoor", count: wifiOut, resolution: "3MP", connection: "wifi", features: [...initFeats, "color"] });
        }
      } else {
        buckets.push({ id: Math.random().toString(36).substring(7), type: "indoor", count: wifiCount, resolution: "3MP", connection: "wifi", features: [...initFeats, "ptz", "2-way"] });
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
      available.push({ tag: "color", label: "🌙 24/7 Color", title: "Full color video in darkness (ColorVu / Dual-Light)" });
    }
    if (hasMic) {
      available.push({ tag: "mic", label: "🎙️ Audio Mic", title: "Record spoken voice & sound along with video" });
    }
    if (hasTwoWay) {
      available.push({ tag: "2-way", label: "🗣️ 2-Way Talk", title: "Speak & listen live via mobile phone app" });
    }
    if (hasPtz) {
      available.push({ tag: "ptz", label: "🔄 360° PTZ", title: "Motorized rotation remotely from phone" });
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

  const variants = useMemo(() => {
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
    let mixedReqs: any[] = cameraBuckets.filter(b => b.count > 0).map(b => {
        const conn = isWireless ? (b.connection === "4g" ? "4g" : "wifi") : (b.connection || "wired");
        const bucketResList = getResolutionsForBucket(b);
        const res = bucketResList.includes(b.resolution) ? b.resolution : (bucketResList.includes("3MP") ? "3MP" : (bucketResList.includes("2MP") ? "2MP" : (bucketResList[0] || "2MP")));

        let baseFeatures: string[] = [];
        if (conn === "4g") {
          baseFeatures = b.type === "outdoor" ? ["outdoor", "4g", "sim"] : ["indoor", "4g", "sim"];
        } else if (conn === "wifi") {
          baseFeatures = b.type === "outdoor" ? ["bullet", "wireless", "wifi"] : ["dome", "wireless", "wifi", "ptz"];
        } else {
          baseFeatures = b.type === "outdoor" ? ["bullet", "outdoor"] : ["dome", "indoor"];
        }
        // Merge bucket-specific features (e.g., mic, color, 2-way) if any
        const extra = b.features && Array.isArray(b.features) ? b.features : [];
        const allFeatures = Array.from(new Set([...baseFeatures, ...extra]));

        if (conn === "4g") {
          return {
            type: b.type === "outdoor" ? "Outdoor 4G SIM Camera" : "Indoor 4G SIM Camera",
            count: b.count,
            resolution: res,
            technology: "Wireless",
            features: allFeatures
          };
        }
        if (conn === "wifi") {
          return {
            type: b.type === "outdoor" ? "Outdoor Wi-Fi Camera" : "Indoor Wi-Fi Camera",
            count: b.count,
            resolution: res,
            technology: "Wireless",
            features: allFeatures
          };
        }
        return {
          type: b.type === "outdoor" ? "Outdoor Bullet Camera" : "Indoor Dome Camera",
          count: b.count,
          resolution: res,
          technology: activeTech === "ip" ? "IP" : "HD",
          features: allFeatures
        };
      });
    const enrich = (pricing: any, brandKey: string, brandName: string) => {
      if (!pricing || pricing.error) return null;
      const camItems = pricing.items?.filter((i: any) => effectiveProducts.find(p => p.id === i.product_id)?.category === "cctv_camera");
      const firstCamId = camItems?.[0]?.product_id;
      const camera_device = effectiveProducts.find(p => p.id === firstCamId) ? { ...effectiveProducts.find(p => p.id === firstCamId) } : undefined;
      const strItem = pricing.items?.find((i: any) => effectiveProducts.find(p => p.id === i.product_id)?.category === "storage");
      const strId = strItem?.product_id;
      const storage_device = effectiveProducts.find(p => p.id === strId) ? { ...effectiveProducts.find(p => p.id === strId) } : undefined;
      let actualCalculatedDays = 7;
      
      if (camera_device) {
        (camera_device as any).brand = brandName;
      }
      if (storage_device) {
        let cap = (storage_device as any).capacity;
        if (!cap) {
          const capStr = ((storage_device as any).technical_name || (storage_device as any).display_name || "").toUpperCase();
          const gbMatch = capStr.match(/(\d+)\s*GB/i);
          const tbMatch = capStr.match(/(\d+)\s*TB/i);
          if (gbMatch) cap = `${gbMatch[1]}GB`;
          else if (tbMatch) cap = `${tbMatch[1]}TB`;
          else if ((storage_device as any).storage_capacity_tb) {
            const tbVal = (storage_device as any).storage_capacity_tb;
            cap = tbVal < 1 ? `${Math.round(tbVal * 1000)}GB` : `${tbVal}TB`;
          }
        }
        const isSd = (storage_device as any).subcategory === "sd_card" || ((storage_device as any).display_name || "").toLowerCase().includes("sd") || ((storage_device as any).display_name || "").toLowerCase().includes("microsd");
        (storage_device as any).derivedCapacity = cap ? (isSd ? `${cap} MicroSD` : cap) : (isSd ? "MicroSD" : "HDD");
        
        const isRefurb = 
          (storage_device as any).is_refurbished === true ||
          (storage_device as any).brand === "Budget Brand" ||
          ((storage_device as any).brand || "").toLowerCase().includes("budget") ||
          ((storage_device as any).id || "").startsWith("HDD-BUD-") ||
          (typeof cap === "string" && cap.includes("500GB"));
        (storage_device as any).is_refurbished = isRefurb;

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
          const isIP = activeTech === "ip";
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
        substitutionNotes.push(`${outdoorProvided} Outdoor`);
      }
      if (indoorRequested && indoorProvided && indoorRequested !== indoorProvided) {
        substitutionNotes.push(`${indoorProvided} Indoor`);
      }

      let substitutionMessage = "";
      if (substitutionNotes.length > 0) {
        substitutionMessage = `💡 Includes ${substitutionNotes.join(" and ")} upgrade based on brand availability.`;
      }

      // Deduplicate
      const uniqueActualRes = Array.from(new Set(actualResolutions));
      
      // If we couldn't find any resolutions in the items, fallback to the requested ones
      const resolvedRes = uniqueActualRes.length > 0 ? uniqueActualRes : Array.from(new Set(mixedReqs.map(r => r.resolution)));
      const isHybrid = resolvedRes.length > 1;
      let displayResolution = resolvedRes[0] ? `${resolvedRes[0]} ${t("wz_resolution")}` : `2MP ${t("wz_resolution")}`;
      
      if (totalWiredCount > 0 && totalWifiCount > 0) {
        displayResolution = `${totalWiredCount} Wired + ${totalWifiCount} Smart Wi-Fi`;
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
        camera_device: camera_device ? { ...camera_device, derivedResolution: displayResolution } : { derivedResolution: displayResolution, brand: brandName }, 
        storage_device, 
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

    brandsToGenerate.forEach(b => {
      const uniqueRes = Array.from(new Set(mixedReqs.map(r => r.resolution)));
      const planType = b.brandKey === "budget" ? "budget" : (uniqueRes.includes("8MP") ? "premium" : "recommended");
      const isEconomy = selectedStorageDays === 7;
      const targetStorageTB = isEconomy ? 0.5
        : selectedStorageDays === 15 ? 1.0
        : selectedStorageDays === 30 ? 2.0
        : selectedStorageDays === 60 ? 4.0 : 1.0;
      const sel: ConfiguratorSelection = {
        ...selection,
        technology: (activeTech === "wireless" ? "Wireless" : activeTech === "ip" ? "IP" : "HD") as any,
        brand_preference: b.brand,
        mixed_camera_requirements: mixedReqs,
        outdoor_camera_count: cameraBuckets.filter(b => b.type === "outdoor" && b.connection !== "wifi" && b.connection !== "4g").reduce((sum, b) => sum + b.count, 0),
        indoor_camera_count: cameraBuckets.filter(b => b.type === "indoor" && b.connection !== "wifi" && b.connection !== "4g").reduce((sum, b) => sum + b.count, 0),
        wifi_camera_count: totalWifiCount,
        camera_count: totalHardwareCount,
        resolution_preference: uniqueRes.length === 1 ? uniqueRes[0] : "5MP",
        plan_type: isEconomy ? "budget" : (planType as any),
        recording_days: selectedStorageDays,
        is_economy_storage: isEconomy as any,
        target_storage_tb: targetStorageTB,
      };
      
      // Standard Quote for currently selected storage retention
      const rawPricing = calculatePricing({
        selection: sel, products: effectiveProducts, addons, settings, cablingDone, cablingMeters,
        referralDiscountPercent: promoterDiscount?.percent || 0,
        referralDiscountFlat: promoterDiscount?.flat || 0,
        evaluatedAddonRules, activeOffer,
      });
      
      const enriched = enrich(rawPricing, b.brandKey, b.brand);
      if (enriched) {
        enriched.is_economy_storage = isEconomy;
        results.push(enriched);
      }
    });

    // Sort packages by price (low to high)
    results.sort((a, b) => a.total_payable - b.total_payable);
    
    // Tag the recommended item (middle item of default sort, non-economy)
    const recIndex = Math.floor(results.length / 2);
    results.forEach((v, idx) => {
      (v as any).is_recommended = (idx === recIndex && results.length > 1 && !v.is_economy_storage);
    });

    return results;
  }, [activeTech, targetBrand, cameraBuckets, isMixed, hasOutdoor, hasIndoor, outdoorCount, indoorCount, selection, products, addons, settings, cablingDone, cablingMeters, promoterDiscount, evaluatedAddonRules, activeOffer, availableResolutions, selectedStorageDays]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Quick guide details */}
      <div className="w-full max-w-2xl mx-auto">
        <details className="w-full group bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl overflow-hidden text-xs sm:text-sm">
          <summary className="px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between cursor-pointer font-medium text-blue-900 dark:text-blue-200 select-none">
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm">How to customize this quote</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              <span className="group-open:hidden">Quick guide</span>
              <span className="hidden group-open:inline">Hide</span>
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div className="px-3 pb-3 pt-1 sm:px-4 text-blue-800/90 dark:text-blue-300/90 text-xs leading-relaxed border-t border-blue-100/60 dark:border-blue-900/40">
            Choose your preferred technology and brand, then adjust camera quantities and resolutions. Use <strong>+ Variant</strong> if you need multiple resolutions (e.g., two 2MP cameras and two 5MP cameras) in the same package.
          </div>
        </details>
      </div>

      {/* Sticky Filter Bar: Technology & Brand Selectors */}
      <div className="sticky top-14 md:top-20 z-30 w-full max-w-2xl mx-auto bg-[#f5f5f7]/95 dark:bg-black/95 backdrop-blur-md pt-1.5 pb-2 px-2 sm:px-3 border-b border-zinc-200/80 dark:border-zinc-800/80 shadow-xs sm:rounded-2xl transition-all space-y-2">
        {/* Technology Selector - Segmented Switcher */}
        <div className="w-full bg-zinc-100 dark:bg-zinc-800/70 p-1 rounded-2xl sm:rounded-full grid grid-cols-2 sm:grid-cols-4 gap-1 shadow-inner border border-zinc-200/50 dark:border-zinc-700/50">
          <button
            type="button"
            onClick={() => { setActiveTech("hd"); setCameraBuckets(prev => prev.map(b => ({ ...b, connection: "wired" }))); }}
            className={`relative z-10 px-1 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl sm:rounded-full transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${activeTech === "hd" ? "bg-blue-600 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"}`}
          >
            <span className="truncate">
              <span className="sm:hidden">HD Analog</span>
              <span className="hidden sm:inline">{t("wz_standard_hd_analog")}</span>
            </span>
            <span className={`text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-tight sm:tracking-wider ${activeTech === 'hd' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'}`}>
              {t("wz_lowest_price")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTech("ip"); setCameraBuckets(prev => prev.map(b => ({ ...b, connection: "wired" }))); }}
            className={`relative z-10 px-1 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl sm:rounded-full transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${activeTech === "ip" ? "bg-blue-600 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"}`}
          >
            <span className="truncate">
              <span className="sm:hidden">IP Network</span>
              <span className="hidden sm:inline">{t("wz_premium_ip_network")}</span>
            </span>
            <span className={`text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight sm:tracking-wider ${activeTech === 'ip' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}`}>
              Popular
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTech("wireless"); setCameraBuckets(prev => prev.map(b => ({ ...b, connection: b.connection === "4g" ? "4g" : "wifi" }))); }}
            className={`relative z-10 px-1 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl sm:rounded-full transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${activeTech === "wireless" ? "bg-blue-600 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"}`}
          >
            <span className="truncate">
              <span className="sm:hidden">Wireless</span>
              <span className="hidden sm:inline">Smart Wireless</span>
            </span>
            <span className={`text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-tight sm:tracking-wider ${activeTech === 'wireless' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300'}`}>
              {selection.power_wiring_option === "wire_needed" ? "No Video Cable" : "0 Wiring"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTech("hybrid");
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
            <span className="truncate">
              <span className="sm:hidden">⚡ Hybrid</span>
              <span className="hidden sm:inline">⚡ Hybrid Setup</span>
            </span>
            <span className={`text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-tight sm:tracking-wider ${activeTech === 'hybrid' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'}`}>
              Wired + Smart Wireless
            </span>
          </button>
        </div>

        {/* Brand Selector */}
        <div className="w-full relative">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 max-w-full scrollbar-none px-0.5">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mr-1 shrink-0">
              {t("wz_brand")}:
            </span>
            {availableBrands.map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setActiveBrand(b)}
                className={`px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs font-semibold rounded-full border transition-all shrink-0 ${activeBrand === b ? "bg-blue-600 text-white border-blue-600 shadow-xs dark:bg-blue-600 dark:text-white" : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-blue-400 hover:text-blue-600"}`}
              >
                {BRAND_DISPLAY[b] || getCanonicalBrandName(b) || b}
              </button>
            ))}
          </div>
        </div>
        {/* Live Storage Retention Days Selector */}
        <div className="w-full pt-1.5 border-t border-zinc-200/70 dark:border-zinc-800/70 flex flex-wrap items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              💾 Recording Retention:
            </span>
          </div>
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl text-xs font-semibold overflow-x-auto">
            {(activeTech === "wireless" ? [
              { days: 7, label: "7 Days (32GB)" },
              { days: 15, label: "15 Days (64GB) Rec." },
              { days: 30, label: "30 Days (128GB)" },
              { days: 60, label: "60 Days (256GB)" }
            ] : [
              { days: 7, label: "7 Days (500GB)" },
              { days: 15, label: "15 Days (1TB) Rec." },
              { days: 30, label: "30 Days (2TB)" },
              { days: 60, label: "60 Days (4TB)" }
            ]).map(opt => (
              <button
                key={opt.days}
                type="button"
                onClick={() => setSelectedStorageDays(opt.days)}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all text-[10px] sm:text-[11px] whitespace-nowrap cursor-pointer ${
                  selectedStorageDays === opt.days 
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-extrabold shadow-2xs border border-zinc-200 dark:border-zinc-700" 
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
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
                    Economy Storage (500GB · 1-Year Local Warranty)
                  </span>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                    ~8 Days Backup
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-snug">
                  Many competitors secretly bundle refurbished desktop HDDs to quote artificially low prices. For continuous 24×7 reliability, we recommend upgrading to 1TB.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setShowStorageModal(true)}
                className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline px-1.5 py-1 cursor-pointer whitespace-nowrap"
              >
                Learn More
              </button>
              <button
                type="button"
                onClick={() => setSelectedStorageDays(15)}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <span>Switch to 1TB Rec.</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 items-center">
        {/* Unified Mobile App Guarantee Banner for Hybrid Setup */}
        {(activeTech === "hybrid" || isHybridInitial) && (
          <div className="w-full max-w-2xl mx-auto p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs flex items-center gap-2.5 animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base shrink-0 shadow-xs">
              📱
            </div>
            <div className="text-[11px] sm:text-xs text-indigo-950 dark:text-indigo-200 leading-snug">
              <span className="font-bold text-indigo-700 dark:text-indigo-300">Unified Mobile App Guarantee:</span> All your Wired DVR cameras and Smart Wireless cameras will stream together inside a <strong>single mobile app (Hik-Connect / CP PLUS gCMOB)</strong>. Zero multiple apps!
            </div>
          </div>
        )}
        {/* Real-time System Composition & Specification Breakdown */}
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-[#1d1d1f] p-3 sm:p-3.5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                System Overview:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white shadow-xs">
                {totalHardwareCount} {totalHardwareCount === 1 ? t("wz_camera") : t("wz_cameras")} Total
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 cursor-pointer"
                title="View plain language explanations and practical real-life examples for every feature"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Feature Guide</span>
              </button>
              
              <button
                type="button"
                onClick={onOpenSpecsModal}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:underline px-2 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 cursor-pointer"
                title="Open system specifications wizard"
              >
                <span>⚙️ Checklist</span>
              </button>
            </div>
          </div>

          {/* Real-time Specification Breakup Tags */}
          <div className="flex flex-wrap items-center gap-1.5 py-0.5 text-[11px]">
            {outdoorCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🌧️</span> {outdoorCount} Weatherproof (IP67)
              </span>
            )}
            {indoorCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🏠</span> {indoorCount} Indoor
              </span>
            )}
            {colorCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🌙</span> {colorCount} Color Night
              </span>
            )}
            {micCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🎙️</span> {micCount} Audio
              </span>
            )}
            {twoWayCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🗣️</span> {twoWayCount} 2-Way
              </span>
            )}
            {ptzCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🔄</span> {ptzCount} 360° PTZ
              </span>
            )}
            {cellularCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🛰️</span> {cellularCount} 4G SIM
              </span>
            )}
            {wifiCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>📶</span> {wifiCount} Smart Wireless
              </span>
            )}
            {colorCount === 0 && micCount === 0 && twoWayCount === 0 && ptzCount === 0 && (
              <span className="text-gray-400 dark:text-zinc-500 text-[11px] italic">
                Tip: Toggle features below on each camera card as needed.
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
                    title="Add another resolution variant for this camera type"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Variant</span>
                  </button>
                  {cameraBuckets.length > 1 && (
                    <button 
                      onClick={() => setCameraBuckets(prev => prev.filter(b => b.id !== bucket.id))}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                      title="Remove this row"
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
                      Connection
                    </label>
                    <select
                      value={bucket.connection || (activeTech === 'wireless' ? 'wifi' : 'wired')}
                      onChange={(e) => {
                        const newConn = e.target.value as "wired" | "wifi" | "4g";
                        setCameraBuckets(prev => {
                          const next = prev.map(b => b.id === bucket.id ? { ...b, connection: newConn } : b);
                          const hasW = next.some(b => b.connection === "wired" || !b.connection);
                          const hasWifi = next.some(b => b.connection === "wifi" || b.connection === "4g");
                          if (hasW && hasWifi) {
                            setActiveTech("hybrid");
                          } else if (hasWifi && !hasW) {
                            setActiveTech("wireless");
                          } else if (hasW && !hasWifi) {
                            setActiveTech("hd");
                          }
                          return next;
                        });
                      }}
                      className="w-full py-2 px-3 text-xs sm:text-sm font-bold bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-8 transition-all"
                    >
                      <option value="wired">🔌 Wired (Coaxial/CAT6)</option>
                      <option value="wifi">📶 Smart Wireless (Wi-Fi)</option>
                      <option value="4g">🛰️ 4G SIM / Solar Standalone</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 bottom-2.5 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Per-Bucket Specific Features */}
              <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800/80">
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 truncate">
                    Features ({bucket.count} cameras):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Feature Guide</span>
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Weatherproof IP67 is standard on all outdoor cameras */}
                  {bucket.type === 'outdoor' && (
                    <span 
                      title="IP67 Weatherproof is standard on all our outdoor cameras (heavy monsoon rain, heat, & dust sealed)"
                      className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1 select-none"
                    >
                      <span>🌧️</span>
                      <span>IP67 Weatherproof</span>
                      <span className="text-[9px] bg-emerald-600 text-white px-1 rounded-sm font-semibold">Standard</span>
                    </span>
                  )}

                  {/* 4G SIM is standard when 4G connection is selected */}
                  {bucket.connection === '4g' && (
                    <span className="px-2 py-1 text-[11px] font-bold rounded-lg bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 flex items-center gap-1 select-none">
                      <span>🛰️</span>
                      <span>4G SIM Cellular</span>
                      <span className="text-[9px] bg-purple-600 text-white px-1 rounded-sm font-semibold">Built-in</span>
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
                  <span className="truncate">
                    {bucket.connection === "wifi" ? (
                      bucket.type === "outdoor" ? "Outdoor Wi-Fi Bullet • MicroSD • Zero Cable" : "Indoor 360° Wi-Fi Dome • MicroSD • Zero Cable"
                    ) : bucket.connection === "4g" ? (
                      bucket.type === "outdoor" ? "Outdoor 4G SIM Bullet • MicroSD • No Broadband" : "Indoor 4G SIM Dome • MicroSD • No Broadband"
                    ) : (
                      bucket.type === "outdoor" ? `Outdoor Bullet • Central ${activeTech === "ip" ? "NVR" : "DVR"} + Cabling` : `Indoor Dome • Central ${activeTech === "ip" ? "NVR" : "DVR"} + Cabling`
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
                <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-300 mb-2">Custom Solution Required</h3>
                <p className="text-blue-700/80 dark:text-blue-400/80 max-w-xl mx-auto">
                  A {outdoorCount + indoorCount}-camera installation requires specialized design. Our experts will prepare a custom quote for you.
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
        <div className="mt-8 mb-4">
          <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white">{t("wz_available_packages")}</h2>
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
              {(variant as any).is_recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-b-xl z-10 flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" />  {t("wz_recommended")}
                                          </div>
              )}
              {variant.is_economy_storage && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-b-xl z-10 flex items-center gap-1 shadow-sm">
                  <Tag className="w-3 h-3" />  {t("wz_economy_match")}
                                          </div>
              )}
              
              <CardContent className="py-4 md:py-8 px-5 flex flex-col items-center justify-center min-h-[180px]">
                <div className="text-center w-full">
                  <div className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5 flex items-center justify-center gap-1.5 flex-wrap">
                    <span>{variant.camera_device?.brand || "Budget"}</span>
                    {(() => {
                      const b = (variant.camera_device?.brand || "").toLowerCase();
                      if (b.includes("hikvision")) return <span className="text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 px-2 py-0.5 rounded-full">Global Leader • ColorVu Sensor</span>;
                      if (b.includes("cp") || b.includes("plus")) return <span className="text-[9px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200 px-2 py-0.5 rounded-full">India's #1 • 1500+ Service Centers</span>;
                      if (b.includes("trueview")) return <span className="text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 px-2 py-0.5 rounded-full">Specialist in 4G & Smart PTZ</span>;
                      if (b.includes("prama")) return <span className="text-[9px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200 px-2 py-0.5 rounded-full">Make-in-India Enterprise Grade</span>;
                      return null;
                    })()}
                  </div>
                  <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                    {variant.camera_device.derivedResolution || "2MP Resolution"}
                  </h3>
                  
                  {/* Hybrid Architecture Breakdown Badge */}
                  {(totalWiredCount > 0 && totalWifiCount > 0) && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-2 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 text-purple-800 dark:text-purple-300 text-[10px] font-extrabold uppercase tracking-wide">
                      <span>⚡ Hybrid:</span>
                      <span>{totalWiredCount} Wired (DVR) + {totalWifiCount} Smart Wireless</span>
                    </div>
                  )}
                  
                  {/* Package Feature Badges */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2.5">
                    {colorCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1">
                        <span>🌙</span> 24/7 Color Night
                      </span>
                    )}
                    {micCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 flex items-center gap-1">
                        <span>🎙️</span> Audio Mic
                      </span>
                    )}
                    {outdoorCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                        <span>🌧️</span> IP67 Weatherproof
                      </span>
                    )}
                    {twoWayCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 flex items-center gap-1">
                        <span>🗣️</span> 2-Way Talk
                      </span>
                    )}
                    {ptzCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 flex items-center gap-1">
                        <span>🔄</span> 360° PTZ
                      </span>
                    )}
                    {cellularCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 flex items-center gap-1">
                        <span>🛰️</span> 4G SIM
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
                          ? `Basic Storage (${variant.storage_device?.derivedCapacity || "64GB MicroSD"} per camera)`
                          : `Basic Storage (${variant.storage_device?.derivedCapacity || "500GB HDD"})`
                        }
                      </p>
                      {(variant as any).original_payable && (variant as any).original_payable > variant.total_payable ? (
                        <p className="text-[11px] bg-green-50 text-green-700 px-2.5 py-1 rounded-md border border-green-200 font-bold inline-block">
                          Save ₹{((variant as any).original_payable - variant.total_payable).toLocaleString('en-IN')} (~{variant.storage_days} Days Backup vs {(variant as any).requested_days} Days Requested)
                        </p>
                      ) : null}
                    </div>
                  )}
                  {!variant.is_economy_storage && variant.is_economy_storage !== undefined && (
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium mb-2">
                      {variant.technology === "Wireless"
                        ? `Requested Storage (${variant.storage_device?.derivedCapacity || "128GB MicroSD"} per camera) · ~${variant.storage_days} Days Backup`
                        : `${t("wz_requested_storage_")}${variant.storage_device?.derivedCapacity || "1TB"}) · ~${variant.storage_days} ${t("wz_days")}`
                      }
                    </p>
                  )}

                  {/* Refurbished / Economy Storage Transparency Alert */}
                  {variant.storage_device?.is_refurbished && (
                    <div className="w-full my-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-[11px] font-bold flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="truncate">
                          {variant.technology === "Wireless"
                            ? `Basic Storage · ~${variant.storage_days} Days Backup · 1-Yr Local`
                            : `Basic 500GB HDD · ~${variant.storage_days} Days Backup · 1-Yr Local`
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
                        title="Read about storage types & warranty transparency"
                      >
                        <span>Advisory</span>
                        <Info className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {!variant.storage_device?.is_refurbished && variant.storage_device && (
                    <div className="w-full my-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {variant.technology === "Wireless"
                          ? `100% High Endurance MicroSD · ~${variant.storage_days} Days Backup per Camera · Official Warranty`
                          : `100% Genuine 24×7 Surveillance HDD · ~${variant.storage_days} Days Backup · 3-Yr Warranty`
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
                    or from <span className="text-blue-600 dark:text-blue-400 font-bold">₹{Math.round((variant.total_payable * 1.06) / 12).toLocaleString('en-IN')}/mo</span> (EMI)
                  </div>
                  <div className="mt-3 w-full">
                    <div className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all group-hover:bg-blue-700">
                      <span>Select & Proceed</span>
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
                      <span>Lower competitor quote? Match Price</span>
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
