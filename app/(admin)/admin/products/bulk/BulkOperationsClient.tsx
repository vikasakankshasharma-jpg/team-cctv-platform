"use client";

import { useState, useRef } from "react";
import { Download, Upload, AlertTriangle, CheckCircle2, FileSpreadsheet, RefreshCw } from "lucide-react";
import type { Product } from "@/types";
import { toast } from "sonner";
import Papa from "papaparse";
import { bulkUpdateProducts } from "@/app/actions/bulk-operations";
import { useRouter } from "next/navigation";

interface BulkOperationsClientProps {
  products: Product[];
}

export function BulkOperationsClient({ products }: BulkOperationsClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<Product>[] | null>(null);
  const [importStats, setImportStats] = useState({ updated: 0, new: 0, total: 0 });

  const handleExport = () => {
    setIsExporting(true);
    try {
      // Prepare data for export. 
      // We stringify arrays like compatible_paths so they can be parsed back easily.
      const exportData = products.map(p => ({
        id: p.id,
        display_name: p.display_name,
        technical_name: p.technical_name,
        category: p.category,
        technologies: p.technologies ? p.technologies.join(', ') : "Common",
        base_cost: p.base_cost,
        margin_percentage: p.margin_percentage,
        unit_price: p.unit_price,
        is_active: p.is_active,
        compatible_paths: p.compatible_paths ? p.compatible_paths.join(" | ") : "",
        catalog_path: p.catalog_path || ""
      }));

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Product_Catalog_Export_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Catalog exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export catalog.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        
        // Map raw CSV strings back to appropriate types
        const structuredData: Partial<Product>[] = rows.map(row => {
          const prod: Partial<Product> = {
            id: row.id?.trim() || undefined, // If blank, it will be treated as a new product
            display_name: row.display_name,
            technical_name: row.technical_name,
            category: row.category as any,
            technologies: row.technologies ? String(row.technologies).split(',').map(t => t.trim()) as any[] : ["Common"],
            base_cost: parseFloat(row.base_cost) || 0,
            margin_percentage: parseFloat(row.margin_percentage) || 0,
            unit_price: parseFloat(row.unit_price) || 0,
            is_active: row.is_active === "true" || row.is_active === "TRUE",
            catalog_path: row.catalog_path || undefined
          };

          if (row.compatible_paths) {
            prod.compatible_paths = row.compatible_paths.split("|").map(s => s.trim()).filter(Boolean);
          } else {
            prod.compatible_paths = [];
          }

          return prod;
        });

        const newCount = structuredData.filter(p => !p.id).length;
        const updatedCount = structuredData.length - newCount;

        setImportStats({ updated: updatedCount, new: newCount, total: structuredData.length });
        setParsedData(structuredData);
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        toast.error("Invalid CSV file format.");
      }
    });
  };

  const executeImport = async () => {
    if (!parsedData) return;
    setIsImporting(true);
    
    try {
      const result = await bulkUpdateProducts(parsedData);
      toast.success(`Successfully processed ${result.count} products!`);
      setParsedData(null); // Reset UI
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Bulk import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      
      {/* EXPORT CARD */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 shadow-md flex flex-col items-center text-center relative overflow-hidden group">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-700" />
        <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500">
          <Download className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2 relative z-10">Export Catalog</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-8 max-w-[280px] relative z-10">
          Download a complete CSV backup of all <strong className="text-zinc-900 dark:text-white">{products.length}</strong> products. You can edit this file in Excel to adjust prices or compatibility in bulk.
        </p>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full relative z-10 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-md shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-95 disabled:opacity-50"
        >
          {isExporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
          Generate CSV
        </button>
      </div>

      {/* IMPORT CARD */}
      <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-8 shadow-md relative overflow-hidden flex flex-col items-center text-center group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors duration-700" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors duration-700" />
        
        {!parsedData ? (
          <>
            <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 z-10 group-hover:scale-110 transition-transform duration-500">
              <Upload className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 z-10">Import Modifications</h3>
            <p className="text-xs text-zinc-400 mb-8 max-w-[280px] z-10">
              Upload your modified CSV. Ensure you do not alter the <strong className="text-white">id</strong> column if you are updating existing products.
            </p>
            
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full relative z-10 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/40 active:scale-95"
            >
              <Upload className="w-5 h-5" />
              Select CSV File
            </button>
          </>
        ) : (
          <div className="w-full text-left z-10 space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <div>
                <h4 className="text-white font-black uppercase tracking-widest text-sm">Data Parsed Successfully</h4>
                <p className="text-xs text-zinc-500">{importStats.total} rows detected</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Existing Products to Update</div>
                  <div className="text-3xl font-black text-blue-400 mt-1">{importStats.updated}</div>
               </div>
               <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">New Products to Create</div>
                  <div className="text-3xl font-black text-emerald-400 mt-1">{importStats.new}</div>
               </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-200/70 leading-relaxed font-medium">
                This action is irreversible. All matching products in the database will be overwritten with the values from your CSV.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setParsedData(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                disabled={isImporting}
                className="flex-1 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeImport}
                disabled={isImporting}
                className="flex-[2] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
              >
                {isImporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Confirm Import"}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
