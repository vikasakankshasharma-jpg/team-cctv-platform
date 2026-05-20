"use client";

import { useRef, useState, useCallback } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import {
  Upload,
  Download,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
  ChevronDown,
  FileDown,
  FilePlus2,
  RefreshCcw,
  ArrowRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedRow {
  id?: string;
  technical_name?: string;
  display_name?: string;
  category?: string;
  technology?: string;
  brand?: string;
  base_cost?: string | number;
  margin_percentage?: string | number;
  unit_price?: string | number;
  unit_price_budget?: string | number;
  unit_price_premium?: string | number;
  resolution_mp?: string | number;
  channels?: string | number;
  max_cameras?: string | number;
  min_cameras?: string | number;
  catalog_path?: string;
  is_active?: string | boolean;
  image_url?: string;
  [key: string]: unknown;
}

interface RowError {
  row: number;
  field: string;
  message: string;
}

interface PreviewResult {
  toCreate: ParsedRow[];
  toUpdate: ParsedRow[];
  errors: RowError[];
}

type ModalState = "idle" | "upload" | "preview" | "importing" | "done";

interface ExportFilter {
  category: string;
  technology: string;
}

interface BulkImportExportProps {
  activeFilters?: ExportFilter; // Passed in from parent table filters
  onImportSuccess?: () => void; // Callback to refresh the product list
}

// ─── Required CSV columns (all others are optional) ──────────────────────────
const REQUIRED_FIELDS = ["technical_name", "display_name", "category"] as const;
const VALID_CATEGORIES = ["camera", "recorder", "accessory", "cable", "network"];
const VALID_TECHNOLOGIES = ["HD", "IP", "Common", "WiFi", "4G"];

// ─── Validation logic ─────────────────────────────────────────────────────────
function validateRow(row: ParsedRow, index: number): RowError[] {
  const errs: RowError[] = [];
  const rowNum = index + 2; // 1-indexed + header row

  for (const field of REQUIRED_FIELDS) {
    if (!row[field] || String(row[field]).trim() === "") {
      errs.push({ row: rowNum, field, message: `"${field}" is required` });
    }
  }

  if (row.category && !VALID_CATEGORIES.includes(String(row.category))) {
    errs.push({
      row: rowNum,
      field: "category",
      message: `Invalid category "${row.category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`,
    });
  }

  if (row.technology && !VALID_TECHNOLOGIES.includes(String(row.technology))) {
    errs.push({
      row: rowNum,
      field: "technology",
      message: `Invalid technology "${row.technology}". Must be one of: ${VALID_TECHNOLOGIES.join(", ")}`,
    });
  }

  if (row.base_cost !== undefined && row.base_cost !== "") {
    if (isNaN(Number(row.base_cost))) {
      errs.push({ row: rowNum, field: "base_cost", message: `base_cost must be a number` });
    }
  }

  if (row.margin_percentage !== undefined && row.margin_percentage !== "") {
    if (isNaN(Number(row.margin_percentage))) {
      errs.push({ row: rowNum, field: "margin_percentage", message: `margin_percentage must be a number` });
    }
  }

  return errs;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function BulkImportExport({ activeFilters, onImportSuccess }: BulkImportExportProps) {
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<{ created: number; updated: number } | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Export ────────────────────────────────────────────────────────────────
  const handleExport = useCallback(
    (useFilters: boolean) => {
      setShowExportDropdown(false);
      const params = new URLSearchParams();
      if (useFilters && activeFilters) {
        if (activeFilters.category) params.set("category", activeFilters.category);
        if (activeFilters.technology) params.set("technology", activeFilters.technology);
      }
      const url = `/api/admin/products/export${params.toString() ? `?${params}` : ""}`;
      // Trigger download by opening the URL
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("CSV export started — check your downloads.");
    },
    [activeFilters]
  );

  // ─── File parsing ──────────────────────────────────────────────────────────
  const parseFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Only .csv files are accepted.");
      return;
    }
    setFileName(file.name);
    setModalState("upload"); // show spinner briefly while parsing

    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as ParsedRow[];
        const toCreate: ParsedRow[] = [];
        const toUpdate: ParsedRow[] = [];
        const errors: RowError[] = [];

        rows.forEach((row, i) => {
          const rowErrors = validateRow(row, i);
          if (rowErrors.length > 0) {
            errors.push(...rowErrors);
          } else if (!row.id || String(row.id).trim() === "") {
            toCreate.push(row);
          } else {
            toUpdate.push(row);
          }
        });

        setPreview({ toCreate, toUpdate, errors });
        setModalState("preview");
      },
      error: (err) => {
        toast.error("Failed to parse CSV: " + err.message);
        setModalState("upload");
      },
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  // ─── Execute import ────────────────────────────────────────────────────────
  const handleConfirmImport = async () => {
    if (!preview) return;
    const allRows = [...preview.toCreate, ...preview.toUpdate];
    setModalState("importing");

    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: allRows }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setImportResult({ created: data.created, updated: data.updated });
      setModalState("done");
      onImportSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Import failed. Please try again.");
      setModalState("preview");
    }
  };

  // ─── Reset ─────────────────────────────────────────────────────────────────
  const handleClose = () => {
    setModalState("idle");
    setPreview(null);
    setFileName("");
    setImportResult(null);
  };

  const hasActiveFilters = !!(activeFilters?.category || activeFilters?.technology);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Action Buttons ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">

        {/* Export Dropdown */}
        <div className="relative">
          <button
            id="btn-export-csv"
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm active:scale-95 group"
          >
            <FileDown className="w-4 h-4 text-emerald-500" />
            Export CSV
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${showExportDropdown ? "rotate-180" : ""}`} />
          </button>

          {showExportDropdown && (
            <>
              {/* backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowExportDropdown(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl shadow-zinc-900/10 dark:shadow-black/40 overflow-hidden w-64 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  id="btn-export-all"
                  onClick={() => handleExport(false)}
                  className="w-full flex items-start gap-3 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-left"
                >
                  <Download className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider">Export All Products</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Download the full product catalog</p>
                  </div>
                </button>
                {hasActiveFilters && (
                  <>
                    <div className="h-px bg-zinc-100 dark:bg-zinc-700 mx-4" />
                    <button
                      id="btn-export-filtered"
                      onClick={() => handleExport(true)}
                      className="w-full flex items-start gap-3 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-left"
                    >
                      <Filter className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">Export Filtered View</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                          {[activeFilters?.category, activeFilters?.technology].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </button>
                  </>
                )}
                <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-700">
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    The CSV template can also be re-imported with edits or new rows added.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Import Button */}
        <button
          id="btn-import-csv"
          onClick={() => setModalState("upload")}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 group"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </button>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {modalState !== "idle" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/30 dark:bg-black/70 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-[0_40px_80px_rgba(0,0,0,0.12)] dark:shadow-black/60 w-full max-w-2xl border border-zinc-200/50 dark:border-zinc-800/60 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${modalState === "done" ? "bg-emerald-100 dark:bg-emerald-500/10" : "bg-blue-100 dark:bg-blue-500/10"}`}>
                  {modalState === "done"
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    : <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900 dark:text-white tracking-tight">
                    {modalState === "upload" && "Import Products via CSV"}
                    {modalState === "preview" && "Review Import Changes"}
                    {modalState === "importing" && "Processing Import…"}
                    {modalState === "done" && "Import Complete"}
                  </h2>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                    {modalState === "preview" && fileName}
                    {modalState === "upload" && "Upload a .csv file to add or update products in bulk"}
                    {modalState === "done" && "Firestore has been updated successfully"}
                  </p>
                </div>
              </div>
              {modalState !== "importing" && (
                <button
                  onClick={handleClose}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* ── State: Upload ─────────────────────────────────────────────── */}
            {modalState === "upload" && (
              <div className="p-8 space-y-6">
                {/* Drag & Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 scale-[1.01]"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="csv-file-input" />
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-colors ${isDragging ? "bg-blue-500" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                      <FileText className={`w-7 h-7 transition-colors ${isDragging ? "text-white" : "text-zinc-400"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-700 dark:text-zinc-200">
                        {isDragging ? "Drop it here!" : "Drag & drop your CSV, or click to browse"}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">Only .csv files are supported</p>
                    </div>
                  </div>
                </div>

                {/* CSV format guide */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 space-y-3">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">CSV Format Guide</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-600 dark:text-zinc-300">Required Columns</p>
                      {REQUIRED_FIELDS.map(f => (
                        <p key={f} className="font-mono text-[10px] text-red-500">• {f}</p>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-600 dark:text-zinc-300">Update vs Create</p>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        Leave the <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300">id</span> column blank to create new products. Fill it with an existing ID to update.
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    <span className="font-bold">Tip:</span> Use "Export All Products" first to get a correctly formatted template.
                  </p>
                </div>
              </div>
            )}

            {/* ── State: Preview ─────────────────────────────────────────────── */}
            {modalState === "preview" && preview && (
              <div className="p-8 space-y-5 overflow-y-auto max-h-[60vh] scrollbar-none">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <FilePlus2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">New</p>
                    </div>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{preview.toCreate.length}</p>
                    <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60 mt-0.5">products to create</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCcw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Update</p>
                    </div>
                    <p className="text-3xl font-black text-blue-700 dark:text-blue-300 tabular-nums">{preview.toUpdate.length}</p>
                    <p className="text-[10px] text-blue-600/60 dark:text-blue-400/60 mt-0.5">products to update</p>
                  </div>
                  <div className={`rounded-2xl p-4 border ${preview.errors.length > 0 ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20" : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className={`w-4 h-4 ${preview.errors.length > 0 ? "text-red-500" : "text-zinc-400"}`} />
                      <p className={`text-[10px] font-black uppercase tracking-widest ${preview.errors.length > 0 ? "text-red-500" : "text-zinc-400"}`}>Errors</p>
                    </div>
                    <p className={`text-3xl font-black tabular-nums ${preview.errors.length > 0 ? "text-red-600 dark:text-red-400" : "text-zinc-300 dark:text-zinc-600"}`}>{preview.errors.length}</p>
                    <p className={`text-[10px] mt-0.5 ${preview.errors.length > 0 ? "text-red-500/60" : "text-zinc-400"}`}>rows with issues</p>
                  </div>
                </div>

                {/* Error table */}
                {preview.errors.length > 0 && (
                  <div className="rounded-2xl border border-red-100 dark:border-red-500/20 overflow-hidden">
                    <div className="bg-red-50 dark:bg-red-500/10 px-5 py-3 border-b border-red-100 dark:border-red-500/20">
                      <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">
                        ⚠ Rows with Errors — Fix your CSV and re-upload
                      </p>
                    </div>
                    <div className="max-h-48 overflow-y-auto scrollbar-none">
                      <table className="w-full text-xs">
                        <thead className="bg-zinc-50 dark:bg-zinc-800">
                          <tr>
                            <th className="text-left px-5 py-2 font-black text-zinc-400 uppercase tracking-widest text-[10px]">Row</th>
                            <th className="text-left px-5 py-2 font-black text-zinc-400 uppercase tracking-widest text-[10px]">Field</th>
                            <th className="text-left px-5 py-2 font-black text-zinc-400 uppercase tracking-widest text-[10px]">Issue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.errors.map((err, i) => (
                            <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                              <td className="px-5 py-2.5 font-mono font-bold text-red-500">#{err.row}</td>
                              <td className="px-5 py-2.5 font-mono text-zinc-600 dark:text-zinc-300">{err.field}</td>
                              <td className="px-5 py-2.5 text-zinc-500 dark:text-zinc-400">{err.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Valid rows preview */}
                {(preview.toCreate.length > 0 || preview.toUpdate.length > 0) && (
                  <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    <div className="bg-zinc-50 dark:bg-zinc-800/60 px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valid Rows Preview (first 10)</p>
                    </div>
                    <div className="max-h-44 overflow-y-auto scrollbar-none">
                      <table className="w-full text-xs">
                        <thead className="bg-white dark:bg-zinc-900 sticky top-0">
                          <tr>
                            <th className="text-left px-5 py-2 font-black text-zinc-400 text-[10px] uppercase tracking-widest">Action</th>
                            <th className="text-left px-5 py-2 font-black text-zinc-400 text-[10px] uppercase tracking-widest">display_name</th>
                            <th className="text-left px-5 py-2 font-black text-zinc-400 text-[10px] uppercase tracking-widest">category</th>
                            <th className="text-left px-5 py-2 font-black text-zinc-400 text-[10px] uppercase tracking-widest">cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...preview.toCreate.slice(0, 10), ...preview.toUpdate.slice(0, Math.max(0, 10 - preview.toCreate.length))].map((row, i) => {
                            const isNew = !row.id || row.id.trim() === "";
                            return (
                              <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                                <td className="px-5 py-2.5">
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isNew ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"}`}>
                                    {isNew ? "CREATE" : "UPDATE"}
                                  </span>
                                </td>
                                <td className="px-5 py-2.5 font-semibold text-zinc-800 dark:text-zinc-200 max-w-[180px] truncate">{String(row.display_name || "")}</td>
                                <td className="px-5 py-2.5 text-zinc-500 dark:text-zinc-400">{String(row.category || "")}</td>
                                <td className="px-5 py-2.5 font-mono text-zinc-600 dark:text-zinc-300">₹{String(row.base_cost || "—")}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── State: Importing ─────────────────────────────────────────── */}
            {modalState === "importing" && (
              <div className="p-16 flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-blue-100 dark:border-blue-500/20" />
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-blue-500" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-zinc-800 dark:text-white">Writing to Firestore…</p>
                  <p className="text-xs text-zinc-400 mt-1">This may take a moment for large catalogs</p>
                </div>
              </div>
            )}

            {/* ── State: Done ───────────────────────────────────────────────── */}
            {modalState === "done" && importResult && (
              <div className="p-10 flex flex-col items-center gap-6 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <div>
                  <p className="text-lg font-black text-zinc-900 dark:text-white">Import Successful!</p>
                  <p className="text-sm text-zinc-400 mt-1">Your product catalog has been updated.</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{importResult.created}</p>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Created</p>
                  </div>
                  <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-700" />
                  <div className="text-center">
                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{importResult.updated}</p>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Updated</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Modal Footer ─────────────────────────────────────────────── */}
            <div className="px-8 py-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/30">
              <button
                onClick={handleClose}
                disabled={modalState === "importing"}
                className="text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-30 px-2"
              >
                {modalState === "done" ? "Close" : "Cancel"}
              </button>

              {modalState === "preview" && preview && (
                <button
                  id="btn-confirm-import"
                  onClick={handleConfirmImport}
                  disabled={preview.toCreate.length === 0 && preview.toUpdate.length === 0}
                  className="flex items-center gap-2.5 px-7 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-xl shadow-zinc-900/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirm & Import
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {modalState === "upload" && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2.5 px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  Choose File
                </button>
              )}

              {modalState === "done" && (
                <button
                  onClick={() => { handleClose(); }}
                  className="flex items-center gap-2.5 px-7 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
