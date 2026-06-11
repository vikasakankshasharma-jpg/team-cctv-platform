"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, PlusCircle, XCircle, FileSpreadsheet, RefreshCw } from "lucide-react";
import type { Product } from "@/types";

export type ImportRowAction = "NEW" | "UPDATE" | "ERROR";

export interface ReviewRow {
  action: ImportRowAction;
  parsed: Partial<Product>;
  oldProduct?: Product;
  errors?: string[];
  changedFields?: string[];
}

interface ReviewImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isImporting: boolean;
  rows: ReviewRow[];
}

export function ReviewImportModal({ isOpen, onClose, onConfirm, isImporting, rows }: ReviewImportModalProps) {
  if (!isOpen) return null;

  const newCount = rows.filter(r => r.action === "NEW").length;
  const updateCount = rows.filter(r => r.action === "UPDATE").length;
  const errorCount = rows.filter(r => r.action === "ERROR").length;
  
  const validCount = newCount + updateCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-6xl max-h-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Review Import Changes</h2>
              <p className="text-sm text-zinc-400">Dry-run preview. No changes have been made yet.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isImporting}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b border-zinc-800 bg-zinc-950">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">New Products</p>
              <p className="text-2xl font-black text-emerald-400">{newCount}</p>
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Updates</p>
              <p className="text-2xl font-black text-blue-400">{updateCount}</p>
            </div>
          </div>

          <div className={`bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 ${errorCount > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-zinc-800'}`}>
            <div className={`p-3 rounded-lg ${errorCount > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-500'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${errorCount > 0 ? 'text-amber-500' : 'text-zinc-500'}`}>Errors (Skipped)</p>
              <p className={`text-2xl font-black ${errorCount > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>{errorCount}</p>
            </div>
          </div>
        </div>

        {/* PREVIEW TABLE */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950 space-y-8">
          
          {/* VALID ROWS PREVIEW */}
          {(newCount > 0 || updateCount > 0) && (
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Preview (First 10 Valid Rows)</h3>
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400 font-medium">
                    <tr>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3 w-1/3">Display Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Cost Change</th>
                      <th className="px-4 py-3">Changes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {rows.filter(r => r.action !== "ERROR").slice(0, 10).map((row, i) => {
                      const oldCost = row.oldProduct?.base_cost || 0;
                      const newCost = row.parsed.base_cost || 0;
                      const costDiff = newCost - oldCost;
                      const isCostUp = costDiff > 0;
                      const isCostDown = costDiff < 0;

                      return (
                        <tr key={i} className="hover:bg-zinc-900/30 transition-colors">
                          <td className="px-4 py-3">
                            {row.action === "NEW" ? (
                              <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase">New</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold uppercase">Update</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-white truncate max-w-xs" title={row.parsed.display_name}>{row.parsed.display_name}</div>
                            <div className="text-xs text-zinc-500 truncate max-w-xs">{row.parsed.id || "Auto-ID"}</div>
                          </td>
                          <td className="px-4 py-3 text-zinc-300">
                            {row.parsed.category}
                          </td>
                          <td className="px-4 py-3">
                            {row.action === "UPDATE" ? (
                              <div className="flex items-center gap-2 font-mono text-sm">
                                <span className="text-zinc-500">₹{oldCost.toLocaleString()}</span>
                                <ArrowRight className="w-3 h-3 text-zinc-600" />
                                <span className={`${isCostUp ? 'text-amber-400' : isCostDown ? 'text-emerald-400' : 'text-zinc-300'}`}>
                                  ₹{newCost.toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span className="font-mono text-emerald-400">₹{newCost.toLocaleString()}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row.action === "UPDATE" && row.changedFields && row.changedFields.length > 0 ? (
                              <div className="flex gap-1 flex-wrap max-w-[200px]">
                                {row.changedFields.map((field) => (
                                  <span key={field} className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium uppercase tracking-wider">
                                    {field}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-zinc-600 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ERRORS PREVIEW */}
          {errorCount > 0 && (
            <div>
              <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> 
                Errors ({errorCount}) - Will be skipped
              </h3>
              <div className="border border-amber-500/20 rounded-xl overflow-hidden bg-amber-500/5">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-amber-500/10 border-b border-amber-500/20 text-amber-500/70 font-medium">
                    <tr>
                      <th className="px-4 py-3 w-1/3">Row Display Name</th>
                      <th className="px-4 py-3">Error Reasons</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10 text-amber-400">
                    {rows.filter(r => r.action === "ERROR").slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-amber-500/10 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium truncate max-w-xs">{row.parsed.display_name || "<Missing Name>"}</div>
                          <div className="text-xs opacity-70 truncate max-w-xs">{row.parsed.id || "New Row"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <ul className="list-disc list-inside text-xs space-y-1">
                            {row.errors?.map((err, j) => (
                              <li key={j}>{err}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isImporting || validCount === 0}
            className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            {isImporting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            {isImporting ? "Importing..." : `Confirm & Import ${validCount} Rows`}
          </button>
        </div>

      </div>
    </div>
  );
}
