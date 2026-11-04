import { useMemo, useState, useEffect } from "react";
import { Product, Addon, AppSettings, ConfiguratorSelection, PricingResult } from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Filter, Tag, ChevronDown, Plus, Trash2, Info, HelpCircle, ShieldCheck } from "lucide-react";
import { TagGuideModal } from "./TagGuideModal";
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

const DEFAULT_500GB_HDD: Product = {
  id: "budget_hdd_500gb",
  display_name: "Budget Brand 500GB HDD",
  technical_name: "Budget Brand 500GB Surveillance HDD",
  brand: "Budget Brand",
  category: "storage",
  storage_type: "Surveillance HDD",
  storage_capacity_tb: 0.5,
  storage_tb: 0.5,
  capacity: "500GB",
  technologies: ["Common", "HD", "IP"],
  technology: "Common",
  unit_price: 2646,
  base_cost: 1800,
  is_active: true,
  is_quotation_eligible: true,
  stock_status: "in_stock"
};

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
  // Auto-select based on selection.technology, session storage, or default
  const [activeTech, setActiveTech] = useState<"hd" | "ip" | "wireless">(() => {
    const selTech = String(selection.technology || "").toLowerCase();
    if (selTech === "wireless" || selTech === "wifi") return "wireless";
    if (selTech === "ip") return "ip";
    if (selTech === "hd") return "hd";
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('quote_active_tech');
      if (saved === 'hd' || saved === 'ip' || saved === 'wireless') return saved as any;
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

  // Sync activeTech when selection.technology changes externally
  useEffect(() => {
    const selTech = String(selection.technology || "").toLowerCase();
    if (selTech === "wireless" || selTech === "wifi") {
      setActiveTech("wireless");
    } else if (selTech === "ip") {
      setActiveTech("ip");
    } else if (selTech === "hd") {
      setActiveTech("hd");
    }
  }, [selection.technology]);

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
      buckets.push({ id: Math.random().toString(36).substring(7), type: "outdoor", count: wifiCount, resolution: "3MP", connection: "wifi", features: [...initFeats] });
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

    // Ensure 500GB HDD is present in effectiveProducts so low-storage quotes can always calculate
    const effectiveProducts = [...products];
    const has500GB = effectiveProducts.some(p => {
      const text = ((p.display_name || "") + " " + (p.technical_name || "") + " " + (p.capacity || "")).toLowerCase();
      return p.category === "storage" && (text.includes("500gb") || p.storage_capacity_tb === 0.5 || p.storage_tb === 0.5);
    });
    if (!has500GB) {
      effectiveProducts.push(DEFAULT_500GB_HDD);
    }
    
    effectiveProducts.forEach(p => {
      const pTech = (p.technology || "").toUpperCase();
      const pTechs = (p.technologies || []).map((t: string) => t.toUpperCase());
      const isTechMatch = activeTech === "hd" 
        ? (p.category === "cctv_camera" && (pTech === "HD" || pTechs.includes("HD")))
        : activeTech === "ip"
        ? (p.category === "cctv_camera" && (pTech === "IP" || pTechs.includes("IP")))
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
      const strId = pricing.items?.find((i: any) => effectiveProducts.find(p => p.id === i.product_id)?.category === "storage")?.product_id;
      const storage_device = effectiveProducts.find(p => p.id === strId) ? { ...effectiveProducts.find(p => p.id === strId) } : undefined;
      
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
        technology: activeTech === "wireless" ? "Wireless" : activeTech.toUpperCase(),
        camera_device: camera_device ? { ...camera_device, derivedResolution: displayResolution } : { derivedResolution: displayResolution, brand: brandName }, 
        storage_device, 
        camera_count: totalHardwareCount, 
        storage_days: (pricing as any)._calculated_days || selection.recording_days || 7,
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
      const sel: ConfiguratorSelection = {
        ...selection,
        technology: (activeTech === "wireless" ? "Wireless" : activeTech === "ip" ? "IP" : "HD") as any,
        brand_preference: b.brand,
        mixed_camera_requirements: mixedReqs,
        outdoor_camera_count: cameraBuckets.filter(b => b.type === "outdoor").reduce((sum, b) => sum + b.count, 0),
        indoor_camera_count: cameraBuckets.filter(b => b.type === "indoor").reduce((sum, b) => sum + b.count, 0),
        wifi_camera_count: totalWifiCount,
        camera_count: totalHardwareCount,
        resolution_preference: uniqueRes.length === 1 ? uniqueRes[0] : "5MP",
        plan_type: planType as any,
      };
      
      // Standard Quote (Requested Storage)
      const rawPricing = calculatePricing({
        selection: sel, products: effectiveProducts, addons, settings, cablingDone, cablingMeters,
        referralDiscountPercent: promoterDiscount?.percent || 0,
        referralDiscountFlat: promoterDiscount?.flat || 0,
        evaluatedAddonRules, activeOffer,
      });
      
      const enriched = enrich(rawPricing, b.brandKey, b.brand);
      if (enriched) {
        enriched.is_economy_storage = false;
        results.push(enriched);
      }

      // Economy Storage Quote (If requested > 3 days, generate a low-storage variant)
      const reqDays = selection.recording_days ?? 7;
      if (reqDays > 3) {
        const economySel: ConfiguratorSelection = {
          ...sel,
          technology: (activeTech === "wireless" ? "Wireless" : activeTech === "ip" ? "IP" : "HD") as any,
          recording_days: 3 // Force 3 days to pick the smallest available HDD (usually 500GB)
        };
        const rawEconomyPricing = calculatePricing({
          selection: economySel, products: effectiveProducts, addons, settings, cablingDone, cablingMeters,
          referralDiscountPercent: promoterDiscount?.percent || 0,
          referralDiscountFlat: promoterDiscount?.flat || 0,
          evaluatedAddonRules, activeOffer,
        });
        (rawEconomyPricing as any)._calculated_days = 3;
        const enrichedEconomy = enrich(rawEconomyPricing, b.brandKey, b.brand);
        if (enrichedEconomy && enriched && enrichedEconomy.total_payable < enriched.total_payable) {
          enrichedEconomy.is_economy_storage = true;
          (enrichedEconomy as any).original_payable = enriched.total_payable;
          (enrichedEconomy as any).requested_days = reqDays;
          results.push(enrichedEconomy);
        }
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
  }, [activeTech, targetBrand, cameraBuckets, isMixed, hasOutdoor, hasIndoor, outdoorCount, indoorCount, selection, products, addons, settings, cablingDone, cablingMeters, promoterDiscount, evaluatedAddonRules, activeOffer, availableResolutions]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 items-center">
        <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 px-4 py-3 rounded-xl w-full max-w-2xl text-sm flex items-start gap-3 shadow-sm border border-blue-100 dark:border-blue-900/50">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Configure your setup:</strong> Choose your preferred technology and brand, then adjust camera quantities and resolutions. Use <strong>+ Variant</strong> if you need multiple resolutions (e.g., two 2MP cameras and two 5MP cameras) in the same package.
          </p>
        </div>

        {/* Technology Selector */}
        <div className="bg-[#f5f5f7] dark:bg-[#2d2d2f] p-1.5 rounded-full inline-flex relative shadow-inner">
          <button
            onClick={() => { setActiveTech("hd"); setCameraBuckets(prev => prev.map(b => ({ ...b, connection: "wired" }))); }}
            className={`relative z-10 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 ${activeTech === "hd" ? "text-white shadow-md" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"}`}
          >
            {activeTech === "hd" && <span className="absolute inset-0 bg-blue-600 rounded-full shadow-sm -z-10" />}
            <span>{t("wz_standard_hd_analog")}</span>
            <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${activeTech === 'hd' ? 'bg-white/20 text-white backdrop-blur-xs border border-white/25' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200/50'}`}>{t("wz_lowest_price")}</span>
          </button>
          <button
            onClick={() => { setActiveTech("ip"); setCameraBuckets(prev => prev.map(b => ({ ...b, connection: "wired" }))); }}
            className={`relative z-10 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 ${activeTech === "ip" ? "text-white shadow-md" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"}`}
          >
            {activeTech === "ip" && <span className="absolute inset-0 bg-blue-600 rounded-full shadow-sm -z-10" />}
            <span>{t("wz_premium_ip_network")}</span>
          </button>
          <button
            onClick={() => { setActiveTech("wireless"); setCameraBuckets(prev => prev.map(b => ({ ...b, connection: b.connection === "4g" ? "4g" : "wifi" }))); }}
            className={`relative z-10 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-full transition-all duration-300 flex items-center gap-1.5 ${activeTech === "wireless" ? "text-white shadow-md" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"}`}
          >
            {activeTech === "wireless" && <span className="absolute inset-0 bg-blue-600 rounded-full shadow-sm -z-10" />}
            <span>Smart Wireless (Wi-Fi / 4G)</span>
            <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${activeTech === 'wireless' ? 'bg-white/20 text-white backdrop-blur-xs border border-white/25' : 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 border border-teal-200/50'}`}>
              {selection.power_wiring_option === "wire_needed" ? "Zero Video Wire" : "Zero Wiring"}
            </span>
          </button>
        </div>

        {/* Brand Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mr-2 shrink-0">{t("wz_brand")}</span>
          {availableBrands.map(b => (
            <button
              key={b}
              onClick={() => setActiveBrand(b)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${activeBrand === b ? "bg-blue-600 text-white border-blue-600 shadow-xs dark:bg-blue-600 dark:text-white" : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-blue-400 hover:text-blue-600"}`}
            >
              {BRAND_DISPLAY[b] || getCanonicalBrandName(b) || b}
            </button>
          ))}
        </div>

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
                <span>💡 Feature Guide</span>
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
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
            {outdoorCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold shrink-0 flex items-center gap-1">
                <span>🌧️</span> {outdoorCount} Weatherproof (Outdoor Standard)
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
                <span>📶</span> {wifiCount} Wi-Fi
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

              {/* Controls row: Quantity Dropdown, Resolution Dropdown & Connection Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
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

                {/* Connection Dropdown */}
                <div className="relative">
                  <label className="block text-[10px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Connection
                  </label>
                  <select
                    value={bucket.connection || (activeTech === "wireless" ? "wifi" : "wired")}
                    onChange={(e) => {
                      const newConn = e.target.value as "wired" | "wifi" | "4g";
                      setCameraBuckets(prev => prev.map(b => b.id === bucket.id ? { ...b, connection: newConn } : b));
                    }}
                    className="w-full py-2 px-3 text-xs sm:text-sm font-bold bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-8 transition-all"
                  >
                    {activeTech !== "wireless" && (
                      <option value="wired">
                        {activeTech === "ip" ? "Wired (CAT6 IP)" : "Wired (Analog HD)"}
                      </option>
                    )}
                    {products.some(p => p.category === "cctv_camera" && (p.has_wifi || (p.technology || "").toUpperCase().includes("WIFI") || (p.technologies || []).some((t: string) => t.toUpperCase().includes("WIFI")))) && (
                      <option value="wifi">Smart Wi-Fi (Wireless)</option>
                    )}
                    {products.some(p => p.category === "cctv_camera" && (p.has_4g_sim || (p.name || "").toLowerCase().includes("4g") || (p.model_number || "").toLowerCase().includes("4g"))) && (
                      <option value="4g">4G SIM (Cellular)</option>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 bottom-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Per-Bucket Specific Features */}
              <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                    Features for these {bucket.count} cameras:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>ℹ️ What do these mean?</span>
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
                      bucket.type === "outdoor" ? "Weatherproof Outdoor Wi-Fi Bullet • MicroSD Card • Zero Video Cable" : "Indoor 360° Pan-Tilt Wi-Fi Dome • MicroSD Card • Zero Video Cable"
                    ) : bucket.connection === "4g" ? (
                      bucket.type === "outdoor" ? "Outdoor 4G SIM Bullet (Direct SIM) • MicroSD Card • Zero Broadband Required" : "Indoor 4G SIM Dome • MicroSD Card • Zero Broadband Required"
                    ) : (
                      bucket.type === "outdoor" ? `Outdoor Bullet Camera • Central ${activeTech === "ip" ? "NVR" : "DVR"} + Video Cabling` : `Indoor Dome Camera • Central ${activeTech === "ip" ? "NVR" : "DVR"} + Video Cabling`
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
                  </div>
                  <h3 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                    {variant.camera_device.derivedResolution || "2MP Resolution"}
                  </h3>
                  
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
                        {t("wz_basic_storage_")}{variant.storage_device?.derivedCapacity || (variant.technology === "Wireless" ? "64GB MicroSD" : "500GB HDD")})
                      </p>
                      <p className="text-[11px] bg-green-50 text-green-700 px-2.5 py-1 rounded-md border border-green-200 font-bold inline-block">
                        {t("wz_save_")}{((variant as any).original_payable - variant.total_payable).toLocaleString('en-IN')}  {t("wz_3_days_vs")} {(variant as any).requested_days}  {t("wz_days")}
                      </p>
                    </div>
                  )}
                  {!variant.is_economy_storage && variant.is_economy_storage !== undefined && (
                    <p className="text-xs text-emerald-600 font-medium mb-3">
                      {t("wz_requested_storage_")}{variant.storage_device?.derivedCapacity || (variant.technology === "Wireless" ? "128GB MicroSD" : "2TB")}) - {variant.storage_days}  {t("wz_days")}
                    </p>
                  )}
                  <div className="flex items-start justify-center">
                    <span className="text-[40px] leading-none font-extrabold text-[#1d1d1f] dark:text-white tracking-tight">
                      ₹{variant.total_payable.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                    or from <span className="text-blue-600 dark:text-blue-400 font-bold">₹{Math.round((variant.total_payable * 1.06) / 12).toLocaleString('en-IN')}/mo</span> (EMI)
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
    </div>
  );
}
