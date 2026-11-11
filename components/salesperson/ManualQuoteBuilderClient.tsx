"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, ArrowRight, Check, User, Phone, MapPin, Search, Copy, MessageSquare, AlertTriangle, Image as ImageIcon, ShoppingCart, Percent } from "lucide-react";
import type { Product, VendorCategory } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

interface CartItem extends Product {
  quantity: number;
}

const CATEGORY_KEY_MAP: Record<VendorCategory, { key: string; fallback: string }> = {
  cctv_camera: { key: "mqb_cat_cameras", fallback: "Cameras" },
  recorder: { key: "mqb_cat_recorders", fallback: "Recorders" },
  storage: { key: "mqb_cat_storage", fallback: "Storage" },
  cable: { key: "mqb_cat_cables", fallback: "Cables" },
  connector: { key: "mqb_cat_connectors", fallback: "Connectors" },
  power_device: { key: "mqb_cat_power", fallback: "Power" },
  display: { key: "mqb_cat_displays", fallback: "Displays" },
  camera_mount: { key: "mqb_cat_mounts", fallback: "Mounts" },
  rack: { key: "mqb_cat_racks", fallback: "Racks" },
  network: { key: "mqb_cat_network", fallback: "Network" },
  hdmi_cable: { key: "mqb_cat_hdmi", fallback: "HDMI Cables" },
  accessories: { key: "mqb_cat_accessories", fallback: "Accessories" },
  others: { key: "mqb_cat_others", fallback: "Others" },
  unidentified: { key: "mqb_cat_others", fallback: "Other" },
};

const CATEGORIES_TO_SHOW: VendorCategory[] = [
  "cctv_camera", "recorder", "storage", "cable", "connector", "power_device", 
  "display", "camera_mount", "rack", "network", "accessories"
];

