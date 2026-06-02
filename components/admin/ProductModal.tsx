"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2, Package, Tag, Layers, Cpu, BadgeIndianRupee, Activity, Link2 } from "lucide-react";
import type { Product } from "@/types";

const productSchema = z.object({
  display_name: z.string().min(1, "Display name is required"),
  technical_name: z.string().min(1, "Technical name is required"),
  category: z.enum(["camera", "recorder", "accessory", "cable"]),
  technologies: z.array(z.enum(["IP", "HD", "Wireless", "Common"])),
  base_cost: z.number().min(0),
  margin_percentage: z.number().min(0).max(99),
  unit_price: z.number().min(0),
  unit_price_budget: z.number().optional().nullable(),
  unit_price_premium: z.number().optional().nullable(),
  is_active: z.boolean(),
  resolution_tier: z.enum(["good", "very_clear", "crystal_clear"]).optional(),
  channels: z.number().optional(),
  catalog_path: z.string().optional(),
  compatible_paths: z.array(z.string()),
  max_cameras: z.number().optional().nullable(),
  min_cameras: z.number().optional().nullable(),
  brand: z.string().optional().nullable(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (data: Omit<Product, "id">) => Promise<void>;
}

export function ProductModal({ isOpen, onClose, product, onSave }: ProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCompatiblePath, setNewCompatiblePath] = useState("");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      display_name: "",
      technical_name: "",
      category: "camera",
      technologies: ["IP"],
      base_cost: 0,
      margin_percentage: 0,
      unit_price: 0,
      is_active: true,
      catalog_path: "",
      compatible_paths: [],
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;

  const category = watch("category");
  const compatiblePaths = watch("compatible_paths");

  useEffect(() => {
    if (product && isOpen) {
      form.reset({
        display_name: product.display_name,
        technical_name: product.technical_name,
        category: product.category as any,
        technologies: product.technologies || ["IP"],
        base_cost: product.base_cost ?? 0,
        margin_percentage: product.margin_percentage ?? 0,
        unit_price: product.unit_price,
        unit_price_budget: product.unit_price_budget,
        unit_price_premium: product.unit_price_premium,
        is_active: product.is_active ?? true,
        resolution_tier: product.resolution_tier as any,
        channels: product.channels,
        catalog_path: product.catalog_path ?? "",
        compatible_paths: product.compatible_paths ?? [],
        max_cameras: product.max_cameras,
        min_cameras: product.min_cameras,
        brand: product.brand,
      });
    } else {
      form.reset({
        display_name: "",
        technical_name: "",
        category: "camera",
        technologies: ["IP"],
        base_cost: 0,
        margin_percentage: 0,
        unit_price: 0,
        is_active: true,
        catalog_path: "",
        compatible_paths: [],
      });
    }
    setNewCompatiblePath("");
  }, [product, isOpen, form]);

  if (!isOpen) return null;

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    
    // Clean up conditional fields before save
    const dataToSave: any = { ...data };
    if (dataToSave.category !== "camera") {
      delete dataToSave.resolution_tier;
    }
    if (dataToSave.category !== "recorder") {
      delete dataToSave.channels;
    }

    try {
      await onSave(dataToSave as Omit<Product, "id">);
    } catch (error) {
      console.error("Failed to save product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCompatiblePath = () => {
    if (!newCompatiblePath.trim()) return;
    const current = form.getValues("compatible_paths") ?? [];
    if (!current.includes(newCompatiblePath.trim())) {
      setValue("compatible_paths", [...current, newCompatiblePath.trim()]);
    }
    setNewCompatiblePath("");
  };

  const removeCompatiblePath = (path: string) => {
    const current = form.getValues("compatible_paths") ?? [];
    setValue("compatible_paths", current.filter(p => p !== path));
  };

  const handleBaseCostChange = (val: number) => {
    const margin = form.getValues("margin_percentage") || 0;
    let newUnitPrice = form.getValues("unit_price");
    if (margin > 0 && margin < 100) {
      newUnitPrice = Math.round(val / (1 - margin / 100));
    }
    setValue("base_cost", val);
    setValue("unit_price", newUnitPrice);
  };

  const handleMarginChange = (val: number) => {
    const cost = form.getValues("base_cost") || 0;
    let newUnitPrice = form.getValues("unit_price");
    if (val > 0 && val < 100 && cost > 0) {
      newUnitPrice = Math.round(cost / (1 - val / 100));
    }
    setValue("margin_percentage", val);
    setValue("unit_price", newUnitPrice);
  };

  const handleUnitPriceChange = (val: number) => {
    const cost = form.getValues("base_cost") || 0;
    let newMargin = form.getValues("margin_percentage") || 0;
    if (val > 0 && cost > 0) {
      newMargin = Number((((val - cost) / val) * 100).toFixed(2));
    }
    setValue("unit_price", val);
    setValue("margin_percentage", newMargin);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-500" onClick={onClose} />
      
      {/* Modal Card */}
      <div className="relative bg-background border border-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-in zoom-in-95 fade-in duration-500 max-h-[90vh] flex flex-col">
        
        {/* Header Section */}
        <div className="p-8 pb-6 shrink-0 border-b border-border bg-secondary/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight">
                  {product ? "Refine Product" : "Catalogue Entry"}
                </h2>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Core Hardware Specification</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* Identity Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" /> Marketing Display Name
              </label>
              <input
                {...register("display_name")}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                placeholder="e.g. TEAM Smart 2MP Dome"
              />
              {errors.display_name && <span className="text-[10px] text-destructive">{errors.display_name.message}</span>}
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" /> Technical SKU / Model
              </label>
              <input
                {...register("technical_name")}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm uppercase tracking-wider"
                placeholder="e.g. IPC-D120-I"
              />
              {errors.technical_name && <span className="text-[10px] text-destructive">{errors.technical_name.message}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Type Category</label>
              <select
                {...register("category")}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer shadow-sm"
              >
                <option value="camera">Camera Unit</option>
                <option value="recorder">Recorder (DVR/NVR)</option>
                <option value="accessory">Accessory</option>
                <option value="cable">Cable / Hard Drive</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5" /> Tech Standard
              </label>
              <select
                value={form.watch("technologies")?.[0] || "IP"}
                onChange={(e) => form.setValue("technologies", [e.target.value as any])}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer shadow-sm"
              >
                <option value="IP">IP (Network / Wired)</option>
                <option value="HD">Analog HD</option>
                <option value="Wireless">Wireless (WiFi/4G/Solar)</option>
                <option value="Common">Common (Fits All)</option>
              </select>
            </div>
          </div>

          {/* Pricing & Logic Section */}
          <div className="bg-secondary/20 p-6 rounded-2xl border border-border space-y-6">
            <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
               <Activity className="w-3.5 h-3.5" /> Logic & Financials
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-2">
                    Purchase Cost (Base)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={watch("base_cost") || ""}
                      onChange={(e) => handleBaseCostChange(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-xl pl-8 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-2">
                    Target Margin %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      step="0.01"
                      value={watch("margin_percentage") || ""}
                      onChange={(e) => handleMarginChange(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-primary uppercase tracking-wider ml-1 flex items-center gap-2">
                    <BadgeIndianRupee className="w-3.5 h-3.5" /> Final Selling Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">₹</span>
                    <input
                      required
                      type="number"
                      min="0"
                      value={watch("unit_price")}
                      onChange={(e) => handleUnitPriceChange(Number(e.target.value))}
                      className="w-full bg-background border border-primary/30 rounded-xl pl-8 pr-4 py-3 text-foreground font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                    Value / Budget Price <span className="normal-case tracking-normal font-normal opacity-70">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                    <input
                      type="number"
                      min="0"
                      {...register("unit_price_budget", { valueAsNumber: true })}
                      placeholder="Auto-calculated if empty"
                      className="w-full bg-background border border-border rounded-xl pl-8 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                    Elite / Premium Price <span className="normal-case tracking-normal font-normal opacity-70">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                    <input
                      type="number"
                      min="0"
                      {...register("unit_price_premium", { valueAsNumber: true })}
                      placeholder="Auto-calculated if empty"
                      className="w-full bg-background border border-border rounded-xl pl-8 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {category === "camera" && (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-success uppercase tracking-wider ml-1">Resolution Payload</label>
                  <select
                    {...register("resolution_tier")}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-success/20 transition-all appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="good">Good (2MP)</option>
                    <option value="very_clear">Very Clear (4MP/5MP)</option>
                    <option value="crystal_clear">Crystal Clear (8MP+)</option>
                  </select>
                </div>
              )}

              {category === "recorder" && (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-primary uppercase tracking-wider ml-1">Channel Capacity</label>
                  <select
                    {...register("channels", { valueAsNumber: true })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer shadow-sm"
                  >
                    <option value={4}>4-Channel Hub</option>
                    <option value={8}>8-Channel Hub</option>
                    <option value={16}>16-Channel Hub</option>
                    <option value={32}>32-Channel Hub</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 mt-2">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground tracking-tight">Active Catalogue State</p>
                <p className="text-[11px] font-medium text-muted-foreground">Controls availability in live estimation wizard</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register("is_active")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary transition-all shadow-inner"></div>
              </label>
            </div>
          </div>

          {/* ── Compatibility Section ─────────────────────────────────────── */}
          {(category === "camera" || category === "recorder" || category === "accessory") && (
            <div className="bg-secondary/20 p-6 rounded-2xl border border-border space-y-6">
              <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5" /> Compatibility Engine
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1 block">
                    Catalog Path <span className="normal-case font-normal opacity-60">(e.g., CCTV/Cameras/IP/4MP)</span>
                  </label>
                  <input
                    type="text"
                    {...register("catalog_path")}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    placeholder="Category / Subcategory / Type"
                  />
                </div>

                {(category === "recorder" || category === "accessory") && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1 block">
                        Compatible Paths <span className="normal-case font-normal opacity-60">(What this device supports)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCompatiblePath}
                          onChange={(e) => setNewCompatiblePath(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCompatiblePath();
                            }
                          }}
                          className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-success/20 transition-all shadow-sm"
                          placeholder="e.g., CCTV/Cameras/IP"
                        />
                        <button
                          type="button"
                          onClick={addCompatiblePath}
                          className="px-5 py-2.5 bg-success hover:bg-success/90 text-success-foreground font-semibold text-xs rounded-xl transition-colors shadow-sm"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {compatiblePaths.length === 0 && (
                          <span className="text-xs text-muted-foreground font-medium italic">No compatible paths added.</span>
                        )}
                        {compatiblePaths.map(path => (
                          <span key={path} className="px-3 py-1.5 rounded-full bg-success/10 border border-success/20 text-[11px] font-semibold text-success flex items-center gap-2">
                            {path}
                            <button type="button" onClick={() => removeCompatiblePath(path)} className="text-success hover:text-success/70">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1 block">Max Cameras</label>
                      <select 
                        {...register("max_cameras", { valueAsNumber: true })}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none shadow-sm">
                        <option value={0}>— Not Set —</option>
                        <option value={1}>1 Camera</option>
                        <option value={4}>4 Cameras</option>
                        <option value={8}>8 Cameras</option>
                        <option value={16}>16 Cameras</option>
                        <option value={32}>32 Cameras</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1 block">Min Cameras</label>
                      <select 
                        {...register("min_cameras", { valueAsNumber: true })}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none shadow-sm">
                        <option value={0}>— Not Set —</option>
                        <option value={1}>1 Camera</option>
                        <option value={5}>5 Cameras</option>
                        <option value={9}>9 Cameras</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-md py-4 -mb-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Package className="w-4 h-4" />
              )}
              {product ? "Sync System" : "Commit to Inventory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
