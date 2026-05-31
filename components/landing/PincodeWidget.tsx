"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, MapPin, ShieldAlert } from "lucide-react";
import { PhoneCaptureModal } from "@/components/shared/PhoneCaptureModal";
import { motion, AnimatePresence } from "framer-motion";

export function PincodeWidget({ variant = "hero" }: { variant?: "hero" | "footer" }) {
  const router = useRouter();
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode>("");
  const [showCaptureModal, setShowCaptureModal] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(pincode)) {
      return setError("Please enter a valid 6-digit pincode.");
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/pincode/${pincode}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Pincode check failed.");
      }

      if (data.citySlug) {
        // Log impression silently
        fetch("/api/impressions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: data.citySlug,
            pincode: pincode,
            source: "homepage_widget"
          })
        }).catch(console.error);

        // Redirect directly to the beautiful local city landing page with pincode context!
        router.push(`/${data.citySlug}?pincode=${pincode}`);
      } else {
        // City not found — show friendly inline WhatsApp waitlist option
        setError(
          <span className="flex items-center gap-1.5 flex-wrap">
            <span>We don't serve your area yet.</span>
            <a
              href={`https://wa.me/919772699395?text=Hi,%20I'm%20interested%20in%20CCTV%20installation%20for%20pincode%20${pincode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 font-bold underline hover:text-blue-500"
            >
              WhatsApp us
            </a>
            <span>to check expansion options!</span>
          </span>
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to check service availability.");
    } finally {
      setLoading(false);
    }
  };

  const isHero = variant === "hero";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md mx-auto lg:mx-0 relative z-10"
    >
      <form onSubmit={handleCheck} className="relative flex flex-col sm:flex-row gap-3 items-stretch w-full">
        <div className="relative flex-1">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter Pincode (e.g., 302017)"
            className={`w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl pl-12 pr-4 outline-none transition-all font-bold tracking-wider text-zinc-950 dark:text-white ${
              isHero 
                ? "py-4 sm:py-5.5 text-base sm:text-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900" 
                : "py-3.5 text-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900"
            }`}
            required
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || pincode.length !== 6}
          className={`flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest text-white rounded-2xl transition-all shadow-xl disabled:opacity-50 touch-manipulation shrink-0 ${
            isHero
              ? "px-8 py-4 sm:py-5.5 bg-zinc-900 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 shadow-zinc-900/10 dark:shadow-blue-500/20 hover:shadow-blue-500/30"
              : "px-6 py-3.5 bg-zinc-900 dark:bg-indigo-600 hover:bg-zinc-800 dark:hover:bg-indigo-500 shadow-zinc-900/10 dark:shadow-indigo-500/20 hover:shadow-indigo-500/30"
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Check Area <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="flex items-center gap-2 px-4 py-2 bg-red-50/80 dark:bg-red-950/40 backdrop-blur-sm border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold overflow-hidden"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interest capture modal triggered when area is not served */}
      {showCaptureModal && (
        <PhoneCaptureModal pincode={pincode} onClose={() => setShowCaptureModal(false)} />
      )}
    </motion.div>
  );
}