export default function ManualQuoteBuilderClient() {
  const { t } = useTranslation();

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
      if (!res.ok) throw new Error(t("mqb_err_lead", "Failed to create lead"));
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
      
      // Normalize category to match tabs
      let normCat = (p.category || "").toLowerCase();
      // 1. Strictly respect explicit Admin Category
      if (normCat === "cctv_camera" || normCat === "camera") normCat = "camera";
      else if (normCat === "recorder" || normCat === "dvr" || normCat === "nvr") normCat = "recorder";
      else if (normCat === "storage") normCat = "storage";
      else if (normCat === "cable") normCat = "cable";
      else if (normCat === "power_device" || normCat === "power") normCat = "power";
      else if (normCat === "accessories" || normCat === "accessory" || normCat === "rack" || normCat === "network" || normCat === "camera_mount" || normCat === "mount" || normCat === "bracket") normCat = "accessory";
      else if (normCat === "installation" || normCat === "labor") normCat = "installation";
      else if (normCat === "connector") normCat = "accessory";
      // 2. Fallback fuzzy match
      else if ((normCat.includes("cam") || normCat.includes("cctv")) && !normCat.includes("mount") && !normCat.includes("bracket") && !normCat.includes("accessory") && !normCat.includes("accessories")) normCat = "camera";
      else if (normCat.includes("rec") || normCat.includes("dvr") || normCat.includes("nvr")) normCat = "recorder";
      else if (normCat.includes("stor") || normCat.includes("hdd") || normCat.includes("hard drive")) normCat = "storage";
      else if (normCat.includes("cab") || normCat.includes("wire")) normCat = "cable";
      else if (normCat.includes("power") || normCat.includes("network") || normCat.includes("power_device")) normCat = "power";
      else if (normCat.includes("acc") || normCat.includes("conn") || normCat.includes("junc") || normCat.includes("rack") || normCat.includes("display")) normCat = "accessory";
      else if (normCat.includes("install") || normCat.includes("service")) normCat = "installation";

      return normCat === activeCategory;
    });
  }, [products, search, activeCategory]);

  const handleCreateQuote = async () => {
    if (cart.length === 0) return setError(t("mqb_err_add_item", "Add at least one item."));
    if (discountPercent > salespersonMaxDiscount) {
      return setError(t("mqb_err_max_disc", "Max allowed discount is {max}%", { max: String(salespersonMaxDiscount) }));
    }

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
        throw new Error(data.error || t("mqb_err_quote", "Failed to create quote"));
      }
      const { id } = await res.json();
      setQuoteUrl(`${window.location.origin}/api/quote/${id}/download`);
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
    const msg = encodeURIComponent(
      t("mqb_wa_msg", "Namaste {name} ji!\nHere is your custom CCTV Quotation:\n{url}\n- TEAM CCTV", {
        name: leadForm.name,
        url: quoteUrl,
      })
    );
    window.open(`https://wa.me/91${leadForm.mobile}?text=${msg}`, "_blank");
  };

  return (
    <div className="w-full animate-in fade-in duration-500 pb-20">
      
      {/* STEP 1: LEAD INFO */}
      {step === "lead" && (
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleCreateLead} className="bg-card border border-border rounded-3xl p-4 md:p-8 space-y-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">{t("mqb_walkin_title", "Customer Walk-In")}</h2>
              <p className="text-sm text-muted-foreground">{t("mqb_walkin_sub", "Register the lead to start building their custom quote.")}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5"><User className="w-3 h-3"/> {t("mqb_lbl_name", "Name")}</label>
                <input required value={leadForm.name} onChange={e => setLeadForm(f => ({...f, name: e.target.value}))} className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground text-base sm:text-sm" placeholder={t("mqb_ph_name", "Ramesh Sharma")} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5"><Phone className="w-3 h-3"/> {t("mqb_lbl_mobile", "Mobile")}</label>
                <input required type="tel" pattern="[0-9]{10}" value={leadForm.mobile} onChange={e => setLeadForm(f => ({...f, mobile: e.target.value}))} className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground text-base sm:text-sm" placeholder={t("mqb_ph_mobile", "10-digit number")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5"><MapPin className="w-3 h-3"/> {t("mqb_lbl_city", "City")}</label>
                    <input required value={leadForm.city} onChange={e => setLeadForm(f => ({...f, city: e.target.value}))} className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground text-base sm:text-sm" placeholder={t("mqb_ph_city", "Jaipur")} />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5">{t("mqb_lbl_property", "Property")}</label>
                    <select value={leadForm.property_type} onChange={e => setLeadForm(f => ({...f, property_type: e.target.value}))} className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground text-base sm:text-sm">
                      <option value="home">{t("mqb_prop_home", "Home / Flat")}</option>
                      <option value="shop">{t("mqb_prop_office", "Shop / Office")}</option>
                      <option value="factory">{t("mqb_prop_factory", "Factory")}</option>
                    </select>
                 </div>
              </div>
            </div>

            {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl font-medium">{error}</div>}

            <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 flex justify-center items-center gap-2">
              {loading ? t("mqb_registering", "Registering...") : t("mqb_open_pos", "Open POS Terminal")} <ArrowRight className="w-4 h-4"/>
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
                  placeholder={t("mqb_search_ph", "Search products by name or SKU...")}
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
                    {t(CATEGORY_KEY_MAP[cat].key, CATEGORY_KEY_MAP[cat].fallback)}
                  </button>
                ))}
              </div>
            )}

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                  <p>{t("mqb_no_prods", "No products found in this category.")}</p>
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
                            {p.stock_quantity > 0 ? t("mqb_in_stock", "{count} in stock", { count: String(p.stock_quantity) }) : t("mqb_out_stock", "Out of stock")}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                          {p.brand || (CATEGORY_KEY_MAP[p.category as VendorCategory] ? t(CATEGORY_KEY_MAP[p.category as VendorCategory].key, CATEGORY_KEY_MAP[p.category as VendorCategory].fallback) : p.category)}
                        </p>
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
            <div className="p-4 bg-muted/20 border-b border-border flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" /> {t("mqb_curr_quote", "Current Quote")}
              </h2>
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                {t("mqb_items_count", "{count} items", { count: String(cart.length) })}
              </span>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
              {cart.length === 0 ? (
                <div className="text-center py-4 md:py-10 text-muted-foreground text-sm flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Search className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  {t("mqb_empty_cart", "Add products from the catalog to build the quote.")}
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-3 items-start p-3 rounded-2xl bg-muted/30 border border-border">
                    <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center border border-border shrink-0 overflow-hidden">
                       {item.image_url ? <img src={item.image_url} alt={item.display_name || "Product image"} className="object-cover w-full h-full" /> : <ImageIcon className="w-5 h-5 text-muted-foreground/30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">{item.display_name}</h4>
                      <p className="text-xs text-muted-foreground">₹{item.unit_price} {t("mqb_per_unit", "/ unit")}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-background rounded-lg border border-border h-8">
                          <button onClick={() => updateCartQty(item.id!, -1)} className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-foreground">-</button>
                          <QtyInput qty={item.quantity} onUpdate={(q) => updateCartQty(item.id!, q - item.quantity)} className="text-base sm:text-sm font-bold w-10 text-center" />
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
                    <h4 className="text-xs font-bold text-destructive uppercase tracking-wide">{t("mqb_margin_warn_title", "Margin Warning")}</h4>
                    <p className="text-xs text-destructive/90 mt-0.5">
                      {t("mqb_margin_warn_desc", "Gross profit is critically low ({pct}%). Proceed with caution or seek manager approval.", { pct: grossProfitPercent.toFixed(1) })}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("mqb_subtotal", "Subtotal")}</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm group">
                  <span className="text-muted-foreground flex items-center gap-1"><Plus className="w-3 h-3"/> {t("mqb_installation", "Installation")}</span>
                  <input type="number" min="0" value={installationCost} onChange={e => setInstallationCost(Number(e.target.value) || 0)} className="w-24 px-3 py-1.5 bg-background border border-input rounded-lg text-right font-medium focus:ring-2 focus:ring-primary outline-none transition-all text-base sm:text-sm" placeholder="₹0" />
                </div>

                <div className="flex items-center justify-between text-sm group">
                  <div className="flex flex-col">
                    <span className="text-success font-medium flex items-center gap-1"><Percent className="w-3 h-3"/> {t("mqb_discount", "Discount")}</span>
                    <span className="text-[10px] text-muted-foreground">{t("mqb_max_limit", "Max limit:")} {salespersonMaxDiscount}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {discountAmount > 0 && <span className="text-xs font-semibold text-success">- ₹{discountAmount.toLocaleString()}</span>}
                    <input type="number" min="0" max={salespersonMaxDiscount} value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value) || 0)} className="w-16 px-3 py-1.5 bg-background border border-success/30 rounded-lg text-right text-success font-bold focus:ring-2 focus:ring-success outline-none transition-all text-base sm:text-sm" placeholder="0%" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t border-border mb-4">
                <div>
                  <span className="font-bold text-lg text-foreground block">{t("mqb_total_payable", "Total Payable")}</span>
                  {!Number.isNaN(grossProfitPercent) && cart.length > 0 && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isMarginTooLow ? "text-destructive" : "text-success"}`}>
                      {t("mqb_est_margin", "Est. Margin:")} {grossProfitPercent.toFixed(1)}%
                    </span>
                  )}
                </div>
                <span className="font-black text-3xl text-primary">₹{totalPayable.toLocaleString()}</span>
              </div>

              {error && <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-xl font-medium mb-4">{error}</div>}

              <button onClick={handleCreateQuote} disabled={loading || cart.length === 0 || discountPercent > salespersonMaxDiscount} className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-lg">
                {loading ? t("mqb_generating_pdf", "Generating PDF...") : t("mqb_gen_quote", "Generate Quote")} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* STEP 3: DONE */}
      {step === "done" && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-3xl p-4 md:p-8 space-y-6 shadow-sm text-center">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-3xl font-black text-foreground">{t("mqb_pdf_ready", "PDF Quote Ready!")}</h2>
            <p className="text-muted-foreground text-lg">{t("mqb_pdf_ready_sub", "Share this PDF directly with {name}.", { name: leadForm.name })}</p>
            
            <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border">
               <p className="text-sm font-mono text-muted-foreground flex-1 min-w-0 truncate text-left select-all">{quoteUrl}</p>
               <button onClick={handleCopy} className={`p-3 rounded-xl transition-all font-bold flex items-center gap-2 shrink-0 ${copied ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
                 {copied ? <><Check className="w-4 h-4" /> {t("mqb_copied", "Copied")}</> : <><Copy className="w-4 h-4" /> {t("prt_copy_link", "Copy Link")}</>}
               </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
               <button onClick={handleWhatsApp} className="flex items-center justify-center gap-2 py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] transition-colors shadow-lg shadow-[#25D366]/20">
                 <MessageSquare className="w-5 h-5" /> {t("mqb_send_wa", "Send via WhatsApp")}
               </button>
               <button onClick={() => { setStep("lead"); setCart([]); setQuoteUrl(null); }} className="py-4 bg-secondary text-secondary-foreground font-bold rounded-2xl border border-border hover:bg-secondary/80 transition-colors">
                 {t("mqb_create_another", "Create Another Quote")}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

