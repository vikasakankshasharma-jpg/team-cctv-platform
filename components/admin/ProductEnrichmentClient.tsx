"use client";

import { useState, useMemo, useCallback } from "react";
import type { EnrichmentRow, EnrichedField } from "@/app/api/admin/enrich-products/route";
import {
  Sparkles, CheckCircle2, XCircle, AlertTriangle, ChevronDown,
  ChevronUp, Loader2, Check, RefreshCw, Camera, Server, Filter,
  BarChart3, Zap
} from "lucide-react";
import { toast } from "sonner";

interface ProductEnrichmentClientProps {
  products: any[];
}

type Category = "cctv_camera" | "recorder";
type ConfidenceFilter = "all" | "high" | "medium";
type Step = "select" | "analyzing" | "review" | "applying" | "done";

const CONFIDENCE_COLORS = {
  high: "text-emerald-600 bg-emerald-50 border-emerald-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  low: "text-red-500 bg-red-50 border-red-200",
};

const CONFIDENCE_ICONS = {
  high: <CheckCircle2 className="w-3.5 h-3.5" />,
  medium: <AlertTriangle className="w-3.5 h-3.5" />,
  low: <XCircle className="w-3.5 h-3.5" />,
};

const FIELD_DISPLAY: Record<string, string> = {
  resolution_mp: "Resolution",
  night_vision_type: "Night Vision",
  form_factor: "Form Factor",
  ip_rating: "IP Rating",
  lens_mm: "Lens (mm)",
  has_audio: "Built-in Audio",
  camera_model: "Camera Model",
  recorder_type: "Type (DVR/NVR)",
  channels: "Channels",
  compression: "Compression",
  max_resolution_rec: "Max Resolution",
  hdd_slots: "HDD Slots",
  recorder_model: "Recorder Model",
};

function formatValue(key: string, value: any): string {
  if (value === null || value === undefined) return "—";
  if (key === "resolution_mp") return `${value}MP`;
  if (key === "lens_mm") return `${value}mm`;
  if (key === "channels") return `${value} Ch`;
  if (key === "has_audio") return value ? "Yes" : "No";
  if (key === "night_vision_type") {
    const map: Record<string, string> = { ir: "IR", color: "Color Night", dual_light: "Dual Light", starlight: "Starlight" };
    return map[value] || value;
  }
  return String(value);
}

