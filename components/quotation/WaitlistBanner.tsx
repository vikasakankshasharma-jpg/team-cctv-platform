"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Rocket, ArrowRight } from "lucide-react";

export function WaitlistBanner({ leadId, unservedCityName }: { leadId: string; unservedCityName: string }) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleNotify = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/leads/${leadId}/waitlist-confirm`, { method: "POST" });
      if (res.ok) setConfirmed(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-900 dark:text-blue-100 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in duration-500 w-full text-left shadow-lg">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-600 rounded-2xl shrink-0 text-white shadow-md">
          <Rocket className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight mb-1">Your Quote is Ready!</h3>
          <p className="text-sm font-medium opacity-90 leading-relaxed max-w-2xl">
            Our primary installation hubs are currently active in Jaipur and surrounding regions. However, based on your direct request, we are taking this on priority and expediting our operations in <span className="font-black uppercase">{unservedCityName}</span> specifically for you.
          </p>
          {confirmed && (
            <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1">
              <CheckCircle2 className="w-4 h-4" /> Priority Request Registered. Our team will contact you shortly.
            </p>
          )}
        </div>
      </div>
      {!confirmed && (
        <button
          onClick={handleNotify}
          disabled={loading}
          className="flex flex-col items-center justify-center gap-1 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 w-full sm:w-auto shadow-xl shadow-blue-500/20 hover:-translate-y-1 active:translate-y-0"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">Confirm Priority <ArrowRight className="w-4 h-4" /></span>
          )}
        </button>
      )}
    </div>
  );
}
