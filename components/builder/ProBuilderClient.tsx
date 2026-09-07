"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCartStore } from "@/stores/useCartStore";
import { 
  Loader2, ShoppingCart, Trash2, AlertTriangle, Plus, Minus, Lock, Unlock,
  Search, X, ArrowUpDown, Filter, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ProBuilderClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutName, setCheckoutName] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const router = useRouter();

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
    { id: "cable", label: "Cables" },
    { id: "power", label: "Power" },
    { id: "accessory", label: "Accessories" },
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
    fetch("/api/catalog")
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

            let normCat = "accessory";
            if (cat.includes("camera") || cat.includes("cctv_camera")) normCat = "camera";
            else if (cat.includes("recorder") || cat.includes("dvr") || cat.includes("nvr")) normCat = "recorder";
            else if (cat.includes("storage") || cat.includes("hdd")) normCat = "storage";
            else if (isCable) normCat = "cable";
            else if (cat.includes("power") || cat.includes("network") || cat.includes("power_device")) normCat = "power";
            else if (cat === "installation" || cat === "labor") normCat = "installation";

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
    const hasDomes = categoryProducts.some(p => p.derivedFormFactor === "dome");
    const hasBullets = categoryProducts.some(p => p.derivedFormFactor === "bullet");

    return { brands, resolutions, channels, capacities, cableTypes, hasDomes, hasBullets };
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
        // Cascading Filter: Hide recorders with fewer channels than the number of cameras in the cart
        if (p.derivedChannels && p.derivedChannels < camCount) return false;
        
        if (filterChannels !== "all" && String(p.derivedChannels) !== filterChannels) return false;
      } else if (activeCategory === "storage") {
        if (filterCapacity !== "all" && p.derivedCapacity !== filterCapacity) return false;
      } else if (activeCategory === "cable") {
        if (filterCableType !== "all" && p.derivedCableType !== filterCableType) return false;
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

  const initiateCheckout = () => {
    setPhoneError("");
    setShowCheckoutForm(true);
  };

  const handleCheckout = async () => {
    // Validate phone from inline form state
    const cleanedPhone = checkoutPhone.replace(/\D/g, "").slice(-10);
    if (cleanedPhone.length !== 10 || !/^[6-9]/.test(cleanedPhone)) {
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
          customer_name: checkoutName || "Pro Builder Client",
          customer_mobile: cleanedPhone,
          requirementSnapshot: {
            installation_type: "new",
            camera_count: camCount,
            technology_preference: technology || "IP",
            is_pro_builder: true
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
        router.push(data.leadId ? `/quote/${data.leadId}` : `/quote/${data.quoteId}`);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pro Builder</h1>
            <p className="text-slate-500 mt-2">Build a custom quotation item by item.</p>
          </div>
          
          <div className={`p-4 rounded-xl border flex items-center gap-4 ${technology ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${technology ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {technology ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">
                {technology ? `Technology Locked: ${technology}` : "Open Architecture"}
              </h3>
              <p className="text-sm text-slate-500">
                {technology ? "Catalog is automatically filtered to show only compatible parts." : "Select your first camera or recorder to lock the technology."}
              </p>
            </div>
            {technology && (
              <Button variant="outline" size="sm" onClick={clearCart} className="text-red-600 border-red-200 hover:bg-red-50">
                Clear & Reset
              </Button>
            )}
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
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b border-slate-200 scrollbar-hide">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-2 shrink-0">
                <button
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
                {idx < STEPS.length - 1 && (
                  <div className="w-4 h-[1px] bg-slate-200" />
                )}
              </div>
            ))}
          </div>

          {activeStepIndex === 0 ? (
            <div className="py-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-slate-900">Choose Your Base Technology</h2>
                <p className="text-slate-500 mt-2">This will automatically filter all compatible cameras and recorders.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <button 
                  onClick={() => { setTechnology("IP"); handleStepChange(1, "IP"); }}
                  className={`p-8 rounded-3xl border-2 text-left transition-all ${technology === "IP" ? "border-blue-600 ring-4 ring-blue-50 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg"}`}
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
                  className={`p-8 rounded-3xl border-2 text-left transition-all ${technology === "HD" ? "border-blue-600 ring-4 ring-blue-50 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg"}`}
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
                      {(filterOptions.hasDomes || filterOptions.hasBullets) && (
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

                      {filterOptions.resolutions.length > 0 && (
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

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Night Vision:</span>
                        <button
                          onClick={() => setFilterNightVision("all")}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterNightVision === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setFilterNightVision("Color")}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterNightVision === "Color" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          Color
                        </button>
                        <button
                          onClick={() => setFilterNightVision("B&W")}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${filterNightVision === "B&W" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          B&W
                        </button>
                      </div>
                    </>
                  )}

                  {/* Recorder Filters */}
                  {activeCategory === "recorder" && filterOptions.channels.length > 0 && (
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
                  {activeCategory === "storage" && filterOptions.capacities.length > 0 && (
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
                  {activeCategory === "cable" && filterOptions.cableTypes.length > 0 && (
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

                        <div className="text-lg font-black text-slate-900 pt-1">
                          INR {p.unit_price.toLocaleString('en-IN')}
                          {p.unit_multiplier === "camera_count" && <span className="text-[10px] text-slate-400 ml-1">/ cam</span>}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        {inCart ? (
                          <div className="flex items-center justify-between bg-blue-50 rounded-xl p-1">
                            <button onClick={() => updateQty(p.id, inCart.qty - 1)} className="w-8 h-8 flex items-center justify-center bg-white text-blue-600 rounded-lg shadow-sm font-black">-</button>
                            <span className="font-bold text-blue-900">{inCart.qty}</span>
                            <button onClick={() => addItem(p)} className="w-8 h-8 flex items-center justify-center bg-white text-blue-600 rounded-lg shadow-sm font-black">+</button>
                          </div>
                        ) : (
                          <Button onClick={() => addItem(p)} className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-md">
                            Add to Quote
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8">
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
              
              {/* Sticky Next Button */}
              {activeStepIndex > 0 && activeStepIndex < STEPS.length - 1 && (
                <div className="sticky bottom-6 mt-8 w-full max-w-sm mx-auto z-20">
                  <Button 
                    onClick={handleNextStep}
                    className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-2xl shadow-slate-900/20 text-lg font-bold flex items-center justify-between px-6"
                  >
                    <span>Next: {STEPS[activeStepIndex + 1].label}</span>
                    <span>→</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="w-full md:w-[400px] bg-white border-l border-slate-200 h-screen overflow-y-auto flex flex-col shadow-2xl z-10 sticky top-0">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> Current Build
            </h2>
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">{items.length} items</span>
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
            <div className="text-center py-12 text-slate-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Your cart is empty.</p>
              <p className="text-sm mt-1">Select items to build a quote.</p>
            </div>
          ) : (
            items.map(item => {
              const effQty = item.unit_multiplier === "camera_count" ? camCount : item.qty;
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
                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
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
            
            {showCheckoutForm ? (
              <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={checkoutPhone}
                    onChange={(e) => { setCheckoutPhone(e.target.value); setPhoneError(""); }}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    maxLength={13}
                    autoFocus
                  />
                  {phoneError && <p className="text-red-600 text-xs mt-1 font-medium">{phoneError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Name (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowCheckoutForm(false)}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    disabled={isGenerating}
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Generate Quote"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                onClick={initiateCheckout} 
                disabled={isGenerating || items.length === 0} 
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-bold shadow-xl shadow-blue-600/20"
              >
                Review & Download PDF
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