export function ProductEnrichmentClient({ products }: ProductEnrichmentClientProps) {
  const [step, setStep] = useState<Step>("select");
  const [category, setCategory] = useState<Category>("cctv_camera");
  const [rows, setRows] = useState<EnrichmentRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set()); // "productId::fieldKey"
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("all");
  const [totalAnalyzed, setTotalAnalyzed] = useState(0);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [appliedCount, setAppliedCount] = useState(0);
  const [waitingMsg, setWaitingMsg] = useState("");

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Products split by category
  const cameraProducts = useMemo(() => products.filter(p => p.category === "cctv_camera" && !p.is_deleted), [products]);
  const recorderProducts = useMemo(() => products.filter(p => p.category === "recorder" && !p.is_deleted), [products]);
  const activeProducts = category === "cctv_camera" ? cameraProducts : recorderProducts;

  // Stats for select step
  const missingStats = useMemo(() => {
    const prods = activeProducts;
    if (category === "cctv_camera") {
      return {
        total: prods.length,
        missing_resolution: prods.filter(p => !p.resolution_mp).length,
        missing_night_vision: prods.filter(p => !p.night_vision_type).length,
        missing_form_factor: prods.filter(p => !p.form_factor).length,
        missing_ip_rating: prods.filter(p => !p.ip_rating).length,
      };
    }
    return {
      total: prods.length,
      missing_channels: prods.filter(p => !p.channels).length,
      missing_compression: prods.filter(p => !p.compression).length,
      missing_recorder_type: prods.filter(p => !p.recorder_type).length,
    };
  }, [activeProducts, category]);

  // Filtered + sorted rows for review step
  const filteredRows = useMemo(() => {
    return rows.map(row => ({
      ...row,
      fields: row.fields.filter(f =>
        confidenceFilter === "all" ? true : f.confidence === confidenceFilter
      ),
    })).filter(r => r.fields.length > 0);
  }, [rows, confidenceFilter]);

  const totalProposed = useMemo(() => filteredRows.reduce((acc, r) => acc + r.fields.length, 0), [filteredRows]);
  const selectedCount = selected.size;

  // Auto-select all high-confidence on load
  const autoSelectHighConfidence = useCallback((newRows: EnrichmentRow[]) => {
    const autoSelected = new Set<string>();
    const allExpanded = new Set<string>();
    newRows.forEach(row => {
      allExpanded.add(row.product_id);
      row.fields.forEach(f => {
        if (f.confidence === "high") {
          autoSelected.add(`${row.product_id}::${f.key}`);
        }
      });
    });
    setSelected(autoSelected);
    setExpandedRows(allExpanded);
  }, []);

  const handleAnalyze = async () => {
    setStep("analyzing");
    setAnalyzedCount(0);
    setRows([]);

    try {
      const productIds = activeProducts.map(p => p.id).filter(Boolean);
      const BATCH_SIZE = 1; // Process 1 product at a time as requested
      let allRows: EnrichmentRow[] = [];
      let totalProcessed = 0;

      for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
        const batch = productIds.slice(i, i + BATCH_SIZE);
        let success = false;
        let retries = 0;
        
        while (!success && retries < 3) {
          const res = await fetch("/api/admin/enrich-products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_ids: batch, category }),
          });
          
          const data = await res.json();
          
          if (!res.ok) {
            if (data.error && data.error.includes("429")) {
              retries++;
              setWaitingMsg(`Rate limited by AI provider. Pausing for 35 seconds before resuming... (Retry ${retries}/3)`);
              await delay(35000);
              setWaitingMsg("");
              continue;
            } else {
              throw new Error(data.error || "Analysis failed");
            }
          }
          
          if (data.rows) {
            allRows = [...allRows, ...data.rows];
          }
          success = true;
        }
        
        if (!success) {
          throw new Error("Failed after 3 retries due to quota limits.");
        }
        
        totalProcessed += batch.length;
        setAnalyzedCount(totalProcessed);
        
        // Wait 4 seconds between requests to perfectly align with 15 Requests Per Minute limit
        if (i + BATCH_SIZE < productIds.length) {
          await delay(4000);
        }
      }

      setRows(allRows);
      setTotalAnalyzed(totalProcessed);
      autoSelectHighConfidence(allRows);
      setStep("review");
    } catch (err: any) {
      toast.error("Analysis failed: " + err.message);
      setStep("select");
    }
  };

  const handleApply = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one field to apply.");
      return;
    }
    setStep("applying");

    // Group selections by product
    const approvalMap: Record<string, Record<string, any>> = {};
    selected.forEach(key => {
      const [productId, fieldKey] = key.split("::");
      if (!approvalMap[productId]) approvalMap[productId] = {};
      const row = rows.find(r => r.product_id === productId);
      const field = row?.fields.find(f => f.key === fieldKey);
      if (field) approvalMap[productId][fieldKey] = field.proposed;
    });

    const approvals = Object.entries(approvalMap).map(([product_id, fields]) => ({ product_id, fields }));

    try {
      const res = await fetch("/api/admin/enrich-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvals }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Apply failed");
      setAppliedCount(data.updated || 0);
      setStep("done");
      toast.success(`✅ Updated ${data.updated} products!`);
    } catch (err: any) {
      toast.error("Apply failed: " + err.message);
      setStep("review");
    }
  };

  const toggleField = (productId: string, fieldKey: string) => {
    const key = `${productId}::${fieldKey}`;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleRow = (productId: string, row: EnrichmentRow) => {
    const allSelected = row.fields.every(f => selected.has(`${productId}::${f.key}`));
    setSelected(prev => {
      const next = new Set(prev);
      row.fields.forEach(f => {
        const key = `${productId}::${f.key}`;
        if (allSelected) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  };

  const selectAll = () => {
    const allKeys = new Set<string>();
    filteredRows.forEach(row => row.fields.forEach(f => allKeys.add(`${row.product_id}::${f.key}`)));
    setSelected(allKeys);
  };

  const deselectAll = () => setSelected(new Set());

  const selectHighOnly = () => {
    const highKeys = new Set<string>();
    filteredRows.forEach(row => row.fields.forEach(f => {
      if (f.confidence === "high") highKeys.add(`${row.product_id}::${f.key}`);
    }));
    setSelected(highKeys);
  };

  // ─── STEP: SELECT ────────────────────────────────────────────────────────────
  if (step === "select") {
    return (
      <div className="space-y-8">
        {/* Category Toggle */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-base font-semibold text-foreground mb-1">1. Choose product category to enrich</h2>
          <p className="text-sm text-muted-foreground mb-5">The AI will read each product's name and technical name to auto-fill missing specifications.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["cctv_camera", "recorder"] as Category[]).map(cat => {
              const isActive = category === cat;
              const Icon = cat === "cctv_camera" ? Camera : Server;
              const label = cat === "cctv_camera" ? "CCTV Cameras" : "Recorders";
              const count = cat === "cctv_camera" ? cameraProducts.length : recorderProducts.length;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                    isActive
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${isActive ? "text-primary" : "text-foreground"}`}>{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{count} products in catalog</p>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-primary ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Missing Fields Preview */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-base font-semibold text-foreground mb-1">2. Missing fields snapshot</h2>
          <p className="text-sm text-muted-foreground mb-5">Fields currently showing "—" in the customer spec table.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(missingStats).filter(([k]) => k !== "total").map(([key, count]) => {
              const pct = Math.round(((count as number) / missingStats.total) * 100);
              const label = FIELD_DISPLAY[key.replace("missing_", "")] || key.replace("missing_", "").replace("_", " ");
              return (
                <div key={key} className="bg-secondary/50 rounded-xl p-4 border border-border">
                  <p className="text-2xl font-black text-foreground">{count as number}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">{label}</p>
                  <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct > 60 ? "bg-red-500" : pct > 30 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{pct}% missing</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleAnalyze}
          className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[13px] tracking-[0.15em] rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Sparkles className="w-5 h-5" />
          Analyze {activeProducts.length} {category === "cctv_camera" ? "Cameras" : "Recorders"} with AI
          <Zap className="w-4 h-4 opacity-70" />
        </button>
      </div>
    );
  }

  // ─── STEP: ANALYZING ─────────────────────────────────────────────────────────
  if (step === "analyzing") {
    const progressPct = activeProducts.length > 0 ? Math.round((analyzedCount / activeProducts.length) * 100) : 0;

    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <div className="text-center w-full max-w-md">
          <h3 className="text-xl font-bold text-foreground">AI is analyzing products…</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Reading product names and technical specs to extract missing fields.
          </p>
          
          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden mt-6">
            <div 
              className="bg-primary h-full transition-all duration-500 ease-out" 
              style={{ width: `${progressPct}%` }} 
            />
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-muted-foreground font-medium">
              Processing 1 product at a time
            </p>
            <p className="text-xs font-bold text-primary">
              {analyzedCount} / {activeProducts.length}
            </p>
          </div>
          
          {waitingMsg && (
            <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-xs font-semibold animate-pulse">
              {waitingMsg}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── STEP: REVIEW ─────────────────────────────────────────────────────────────
  if (step === "review") {
    const highCount = filteredRows.reduce((a, r) => a + r.fields.filter(f => f.confidence === "high").length, 0);
    const medCount = filteredRows.reduce((a, r) => a + r.fields.filter(f => f.confidence === "medium").length, 0);

    return (
      <div className="space-y-6">
        {/* Summary Bar */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-foreground">AI Analysis Complete</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Analyzed <strong>{totalAnalyzed}</strong> products. Found <strong>{totalProposed}</strong> fields to fill
              — <strong className="text-emerald-600">{highCount} high confidence</strong>,{" "}
              <strong className="text-amber-600">{medCount} medium</strong>.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setStep("select")} className="px-4 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-secondary transition-colors flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Re-analyze
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{selectedCount} selected</span>
            <button onClick={selectAll} className="text-xs font-medium text-primary hover:underline">Select all</button>
            <span className="text-muted-foreground">·</span>
            <button onClick={selectHighOnly} className="text-xs font-medium text-emerald-600 hover:underline">High confidence only</button>
            <span className="text-muted-foreground">·</span>
            <button onClick={deselectAll} className="text-xs font-medium text-muted-foreground hover:underline">Deselect all</button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {(["all", "high", "medium"] as ConfidenceFilter[]).map(cf => (
              <button
                key={cf}
                onClick={() => setConfidenceFilter(cf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize ${
                  confidenceFilter === cf
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {cf}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards */}
        <div className="space-y-3">
          {filteredRows.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No fields found for this filter</p>
            </div>
          )}
          {filteredRows.map(row => {
            const isExpanded = expandedRows.has(row.product_id);
            const allRowSelected = row.fields.every(f => selected.has(`${row.product_id}::${f.key}`));
            const someRowSelected = row.fields.some(f => selected.has(`${row.product_id}::${f.key}`));
            const rowHighCount = row.fields.filter(f => f.confidence === "high").length;

            return (
              <div key={row.product_id} className="border border-border rounded-xl overflow-hidden bg-card">
                {/* Row Header */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <input
                    type="checkbox"
                    checked={allRowSelected}
                    ref={el => { if (el) el.indeterminate = someRowSelected && !allRowSelected; }}
                    onChange={() => toggleRow(row.product_id, row)}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{row.display_name}</p>
                    {row.technical_name && (
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{row.technical_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {rowHighCount} high
                    </span>
                    <span className="text-[11px] text-muted-foreground">{row.fields.length} fields</span>
                    <button
                      onClick={() => setExpandedRows(prev => {
                        const next = new Set(prev);
                        if (next.has(row.product_id)) next.delete(row.product_id);
                        else next.add(row.product_id);
                        return next;
                      })}
                      className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Field Rows */}
                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {row.fields.map(field => {
                      const isChecked = selected.has(`${row.product_id}::${field.key}`);
                      return (
                        <label
                          key={field.key}
                          className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${isChecked ? "bg-primary/3" : "hover:bg-secondary/50"}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleField(row.product_id, field.key)}
                            className="w-4 h-4 rounded accent-primary"
                          />
                          <span className="w-32 text-xs font-semibold text-muted-foreground shrink-0">
                            {FIELD_DISPLAY[field.key] || field.key}
                          </span>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground line-through">
                              {formatValue(field.key, field.current)}
                            </span>
                            <span className="text-muted-foreground text-xs">→</span>
                            <span className={`text-xs font-bold ${isChecked ? "text-primary" : "text-foreground"}`}>
                              {formatValue(field.key, field.proposed)}
                            </span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${CONFIDENCE_COLORS[field.confidence]}`}>
                            {CONFIDENCE_ICONS[field.confidence]}
                            {field.confidence}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Apply Button */}
        <div className="sticky bottom-6 flex justify-end pt-4">
          <button
            onClick={handleApply}
            disabled={selectedCount === 0}
            className="h-14 px-10 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-black uppercase text-[12px] tracking-[0.15em] rounded-2xl shadow-lg flex items-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Check className="w-5 h-5" />
            Apply {selectedCount} Selected Update{selectedCount !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    );
  }

  // ─── STEP: APPLYING ───────────────────────────────────────────────────────────
  if (step === "applying") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground">Saving to database…</h3>
          <p className="text-sm text-muted-foreground mt-2">Writing {selectedCount} spec updates to Firestore.</p>
        </div>
      </div>
    );
  }

  // ─── STEP: DONE ───────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-black text-foreground">All Done! 🎉</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Updated <strong>{appliedCount}</strong> products with AI-extracted specifications.
            The customer spec comparison table will now show real data instead of "—".
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setStep("select"); setRows([]); setSelected(new Set()); }}
            className="px-6 py-3 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Run Again for Other Category
          </button>
          <a
            href="/admin/products"
            className="px-6 py-3 border border-border bg-card text-foreground font-semibold text-sm rounded-xl hover:bg-secondary transition-colors"
          >
            View Products
          </a>
        </div>
      </div>
    );
  }

  return null;
}
