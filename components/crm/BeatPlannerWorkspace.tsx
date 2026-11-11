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
  Sparkles,
  Calendar,
  Building2,
  Users,
  AlertTriangle,
  Car,
  CheckCircle,
  Plus,
  RefreshCw,
  Locate
} from "lucide-react";
import { GoogleMap, MarkerF, PolylineF, InfoWindowF, useJsApiLoader } from "@react-google-maps/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LatLng } from "@/lib/routing/optimizer";
import { useTranslation } from "@/hooks/useTranslation";
import type { BeatStop } from "@/types";

interface BeatPlannerWorkspaceProps {
  isAdmin?: boolean;
}

const TIME_SLOT_CONFIG: Record<string, { key: string; fallback: string; time: string; color: string; icon: string }> = {
  morning: { key: "del_slot_morning", fallback: "Morning Slot", time: "09:30 AM – 01:00 PM", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800", icon: "🌅" },
  afternoon: { key: "del_slot_afternoon", fallback: "Afternoon Slot", time: "01:30 PM – 05:00 PM", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800", icon: "☀️" },
  evening: { key: "del_slot_evening", fallback: "Evening Slot", time: "05:30 PM – 08:00 PM", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800", icon: "🌆" },
};

const mapContainerStyle = {
  width: "100%",
  height: "550px",
  borderRadius: "1rem",
};

/** Formats date in Indian Standard Time (IST / Asia/Kolkata) to prevent UTC midnight date drift */
function getISTDateString(d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
  } catch {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

/** Shifts date string safely by delta days without timezone boundary skips */
function shiftDateString(dateStr: string, daysDelta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + daysDelta);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BeatPlannerWorkspace({ isAdmin = false }: BeatPlannerWorkspaceProps) {
  const { t } = useTranslation();
  const todayStr = useMemo(() => getISTDateString(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [scheduledStops, setScheduledStops] = useState<BeatStop[]>([]);
  const [overdueBacklog, setOverdueBacklog] = useState<BeatStop[]>([]);
  const [nearbyB2BPartners, setNearbyB2BPartners] = useState<BeatStop[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"schedule" | "backlog" | "map">("schedule");
  const [selectedMarker, setSelectedMarker] = useState<BeatStop | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSmartFilling, setIsSmartFilling] = useState(false);
  const [technicianLocation, setTechnicianLocation] = useState<LatLng | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Check-In Modal State
  const [checkInStop, setCheckInStop] = useState<BeatStop | null>(null);
  const [checkInNotes, setCheckInNotes] = useState("");
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const fetchBeatPlan = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/beat-plan?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setScheduledStops(data.scheduledStops || []);
        setOverdueBacklog(data.overdueBacklog || []);
        setNearbyB2BPartners(data.nearbyB2BPartners || []);
        setSummary(data.summary || {});
      } else {
        toast.error(data.error || t("beat_err_load", "Failed to load Beat Plan"));
      }
    } catch {
      toast.error(t("beat_err_conn", "Failed to connect to Beat Plan service"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBeatPlan(selectedDate);
  }, [selectedDate, fetchBeatPlan]);

  // Log touchpoint helper
  const handleLogTouchpoint = async (stop: BeatStop, type: "whatsapp" | "call") => {
    try {
      const entity_type = stop.entity_type === "b2b_partner" ? "promoter" : "lead";
      await fetch("/api/crm/touchpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type,
          entity_id: stop.id,
          touchpoint_type: type,
        }),
      });
      fetchBeatPlan(selectedDate);
    } catch (e: any) {
      console.warn("Could not log touchpoint:", e);
    }
  };

  const handleWhatsAppClick = (stop: BeatStop) => {
    handleLogTouchpoint(stop, "whatsapp");
    const phone = (stop.mobile_number || "").replace(/\D/g, "");
    if (!phone) {
      toast.error(t("beat_err_no_phone", "No phone number available"));
      return;
    }
    const msg = encodeURIComponent(
      stop.entity_type === "b2b_partner"
        ? t("beat_wa_partner", "Namaste {name}, I am planning our regular CCTV partner check-in. Looking forward to meeting you today!", { name: stop.title })
        : t("beat_wa_lead", "Hello {name}, regarding your CCTV installation survey inquiry with TEAM CCTV, I am your allocated site executive.", { name: stop.title })
    );
    window.open(`https://wa.me/91${phone}?text=${msg}`, "_blank");
  };

  const handleCallClick = (stop: BeatStop) => {
    handleLogTouchpoint(stop, "call");
    window.location.href = `tel:${stop.mobile_number}`;
  };

  // Reorder Stops Up/Down
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
      await fetch("/api/crm/beat-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          reorderedStops: updated,
        }),
      });
      toast.success(t("beat_seq_ok", "Stop sequence updated"));
    } catch {
      toast.error(t("beat_seq_err", "Failed to save reordered stops"));
      fetchBeatPlan(selectedDate);
    }
  };

  // Unschedule stop (send back to backlog)
  const handleUnschedule = async (stop: BeatStop) => {
    try {
      await fetch("/api/crm/beat-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unschedule",
          entity_type: stop.entity_type,
          entity_id: stop.id,
        }),
      });
      toast.success(t("beat_rem_ok", "Removed {title} from today's beat", { title: stop.title }));
      fetchBeatPlan(selectedDate);
    } catch {
      toast.error(t("beat_rem_err", "Failed to unschedule stop"));
    }
  };

  // Schedule stop from backlog to today
  const handleScheduleFromBacklog = async (stop: BeatStop, slot: string = "morning") => {
    try {
      await fetch("/api/crm/beat-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          entity_type: stop.entity_type,
          entity_id: stop.id,
          scheduled_date: selectedDate,
          time_slot: slot,
          route_order: scheduledStops.length + 1,
        }),
      });
      const slotCfg = TIME_SLOT_CONFIG[slot];
      const slotLabel = slotCfg ? t(slotCfg.key, slotCfg.fallback) : slot;
      toast.success(t("beat_add_ok", "Added {title} to {slot} slot!", { title: stop.title, slot: slotLabel }));
      fetchBeatPlan(selectedDate);
    } catch {
      toast.error(t("beat_add_err", "Failed to add stop to Beat Plan"));
    }
  };

  // Smart-Fill Beat with top priority backlog items
  const handleSmartFillBeat = async (countToSchedule: number = 5) => {
    if (overdueBacklog.length === 0) {
      toast.info(t("beat_none_overdue", "No overdue accounts in backlog to schedule."));
      return;
    }
    setIsSmartFilling(true);
    try {
      const candidateAccounts = overdueBacklog.slice(0, countToSchedule);
      const slotDistribution = ["morning", "morning", "afternoon", "afternoon", "evening", "evening"];

      const stopsToSchedule = candidateAccounts.map((account, idx) => ({
        entity_type: account.entity_type,
        id: account.id,
        time_slot: slotDistribution[idx] || "morning",
        route_order: scheduledStops.length + idx + 1,
      }));

      const res = await fetch("/api/crm/beat-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_schedule",
          stops: stopsToSchedule,
          scheduled_date: selectedDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t("beat_batch_ok", "⚡ Added {count} overdue accounts to Beat Plan!", { count: String(stopsToSchedule.length) }));
        await fetchBeatPlan(selectedDate);
        setActiveTab("schedule");
      } else {
        toast.error(data.error || t("beat_batch_err", "Failed to batch schedule stops"));
      }
    } catch {
      toast.error(t("beat_err_conn", "Failed to connect to Beat Plan service"));
    } finally {
      setIsSmartFilling(false);
    }
  };

  // Auto-optimize route
  const handleAutoOptimize = async () => {
    if (scheduledStops.length <= 1) {
      toast.info(t("beat_min2_err", "Add at least 2 stops to optimize route"));
      return;
    }
    setIsOptimizing(true);
    try {
      let origin = technicianLocation;
      if (!origin && typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 });
          });
          origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setTechnicianLocation(origin);
        } catch {
          // Proceed without origin if permission denied/timeout
        }
      }

      const res = await fetch("/api/crm/beat-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "auto_optimize",
          stops: scheduledStops,
          origin,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          t("beat_opt_ok", "Route optimized! Shortest round trip: {km} km (~{mins} mins drive)", {
            km: String(data.result?.totalDistanceKm ?? ""),
            mins: String(data.result?.estimatedDriveMinutes ?? ""),
          })
        );
        fetchBeatPlan(selectedDate);
      } else {
        toast.error(data.error || t("del_opt_fail", "Optimization failed"));
      }
    } catch {
      toast.error(t("beat_opt_err", "Failed to optimize route"));
    } finally {
      setIsOptimizing(false);
    }
  };

  // Check-In Completion
  const handleCompleteCheckIn = async () => {
    if (!checkInStop) return;
    setIsSubmittingCheckIn(true);
    try {
      await fetch("/api/crm/touchpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: checkInStop.entity_type === "b2b_partner" ? "promoter" : "lead",
          entity_id: checkInStop.id,
          touchpoint_type: "visit_checkin",
          notes: checkInNotes,
          coordinates: technicianLocation,
        }),
      });
      toast.success(t("beat_checkin_ok", "Visit check-in recorded for {title}!", { title: checkInStop.title }));
      setCheckInStop(null);
      setCheckInNotes("");
      fetchBeatPlan(selectedDate);
    } catch {
      toast.error(t("beat_checkin_err", "Failed to record visit check-in"));
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  // Locate technician via GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error(t("del_geo_unsupported", "Geolocation not supported by browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTechnicianLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success(t("beat_gps_ok", "GPS Location captured as route starting point!"));
      },
      (err) => {
        toast.error(t("del_gps_err", "GPS error: {msg}", { msg: err.message }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Group scheduled stops by slot
  const stopsBySlot = useMemo(() => {
    const buckets: Record<string, BeatStop[]> = { morning: [], afternoon: [], evening: [] };
    scheduledStops.forEach((s) => {
      const slot = (s.time_slot || "morning").toLowerCase();
      if (buckets[slot]) buckets[slot].push(s);
      else buckets.morning.push(s);
    });
    return buckets;
  }, [scheduledStops]);

  // Center coordinates for map
  const mapCenter = useMemo(() => {
    const firstValid = scheduledStops.find((s) => s.coordinates?.lat && s.coordinates?.lng);
    if (firstValid?.coordinates) return firstValid.coordinates;
    if (technicianLocation) return technicianLocation;
    return { lat: 26.8550, lng: 75.7650 }; // Default Mansarovar Jaipur
  }, [scheduledStops, technicianLocation]);

  // Dynamic Map Bounds Fitting
  const fitMapToBounds = useCallback(() => {
    if (!mapInstance || typeof window === "undefined" || !window.google?.maps) return;
    const bounds = new window.google.maps.LatLngBounds();
    let count = 0;

    scheduledStops.forEach((s) => {
      if (s.coordinates?.lat && s.coordinates?.lng) {
        bounds.extend(s.coordinates);
        count++;
      }
    });

    nearbyB2BPartners.forEach((p) => {
      if (p.coordinates?.lat && p.coordinates?.lng) {
        bounds.extend(p.coordinates);
        count++;
      }
    });

    if (technicianLocation?.lat && technicianLocation?.lng) {
      bounds.extend(technicianLocation);
      count++;
    }

    if (count > 1) {
      mapInstance.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    } else if (count === 1) {
      const center = bounds.getCenter();
      mapInstance.setCenter(center);
      mapInstance.setZoom(13);
    }
  }, [mapInstance, scheduledStops, nearbyB2BPartners, technicianLocation]);

  useEffect(() => {
    if (activeTab === "map" && mapInstance) {
      fitMapToBounds();
    }
  }, [activeTab, mapInstance, fitMapToBounds]);

  return (
    <div className="space-y-6">
      {/* HEADER & DATE SELECTOR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Navigation className="w-6 h-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug text-zinc-900 dark:text-zinc-100">
              {isAdmin ? t("beat_admin_title", "Admin Territory Beat Planner") : t("beat_sales_title", "My Daily Beat Plan & Client Route")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t("beat_subtitle", "Unified route optimization for Customer Site Surveys (Leads) & Regular B2B Partner Engagement Visits")}
          </p>
        </div>

        {/* Date Selector & Auto-Optimize */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-wrap items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 border border-zinc-200 dark:border-zinc-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate((prev) => shiftDateString(prev, -1))}
              className="h-8 px-2 text-xs"
            >
              {t("beat_prev", "◀ Prev")}
            </Button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-semibold px-2 py-1 outline-none text-zinc-900 dark:text-zinc-100 cursor-pointer"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate((prev) => shiftDateString(prev, 1))}
              className="h-8 px-2 text-xs"
            >
              {t("beat_next", "Next ▶")}
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(todayStr)}
            className={`text-xs font-semibold ${selectedDate === todayStr ? "border-blue-500 text-blue-600" : ""}`}
          >
            {t("del_today", "Today")}
          </Button>

          {scheduledStops.length === 0 && overdueBacklog.length > 0 && (
            <Button
              size="sm"
              onClick={() => handleSmartFillBeat(5)}
              disabled={isSmartFilling}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              {isSmartFilling ? t("beat_filling", "Filling...") : t("beat_quick_fill", "⚡ Quick-Fill Beat (5)")}
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleAutoOptimize}
            disabled={isOptimizing || scheduledStops.length <= 1}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            {isOptimizing ? t("del_optimizing", "Optimizing...") : t("beat_auto_opt", "Auto-Optimize Beat")}
          </Button>

          {summary?.googleNavigationUrl && (
            <a href={summary.googleNavigationUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5">
                <Car className="w-3.5 h-3.5 shrink-0" />
                {t("beat_nav_gmaps", "Navigate in Google Maps")}
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* KPI METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("beat_sched_stops", "Scheduled Stops")}</p>
          <div className="flex flex-wrap items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{summary?.total_stops || 0}</span>
            <span className="text-xs text-muted-foreground">
              ({t("beat_leads_b2b", "{leads} Leads • {b2b} B2B", { leads: String(summary?.leads_count || 0), b2b: String(summary?.partners_count || 0) })})
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("beat_overdue_back", "Overdue Backlog")}</p>
          <div className="flex flex-wrap items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-red-600 dark:text-red-400">{summary?.overdue_backlog_count || 0}</span>
            <span className="text-xs text-red-500/80 font-semibold">{t("beat_needs_touch", "Needs Touchpoint")}</span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("beat_pipe_val", "Beat Pipeline Value")}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{(summary?.total_pipeline_value || 0).toLocaleString("en-IN")}
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("beat_gps_orig", "GPS Origin")}</p>
            <p className="text-xs font-semibold mt-1">
              {technicianLocation ? `${technicianLocation.lat.toFixed(4)}, ${technicianLocation.lng.toFixed(4)}` : t("beat_not_cap", "Not captured")}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLocateMe} className="text-xs h-8 px-2 gap-1 text-blue-600">
            <Locate className="w-3.5 h-3.5 shrink-0" />
            {t("del_locate_me", "Locate Me")}
          </Button>
        </Card>
      </div>

      {/* VIEW TABS */}
      <div className="flex flex-wrap border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <button
          onClick={() => setActiveTab("schedule")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "schedule"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          {t("beat_tab_sched", "Day Beat Schedule ({count})", { count: String(scheduledStops.length) })}
        </button>

        <button
          onClick={() => setActiveTab("backlog")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "backlog"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {t("beat_tab_backlog", "Overdue Accounts Backlog ({count})", { count: String(overdueBacklog.length) })}
        </button>

        <button
          onClick={() => setActiveTab("map")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "map"
              ? "border-purple-600 text-purple-600 dark:text-purple-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />
          {t("beat_tab_map", "Territory Route Map ({count})", { count: String(scheduledStops.length + nearbyB2BPartners.length) })}
        </button>
      </div>

      {/* TAB 1: DAILY BEAT SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          {scheduledStops.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-zinc-900 border-dashed">
              <p className="text-muted-foreground text-sm font-medium">{t("beat_no_stops", "No stops scheduled for {date}", { date: selectedDate })}.</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("beat_no_stops_hint1", "Switch to the")} <strong>{t("beat_no_stops_hint_tab", "Overdue Accounts Backlog")}</strong> {t("beat_no_stops_hint2", "tab to add pending customer leads or B2B partners to today's beat, or use Quick-Fill below!")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                {overdueBacklog.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => handleSmartFillBeat(5)}
                    disabled={isSmartFilling}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    {isSmartFilling ? t("beat_filling_beat", "Filling Beat...") : t("beat_smart_fill", "⚡ Smart-Fill Today's Beat (5 Accounts)")}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("backlog")}
                  className="text-xs font-semibold"
                >
                  {t("beat_browse_back", "Browse Overdue Backlog ({count})", { count: String(overdueBacklog.length) })}
                </Button>
              </div>
            </Card>
          ) : (
            ["morning", "afternoon", "evening"].map((slotKey) => {
              const slotStops = stopsBySlot[slotKey] || [];
              const slotConfig = TIME_SLOT_CONFIG[slotKey];
              const slotLabel = t(slotConfig.key, slotConfig.fallback);

              return (
                <div key={slotKey} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg">{slotConfig.icon}</span>
                      <h3 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                        {slotLabel}
                      </h3>
                      <span className="text-xs text-muted-foreground font-mono">
                        ({slotConfig.time})
                      </span>
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-bold ${slotConfig.color}`}>
                      {slotStops.length === 1
                        ? t("beat_slot_stop_cnt", "{count} Stop", { count: "1" })
                        : t("beat_slot_stops_cnt", "{count} Stops", { count: String(slotStops.length) })}
                    </Badge>
                  </div>

                  {slotStops.length === 0 ? (
                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-muted-foreground text-center">
                      {t("beat_no_slot_visits", "No visits scheduled for {slot}", { slot: slotLabel })}.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {slotStops.map((stop, idx) => {
                        const globalIndex = scheduledStops.findIndex((s) => s.id === stop.id);

                        return (
                          <div
                            key={stop.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-blue-400 transition-colors"
                          >
                            {/* LEFT: Stop Order & Entity Info */}
                            <div className="flex items-start gap-3.5 min-w-0">
                              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                #{stop.route_order}
                              </span>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  {stop.entity_type === "b2b_partner" ? (
                                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold">
                                      {t("beat_badge_b2b", "🏢 B2B Partner")}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold">
                                      {t("beat_badge_lead", "👤 Customer Lead")}
                                    </Badge>
                                  )}

                                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                    {stop.title}
                                  </span>

                                  {stop.business_name && (
                                    <span className="text-xs text-muted-foreground font-semibold">
                                      ({stop.business_name})
                                    </span>
                                  )}

                                  {/* Inactivity Health Badge */}
                                  <Badge variant="outline" className="text-[10px] font-semibold border">
                                    {stop.days_since_last_visit !== null
                                      ? t("beat_last_visit", "Last Visit: {days}d ago", { days: String(stop.days_since_last_visit) })
                                      : t("beat_never_visited", "⚠️ Never Visited")}
                                  </Badge>

                                  {stop.checkin_at && (
                                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold gap-1">
                                      <CheckCircle className="w-3 h-3" /> {t("beat_checked_in", "Checked In")}
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-xs text-muted-foreground mt-1">
                                  {stop.subtitle}
                                </p>

                                <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                  {stop.address?.full_address || t("beat_def_city", "Jaipur Territory")}
                                </p>
                              </div>
                            </div>

                            {/* RIGHT: Quick Action Buttons */}
                            <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCallClick(stop)}
                                title={t("beat_tt_call", "Call Customer / Partner")}
                                className="h-8 w-8 p-0 text-zinc-700 dark:text-zinc-300 hover:text-blue-600"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWhatsAppClick(stop)}
                                title={t("beat_tt_wa", "Open WhatsApp Chat (Auto-logs touchpoint)")}
                                className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCheckInStop(stop)}
                                className="h-8 px-2.5 text-xs font-semibold gap-1 text-purple-700 bg-purple-50 dark:bg-purple-950/30 border-purple-200"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                {t("beat_check_in_btn", "Check In")}
                              </Button>

                              {/* Reorder Buttons */}
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={globalIndex === 0}
                                onClick={() => handleMoveStop(globalIndex, "up")}
                                className="h-8 w-7 p-0"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={globalIndex === scheduledStops.length - 1}
                                onClick={() => handleMoveStop(globalIndex, "down")}
                                className="h-8 w-7 p-0"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUnschedule(stop)}
                                title={t("beat_tt_remove", "Remove from today")}
                                className="h-8 w-7 p-0 text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: OVERDUE ACCOUNTS BACKLOG */}
      {activeTab === "backlog" && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {t("beat_neglected_title", "Neglected Accounts Requiring Relationship Visits ({count})", { count: String(overdueBacklog.length) })}
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1">
              {t("beat_neglected_desc", "These Customer Leads and B2B Channel Partners have not been visited or contacted in 14+ days. Add them to today's or tomorrow's Beat Plan to prevent partner churn and lost inquiries.")}
            </p>
          </div>

          <div className="grid gap-3">
            {overdueBacklog.map((account) => (
              <div
                key={account.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {account.entity_type === "b2b_partner" ? (
                      <Badge className="bg-amber-500 text-white text-[10px] font-bold">{t("beat_badge_b2b", "🏢 B2B Partner")}</Badge>
                    ) : (
                      <Badge className="bg-blue-600 text-white text-[10px] font-bold">{t("beat_badge_lead", "👤 Customer Lead")}</Badge>
                    )}

                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{account.title}</span>
                    {account.business_name && (
                      <span className="text-xs text-muted-foreground font-semibold">({account.business_name})</span>
                    )}

                    <Badge variant="destructive" className="text-[10px] font-bold">
                      {account.days_since_last_contact !== null
                        ? t("beat_inactive_days", "🔴 {days} Days Inactive", { days: String(account.days_since_last_contact) })
                        : t("beat_never_contacted", "⚠️ Never Contacted")}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    {account.subtitle} • {account.address?.full_address}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleScheduleFromBacklog(account, "morning")}
                    className="h-8 text-xs font-semibold"
                  >
                    {t("beat_add_morn", "+ Morning")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleScheduleFromBacklog(account, "afternoon")}
                    className="h-8 text-xs font-semibold"
                  >
                    {t("beat_add_aft", "+ Afternoon")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleScheduleFromBacklog(account, "evening")}
                    className="h-8 text-xs font-semibold"
                  >
                    {t("beat_add_eve", "+ Evening")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TERRITORY & ROUTE MAP */}
      {activeTab === "map" && (
        <div className="space-y-4">
          <Card className="overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold">{t("beat_map_title", "Territory Beat Route & Nearby B2B Partners")}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("beat_map_desc", "Showing {stops} scheduled stops in route order + {partners} nearby B2B partner locations", {
                    stops: String(scheduledStops.length),
                    partners: String(nearbyB2BPartners.length),
                  })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> {t("beat_leg_leads", "Customer Leads")}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> {t("beat_leg_b2b", "B2B Partners")}
                </span>
                {technicianLocation && (
                  <span className="flex items-center gap-1.5 font-medium text-sky-600 dark:text-sky-400">
                    <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" /> {t("beat_gps_orig", "GPS Origin")}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fitMapToBounds}
                  className="h-7 px-2 text-xs font-semibold gap-1 text-zinc-700 dark:text-zinc-300"
                >
                  <Locate className="w-3 h-3 text-blue-600" /> {t("beat_fit_view", "Fit View")}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isMapLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={12}
                  onLoad={(map) => setMapInstance(map)}
                  onUnmount={() => setMapInstance(null)}
                  options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                  }}
                >
                  {/* Technician Starting GPS Location */}
                  {technicianLocation?.lat && technicianLocation?.lng && (
                    <MarkerF
                      position={technicianLocation}
                      title={t("beat_tt_origin", "Route Origin (Technician Location)")}
                      label={{
                        text: t("beat_start_pin", "📍 START"),
                        color: "#0369a1",
                        fontWeight: "bold",
                        fontSize: "11px",
                      }}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: "#0284c7",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#ffffff",
                        scale: 9,
                      }}
                    />
                  )}

                  {/* Scheduled Stops (Numbered) */}
                  {scheduledStops.map((stop) => {
                    if (!stop.coordinates?.lat || !stop.coordinates?.lng) return null;
                    const isB2B = stop.entity_type === "b2b_partner";

                    return (
                      <MarkerF
                        key={stop.id}
                        position={stop.coordinates}
                        label={{
                          text: String(stop.route_order || ""),
                          color: "#ffffff",
                          fontWeight: "bold",
                        }}
                        icon={{
                          path: google.maps.SymbolPath.CIRCLE,
                          fillColor: isB2B ? "#f59e0b" : "#2563eb",
                          fillOpacity: 1,
                          strokeWeight: 2,
                          strokeColor: "#ffffff",
                          scale: 14,
                        }}
                        onClick={() => setSelectedMarker(stop)}
                      />
                    );
                  })}

                  {/* Nearby B2B Partners (Prominent Amber Diamonds) */}
                  {nearbyB2BPartners.map((partner) => {
                    if (!partner.coordinates?.lat || !partner.coordinates?.lng) return null;

                    return (
                      <MarkerF
                        key={`nearby-${partner.id}`}
                        position={partner.coordinates}
                        title={`${t("beat_b2b_short", "B2B Partner")}: ${partner.title}`}
                        label={{
                          text: "🏢",
                          fontSize: "12px",
                        }}
                        icon={{
                          path: "M 0,-14 L 14,0 L 0,14 L -14,0 Z", // High-visibility diamond
                          fillColor: "#f59e0b",
                          fillOpacity: 0.95,
                          strokeWeight: 2,
                          strokeColor: "#ffffff",
                          scale: 1.1,
                        }}
                        onClick={() => setSelectedMarker(partner)}
                      />
                    );
                  })}

                  {/* Route Polyline connecting scheduled stops */}
                  {scheduledStops.length > 1 && (
                    <PolylineF
                      path={scheduledStops
                        .filter((s) => s.coordinates?.lat && s.coordinates?.lng)
                        .map((s) => s.coordinates as LatLng)}
                      options={{
                        strokeColor: "#2563eb",
                        strokeOpacity: 0.8,
                        strokeWeight: 4,
                      }}
                    />
                  )}

                  {/* Marker InfoWindow */}
                  {selectedMarker && selectedMarker.coordinates && (
                    <InfoWindowF
                      position={selectedMarker.coordinates}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div className="p-2 max-w-xs text-zinc-900">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm">{selectedMarker.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 font-semibold">
                            {selectedMarker.entity_type === "b2b_partner" ? t("beat_b2b_short", "B2B Partner") : t("beat_lead_short", "Lead")}
                          </span>
                        </div>
                        {selectedMarker.business_name && (
                          <p className="text-xs font-semibold text-zinc-600">{selectedMarker.business_name}</p>
                        )}
                        <p className="text-xs text-zinc-500 mt-1">{selectedMarker.address?.full_address}</p>

                        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                          <button
                            onClick={() => handleScheduleFromBacklog(selectedMarker, "afternoon")}
                            className="text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            {t("beat_add_to_beat", "+ Add to Beat")}
                          </button>
                          <a
                            href={`https://wa.me/91${(selectedMarker.mobile_number || "").replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-emerald-600 hover:underline"
                          >
                            {t("beat_wa_btn", "WhatsApp")}
                          </a>
                        </div>
                      </div>
                    </InfoWindowF>
                  )}
                </GoogleMap>
              ) : (
                <div className="h-[550px] flex items-center justify-center text-sm text-muted-foreground">
                  {t("del_loading_gmaps", "Loading Google Maps...")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* VISIT CHECK-IN MODAL */}
      <Dialog open={!!checkInStop} onOpenChange={(open) => !open && setCheckInStop(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
              <span>{t("beat_modal_title", "Record Visit Check-In:")} {checkInStop?.title}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">{t("beat_acct_biz", "Account / Business")}</p>
              <p className="text-sm font-bold">{checkInStop?.business_name || checkInStop?.title}</p>
              <p className="text-xs text-zinc-500">{checkInStop?.address?.full_address}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                {t("beat_notes_lbl", "Meeting / Survey Outcome Notes:")}
              </label>
              <textarea
                rows={3}
                placeholder={t("beat_notes_ph", "e.g. Handed 10 QR leaflets to partner. Promised 2 upcoming commercial villa CCTV projects next week.")}
                value={checkInNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCheckInNotes(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 p-3 text-xs outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setCheckInStop(null)}>
              {t("del_cancel", "Cancel")}
            </Button>
            <Button
              size="sm"
              onClick={handleCompleteCheckIn}
              disabled={isSubmittingCheckIn}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
            >
              {isSubmittingCheckIn ? t("crm_saving", "Saving...") : t("beat_confirm_checkin", "Confirm Visit Check-In")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
