"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Search, AlertCircle, Loader2 } from "lucide-react";
import { TranslatedText } from "@/components/shared/TranslatedText";
import { useTranslation } from "@/hooks/useTranslation";
import { extractErrorMessage } from "@/lib/utils";

interface TrackBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrackBookingModal({ isOpen, onClose }: TrackBookingModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [referenceId, setReferenceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/customer/track-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceId }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.leadId) {
        onClose();
        router.push(`/track/${data.leadId}`);
      } else {
        setError(extractErrorMessage(data, t("tb_err_not_found", "Failed to find booking. Please check your details.")));
      }
    } catch (err) {
      setError(extractErrorMessage(err, t("tb_err_net", "Network error. Please try again.")));
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto touch-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="track-booking-title"
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative my-auto max-h-[90vh] max-h-[90dvh] flex flex-col border border-zinc-200/80 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button (with accessible 44px tap target) */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors cursor-pointer z-10"
          aria-label={t("common_close", "Close")}
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6 sm:p-8 overflow-y-auto">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-5 shrink-0">
            <Search className="w-6 h-6" />
          </div>
          
          <h2 id="track-booking-title" className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">
            <TranslatedText tKey="track_booking" defaultText="Track Booking" />
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mb-6 leading-relaxed">
            <TranslatedText tKey="track_booking_desc" defaultText="Enter your 10-digit Mobile Number or Quote ID to track your order and download invoices." />
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                <TranslatedText tKey="quote_id_ref" defaultText="Mobile Number or Quote ID" />
              </label>
              <input
                type="text"
                required
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder={t("tb_placeholder", "e.g. 9876543210 or QT-2026-...")}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-base dark:text-white"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-xs sm:text-sm font-medium flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Action Bar with both Cancel and Submit for accessible mobile & laptop UX */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 min-h-[44px] py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs sm:text-sm transition-colors text-center cursor-pointer"
              >
                <TranslatedText tKey="common_cancel" defaultText="Cancel" />
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shadow-md shadow-blue-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <TranslatedText tKey="searching" defaultText="Searching..." />
                  </>
                ) : (
                  <TranslatedText tKey="track_status" defaultText="Track Status" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
