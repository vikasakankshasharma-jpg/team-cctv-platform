"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCartStore } from "@/stores/useCartStore";
import { Loader2, ShoppingCart, Trash2, AlertTriangle, Plus, Minus, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ProBuilderClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("camera");
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const { technology, items, addItem, removeItem, updateQty, clearCart, getTotal, getCameraCount } = useCartStore();

  useEffect(() => {
    fetch("/api/catalog")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const normalized = data.products.map((p: any) => ({
            ...p,
            normCat: p.category.includes("camera") ? "camera" 
                   : p.category.includes("recorder") ? "recorder" 
                   : p.category.includes("storage") ? "storage" 
                   : p.category.includes("cable") ? "cable"
                   : p.category.includes("power") || p.category.includes("network") ? "power"
                   : p.category === "installation" ? "installation"
                   : "accessory"
          }));
          setProducts(normalized);
        }
        setLoading(false);
      });
  }, []);

  const categories = [
    { id: "camera", label: "Cameras" },
    { id: "recorder", label: "Recorders" },
    { id: "storage", label: "Storage" },
    { id: "cable", label: "Cables" },
    { id: "power", label: "Power / Network" },
    { id: "accessory", label: "Accessories" },
    { id: "installation", label: "Installation" }
  ];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.normCat !== activeCategory) return false;
      if (technology && p.technologies && !p.technologies.includes("Common")) {
        if (!p.technologies.includes(technology)) return false;
      }
      return true;
    });
  }, [products, activeCategory, technology]);

  const handleCheckout = async () => {
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

      const total = getTotal();
      const gst = Math.round(total * 0.18);
      const grandTotal = total + gst;

      const pricingSnapshot = {
        base_price: total,
        gst_amount: gst,
        total_price: grandTotal,
        items: quoteItems,
        is_custom_pro: true,
        technology
      };

      const res = await fetch("/api/quote/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: "Pro Builder Guest",
          customer_mobile: "",
          requirementSnapshot: {
            installation_type: "new",
            camera_count: camCount,
            technology_preference: technology || "IP",
            is_pro_builder: true
          },
          configurationSnapshot: {},
          pricingSnapshot,
          selectedPlan: "Pro_Custom_Build",
          isV2: true
        })
      });

      const data = await res.json();
      if (data.success && data.quoteId) {
        router.push(`/quote/${data.quoteId}`);
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

  const camCount = getCameraCount();
  const isOverCapacity = camCount > channelCapacity && channelCapacity > 0;

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

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === cat.id 
                    ? "bg-slate-900 text-white shadow-md" 
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(p => {
              const inCart = items.find(i => i.id === p.id);
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col h-full hover:shadow-lg transition-shadow">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded">
                        {p.brand || "Generic"}
                      </span>
                      {p.technologies && p.technologies.map((t: string) => (
                        <span key={t} className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                    <h4 className="font-bold text-slate-900 leading-snug">{p.display_name}</h4>
                    {p.channels && <p className="text-xs text-slate-500 font-medium">{p.channels} Channels</p>}
                    <div className="text-lg font-black text-slate-900">
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
              <div className="col-span-full py-12 text-center">
                <p className="text-slate-400 font-medium">No products found in this category.</p>
              </div>
            )}
          </div>
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
            
            <Button 
              onClick={handleCheckout} 
              disabled={isGenerating || items.length === 0} 
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-bold shadow-xl shadow-blue-600/20"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Review & Download PDF"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
