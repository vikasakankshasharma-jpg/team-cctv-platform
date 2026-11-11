"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Navigation, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ChevronUp, 
  ChevronDown, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  ExternalLink,
  ListOrdered,
  Sparkles,
  Locate,
  PackageCheck,
  CheckCircle,
  Truck,
  IndianRupee,
  ShieldCheck,
  X
} from "lucide-react";
import { GoogleMap, MarkerF, PolylineF, InfoWindowF, useJsApiLoader } from "@react-google-maps/api";
import { toast } from "sonner";
import { 
  optimizeRouteWithTimeWindows, 
  buildGoogleMapsMultiStopUrl, 
  LatLng 
} from "@/lib/routing/optimizer";
import { useTranslation } from "@/hooks/useTranslation";

interface DeliveryStop {
  id: string;
  quote_id: string;
  customer_name?: string;
  mobile_number?: string;
  items_summary?: string;
  total_payable: number;
  amount_paid: number;
  balance_due: number;
  payment_preference: string;
  delivery_status: string;
  delivery_token?: string;
  scheduled_date?: string;
  time_slot?: "morning" | "afternoon" | "evening" | string;
  route_order?: number;
  address?: {
    street?: string;
    city?: string;
    pincode?: string;
  };
  coordinates?: LatLng | null;
  map_url?: string | null;
}

const TIME_SLOT_LABELS: Record<string, { labelKey: string; label: string; time: string; color: string; icon: string }> = {
  morning: { labelKey: "del_slot_morning", label: "Morning Slot", time: "09:30 AM – 01:00 PM", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: "🌅" },
  afternoon: { labelKey: "del_slot_afternoon", label: "Afternoon Slot", time: "01:30 PM – 05:00 PM", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: "☀️" },
  evening: { labelKey: "del_slot_evening", label: "Evening Slot", time: "05:30 PM – 08:00 PM", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: "🌆" },
};

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "1rem",
};

