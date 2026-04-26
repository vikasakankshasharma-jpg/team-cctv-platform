"use client";

import { useState } from "react";
import { MessageCircle, X, Phone, Share2, CheckCircle2, Loader2 } from "lucide-react";

interface ShareDialogProps {
  leadId: string;
  quoteId: string;
  customerName: string;
  customerMobile: string;  // pre-filled own number
  lowestPrice: number;
  propertyType: string;
  whatsappTemplate: string;
  pdfUrl?: string;
  contactPhone?: string;
  onClose: () => void;
}

export function ShareDialog({
  leadId,
  quoteId,
  customerName,
  customerMobile,
  lowestPrice,
  propertyType,
  whatsappTemplate,
  pdfUrl,
  contactPhone,
  onClose,
}: ShareDialogProps) {
  const [otherNumber, setOtherNumber] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState("");

  const quoteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/quote/${leadId}`
      : `https://cctvquotation.com/quote/${leadId}`;

  const buildMessage = (recipientName?: string) => {
    let msg = whatsappTemplate
      .replace(/\{\{customer_name\}\}/g, recipientName || customerName)
      .replace(/\{\{company_name\}\}/g, "TEAM CCTV")
      .replace(/\{\{total_amount\}\}/g, `₹${lowestPrice.toLocaleString("en-IN")}`)
      .replace(/\{\{pdf_url\}\}/g, pdfUrl || quoteUrl);
    return encodeURIComponent(msg);
  };

  const shareToNumber = async (number: string, isOtherPerson: boolean) => {
    setSharing(true);
    setError("");

    try {
      // If sharing to another person, record it in CRM
      if (isOtherPerson && number) {
        await fetch(`/api/leads/${leadId}/share`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shared_to_number: number }),
        });
      }

      // Open WhatsApp deep link
      const waNumber = `91${number}`;
      const message = buildMessage(isOtherPerson ? undefined : customerName);
      window.open(`https://wa.me/${waNumber}?text=${message}`, "_blank");

      setShared(true);
    } catch (err) {
      setError("Could not record share. Opening WhatsApp anyway...");
      // Still open WhatsApp even if recording fails
      window.open(`https://wa.me/91${number}?text=${buildMessage()}`, "_blank");
    } finally {
      setSharing(false);
    }
  };

  const handleShareToOther = () => {
    if (!/^[6-9]\d{9}$/.test(otherNumber)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    shareToNumber(otherNumber, true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] w-full max-w-md shadow-[0_40px_100px_rgba(0,0,0,0.25)] border border-zinc-100 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="bg-emerald-500 px-8 pt-8 pb-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2.5 rounded-2xl">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest">Share Quote</p>
              <p className="text-white font-black text-lg tracking-tight">Send on WhatsApp</p>
            </div>
          </div>
          <p className="text-emerald-100 text-sm font-medium">
            Share your security quote instantly. Anyone you share with will be notified by our team.
          </p>
        </div>

        <div className="p-8 space-y-6">

          {shared ? (
            <div className="text-center py-4 space-y-3 animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="font-black text-zinc-900 text-lg tracking-tight">Quote Shared!</p>
              <p className="text-zinc-400 text-sm">We've noted the recipient in your quote record.</p>
              <button
                onClick={onClose}
                className="w-full h-12 bg-zinc-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl mt-4"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 text-red-600 text-xs font-bold px-4 py-3 rounded-2xl border border-red-100">
                  {error}
                </div>
              )}

              {/* Option 1: Own Number */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Send to your number</p>
                <button
                  onClick={() => shareToNumber(customerMobile, false)}
                  disabled={sharing}
                  className="w-full flex items-center justify-between px-5 py-4 bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <div className="text-left">
                      <p className="font-black text-zinc-900 text-sm">+91 {customerMobile}</p>
                      <p className="text-[10px] text-zinc-400 font-medium">Your registered number</p>
                    </div>
                  </div>
                  <MessageCircle className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-zinc-100" />
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Or share with</span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>

              {/* Option 2: Another Number */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Send to another number</p>
                <p className="text-xs text-zinc-400">
                  Sharing with a family member or decision-maker? Their number will be recorded in our system for follow-up.
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400 border-r border-zinc-200 pr-3">+91</span>
                  <input
                    type="tel"
                    value={otherNumber}
                    onChange={(e) => { setOtherNumber(e.target.value); setError(""); }}
                    placeholder="98765 43210"
                    maxLength={10}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-16 pr-4 py-4 font-bold text-zinc-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all"
                  />
                </div>
                <button
                  onClick={handleShareToOther}
                  disabled={sharing || !otherNumber}
                  className="w-full h-14 bg-zinc-900 hover:bg-emerald-600 disabled:opacity-40 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  {sharing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Share on WhatsApp
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
