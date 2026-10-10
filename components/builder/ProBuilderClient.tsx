"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCartStore } from "@/stores/useCartStore";
import { 
  Loader2, ShoppingCart, Trash2, AlertTriangle, Plus, Minus, Lock, Unlock,
  Search, X, ArrowUpDown, Filter, Sparkles, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

export function ProBuilderClient() {

const QtyInput = ({ qty, onUpdate, className = "" }: { qty: number, onUpdate: (q: number) => void, className?: string }) => {
  const [localQty, setLocalQty] = useState<string | number>(qty);
  useEffect(() => { setLocalQty(qty); }, [qty]);
  return (
    <input 
      type="number"
      value={localQty}
      onChange={e => setLocalQty(e.target.value)}
      onBlur={() => {
        const parsed = parseInt(localQty as string);
        if (isNaN(parsed) || parsed < 1) {
          setLocalQty(qty); // Revert to old valid qty if they clear it and blur, or default to 1? Wait, 1 is safer.
          // Wait, actually better to revert to 1 if it's invalid
          setLocalQty(1);
          onUpdate(1);
        } else {
          onUpdate(parsed);
        }
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      className={`bg-transparent border-none outline-none text-center focus:ring-0 p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`}
    />
  );
};

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const [showMobileCart, setShowMobileCart] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPincode, setCheckoutPincode] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutReferral, setCheckoutReferral] = useState("");
  const [phoneError, setPhoneError] = useState("");
  
  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const existingLeadId = searchParams.get("leadId");
  const [isLeadCaptured, setIsLeadCaptured] = useState(!!existingLeadId);

  // Search, Sort & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recommended" | "price_asc" | "price_desc" | "name_asc">("recommended");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterType, setFilterType] = useState("all"); // "all" | "dome" | "bullet"
  const [filterRes, setFilterRes] = useState("all"); // "all" | "2MP" | "4MP" | "5MP" | "8MP"
  const [filterNightVision, setFilterNightVision] = useState("all"); // "all" | "Color" | "B&W"
  const [filterChannels, setFilterChannels] = useState("all"); // "all" | "4" | "8" | "16" | "32"
  const [filterCapacity, setFilterCapacity] = useState("all"); // "all" | "500GB" | "1TB" | "2TB" | "4TB"
  const [filterCableType, setFilterCableType] = useState("all"); // "all" | "CAT6" | "3+1" | "HDMI"

  const STEPS = [
    { id: "technology", label: "Technology" },
    { id: "camera", label: "Cameras" },
    { id: "recorder", label: "Recorders" },
    { id: "storage", label: "Storage" },
    { id: "connector", label: "Connectors" },
    { id: "cable", label: "Cables" },
    { id: "power", label: "Power Device" },
    { id: "upgrades", label: "Optional Upgrades" },
    { id: "installation", label: "Installation" }
  ];

  const activeCategory = STEPS[activeStepIndex].id;

  const handleStepChange = (index: number, overrideTech?: string) => {
    // Prevent skipping ahead if technology isn't set, unless they are going back
    const currentTech = overrideTech || technology;
    if (!currentTech && index > 0) return;
    
    // Auto-lock technology step once locked, allow returning to it to clear
    setActiveStepIndex(index);
    setSearchQuery("");
    setFilterBrand("all");
    setFilterType("all");
    setFilterRes("all");
    setFilterNightVision("all");
    setFilterChannels("all");
    setFilterCapacity("all");
    setFilterCableType("all");
  };

  const handleNextStep = (overrideTech?: string) => {
    if (activeStepIndex < STEPS.length - 1) {
      handleStepChange(activeStepIndex + 1, overrideTech);
    }
  };

  const handleBackStep = () => {
    if (activeStepIndex > 0) {
      handleStepChange(activeStepIndex - 1);
    }
  };

  const { technology, items, addItem, removeItem, updateQty, clearCart, setTechnology, getTotal, getCameraCount } = useCartStore();

  useEffect(() => {
    fetch("/api/catalog?retail=true")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const normalized = data.products.map((p: any) => {
            const name = (p.display_name || p.technical_name || p.description || "").toLowerCase();
            const cat = (p.category || "").toLowerCase();
            const sku = (p.sku || p.internal_sku || "").toLowerCase();
            const catalogPath = (p.catalog_path || "").toLowerCase();

            // Robust cable classification (CAT6, 3+1, HDMI, coaxial cables belong in "cable")
            const isCable = 
              cat.includes("cable") || 
              catalogPath.includes("cable") ||
              sku.startsWith("cab") || 
              /(\bcat6\b|\bcat5\b|\bcat5e\b|3\+1|coaxial|lan\s*cable|patch\s*cord|cctv\s*cable|hdmi\s*cable)/i.test(name) ||
              name.includes("cat6") || 
              name.includes("cat5") || 
              name.includes("3+1 cable");

            const isStorage = 
              cat.includes("storage") || 
              cat.includes("hdd") || 
              cat.includes("hard disk") ||
              cat.includes("hard drive") ||
              (p.storage_type && p.storage_type.toLowerCase().includes("hard disk")) ||
              (p.storage_type && p.storage_type.toLowerCase().includes("hdd")) ||
              /(\bhdd\b|\bhard\s*(disk|drive)\b|\bsurveillance\s*drive\b|\bpurple\b|\bskyhawk\b)/i.test(name);

            let normCat = "upgrades";
            // 1. Strictly respect explicit Admin Category first
            if (cat === "cctv_camera" || cat === "camera") normCat = "camera";
            else if (cat === "recorder" || cat === "dvr" || cat === "nvr") normCat = "recorder";
            else if (cat === "storage") normCat = "storage";
            else if (cat === "cable") normCat = "cable";
            else if (cat === "power_device" || cat === "power") normCat = "power";
            else if (cat === "network" || cat === "rack" || cat === "accessories" || cat === "accessory" || cat === "camera_mount" || cat === "mount" || cat === "bracket") normCat = "upgrades";
            else if (cat === "installation" || cat === "labor") normCat = "installation";
            else if (cat === "connector") normCat = "connector";
            // 2. Fallback "brain" fuzzy matching for missing or legacy categories
            else if ((cat.includes("camera") || cat.includes("cctv_camera")) && !cat.includes("mount") && !cat.includes("bracket") && !cat.includes("accessory") && !cat.includes("accessories")) normCat = "camera";
            else if (cat.includes("recorder") || cat.includes("dvr") || cat.includes("nvr")) normCat = "recorder";
            else if (isStorage) normCat = "storage";
            else if (cat.includes("connector") || /(\brj45\b|\bbnc\b|\bdc\b)/i.test(name) || name.includes("connector")) normCat = "connector";
            else if (isCable && !name.includes("hdmi") && !cat.includes("hdmi")) normCat = "cable";
            else if (cat.includes("power") || cat.includes("power_device") || name.includes("poe") || name.includes("smps")) normCat = "power";
            else normCat = "upgrades";

            // Derived camera form factor
            let formFactor = p.form_factor ? p.form_factor.toLowerCase() : "";
            if (!formFactor) {
              if (/\bdome\b/i.test(name) || p.type?.toLowerCase() === "dome") formFactor = "dome";
              else if (/\bbullet\b/i.test(name) || p.type?.toLowerCase() === "bullet") formFactor = "bullet";
            }

            // Derived resolution
            let resolution = p.resolution || (p.resolution_mp ? `${p.resolution_mp}MP` : "");
            if (!resolution) {
              const resMatch = name.match(/(\d+(?:\.\d+)?)\s*mp/i) || name.match(/\b(4k|1080p|720p)\b/i);
              if (resMatch) resolution = resMatch[0].toUpperCase();
            }

            // Derived channels for recorders
            let channels = p.channels || p.max_cameras;
            if (!channels) {
              const chMatch = name.match(/(\d+)\s*(?:ch|channel)/i);
              if (chMatch) channels = parseInt(chMatch[1]);
            }

            // Derived storage capacity
            let capacity = p.capacity || (p.storage_capacity_tb ? `${p.storage_capacity_tb}TB` : "");
            if (!capacity) {
              const capMatch = name.match(/(\d+)\s*(?:tb|gb)/i);
              if (capMatch) capacity = capMatch[0].toUpperCase().replace(/\s/g, "");
            }

            // Derived night vision
            let nightVision = "";
            if (/color\s*night/i.test(name) || p.night_vision_type === "color" || /col\b/i.test(sku)) nightVision = "Color";
            else if (/b&w|black\s*&?\s*white|ir\s*night/i.test(name) || p.night_vision_type === "ir" || /-bw-/i.test(sku)) nightVision = "B&W";

            // Derived cable type
            let cableType = "";
            if (/\bcat6\b/i.test(name) || /cat6/i.test(sku) || /cat6/i.test(catalogPath)) cableType = "CAT6";
            else if (/3\+1/i.test(name) || /3\+1/i.test(catalogPath)) cableType = "3+1 HD";
            else if (/hdmi/i.test(name) || cat === "hdmi_cable") cableType = "HDMI";

            // Progressive Technology Classification
            let techList = Array.isArray(p.technologies) && p.technologies.length > 0 
              ? [...p.technologies] 
              : (p.technology ? [p.technology] : []);
              
            // Normalize "both" to "Common"
            techList = techList.map((t: string) => t.toLowerCase() === "both" ? "Common" : t);

            if (techList.length === 0 || (techList.length === 1 && techList[0] === "Common")) {
              if (cableType === "CAT6" || sku.startsWith("cab-ip") || sku.startsWith("poe-") || /(\bpoe\b|\brj45\b|\bnvr\b)/i.test(name)) {
                techList = ["IP"];
              } else if (cableType === "3+1 HD" || sku.startsWith("cab-hd") || sku.startsWith("smps-") || /(\bbnc\b|\bdvr\b|\bsmps\b)/i.test(name)) {
                techList = ["HD"];
              } else {
                techList = ["Common"];
              }
            }

            return {
              ...p,
              unit_multiplier: p.unit_multiplier,
              normCat,
              technologies: techList,
              derivedFormFactor: formFactor,
              derivedResolution: resolution,
              derivedChannels: channels,
              derivedCapacity: capacity,
              derivedNightVision: nightVision,
              derivedCableType: cableType
            };
          });
          setProducts(normalized);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load catalog:", err);
        setLoading(false);
      });
  }, []);

  // If technology is cleared, force back to step 0
  useEffect(() => {
    if (!technology && activeStepIndex > 0) {
      setActiveStepIndex(0);
    }
  }, [technology, activeStepIndex]);

  const hasActiveFilters = 
    searchQuery.trim() !== "" || 
    sortBy !== "recommended" || 
    filterBrand !== "all" || 
    filterType !== "all" || 
    filterRes !== "all" || 
    filterNightVision !== "all" || 
    filterChannels !== "all" || 
    filterCapacity !== "all" || 
    filterCableType !== "all";

  const resetAllFilters = () => {
    setSearchQuery("");
    setSortBy("recommended");
    setFilterBrand("all");
    setFilterType("all");
    setFilterRes("all");
    setFilterNightVision("all");
    setFilterChannels("all");
    setFilterCapacity("all");
    setFilterCableType("all");
  };

  // Base products in active category matching technology lock
  const categoryProducts = useMemo(() => {
    return products.filter(p => {
      if (p.normCat !== activeCategory) return false;
      if (technology && p.technologies && !p.technologies.includes("Common")) {
        if (!p.technologies.includes(technology)) return false;
      }
      return true;
    });
  }, [products, activeCategory, technology]);

  // Available filter options for active category
  const filterOptions = useMemo(() => {
    const brands = Array.from(new Set(categoryProducts.map(p => p.brand).filter(Boolean))) as string[];
    const resolutions = Array.from(new Set(categoryProducts.map(p => p.derivedResolution).filter(Boolean))) as string[];
    const channels = Array.from(new Set(categoryProducts.map(p => p.derivedChannels ? String(p.derivedChannels) : "").filter(Boolean))).sort((a, b) => parseInt(a) - parseInt(b));
    const capacities = Array.from(new Set(categoryProducts.map(p => p.derivedCapacity).filter(Boolean))) as string[];
    const cableTypes = Array.from(new Set(categoryProducts.map(p => p.derivedCableType).filter(Boolean))) as string[];
    const upgradeTypes = Array.from(new Set(categoryProducts.filter(p => p.normCat === "upgrades").map(p => p.category || "General"))).filter(Boolean) as string[];
    const nightVisions = Array.from(new Set(categoryProducts.map(p => p.derivedNightVision).filter(Boolean))) as string[];
    const hasDomes = categoryProducts.some(p => p.derivedFormFactor === "dome");
    const hasBullets = categoryProducts.some(p => p.derivedFormFactor === "bullet");

    return { brands, resolutions, channels, capacities, cableTypes, upgradeTypes, nightVisions, hasDomes, hasBullets };
  }, [categoryProducts]);

  const camCount = getCameraCount();

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = categoryProducts.filter(p => {
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (p.display_name || "").toLowerCase().includes(q);
        const matchBrand = (p.brand || "").toLowerCase().includes(q);
        const matchSku = (p.sku || p.internal_sku || "").toLowerCase().includes(q);
        const matchDesc = (p.description || p.feature || "").toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchSku && !matchDesc) return false;
      }

      // Brand filter
      if (filterBrand !== "all" && p.brand !== filterBrand) return false;

      // Category specific filters
      if (activeCategory === "camera") {
        if (filterType !== "all" && p.derivedFormFactor !== filterType) return false;
        if (filterRes !== "all" && p.derivedResolution !== filterRes) return false;
        if (filterNightVision !== "all" && p.derivedNightVision !== filterNightVision) return false;
      } else if (activeCategory === "recorder") {
        if (filterChannels !== "all" && String(p.derivedChannels) !== filterChannels) return false;
      } else if (activeCategory === "storage") {
        if (filterCapacity !== "all" && p.derivedCapacity !== filterCapacity) return false;
      } else if (activeCategory === "cable") {
        if (filterCableType !== "all" && p.derivedCableType !== filterCableType) return false;
      } else if (activeCategory === "upgrades") {
        if (filterType !== "all" && (p.category || "General") !== filterType) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === "price_asc") {
      result = [...result].sort((a, b) => a.unit_price - b.unit_price);
    } else if (sortBy === "price_desc") {
      result = [...result].sort((a, b) => b.unit_price - a.unit_price);
    } else if (sortBy === "name_asc") {
      result = [...result].sort((a, b) => (a.display_name || "").localeCompare(b.display_name || ""));
    }

    return result;
  }, [
    categoryProducts,
    searchQuery,
    sortBy,
    filterBrand,
    filterType,
    filterRes,
    filterNightVision,
    filterChannels,
    filterCapacity,
    filterCableType,
    activeCategory,
    camCount
  ]);



  const handleCheckout = async () => {
    // Validate phone from inline form state
    const cleanedPhone = checkoutPhone.replace(/\D/g, "").slice(-10);
    if (!existingLeadId && (cleanedPhone.length !== 10 || !/^[6-9]/.test(cleanedPhone))) {
      setPhoneError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }
    setPhoneError("");
    setIsGenerating(true);

    try {
      const camCount = getCameraCount();
      const quoteItems = items.map(i => {
        let finalQty = i.qty;
        if (i.unit_multiplier === "camera_count") finalQty = camCount;
        return {
          product_id: i.id,
          display_name: i.display_name,
          category: i.category,
          unit_price: i.unit_price,
          qty: finalQty,
          line_total: i.unit_price * finalQty,
          brand: i.brand || "Generic"
        };
      });

      const res = await fetch("/api/quote/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: existingLeadId || undefined,
          customer_name: checkoutName || "Pro Builder Client",
          customer_mobile: cleanedPhone,
          requirementSnapshot: {
            installation_type: "new",
            camera_count: camCount,
            technology_preference: technology || "IP",
            is_pro_builder: true, customer_pincode: checkoutPincode, customer_email: checkoutEmail, partner_id: checkoutReferral
          },
          configurationSnapshot: {
            items: quoteItems
          },
          selectedPlan: "Pro_Custom_Build",
          source: "pro_builder"
        })
      });

      const data = await res.json();
      if (data.success) {
        router.push(data.leadId ? `/quote/${data.leadId}/review/${data.quoteId}` : `/quote/review/${data.quoteId}`);
      } else {
        alert(data.message || "Failed to generate quotation.");
        setIsGenerating(false);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate quotation.");
      setIsGenerating(false);
    }
  };

  const channelCapacity = useMemo(() => {
    return items.reduce((sum, i) => {
      if (i.category === "recorder" || i.category === "cctv_recorder") {
        const p = products.find(prod => prod.id === i.id);
        if (p && p.channels) return sum + (p.channels * i.qty);
      }
      return sum;
    }, 0);
  }, [items, products]);

  const isOverCapacity = camCount > channelCapacity && channelCapacity > 0;

  const hasCameras = camCount > 0;
  const hasRecorder = items.some(i => i.category === "recorder" || i.category === "cctv_recorder");
  const hasStorage = items.some(i => i.category === "storage" || i.category === "hdd");
  const hasCables = items.some(i => i.category === "cable");
  const canAutoComplete = hasCameras && hasRecorder && (!hasStorage || !hasCables);

  const handleAutoCompleteSetup = () => {
    if (!hasCameras || !hasRecorder) return;
    const tech = technology || "IP";

    // 1. Storage (HDD)
    if (!hasStorage) {
      const targetCap = camCount <= 4 ? "1TB" : (camCount <= 8 ? "2TB" : "4TB");
      const hdd = products.find(p => p.normCat === "storage" && p.derivedCapacity === targetCap) ||
                  products.find(p => p.normCat === "storage");
      if (hdd) addItem(hdd, 1);
    }

    // 2. Cables
    if (!hasCables) {
      const cable = products.find(p => p.normCat === "cable" && (p.technologies?.includes(tech) || p.technologies?.includes("Common")));
      if (cable) {
        const cableQty = Math.max(1, Math.ceil(camCount / 4));
        addItem(cable, cableQty);
      }
    }

    // 3. Power device / Switch
    const hasPower = items.some(i => i.category === "power" || i.category === "network" || i.category === "power_device");
    if (!hasPower) {
      if (tech === "IP") {
        const poe = products.find(p => p.normCat === "power" && p.derivedChannels && p.derivedChannels >= camCount) ||
                    products.find(p => p.normCat === "power" && p.technologies?.includes("IP"));
        if (poe) addItem(poe, 1);
      } else {
        const smps = products.find(p => p.normCat === "power" && p.technologies?.includes("HD")) ||
                     products.find(p => p.normCat === "power");
        if (smps) addItem(smps, 1);
      }
    }

    // 4. Connectors
    const hasConnectors = items.some(i => (i.id || "").toLowerCase().includes("conn"));
    if (!hasConnectors) {
      if (tech === "IP") {
        const rj45 = products.find(p => (p.sku || "").includes("RJ45") || (p.display_name || "").includes("RJ45"));
        if (rj45) addItem(rj45, camCount * 2);
      } else {
        const bnc = products.find(p => (p.sku || "").includes("BNC") || (p.display_name || "").includes("BNC"));
        const dc = products.find(p => (p.sku || "").includes("DC") || (p.display_name || "").includes("DC"));
        if (bnc) addItem(bnc, camCount * 2);
        if (dc) addItem(dc, camCount);
      }
    }

    // 5. Junction boxes
    const hasJunction = items.some(i => (i.display_name || "").toLowerCase().includes("junction") || (i.id || "").toLowerCase().includes("junction"));
    if (!hasJunction) {
      const junc = products.find(p => (p.sku || "").includes("JUNCTION") || (p.display_name || "").toLowerCase().includes("junction"));
      if (junc) addItem(junc, camCount);
    }

    // 6. Installation
    const hasInstall = items.some(i => i.category === "installation");
    if (!hasInstall) {
      const install = products.find(p => p.category === "installation" && (p.technologies?.includes(tech) || p.technologies?.includes("Common")));
      if (install) addItem(install, 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isLeadCaptured) {
    const handleSendOtp = async () => {
      const cleanedPhone = checkoutPhone.replace(/\D/g, "").slice(-10);
      if (!checkoutName.trim()) {
        setPhoneError("Please enter your name.");
        return;
      }
      if (cleanedPhone.length !== 10 || !/^[6-9]/.test(cleanedPhone)) {
        setPhoneError("Please enter a valid 10-digit Indian mobile number.");
        return;
      }
      setPhoneError("");
      setOtpLoading(true);
      
      try {
        const res = await fetch("/api/auth/otp/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanedPhone }),
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to send OTP.");
        }
        
        setOtpSent(true);
        setCountdown(30);
        setOtp(["", "", "", ""]);
      } catch (error: any) {
        setPhoneError(error.message || "Failed to send OTP. Please try again.");
      } finally {
        setOtpLoading(false);
      }
    };

    const handleVerifyOtp = async () => {
      const code = otp.join("");
      if (code.length !== 4) {
        setPhoneError("Please enter the 4-digit OTP.");
        return;
      }
      setPhoneError("");
      setOtpLoading(true);
      
      try {
        const cleanedPhone = checkoutPhone.replace(/\D/g, "").slice(-10);
        const res = await fetch("/api/auth/otp/whatsapp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanedPhone, otp: code }),
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Invalid OTP code.");
        }
        
        setIsLeadCaptured(true);
      } catch (error: any) {
        setPhoneError(error.message || "Invalid OTP code.");
        setOtp(["", "", "", ""]); // Reset OTP on failure
      } finally {
        setOtpLoading(false);
      }
    };

    const handleOtpChange = (val: string, index: number) => {
      const newOtp = [...otp];
      newOtp[index] = val;
      setOtp(newOtp);
      
      if (val && index < 3) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        if (prevInput) prevInput.focus();
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#5e4dff]"></div>
          
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center text-xs text-gray-500 font-medium">
            <button onClick={() => router.push("/")} className="flex items-center gap-1 hover:text-gray-900 transition-colors">
              <X className="w-3.5 h-3.5" /> Exit
            </button>
            <span>CCTVQuotation.com</span>
          </div>

          <div className="p-8 sm:p-10 space-y-6">
            <div className="text-right">
              <span className="text-xs text-gray-400 font-medium tracking-wide">Step 1 of 1</span>
            </div>
            
            {otpSent ? (
              <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-right-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">Verify Your Mobile</h2>
                  <p className="text-sm text-slate-500">
                    Enter the 4-digit code sent to <strong className="text-slate-900">{checkoutPhone}</strong>
                  </p>
                </div>
                
                <div className="flex justify-center gap-3 sm:gap-4 my-8">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-input-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value.replace(/\D/g, ''), index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black border-2 border-gray-200 rounded-xl focus:border-[#9b8cff] focus:ring-4 focus:ring-[#9b8cff]/20 outline-none transition-all bg-white"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                
                {phoneError && (
                  <p className="text-red-500 text-sm text-center font-semibold flex items-center justify-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> {phoneError}
                  </p>
                )}
                
                <div className="space-y-4">
                  <Button 
                    onClick={handleVerifyOtp} 
                    disabled={otpLoading || otp.join("").length !== 4} 
                    className="w-full h-12 sm:h-14 text-base font-bold bg-[#9b8cff] hover:bg-[#8675ff] text-white rounded-xl shadow-md"
                  >
                    {otpLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Verify & Continue"}
                  </Button>
                  
                  <div className="text-center text-sm">
                    <span className="text-gray-500 mr-1">Didn't receive code?</span>
                    <button
                      type="button"
                      disabled={countdown > 0 || otpLoading}
                      onClick={handleSendOtp}
                      className={`font-bold transition-colors ${
                        countdown > 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-[#9b8cff] hover:text-[#8675ff] hover:underline"
                      }`}
                    >
                      {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                    </button>
                  </div>
                  
                  <div className="text-center mt-2">
                    <button 
                      onClick={() => { setOtpSent(false); setPhoneError(""); }}
                      className="text-sm font-semibold text-gray-500 hover:text-gray-700"
                    >
                      Change Mobile Number
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">Final Step: Get Your Quotation</h2>
                  <p className="text-sm text-slate-500 font-medium">Please enter your details to view your personalized CCTV options instantly.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Your Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Rahul Kumar" 
                      value={checkoutName} 
                      onChange={(e) => { setCheckoutName(e.target.value); setPhoneError(""); }} 
                      className="w-full py-2.5 px-3.5 sm:p-3.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#9b8cff] focus:border-[#9b8cff] outline-none transition-all bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Mobile Number *</label>
                    <input 
                      type="tel" 
                      placeholder="10-digit mobile number" 
                      maxLength={10}
                      value={checkoutPhone} 
                      onChange={(e) => { setCheckoutPhone(e.target.value.replace(/\D/g, '')); setPhoneError(""); }} 
                      className="w-full py-2.5 px-3.5 sm:p-3.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#9b8cff] focus:border-[#9b8cff] outline-none transition-all bg-white text-gray-900"
                    />
                    {phoneError && <p className="text-red-500 text-xs mt-1.5 font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {phoneError}</p>}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="302012"
                      value={checkoutPincode}
                      onChange={(e) => setCheckoutPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full py-2.5 px-3.5 sm:p-3.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#9b8cff] focus:border-[#9b8cff] outline-none transition-all bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Email (Optional)</label>
                    <input 
                      type="email" 
                      placeholder="e.g. rahul@email.com" 
                      value={checkoutEmail} 
                      onChange={(e) => setCheckoutEmail(e.target.value)} 
                      className="w-full py-2.5 px-3.5 sm:p-3.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#9b8cff] focus:border-[#9b8cff] outline-none transition-all bg-white text-gray-900"
                    />
                  </div>

                  <div className="p-3 bg-green-50/80 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-green-900">Referral Code (Optional)</label>
                      <span className="text-[10px] text-green-700 font-medium">Get discount</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="E.G. P102" 
                      value={checkoutReferral} 
                      onChange={(e) => setCheckoutReferral(e.target.value.toUpperCase())} 
                      className="w-full py-2.5 px-3.5 sm:p-3 text-sm border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all uppercase placeholder-normal bg-white text-gray-900 font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button variant="outline" onClick={() => router.push("/")} className="h-12 px-6 rounded-xl font-bold text-gray-700 border-2">
                    Back
                  </Button>
                  <Button 
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="flex-1 h-12 text-base font-bold bg-[#9b8cff] hover:bg-[#8675ff] text-white rounded-xl shadow-md"
                  >
                    {otpLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "View My CCTV Options"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto space-y-8 pb-32">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pro Builder</h1>
            <p className="text-slate-500 mt-2">Build a custom quotation item by item.</p>
          </div>


          {/* 1-Click Auto-Complete Compatible Setup Banner */}
          {canAutoComplete && (
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-400/30">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider bg-white/20 text-white w-fit px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Smart Setup Assistant
                </div>
                <h3 className="text-base sm:text-lg font-black">Complete your {camCount}-Camera {technology} setup in 1-Click?</h3>
                <p className="text-xs text-blue-100 max-w-xl">
                  Instantly bundles the best matching Surveillance HDD, {technology === "IP" ? "CAT6 Network Cables, PoE Switch" : "3+1 Cables, SMPS Power Supply"}, connectors, junction boxes, and professional installation.
                </p>
              </div>
              <Button
                onClick={handleAutoCompleteSetup}
                className="bg-white hover:bg-blue-50 text-blue-900 font-black text-sm rounded-xl px-5 py-3 shadow-lg hover:shadow-xl shrink-0 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-blue-600" /> Auto-Complete Setup
              </Button>
            </div>
          )}

          {/* Progress Stepper */}
          <div className="flex flex-wrap items-center gap-2 pb-4 mb-4 border-b border-slate-200">
            {STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => handleStepChange(idx)}
                disabled={!technology && idx > 0}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                  activeStepIndex === idx
                    ? "bg-slate-900 text-white shadow-md"
                    : (idx < activeStepIndex || technology)
                      ? "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                      : "bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  activeStepIndex === idx ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {idx + 1}
                </span>
                {step.label}
              </button>
            ))}
          </div>

          {activeStepIndex === 0 ? (
            <div className="py-6 md:py-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-slate-900">Choose Your Base Technology</h2>
                <p className="text-slate-500 mt-2">This will automatically filter all compatible cameras and recorders.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <button 
                  onClick={() => { setTechnology("IP"); handleStepChange(1, "IP"); }}
                  className={`p-4 md:p-8 rounded-3xl border-2 text-left transition-all ${technology === "IP" ? "border-blue-600 ring-4 ring-blue-50 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg"}`}
                >
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">IP / Network System</h3>
                  <p className="text-slate-600 mb-6">Best for high-resolution setups, smart AI features, and easy scalability over standard network cables (CAT6).</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-700"><Lock className="w-4 h-4 text-blue-600" /> Uses NVRs (Network Video Recorders)</div>
                    <div className="flex items-center gap-2 text-sm text-slate-700"><Lock className="w-4 h-4 text-blue-600" /> Up to 4K / 8MP+ Resolution</div>
                    <div className="flex items-center gap-2 text-sm text-slate-700"><Lock className="w-4 h-4 text-blue-600" /> PoE (Power over Ethernet)</div>
                  </div>
                </button>

                <button 
                  onClick={() => { setTechnology("HD"); handleStepChange(1, "HD"); }}
                  className={`p-4 md:p-8 rounded-3xl border-2 text-left transition-all ${technology === "HD" ? "border-blue-600 ring-4 ring-blue-50 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg"}`}
                >
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">HD / Coaxial System</h3>
                  <p className="text-slate-600 mb-6">Cost-effective and reliable. Perfect for upgrading older analog systems using existing BNC coaxial cabling.</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-700"><Lock className="w-4 h-4 text-amber-600" /> Uses DVRs (Digital Video Recorders)</div>
                    <div className="flex items-center gap-2 text-sm text-slate-700"><Lock className="w-4 h-4 text-amber-600" /> 2MP to 5MP Resolution</div>
                    <div className="flex items-center gap-2 text-sm text-slate-700"><Lock className="w-4 h-4 text-amber-600" /> Coaxial (3+1) Cable</div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Search, Sort & Dynamic Filter Toolbar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Search in ${STEPS.find(c => c.id === activeCategory)?.label}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        title="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Sort Dropdown & Reset */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center">
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="pl-8 pr-7 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all"
                      >
                        <option value="recommended">Sort: Default</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="name_asc">Name: A to Z</option>
                      </select>
                    </div>

                    {hasActiveFilters && (
                      <button
                        onClick={resetAllFilters}
                        className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Contextual Category Filter Pills */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  {/* Camera Filters */}
                  {activeCategory === "camera" && (
                    <>
                      {(filterOptions.hasDomes && filterOptions.hasBullets) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Type:</span>
                          <button
                            onClick={() => setFilterType("all")}
                            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterType === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                          >
                            All
                          </button>
                          {filterOptions.hasDomes && (
                            <button
                              onClick={() => setFilterType("dome")}
                              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterType === "dome" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                              Dome (Indoor)
                            </button>
                          )}
                          {filterOptions.hasBullets && (
                            <button
                              onClick={() => setFilterType("bullet")}
                              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterType === "bullet" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                              Bullet (Outdoor)
                            </button>
                          )}
                        </div>
                      )}

                      {filterOptions.resolutions.length > 1 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Res:</span>
                          <button
                            onClick={() => setFilterRes("all")}
                            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterRes === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                          >
                            All
                          </button>
                          {filterOptions.resolutions.map(r => (
                            <button
                              key={r}
                              onClick={() => setFilterRes(r)}
                              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterRes === r ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      )}

                      {filterOptions.nightVisions.length > 1 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Night Vision:</span>
                            <button
                              onClick={() => setFilterNightVision("all")}
                              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterNightVision === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                              All
                            </button>
                            {filterOptions.nightVisions.map(nv => (
                              <button
                                key={nv}
                                onClick={() => setFilterNightVision(nv)}
                                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterNightVision === nv ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                              >
                                {nv}
                              </button>
                            ))}
                          </div>
                        )}
                    </>
                  )}

                  {/* Recorder Filters */}
                  {activeCategory === "recorder" && filterOptions.channels.length > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Channels:</span>
                      <button
                        onClick={() => setFilterChannels("all")}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterChannels === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        All
                      </button>
                      {filterOptions.channels.map(ch => (
                        <button
                          key={ch}
                          onClick={() => setFilterChannels(ch)}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterChannels === ch ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          {ch} Ch
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Storage Filters */}
                  {activeCategory === "storage" && filterOptions.capacities.length > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Capacity:</span>
                      <button
                        onClick={() => setFilterCapacity("all")}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterCapacity === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        All
                      </button>
                      {filterOptions.capacities.map(cap => (
                        <button
                          key={cap}
                          onClick={() => setFilterCapacity(cap)}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterCapacity === cap ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          {cap}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Cable Filters */}
                  {activeCategory === "cable" && filterOptions.cableTypes.length > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Type:</span>
                      <button
                        onClick={() => setFilterCableType("all")}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterCableType === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        All
                      </button>
                      {filterOptions.cableTypes.map(ct => (
                        <button
                          key={ct}
                          onClick={() => setFilterCableType(ct)}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterCableType === ct ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          {ct}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Upgrades Filters */}
                  {activeCategory === "upgrades" && filterOptions.upgradeTypes.length > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Type:</span>
                      <button
                        onClick={() => setFilterType("all")}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterType === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        All
                      </button>
                      {filterOptions.upgradeTypes.map(ut => (
                        <button
                          key={ut}
                          onClick={() => setFilterType(ut)}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterType === ut ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          {ut.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Brand Filter */}
                  {filterOptions.brands.length > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Brand:</span>
                      <button
                        onClick={() => setFilterBrand("all")}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterBrand === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        All
                      </button>
                      {filterOptions.brands.map(b => (
                        <button
                          key={b}
                          onClick={() => setFilterBrand(b)}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterBrand === b ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Counter */}
                <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between pt-1">
                  <span>Showing {filteredProducts.length} of {categoryProducts.length} items</span>
                  {hasActiveFilters && (
                    <span className="text-blue-600 font-semibold">Active filters applied</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(p => {
                  const inCart = items.find(i => i.id === p.id);
                  
                  // Smart recommendation for storage based on camCount
                  const isRecommendedStorage = 
                    activeCategory === "storage" && 
                    camCount > 0 && (
                      (camCount <= 4 && (p.derivedCapacity === "1TB" || p.derivedCapacity === "2TB")) ||
                      (camCount > 4 && camCount <= 8 && (p.derivedCapacity === "2TB" || p.derivedCapacity === "4TB")) ||
                      (camCount > 8 && (p.derivedCapacity === "4TB" || p.derivedCapacity === "8TB"))
                    );

                  // Smart fit for recorder
                  const isRecommendedRecorder = 
                    activeCategory === "recorder" && 
                    camCount > 0 && 
                    p.derivedChannels && 
                    p.derivedChannels >= camCount && 
                    p.derivedChannels <= camCount * 2;

                  const isUnderCapacityRecorder = 
                    activeCategory === "recorder" && 
                    camCount > 0 && 
                    p.derivedChannels && 
                    p.derivedChannels < camCount;

                  let autoQty = 0;
                  let autoQtyLabel = "";
                  if (camCount > 0) {
                    const name = (p.display_name || p.sku || "").toUpperCase();
                    if (activeCategory === "connector") {
                      if (name.includes("BNC") && name.includes("DC")) {
                         autoQty = camCount;
                         autoQtyLabel = `${camCount} pairs (1 per camera)`;
                      } else if (name.includes("RJ45")) {
                         autoQty = (camCount * 2) + 2;
                         autoQtyLabel = `${autoQty} units (2/cam + 2 uplink)`;
                      } else if (name.includes("BNC")) {
                         autoQty = camCount * 2;
                         autoQtyLabel = `${camCount * 2} units (2 per camera)`;
                      } else if (name.includes("DC")) {
                         autoQty = camCount;
                         autoQtyLabel = `${camCount} units (1 per camera)`;
                      } else {
                         autoQty = camCount * 2;
                         autoQtyLabel = `${camCount * 2} units (2 per camera)`;
                      }
                    } else if (activeCategory === "upgrades" && (p.category === "camera_mount" || name.includes("JUNCTION") || name.includes("MOUNT"))) {
                      autoQty = camCount;
                      autoQtyLabel = `${camCount} units (1 per camera)`;
                    } else if (activeCategory === "installation" || p.category === "installation" || p.unit_multiplier === "camera_count") {
                      autoQty = camCount;
                      autoQtyLabel = `${camCount} units (1 per camera)`;
                    } else if (activeCategory === "power" || p.category === "power_device" || p.category === "power") {
                      const maxCams = p.max_cameras || p.channels || 0;
                      if (maxCams > 0 && maxCams < camCount) {
                        autoQty = Math.ceil(camCount / maxCams);
                        autoQtyLabel = `${autoQty} units (to power ${camCount} cams)`;
                      }
                    } else if (activeCategory === "storage" || p.category === "storage") {
                      const nameStr = (p.display_name || "").toLowerCase();
                      if (p.storage_type === "Micro SD" || nameStr.includes("sd card") || nameStr.includes("micro sd") || nameStr.includes("memory card")) {
                        autoQty = camCount;
                        autoQtyLabel = `${camCount} units (1 per camera)`;
                      }
                    }
                  }

                  return (
                    <div key={p.id} className={`bg-white rounded-2xl border p-4 flex flex-col h-full hover:shadow-lg transition-all ${isRecommendedStorage || isRecommendedRecorder ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'}`}>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {p.brand || "Generic"}
                          </span>
                          {p.technologies && p.technologies.map((t: string) => (
                            <span key={t} className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>

                        {/* Spec badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {p.derivedFormFactor === "dome" && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                              Dome (Indoor)
                            </span>
                          )}
                          {p.derivedFormFactor === "bullet" && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              Bullet (Outdoor)
                            </span>
                          )}
                          {p.derivedResolution && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {p.derivedResolution}
                            </span>
                          )}
                          {p.derivedNightVision && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                              {p.derivedNightVision}
                            </span>
                          )}
                          {p.derivedCableType && (
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                              {p.derivedCableType}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-slate-900 leading-snug">{p.display_name}</h4>
                        
                        {/* Auto-Quantity Smart Badge */}
                        {autoQty > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-block">
                              Recommended: {autoQtyLabel}
                            </span>
                          </div>
                        )}
                        {p.channels && <p className="text-xs text-slate-500 font-medium">{p.channels} Channels</p>}

                        {/* Recommendation Badges */}
                        {isRecommendedStorage && (
                          <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" /> Recommended (~15-30 days backup)
                          </div>
                        )}
                        {isRecommendedRecorder && (
                          <div className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-600 shrink-0" /> Best fit for {camCount} cameras
                          </div>
                        )}
                        {isUnderCapacityRecorder && (
                          <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md flex items-start gap-1">
                            <span className="shrink-0 mt-0.5">⚠️</span> <span>Under capacity for {camCount} cameras. You will need multiple units.</span>
                          </div>
                        )}

                        <div className="text-lg font-black text-slate-900 pt-1">
                          INR {p.unit_price.toLocaleString('en-IN')}
                          {p.unit_multiplier === "camera_count" && <span className="text-[10px] text-slate-400 ml-1">/ cam</span>}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        {inCart ? (
                          <div className="flex items-center justify-between bg-blue-50 rounded-xl p-1">
                            <button onClick={() => updateQty(p.id, inCart.qty - 1)} className="w-8 h-8 flex items-center justify-center bg-white text-blue-600 rounded-lg shadow-sm font-black">-</button>
                            <QtyInput qty={inCart.qty} onUpdate={(q) => updateQty(p.id, q)} className="font-bold text-blue-900 w-12 text-base" />
                            <button onClick={() => addItem(p)} className="w-8 h-8 flex items-center justify-center bg-white text-blue-600 rounded-lg shadow-sm font-black">+</button>
                          </div>
                        ) : (
                          <Button onClick={() => addItem(p, autoQty > 0 ? autoQty : 1)} className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-md">
                            Add to Quote
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-6 md:py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-4 md:p-8">
                    <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-bold">No products match your filters</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing or adjusting your search and filter options.</p>
                    {hasActiveFilters && (
                      <Button onClick={resetAllFilters} variant="outline" size="sm" className="mt-4 text-blue-600 border-blue-200 hover:bg-blue-50">
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Sticky Bottom Navigation & Mobile Cart Toggle */}
                {(activeStepIndex > 0) && (
                  <div className="sticky bottom-0 -mx-4 md:-mx-8 px-4 md:px-8 py-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-30 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    
                    {/* Mobile Cart Toggle */}
                    <div className="md:hidden flex items-center justify-between w-full mb-2">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cart Total ({items.length})</div>
                        <div className="text-lg font-black text-slate-900">INR {getTotal().toLocaleString('en-IN')}</div>
                      </div>
                      <Button onClick={() => setShowMobileCart(true)} variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 h-10 px-4 rounded-xl font-bold flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" /> View Cart
                      </Button>
                    </div>

                    {activeStepIndex < STEPS.length - 1 && (
                      <Button 
                        onClick={() => handleNextStep()}
                        className="w-full sm:max-w-sm h-12 sm:h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-xl sm:rounded-2xl shadow-xl text-base sm:text-lg font-bold flex items-center justify-between px-6 transition-transform active:scale-95"
                      >
                        <span>Next: {STEPS[activeStepIndex + 1].label}</span>
                        <span>&rarr;</span>
                      </Button>
                    )}
                    
                    {activeStepIndex === STEPS.length - 1 && (
                      <Button 
                        onClick={() => setShowMobileCart(true)}
                        className="w-full sm:max-w-sm h-12 sm:h-14 bg-green-600 hover:bg-green-700 text-white rounded-xl sm:rounded-2xl shadow-xl text-base sm:text-lg font-bold flex md:hidden items-center justify-between px-6 transition-transform active:scale-95"
                      >
                        <span>Complete Checkout</span>
                        <span>&rarr;</span>
                      </Button>
                    )}
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      <div className={`fixed inset-0 z-50 bg-white md:static md:inset-auto md:z-10 w-full md:w-[400px] border-l border-slate-200 h-screen overflow-y-auto flex flex-col shadow-2xl transition-transform duration-300 ${showMobileCart ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}>
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Current Build
              </h2>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to reset your current build?")) {
                        clearCart();
                        setActiveStepIndex(0);
                      }
                    }}
                    className="text-xs font-bold text-red-500 hover:text-white border border-red-200 hover:bg-red-500 hover:border-red-500 px-2 py-0.5 rounded-full transition-all flex items-center gap-1 active:scale-95"
                    title="Clear entire build"
                  >
                    <Trash2 className="w-3 h-3" /> Reset
                  </button>
                )}
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{items.length} items</span>
                <button onClick={() => setShowMobileCart(false)} className="md:hidden p-1.5 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-700 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
          </div>
          {isOverCapacity && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded-xl flex gap-3 text-yellow-800 text-sm font-medium">
              <AlertTriangle className="w-5 h-5 shrink-0 text-yellow-600" />
              You have {camCount} cameras but only {channelCapacity} recorder channels. Please add a larger recorder!
            </div>
          )}
          {canAutoComplete && (
            <div className="mt-3">
              <button
                onClick={handleAutoCompleteSetup}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> 1-Click Auto-Complete Setup
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-6 md:py-12 text-slate-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Your cart is empty.</p>
              <p className="text-sm mt-1">Select items to build a quote.</p>
            </div>
          ) : (
            items.map(item => {
              const effQty = item.qty;
              return (
                <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 relative group">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{item.display_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">INR {item.unit_price.toLocaleString('en-IN')} × {effQty}</span>
                      {item.unit_multiplier === "camera_count" && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded font-bold">Auto (Per Cam)</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end justify-between">
                    <span className="font-black text-slate-900">INR {(item.unit_price * effQty).toLocaleString('en-IN')}</span>
                    {item.unit_multiplier !== "camera_count" && (
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQty(item.id, item.qty - 1)} className="text-slate-400 hover:text-slate-700">
                          {item.qty === 1 ? <Trash2 className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4" />}
                        </button>
                        <QtyInput qty={item.qty} onUpdate={(q) => updateQty(item.id, q)} className="text-base sm:text-xs font-bold w-10 text-center" />
                        <button onClick={() => updateQty(item.id, item.qty + 1)} className="text-slate-400 hover:text-slate-700">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {item.unit_multiplier === "camera_count" && (
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 mt-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-slate-200">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Subtotal</span>
                <span>INR {getTotal().toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>GST (18%)</span>
                <span>INR {Math.round(getTotal() * 0.18).toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-end">
                <span className="text-sm font-bold text-slate-900">Grand Total</span>
                <span className="text-2xl font-black text-blue-600">INR {Math.round(getTotal() * 1.18).toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            {(() => {
                const poeSwitchesInCart = items.filter(i => {
                   const name = (i.display_name || "").toLowerCase();
                   return name.includes("poe switch") || name.includes("p.o.e");
                }).reduce((acc, i) => acc + i.qty, 0);
                const hasCoreSwitch = items.some(i => {
                   const name = (i.display_name || "").toLowerCase();
                   return (name.includes("gigabit") || name.includes("desktop switch")) && !name.includes("poe");
                });
                
                if (poeSwitchesInCart >= 3 && !hasCoreSwitch) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4 text-xs text-amber-800">
                      <span className="font-bold">⚠️ Architecture Warning:</span> You have {poeSwitchesInCart} PoE switches. You will need a Gigabit Desktop Switch (Core Hub) to link them to the NVR. Add it from the "Optional Upgrades" section.
                    </div>
                  );
                }
                return null;
              })()}

              <Button 
                onClick={handleCheckout} 
                disabled={isGenerating || items.length === 0} 
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-lg font-bold shadow-xl shadow-emerald-600/20"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Generate Quote"}
              </Button>
          </div>
        )}
      </div>
    </div>
  );
}







