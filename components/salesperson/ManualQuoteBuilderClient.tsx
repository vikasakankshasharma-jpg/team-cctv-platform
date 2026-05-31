"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowRight, Check, User, Phone, MapPin, Search, Copy, MessageSquare, Percent } from "lucide-react";

export default function ManualQuoteBuilderClient() {
  const [step, setStep] = useState<"lead" | "quote" | "done">("lead");
  
  // Lead state
  const [leadForm, setLeadForm] = useState({ name: "", mobile: "", city: "Jaipur", property_type: "home" });
  const [leadId, setLeadId] = useState<string | null>(null);

  // Quote State
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [installationCost, setInstallationCost] = useState(0);
  const [salespersonMaxDiscount, setSalespersonMaxDiscount] = useState(0);
  const [note, setNote] = useState("");
  
  // Result
  const [quoteUrl, setQuoteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Products and Salesperson profile
    Promise.all([
      fetch("/api/products").then(res => res.json()),
      fetch("/api/admin/salespersons/me").then(res => res.ok ? res.json() : null).catch(() => null)
    ]).then(([prodRes, spRes]) => {
      if (Array.isArray(prodRes)) setProducts(prodRes);
      if (spRes?.max_discount_approval_percent) setSalespersonMaxDiscount(spRes.max_discount_approval_percent);
    });
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: leadForm.name,
          mobile_number: leadForm.mobile,
          property_type: leadForm.property_type,
          technology_choice: "HD", // default dummy
          cabling_done: false,
          detected_city: leadForm.city,
          source: "walk_in",
          wizard_answers: { city: leadForm.city, property_type: leadForm.property_type },
        }),
      });
      if (!res.ok) throw new Error("Failed to create lead");
      const { id } = await res.json();
      setLeadId(id);
      setStep("quote");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (prod: any) => {
    setItems(prev => {
      const exists = prev.find(i => i.product_id === prod.id);
      if (exists) {
        return prev.map(i => i.product_id === prod.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        product_id: prod.id, 
        name: prod.display_name, 
        quantity: 1, 
        unit_price: prod.unit_price,
        category: prod.category 
      }];
    });
    setSearch("");
  };

  const updateItemQty = (index: number, delta: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateQuote = async () => {
    if (items.length === 0) return setError("Add at least one item.");
    if (discountPercent > salespersonMaxDiscount) return setError(`Max allowed discount is ${salespersonMaxDiscount}%`);

    setLoading(true);
    setError(null);
    
    const subtotal = items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    const totalPayable = subtotal - discountAmount + installationCost;

    const formattedItems = items.map(i => ({ ...i, total_price: i.quantity * i.unit_price }));

    try {
      const res = await fetch("/api/quotes/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          items: formattedItems,
          discount_percent: discountPercent,
          discount_amount: discountAmount,
          subtotal,
          total_payable: totalPayable,
          installation_cost: installationCost,
          note
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create quote");
      }
      const { id } = await res.json();
      setQuoteUrl(`${window.location.origin}/quote/${leadId}/pdf?quote_id=${id}`);
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!quoteUrl) return;
    await navigator.clipboard.writeText(quoteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!quoteUrl) return;
    const msg = encodeURIComponent(`Namaste ${leadForm.name} ji!\nHere is your custom CCTV Quotation:\n${quoteUrl}\n- TEAM CCTV`);
    window.open(`https://wa.me/91${leadForm.mobile}?text=${msg}`, "_blank");
  };

  const subtotal = items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const total = subtotal - discountAmount + installationCost;

  return (
    <div className="max-w-4xl animate-in fade-in duration-500">
      
      {/* STEP 1: LEAD INFO */}
      {step === "lead" && (
        <form onSubmit={handleCreateLead} className="bg-card border border-border rounded-3xl p-8 space-y-6 shadow-sm max-w-2xl">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Customer Details</h2>
            <p className="text-sm text-muted-foreground">Start by registering the walk-in customer.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5"><User className="w-3 h-3"/> Name</label>
              <input required value={leadForm.name} onChange={e => setLeadForm(f => ({...f, name: e.target.value}))} className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground" placeholder="Ramesh Sharma" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5"><Phone className="w-3 h-3"/> Mobile</label>
              <input required type="tel" pattern="[0-9]{10}" value={leadForm.mobile} onChange={e => setLeadForm(f => ({...f, mobile: e.target.value}))} className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground" placeholder="10-digit number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5"><MapPin className="w-3 h-3"/> City</label>
                  <input required value={leadForm.city} onChange={e => setLeadForm(f => ({...f, city: e.target.value}))} className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground" placeholder="Jaipur" />
               </div>
               <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5">Property</label>
                  <select value={leadForm.property_type} onChange={e => setLeadForm(f => ({...f, property_type: e.target.value}))} className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground">
                    <option value="home">Home / Flat</option>
                    <option value="shop">Shop / Office</option>
                    <option value="factory">Factory</option>
                  </select>
               </div>
            </div>
          </div>

          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl font-medium">{error}</div>}

          <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 flex justify-center items-center gap-2">
            {loading ? "Registering..." : "Continue to Quote Builder"} <ArrowRight className="w-4 h-4"/>
          </button>
        </form>
      )}

      {/* STEP 2: MANUAL BUILDER */}
      {step === "quote" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4">Build Quote</h2>
              
              <div className="relative mb-6">
                <Search className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
                <input 
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search and add products..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {search && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-2xl shadow-xl z-10 max-h-64 overflow-y-auto">
                    {products.filter(p => p.display_name.toLowerCase().includes(search.toLowerCase())).map(p => (
                      <button key={p.id} onClick={() => handleAddItem(p)} className="w-full text-left px-4 py-3 hover:bg-muted flex justify-between items-center border-b border-border/50 last:border-0">
                        <span className="font-medium text-sm text-foreground">{p.display_name}</span>
                        <span className="text-primary font-bold">₹{p.unit_price}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No items added yet. Search above.</div>
                ) : (
                  items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-foreground">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">₹{item.unit_price} / unit</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-background rounded-lg border border-border">
                          <button onClick={() => updateItemQty(idx, -1)} className="px-2.5 py-1 text-muted-foreground hover:text-foreground">-</button>
                          <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateItemQty(idx, 1)} className="px-2.5 py-1 text-muted-foreground hover:text-foreground">+</button>
                        </div>
                        <span className="font-bold text-sm w-16 text-right">₹{item.unit_price * item.quantity}</span>
                        <button onClick={() => removeItem(idx)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* CHECKOUT PANE */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-foreground mb-4 border-b border-border pb-2">Cost Breakdown</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">Install / Labor</span>
                  <input type="number" value={installationCost} onChange={e => setInstallationCost(Number(e.target.value) || 0)} className="w-20 px-2 py-1 bg-background border border-input rounded text-right" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-success font-medium flex items-center gap-1">Discount %</span>
                    <span className="text-[10px] text-muted-foreground">Max limit: {salespersonMaxDiscount}%</span>
                  </div>
                  <input type="number" min="0" max={salespersonMaxDiscount} value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value) || 0)} className="w-16 px-2 py-1 bg-background border border-success/30 rounded text-right text-success font-bold" />
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-end text-xs font-semibold text-success">- ₹{discountAmount.toLocaleString()}</div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border mb-6">
                <span className="font-bold text-lg text-foreground">Total</span>
                <span className="font-black text-2xl text-primary">₹{total.toLocaleString()}</span>
              </div>

              {error && <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-xl font-medium mb-4">{error}</div>}

              <button onClick={handleCreateQuote} disabled={loading || items.length === 0 || discountPercent > salespersonMaxDiscount} className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50">
                {loading ? "Generating PDF..." : "Generate PDF Quote"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: DONE */}
      {step === "done" && (
        <div className="bg-card border border-border rounded-3xl p-8 space-y-6 shadow-sm max-w-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-black text-foreground">PDF Quote Ready!</h2>
          <p className="text-muted-foreground">Share this direct PDF link with <b>{leadForm.name}</b></p>
          
          <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/50 border border-border">
             <p className="text-sm font-mono text-muted-foreground flex-1 truncate text-left">{quoteUrl}</p>
             <button onClick={handleCopy} className={`p-2 rounded-lg transition-all ${copied ? "bg-success text-success-foreground" : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"}`}>
               {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
             </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
             <button onClick={handleWhatsApp} className="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white font-bold rounded-xl shadow-lg shadow-[#25D366]/20">
               <MessageSquare className="w-4 h-4" /> Send WhatsApp
             </button>
             <button onClick={() => { setStep("lead"); setItems([]); setQuoteUrl(null); }} className="py-3 bg-secondary text-secondary-foreground font-bold rounded-xl border border-border hover:bg-secondary/80">
               Create Another
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
