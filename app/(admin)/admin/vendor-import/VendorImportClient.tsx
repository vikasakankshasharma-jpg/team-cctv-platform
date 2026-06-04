"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FolderTree, Inbox, Play, CheckCircle2, XCircle, RefreshCw, Trash2, CheckSquare, Square } from "lucide-react";
import type { VendorCategory, StagedProduct } from "@/types";

export default function VendorImportClient() {
  const [activeTab, setActiveTab] = useState<"discovery" | "staging">("discovery");
  
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [stagedProducts, setStagedProducts] = useState<StagedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({ status: 'idle', current: 0, total: 0 });
  const [overrideCategory, setOverrideCategory] = useState<VendorCategory | "">("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  function guessFileCategory(filename: string): VendorCategory {
    const t = filename.toLowerCase();
    if (t.includes('camera') || t.includes('ptz') || t.includes('bullet') || t.includes('dome')) return 'camera';
    if (t.includes('dvr') || t.includes('nvr') || t.includes('recorder')) return 'recorder';
    if (t.includes('hard disk') || t.includes('hdd') || t.includes('micro sd') || t.includes('ssd') || t.includes('purple')) return 'storage';
    if (t.includes('power supply') || t.includes('smps') || t.includes('adapter')) return 'power_device';
    if (t.includes('cable') || t.includes('wire') || t.includes('cat6') || t.includes('hdmi') || t.includes('vga')) return 'cable';
    if (t.includes('connector') || t.includes('rj45') || t.includes('bnc') || t.includes('dc pin')) return 'connector';
    if (t.includes('mount') || t.includes('junction box') || t.includes('bracket')) return 'mount';
    if (t.includes('rack') || t.includes('cabinet') || t.includes('server rack')) return 'rack';
    if (t.includes('switch') || t.includes('router') || t.includes('poe switch')) return 'network';
    if (t.includes('installation') || t.includes('service') || t.includes('labour')) return 'installation';
    if (t.includes('amc') || t.includes('maintenance')) return 'amc';
    if (t.includes('display') || t.includes('monitor') || t.includes('tv') || t.includes('lcd')) return 'display';
    return 'accessory';
  }

  const handleUpload = async (htmlFiles: File[], allFiles: File[] = []) => {
    if (!htmlFiles.length) return;
    
    let filesToProcess = htmlFiles;
    if (overrideCategory) {
        filesToProcess = htmlFiles.filter(f => guessFileCategory(f.name) === overrideCategory);
    }
    
    if (!filesToProcess.length) {
        toast.error(`No files found matching the category: ${overrideCategory}`);
        return;
    }

    setProgress({ status: 'parsing', current: 0, total: 0 });
    
    try {
      const extractedProducts: any[] = [];
      let totalToParse = 0;
      const htmlDocs: { doc: Document, fileCategory: VendorCategory }[] = [];

      for (const file of filesToProcess) {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        htmlDocs.push({ doc, fileCategory: guessFileCategory(file.name) });
        totalToParse += doc.querySelectorAll('.product-thumb').length;
      }

      setProgress({ status: 'parsing', current: 0, total: totalToParse });

      let currentCount = 0;
      for (const { doc, fileCategory } of htmlDocs) {
        const thumbs = Array.from(doc.querySelectorAll('.product-thumb'));
        
        for (let i = 0; i < thumbs.length; i++) {
          const el = thumbs[i];
          const title = el.querySelector('.name a')?.textContent?.trim();
          if (!title) continue;

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

          extractedProducts.push({ title, baseCost, imgUrl, category: fileCategory });
          currentCount++;

          if (currentCount % 25 === 0) {
              setProgress({ status: 'parsing', current: currentCount, total: totalToParse });
              await new Promise(r => setTimeout(r, 15)); 
          }
        }
      }

      setProgress({ status: 'parsing', current: totalToParse, total: totalToParse });
      await new Promise(r => setTimeout(r, 100)); 

      setProgress({ status: 'syncing', current: totalToParse, total: totalToParse });

      const res = await fetch("/api/admin/vendor/sync-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: extractedProducts, overrideCategory: overrideCategory || undefined })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Success! Parsed ${data.totalParsed} products. Staged ${data.stagedCount} new items, updated ${data.updatedCount} prices.`);
        fetchData(); // Refresh staging area data
        setActiveTab("staging");
      } else {
        toast.error(data.error?.message || data.message || "Failed to sync data.");
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

  const handleApprove = async (product: StagedProduct) => {
    try {
      const res = await fetch("/api/admin/vendor/staged-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, action: "approve", updatedProduct: product })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Product approved and added to live catalog!");
        setStagedProducts(stagedProducts.filter(p => p.id !== product.id));
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
    if (selectedIds.size === stagedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(stagedProducts.map(p => p.id!)));
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
               
               <div className="mb-6 bg-muted/30 p-4 rounded-lg border">
                 <label className="text-sm font-medium block mb-2">Force Category Override (Optional)</label>
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
                 </select>
                 <p className="text-xs text-muted-foreground mt-2">
                   Select a category before uploading to bypass the AI and force all scraped items into this category.
                 </p>
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
                   if (htmlFiles.length > 0) await handleUpload(htmlFiles, allFiles);
                 }}
               >
                 <input 
                   type="file" 
                   id="html-upload" 
                   accept=".html"
                   multiple 
                   className="hidden" 
                   onChange={async (e) => {
                     if (e.target.files?.length) {
                       const allFiles = Array.from(e.target.files);
                       const htmlFiles = allFiles.filter(f => f.name.endsWith('.html'));
                       await handleUpload(htmlFiles, allFiles);
                     }
                   }}
                 />
                 <input 
                   type="file" 
                   id="folder-upload" 
                   {...{webkitdirectory: "true", directory: "true", multiple: true} as any}
                   className="hidden" 
                   onChange={async (e) => {
                     if (e.target.files?.length) {
                       const allFiles = Array.from(e.target.files);
                       const htmlFiles = allFiles.filter(f => f.name.endsWith('.html'));
                       await handleUpload(htmlFiles, allFiles);
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
                           {progress.status === 'parsing' ? `${progress.current} of ${progress.total} products processed` : "Please wait, applying updates..."}
                         </p>
                       </div>
                     </div>
                     
                     {/* Progress Bar */}
                     {progress.status === 'parsing' && progress.total > 0 && (
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
                          <button onClick={() => document.getElementById('html-upload')?.click()} className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors">
                             Select Files
                          </button>
                          <button onClick={() => document.getElementById('folder-upload')?.click()} className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors">
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
                     <div className="flex items-center gap-4">
                         <button onClick={handleSelectAll} className="flex items-center gap-2 text-sm font-medium hover:text-indigo-500 transition-colors">
                            {selectedIds.size === stagedProducts.length && stagedProducts.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                            Select All
                         </button>
                         {selectedIds.size > 0 && (
                             <button onClick={handleBulkReject} className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors">
                                 <Trash2 className="w-4 h-4" /> Reject Selected ({selectedIds.size})
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
               ) : (
                   stagedProducts.map(product => {
                       const isSelected = selectedIds.has(product.id!);
                       return (
                       <div key={product.id} className={`border rounded-xl p-6 flex flex-col md:flex-row gap-6 transition-colors ${isSelected ? "border-indigo-500 bg-indigo-500/5 shadow-sm" : "bg-card"}`}>
                          <div className="flex items-center justify-center">
                             <button onClick={() => handleToggleSelect(product.id!)} className="p-2 -m-2 hover:opacity-80 transition-opacity">
                                 {isSelected ? <CheckSquare className="w-6 h-6 text-indigo-500" /> : <Square className="w-6 h-6 text-muted-foreground" />}
                             </button>
                          </div>
                          <div className="w-32 h-32 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
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
                                 onChange={e => setStagedProducts(stagedProducts.map(p => p.id === product.id ? {...p, raw_title: e.target.value} : p))}
                                 className="font-bold text-lg w-full bg-transparent border-b border-transparent hover:border-border focus:border-indigo-500 focus:outline-none py-0.5 transition-colors"
                              />
                              <p className="text-sm text-muted-foreground mt-1">Vendor SKU: {product.vendor_product_id}</p>
                           </div>

                           <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg border">
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
                              <div className="col-span-2">
                                 <label className="text-xs text-muted-foreground block flex justify-between mb-1">
                                    <span>Specifications (Comma separated)</span>
                                    {product.resolution_mp && <span className="text-amber-500 font-medium">Res: {product.resolution_mp}MP</span>}
                                    {product.channels && <span className="text-blue-500 font-medium">Ch: {product.channels}</span>}
                                 </label>
                                 <input 
                                    type="text" 
                                    value={product.technologies?.join(', ') || ''}
                                    placeholder="e.g. IP, Audio, ColorVu"
                                    onChange={e => setStagedProducts(stagedProducts.map(p => p.id === product.id ? {...p, technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)} : p))}
                                    className="w-full bg-background border rounded px-2 py-1 text-sm text-indigo-500 font-medium"
                                 />
                              </div>
                           </div>
                           
                           <div className="flex justify-end gap-3 pt-2">
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
          </div>
        )}
      </main>
    </div>
  );
}
