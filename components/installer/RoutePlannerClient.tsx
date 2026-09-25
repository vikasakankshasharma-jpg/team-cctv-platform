"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Navigation, 
  Phone, 
  MessageSquare, 
  ChevronUp, 
  ChevronDown, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ExternalLink,
  Layers,
  ListOrdered,
  ArrowRight
} from "lucide-react";
import { GoogleMap, MarkerF, PolylineF, InfoWindowF, useJsApiLoader } from "@react-google-maps/api";
import { toast } from "sonner";

interface RouteStop {
  id: string;
  customer_name?: string;
  mobile_number?: string;
  property_type?: string;
  status?: string;
  scheduled_date?: string;
  time_slot?: "morning" | "afternoon" | "evening" | string;
  route_order?: number;
  address?: {
    street?: string;
    area?: string;
    city?: string;
    pincode?: string;
    coordinates?: { lat: number; lng: number };
    map_url?: string;
  };
  billing_details?: {
    customer_name?: string;
    phone?: string;
    address_line1?: string;
    city?: string;
    pincode?: string;
    coordinates?: { lat: number; lng: number };
  };
  coordinates?: { lat: number; lng: number } | null;
  map_url?: string | null;
}

const TIME_SLOT_LABELS: Record<string, { label: string; time: string; color: string; icon: string }> = {
  morning: { label: "Morning Slot", time: "09:30 AM – 01:00 PM", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: "🌅" },
  afternoon: { label: "Afternoon Slot", time: "01:30 PM – 05:00 PM", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: "☀️" },
  evening: { label: "Evening Slot", time: "05:30 PM – 08:00 PM", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: "🌆" },
};

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "1rem",
};

