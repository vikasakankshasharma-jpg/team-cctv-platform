"use client";

import { useState, useEffect } from "react";
import { 
  Printer, 
  QrCode, 
  Plus, 
  Layers, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Copy, 
  Eye, 
  ExternalLink 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { 
  generatePreprintedBatch, 
  getPreprintedBatches, 
  getTokensForBatch 
} from "@/app/actions/promoters";
import type { PreprintedBatch, PreprintedToken } from "@/types";
import { toast } from "sonner";

interface PreprintedBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchCreated?: () => void;
}

export function PreprintedBatchModal({ isOpen, onClose, onBatchCreated }: PreprintedBatchModalProps) {
  const [activeTab, setActiveTab] = useState<"batches" | "generate" | "print">("batches");
  const [batches, setBatches] = useState<(PreprintedBatch & { available_cards: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<PreprintedBatch | null>(null);
  const [batchTokens, setBatchTokens] = useState<PreprintedToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  // Form for generating new batch
  const [formData, setFormData] = useState({
    prefix: "TEAM-",
    startNumber: 1001,
    count: 50,
    batchName: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBatches();
    }
  }, [isOpen]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await getPreprintedBatches();
      setBatches(data);
      // Auto compute next starting number
      if (data.length > 0) {
        let maxEnd = 1000;
        data.forEach(b => {
          if (b.end_number && b.end_number > maxEnd) maxEnd = b.end_number;
        });
        setFormData(prev => ({ ...prev, startNumber: maxEnd + 1 }));
      }
    } catch (err) {
      console.error("Failed to load batches:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const res = await generatePreprintedBatch({
        prefix: formData.prefix,
        startNumber: Number(formData.startNumber),
        count: Number(formData.count),
        batchName: formData.batchName,
      });

      toast.success(`Generated batch with ${res.totalCards} QR cards (${res.startCode} to ${res.endCode})!`);
      await loadBatches();
      onBatchCreated?.();
      
      // Auto switch to print view for this new batch
      const tokens = await getTokensForBatch(res.batchId);
      setBatchTokens(tokens);
      setSelectedBatch({
        id: res.batchId,
        batch_name: formData.batchName || `Bulk QR Batch (${res.startCode} - ${res.endCode})`,
        prefix: formData.prefix,
        start_number: Number(formData.startNumber),
        end_number: Number(formData.startNumber) + Number(formData.count) - 1,
        total_cards: Number(formData.count),
        assigned_cards: 0,
        created_at: new Date().toISOString(),
      });
      setActiveTab("print");
    } catch (err: any) {
      console.error("Failed to generate batch:", err);
      toast.error(err.message || "Failed to generate batch");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenPrintView = async (batch: PreprintedBatch) => {
    setSelectedBatch(batch);
    setLoadingTokens(true);
    setActiveTab("print");
    try {
      const tokens = await getTokensForBatch(batch.id);
      setBatchTokens(tokens);
    } catch (err) {
      console.error("Failed to load batch tokens:", err);
      toast.error("Failed to load batch tokens");
    } finally {
      setLoadingTokens(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getQRUrl = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://cctvquotation.com";
    return `${origin}/wa/${code}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-white">
                Pre-Printed QR Batches & Bulk Printing
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                Print referral cards in bulk before assigning. Hand them directly to partners on onboarding.
              </DialogDescription>
            </div>
          </div>

          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab("batches")}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "batches" ? "bg-amber-500 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"}`}
            >
              Batches ({batches.length})
            </button>
            <button
              onClick={() => setActiveTab("generate")}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "generate" ? "bg-amber-500 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"}`}
            >
              + Create Batch
            </button>
            {selectedBatch && (
              <button
                onClick={() => setActiveTab("print")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === "print" ? "bg-amber-500 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"}`}
              >
                <Printer className="w-3.5 h-3.5" />
                Print Grid
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">

          {/* TAB 1: BATCHES LIST */}
          {activeTab === "batches" && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <p className="text-xs uppercase tracking-widest font-bold">Loading Batches...</p>
                </div>
              ) : batches.length === 0 ? (
                <div className="text-center py-16 bg-zinc-950/60 rounded-2xl border border-zinc-800 p-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                    <Layers className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">No Pre-Printed Batches Yet</h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                      Generate your first bulk batch (e.g. 50 cards from TEAM-1001 to TEAM-1050) so you can print them in advance and keep them in inventory.
                    </p>
                  </div>
                  <Button
                    onClick={() => setActiveTab("generate")}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Generate First Batch
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {batches.map((batch) => (
                    <div
                      key={batch.id}
                      className="p-5 bg-zinc-950/60 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-black text-white text-base tracking-tight group-hover:text-amber-400 transition-colors">
                            {batch.batch_name}
                          </h4>
                          <span className="text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg text-amber-400">
                            {batch.prefix}{batch.start_number} - {batch.prefix}{batch.end_number}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Created {new Date(batch.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/80 text-center">
                        <div>
                          <p className="text-base font-black text-white">{batch.total_cards}</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Total</p>
                        </div>
                        <div>
                          <p className="text-base font-black text-amber-400">{batch.assigned_cards}</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Assigned</p>
                        </div>
                        <div>
                          <p className="text-base font-black text-emerald-400">{batch.available_cards}</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">In Stock</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          onClick={() => handleOpenPrintView(batch)}
                          className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print QR Cards Sheet
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GENERATE BATCH */}
          {activeTab === "generate" && (
            <form onSubmit={handleCreateBatch} className="max-w-xl mx-auto space-y-6 py-4">
              <div className="p-5 bg-zinc-950/70 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Batch Configuration</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Batch Title / Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.batchName}
                    onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-amber-500 transition-all"
                    placeholder="e.g. October 2026 Rajasthan Installer Batch"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Code Prefix
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.prefix}
                      onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono font-black text-sm focus:outline-none focus:border-amber-500 transition-all text-center"
                      placeholder="TEAM-"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Starting Number
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.startNumber}
                      onChange={(e) => setFormData({ ...formData, startNumber: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono font-black text-sm focus:outline-none focus:border-amber-500 transition-all text-center"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Card Quantity
                    </label>
                    <input
                      required
                      type="number"
                      min="5"
                      max="500"
                      value={formData.count}
                      onChange={(e) => setFormData({ ...formData, count: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono font-black text-sm focus:outline-none focus:border-amber-500 transition-all text-center"
                    />
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800/80 text-center space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Batch Preview</p>
                  <p className="text-sm font-mono font-bold text-amber-400">
                    {formData.prefix}{formData.startNumber} &nbsp;➔&nbsp; {formData.prefix}{Number(formData.startNumber) + Number(formData.count) - 1}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Total {formData.count} unique sequential referral tokens will be generated.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("batches")}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider px-6"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                  Generate & View Print Sheet
                </Button>
              </div>
            </form>
          )}

          {/* TAB 3: PRINT GRID VIEW */}
          {activeTab === "print" && selectedBatch && (
            <div className="space-y-6">
              
              {/* Print Toolbar */}
              <div className="flex items-center justify-between bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 print:hidden">
                <div>
                  <h4 className="font-black text-white text-sm">{selectedBatch.batch_name}</h4>
                  <p className="text-xs text-zinc-400 font-mono">
                    {batchTokens.length} Cards ({selectedBatch.prefix}{selectedBatch.start_number} - {selectedBatch.prefix}{selectedBatch.end_number})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handlePrint}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Printer className="w-4 h-4" />
                    Print All Cards (A4 / Sticker Sheet)
                  </Button>
                </div>
              </div>

              {loadingTokens ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <p className="text-xs uppercase tracking-widest font-bold">Rendering QR Codes...</p>
                </div>
              ) : (
                /* Print Grid (Styled with @media print friendly rules) */
                <div id="print-sheet-area" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
                  {batchTokens.map((token) => (
                    <div
                      key={token.id}
                      className="bg-white text-zinc-900 border-2 border-dashed border-zinc-300 rounded-2xl p-4 flex flex-col items-center text-center justify-between shadow-sm relative overflow-hidden print:border-zinc-400 print:shadow-none print:break-inside-avoid print:p-3"
                    >
                      {/* Top Header */}
                      <div className="w-full border-b border-zinc-200 pb-2 mb-2">
                        <p className="text-[10px] font-black tracking-widest text-blue-900 uppercase">
                          TEAM CCTV QUOTATION
                        </p>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">
                          VIP Partner Referral Pass
                        </p>
                      </div>

                      {/* QR Code */}
                      <div className="p-2 bg-white rounded-xl shadow-inner my-1">
                        <QRCodeSVG
                          value={getQRUrl(token.code)}
                          size={110}
                          level="H"
                          includeMargin={false}
                        />
                      </div>

                      {/* Sequential Code Label */}
                      <div className="my-1.5">
                        <span className="font-mono font-black text-sm tracking-[0.2em] bg-zinc-100 px-3 py-1 rounded-lg border border-zinc-300 text-zinc-900 inline-block">
                          {token.code}
                        </span>
                      </div>

                      {/* Bottom Instructions */}
                      <div className="w-full pt-1.5 border-t border-zinc-100 text-[8px] text-zinc-600 leading-tight">
                        <p className="font-bold text-emerald-700">Scan for Instant WhatsApp Quotation & Discount</p>
                        <p className="text-zinc-400 font-mono mt-0.5">cctvquotation.com | +91 73576 12865</p>
                      </div>

                      {/* Status indicator in preview (hidden on print) */}
                      {token.status === "assigned" && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full print:hidden">
                          Assigned
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-end shrink-0 bg-zinc-900 print:hidden">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs font-bold"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
