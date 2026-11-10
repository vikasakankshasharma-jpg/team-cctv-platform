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
import type { BeatStop } from "@/types";

interface BeatPlannerWorkspaceProps {
  isAdmin?: boolean;
}

const TIME_SLOT_CONFIG: Record<string, { label: string; time: string; color: string; icon: string }> = {
  morning: { label: "Morning Slot", time: "09:30 AM – 01:00 PM", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800", icon: "🌅" },
  afternoon: { label: "Afternoon Slot", time: "01:30 PM – 05:00 PM", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800", icon: "☀️" },
  evening: { label: "Evening Slot", time: "05:30 PM – 08:00 PM", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800", icon: "🌆" },
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
        toast.error(data.error || "Failed to load Beat Plan");
      }
    } catch {
      toast.error("Failed to connect to Beat Plan service");
    } finally {
      setLoading(false);
    }
  }, []);

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
      toast.error("No phone number available");
      return;
    }
    const msg = encodeURIComponent(
      stop.entity_type === "b2b_partner"
        ? `Namaste ${stop.title}, I am planning our regular CCTV partner check-in. Looking forward to meeting you today!`
        : `Hello ${stop.title}, regarding your CCTV installation survey inquiry with TEAM CCTV, I am your allocated site executive.`
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
      toast.success("Stop sequence updated");
    } catch {
      toast.error("Failed to save reordered stops");
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
      toast.success(`Removed ${stop.title} from today's beat`);
      fetchBeatPlan(selectedDate);
    } catch {
      toast.error("Failed to unschedule stop");
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
      toast.success(`Added ${stop.title} to ${slot} slot!`);
      fetchBeatPlan(selectedDate);
    } catch {
      toast.error("Failed to add stop to Beat Plan");
    }
  };

  // Smart-Fill Beat with top priority backlog items
  const handleSmartFillBeat = async (countToSchedule: number = 5) => {
    if (overdueBacklog.length === 0) {
      toast.info("No overdue accounts in backlog to schedule.");
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
        toast.success(`⚡ Added ${stopsToSchedule.length} overdue accounts to Beat Plan!`);
        await fetchBeatPlan(selectedDate);
        setActiveTab("schedule");
      } else {
        toast.error(data.error || "Failed to batch schedule stops");
      }
    } catch {
      toast.error("Failed to connect to Beat Plan service");
    } finally {
      setIsSmartFilling(false);
    }
  };

  // Auto-optimize route
  const handleAutoOptimize = async () => {
    if (scheduledStops.length <= 1) {
      toast.info("Add at least 2 stops to optimize route");
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
        toast.success(`Route optimized! Shortest round trip: ${data.result?.totalDistanceKm} km (~${data.result?.estimatedDriveMinutes} mins drive)`);
        fetchBeatPlan(selectedDate);
      } else {
        toast.error(data.error || "Optimization failed");
      }
    } catch {
      toast.error("Failed to optimize route");
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
      toast.success(`Visit check-in recorded for ${checkInStop.title}!`);
      setCheckInStop(null);
      setCheckInNotes("");
      fetchBeatPlan(selectedDate);
    } catch {
      toast.error("Failed to record visit check-in");
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  // Locate technician via GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTechnicianLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success("GPS Location captured as route starting point!");
      },
      (err) => {
        toast.error("GPS error: " + err.message);
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
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {isAdmin ? "Admin Territory Beat Planner" : "My Daily Beat Plan & Client Route"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Unified route optimization for Customer Site Surveys (Leads) & Regular B2B Partner Engagement Visits
          </p>
        </div>

        {/* Date Selector & Auto-Optimize */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 border border-zinc-200 dark:border-zinc-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate((prev) => shiftDateString(prev, -1))}
              className="h-8 px-2 text-xs"
            >
              ◀ Prev
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
              Next ▶
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(todayStr)}
            className={`text-xs font-semibold ${selectedDate === todayStr ? "border-blue-500 text-blue-600" : ""}`}
          >
            Today
          </Button>

          {scheduledStops.length === 0 && overdueBacklog.length > 0 && (
            <Button
              size="sm"
              onClick={() => handleSmartFillBeat(5)}
              disabled={isSmartFilling}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSmartFilling ? "Filling..." : "⚡ Quick-Fill Beat (5)"}
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleAutoOptimize}
            disabled={isOptimizing || scheduledStops.length <= 1}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isOptimizing ? "Optimizing..." : "Auto-Optimize Beat"}
          </Button>

          {summary?.googleNavigationUrl && (
            <a href={summary.googleNavigationUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5">
                <Car className="w-3.5 h-3.5" />
                Navigate in Google Maps
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* KPI METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Scheduled Stops</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{summary?.total_stops || 0}</span>
            <span className="text-xs text-muted-foreground">
              ({summary?.leads_count || 0} Leads • {summary?.partners_count || 0} B2B)
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Overdue Backlog</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-red-600 dark:text-red-400">{summary?.overdue_backlog_count || 0}</span>
            <span className="text-xs text-red-500/80 font-semibold">Needs Touchpoint</span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Beat Pipeline Value</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{(summary?.total_pipeline_value || 0).toLocaleString("en-IN")}
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">GPS Origin</p>
            <p className="text-xs font-semibold mt-1">
              {technicianLocation ? `${technicianLocation.lat.toFixed(4)}, ${technicianLocation.lng.toFixed(4)}` : "Not captured"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLocateMe} className="text-xs h-8 px-2 gap-1 text-blue-600">
            <Locate className="w-3.5 h-3.5" />
            Locate Me
          </Button>
        </Card>
      </div>

      {/* VIEW TABS */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <button
          onClick={() => setActiveTab("schedule")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "schedule"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Day Beat Schedule ({scheduledStops.length})
        </button>

        <button
          onClick={() => setActiveTab("backlog")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "backlog"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Overdue Accounts Backlog ({overdueBacklog.length})
        </button>

        <button
          onClick={() => setActiveTab("map")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "map"
              ? "border-purple-600 text-purple-600 dark:text-purple-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapPin className="w-4 h-4" />
          Territory Route Map ({scheduledStops.length + nearbyB2BPartners.length})
        </button>
      </div>

      {/* TAB 1: DAILY BEAT SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          {scheduledStops.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-zinc-900 border-dashed">
              <p className="text-muted-foreground text-sm font-medium">No stops scheduled for {selectedDate}.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Switch to the <strong>Overdue Accounts Backlog</strong> tab to add pending customer leads or B2B partners to today&apos;s beat, or use Quick-Fill below!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                {overdueBacklog.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => handleSmartFillBeat(5)}
                    disabled={isSmartFilling}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isSmartFilling ? "Filling Beat..." : "⚡ Smart-Fill Today's Beat (5 Accounts)"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("backlog")}
                  className="text-xs font-semibold"
                >
                  Browse Overdue Backlog ({overdueBacklog.length})
                </Button>
              </div>
            </Card>
          ) : (
            ["morning", "afternoon", "evening"].map((slotKey) => {
              const slotStops = stopsBySlot[slotKey] || [];
              const slotConfig = TIME_SLOT_CONFIG[slotKey];

              return (
                <div key={slotKey} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{slotConfig.icon}</span>
                      <h3 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                        {slotConfig.label}
                      </h3>
                      <span className="text-xs text-muted-foreground font-mono">
                        ({slotConfig.time})
                      </span>
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-bold ${slotConfig.color}`}>
                      {slotStops.length} Stop{slotStops.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {slotStops.length === 0 ? (
                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-muted-foreground text-center">
                      No visits scheduled for {slotConfig.label}.
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
                            <div className="flex items-start gap-3.5">
                              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                #{stop.route_order}
                              </span>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {stop.entity_type === "b2b_partner" ? (
                                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold">
                                      🏢 B2B Partner
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold">
                                      👤 Customer Lead
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
                                      ? `Last Visit: ${stop.days_since_last_visit}d ago`
                                      : "⚠️ Never Visited"}
                                  </Badge>

                                  {stop.checkin_at && (
                                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold gap-1">
                                      <CheckCircle className="w-3 h-3" /> Checked In
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-xs text-muted-foreground mt-1">
                                  {stop.subtitle}
                                </p>

                                <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                                  {stop.address?.full_address || "Jaipur Territory"}
                                </p>
                              </div>
                            </div>

                            {/* RIGHT: Quick Action Buttons */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCallClick(stop)}
                                title="Call Customer / Partner"
                                className="h-8 w-8 p-0 text-zinc-700 dark:text-zinc-300 hover:text-blue-600"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWhatsAppClick(stop)}
                                title="Open WhatsApp Chat (Auto-logs touchpoint)"
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
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Check In
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
                                title="Remove from today"
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
              <AlertTriangle className="w-4 h-4" />
              Neglected Accounts Requiring Relationship Visits ({overdueBacklog.length})
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1">
              These Customer Leads and B2B Channel Partners have not been visited or contacted in 14+ days. Add them to today&apos;s or tomorrow&apos;s Beat Plan to prevent partner churn and lost inquiries.
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
                      <Badge className="bg-amber-500 text-white text-[10px] font-bold">🏢 B2B Partner</Badge>
                    ) : (
                      <Badge className="bg-blue-600 text-white text-[10px] font-bold">👤 Customer Lead</Badge>
                    )}

                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{account.title}</span>
                    {account.business_name && (
                      <span className="text-xs text-muted-foreground font-semibold">({account.business_name})</span>
                    )}

                    <Badge variant="destructive" className="text-[10px] font-bold">
                      {account.days_since_last_contact !== null
                        ? `🔴 ${account.days_since_last_contact} Days Inactive`
                        : "⚠️ Never Contacted"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    {account.subtitle} • {account.address?.full_address}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleScheduleFromBacklog(account, "morning")}
                    className="h-8 text-xs font-semibold"
                  >
                    + Morning
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleScheduleFromBacklog(account, "afternoon")}
                    className="h-8 text-xs font-semibold"
                  >
                    + Afternoon
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleScheduleFromBacklog(account, "evening")}
                    className="h-8 text-xs font-semibold"
                  >
                    + Evening
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
            <CardHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Territory Beat Route & Nearby B2B Partners</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing {scheduledStops.length} scheduled stops in route order + {nearbyB2BPartners.length} nearby B2B partner locations
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Customer Leads
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> B2B Partners
                </span>
                {technicianLocation && (
                  <span className="flex items-center gap-1.5 font-medium text-sky-600 dark:text-sky-400">
                    <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" /> GPS Origin
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fitMapToBounds}
                  className="h-7 px-2 text-xs font-semibold gap-1 text-zinc-700 dark:text-zinc-300"
                >
                  <Locate className="w-3 h-3 text-blue-600" /> Fit View
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
                      title="Route Origin (Technician Location)"
                      label={{
                        text: "📍 START",
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
                        title={`B2B Partner: ${partner.title}`}
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
                            {selectedMarker.entity_type === "b2b_partner" ? "B2B Partner" : "Lead"}
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
                            + Add to Beat
                          </button>
                          <a
                            href={`https://wa.me/91${(selectedMarker.mobile_number || "").replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-emerald-600 hover:underline"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    </InfoWindowF>
                  )}
                </GoogleMap>
              ) : (
                <div className="h-[550px] flex items-center justify-center text-sm text-muted-foreground">
                  Loading Google Maps...
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
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              Record Visit Check-In: {checkInStop?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Account / Business</p>
              <p className="text-sm font-bold">{checkInStop?.business_name || checkInStop?.title}</p>
              <p className="text-xs text-zinc-500">{checkInStop?.address?.full_address}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Meeting / Survey Outcome Notes:
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Handed 10 QR leaflets to partner. Promised 2 upcoming commercial villa CCTV projects next week."
                value={checkInNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCheckInNotes(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 p-3 text-xs outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setCheckInStop(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCompleteCheckIn}
              disabled={isSubmittingCheckIn}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
            >
              {isSubmittingCheckIn ? "Saving..." : "Confirm Visit Check-In"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
