"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, ArrowRight, Check, User, Phone, MapPin, Search, Copy, MessageSquare, AlertTriangle, Image as ImageIcon, ShoppingCart, Percent } from "lucide-react";
import type { Product, VendorCategory } from "@/types";

interface CartItem extends Product {
  quantity: number;
}

const CATEGORY_LABELS: Record<VendorCategory, string> = {
  cctv_camera: "Cameras",
  recorder: "Recorders",
  storage: "Storage",
  cable: "Cables",
  connector: "Connectors",
  power_device: "Power",
  display: "Displays",
  camera_mount: "Mounts",
  rack: "Racks",
  network: "Network",
  hdmi_cable: "HDMI Cables",
  accessories: "Accessories",
  others: "Others",
  unidentified: "Other"
};

const CATEGORIES_TO_SHOW: VendorCategory[] = [
  "cctv_camera", "recorder", "storage", "cable", "connector", "power_device", 
  "display", "camera_mount", "rack", "network", "accessories"
];

export default function ManualQuoteBuilderClient() {
  const [step, setStep] = useState<"lead" | "pos" | "done">("lead");
  
  // Lead state
  const [leadForm, setLeadForm] = useState({ name: "", mobile: "", city: "Jaipur", property_type: "home" });
  const [leadId, setLeadId] = useState<string | null>(null);

  // POS State
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<VendorCategory>("cctv_camera");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [installationCost, setInstallationCost] = useState(0);
  const [salespersonMaxDiscount, setSalespersonMaxDiscount] = useState(0);
  const [minMargin, setMinMargin] = useState(15);
  const [note, setNote] = useState("");
  
  // Result
  const [quoteUrl, setQuoteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Products, Salesperson profile, and Settings
    Promise.all([
      fetch("/api/products").then(res => res.json()),
      fetch("/api/admin/salespersons/me").then(res => res.ok ? res.json() : null).catch(() => null),
      fetch("/api/admin/settings").then(res => res.ok ? res.json() : null).catch(() => null)
    ]).then(([prodRes, spRes, settingsRes]) => {
      if (Array.isArray(prodRes.products)) setProducts(prodRes.products);
      if (spRes?.max_discount_approval_percent) setSalespersonMaxDiscount(spRes.max_discount_approval_percent);
      if (settingsRes?.settings?.minimum_margin_threshold) setMinMargin(settingsRes.settings.minimum_margin_threshold);
    });
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: leadForm.name,
          mobile_number: leadForm.mobile,
          property_type: leadForm.property_type,
          technology_choice: "HD", // default
          cabling_done: false,
          detected_city: leadForm.city,
          source: "walk_in",
          wizard_answers: { city: leadForm.city, property_type: leadForm.property_type },
        }),
      });
      if (!res.ok) throw new Error("Failed to create lead");
      const { id } = await res.json();
      setLeadId(id);
      setStep("pos");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (prod: Product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === prod.id);
      if (exists) {
        return prev.map(i => i.id === prod.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...prod, quantity: 1 }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Derived calculations
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0), [cart]);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const totalPayable = subtotal - discountAmount + installationCost;
  
  // Margin Intelligence
  const totalPurchaseCost = useMemo(() => cart.reduce((acc, item) => acc + ((item.base_cost || item.unit_price) * item.quantity), 0), [cart]);
  const grossProfitValue = totalPayable - totalPurchaseCost;
  const grossProfitPercent = totalPayable > 0 ? (grossProfitValue / totalPayable) * 100 : 0;
  
  // Warning triggers
  const isMarginTooLow = grossProfitPercent < minMargin && cart.length > 0;

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (search) {
        return p.display_name.toLowerCase().includes(search.toLowerCase()) || p.internal_sku?.toLowerCase().includes(search.toLowerCase());
      }
      return p.category === activeCategory;
    });
  }, [products, search, activeCategory]);

  const handleCreateQuote = async () => {
    if (cart.length === 0) return setError("Add at least one item.");
    if (discountPercent > salespersonMaxDiscount) return setError(`Max allowed discount is ${salespersonMaxDiscount}%`);

    setLoading(true);
    setError(null);
    
    // Format items for Quote Line Items schema
    const formattedItems = cart.map(i => ({
      product_id: i.id!,
      display_name: i.display_name,
      brand: i.brand,
      qty: i.quantity,
      unit_price: i.unit_price,
      line_total: i.quantity * i.unit_price,
    }));

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
          note,
          // Send Margin Intelligence explicitly
          total_purchase_cost: totalPurchaseCost,
          gross_profit_value: grossProfitValue,
          gross_profit_percent: grossProfitPercent
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

  return (
    <div className="w-full animate-in fade-in duration-500 pb-20">
      
      {/* STEP 1: LEAD INFO */}
      {step === "lead" && (
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleCreateLead} className="bg-card border border-border rounded-3xl p-8 space-y-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Customer Walk-In</h2>
              <p className="text-sm text-muted-foreground">Register the lead to start building their custom quote.</p>
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
              {loading ? "Registering..." : "Open POS Terminal"} <ArrowRight className="w-4 h-4"/>
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: POS INTERFACE */}
      {step === "pos" && (
        <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
          
          {/* LEFT PANE: CATALOG */}
          <div className="flex-1 flex flex-col bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            {/* Catalog Header & Search */}
            <div className="p-4 border-b border-border bg-muted/20">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3.5 text-muted-foreground" />
                <input 
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search products by name or SKU..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>
            </div>
            
            {/* Category Tabs */}
            {!search && (
              <div className="flex overflow-x-auto border-b border-border hide-scrollbar bg-background">
                {CATEGORIES_TO_SHOW.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeCategory === cat ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            )}

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                  <p>No products found in this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map(p => (
                    <div key={p.id} onClick={() => handleAddToCart(p)} className="bg-background border border-border rounded-2xl p-3 flex flex-col gap-3 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                      <div className="aspect-square bg-muted/30 rounded-xl flex items-center justify-center overflow-hidden relative">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.display_name} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                        )}
                        {p.stock_quantity !== undefined && (
                          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold ${p.stock_quantity > 10 ? "bg-success/20 text-success" : p.stock_quantity > 0 ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"}`}>
                            {p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : "Out of stock"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{p.brand || CATEGORY_LABELS[p.category]}</p>
                        <h4 className="font-semibold text-sm leading-tight text-foreground line-clamp-2">{p.display_name}</h4>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-black text-primary">₹{p.unit_price}</span>
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: CART */}
          <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 bg-muted/20 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" /> Current Quote
              </h2>
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">{cart.length} items</span>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Search className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  Add products from the catalog to build the quote.
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-3 items-start p-3 rounded-2xl bg-muted/30 border border-border">
                    <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center border border-border shrink-0 overflow-hidden">
                       {item.image_url ? <img src={item.image_url} className="object-cover w-full h-full" /> : <ImageIcon className="w-5 h-5 text-muted-foreground/30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">{item.display_name}</h4>
                      <p className="text-xs text-muted-foreground">₹{item.unit_price} / unit</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-background rounded-lg border border-border h-8">
                          <button onClick={() => updateCartQty(item.id!, -1)} className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-foreground">-</button>
                          <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateCartQty(item.id!, 1)} className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-foreground">+</button>
                        </div>
                        <span className="font-bold text-sm">₹{(item.unit_price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.id!)} className="p-1.5 text-muted-foreground hover:text-destructive self-start rounded-lg hover:bg-destructive/10"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Area */}
            <div className="p-4 bg-muted/20 border-t border-border">
              {/* Margin Intelligence Warning */}
              {isMarginTooLow && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-destructive uppercase tracking-wide">Margin Warning</h4>
                    <p className="text-xs text-destructive/90 mt-0.5">Gross profit is critically low ({grossProfitPercent.toFixed(1)}%). Proceed with caution or seek manager approval.</p>
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm group">
                  <span className="text-muted-foreground flex items-center gap-1"><Plus className="w-3 h-3"/> Installation</span>
                  <input type="number" min="0" value={installationCost} onChange={e => setInstallationCost(Number(e.target.value) || 0)} className="w-24 px-3 py-1.5 bg-background border border-input rounded-lg text-right font-medium focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="₹0" />
                </div>

                <div className="flex items-center justify-between text-sm group">
                  <div className="flex flex-col">
                    <span className="text-success font-medium flex items-center gap-1"><Percent className="w-3 h-3"/> Discount</span>
                    <span className="text-[10px] text-muted-foreground">Max limit: {salespersonMaxDiscount}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {discountAmount > 0 && <span className="text-xs font-semibold text-success">- ₹{discountAmount.toLocaleString()}</span>}
                    <input type="number" min="0" max={salespersonMaxDiscount} value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value) || 0)} className="w-16 px-3 py-1.5 bg-background border border-success/30 rounded-lg text-right text-success font-bold focus:ring-2 focus:ring-success outline-none transition-all" placeholder="0%" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border mb-4">
                <div>
                  <span className="font-bold text-lg text-foreground block">Total Payable</span>
                  {!Number.isNaN(grossProfitPercent) && cart.length > 0 && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isMarginTooLow ? "text-destructive" : "text-success"}`}>
                      Est. Margin: {grossProfitPercent.toFixed(1)}%
                    </span>
                  )}
                </div>
                <span className="font-black text-3xl text-primary">₹{totalPayable.toLocaleString()}</span>
              </div>

              {error && <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-xl font-medium mb-4">{error}</div>}

              <button onClick={handleCreateQuote} disabled={loading || cart.length === 0 || discountPercent > salespersonMaxDiscount} className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-lg">
                {loading ? "Generating PDF..." : "Generate Quote"} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* STEP 3: DONE */}
      {step === "done" && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-3xl p-8 space-y-6 shadow-sm text-center">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-3xl font-black text-foreground">PDF Quote Ready!</h2>
            <p className="text-muted-foreground text-lg">Share this beautiful PDF directly with <b>{leadForm.name}</b></p>
            
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border">
               <p className="text-sm font-mono text-muted-foreground flex-1 truncate text-left select-all">{quoteUrl}</p>
               <button onClick={handleCopy} className={`p-3 rounded-xl transition-all font-bold flex items-center gap-2 ${copied ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
                 {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Link</>}
               </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
               <button onClick={handleWhatsApp} className="flex items-center justify-center gap-2 py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] transition-colors shadow-lg shadow-[#25D366]/20">
                 <MessageSquare className="w-5 h-5" /> Send via WhatsApp
               </button>
               <button onClick={() => { setStep("lead"); setCart([]); setQuoteUrl(null); }} className="py-4 bg-secondary text-secondary-foreground font-bold rounded-2xl border border-border hover:bg-secondary/80 transition-colors">
                 Create Another Quote
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
