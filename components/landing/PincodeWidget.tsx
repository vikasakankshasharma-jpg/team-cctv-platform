"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, MapPin, ShieldAlert } from "lucide-react";
import { PhoneCaptureModal } from "@/components/shared/PhoneCaptureModal";

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
        // Redirect directly to the beautiful local city landing page!
        router.push(`/${data.citySlug}`);
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
    <div className="w-full max-w-md mx-auto lg:mx-0">
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
            className={`w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 outline-none transition-all font-bold tracking-wider text-zinc-950 dark:text-white ${
              isHero 
                ? "py-4 sm:py-5.5 text-base sm:text-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500" 
                : "py-3.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
            }`}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading || pincode.length !== 6}
          className={`flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest text-white rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 touch-manipulation shrink-0 ${
            isHero
              ? "px-8 py-4 sm:py-5.5 bg-zinc-900 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 shadow-zinc-900/10 dark:shadow-blue-500/20"
              : "px-6 py-3.5 bg-zinc-900 dark:bg-indigo-600 hover:bg-zinc-800 dark:hover:bg-indigo-500 shadow-zinc-900/10 dark:shadow-indigo-500/20"
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Check Area <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 mt-3 px-4 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold animate-in fade-in slide-in-from-top-1">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Interest capture modal triggered when area is not served */}
      {showCaptureModal && (
        <PhoneCaptureModal pincode={pincode} onClose={() => setShowCaptureModal(false)} />
      )}
    </div>
  );
}