export function DeliveryRoutePlannerClient() {
  const { t } = useTranslation();
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [scheduledStops, setScheduledStops] = useState<DeliveryStop[]>([]);
  const [pendingPool, setPendingPool] = useState<DeliveryStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "map">("timeline");
  const [selectedMarker, setSelectedMarker] = useState<DeliveryStop | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [technicianLocation, setTechnicianLocation] = useState<LatLng | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);

  // OTP Verification Modal State
  const [verifyingStop, setVerifyingStop] = useState<DeliveryStop | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [submittingOtp, setSubmittingOtp] = useState(false);

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });



  const fetchRoute = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/delivery/route?date=${date}`);
      const data = await res.json();
      
      if (data.success) {
        setScheduledStops(data.scheduledStops || []);
        setPendingPool(data.pendingPool || []);
      } else {
        toast.error(data.error || t("del_route_load_err", "Failed to load route"));
      }

    } catch {
      toast.error(t("del_route_conn_err", "Failed to connect to delivery service"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRoute(selectedDate);
  }, [selectedDate, fetchRoute]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error(t("del_geo_unsupported", "Geolocation not supported by browser"));
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTechnicianLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocatingUser(false);
        toast.success(t("del_loc_captured", "Current location captured!"));
      },
      (err) => {
        setLocatingUser(false);
        toast.error(t("del_gps_err", "GPS error: {msg}", { msg: err.message }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Reorder stops
  const handleMoveStop = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= scheduledStops.length) return;

    const newStops = [...scheduledStops];
    const [moved] = newStops.splice(index, 1);
    newStops.splice(targetIndex, 0, moved);

    const updated = newStops.map((stop, idx) => ({
      ...stop,
      route_order: idx + 1,
    }));

    setScheduledStops(updated);

    try {
      setIsSaving(true);
      await fetch("/api/delivery/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          reorderedStops: updated.map((s) => ({
            id: s.id,
            route_order: s.route_order,
            time_slot: s.time_slot,
          })),
        }),
      });
    } catch {
      toast.error(t("del_reorder_err", "Failed to save reordering"));
      fetchRoute(selectedDate);
    } finally {
      setIsSaving(false);
    }
  };

  // Change slot
  const handleSlotChange = async (stopId: string, newSlot: string) => {
    const updated = scheduledStops.map((s) => (s.id === stopId ? { ...s, time_slot: newSlot } : s));
    setScheduledStops(updated);

    try {
      await fetch("/api/delivery/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          quoteId: stopId,
          scheduledDate: selectedDate,
          timeSlot: newSlot,
          routeOrder: updated.find((s) => s.id === stopId)?.route_order || 1,
        }),
      });
      toast.success(t("del_slot_updated", "Time slot updated"));
    } catch {
      toast.error(t("del_slot_upd_err", "Failed to update slot"));
    }
  };

  // Auto-Optimize using Time-Window-Aware Hybrid TSP
  const handleAutoOptimize = async () => {
    if (scheduledStops.length < 2) {
      toast.info(t("del_opt_min2", "Need at least 2 stops to auto-optimize"));
      return;
    }

    setIsOptimizing(true);
    try {
      const { optimizedStops, totalDistanceKm, estimatedDriveMinutes } = optimizeRouteWithTimeWindows(
        scheduledStops,
        technicianLocation
      );

      setScheduledStops(optimizedStops);

      const res = await fetch("/api/delivery/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          reorderedStops: optimizedStops.map((s) => ({
            id: s.id,
            route_order: s.route_order,
            time_slot: s.time_slot,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          t("del_route_opt_ok", "⚡ Route optimized! ~{km} km ({mins} mins drive) scheduled by time windows.", {
            km: String(totalDistanceKm),
            mins: String(estimatedDriveMinutes),
          })
        );
      } else {
        toast.error(t("del_opt_save_err", "Failed to save optimized sequence"));
        fetchRoute(selectedDate);
      }
    } catch {
      toast.error(t("del_opt_fail", "Optimization failed"));
    } finally {
      setIsOptimizing(false);
    }
  };

  // Add from pending
  const handleAddToRoute = async (job: DeliveryStop, slot: string = "morning") => {
    const newOrder = scheduledStops.length + 1;
    const newStop: DeliveryStop = {
      ...job,
      scheduled_date: selectedDate,
      time_slot: slot,
      route_order: newOrder,
    };

    setPendingPool(pendingPool.filter((p) => p.id !== job.id));
    setScheduledStops([...scheduledStops, newStop]);

    try {
      await fetch("/api/delivery/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          quoteId: job.id,
          scheduledDate: selectedDate,
          timeSlot: slot,
          routeOrder: newOrder,
        }),
      });
      const slotCfg = TIME_SLOT_LABELS[slot];
      const slotLabel = slotCfg ? t(slotCfg.labelKey, slotCfg.label) : slot;
      toast.success(t("del_added_slot", "Delivery added to {slot}", { slot: slotLabel }));
    } catch {
      toast.error(t("del_add_stop_err", "Failed to add stop"));
      fetchRoute(selectedDate);
    }
  };

  // Unschedule stop
  const handleUnschedule = async (stopId: string) => {
    const stopToRemove = scheduledStops.find((s) => s.id === stopId);
    if (!stopToRemove) return;

    setScheduledStops(scheduledStops.filter((s) => s.id !== stopId));
    setPendingPool([stopToRemove, ...pendingPool]);

    try {
      await fetch("/api/delivery/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unschedule",
          quoteId: stopId,
        }),
      });
      toast.info(t("del_moved_pending", "Moved back to pending pool"));
    } catch {
      toast.error(t("del_net_err", "Network error"));
      fetchRoute(selectedDate);
    }
  };

  // Submit OTP Verification
  const handleConfirmDeliveryOtp = async () => {
    if (!verifyingStop) return;
    if (otpInput.length !== 4) {
      toast.error(t("del_valid_4otp_err", "Please enter a valid 4-digit OTP"));
      return;
    }
    if (verifyingStop.balance_due > 0 && !cashConfirmed) {
      toast.error(t("del_confirm_cod_err", "Please confirm COD cash collection before verifying"));
      return;
    }

    setSubmittingOtp(true);
    try {
      const res = await fetch("/api/delivery/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: verifyingStop.id,
          otp: otpInput,
          cashCollected: verifyingStop.balance_due > 0 ? true : undefined,
          cashAmount: verifyingStop.balance_due,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t("del_confirmed_handed_toast", "Delivery Confirmed! Materials Handed Over."));
        setScheduledStops((prev) =>
          prev.map((s) => (s.id === verifyingStop.id ? { ...s, delivery_status: "DELIVERED" } : s))
        );
        setVerifyingStop(null);
        setOtpInput("");
        setCashConfirmed(false);
      } else {
        toast.error(data.error || t("del_invalid_otp_code", "Invalid OTP code"));
      }
    } catch {
      toast.error(t("del_otp_net_err", "Network error confirming OTP"));
    } finally {
      setSubmittingOtp(false);
    }
  };

  const fullGoogleMapsRouteUrl = useMemo(() => {
    return buildGoogleMapsMultiStopUrl(scheduledStops, technicianLocation);
  }, [scheduledStops, technicianLocation]);



  const defaultCenter = useMemo(() => {
    if (technicianLocation) return technicianLocation;
    const firstWithCoords = scheduledStops.find((s) => s.coordinates?.lat && s.coordinates?.lng);
    if (firstWithCoords?.coordinates) {
      return firstWithCoords.coordinates;
    }
    return { lat: 26.9124, lng: 75.7873 };
  }, [scheduledStops, technicianLocation]);

  // Aggregate Metrics
  const totalCodToCollect = useMemo(() => {
    return scheduledStops
      .filter((s) => s.delivery_status !== "DELIVERED")
      .reduce((acc, s) => acc + (s.balance_due || 0), 0);
  }, [scheduledStops]);

  const deliveredCount = useMemo(() => {
    return scheduledStops.filter((s) => s.delivery_status === "DELIVERED").length;
  }, [scheduledStops]);

  return (
    <div className="space-y-5">
      {/* ── HEADER & DATE SELECTOR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {t("del_plan_title", "Delivery Route Plan")}
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t("del_plan_desc", "Dispatch route sequence, COD balance collection, and instant customer OTP delivery verification.")}
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDate === todayStr
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
            }`}
          >
            {t("del_today", "Today")}
          </button>
          <button
            onClick={() => {
              const tmr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
              setSelectedDate(tmr);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDate !== todayStr && selectedDate === new Date(Date.now() + 86400000).toISOString().split("T")[0]
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
            }`}
          >
            {t("del_tomorrow", "Tomorrow")}
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* ── KPI METRICS STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("del_kpi_sched", "Scheduled Drops")}</p>
          <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">{scheduledStops.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("del_kpi_delivered", "Delivered")}</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {deliveredCount} <span className="text-xs font-semibold text-zinc-400">/ {scheduledStops.length}</span>
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("del_kpi_cod", "COD To Collect")}</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
            ₹{totalCodToCollect.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("del_kpi_pending", "Pending Drops")}</p>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{pendingPool.length}</p>
        </div>
      </div>

      {/* ── ACTION BAR ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {fullGoogleMapsRouteUrl ? (
            <a
              href={fullGoogleMapsRouteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all whitespace-normal text-center"
            >
              <Navigation className="w-4 h-4 shrink-0" />
              <span>{t("del_start_route_btn", "Start Delivery Route ({count} Drops)", { count: String(scheduledStops.length) })}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
            </a>
          ) : (
            <div className="text-xs text-zinc-400 italic flex items-center gap-1.5 p-2">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{t("del_add_drops_hint", "Add drops to enable 1-tap route navigation.")}</span>
            </div>
          )}

          {scheduledStops.length >= 2 && (
            <button
              onClick={handleAutoOptimize}
              disabled={isOptimizing}
              className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all disabled:opacity-50 whitespace-normal text-left"
              title={t("del_auto_opt_title", "Optimize order by time slots and driving distance")}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{isOptimizing ? t("del_optimizing", "Optimizing...") : t("del_auto_opt_btn", "⚡ Auto-Optimize (Time + Distance)")}</span>
            </button>
          )}

          <button
            onClick={handleLocateMe}
            disabled={locatingUser}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs border transition-all whitespace-normal ${
              technicianLocation
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <Locate className={`w-3.5 h-3.5 shrink-0 ${locatingUser ? "animate-spin" : ""}`} />
            <span>{technicianLocation ? t("del_loc_synced", "📍 Location Synced") : t("del_locate_me", "Locate Me")}</span>
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-zinc-200 dark:bg-zinc-800/80 p-1 rounded-xl self-end sm:self-auto">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "timeline"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 shrink-0" />
            <span>{t("del_tab_timeline", "Timeline")}</span>
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "map"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{t("del_tab_map", "Map View")}</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400 space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold">{t("del_loading_drops", "Loading delivery drops...")}</p>
        </div>
      ) : activeTab === "map" ? (
        /* MAP VIEW */
        <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm relative">
          {isMapLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={12}
              options={{ disableDefaultUI: false, zoomControl: true, mapTypeControl: false }}
            >
              {technicianLocation && (
                <MarkerF
                  position={technicianLocation}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 9,
                    fillColor: "#059669",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 3,
                  }}
                  title={t("del_van_you", "Delivery Van / You")}
                />
              )}

              {scheduledStops.map((stop, idx) => {
                if (!stop.coordinates?.lat || !stop.coordinates?.lng) return null;
                const isDone = stop.delivery_status === "DELIVERED";
                return (
                  <MarkerF
                    key={stop.id}
                    position={stop.coordinates}
                    label={{
                      text: `${idx + 1}`,
                      color: "#ffffff",
                      fontWeight: "bold",
                    }}
                    onClick={() => setSelectedMarker(stop)}
                  />
                );
              })}

              <PolylineF
                path={[
                  ...(technicianLocation ? [technicianLocation] : []),
                  ...scheduledStops
                    .filter((s) => s.coordinates?.lat && s.coordinates?.lng)
                    .map((s) => s.coordinates!),
                ]}
                options={{ strokeColor: "#059669", strokeOpacity: 0.8, strokeWeight: 4 }}
              />

              {selectedMarker && selectedMarker.coordinates && (
                <InfoWindowF
                  position={selectedMarker.coordinates}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="p-2 text-zinc-900 max-w-[220px]">
                    <p className="font-bold text-xs text-emerald-600">
                      {t("del_drop_hash", "Drop #{num}", { num: String(scheduledStops.findIndex((s) => s.id === selectedMarker.id) + 1) })}
                    </p>
                    <p className="font-bold text-sm mt-0.5">{selectedMarker.customer_name}</p>
                    <p className="text-[11px] font-bold text-amber-700 mt-1">
                      {t("del_map_collect_cod", "Collect COD: ₹{amount}", { amount: selectedMarker.balance_due.toLocaleString("en-IN") })}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-0.5 line-clamp-2">
                      {selectedMarker.items_summary}
                    </p>
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500">
              {t("del_loading_gmaps", "Loading Google Maps...")}
            </div>
          )}
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className="space-y-4">
          {scheduledStops.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-2">
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t("del_no_sched_date", "No deliveries scheduled for {date}", { date: selectedDate })}</p>
              <p className="text-xs text-zinc-400">{t("del_add_from_pending", "Add packages from your Pending Drops list below.")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledStops.map((stop, index) => {
                const slotInfo = TIME_SLOT_LABELS[stop.time_slot || "morning"] || TIME_SLOT_LABELS.morning;
                const localizedSlotLabel = t(slotInfo.labelKey, slotInfo.label);
                const isDelivered = stop.delivery_status === "DELIVERED";
                const phone = stop.mobile_number || "";
                const waCodPart = stop.balance_due > 0
                  ? t("del_wa_cod_part", " COD balance to collect: ₹{amount}.", { amount: stop.balance_due.toLocaleString("en-IN") })
                  : "";
                const waText = t("del_wa_msg", "Hello {name}, your TEAM CCTV hardware package is arriving today during your {slot} ({time}). Please have your 4-digit OTP ready.{cod}", {
                  name: stop.customer_name || t("del_cust_fallback", "Customer"),
                  slot: localizedSlotLabel,
                  time: slotInfo.time,
                  cod: waCodPart,
                });

                return (
                  <div
                    key={stop.id}
                    className={`bg-white dark:bg-zinc-900 border rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isDelivered
                        ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50"
                    }`}
                  >
                    {/* Left: Sequence, Customer, Package & COD Due */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 shadow-sm ${
                        isDelivered
                          ? "bg-emerald-600 text-white shadow-emerald-500/20"
                          : "bg-emerald-600 text-white shadow-emerald-500/20"
                      }`}>
                        {isDelivered ? <CheckCircle className="w-5 h-5" /> : `#${index + 1}`}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${slotInfo.color}`}
                          >
                            {slotInfo.icon} {localizedSlotLabel} ({slotInfo.time})
                          </span>

                          {/* COD / Payment Badge */}
                          {stop.balance_due > 0 ? (
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                              <IndianRupee className="w-3 h-3 shrink-0" /> {t("del_collect_amt_cod", "Collect ₹{amount} COD", { amount: stop.balance_due.toLocaleString("en-IN") })}
                            </span>
                          ) : (
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              {t("del_paid_online", "Paid Online")}
                            </span>
                          )}

                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            isDelivered ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" :
                            "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                          }`}>
                            {isDelivered ? t("del_status_delivered", "Delivered") : t("del_status_out", "Out for Delivery")}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                          {stop.customer_name} <span className="text-xs font-normal text-zinc-400">({stop.quote_id})</span>
                        </h3>

                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 truncate">
                          📦 {stop.items_summary}
                        </p>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>
                            {stop.address?.street || t("del_customer_site", "Customer Site")}, {stop.address?.city || "Jaipur"}{" "}
                            {stop.address?.pincode ? `(${stop.address.pincode})` : ""}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Middle: 1-Tap OTP Delivery Action */}
                    <div className="flex items-center gap-2 self-start md:self-center">
                      {!isDelivered ? (
                        <button
                          onClick={() => {
                            setVerifyingStop(stop);
                            setOtpInput("");
                            setCashConfirmed(false);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-98 whitespace-normal"
                        >
                          <PackageCheck className="w-4 h-4 shrink-0" />
                          <span>{t("del_verify_otp_deliver", "Verify OTP & Deliver")}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{t("del_status_delivered", "Delivered")}</span>
                        </span>
                      )}
                    </div>

                    {/* Right: Slot Modifier & Quick Communications */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                      <select
                        value={stop.time_slot || "morning"}
                        onChange={(e) => handleSlotChange(stop.id, e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 focus:outline-hidden"
                      >
                        <option value="morning">{t("del_opt_morning", "🌅 Morning")}</option>
                        <option value="afternoon">{t("del_opt_afternoon", "☀️ Afternoon")}</option>
                        <option value="evening">{t("del_opt_evening", "🌆 Evening")}</option>
                      </select>

                      {stop.map_url || stop.coordinates ? (
                        <a
                          href={
                            stop.map_url ||
                            `https://maps.google.com/?q=${stop.coordinates?.lat},${stop.coordinates?.lng}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 text-blue-600 dark:text-blue-400 transition-colors"
                          title={t("del_nav_drop_title", "Navigate to Drop")}
                        >
                          <Navigation className="w-4 h-4" />
                        </a>
                      ) : null}

                      {phone && (
                        <a
                          href={`tel:${phone}`}
                          className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 transition-colors"
                          title={t("del_call_cust_title", "Call Customer")}
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}

                      {phone && (
                        <a
                          href={`https://wa.me/91${phone.replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors"
                          title={t("del_wa_cust_title", "WhatsApp Customer")}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}

                      <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-700 pl-2 ml-1">
                        <button
                          onClick={() => handleMoveStop(index, "up")}
                          disabled={index === 0 || isSaving}
                          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveStop(index, "down")}
                          disabled={index === scheduledStops.length - 1 || isSaving}
                          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleUnschedule(stop.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PENDING DROPS POOL ── */}
      <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
          {t("del_pending_dispatches", "Pending Warehouse Dispatches ({count} Packages)", { count: String(pendingPool.length) })}
        </h2>

        {pendingPool.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">{t("del_no_unsched_pool", "No unscheduled packages in dispatch pool.")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingPool.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl space-y-2 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono text-zinc-400">{t("del_quote_hash", "Quote #")}{job.quote_id?.slice(0, 8)}</span>
                    <span className="text-[10px] font-black text-amber-600">
                      {t("del_cod_amt_tag", "₹{amount} COD", { amount: job.balance_due.toLocaleString("en-IN") })}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{job.customer_name}</h4>
                  <p className="text-[11px] text-zinc-500 line-clamp-1">{job.items_summary}</p>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-zinc-400">{t("del_schedule_lbl", "Schedule:")}</span>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      onClick={() => handleAddToRoute(job, "morning")}
                      className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-[10px] font-bold"
                    >
                      {t("del_morn_short", "🌅 Morn")}
                    </button>
                    <button
                      onClick={() => handleAddToRoute(job, "afternoon")}
                      className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-[10px] font-bold"
                    >
                      {t("del_aft_short", "☀️ Aft")}
                    </button>
                    <button
                      onClick={() => handleAddToRoute(job, "evening")}
                      className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-600 text-[10px] font-bold"
                    >
                      {t("del_eve_short", "🌆 Eve")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── INLINE OTP VERIFICATION MODAL ── */}
      {verifyingStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">{t("del_handover_modal_title", "Handover Verification")}</h3>
                  <p className="text-[11px] text-zinc-500">{verifyingStop.customer_name}</p>
                </div>
              </div>
              <button
                onClick={() => setVerifyingStop(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* COD Cash Confirmation if applicable */}
            {verifyingStop.balance_due > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  {t("del_cod_to_collect_lbl", "COD Balance to Collect:")}
                </p>
                <p className="text-xl font-black text-amber-900 dark:text-amber-200">
                  ₹{verifyingStop.balance_due.toLocaleString("en-IN")}
                </p>
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cashConfirmed}
                    onChange={(e) => setCashConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{t("del_cash_upi_received", "I have received the cash/UPI payment")}</span>
                </label>
              </div>
            )}

            {/* OTP Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {t("del_4digit_otp_lbl", "Customer 4-Digit Delivery OTP")}
              </label>
              <input
                type="text"
                maxLength={4}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full text-center tracking-[0.5em] font-mono font-black text-2xl py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-zinc-400 text-center">
                {t("del_otp_sms_hint", "Ask customer for the OTP sent to their WhatsApp / SMS.")}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setVerifyingStop(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 whitespace-normal"
              >
                {t("del_cancel", "Cancel")}
              </button>
              <button
                onClick={handleConfirmDeliveryOtp}
                disabled={submittingOtp || otpInput.length !== 4}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black shadow-sm transition-all whitespace-normal"
              >
                {submittingOtp ? t("del_verifying", "Verifying...") : t("del_confirm_delivery", "Confirm Delivery")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



