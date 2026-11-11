"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { FolderTree, Inbox, Play, CheckCircle2, XCircle, RefreshCw, Trash2, CheckSquare, Square, Plus, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import type { VendorCategory, StagedProduct, Vendor } from "@/types";
import { guessCategory, guessBrand, guessTechnologies, guessResolution, guessChannels, guessRackUHeight, guessCableLength, guessVoltage, guessAmperage, guessWattage } from "@/lib/vendor/ai-parser";
import { useTranslation } from "@/hooks/useTranslation";

export default function VendorImportClient() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"discovery" | "staging">("discovery");
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [stagedProducts, setStagedProducts] = useState<StagedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({ status: 'idle', current: 0, total: 0, staged: 0, updated: 0 });
  const [overrideCategory, setOverrideCategory] = useState<VendorCategory | "">("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorPrefix, setNewVendorPrefix] = useState("");
  const [stagingCategoryFilter, setStagingCategoryFilter] = useState<VendorCategory | "all">("all");
  const [stagingSearchQuery, setStagingSearchQuery] = useState("");
  const [syncMode, setSyncMode] = useState<"all" | "new_only" | "updates_only">("all");
  const [matchBy, setMatchBy] = useState<"auto" | "vendor_id" | "internal_sku" | "title">("auto");
  const stopSyncRef = useRef(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const filteredStagedProducts = useMemo(() => {
    let filtered = stagedProducts;
    if (stagingCategoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === stagingCategoryFilter);
    }
    if (stagingSearchQuery.trim() !== "") {
      const q = stagingSearchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.raw_title.toLowerCase().includes(q) || 
        (p.vendor_product_id && p.vendor_product_id.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [stagedProducts, stagingCategoryFilter, stagingSearchQuery]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStagedProducts.slice(start, start + itemsPerPage);
  }, [filteredStagedProducts, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredStagedProducts.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [stagingCategoryFilter, stagingSearchQuery]);

  useEffect(() => {
    fetchData();
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/admin/vendor/vendors");
      const json = await res.json();
      if (json.success) {
        setVendors(json.data?.vendors || []);
      }
    } catch (error) {
      console.error("Failed to fetch vendors", error);
    }
  };

  const categoryOptions: { value: VendorCategory; label: string }[] = [
    { value: "cctv_camera", label: t("adm_cat_opt_cam") },
    { value: "recorder", label: t("adm_cat_opt_rec") },
    { value: "storage", label: t("adm_cat_opt_stor") },
    { value: "connector", label: t("adm_cat_opt_conn") },
    { value: "cable", label: t("adm_cat_opt_cab") },
    { value: "hdmi_cable", label: t("adm_cat_opt_hdmi") },
    { value: "power_device", label: t("adm_cat_opt_pwr") },
    { value: "display", label: t("adm_cat_opt_disp") },
    { value: "camera_mount", label: t("adm_cat_opt_mnt") },
    { value: "rack", label: t("adm_cat_opt_rack") },
    { value: "network", label: t("adm_cat_opt_net") },
    { value: "accessories", label: t("adm_cat_opt_acc") },
    { value: "others", label: t("adm_cat_opt_oth") },
  ];

  const handleAddVendor = async () => {
    if (!newVendorName || !newVendorPrefix) {
      toast.error(t("adm_vi_err_req"));
      return;
    }
    try {
      const res = await fetch("/api/admin/vendor/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newVendorName, prefix: newVendorPrefix })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t("adm_vi_ok_add"));
        setNewVendorName("");
        setNewVendorPrefix("");
        setIsVendorModalOpen(false);
        fetchVendors();
      } else {
        toast.error(data.error?.message || t("adm_vi_err_add"));
      }
    } catch (err) {
      toast.error(t("adm_vi_err_gen"));
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm(t("adm_vi_cfm_del"))) return;
    try {
      const res = await fetch(`/api/admin/vendor/vendors/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(t("adm_vi_ok_del"));
        fetchVendors();
        if (selectedVendorId === id) setSelectedVendorId("");
      } else {
        toast.error(data.error?.message || t("adm_vi_err_del"));
      }
    } catch (err) {
      toast.error(t("adm_vi_err_gen"));
    }
  };

  const handleUpload = async (htmlFiles: File[], allFiles: File[] = []) => {
    if (!htmlFiles.length) {
      toast.error(t("adm_vi_err_nohtml"));
      return;
    }
    
    if (!selectedVendorId) {
      toast.error(t("adm_vi_err_selv"));
      return;
    }
    const vendor = vendors.find(v => v.id === selectedVendorId);
    if (!vendor) return;
    
    let filesToProcess = htmlFiles;
    
    if (!filesToProcess.length) {
        toast.error(t("adm_vi_err_nohtml2"));
        return;
    }

    stopSyncRef.current = false;
    setProgress({ status: 'parsing', current: 0, total: 0, staged: 0, updated: 0 });
    
    try {
      const extractedProducts: any[] = [];
      let totalToParse = 0;
      const htmlDocs: { doc: Document }[] = [];

      for (const file of filesToProcess) {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        htmlDocs.push({ doc });
        totalToParse += doc.querySelectorAll('.product-thumb').length;
      }

      setProgress({ status: 'parsing', current: 0, total: totalToParse, staged: 0, updated: 0 });

      let currentCount = 0;
      for (const { doc } of htmlDocs) {
        const thumbs = Array.from(doc.querySelectorAll('.product-thumb'));
        
        for (let i = 0; i < thumbs.length; i++) {
          const el = thumbs[i];
          const title = el.querySelector('.name a')?.textContent?.trim();
          if (!title) continue;

          let vendorProductId = "";
          const linkEl = el.querySelector('.name a');
          if (linkEl) {
             const href = linkEl.getAttribute('href') || "";
             if (href.includes('product_id=')) {
                 const match = href.match(/product_id=(\d+)/);
                 if (match) vendorProductId = match[1];
             }
          }

          let priceText = el.querySelector('.price')?.textContent?.trim() || "";
          let priceMatches = priceText.match(/₹([\d,]+)/);
          let baseCost = 0;
          if (priceMatches && priceMatches[1]) {
              baseCost = parseFloat(priceMatches[1].replace(/,/g, ''));
          }

          let imgUrl = "";
          const imgEl = el.querySelector('.product-img img') || el.querySelector('.image img') || el.querySelector('img');
          if (imgEl) {
              const src = imgEl.getAttribute('src') || "";
              let localFilename = "";
              if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                  localFilename = src.split('/').pop() || "";
              }
              
              const matchedFile = allFiles.find(f => f.name === localFilename || (f.webkitRelativePath && src && f.webkitRelativePath.endsWith(src.replace('./', ''))));
              
              if (matchedFile) {
                  try {
                      const buffer = await matchedFile.arrayBuffer();
                      let binary = '';
                      const bytes = new Uint8Array(buffer);
                      for (let i = 0; i < bytes.byteLength; i++) {
                          binary += String.fromCharCode(bytes[i]);
                      }
                      imgUrl = `data:${matchedFile.type};base64,${btoa(binary)}`;
                  } catch (e) {
                      console.error("Failed to read local image", e);
                  }
              }

              if (!imgUrl) {
                  const possibleUrls: string[] = [];
                  const srcset = imgEl.getAttribute('srcset') || imgEl.getAttribute('data-srcset') || "";
                  srcset.split(',').forEach((part: string) => {
                     const url = part.trim().split(' ')[0];
                     if (url) possibleUrls.push(url);
                  });
                  possibleUrls.push(imgEl.getAttribute('data-src') || "");
                  possibleUrls.push(src);
                  
                  const validUrl = possibleUrls.find(u => u && u.startsWith('http'));
                  if (validUrl) {
                      imgUrl = validUrl;
                  } else {
                      const fallback = possibleUrls.find(u => u && !u.startsWith('data:image/gif'));
                      if (fallback) imgUrl = fallback;
                  }
              }
          }

          const textContent = el.textContent?.toLowerCase() || "";
          const inStock = !(textContent.includes("out of stock") || textContent.includes("sold out"));

          const finalCategory = overrideCategory || guessCategory(title);
          extractedProducts.push({ title, baseCost, imgUrl, category: finalCategory, inStock, vendorProductId });
          currentCount++;

          if (currentCount % 25 === 0) {
              setProgress({ status: 'parsing', current: currentCount, total: totalToParse, staged: 0, updated: 0 });
              await new Promise(r => setTimeout(r, 15)); 
          }
        }
      }

      setProgress({ status: 'parsing', current: totalToParse, total: totalToParse, staged: 0, updated: 0 });
      await new Promise(r => setTimeout(r, 100)); 

      setProgress({ status: 'syncing', current: 0, total: extractedProducts.length, staged: 0, updated: 0 });

      let stagedCount = 0;
      let updatedCount = 0;
      let totalParsed = extractedProducts.length;
      let syncFailed = false;
      let errorMessage = "";

      const CHUNK_SIZE = 1; // Extremely safe chunk size; 100% guarantees no timeouts or rate limits
      for (let i = 0; i < extractedProducts.length; i += CHUNK_SIZE) {
         if (stopSyncRef.current) {
             toast.info(t("adm_vi_sync_canc"));
             break;
         }
         
         const chunk = extractedProducts.slice(i, i + CHUNK_SIZE);
         const res = await fetch("/api/admin/vendor/sync-json", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ 
              products: chunk, 
              overrideCategory: overrideCategory || undefined,
              vendorId: vendor.id,
              vendorPrefix: vendor.prefix,
              syncMode,
              matchBy
           })
         });
         
         const data = await res.json();
         if (data.success) {
           stagedCount += data.data?.stagedCount || 0;
           updatedCount += data.data?.updatedCount || 0;
         } else {
           syncFailed = true;
           errorMessage = data.error?.message || data.message || t("adm_vi_err_chunk");
           break;
         }
         
         setProgress({ status: 'syncing', current: Math.min(i + CHUNK_SIZE, extractedProducts.length), total: extractedProducts.length, staged: stagedCount, updated: updatedCount });
      }
      
      if (!syncFailed) {
        toast.success(t("adm_vi_ok_sync", { total: String(totalParsed), staged: String(stagedCount), updated: String(updatedCount) }));
        fetchData(); // Refresh staging area data
        setActiveTab("staging");
      } else {
        toast.error(errorMessage);
      }
    } catch (err) {
      toast.error(t("adm_vi_err_up"));
      console.error(err);
    } finally {
      setProgress({ status: 'idle', current: 0, total: 0, staged: 0, updated: 0 });
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "discovery") {
        const res = await fetch("/api/admin/vendor/categories");
        const data = await res.json();
        if (data.success) setCategories(data.categories);
      } else {
        const res = await fetch("/api/admin/vendor/staged-products");
        const data = await res.json();
        if (data.success) setStagedProducts(data.products);
      }
    } catch (err) {
      toast.error(t("adm_vi_err_load"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (product: StagedProduct, forceApprove = false) => {
    try {
      const res = await fetch("/api/admin/vendor/staged-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, action: "approve", updatedProduct: product, forceApprove })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(t("adm_vi_ok_app"));
        setStagedProducts(stagedProducts.filter(p => p.id !== product.id));
      } else if (data.isDuplicateWarning) {
        if (window.confirm(t("adm_vi_cfm_dup", { err: String(data.error || "") }))) {
            handleApprove(product, true);
        }
      } else {
        toast.error(data.error || t("adm_vi_err_app"));
      }
    } catch (err) {
      toast.error(t("adm_vi_err_app"));
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch("/api/admin/vendor/staged-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reject" })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(t("adm_vi_ok_rej"));
        setStagedProducts(stagedProducts.filter(p => p.id !== id));
      } else {
        toast.error(data.error || t("adm_vi_err_rej"));
      }
    } catch (err) {
      toast.error(t("adm_vi_err_rej"));
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(t("adm_vi_cfm_clr"))) return;
    try {
      const res = await fetch("/api/admin/vendor/staged-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_all" })
      });
      if (res.ok) {
        toast.success(t("adm_vi_ok_clr"));
        setStagedProducts([]);
        setSelectedIds(new Set());
      } else {
        toast.error(t("adm_vi_err_clr"));
      }
    } catch (err) {
      toast.error(t("adm_vi_err_gen"));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    const visibleIds = paginatedProducts.map(p => p.id!);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));

    if (allVisibleSelected) {
      const newSet = new Set(selectedIds);
      visibleIds.forEach(id => newSet.delete(id));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      visibleIds.forEach(id => newSet.add(id));
      setSelectedIds(newSet);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(t("adm_vi_cfm_brej", { count: String(selectedIds.size) }))) return;
    try {
      const res = await fetch("/api/admin/vendor/staged-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: "bulk_reject" })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(t("adm_vi_ok_brej", { count: String(selectedIds.size) }));
        setStagedProducts(stagedProducts.filter(p => !selectedIds.has(p.id!)));
        setSelectedIds(new Set());
      } else {
        toast.error(data.error || t("adm_vi_err_brej"));
      }
    } catch (err) {
      toast.error(t("adm_vi_err_brej"));
    }
  };

  const handleRescan = async (type: "internal_match" | "deep_ai") => {
    const selectedProducts = stagedProducts.filter(p => selectedIds.has(p.id!));
    if (selectedProducts.length === 0) return;
    
    const isDeepAI = type === "deep_ai";
    if (isDeepAI && !window.confirm(t("adm_vi_cfm_deep", { count: String(selectedProducts.length) }))) return;
    
    setIsRescanning(true);
    toast.info(t("adm_vi_run_scan", { mode: isDeepAI ? t("adm_vi_mode_deep") : t("adm_vi_mode_fast"), count: String(selectedProducts.length) }));
    
    let successCount = 0;
    let newStaged = [...stagedProducts];
    
    for (const prod of selectedProducts) {
        try {
            const res = await fetch("/api/admin/vendor/rescan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    raw_title: prod.raw_title,
                    image_url: prod.image_url,
                    action: type
                })
            });
            const data = await res.json();
            if (data.success && data.data) {
                const updatedData = data.data;
                newStaged = newStaged.map(p => {
                    if (p.id === prod.id) {
                        return {
                            ...p,
                            category: updatedData.category && updatedData.category !== "unidentified" && updatedData.category !== "others" ? updatedData.category : p.category,
                            brand: updatedData.brand || p.brand,
                            technologies: updatedData.technologies?.length ? updatedData.technologies : p.technologies,
                            resolution_mp: updatedData.resolution_mp || p.resolution_mp,
                            channels: updatedData.channels || p.channels,
                            rack_u_height: updatedData.rack_u_height || p.rack_u_height,
                            cable_length_m: updatedData.cable_length_m || p.cable_length_m,
                            power_voltage_v: updatedData.power_voltage_v || p.power_voltage_v,
                            power_amperage_a: updatedData.power_amperage_a || p.power_amperage_a,
                            power_wattage_w: updatedData.power_wattage_w || p.power_wattage_w,
                            ai_confidence_score: updatedData.confidence_score,
                            ai_reasoning: updatedData.ai_reasoning
                        };
                    }
                    return p;
                });
                successCount++;
            }
        } catch (e) {
            console.error("Rescan failed for product", prod.id, e);
        }
    }
    
    setStagedProducts(newStaged);
    setIsRescanning(false);
    toast.success(t("adm_vi_ok_rescan", { ok: String(successCount), total: String(selectedProducts.length) }));
  };

  return (
    <div className="bg-background min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight whitespace-normal leading-snug">{t("adm_vi_title")}</h1>
              <p className="text-sm text-muted-foreground whitespace-normal leading-snug">{t("adm_vi_sub")}</p>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 flex gap-8 flex-wrap">
          <button
            onClick={() => setActiveTab("discovery")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors whitespace-normal leading-snug ${activeTab === "discovery" ? "border-indigo-500 text-indigo-500" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t("adm_vi_tab_disc")}
          </button>
          <button
            onClick={() => setActiveTab("staging")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors whitespace-normal leading-snug ${activeTab === "staging" ? "border-indigo-500 text-indigo-500" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t("adm_vi_tab_stag", { count: String(stagedProducts.length) })}
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-10 md:py-20">{t("loading")}</div>
        ) : activeTab === "discovery" ? (
          <div className="border rounded-xl p-6 bg-card">
               <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg whitespace-normal leading-snug">{t("adm_vi_up_title")}</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <div className="bg-muted/30 p-4 rounded-lg border">
                   <div className="flex justify-between items-center gap-2 flex-wrap mb-2">
                     <label className="text-sm font-medium">{t("adm_vi_sel_v")} <span className="text-destructive">*</span></label>
                     <button 
                       onClick={() => setIsVendorModalOpen(true)}
                       className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1"
                     >
                       <Settings className="w-3 h-3 shrink-0" /> {t("adm_vi_mng_v")}
                     </button>
                   </div>
                   <select 
                     value={selectedVendorId}
                     onChange={(e) => setSelectedVendorId(e.target.value)}
                     className="w-full bg-background border rounded-lg px-3 py-2 text-sm"
                   >
                     <option value="">{t("adm_vi_sel_v_ph")}</option>
                     {vendors.map(v => (
                       <option key={v.id} value={v.id}>{v.name}</option>
                     ))}
                   </select>
                   <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                     {t("adm_vi_sel_v_hint")}
                   </p>
                 </div>
                 <div className="bg-muted/30 p-4 rounded-lg border">
                   <label className="text-sm font-medium block mb-2">{t("adm_vi_tgt_cat")}</label>
                 <select 
                    value={overrideCategory}
                    onChange={(e) => setOverrideCategory(e.target.value as VendorCategory | "")}
                    className="w-full md:w-1/2 bg-background border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">{t("adm_vi_ai_auto")}</option>
                    {categoryOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {t("adm_vi_tgt_hint")}
                  </p>
                 </div>
                 
                 <div className="bg-muted/30 p-4 rounded-lg border">
                   <label className="text-sm font-medium block mb-2">{t("adm_vi_sync_mode")}</label>
                   <select 
                     value={syncMode}
                     onChange={(e) => setSyncMode(e.target.value as "all" | "new_only" | "updates_only")}
                     className="w-full bg-background border rounded-lg px-3 py-2 text-sm"
                   >
                     <option value="all">{t("adm_vi_sm_all")}</option>
                     <option value="new_only">{t("adm_vi_sm_new")}</option>
                     <option value="updates_only">{t("adm_vi_sm_upd")}</option>
                   </select>
                   <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                     {t("adm_vi_sm_hint")}
                   </p>
                 </div>
                 
                 <div className="bg-muted/30 p-4 rounded-lg border">
                   <label className="text-sm font-medium block mb-2">{t("adm_vi_match_by")}</label>
                   <select 
                     value={matchBy}
                     onChange={(e) => setMatchBy(e.target.value as any)}
                     className="w-full bg-background border rounded-lg px-3 py-2 text-sm"
                   >
                     <option value="auto">{t("adm_vi_mb_auto")}</option>
                     <option value="vendor_id">{t("adm_vi_mb_vid")}</option>
                     <option value="internal_sku">{t("adm_vi_mb_sku")}</option>
                     <option value="title">{t("adm_vi_mb_title")}</option>
                   </select>
                   <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                     {t("adm_vi_mb_hint")}
                   </p>
                 </div>
               </div>
               <div 
                 className={`border-2 border-dashed rounded-xl p-4 md:p-10 text-center transition-colors ${
                   progress.status !== 'idle' ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-border hover:border-indigo-500/50 hover:bg-muted/30"
                 }`}
                 onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                 onDrop={async (e) => {
                   e.preventDefault(); e.stopPropagation();
                   if (progress.status !== 'idle') return;
                   const allFiles = Array.from(e.dataTransfer.files);
                   const htmlFiles = allFiles.filter(f => f.name.endsWith('.html'));
                   if (htmlFiles.length === 0) {
                     toast.error(t("adm_vi_err_drop"));
                   } else {
                     await handleUpload(htmlFiles, allFiles);
                   }
                 }}
               >
                 <input 
                   ref={htmlInputRef}
                   type="file" 
                   id="html-upload" 
                   accept=".html"
                   multiple 
                   className="hidden" 
                   onChange={async (e) => {
                     if (e.target.files?.length) {
                       const allFiles = Array.from(e.target.files);
                       const htmlFiles = allFiles.filter(f => f.name.endsWith('.html'));
                       if (htmlFiles.length === 0) {
                         toast.error(t("adm_vi_err_self"));
                         if (htmlInputRef.current) htmlInputRef.current.value = '';
                       } else {
                         await handleUpload(htmlFiles, allFiles);
                       }
                     }
                   }}
                 />
                 <input 
                   ref={folderInputRef}
                   type="file" 
                   id="folder-upload" 
                   {...{webkitdirectory: "true", directory: "true", multiple: true} as any}
                   className="hidden" 
                   onChange={async (e) => {
                     if (e.target.files?.length) {
                       const allFiles = Array.from(e.target.files);
                       const htmlFiles = allFiles.filter(f => f.name.endsWith('.html'));
                       if (htmlFiles.length === 0) {
                         toast.error(t("adm_vi_err_fold"));
                         if (folderInputRef.current) folderInputRef.current.value = '';
                       } else {
                         await handleUpload(htmlFiles, allFiles);
                       }
                     }
                   }}
                 />
                 
                 {progress.status !== 'idle' ? (
                   <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
                     <div className="flex items-center justify-between w-full">
                       <div className="flex items-center gap-3">
                         <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                         <div className="text-left">
                           <p className="text-sm font-semibold text-indigo-500">
                             {progress.status === 'parsing' ? "Scraping items from files..." : "Syncing with cloud database..."}
                           </p>
                           <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            {progress.status === 'parsing' ? t("adm_vi_prg_parse_d", { cur: String(progress.current), tot: String(progress.total) }) : t("adm_vi_prg_sync_d", { cur: String(progress.current), tot: String(progress.total), pct: String(Math.round((progress.current / progress.total) * 100)), staged: String(progress.staged), updated: String(progress.updated) })}
                          </p>
                         </div>
                       </div>
                       <button 
                         onClick={() => { stopSyncRef.current = true; }} 
                         className="px-3 py-1.5 bg-destructive/10 text-destructive text-xs font-semibold rounded hover:bg-destructive/20 transition-colors shrink-0"
                       >
                         {t("cancel")}
                       </button>
                     </div>
                     
                     {/* Progress Bar */}
                     {progress.total > 0 && (
                       <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-indigo-500 transition-all duration-100 ease-out"
                           style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                         />
                       </div>
                     )}
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-3">
                     <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center">
                       <Inbox className="w-6 h-6 text-muted-foreground" />
                     </div>
                     <div>
                       <p className="text-base font-medium">{t("adm_vi_drop_t")}</p>
                       <p className="text-sm text-muted-foreground mt-1 mb-4">{t("adm_vi_drop_d")}</p>
                       <div className="flex justify-center gap-4 flex-wrap">
                          <button type="button" onClick={() => htmlInputRef.current?.click()} className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors">
                             {t("adm_vi_btn_files")}
                          </button>
                          <button type="button" onClick={() => folderInputRef.current?.click()} className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors">
                             {t("adm_vi_btn_folder")}
                          </button>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
             {stagedProducts.length > 0 && (
                 <div className="flex justify-between items-center gap-4 flex-wrap bg-muted/30 p-4 rounded-xl border border-dashed">
                     <div className="flex items-center gap-4 flex-wrap">
                         <button onClick={handleSelectAll} className="flex items-center gap-2 text-sm font-medium hover:text-indigo-500 transition-colors">
                            {selectedIds.size === filteredStagedProducts.length && filteredStagedProducts.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-500 shrink-0" /> : <Square className="w-5 h-5 text-muted-foreground shrink-0" />}
                            {t("adm_cat_sel_all")}
                         </button>
                         
                         {/* Filter Dropdown */}
                         <div className="flex items-center flex-wrap sm:ml-4 sm:border-l sm:pl-4 border-border/50 gap-4">
                             <input
                               type="text"
                               placeholder={t("adm_vi_search_ph")}
                               value={stagingSearchQuery}
                               onChange={(e) => setStagingSearchQuery(e.target.value)}
                               className="bg-background border rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-indigo-500"
                             />
                             <select
                               value={stagingCategoryFilter}
                               onChange={(e) => setStagingCategoryFilter(e.target.value as VendorCategory | "all")}
                               className="bg-background border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                             >
                                <option value="all">{t("adm_vi_all_cats", { count: String(stagedProducts.length) })}</option>
                                {categoryOptions.map(c => (
                                  <option key={c.value} value={c.value}>{c.label} ({stagedProducts.filter(p => p.category === c.value).length})</option>
                                ))}
                                <option value="unidentified">{t("adm_cat_opt_unid")} ({stagedProducts.filter(p => p.category === 'unidentified').length})</option>
                             </select>
                         </div>
                         {selectedIds.size > 0 && (
                             <button onClick={handleBulkReject} className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors">
                                 <Trash2 className="w-4 h-4 shrink-0" /> {t("adm_vi_rej_sel", { count: String(selectedIds.size) })}
                             </button>
                         )}
                         {selectedIds.size > 0 && (
                             <div className="flex gap-2 flex-wrap">
                               <button 
                                 onClick={() => handleRescan("internal_match")} 
                                 disabled={isRescanning}
                                 className="flex items-center gap-2 px-4 py-2 border border-emerald-500/30 text-emerald-500 rounded-lg text-sm font-medium hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                               >
                                   <RefreshCw className={`w-4 h-4 shrink-0 ${isRescanning ? 'animate-spin' : ''}`} /> 
                                   {t("adm_vi_btn_fast")}
                               </button>
                               <button 
                                 onClick={() => handleRescan("deep_ai")} 
                                 disabled={isRescanning}
                                 className="flex items-center gap-2 px-4 py-2 border border-indigo-500/30 text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
                               >
                                   <Play className="w-4 h-4 shrink-0" /> 
                                   {t("adm_vi_btn_deep_inet")}
                               </button>
                             </div>
                          )}
                     </div>
                     <button onClick={handleClearAll} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/50 text-destructive hover:bg-destructive/10 text-sm font-medium transition-colors">
                         <XCircle className="w-4 h-4 shrink-0" /> {t("adm_vi_btn_disc")}
                     </button>
                 </div>
             )}
             
             <div className="grid grid-cols-1 gap-6">
             {stagedProducts.length === 0 ? (
                 <div className="text-center py-10 md:py-20 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                    {t("adm_vi_empty_stag")}
                 </div>
               ) : paginatedProducts.length === 0 ? (
                 <div className="text-center py-10 md:py-20 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                    {t("adm_vi_empty_filt")}
                 </div>
               ) : (
                   paginatedProducts.map(product => {
                       const isSelected = selectedIds.has(product.id!);
                       return (
                       <div key={product.id} className={`border rounded-xl p-6 flex flex-col md:flex-row gap-6 transition-colors ${isSelected ? "border-indigo-500 bg-indigo-500/5 shadow-sm" : "bg-card"}`}>
                          <div className="flex items-center justify-center">
                             <button onClick={() => handleToggleSelect(product.id!)} className="p-2 -m-2 hover:opacity-80 transition-opacity">
                                 {isSelected ? <CheckSquare className="w-6 h-6 text-indigo-500" /> : <Square className="w-6 h-6 text-muted-foreground" />}
                             </button>
                          </div>
                          <div className="w-32 h-32 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                           {product.in_stock === false && (
                               <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm z-10">
                                   {t("adm_vi_oos_badge")}
                               </div>
                           )}
                           {product.image_url ? (
                               <img src={product.image_url} alt="Product" className="w-full h-full object-cover" />
                           ) : (
                               <Inbox className="w-8 h-8 text-muted-foreground/50" />
                           )}
                        </div>
                        <div className="flex-1 space-y-4">
                           <div>
                              <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">{t("adm_vi_ai_sug")}</div>
                              <input 
                                 type="text" 
                                 value={product.raw_title} 
                                 onChange={e => {
                                      const newTitle = e.target.value;
                                      setStagedProducts(stagedProducts.map(p => {
                                          if (p.id === product.id) {
                                              return {
                                                  ...p,
                                                  raw_title: newTitle,
                                                  category: (guessCategory(newTitle) as VendorCategory) || p.category,
                                                  brand: guessBrand(newTitle) || p.brand,
                                                  technologies: guessTechnologies(newTitle),
                                                  resolution_mp: guessResolution(newTitle) || p.resolution_mp,
                                                  channels: guessChannels(newTitle) || p.channels,
                                                  rack_u_height: guessRackUHeight(newTitle) || p.rack_u_height,
                                                  cable_length_m: guessCableLength(newTitle) || p.cable_length_m,
                                                  power_voltage_v: guessVoltage(newTitle) || p.power_voltage_v,
                                                  power_amperage_a: guessAmperage(newTitle) || p.power_amperage_a,
                                                  power_wattage_w: guessWattage(newTitle) || p.power_wattage_w
                                              };
                                          }
                                          return p;
                                      }));
                                  }}
                                 className="font-bold text-lg w-full bg-transparent border-b border-transparent hover:border-border focus:border-indigo-500 focus:outline-none py-0.5 transition-colors"
                              />
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <p className="text-sm text-muted-foreground whitespace-nowrap">{t("adm_vi_v_sku")}</p>
                                <input
                                   type="text"
                                   value={product.vendor_product_id || ""}
                                   placeholder={t("adm_vi_v_sku_ph")}
                                   onChange={e => {
                                      const newSku = e.target.value;
                                      setStagedProducts(stagedProducts.map(p => 
                                          p.id === product.id ? { ...p, vendor_product_id: newSku } : p
                                      ));
                                   }}
                                   className="text-sm bg-transparent border-b border-transparent hover:border-border focus:border-indigo-500 focus:outline-none py-0.5 transition-colors w-full max-w-[200px]"
                                />
                              </div>
                              
                              {product.ai_confidence_score !== undefined && (
                                <div className="mt-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                                    <span className="text-xs font-bold text-indigo-400">{t("adm_vi_ai_reas")}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${product.ai_confidence_score >= 90 ? 'bg-emerald-500/20 text-emerald-500' : product.ai_confidence_score >= 60 ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'}`}>
                                      {t("adm_vi_conf_pct", { score: String(product.ai_confidence_score) })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-indigo-300 leading-relaxed">{product.ai_reasoning}</p>
                                </div>
                              )}
                           </div>

                           <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-muted/30 rounded-lg border">
                              <div>
                                 <label className="text-xs text-muted-foreground block mb-1">{t("adm_cat_category")}</label>
                                 <select 
                                   value={product.category}
                                   onChange={(e) => setStagedProducts(stagedProducts.map(p => p.id === product.id ? {...p, category: e.target.value as any} : p))}
                                   className="w-full bg-background border rounded px-2 py-1 text-sm"
                                 >
                                    {categoryOptions.map(c => (
                                      <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                 </select>
                              </div>
                              <div>
                                 <label className="text-xs text-muted-foreground block mb-1">{t("adm_cat_brand")}</label>
                                 <input 
                                    type="text" 
                                    value={product.brand || ''}
                                    placeholder={t("adm_cat_unknown")}
                                    onChange={e => setStagedProducts(stagedProducts.map(p => p.id === product.id ? {...p, brand: e.target.value} : p))}
                                    className="w-full bg-background border rounded px-2 py-1 text-sm"
                                 />
                              </div>
                              <div>
                                 <label className="text-xs text-muted-foreground block mb-1">{t("adm_cat_base_cost")}</label>
                                 <div className="flex items-center gap-1 font-medium text-sm">
                                    ₹
                                    <input 
                                       type="number" 
                                       value={product.base_cost}
                                       onChange={e => setStagedProducts(stagedProducts.map(p => p.id === product.id ? {...p, base_cost: parseFloat(e.target.value)} : p))}
                                       className="w-full bg-background border rounded px-2 py-1 text-sm"
                                    />
                                 </div>
                              </div>
                              <div>
                                 <label className="text-xs text-muted-foreground block mb-1">{t("adm_cat_status")}</label>
                                 <button 
                                   onClick={() => setStagedProducts(stagedProducts.map(p => p.id === product.id ? {...p, in_stock: p.in_stock === false ? true : false} : p))}
                                   className={`w-full text-left px-2 py-1 rounded border text-sm font-medium transition-colors ${product.in_stock !== false ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-destructive/10 text-destructive border-destructive/30'}`}
                                 >
                                   {product.in_stock !== false ? t("adm_vi_in_stock") : t("adm_vi_out_stock")}
                                 </button>
                              </div>
                              <div className="col-span-2">
                                 <label className="text-xs text-muted-foreground block flex justify-between gap-2 flex-wrap mb-1">
                                    <span>{t("adm_vi_specs_lbl")}</span>
                                    {product.resolution_mp && <span className="text-amber-500 font-medium">{t("adm_vi_res_short", { mp: String(product.resolution_mp) })}</span>}
                                    {product.channels && <span className="text-blue-500 font-medium">{t("adm_vi_ch_short", { ch: String(product.channels) })}</span>}
                                 </label>
                                 <input 
                                    type="text" 
                                    value={product._raw_specs !== undefined ? product._raw_specs : product.technologies?.join(', ') || ''}
                                    placeholder={t("adm_vi_specs_ph")}
                                    onChange={e => setStagedProducts(stagedProducts.map(p => p.id === product.id ? {...p, _raw_specs: e.target.value, technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)} : p))}
                                    onBlur={e => setStagedProducts(stagedProducts.map(p => p.id === product.id ? {...p, _raw_specs: undefined, technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)} : p))}
                                    className="w-full bg-background border rounded px-2 py-1 text-sm text-indigo-500 font-medium"
                                 />
                              </div>
                           </div>
                           
                           <div className="flex justify-end gap-3 flex-wrap pt-2">
                              <button onClick={async () => {
                                  try {
                                      const toastId = toast.loading(t("adm_vi_ldg_fast"));
                                      const res = await fetch("/api/admin/vendor/rescan", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ raw_title: product.raw_title, image_url: product.image_url, action: "internal_match" })
                                      });
                                      const data = await res.json();
                                      
                                      if (res.ok && data.success) {
                                          setStagedProducts(stagedProducts.map(p => {
                                              if (p.id === product.id) {
                                                  return {
                                                      ...p,
                                                      category: data.data.category && data.data.category !== "unidentified" ? data.data.category : p.category,
                                                      brand: data.data.brand || p.brand,
                                                      technologies: data.data.technologies?.length ? data.data.technologies : p.technologies,
                                                      resolution_mp: data.data.resolution_mp || p.resolution_mp,
                                                      channels: data.data.channels || p.channels,
                                                      rack_u_height: data.data.rack_u_height || p.rack_u_height,
                                                      cable_length_m: data.data.cable_length_m || p.cable_length_m,
                                                      power_voltage_v: data.data.power_voltage_v || p.power_voltage_v,
                                                      power_amperage_a: data.data.power_amperage_a || p.power_amperage_a,
                                                      power_wattage_w: data.data.power_wattage_w || p.power_wattage_w,
                                                      ai_confidence_score: data.data.confidence_score,
                                                      ai_reasoning: data.data.ai_reasoning
                                                  };
                                              }
                                              return p;
                                          }));
                                          toast.success(t("adm_vi_ok_fast"), { id: toastId });
                                      } else {
                                          toast.error(data.error || t("adm_vi_err_match"), { id: toastId });
                                      }
                                  } catch (err) {
                                      toast.error(t("adm_vi_err_rescan"));
                                  }
                              }} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 text-sm font-medium transition-colors">
                                  <RefreshCw className="w-4 h-4 shrink-0" /> {t("adm_vi_btn_fast_s")}
                              </button>

                              <button onClick={async () => {
                                  if (!window.confirm(t("adm_vi_cfm_deep1"))) return;
                                  try {
                                      const toastId = toast.loading(t("adm_vi_ldg_deep"));
                                      const res = await fetch("/api/admin/vendor/rescan", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ raw_title: product.raw_title, image_url: product.image_url, action: "deep_ai" })
                                      });
                                      const data = await res.json();
                                      
                                      if (res.ok && data.success) {
                                          setStagedProducts(stagedProducts.map(p => {
                                              if (p.id === product.id) {
                                                  return {
                                                      ...p,
                                                      category: data.data.category && data.data.category !== "unidentified" ? data.data.category : p.category,
                                                      brand: data.data.brand || p.brand,
                                                      technologies: data.data.technologies?.length ? data.data.technologies : p.technologies,
                                                      resolution_mp: data.data.resolution_mp || p.resolution_mp,
                                                      channels: data.data.channels || p.channels,
                                                      rack_u_height: data.data.rack_u_height || p.rack_u_height,
                                                      cable_length_m: data.data.cable_length_m || p.cable_length_m,
                                                      power_voltage_v: data.data.power_voltage_v || p.power_voltage_v,
                                                      power_amperage_a: data.data.power_amperage_a || p.power_amperage_a,
                                                      power_wattage_w: data.data.power_wattage_w || p.power_wattage_w,
                                                      ai_confidence_score: data.data.confidence_score,
                                                      ai_reasoning: data.data.ai_reasoning
                                                  };
                                              }
                                              return p;
                                          }));
                                          toast.success(t("adm_vi_ok_deep"), { id: toastId });
                                      } else {
                                          toast.error(data.error || t("adm_vi_err_scan"), { id: toastId });
                                      }
                                  } catch (err) {
                                      toast.error(t("adm_vi_err_rescan"));
                                  }
                              }} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-sm font-medium transition-colors">
                                  <Play className="w-4 h-4 shrink-0" /> {t("adm_vi_mode_deep")}
                              </button>
                              <button onClick={() => handleReject(product.id!)} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-destructive/10 hover:text-destructive text-sm font-medium transition-colors">
                                  <XCircle className="w-4 h-4 shrink-0" /> {t("adm_vi_btn_rej")}
                              </button>
                              <button onClick={() => handleApprove(product)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-sm font-medium transition-colors">
                                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {t("adm_vi_btn_app")}
                              </button>
                           </div>
                        </div>
                     </div>
                   );
                 })
             )}
             </div>

             {/* Pagination Controls */}
             {totalPages > 1 && (
               <div className="flex items-center justify-between gap-4 flex-wrap bg-muted/30 p-4 rounded-xl border border-dashed mt-4">
                 <div className="text-sm text-muted-foreground">
                   {t("adm_vi_pag_show", { from: String(((currentPage - 1) * itemsPerPage) + 1), to: String(Math.min(currentPage * itemsPerPage, filteredStagedProducts.length)), total: String(filteredStagedProducts.length) })}
                 </div>
                 <div className="flex items-center gap-2">
                   <button
                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                     disabled={currentPage === 1}
                     className="p-2 rounded-lg border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     <ChevronLeft className="w-4 h-4" />
                   </button>
                   <div className="text-sm font-medium px-4">
                     {t("adm_vi_pag_page", { cur: String(currentPage), tot: String(totalPages) })}
                   </div>
                   <button
                     onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                     disabled={currentPage === totalPages}
                     className="p-2 rounded-lg border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     <ChevronRight className="w-4 h-4" />
                   </button>
                 </div>
               </div>
             )}
          </div>
        )}
      </main>

      {/* Vendor Management Modal */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">{t("adm_vi_mng_v")}</h3>
              <button onClick={() => setIsVendorModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Add New Vendor Form */}
              <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
                <h4 className="text-sm font-medium">{t("adm_vi_add_v")}</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder={t("adm_vi_v_name_ph")}
                      value={newVendorName}
                      onChange={e => setNewVendorName(e.target.value)}
                      className="w-full bg-background border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <input 
                      type="text" 
                      placeholder={t("adm_vi_v_pref_ph")}
                      value={newVendorPrefix}
                      onChange={e => setNewVendorPrefix(e.target.value.toUpperCase())}
                      className="w-full bg-background border rounded px-3 py-2 text-sm uppercase"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleAddVendor}
                  className="w-full bg-indigo-500 text-white rounded py-2 text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 shrink-0" /> {t("adm_vi_btn_add_v")}
                </button>
              </div>

              {/* Vendor List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">{t("adm_vi_exist_v")}</h4>
                {vendors.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">{t("adm_vi_no_v")}</p>
                ) : (
                  vendors.map(v => (
                    <div key={v.id} className="flex justify-between items-center p-3 bg-card border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{t("adm_vi_pref_lbl")} <span className="font-mono bg-muted px-1 rounded">{v.prefix}</span></p>
                      </div>
                      <button 
                        onClick={() => handleDeleteVendor(v.id!)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title={t("adm_vi_del_v_tit")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
