"use client";

import { useState } from "react";
import { MapPin, Bell, Loader2, CheckCircle2 } from "lucide-react";

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
    <div className="mb-8 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in duration-500 w-full text-left">
      <div className="flex items-center gap-3">
        <MapPin className="w-5 h-5 shrink-0 hidden sm:block" />
        <p className="text-sm font-semibold">
          We are expanding to <span className="font-black uppercase">{unservedCityName}</span> soon! <br className="sm:hidden" />
          <span className="opacity-80 font-medium">Below is a reference quote based on nearest city pricing.</span>
        </p>
      </div>
      <button
        onClick={handleNotify}
        disabled={loading || confirmed}
        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800/50 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors shrink-0 w-full sm:w-auto shadow-sm active:scale-95"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmed ? <><CheckCircle2 className="w-4 h-4" /> Notified</> : <><Bell className="w-4 h-4" /> Notify Me</>}
      </button>
    </div>
  );
}
