"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, FileText, CheckCircle2, ChevronLeft, Save, FileDown, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase-client";
import { useRouter } from "next/navigation";

interface CatalogItem {
  id: string;
  name: string;
  baseCost: number;
  unitPrice: number;
  category: string;
}

interface BuilderLineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  baseCost: number;
  isCustom: boolean;
}

interface QuotationBuilderProps {
  leadId: string;
  leadName: string;
  catalog: CatalogItem[];
  userRole: string;
}

export function QuotationBuilderClient({ leadId, leadName, catalog, userRole }: QuotationBuilderProps) {
  const router = useRouter();
  const [items, setItems] = useState<BuilderLineItem[]>([]);
  const [gstPercent, setGstPercent] = useState(18);
  const [advancePercent, setAdvancePercent] = useState(30);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);

  // Role-based margin limits
  const MIN_MARGIN = useMemo(() => {
    if (userRole === "super_admin") return 0;
    if (userRole === "manager") return 10;
    return 15; // default for sales_staff
  }, [userRole]);

  const handleAddItem = (isCustom: boolean = true, catalogItem?: CatalogItem) => {
    setItems([
      ...items,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: catalogItem?.name || "Custom Item",
        description: isCustom ? "Custom Details" : catalogItem?.category || "",
        quantity: 1,
        unitPrice: catalogItem?.unitPrice || 0,
        baseCost: catalogItem?.baseCost || 0,
        isCustom,
      }
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof BuilderLineItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Margin enforcement (only if baseCost exists, meaning it's a catalog item)
        if (field === "unitPrice" && updated.baseCost > 0) {
          const margin = ((updated.unitPrice - updated.baseCost) / updated.unitPrice) * 100;
          if (margin < MIN_MARGIN && updated.unitPrice > 0) {
            toast.error(`Minimum margin required is ${MIN_MARGIN}%. Your role is ${userRole.replace('_', ' ')}.`);
            updated.unitPrice = Math.ceil(updated.baseCost / (1 - (MIN_MARGIN / 100)));
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalGst = (subtotal * gstPercent) / 100;
  const grandTotal = subtotal + totalGst;

  const overallMargin = useMemo(() => {
    const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.baseCost), 0);
    if (subtotal === 0 || totalCost === 0) return 100;
    return (((subtotal - totalCost) / subtotal) * 100).toFixed(1);
  }, [items, subtotal]);

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }
    
    setIsSaving(true);
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : "";
      
      const payload = {
        leadId,
        lineItems: items,
        gstPercent,
        advancePercent,
        notes,
        total_payable: grandTotal,
      };

      const res = await fetch("/api/admin/quotes/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save custom quote");
      
      setSavedQuoteId(data.data.id);
      toast.success("Custom Quote Saved!");
    } catch (err: any) {
      toast.error(err.message);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!savedQuoteId) return;
    try {
      toast.info("Generating PDF...");
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : "";
      const pdfRes = await fetch(`/api/v1/leads/${leadId}/quotes/${savedQuoteId}/pdf`, {
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      
      if (pdfRes.ok) {
        const contentType = pdfRes.headers.get("Content-Type");
        if (contentType === "application/pdf") {
          const blob = await pdfRes.blob();
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, "_blank");
        } else {
          const { url } = await pdfRes.json();
          if (url) window.open(url, "_blank");
        }
      } else {
         toast.error("Failed to generate PDF.");
      }
    } catch (error) {
      toast.error("Error generating PDF.");
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> Back to Lead
        </button>
        <div className="flex items-center gap-2">
          {savedQuoteId && (
            <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-md text-sm font-semibold hover:bg-secondary/80 transition-colors">
              <FileDown className="w-4 h-4" /> Download PDF
            </button>
          )}
          <button 
            onClick={handleSave} 
            disabled={isSaving || savedQuoteId !== null}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <span className="animate-pulse">Saving...</span> : savedQuoteId ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Quote</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT PANEL: Line Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/30 flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Line Items</h3>
              <span className="text-xs text-muted-foreground font-mono px-2 py-1 bg-background rounded border border-border">
                Role: {userRole.toUpperCase()} (Min Margin: {MIN_MARGIN}%)
              </span>
            </div>
            
            <div className="p-4 space-y-4">
              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-start p-3 bg-secondary/20 rounded-lg border border-border/50 relative group">
                  <div className="col-span-12 sm:col-span-5">
                    <input 
                      type="text" 
                      value={item.name} 
                      onChange={e => handleUpdateItem(item.id, "name", e.target.value)}
                      placeholder="Item Name"
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                    <input 
                      type="text" 
                      value={item.description} 
                      onChange={e => handleUpdateItem(item.id, "description", e.target.value)}
                      placeholder="Description"
                      className="w-full bg-transparent border-none px-1 py-1 text-xs text-muted-foreground focus:outline-none mt-1"
                    />
                  </div>
                  
                  <div className="col-span-4 sm:col-span-2">
                    <label className="text-[10px] uppercase text-muted-foreground font-semibold px-1">Qty</label>
                    <input 
                      type="number" 
                      min="1"
                      value={item.quantity} 
                      onChange={e => handleUpdateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-center focus:outline-none focus:border-primary"
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-4">
                    <label className="text-[10px] uppercase text-muted-foreground font-semibold px-1">Unit Price (₹)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={item.unitPrice} 
                        onChange={e => handleUpdateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-full bg-background border border-border rounded-md pl-6 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
                      />
                      <span className="absolute left-2.5 top-2.5 text-muted-foreground text-xs font-semibold">₹</span>
                    </div>
                    {item.baseCost > 0 && (
                      <div className="text-[10px] text-muted-foreground mt-1 px-1 flex justify-between">
                        <span>Cost: ₹{item.baseCost}</span>
                        <span className={((item.unitPrice - item.baseCost) / item.unitPrice * 100) < MIN_MARGIN ? "text-destructive font-bold" : "text-success"}>
                          Margin: {(((item.unitPrice - item.baseCost) / item.unitPrice) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1 flex justify-end mt-5">
                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-10 border border-dashed border-border rounded-xl">
                  <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No items added to the quote yet.</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => handleAddItem(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Blank Item
                </button>
                <div className="relative group">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add from Catalog
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto bg-card border border-border rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 custom-scrollbar">
                    {catalog.map(cat => (
                      <div 
                        key={cat.id} 
                        onClick={() => handleAddItem(false, cat)}
                        className="px-3 py-2 border-b border-border hover:bg-secondary cursor-pointer"
                      >
                        <div className="text-xs font-semibold text-foreground truncate">{cat.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 flex justify-between">
                          <span>{cat.category.replace('_', ' ')}</span>
                          <span>₹{cat.unitPrice}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-sm text-foreground mb-3">Quote Settings & Notes</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">GST %</label>
                <input 
                  type="number" 
                  value={gstPercent} 
                  onChange={e => setGstPercent(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Advance %</label>
                <input 
                  type="number" 
                  value={advancePercent} 
                  onChange={e => setAdvancePercent(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Terms / Notes</label>
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                placeholder="Important terms or warranties..."
                className="w-full mt-1 h-20 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Summary */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 sticky top-24 shadow-sm">
            <h3 className="font-semibold text-lg text-foreground tracking-tight mb-4 border-b border-border pb-3">Quote Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>CGST ({gstPercent/2}%)</span>
                <span>₹{(totalGst/2).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>SGST ({gstPercent/2}%)</span>
                <span>₹{(totalGst/2).toLocaleString('en-IN')}</span>
              </div>
              
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Grand Total</span>
                  <span className="text-xl font-black text-primary">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-secondary/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-foreground">Profitability Analysis</span>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-muted-foreground">Overall Margin</span>
                <span className={`font-bold ${parseFloat(overallMargin as string) < MIN_MARGIN ? 'text-destructive' : 'text-success'}`}>
                  {overallMargin}%
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
