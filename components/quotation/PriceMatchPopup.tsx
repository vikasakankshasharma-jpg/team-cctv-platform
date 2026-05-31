"use client";

import { useState, useEffect, useRef } from "react";
import { Shield, X, ChevronRight, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";

const CompetitorQuoteUploader = dynamic(
  () => import("@/components/shared/CompetitorQuoteUploader").then(mod => mod.CompetitorQuoteUploader),
  { ssr: false }
);

interface PriceMatchPopupProps {
  leadId: string;
  customerName?: string;
  /** Delay in ms before showing the popup (default: 45000 = 45 seconds) */
  delayMs?: number;
  /** Called when user has already submitted a price match from the inline section */
  alreadySubmitted?: boolean;
  onSubmitted: () => void;
}

export function PriceMatchPopup({
  leadId,
  customerName,
  delayMs = 45000,
  alreadySubmitted = false,
  onSubmitted,
}: PriceMatchPopupProps) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Smart delayed trigger
  useEffect(() => {
    // Don't show if already submitted from inline section or previously dismissed
    if (alreadySubmitted || dismissed) return;

    // Check sessionStorage to avoid re-showing if dismissed in this session
    const dismissedKey = `pm_popup_dismissed_${leadId}`;
    const submittedKey = `pm_popup_submitted_${leadId}`;
    if (
      typeof window !== "undefined" &&
      (sessionStorage.getItem(dismissedKey) || sessionStorage.getItem(submittedKey))
    ) {
      return;
    }

    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [delayMs, leadId, alreadySubmitted, dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`pm_popup_dismissed_${leadId}`, "1");
    }
  };

  const handleSubmit = async (data: {
    competitor_quote_url: string;
    competitor_name?: string;
    competitor_total?: number;
    notes?: string;
    uploaded_by_name: string;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/price-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit price match");

      setSubmitted(true);
      setExpanded(false);
      onSubmitted();

      if (typeof window !== "undefined") {
        sessionStorage.setItem(`pm_popup_submitted_${leadId}`, "1");
      }

      // Auto-dismiss after showing success
      setTimeout(() => {
        setVisible(false);
      }, 5000);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (alreadySubmitted || dismissed || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop for expanded mode */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
              onClick={() => setExpanded(false)}
            />
          )}

          {/* Centered Wrapper */}
          <div className="fixed inset-0 z-[95] flex items-center justify-center pointer-events-none p-4 sm:p-6">
            {/* Popup Container */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`pointer-events-auto w-full ${
                expanded
                  ? "sm:w-[480px]"
                  : "sm:w-[420px]"
              }`}
            >
              <div
                className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden transition-all duration-500 ${
                  expanded ? "rounded-[24px] flex flex-col max-h-[90vh] sm:max-h-[85vh]" : "rounded-[20px]"
                }`}
              >
              {/* ─── Success State ─── */}
              {submitted ? (
                <div className="p-6 sm:p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </motion.div>
                  <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
                    Quote Received!
                  </h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Our team will review it and get back within 24 hours with a guaranteed best price.
                  </p>
                </div>
              ) : expanded ? (
                /* ─── Expanded: Upload Form ─── */
                <div className="flex flex-col max-h-full sm:max-h-[85vh]">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                        <Shield className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                          Price Match Guarantee
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Upload a competitor quote — we&apos;ll beat it
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpanded(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable Form Area */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                    <CompetitorQuoteUploader
                      leadId={leadId}
                      customerName={customerName}
                      onSubmit={handleSubmit}
                      onCancel={() => setExpanded(false)}
                    />
                  </div>
                </div>
              ) : (
                /* ─── Collapsed: Teaser Card ─── */
                <div className="relative p-4 sm:p-5">
                  {/* Dismiss button */}
                  <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all z-10"
                    aria-label="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-start gap-4">
                    {/* Animated icon */}
                    <motion.div
                      animate={{ rotate: [0, -8, 8, -4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
                      className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0"
                    >
                      <Shield className="w-6 h-6 text-white" />
                    </motion.div>

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                          Got a better quote?
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                          <Sparkles className="w-3 h-3" />
                          Guarantee
                        </span>
                      </div>
                      <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-snug mb-3">
                        Upload a competitor&apos;s quotation and we&apos;ll match or beat their price. Guaranteed.
                      </p>

                      <button
                        onClick={() => setExpanded(true)}
                        className="group inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full text-[13px] font-semibold hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all active:scale-95 shadow-sm"
                      >
                        Upload Quote
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
