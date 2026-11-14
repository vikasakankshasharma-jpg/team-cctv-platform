"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, MapPin, PhoneCall, BellRing, Navigation, Info, ArrowRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface WaitlistBannerProps {
  leadId: string;
  unservedCityName: string;
  nearestHubName?: string;
  distanceKm?: number;
  initialConfirmed?: boolean;
  initialRequestType?: string;
}

export function WaitlistBanner({
  leadId,
  unservedCityName,
  nearestHubName,
  distanceKm,
  initialConfirmed = false,
  initialRequestType,
}: WaitlistBannerProps) {
  const [loadingType, setLoadingType] = useState<"outstation" | "waitlist" | null>(null);
  const [confirmed, setConfirmed] = useState(initialConfirmed);
  const [confirmedType, setConfirmedType] = useState<"outstation" | "waitlist">(
    initialRequestType === "outstation_visit" ? "outstation" : "waitlist"
  );
  const { t } = useTranslation();

  const isNearby = distanceKm !== undefined && distanceKm > 40 && distanceKm <= 100;
  const displayHub = nearestHubName || t("hub_default_jaipur", "Jaipur");

  const handleNotify = async (type: "outstation" | "waitlist") => {
    setLoadingType(type);
    try {
      const res = await fetch(`/api/v1/leads/${leadId}/waitlist-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType: type }),
      });
      if (res.ok) {
        setConfirmed(true);
        setConfirmedType(type);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div
      className={`mb-6 p-5 sm:p-6 rounded-3xl border transition-all duration-500 w-full text-left shadow-lg animate-in fade-in zoom-in duration-500 ${
        isNearby
          ? "bg-amber-50/90 dark:bg-amber-950/20 border-amber-200/90 dark:border-amber-800/50 text-amber-950 dark:text-amber-100"
          : "bg-blue-50/90 dark:bg-blue-950/20 border-blue-200/90 dark:border-blue-800/50 text-blue-950 dark:text-blue-100"
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl shrink-0 text-white shadow-md ${
              isNearby
                ? "bg-gradient-to-br from-amber-500 to-amber-600"
                : "bg-gradient-to-br from-blue-600 to-indigo-600"
            }`}
          >
            {isNearby ? <Navigation className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isNearby
                    ? "bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200"
                    : "bg-blue-200/80 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200"
                }`}
              >
                {isNearby && distanceKm !== undefined
                  ? `${distanceKm} km ${t("waitlist_approx_km", "(approx.)")}`
                  : t("waitlist_expanding", "Expansion Zone")}
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {isNearby
                  ? t("waitlist_nearby_title", "Nearby Area • Reference Quotation")
                  : t("waitlist_unserved_title", "Service Launching Soon • Reference Quotation")}
              </h3>
            </div>

            <p className="text-xs sm:text-sm font-medium opacity-90 leading-relaxed max-w-2xl">
              {isNearby
                ? t(
                    "waitlist_nearby_desc",
                    "Direct on-site installation is not yet active in {city}, but your location is approx. {km} km from our {hub} hub. The quotation below is a transparent reference based on {hub} standard rates. You can request a special outstation visit or get notified when our regular service launches.",
                    { city: unservedCityName, hub: displayHub, km: String(distanceKm) }
                  )
                : t(
                    "waitlist_unserved_desc",
                    "Direct on-site installation is not yet active in {city}, but we are expanding rapidly. The quotation below is prepared based on our nearest operational hub ({hub}) as a transparent reference benchmark so you know genuine hardware & fair installation rates.",
                    { city: unservedCityName, hub: displayHub }
                  )}
            </p>

            {confirmed && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in slide-in-from-bottom-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {confirmedType === "outstation"
                    ? t(
                        "waitlist_confirmed_outstation",
                        "✓ Outstation Request Saved! Our team will contact you regarding travel feasibility and scheduling."
                      )
                    : t(
                        "waitlist_confirmed_waitlist",
                        "✓ Request Saved! We will notify you on WhatsApp as soon as regular service launches in {city}.",
                        { city: unservedCityName }
                      )}
                </span>
              </div>
            )}
          </div>
        </div>

        {!confirmed && (
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
            {isNearby && (
              <button
                onClick={() => handleNotify("outstation")}
                disabled={loadingType !== null}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md shadow-amber-600/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                {loadingType === "outstation" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{t("waitlist_btn_outstation", "Request Outstation Visit")}</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => handleNotify("waitlist")}
              disabled={loadingType !== null}
              className={`flex items-center justify-center gap-2 px-4 py-3 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 ${
                isNearby
                  ? "bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 shadow-slate-800/20"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
              }`}
            >
              {loadingType === "waitlist" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <BellRing className="w-3.5 h-3.5" />
                  <span>{t("waitlist_btn_notify", "Get WhatsApp Launch Alert")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3.5 pt-3 border-t border-black/5 dark:border-white/10 flex items-center gap-2 text-[11px] font-medium opacity-80">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>{t("waitlist_reference_tip", "Explore and customize the camera packages below for your price reference.")}</span>
      </div>
    </div>
  );
}
