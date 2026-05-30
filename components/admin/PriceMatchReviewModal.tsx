"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  Shield,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  AlertTriangle,
  FileText,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import type { PriceMatchRequest } from "@/types";

interface PriceMatchReviewModalProps {
  leadId: string;
  leadName: string;
  request: PriceMatchRequest;
  maxDiscountPercent?: number;
  onClose: () => void;
  onReviewed: () => void;
}

type ReviewAction = "approved" | "rejected" | "counter_offer";

export function PriceMatchReviewModal({
  leadId,
  leadName,
  request,
  maxDiscountPercent,
  onClose,
  onReviewed,
}: PriceMatchReviewModalProps) {
  const [discountPercent, setDiscountPercent] = useState(
    request.approved_discount_percent?.toString() || ""
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState<ReviewAction | null>(null);

  // Determine if the uploaded file is a PDF
  const isPdf = useMemo(() => {
    const url = request.competitor_quote_url.toLowerCase();
    return url.includes(".pdf") || url.includes("application/pdf");
  }, [request.competitor_quote_url]);

  // Calculate new price based on discount
  const ourOriginalTotal = request.our_original_total || 0;
  const discountValue = parseFloat(discountPercent) || 0;
  const ourNewPrice = useMemo(() => {
    if (!ourOriginalTotal || !discountValue) return ourOriginalTotal;
    return Math.round(ourOriginalTotal * (1 - discountValue / 100));
  }, [ourOriginalTotal, discountValue]);

  // Check if discount exceeds limit
  const exceedsLimit = maxDiscountPercent !== undefined && discountValue > maxDiscountPercent;

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSubmit = async (action: ReviewAction) => {
    if (action === "approved" && exceedsLimit) return;
    if (action !== "rejected" && !discountPercent) {
      toast.error("Please enter a discount percentage");
      return;
    }

    setIsSubmitting(true);
    setActiveAction(action);

    try {
      const res = await fetch(
        `/api/leads/${leadId}/price-match/${request.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: action === "counter_offer" ? "counter_offered" : action,
            approved_discount_percent: discountValue || 0,
            review_notes: reviewNotes.trim() || undefined,
            our_new_total: ourNewPrice,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to submit review");

      const actionLabel =
        action === "approved"
          ? "approved"
          : action === "rejected"
          ? "rejected"
          : "counter-offered";

      toast.success(`Price match ${actionLabel} successfully`);
      onReviewed();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
      setActiveAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-[95vw] max-w-6xl h-[90vh] bg-white dark:bg-zinc-900 rounded-[28px] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col lg:flex-row animate-in fade-in zoom-in-95 duration-300">
        {/* ─── Close Button ──────────────────────────────────── */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors shadow-sm"
        >
          <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </button>

        {/* ─── Left Panel: Document Viewer ────────────────────── */}
        <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 flex flex-col min-h-0">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Competitor Quote Review
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  {leadName}
                </p>
              </div>
            </div>
            <a
              href={request.competitor_quote_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open
            </a>
          </div>

          <div className="flex-1 min-h-0 p-4 overflow-auto">
            {isPdf ? (
              <iframe
                src={request.competitor_quote_url}
                className="w-full h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white"
                title="Competitor quote PDF"
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={request.competitor_quote_url}
                  alt="Competitor quote"
                  fill
                  className="object-contain rounded-xl"
                />
              </div>
            )}
          </div>
        </div>

        {/* ─── Right Panel: Review Form ──────────────────────── */}
        <div className="w-full lg:w-[380px] xl:w-[420px] border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-6 flex-1">
            {/* Submission Details (Read-only) */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                Submission Details
              </h4>

              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
                {request.competitor_name && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Competitor</p>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                      {request.competitor_name}
                    </p>
                  </div>
                )}
                {request.competitor_total !== undefined && request.competitor_total !== null && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Their Quote</p>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 tabular-nums">
                      ₹{request.competitor_total.toLocaleString("en-IN")}
                    </p>
                  </div>
                )}
                {request.uploaded_by_name && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Uploaded By</p>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                      {request.uploaded_by_name}
                    </p>
                  </div>
                )}
                {request.notes && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Customer Notes</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      {request.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Discount Calculator */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                Discount Calculator
              </h4>

              <div className="space-y-3">
                {ourOriginalTotal > 0 && (
                  <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Our Original Total</p>
                    <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 tabular-nums mt-0.5">
                      ₹{ourOriginalTotal.toLocaleString("en-IN")}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 mb-1.5 block">
                    Discount %
                  </label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-full h-11 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all tabular-nums"
                  />
                </div>

                {ourOriginalTotal > 0 && discountValue > 0 && (
                  <div className="rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Our New Price</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums mt-0.5">
                      ₹{ourNewPrice.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[11px] text-blue-500/70 mt-1 font-medium">
                      Saving ₹{(ourOriginalTotal - ourNewPrice).toLocaleString("en-IN")} ({discountValue}% off)
                    </p>
                  </div>
                )}

                {/* Escalation Warning */}
                {exceedsLimit && (
                  <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                        Your approval limit is {maxDiscountPercent}%.
                      </p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                        Please escalate to Admin.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Review Notes */}
            <div>
              <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1 mb-1.5 block">
                Review Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Internal notes about this price match..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* ─── Action Buttons ────────────────────────────────── */}
          <div className="p-6 pt-0 space-y-3 shrink-0">
            <div className="h-px bg-zinc-100 dark:bg-zinc-800 mb-3" />

            {/* Approve */}
            <button
              onClick={() => handleSubmit("approved")}
              disabled={isSubmitting || exceedsLimit}
              className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting && activeAction === "approved" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Approve Price Match
            </button>

            <div className="grid grid-cols-2 gap-3">
              {/* Counter-Offer */}
              <button
                onClick={() => handleSubmit("counter_offer")}
                disabled={isSubmitting}
                className="h-11 rounded-2xl bg-amber-100 dark:bg-amber-500/10 hover:bg-amber-200 dark:hover:bg-amber-500/20 disabled:opacity-40 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] border border-amber-200 dark:border-amber-500/20"
              >
                {isSubmitting && activeAction === "counter_offer" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MessageSquare className="w-3.5 h-3.5" />
                )}
                Counter-Offer
              </button>

              {/* Reject */}
              <button
                onClick={() => handleSubmit("rejected")}
                disabled={isSubmitting}
                className="h-11 rounded-2xl bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 disabled:opacity-40 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] border border-red-200 dark:border-red-500/20"
              >
                {isSubmitting && activeAction === "rejected" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
