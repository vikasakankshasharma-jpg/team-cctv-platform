"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
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
  CheckCircle,
  FileText,
  UserCheck,
  Building,
  Car
} from "lucide-react";
import { GoogleMap, MarkerF, PolylineF, InfoWindowF, useJsApiLoader } from "@react-google-maps/api";
import { toast } from "sonner";
import { 
  optimizeRouteWithTimeWindows, 
  buildGoogleMapsMultiStopUrl, 
  LatLng 
} from "@/lib/routing/optimizer";

interface SalesStop {
  id: string;
  customer_name?: string;
  mobile_number?: string;
  property_type?: string;
  budget?: string;
  camera_count?: number;
  status: string;
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

const TIME_SLOT_LABELS: Record<string, { label: string; time: string; color: string; icon: string }> = {
  morning: { label: "Morning Slot", time: "09:30 AM – 01:00 PM", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: "🌅" },
  afternoon: { label: "Afternoon Slot", time: "01:30 PM – 05:00 PM", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: "☀️" },
  evening: { label: "Evening Slot", time: "05:30 PM – 08:00 PM", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: "🌆" },
};

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "1rem",
};

export function SalesRoutePlannerClient() {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [scheduledStops, setScheduledStops] = useState<SalesStop[]>([]);
  const [pendingPool, setPendingPool] = useState<SalesStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "map">("timeline");
  const [selectedMarker, setSelectedMarker] = useState<SalesStop | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [technicianLocation, setTechnicianLocation] = useState<LatLng | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const fetchRoute = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/salesperson/route?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setScheduledStops(data.scheduledStops || []);
        setPendingPool(data.pendingPool || []);
      } else {
        toast.error(data.error || "Failed to load route");
      }
    } catch {
      toast.error("Failed to connect to sales route service");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoute(selectedDate);
  }, [selectedDate, fetchRoute]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by browser");
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTechnicianLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocatingUser(false);
        toast.success("Current location captured!");
      },
      (err) => {
        setLocatingUser(false);
        toast.error("GPS error: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
      await fetch("/api/salesperson/route", {
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
      toast.error("Failed to save reordering");
      fetchRoute(selectedDate);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSlotChange = async (stopId: string, newSlot: string) => {
    const updated = scheduledStops.map((s) => (s.id === stopId ? { ...s, time_slot: newSlot } : s));
    setScheduledStops(updated);

    try {
      await fetch("/api/salesperson/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          leadId: stopId,
          scheduledDate: selectedDate,
          timeSlot: newSlot,
          routeOrder: updated.find((s) => s.id === stopId)?.route_order || 1,
        }),
      });
      toast.success("Time slot updated");
    } catch {
      toast.error("Failed to update slot");
    }
  };

  const handleUpdateStatus = async (stopId: string, newStatus: string) => {
    setScheduledStops((prev) =>
      prev.map((s) => (s.id === stopId ? { ...s, status: newStatus } : s))
    );

    try {
      const res = await fetch("/api/salesperson/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          leadId: stopId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Status updated to ${newStatus.replace("_", " ").toUpperCase()}`);
      } else {
        toast.error("Failed to update status");
        fetchRoute(selectedDate);
      }
    } catch {
      toast.error("Network error");
      fetchRoute(selectedDate);
    }
  };

  const handleAutoOptimize = async () => {
    if (scheduledStops.length < 2) {
      toast.info("Need at least 2 visits to auto-optimize");
      return;
    }

    setIsOptimizing(true);
    try {
      const { optimizedStops, totalDistanceKm, estimatedDriveMinutes } = optimizeRouteWithTimeWindows(
        scheduledStops,
        technicianLocation
      );

      setScheduledStops(optimizedStops);

      const res = await fetch("/api/salesperson/route", {
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
          `⚡ Client visits sequence optimized! ~${totalDistanceKm} km (${estimatedDriveMinutes} mins drive) sequenced by time slots.`
        );
      } else {
        toast.error("Failed to save optimized sequence");
        fetchRoute(selectedDate);
      }
    } catch {
      toast.error("Optimization failed");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAddToRoute = async (lead: SalesStop, slot: string = "morning") => {
    const newOrder = scheduledStops.length + 1;
    const newStop: SalesStop = {
      ...lead,
      scheduled_date: selectedDate,
      time_slot: slot,
      route_order: newOrder,
    };

    setPendingPool(pendingPool.filter((p) => p.id !== lead.id));
    setScheduledStops([...scheduledStops, newStop]);

    try {
      await fetch("/api/salesperson/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          leadId: lead.id,
          scheduledDate: selectedDate,
          timeSlot: slot,
          routeOrder: newOrder,
        }),
      });
      toast.success(`Visit added to ${TIME_SLOT_LABELS[slot]?.label || slot}`);
    } catch {
      toast.error("Failed to add visit");
      fetchRoute(selectedDate);
    }
  };

  const handleUnschedule = async (stopId: string) => {
    const stopToRemove = scheduledStops.find((s) => s.id === stopId);
    if (!stopToRemove) return;

    setScheduledStops(scheduledStops.filter((s) => s.id !== stopId));
    setPendingPool([stopToRemove, ...pendingPool]);

    try {
      await fetch("/api/salesperson/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unschedule",
          leadId: stopId,
        }),
      });
      toast.info("Moved back to pending pool");
    } catch {
      toast.error("Network error");
      fetchRoute(selectedDate);
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

  const completedCount = useMemo(() => {
    return scheduledStops.filter((s) => s.status === "won" || s.status === "completed" || s.status === "quoted").length;
  }, [scheduledStops]);

  return (
    <div className="space-y-5">
      {/* ── HEADER & DATE SELECTOR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Navigation className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Daily Client Visits Plan
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Plan on-site surveys, customer meetings, and generate instant quotes along your route.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDate === todayStr
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => {
              const tmr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
              setSelectedDate(tmr);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDate !== todayStr && selectedDate === new Date(Date.now() + 86400000).toISOString().split("T")[0]
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
            }`}
          >
            Tomorrow
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ── KPI METRICS STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Scheduled Visits</p>
          <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">{scheduledStops.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Surveys Done / Quoted</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {completedCount} <span className="text-xs font-semibold text-zinc-400">/ {scheduledStops.length}</span>
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Active Pipeline</p>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
            {pendingPool.length} <span className="text-xs font-normal">leads</span>
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Visit Status</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
            {scheduledStops.filter((s) => s.status === "site_visit" || s.status === "en_route").length} Active
          </p>
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
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>Start Client Route ({scheduledStops.length} Visits)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          ) : (
            <div className="text-xs text-zinc-400 italic flex items-center gap-1.5 p-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Add visits to enable 1-tap route navigation.</span>
            </div>
          )}

          {scheduledStops.length >= 2 && (
            <button
              onClick={handleAutoOptimize}
              disabled={isOptimizing}
              className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all disabled:opacity-50"
              title="Optimize order by time slots and driving distance"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isOptimizing ? "Optimizing..." : "⚡ Auto-Optimize (Time + Distance)"}</span>
            </button>
          )}

          <button
            onClick={handleLocateMe}
            disabled={locatingUser}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs border transition-all ${
              technicianLocation
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <Locate className={`w-3.5 h-3.5 ${locatingUser ? "animate-spin" : ""}`} />
            <span>{technicianLocation ? "📍 Location Synced" : "Locate Me"}</span>
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
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "map"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400 space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold">Loading client visits...</p>
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
                    fillColor: "#2563EB",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 3,
                  }}
                  title="Sales Executive / You"
                />
              )}

              {scheduledStops.map((stop, idx) => {
                if (!stop.coordinates?.lat || !stop.coordinates?.lng) return null;
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
                options={{ strokeColor: "#2563EB", strokeOpacity: 0.8, strokeWeight: 4 }}
              />

              {selectedMarker && selectedMarker.coordinates && (
                <InfoWindowF
                  position={selectedMarker.coordinates}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="p-2 text-zinc-900 max-w-[220px]">
                    <p className="font-bold text-xs text-blue-600">
                      Visit #{scheduledStops.findIndex((s) => s.id === selectedMarker.id) + 1}
                    </p>
                    <p className="font-bold text-sm mt-0.5">{selectedMarker.customer_name}</p>
                    <p className="text-[11px] text-zinc-600 mt-1">
                      {selectedMarker.property_type} • {selectedMarker.camera_count} Cameras
                    </p>
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500">
              Loading Google Maps...
            </div>
          )}
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className="space-y-4">
          {scheduledStops.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-2">
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No client visits scheduled for {selectedDate}</p>
              <p className="text-xs text-zinc-400">Add prospects from your Active Leads below.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledStops.map((stop, index) => {
                const slotInfo = TIME_SLOT_LABELS[stop.time_slot || "morning"] || TIME_SLOT_LABELS.morning;
                const isQuoted = stop.status === "quoted" || stop.status === "won";
                const isSiteVisit = stop.status === "site_visit";
                const isEnRoute = stop.status === "en_route";
                const phone = stop.mobile_number || "";

                return (
                  <div
                    key={stop.id}
                    className={`bg-white dark:bg-zinc-900 border rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isQuoted
                        ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50"
                    }`}
                  >
                    {/* Left: Sequence, Customer, Property & Budget */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 shadow-sm ${
                        isQuoted
                          ? "bg-emerald-600 text-white shadow-emerald-500/20"
                          : "bg-blue-600 text-white shadow-blue-500/20"
                      }`}>
                        {isQuoted ? <CheckCircle className="w-5 h-5" /> : `#${index + 1}`}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${slotInfo.color}`}
                          >
                            {slotInfo.icon} {slotInfo.label} ({slotInfo.time})
                          </span>

                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase">
                            {stop.property_type || "Commercial"}
                          </span>

                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            isQuoted ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" :
                            isSiteVisit ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 animate-pulse" :
                            isEnRoute ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                            "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}>
                            {isQuoted ? "Quoted" : isSiteVisit ? "On-Site Survey" : isEnRoute ? "En Route" : stop.status}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                          {stop.customer_name}
                        </h3>

                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          🎯 Requirements: {stop.camera_count || 4} Cameras • Budget: {stop.budget}
                        </p>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>
                            {stop.address?.street || "Customer Site"}, {stop.address?.city || "Jaipur"}{" "}
                            {stop.address?.pincode ? `(${stop.address.pincode})` : ""}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Middle: On-Site Status & Create Quote CTA */}
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                      {!isQuoted && !isSiteVisit && !isEnRoute && (
                        <button
                          onClick={() => handleUpdateStatus(stop.id, "en_route")}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 text-amber-700 dark:text-amber-400 text-xs font-bold transition-colors inline-flex items-center gap-1 border border-amber-200 dark:border-amber-800/40"
                        >
                          <Car className="w-3.5 h-3.5" />
                          <span>En Route</span>
                        </button>
                      )}

                      {isEnRoute && (
                        <button
                          onClick={() => handleUpdateStatus(stop.id, "site_visit")}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 text-blue-700 dark:text-blue-400 text-xs font-bold transition-colors inline-flex items-center gap-1 border border-blue-200 dark:border-blue-800/40"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Arrived</span>
                        </button>
                      )}

                      {/* 1-Tap Create Instant Quote */}
                      <Link
                        href={`/salesperson/create-quote?leadId=${stop.id}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Create Quote</span>
                      </Link>
                    </div>

                    {/* Right: Slot Modifier & Communications */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                      <select
                        value={stop.time_slot || "morning"}
                        onChange={(e) => handleSlotChange(stop.id, e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 focus:outline-hidden"
                      >
                        <option value="morning">🌅 Morning</option>
                        <option value="afternoon">☀️ Afternoon</option>
                        <option value="evening">🌆 Evening</option>
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
                          title="Navigate"
                        >
                          <Navigation className="w-4 h-4" />
                        </a>
                      ) : null}

                      {phone && (
                        <a
                          href={`tel:${phone}`}
                          className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 transition-colors"
                          title="Call Customer"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}

                      {phone && (
                        <a
                          href={`https://wa.me/91${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Hello ${stop.customer_name}, I am your TEAM CCTV security consultant. I am scheduled for your site survey & camera demo during your ${slotInfo.label} (${slotInfo.time}) today.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors"
                          title="WhatsApp Customer"
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

      {/* ── PENDING LEADS POOL ── */}
      <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
          Unscheduled Pipeline Leads ({pendingPool.length} Prospects)
        </h2>

        {pendingPool.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">No unscheduled leads awaiting site visits.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingPool.map((lead) => (
              <div
                key={lead.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl space-y-2 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase">
                      {lead.property_type || "Commercial"}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">#{lead.id.slice(0, 6)}</span>
                  </div>
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{lead.customer_name}</h4>
                  <p className="text-[11px] text-zinc-500 line-clamp-1">
                    {lead.address?.street || "Site address"}, {lead.address?.city || "Jaipur"}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-zinc-400">Schedule:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAddToRoute(lead, "morning")}
                      className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-[10px] font-bold"
                    >
                      🌅 Morn
                    </button>
                    <button
                      onClick={() => handleAddToRoute(lead, "afternoon")}
                      className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-[10px] font-bold"
                    >
                      ☀️ Aft
                    </button>
                    <button
                      onClick={() => handleAddToRoute(lead, "evening")}
                      className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-600 text-[10px] font-bold"
                    >
                      🌆 Eve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
