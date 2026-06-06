"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { FolderTree, Inbox, Play, CheckCircle2, XCircle, RefreshCw, Trash2, CheckSquare, Square, Plus, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import type { VendorCategory, StagedProduct, Vendor } from "@/types";
import { guessCategory, guessBrand, guessTechnologies, guessResolution, guessChannels, guessRackUHeight, guessCableLength, guessVoltage, guessAmperage, guessWattage } from "@/lib/vendor/ai-parser";
export default function VendorImportClient() {
  const [activeTab, setActiveTab] = useState<"discovery" | "staging">("discovery");
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [stagedProducts, setStagedProducts] = useState<StagedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({ status: 'idle', current: 0, total: 0 });
  const [overrideCategory, setOverrideCategory] = useState<VendorCategory | "">("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorPrefix, setNewVendorPrefix] = useState("");
  const [stagingCategoryFilter, setStagingCategoryFilter] = useState<VendorCategory | "all">("all");
  const [stagingSearchQuery, setStagingSearchQuery] = useState("");
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

  const handleAddVendor = async () => {
    if (!newVendorName || !newVendorPrefix) {
      toast.error("Name and prefix are required");
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
        toast.success("Vendor added successfully");
        setNewVendorName("");
        setNewVendorPrefix("");
        setIsVendorModalOpen(false);
        fetchVendors();
      } else {
        toast.error(data.error?.message || "Failed to add vendor");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    try {
      const res = await fetch(`/api/admin/vendor/vendors/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Vendor deleted");
        fetchVendors();
        if (selectedVendorId === id) setSelectedVendorId("");
      } else {
        toast.error(data.error?.message || "Failed to delete vendor");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleUpload = async (htmlFiles: File[], allFiles: File[] = []) => {
    if (!htmlFiles.length) {
      toast.error("No HTML files found. Please ensure you include the .html file, not just the assets folder.");
      return;
    }
    
    if (!selectedVendorId) {
      toast.error("Please select a vendor before uploading.");
      return;
    }
    const vendor = vendors.find(v => v.id === selectedVendorId);
    if (!vendor) return;
    
    let filesToProcess = htmlFiles;
    
    if (!filesToProcess.length) {
        toast.error(`No HTML files found to process.`);
        return;
    }

    setProgress({ status: 'parsing', current: 0, total: 0 });
    
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

      setProgress({ status: 'parsing', current: 0, total: totalToParse });

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
              setProgress({ status: 'parsing', current: currentCount, total: totalToParse });
              await new Promise(r => setTimeout(r, 15)); 
          }
        }
      }

      setProgress({ status: 'parsing', current: totalToParse, total: totalToParse });
      await new Promise(r => setTimeout(r, 100)); 

      setProgress({ status: 'syncing', current: 0, total: extractedProducts.length });

      let stagedCount = 0;
      let updatedCount = 0;
      let totalParsed = extractedProducts.length;
      let syncFailed = false;
      let errorMessage = "";

      const CHUNK_SIZE = 50;
      for (let i = 0; i < extractedProducts.length; i += CHUNK_SIZE) {
         const chunk = extractedProducts.slice(i, i + CHUNK_SIZE);
         const res = await fetch("/api/admin/vendor/sync-json", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ 
              products: chunk, 
              overrideCategory: overrideCategory || undefined,
              vendorId: vendor.id,
              vendorPrefix: vendor.prefix
           })
         });
         
         const data = await res.json();
         if (data.success) {
           stagedCount += data.data?.stagedCount || 0;
           updatedCount += data.data?.updatedCount || 0;
         } else {
           syncFailed = true;
           errorMessage = data.error?.message || data.message || "Failed to sync a chunk of data.";
           break;
         }
         
         setProgress({ status: 'syncing', current: Math.min(i + CHUNK_SIZE, extractedProducts.length), total: extractedProducts.length });
      }
      
      if (!syncFailed) {
        toast.success(`Success! Parsed ${totalParsed} products. Staged ${stagedCount} new items, updated ${updatedCount} prices.`);
        fetchData(); // Refresh staging area data
        setActiveTab("staging");
      } else {
        toast.error(errorMessage);
      }
    } catch (err) {
      toast.error("An error occurred during upload.");
      console.error(err);
    } finally {
      setProgress({ status: 'idle', current: 0, total: 0 });
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
      toast.error("Failed to load data");
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
        toast.success("Product approved and added to live catalog!");
        setStagedProducts(stagedProducts.filter(p => p.id !== product.id));
      } else if (data.isDuplicateWarning) {
        if (window.confirm("⚠️ " + data.error + "\n\nAre you sure you want to import it anyway as a duplicate?")) {
            handleApprove(product, true);
        }
      } else {
        toast.error(data.error || "Failed to approve product");
      }
    } catch (err) {
      toast.error("Failed to approve product");
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
        toast.success("Product rejected");
        setStagedProducts(stagedProducts.filter(p => p.id !== id));
      } else {
        toast.error(data.error || "Failed to reject product");
      }
    } catch (err) {
      toast.error("Failed to reject product");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to discard ALL items in the staging area? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/vendor/staged-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_all" })
      });
      if (res.ok) {
        toast.success("Staging area cleared successfully!");
        setStagedProducts([]);
        setSelectedIds(new Set());
      } else {
        toast.error("Failed to clear staging area");
      }
    } catch (err) {
      toast.error("An error occurred");
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
    if (!window.confirm(`Are you sure you want to reject ${selectedIds.size} selected products?`)) return;
    try {
      const res = await fetch("/api/admin/vendor/staged-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: "bulk_reject" })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Rejected ${selectedIds.size} products`);
        setStagedProducts(stagedProducts.filter(p => !selectedIds.has(p.id!)));
        setSelectedIds(new Set());
      } else {
        toast.error(data.error || "Failed to reject products");
      }
    } catch (err) {
      toast.error("Failed to reject products");
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-sm">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Vendor Discovery Engine</h1>
              <p className="text-sm text-muted-foreground">Scrape categories, filter tuning, and AI normalization.</p>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 flex gap-8">
          <button
            onClick={() => setActiveTab("discovery")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "discovery" ? "border-indigo-500 text-indigo-500" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Category Selection & Filters
          </button>
          <button
            onClick={() => setActiveTab("staging")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "staging" ? "border-indigo-500 text-indigo-500" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Staging Area ({stagedProducts.length})
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">Loading...</div>
        ) : activeTab === "discovery" ? (
          <div className="border rounded-xl p-6 bg-card">
               <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Upload Vendor Data (HTML)</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <div className="bg-muted/30 p-4 rounded-lg border">
                   <div className="flex justify-between items-center mb-2">
                     <label className="text-sm font-medium">Select Vendor <span className="text-destructive">*</span></label>
                     <button 
                       onClick={() => setIsVendorModalOpen(true)}
                       className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1"
                     >
                       <Settings className="w-3 h-3" /> Manage Vendors
                     </button>
                   </div>
                   <select 
                     value={selectedVendorId}
                     onChange={(e) => setSelectedVendorId(e.target.value)}
                     className="w-full bg-background border rounded-lg px-3 py-2 text-sm"
                   >
                     <option value="">-- Select Vendor --</option>
                     {vendors.map(v => (
                       <option key={v.id} value={v.id}>{v.name}</option>
                     ))}
                   </select>
                   <p className="text-xs text-muted-foreground mt-2">
                     Required. Products will be linked to this vendor and SKUs will be prefixed automatically.
                   </p>
                 </div>
                 <div className="bg-muted/30 p-4 rounded-lg border">
                   <label className="text-sm font-medium block mb-2">Target Category Extraction (Optional)</label>
                 <select 
                   value={overrideCategory}
                   onChange={(e) => setOverrideCategory(e.target.value as VendorCategory | "")}
                   className="w-full md:w-1/3 bg-background border rounded-lg px-3 py-2 text-sm"
                 >
                   <option value="">-- Let AI Decide Automatically --</option>
                   <option value="camera">Camera Unit</option>
                   <option value="recorder">Recorder (DVR/NVR)</option>
                   <option value="storage">Storage (Hard Drive/SSD)</option>
                   <option value="connector">Connectors (RJ45/BNC/DC)</option>
                   <option value="cable">Cable (CAT6/HDMI)</option>
                   <option value="power_device">Power Device (SMPS/Adapter)</option>
                   <option value="installation">Installation & Services</option>
                   <option value="amc">AMC (Maintenance)</option>
                   <option value="display">Display Screen (LCD/TV)</option>
                   <option value="mount">Camera Mount Box</option>
                   <option value="rack">Racks (Recorder/Switch)</option>
                   <option value="network">Network (Switch/Router)</option>
                   <option value="accessory">Other Accessories</option>
                   <option value="unidentified">Unidentified Product</option>
                 </select>
                 <p className="text-xs text-muted-foreground mt-2">
                   Select a target category. The AI will strictly filter the upload, only extracting products it is &gt;70% confident belong to this category. All ambiguous items or mismatched products will be dumped into "Unidentified".
                 </p>
                </div>
              </div>
               <div 
                 className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                   progress.status !== 'idle' ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-border hover:border-indigo-500/50 hover:bg-muted/30"
                 }`}
                 onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                 onDrop={async (e) => {
                   e.preventDefault(); e.stopPropagation();
                   if (progress.status !== 'idle') return;
                   const allFiles = Array.from(e.dataTransfer.files);
                   const htmlFiles = allFiles.filter(f => f.name.endsWith('.html'));
                   if (htmlFiles.length === 0) {
                     toast.error("No .html files found in your dropped items.");
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
                         toast.error("Please select at least one .html file.");
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
                         toast.error("No .html files found. Please ensure you upload the parent folder containing the .html file, not just the '_files' folder.");
                         if (folderInputRef.current) folderInputRef.current.value = '';
                       } else {
                         await handleUpload(htmlFiles, allFiles);
                       }
                     }
                   }}
                 />
                 
                 {progress.status !== 'idle' ? (
                   <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
                     <div className="flex items-center gap-3">
                       <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                       <div className="text-left">
                         <p className="text-sm font-semibold text-indigo-500">
                           {progress.status === 'parsing' ? "Scraping items from files..." : "Syncing with cloud database..."}
                         </p>
                         <p className="text-xs text-muted-foreground mt-0.5">
                           {progress.status === 'parsing' ? `${progress.current} of ${progress.total} products extracted` : `${progress.current} of ${progress.total} synced to cloud (${Math.round((progress.current / progress.total) * 100)}%)`}
                         </p>
                       </div>
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
                       <p className="text-base font-medium">Drag & drop files or folders here</p>
                       <p className="text-sm text-muted-foreground mt-1 mb-4">You can upload single .html files or an entire folder</p>
                       <div className="flex justify-center gap-4">
                          <button type="button" onClick={() => htmlInputRef.current?.click()} className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors">
                             Select Files
                          </button>
                          <button type="button" onClick={() => folderInputRef.current?.click()} className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors">
                             Select Folder
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
                 <div className="flex justify-between items-center bg-muted/30 p-4 rounded-xl border border-dashed">
                     <div className="flex items-center gap-4 flex-wrap">
                         <button onClick={handleSelectAll} className="flex items-center gap-2 text-sm font-medium hover:text-indigo-500 transition-colors">
                            {selectedIds.size === filteredStagedProducts.length && filteredStagedProducts.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                            Select All
                         </button>
                         
                         {/* Filter Dropdown */}
                         <div className="flex items-center ml-4 border-l pl-4 border-border/50 gap-4">
                             <input
                               type="text"
                               placeholder="Search title or SKU..."
                               value={stagingSearchQuery}
                               onChange={(e) => setStagingSearchQuery(e.target.value)}
                               className="bg-background border rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-indigo-500"
                             />
                             <select
                               value={stagingCategoryFilter}
                               onChange={(e) => setStagingCategoryFilter(e.target.value as VendorCategory | "all")}
                               className="bg-background border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                             >
                                <option value="all">All Categories ({stagedProducts.length})</option>
                                <option value="unidentified">Unidentified ({stagedProducts.filter(p => p.category === 'unidentified').length})</option>
                                <option value="camera">Camera ({stagedProducts.filter(p => p.category === 'camera').length})</option>
                                <option value="recorder">Recorder ({stagedProducts.filter(p => p.category === 'recorder').length})</option>
                                <option value="cable">Cable ({stagedProducts.filter(p => p.category === 'cable').length})</option>
                                <option value="network">Network ({stagedProducts.filter(p => p.category === 'network').length})</option>
                                <option value="storage">Storage ({stagedProducts.filter(p => p.category === 'storage').length})</option>
                                <option value="connector">Connector ({stagedProducts.filter(p => p.category === 'connector').length})</option>
                                <option value="power_device">Power Device ({stagedProducts.filter(p => p.category === 'power_device').length})</option>
                                <option value="display">Display ({stagedProducts.filter(p => p.category === 'display').length})</option>
                                <option value="mount">Mount ({stagedProducts.filter(p => p.category === 'mount').length})</option>
                                <option value="rack">Rack ({stagedProducts.filter(p => p.category === 'rack').length})</option>
                                <option value="accessory">Accessories ({stagedProducts.filter(p => p.category === 'accessory').length})</option>
                                <option value="installation">Installation ({stagedProducts.filter(p => p.category === 'installation').length})</option>
                                <option value="amc">AMC ({stagedProducts.filter(p => p.category === 'amc').length})</option>
                             </select>
                         </div>
                         {selectedIds.size > 0 && (
                             <button onClick={handleBulkReject} className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors">
                                 <Trash2 className="w-4 h-4" /> Reject Selected ({selectedIds.size})
                             </button>
                         )}
                         {selectedIds.size > 0 && (
                              <button onClick={() => {
                                  setStagedProducts(stagedProducts.map(p => {
                                      if (selectedIds.has(p.id!)) {
                                          return {
                                              ...p,
                                              category: (guessCategory(p.raw_title) as VendorCategory) || p.category,
                                              brand: guessBrand(p.raw_title) || p.brand,
                                              technologies: guessTechnologies(p.raw_title),
                                              resolution_mp: guessResolution(p.raw_title) || p.resolution_mp,
                                              channels: guessChannels(p.raw_title) || p.channels,
                                              rack_u_height: guessRackUHeight(p.raw_title) || p.rack_u_height,
                                              cable_length_m: guessCableLength(p.raw_title) || p.cable_length_m,
                                              power_voltage_v: guessVoltage(p.raw_title) || p.power_voltage_v,
                                              power_amperage_a: guessAmperage(p.raw_title) || p.power_amperage_a,
                                              power_wattage_w: guessWattage(p.raw_title) || p.power_wattage_w
                                          };
                                      }
                                      return p;
                                  }));
                                  toast.success("Rescanned selected items using AI!");
                              }} className="flex items-center gap-2 px-4 py-2 border border-indigo-500/30 text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-500/10 transition-colors">
                                  <RefreshCw className="w-4 h-4" /> Rescan Selected AI
                              </button>
                          )}
                     </div>
                     <button onClick={handleClearAll} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/50 text-destructive hover:bg-destructive/10 text-sm font-medium transition-colors">
                         <XCircle className="w-4 h-4" /> Discard All Items
                     </button>
                 </div>
             )}
             
             <div className="grid grid-cols-1 gap-6">
             {stagedProducts.length === 0 ? (
                 <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                    Staging area is empty. Scrape products to see them here.
                 </div>
               ) : paginatedProducts.length === 0 ? (
                 <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                    No products found matching your filters.
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
                                   OUT OF STOCK
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
                              <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">AI Normalized Suggestion</div>
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
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-muted-foreground whitespace-nowrap">Vendor SKU:</p>
                                <input
                                   type="text"
                                   value={product.vendor_product_id || ""}
                                   placeholder="Leave blank to auto-generate"
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
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-indigo-400">Gemini AI Reasoning</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${product.ai_confidence_score >= 90 ? 'bg-emerald-500/20 text-emerald-500' : product.ai_confidence_score >= 60 ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'}`}>
                                      {product.ai_confidence_score}% Confidence
                                    </span>
                                  </div>
                                  <p className="text-xs text-indigo-300 leading-relaxed">{product.ai_reasoning}</p>
                                </div>
                              )}
                           </div>

                           <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-muted/30 rounded-lg border">
                              <div>
                                 <label className="text-xs text-muted-foreground block mb-1">Category</label>
                                 <select 
                                   value={product.category}
                                   onChange={(e) => setStagedProducts(stagedProducts.map(p => p.id === product.id ? {...p, category: e.target.value as any} : p))}
                                   className="w-full bg-background border rounded px-2 py-1 text-sm"
                                 >
                                    <option value="camera">Camera Unit</option>
                                    <option value="recorder">Recorder (DVR/NVR)</option>
                                    <option value="storage">Storage (Hard Drive/SSD)</option>
                                    <option value="connector">Connectors (RJ45/BNC/DC)</option>
                                    <option value="cable">Cable (CAT6/HDMI)</option>
                                    <option value="power_device">Power Device (SMPS/Adapter)</option>
                                    <option value="installation">Installation & Services</option>
                                    <option value="amc">AMC (Maintenance)</option>
                                    <option value="display">Display Screen (LCD/TV)</option>
                                    <option value="mount">Camera Mount Box</option>
                                    <option value="rack">Racks (Recorder/Switch)</option>
                                    <option value="network">Network (Switch/Router)</option>
                                    <option value="accessory">Other Accessories</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="text-xs text-muted-foreground block mb-1">Brand</label>
                                 <input 
                                    type="text" 
                                    value={product.brand || ''}
                                    placeholder="Unknown"
                                    onChange={e => setStagedProducts(stagedProducts.map(p => p.id === product.id ? {...p, brand: e.target.value} : p))}
                                    className="w-full bg-background border rounded px-2 py-1 text-sm"
                                 />
                              </div>
                              <div>
                                 <label className="text-xs text-muted-foreground block mb-1">Base Cost</label>
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
                                 <label className="text-xs text-muted-foreground block mb-1">Status</label>
                                 <button 
                                   onClick={() => setStagedProducts(stagedProducts.map(p => p.id === product.id ? {...p, in_stock: p.in_stock === false ? true : false} : p))}
                                   className={`w-full text-left px-2 py-1 rounded border text-sm font-medium transition-colors ${product.in_stock !== false ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-destructive/10 text-destructive border-destructive/30'}`}
                                 >
                                   {product.in_stock !== false ? '✅ In Stock' : '❌ Out of Stock'}
                                 </button>
                              </div>
                              <div className="col-span-2">
                                 <label className="text-xs text-muted-foreground block flex justify-between mb-1">
                                    <span>Specifications (Comma separated)</span>
                                    {product.resolution_mp && <span className="text-amber-500 font-medium">Res: {product.resolution_mp}MP</span>}
                                    {product.channels && <span className="text-blue-500 font-medium">Ch: {product.channels}</span>}
                                 </label>
                                 <input 
                                    type="text" 
                                    value={product._raw_specs !== undefined ? product._raw_specs : product.technologies?.join(', ') || ''}
                                    placeholder="e.g. IP, Audio, ColorVu"
                                    onChange={e => setStagedProducts(stagedProducts.map(p => p.id === product.id ? {...p, _raw_specs: e.target.value, technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)} : p))}
                                    onBlur={e => setStagedProducts(stagedProducts.map(p => p.id === product.id ? {...p, _raw_specs: undefined, technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)} : p))}
                                    className="w-full bg-background border rounded px-2 py-1 text-sm text-indigo-500 font-medium"
                                 />
                              </div>
                           </div>
                           
                           <div className="flex justify-end gap-3 pt-2">
                              <button onClick={async () => {
                                  try {
                                      const toastId = toast.loading("Rescanning using AI...");
                                      const res = await fetch("/api/admin/vendor/rescan", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ raw_title: product.raw_title, image_url: product.image_url })
                                      });
                                      const data = await res.json();
                                      
                                      if (res.ok && data.success) {
                                          setStagedProducts(stagedProducts.map(p => {
                                              if (p.id === product.id) {
                                                  return {
                                                      ...p,
                                                      category: data.data.category || p.category,
                                                      brand: data.data.brand || p.brand,
                                                      technologies: data.data.technologies,
                                                      resolution_mp: data.data.resolution_mp || p.resolution_mp,
                                                      channels: data.data.channels || p.channels,
                                                      rack_u_height: data.data.rack_u_height || p.rack_u_height,
                                                      cable_length_m: data.data.cable_length_m || p.cable_length_m,
                                                      power_voltage_v: data.data.power_voltage_v || p.power_voltage_v,
                                                      power_amperage_a: data.data.power_amperage_a || p.power_amperage_a,
                                                      power_wattage_w: data.data.power_wattage_w || p.power_wattage_w,
                                                      storage_type: data.data.storage_type || p.storage_type,
                                                      storage_capacity_tb: data.data.storage_capacity_tb || p.storage_capacity_tb,
                                                      network_ports: data.data.network_ports || p.network_ports,
                                                      network_speed: data.data.network_speed || p.network_speed,
                                                      _ai_confidence: data.data.confidence_score,
                                                      _ai_reasoning: data.data.ai_reasoning
                                                  };
                                              }
                                              return p;
                                          }));
                                          toast.success("Rescanned using AI!", { id: toastId });
                                      } else {
                                          toast.error(data.error || "Rescan failed", { id: toastId });
                                      }
                                  } catch (err) {
                                      toast.error("Failed to rescan");
                                  }
                              }} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-sm font-medium transition-colors">
                                  <RefreshCw className="w-4 h-4" /> Rescan AI
                              </button>
                              <button onClick={() => handleReject(product.id!)} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-destructive/10 hover:text-destructive text-sm font-medium transition-colors">
                                  <XCircle className="w-4 h-4" /> Reject
                              </button>
                              <button onClick={() => handleApprove(product)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-sm font-medium transition-colors">
                                  <CheckCircle2 className="w-4 h-4" /> Approve & Import
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
               <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-dashed mt-4">
                 <div className="text-sm text-muted-foreground">
                   Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStagedProducts.length)} of {filteredStagedProducts.length} entries
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
                     Page {currentPage} of {totalPages}
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
              <h3 className="font-semibold text-lg">Manage Vendors</h3>
              <button onClick={() => setIsVendorModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Add New Vendor Form */}
              <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
                <h4 className="text-sm font-medium">Add New Vendor</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Vendor Name"
                      value={newVendorName}
                      onChange={e => setNewVendorName(e.target.value)}
                      className="w-full bg-background border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <input 
                      type="text" 
                      placeholder="Prefix"
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
                  <Plus className="w-4 h-4" /> Add Vendor
                </button>
              </div>

              {/* Vendor List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Existing Vendors</h4>
                {vendors.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No vendors found.</p>
                ) : (
                  vendors.map(v => (
                    <div key={v.id} className="flex justify-between items-center p-3 bg-card border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{v.name}</p>
                        <p className="text-xs text-muted-foreground">Prefix: <span className="font-mono bg-muted px-1 rounded">{v.prefix}</span></p>
                      </div>
                      <button 
                        onClick={() => handleDeleteVendor(v.id!)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Delete Vendor"
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
