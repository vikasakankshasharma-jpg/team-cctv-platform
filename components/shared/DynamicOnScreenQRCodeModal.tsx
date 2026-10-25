"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { 
  X, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  RefreshCw, 
  Smartphone, 
  Copy, 
  Check, 
  IndianRupee 
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  leadId?: string;
  amount: number;
  paymentType: "delivery_90" | "installation_final" | "change_order" | "booking" | "full" | "full_discount";
  title?: string;
  description?: string;
  onSuccess: (paymentId?: string) => void;
}

// Synthesize a clean, pleasant payment confirmation chime via Web Audio API (zero file download needed)
function playPaymentChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First high note (C6 ~ 1046.5Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1046.5, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.25);

    // Second celebratory note (E6 ~ 1318.5Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.warn("Audio chime not supported or muted:", e);
  }
}

export function DynamicOnScreenQRCodeModal({
  isOpen,
  onClose,
  quoteId,
  leadId,
  amount,
  paymentType,
  title,
  description,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [qrString, setQrString] = useState<string>("");
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const displayTitle = title || (
    paymentType === "delivery_90" ? "Material Delivery Handover (90%)" :
    paymentType === "installation_final" ? "Final Installation Handover (10%)" :
    paymentType === "change_order" ? "Site Requirement / Extra Materials" :
    "Instant UPI Payment"
  );

  const upiId = "teamcctv@okhdfc";
  const defaultNote = `TEAM CCTV ${displayTitle} (${quoteId.slice(0, 6)})`;

  // 1. Fetch Dynamic QR from server or generate standard UPI URI
  useEffect(() => {
    if (!isOpen) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      setPaymentVerified(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const initQR = async () => {
      try {
        const res = await fetch("/api/payment/razorpay-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteId,
            leadId,
            amount,
            paymentType,
            description: defaultNote
          })
        });

        const data = await res.json();
        if (isMounted) {
          if (data.success && data.qr_string) {
            setQrString(data.qr_string);
          } else {
            // Standard UPI Deep-Link URI format supported by all Indian UPI apps
            const fallbackUPI = `upi://pay?pa=${upiId}&pn=TEAM%20CCTV%20SOLUTIONS&am=${amount}&cu=INR&tn=${encodeURIComponent(defaultNote)}`;
            setQrString(fallbackUPI);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const fallbackUPI = `upi://pay?pa=${upiId}&pn=TEAM%20CCTV%20SOLUTIONS&am=${amount}&cu=INR&tn=${encodeURIComponent(defaultNote)}`;
          setQrString(fallbackUPI);
          setLoading(false);
        }
      }
    };

    initQR();

    // 2. Poll for payment verification every 2.5 seconds
    pollTimerRef.current = setInterval(async () => {
      try {
        const checkRes = await fetch(`/api/invoice/${quoteId}/status?t=${Date.now()}`);
        if (checkRes.ok) {
          const status = await checkRes.json();
          // Check if payment stage was registered or fully paid
          if (
            status.ready && (
              status.status === "PAID" || 
              status.payment_status === "paid" || 
              (paymentType === "delivery_90" && (status.amount_paid >= amount || status.payment_status === "delivery_paid")) ||
              (paymentType === "installation_final" && status.status === "COMPLETED")
            )
          ) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setPaymentVerified(true);
            playPaymentChime();
            toast.success(`Payment of ₹${amount.toLocaleString('en-IN')} received!`);
            setTimeout(() => {
              onSuccess(status.payment_id);
              onClose();
            }, 2500);
          }
        }
      } catch (e) {
        // Silent poll error catch
      }
    }, 2500);

    return () => {
      isMounted = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, quoteId, amount, paymentType]);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUPI(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  const handleSimulatePaymentForDemo = async () => {
    // Allows testing verification directly
    const toastId = toast.loading("Verifying payment...");
    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          paymentId: `pay_qr_${Date.now()}`
        })
      });
      toast.dismiss(toastId);
      if (res.ok) {
        setPaymentVerified(true);
        playPaymentChime();
        toast.success(`Payment of ₹${amount.toLocaleString('en-IN')} confirmed!`);
        setTimeout(() => {
          onSuccess(`pay_qr_${Date.now()}`);
          onClose();
        }, 2200);
      }
    } catch {
      toast.dismiss(toastId);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 10 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white leading-tight">
                  Instant UPI QR
                </h3>
                <p className="text-[10px] text-zinc-500 font-medium">Scan to Pay • Verified Merchant</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={paymentVerified}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main Card Content */}
          <div className="p-6 flex flex-col items-center text-center">
            {paymentVerified ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-10 flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h4 className="text-xl font-black text-zinc-900 dark:text-white mb-1">
                  Payment Verified!
                </h4>
                <p className="text-2xl font-black text-emerald-600 mb-2">
                  ₹{amount.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-zinc-500 max-w-[240px]">
                  Official Tax Receipt & Warranty update sent to customer's WhatsApp instantly.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Amount Pill */}
                <div className="mb-4 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700 px-4 py-2 rounded-2xl w-full">
                  <p className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">
                    {displayTitle}
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white flex items-center justify-center gap-0.5">
                    <span className="text-lg text-zinc-400">₹</span>
                    {amount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Zero extra fees • Flat amount</p>
                </div>

                {/* QR Code Container */}
                <div className="relative p-3.5 bg-white rounded-2xl border-2 border-emerald-500 shadow-md">
                  {loading ? (
                    <div className="w-[190px] h-[190px] flex flex-col items-center justify-center gap-2 text-zinc-400">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                      <span className="text-xs font-semibold">Generating QR...</span>
                    </div>
                  ) : (
                    <QRCodeSVG
                      value={qrString}
                      size={190}
                      level="H"
                      includeMargin={false}
                    />
                  )}
                  {/* Subtle pulsing live indicator */}
                  <div className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE
                  </div>
                </div>

                {/* Accepted Apps Logos / Badges */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-1">Accepts:</span>
                  <span className="text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">GPay</span>
                  <span className="text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md">PhonePe</span>
                  <span className="text-[10px] font-black bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded-md">Paytm</span>
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">BHIM</span>
                </div>

                {/* Merchant Name & Verified Status */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 w-full flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>TEAM CCTV SOLUTIONS</span>
                  </div>
                  <button
                    onClick={handleCopyUPI}
                    title="Copy UPI ID"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    {copiedUPI ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUPI ? "Copied" : "UPI ID"}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer Assistance */}
          {!paymentVerified && (
            <div className="bg-zinc-50 dark:bg-zinc-800/40 px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                Listening for payment...
              </span>
              <button
                onClick={handleSimulatePaymentForDemo}
                className="text-zinc-400 hover:text-zinc-600 underline font-medium text-[10px]"
              >
                Mark Done (Demo)
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
