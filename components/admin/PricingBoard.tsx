"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Check, 
  RotateCcw, 
  AlertCircle, 
  Save, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Monitor,
  HardDrive,
  Cable,
  Wrench,
  Camera
} from "lucide-react";
import type { Product, AppSettings, PricingResult, ConfiguratorSelection } from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";
import { updateProductPrices } from "@/app/actions/pricing";
import { toast } from "sonner";
import Link from "next/link";

interface PricingBoardProps {
  initialProducts: Product[];
  settings: AppSettings;
  addons: any[];
}

const REFERENCE_CONFIGS: { label: string, selection: ConfiguratorSelection }[] = [
  { 
    label: "4 Cam HD (Opt-1)", 
    selection: { technology: "HD", camera_count: 4, recording_days: 7, selected_camera_option: 1, plan_type: "recommended", selected_addons: [], picture_quality: "good" } 
  },
  { 
    label: "4 Cam IP (Opt-4)", 
    selection: { technology: "IP", camera_count: 4, recording_days: 15, selected_camera_option: 4, plan_type: "recommended", selected_addons: [], picture_quality: "good" } 
  },
  { 
    label: "8 Cam HD (Opt-1)", 
    selection: { technology: "HD", camera_count: 8, recording_days: 7, selected_camera_option: 1, plan_type: "recommended", selected_addons: [], picture_quality: "good" } 
  },
  { 
    label: "8 Cam IP (Opt-4)", 
    selection: { technology: "IP", camera_count: 8, recording_days: 15, selected_camera_option: 4, plan_type: "recommended", selected_addons: [], picture_quality: "good" } 
  },
  { 
    label: "16 Cam HD (Opt-2)", 
    selection: { technology: "HD", camera_count: 16, recording_days: 7, selected_camera_option: 2, plan_type: "recommended", selected_addons: [], picture_quality: "very_clear" } 
  },
  { 
    label: "16 Cam IP (Opt-5)", 
    selection: { technology: "IP", camera_count: 16, recording_days: 30, selected_camera_option: 5, plan_type: "recommended", selected_addons: [], picture_quality: "very_clear" } 
  }
];

export default function PricingBoard({ initialProducts, settings, addons }: PricingBoardProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
  const [isPublishing, setIsPublishing] = useState(false);

  // ─── Inline Editing Logic ──────────────────────────────────────────

  const handlePriceChange = (id: string, newPrice: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, unit_price: newPrice } : p));
    setChangedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleReset = () => {
    setProducts(initialProducts);
    setChangedIds(new Set());
  };

  const handlePublish = async () => {
    if (changedIds.size === 0) return;
    
    setIsPublishing(true);
    const changes = products
      .filter(p => changedIds.has(p.id!))
      .map(p => ({ id: p.id!, unit_price: p.unit_price }));

    try {
      await updateProductPrices(changes);
      toast.success(`Successfully published ${changes.length} price updates.`);
      setChangedIds(new Set());
    } catch (err) {
      toast.error("Failed to publish price updates.");
    } finally {
      setIsPublishing(false);
    }
  };

  // ─── Live Quote Preview Logic ──────────────────────────────────────


  const previews = useMemo(() => {
    return REFERENCE_CONFIGS.map(config => {
      const result = calculatePricing({
        selection: config.selection,
        products,
        addons,
        settings,
        cablingDone: false,
        evaluatedAddonRules: {}
      });
      return { label: config.label, total: result.total_payable };
    });
  }, [products, settings, addons]);

  // ─── Render Helpers ────────────────────────────────────────────────

  const categories = [
    { name: "IP Recorders", filter: (p: Product) => p.category === "recorder" && p.technology === "IP", icon: Monitor },
    { name: "HD Recorders", filter: (p: Product) => p.category === "recorder" && p.technology === "HD", icon: HardDrive },
    { name: "IP Cameras", filter: (p: Product) => p.category === "camera" && p.technology === "IP", icon: Camera },
    { name: "HD Cameras", filter: (p: Product) => p.category === "camera" && p.technology === "HD", icon: Camera },
    { name: "Storage (HDD)", filter: (p: Product) => p.category === "accessory" && p.technical_name.toLowerCase().includes("hdd"), icon: HardDrive },
    { name: "Accessories & Cable", filter: (p: Product) => (p.category === "accessory" || p.category === "cable") && !p.technical_name.toLowerCase().includes("hdd"), icon: Cable },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      
      {/* ─── LEFT: Product Catalog Editor (8 Cols) ──────────────────── */}
      <div className="xl:col-span-8 space-y-6">
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900/40 p-6 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Active Price Board</h2>
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Modified {changedIds.size} SKUs in this session</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/admin/pricing/logs"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> History
            </Link>
            {changedIds.size > 0 && (
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            )}
            <button 
              onClick={handlePublish}
              disabled={changedIds.size === 0 || isPublishing}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                changedIds.size > 0 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95" 
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
              }`}
            >
              {isPublishing ? "Publishing..." : <><Save className="w-4 h-4" /> Publish Prices</>}
            </button>
          </div>
        </div>

        {categories.map((cat, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900/40 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden backdrop-blur-md">
            <div className="bg-zinc-50 dark:bg-zinc-950/40 px-8 py-5 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center gap-3">
              <cat.icon className="w-5 h-5 text-zinc-400" />
              <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-[0.1em] text-xs">{cat.name}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-zinc-400 dark:text-zinc-600 uppercase text-[9px] font-black tracking-widest border-b border-zinc-50 dark:border-zinc-800/40">
                  <tr>
                    <th className="px-8 py-4">Display Name</th>
                    <th className="px-8 py-4">SKU / Technical Name</th>
                    <th className="px-8 py-4 text-right">Selling Price (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                  {products.filter(cat.filter).map((product) => (
                    <tr key={product.id} className={`group transition-all ${changedIds.has(product.id!) ? "bg-blue-50/30 dark:bg-blue-500/5" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"}`}>
                      <td className="px-8 py-4">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{product.display_name}</div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 rounded-md">{product.technical_name}</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end items-center gap-3">
                          {changedIds.has(product.id!) && <AlertCircle className="w-4 h-4 text-blue-500 animate-pulse" />}
                          <div className="relative group/input">
                            <input 
                              type="number"
                              value={product.unit_price}
                              onChange={(e) => handlePriceChange(product.id!, parseFloat(e.target.value) || 0)}
                              className={`w-32 bg-transparent text-right font-black text-base focus:outline-none focus:ring-0 transition-all ${
                                changedIds.has(product.id!) ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-white"
                              }`}
                            />
                            <div className="absolute -bottom-1 right-0 w-0 h-0.5 bg-blue-500 group-focus-within/input:w-full transition-all duration-300" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* ─── RIGHT: Live Quote Preview (4 Cols) ──────────────────── */}
      <div className="xl:col-span-4 space-y-6">
        <div className="sticky top-6">
          <div className="bg-zinc-900 rounded-[32px] border border-zinc-800 p-8 shadow-2xl shadow-zinc-950 overflow-hidden relative group">
            {/* Animated Background Effect */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-1000" />
            
            <div className="relative space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Live Impact Preview</h3>
              </div>

              <div className="space-y-4">
                {previews.map((prev, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all group/item">
                    <div>
                      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 group-hover/item:text-blue-400 transition-colors">{prev.label}</div>
                      <div className="text-xs font-bold text-zinc-400">Total Quotation Value</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-white">₹{prev.total.toLocaleString('en-IN')}</div>
                      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">Instant Calc</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Stability Guard</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Calculations above are performed in real-time using your current session edits. These values will be live for all customers once you click <span className="text-white font-bold">Publish</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