export function RoutePlannerClient() {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [scheduledStops, setScheduledStops] = useState<RouteStop[]>([]);
  const [pendingPool, setPendingPool] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "map">("timeline");
  const [selectedMarker, setSelectedMarker] = useState<RouteStop | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const fetchRoute = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/installer/route?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setScheduledStops(data.scheduledStops || []);
        setPendingPool(data.pendingPool || []);
      } else {
        toast.error(data.error || "Failed to load route data");
      }
    } catch (e: any) {
      toast.error("Failed to connect to route service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute(selectedDate);
  }, [selectedDate]);

  // Reorder stops (move stop up or down)
  const handleMoveStop = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= scheduledStops.length) return;

    const newStops = [...scheduledStops];
    const [moved] = newStops.splice(index, 1);
    newStops.splice(targetIndex, 0, moved);

    // Re-index route_order sequentially 1, 2, 3...
    const updated = newStops.map((stop, idx) => ({
      ...stop,
      route_order: idx + 1,
    }));

    setScheduledStops(updated); // Optimistic UI update

    try {
      setIsSaving(true);
      const res = await fetch("/api/installer/route", {
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
      const data = await res.json();
      if (!data.success) {
        toast.error("Failed to persist reordering");
        fetchRoute(selectedDate); // Revert
      }
    } catch {
      toast.error("Network error saving route");
      fetchRoute(selectedDate);
    } finally {
      setIsSaving(false);
    }
  };

  // Change a stop's time slot
  const handleSlotChange = async (stopId: string, newSlot: string) => {
    const updated = scheduledStops.map((s) => (s.id === stopId ? { ...s, time_slot: newSlot } : s));
    setScheduledStops(updated);

    try {
      await fetch("/api/installer/route", {
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
      toast.error("Failed to update time slot");
    }
  };

  // Move a stop from pending pool into today's route
  const handleAddToRoute = async (lead: RouteStop, slot: string = "morning") => {
    const newOrder = scheduledStops.length + 1;
    const newStop: RouteStop = {
      ...lead,
      scheduled_date: selectedDate,
      time_slot: slot,
      route_order: newOrder,
    };

    setPendingPool(pendingPool.filter((p) => p.id !== lead.id));
    setScheduledStops([...scheduledStops, newStop]);

    try {
      const res = await fetch("/api/installer/route", {
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
      const data = await res.json();
      if (data.success) {
        toast.success(`Stop added to ${TIME_SLOT_LABELS[slot]?.label || slot}`);
      } else {
        toast.error("Failed to add stop");
        fetchRoute(selectedDate);
      }
    } catch {
      toast.error("Network error");
      fetchRoute(selectedDate);
    }
  };

  // Unschedule a stop back to pool
  const handleUnschedule = async (stopId: string) => {
    const stopToRemove = scheduledStops.find((s) => s.id === stopId);
    if (!stopToRemove) return;

    setScheduledStops(scheduledStops.filter((s) => s.id !== stopId));
    setPendingPool([stopToRemove, ...pendingPool]);

    try {
      const res = await fetch("/api/installer/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unschedule",
          leadId: stopId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.info("Stop moved back to pending list");
      }
    } catch {
      toast.error("Network error");
      fetchRoute(selectedDate);
    }
  };

  // Construct Multi-Stop Google Maps Directions Link
  const fullGoogleMapsRouteUrl = useMemo(() => {
    const validCoordsStops = scheduledStops.filter(
      (s) => s.coordinates && typeof s.coordinates.lat === "number" && typeof s.coordinates.lng === "number"
    );

    if (validCoordsStops.length === 0) return null;

    if (validCoordsStops.length === 1) {
      const c = validCoordsStops[0].coordinates!;
      return `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;
    }

    const destination = validCoordsStops[validCoordsStops.length - 1].coordinates!;
    const waypoints = validCoordsStops
      .slice(0, validCoordsStops.length - 1)
      .map((s) => `${s.coordinates!.lat},${s.coordinates!.lng}`)
      .join("|");

    return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&waypoints=${waypoints}`;
  }, [scheduledStops]);

  // Center coordinates for map view
  const defaultCenter = useMemo(() => {
    const firstWithCoords = scheduledStops.find((s) => s.coordinates?.lat && s.coordinates?.lng);
    if (firstWithCoords?.coordinates) {
      return firstWithCoords.coordinates;
    }
    return { lat: 26.9124, lng: 75.7873 }; // Jaipur center
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
              Daily Route Plan
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Optimized travel schedule with live map navigation and slot sequencing.
          </p>
        </div>

        {/* Date Selector Tabs */}
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

      {/* ── ACTION BAR (Navigation CTA + View Mode Switcher) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Full Route Navigation Button */}
        {fullGoogleMapsRouteUrl ? (
          <a
            href={fullGoogleMapsRouteUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>Start Daily Route ({scheduledStops.length} Stops)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        ) : (
          <div className="text-xs text-zinc-400 italic flex items-center gap-1.5 p-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Add stops with pin location to enable 1-tap route navigation.</span>
          </div>
        )}

        {/* View Toggle */}
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

      {/* ── MAIN CONTENT: TIMELINE OR MAP ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400 space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold">Loading daily itinerary...</p>
        </div>
      ) : activeTab === "map" ? (
        /* MAP VIEW */
        <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm relative">
          {isMapLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={12}
              options={{
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
              }}
            >
              {/* Stop Markers */}
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

              {/* Connecting Polyline Route */}
              <PolylineF
                path={scheduledStops
                  .filter((s) => s.coordinates?.lat && s.coordinates?.lng)
                  .map((s) => s.coordinates!)}
                options={{
                  strokeColor: "#2563EB",
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                }}
              />

              {/* Marker Info Window */}
              {selectedMarker && selectedMarker.coordinates && (
                <InfoWindowF
                  position={selectedMarker.coordinates}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="p-2 text-zinc-900 max-w-[220px]">
                    <p className="font-bold text-xs text-blue-600">
                      Stop #{scheduledStops.findIndex((s) => s.id === selectedMarker.id) + 1} •{" "}
                      {TIME_SLOT_LABELS[selectedMarker.time_slot || "morning"]?.label}
                    </p>
                    <p className="font-bold text-sm mt-0.5">{selectedMarker.customer_name || "Customer"}</p>
                    <p className="text-[11px] text-zinc-600 mt-1 line-clamp-2">
                      {selectedMarker.address?.street || selectedMarker.billing_details?.address_line1 || "Jaipur"}
                    </p>
                    {selectedMarker.mobile_number && (
                      <a
                        href={`tel:${selectedMarker.mobile_number}`}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-2"
                      >
                        <Phone className="w-3 h-3" /> Call {selectedMarker.mobile_number}
                      </a>
                    )}
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
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No jobs scheduled for {selectedDate}</p>
              <p className="text-xs text-zinc-400">
                Pick jobs from your Pending Pool below to construct your route for this date.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledStops.map((stop, index) => {
                const slotInfo = TIME_SLOT_LABELS[stop.time_slot || "morning"] || TIME_SLOT_LABELS.morning;
                const custName = stop.customer_name || stop.billing_details?.customer_name || "Valued Customer";
                const phone = stop.mobile_number || stop.billing_details?.phone || "";
                const addressStr =
                  stop.address?.street ||
                  stop.billing_details?.address_line1 ||
                  `${stop.address?.area || ""}, ${stop.address?.city || "Jaipur"}`;
                const pincode = stop.address?.pincode || stop.billing_details?.pincode;

                return (
                  <div
                    key={stop.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-blue-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Stop Index & Core Details */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Sequence Badge */}
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                        #{index + 1}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${slotInfo.color}`}
                          >
                            {slotInfo.icon} {slotInfo.label} ({slotInfo.time})
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase">
                            {stop.property_type || "Residential"}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                          {custName}
                        </h3>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>
                            {addressStr} {pincode ? `(${pincode})` : ""}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Middle: Slot Modifier & Quick Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                      {/* Change Slot */}
                      <select
                        value={stop.time_slot || "morning"}
                        onChange={(e) => handleSlotChange(stop.id, e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 focus:outline-hidden"
                      >
                        <option value="morning">🌅 Morning (09:30-01:00)</option>
                        <option value="afternoon">☀️ Afternoon (01:30-05:00)</option>
                        <option value="evening">🌆 Evening (05:30-08:00)</option>
                      </select>

                      {/* Direct Navigation */}
                      {stop.map_url || stop.coordinates ? (
                        <a
                          href={
                            stop.map_url ||
                            `https://maps.google.com/?q=${stop.coordinates?.lat},${stop.coordinates?.lng}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 text-blue-600 dark:text-blue-400 transition-colors"
                          title="Navigate to Stop"
                        >
                          <Navigation className="w-4 h-4" />
                        </a>
                      ) : null}

                      {/* Call */}
                      {phone && (
                        <a
                          href={`tel:${phone}`}
                          className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 transition-colors"
                          title="Call Customer"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}

                      {/* WhatsApp */}
                      {phone && (
                        <a
                          href={`https://wa.me/91${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Hello ${custName}, I am your assigned TEAM CCTV technician. I am scheduled to arrive during your ${slotInfo.label} (${slotInfo.time}) today.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors"
                          title="WhatsApp Customer"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}

                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-700 pl-2 ml-1">
                        <button
                          onClick={() => handleMoveStop(index, "up")}
                          disabled={index === 0 || isSaving}
                          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition-colors"
                          title="Move Earlier in Route"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveStop(index, "down")}
                          disabled={index === scheduledStops.length - 1 || isSaving}
                          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition-colors"
                          title="Move Later in Route"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Unschedule */}
                      <button
                        onClick={() => handleUnschedule(stop.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors"
                        title="Remove from Today's Route"
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

      {/* ── UNSCHEDULED / PENDING LEADS POOL ── */}
      <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              Pending Queue ({pendingPool.length} Unscheduled Leads)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Leads assigned to you that are awaiting a site visit or installation slot.
            </p>
          </div>
        </div>

        {pendingPool.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">No unscheduled leads in your queue.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingPool.map((lead) => {
              const custName = lead.customer_name || lead.billing_details?.customer_name || "Lead";
              const addressStr =
                lead.address?.street ||
                lead.billing_details?.address_line1 ||
                `${lead.address?.area || ""}, ${lead.address?.city || "Jaipur"}`;

              return (
                <div
                  key={lead.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl space-y-2 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase">
                        {lead.property_type || "Residential"}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">#{lead.id.slice(0, 6)}</span>
                    </div>
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{custName}</h4>
                    <p className="text-[11px] text-zinc-500 line-clamp-1">{addressStr}</p>
                  </div>

                  {/* Add to Date Quick Buttons */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-zinc-400">Add to:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAddToRoute(lead, "morning")}
                        className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold transition-colors"
                      >
                        🌅 Morn
                      </button>
                      <button
                        onClick={() => handleAddToRoute(lead, "afternoon")}
                        className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold transition-colors"
                      >
                        ☀️ Aft
                      </button>
                      <button
                        onClick={() => handleAddToRoute(lead, "evening")}
                        className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold transition-colors"
                      >
                        🌆 Eve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
