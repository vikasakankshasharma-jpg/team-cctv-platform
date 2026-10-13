"use client";

import { useState } from "react";
import { 
  Users, 
  Target, 
  Bell, 
  MapPin, 
  Search, 
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Plus,
  RefreshCw,
  Power,
  Check,
  X
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  type StateItem, 
  type DistrictItem, 
  type TehsilItem, 
  type PincodeItem, 
  type HierarchySummary, 
  type PincodeStatus,
  type HierarchyStatus,
  computeAggregateStatus
} from "@/lib/geo/geoHierarchy";

export interface WaitlistLead {
  id: string;
  customer_name: string;
  mobile_number: string;
  detected_pincode: string;
  detected_tehsil?: string;
  detected_city: string;
  detected_district?: string;
  detected_state?: string;
  detected_city_slug: string;
  waitlist_confirmed: boolean;
  created_at: string | null;
}

export interface ServiceArea {
  id: string;
  city: string;
  waitlist_count: number;
  served: boolean;
}

export interface Impression {
  city: string;
  pincode: string;
}

interface ExpansionClientProps {
  initialLeads: WaitlistLead[];
  initialTree: StateItem[];
  initialSummary: HierarchySummary;
  initialServiceAreas: ServiceArea[];
  initialImpressions?: Impression[];
}

export default function ExpansionClient({
  initialLeads,
  initialTree,
  initialSummary,
  initialServiceAreas,
  initialImpressions = []
}: ExpansionClientProps) {
  // Active Tab: "hierarchy" | "crm"
  const [activeTab, setActiveTab] = useState<"hierarchy" | "crm">("hierarchy");

  // Hierarchy State
  const [tree, setTree] = useState<StateItem[]>(initialTree);
  const [summary, setSummary] = useState<HierarchySummary>(initialSummary);
  const [searchPin, setSearchPin] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "waitlist">("all");
  const [selectedStateFilter, setSelectedStateFilter] = useState("all");
  
  // Accordion Expand/Collapse sets
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set(initialTree.map(s => s.name)));
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set(initialTree.flatMap(s => s.districts.map(d => `${s.name}__${d.name}`))));
  
  // Actions loading state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: "success" | "error" } | null>(null);

  // Add PIN Modal State
  const [isAddPinOpen, setIsAddPinOpen] = useState(false);
  const [newPinState, setNewPinState] = useState("Rajasthan");
  const [newPinDistrict, setNewPinDistrict] = useState("Jaipur");
  const [newPinTehsil, setNewPinTehsil] = useState("Jaipur Urban");
  const [newPinCode, setNewPinCode] = useState("");
  const [newPinName, setNewPinName] = useState("");
  const [newPinStatus, setNewPinStatus] = useState<PincodeStatus>("inactive");

  // CRM State
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [notifyFilter, setNotifyFilter] = useState("all");
  const [appointedCity, setAppointedCity] = useState<string | null>(null);

  const showToast = (title: string, desc: string, type: "success" | "error" = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const toggleStateExpand = (stateName: string) => {
    setExpandedStates(prev => {
      const next = new Set(prev);
      if (next.has(stateName)) next.delete(stateName);
      else next.add(stateName);
      return next;
    });
  };

  const toggleDistrictExpand = (key: string) => {
    setExpandedDistricts(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Group impressions by city for CRM density tracker
  const impressionGroups = initialImpressions.reduce((acc, imp) => {
    const city = imp.city.charAt(0).toUpperCase() + imp.city.slice(1).toLowerCase();
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group leads by city and status for CRM
  const cityIntentGroups = initialLeads.reduce((acc, lead) => {
    const city = lead.detected_city;
    if (!acc[city]) acc[city] = { intent: 0, confirmed: 0 };
    if (lead.waitlist_confirmed) acc[city].confirmed += 1;
    else acc[city].intent += 1;
    return acc;
  }, {} as Record<string, { intent: number; confirmed: number }>);

  // Calculate Demand Score for each city
  const cityScores: Record<string, number> = {};
  const allCities = new Set([...Object.keys(cityIntentGroups), ...Object.keys(impressionGroups)]);
  allCities.forEach(city => {
    const impressions = impressionGroups[city] || 0;
    const intent = cityIntentGroups[city]?.intent || 0;
    const confirmed = cityIntentGroups[city]?.confirmed || 0;
    cityScores[city] = (impressions * 0.2) + (intent * 0.5) + (confirmed * 0.8);
  });

  let topCity = "None";
  let topScore = 0;
  Object.entries(cityScores).forEach(([city, score]) => {
    if (score > topScore) {
      topCity = city;
      topScore = score;
    }
  });

  const totalConfirmedWaitlist = initialLeads.filter(l => l.waitlist_confirmed).length;

  // Filtered Leads for CRM Tab
  const filteredLeads = initialLeads.filter(lead => {
    const matchesSearch = 
      lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.mobile_number.includes(searchTerm) ||
      lead.detected_pincode.includes(searchTerm) ||
      (lead.detected_tehsil || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = cityFilter === "all" || lead.detected_city_slug === cityFilter;
    const matchesNotify = 
      notifyFilter === "all" || 
      (notifyFilter === "confirmed" && lead.waitlist_confirmed) ||
      (notifyFilter === "pending" && !lead.waitlist_confirmed);

    return matchesSearch && matchesCity && matchesNotify;
  });

  // Toggle single PINCODE status
  const handleTogglePin = async (
    pin: PincodeItem,
    targetStatus: PincodeStatus
  ) => {
    const loadingKey = `pin_${pin.pincode}`;
    setActionLoading(loadingKey);

    try {
      const res = await fetch("/api/admin/geo/hierarchy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_pin",
          pincode: pin.pincode,
          status: targetStatus,
          name: pin.name,
          tehsil: pin.tehsil,
          district: pin.district,
          state: pin.state
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed");

      // Optimistically update local tree
      setTree(prevTree => {
        return prevTree.map(state => {
          if (state.name !== pin.state) return state;
          const updatedDistricts = state.districts.map(district => {
            if (district.name !== pin.district) return district;
            const updatedTehsils = district.tehsils.map(tehsil => {
              if (tehsil.name !== pin.tehsil) return tehsil;
              const updatedPins = tehsil.pincodes.map(p => {
                if (p.pincode === pin.pincode) {
                  return { ...p, status: targetStatus, last_updated: new Date().toISOString() };
                }
                return p;
              });
              const activeCount = updatedPins.filter(p => p.status === "active").length;
              return {
                ...tehsil,
                active_count: activeCount,
                status: computeAggregateStatus(activeCount, updatedPins.length),
                pincodes: updatedPins
              };
            });
            const distActive = updatedTehsils.reduce((a, b) => a + b.active_count, 0);
            return {
              ...district,
              active_count: distActive,
              status: computeAggregateStatus(distActive, district.total_count),
              tehsils: updatedTehsils
            };
          });
          const stateActive = updatedDistricts.reduce((a, b) => a + b.active_count, 0);
          return {
            ...state,
            active_count: stateActive,
            status: computeAggregateStatus(stateActive, state.total_count),
            districts: updatedDistricts
          };
        });
      });

      // Update Summary counts
      setSummary(prev => ({
        ...prev,
        active_pincodes: targetStatus === "active" ? prev.active_pincodes + 1 : prev.active_pincodes - 1,
        inactive_pincodes: targetStatus === "inactive" ? prev.inactive_pincodes + 1 : prev.inactive_pincodes - 1,
      }));

      showToast(
        `PIN ${pin.pincode} ${targetStatus === "active" ? "Activated" : "Deactivated"}`,
        `Installation status for ${pin.name} updated to ${targetStatus.toUpperCase()}.`
      );
    } catch (err: any) {
      console.error("Toggle pin error:", err);
      showToast("Update Failed", err.message || "Failed to update PIN status", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk Toggle all PINs in a Tehsil
  const handleToggleTehsil = async (
    tehsil: TehsilItem,
    districtName: string,
    stateName: string,
    targetStatus: PincodeStatus
  ) => {
    const loadingKey = `tehsil_${districtName}_${tehsil.name}`;
    setActionLoading(loadingKey);

    const pinList = tehsil.pincodes.map(p => p.pincode);

    try {
      const res = await fetch("/api/admin/geo/hierarchy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_tehsil",
          state: stateName,
          district: districtName,
          tehsil: tehsil.name,
          status: targetStatus,
          pincodes: pinList,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Bulk update failed");

      // Optimistically update local tree
      setTree(prevTree => {
        return prevTree.map(state => {
          if (state.name !== stateName) return state;
          const updatedDistricts = state.districts.map(district => {
            if (district.name !== districtName) return district;
            const updatedTehsils = district.tehsils.map(t => {
              if (t.name !== tehsil.name) return t;
              const updatedPins = t.pincodes.map(p => ({
                ...p,
                status: targetStatus,
                last_updated: new Date().toISOString(),
              }));
              const activeCount = targetStatus === "active" ? updatedPins.length : 0;
              return {
                ...t,
                active_count: activeCount,
                status: targetStatus,
                pincodes: updatedPins,
              };
            });
            const distActive = updatedTehsils.reduce((a, b) => a + b.active_count, 0);
            return {
              ...district,
              active_count: distActive,
              status: computeAggregateStatus(distActive, district.total_count),
              tehsils: updatedTehsils,
            };
          });
          const stateActive = updatedDistricts.reduce((a, b) => a + b.active_count, 0);
          return {
            ...state,
            active_count: stateActive,
            status: computeAggregateStatus(stateActive, state.total_count),
            districts: updatedDistricts,
          };
        });
      });

      showToast(
        `Tehsil ${tehsil.name} Bulk Updated`,
        `All ${pinList.length} PIN codes set to ${targetStatus.toUpperCase()}.`
      );
    } catch (err: any) {
      console.error("Bulk toggle tehsil error:", err);
      showToast("Bulk Update Failed", err.message || "Failed to update tehsil", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Add new PIN to hierarchy
  const handleAddPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newPinCode.trim())) {
      showToast("Invalid PINCODE", "Must be a 6-digit Indian PIN code.", "error");
      return;
    }

    setActionLoading("add_pin");
    try {
      const res = await fetch("/api/admin/geo/hierarchy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_pin",
          pincode: newPinCode.trim(),
          name: newPinName.trim() || `Pincode ${newPinCode.trim()}`,
          state: newPinState.trim(),
          district: newPinDistrict.trim(),
          tehsil: newPinTehsil.trim(),
          status: newPinStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to add PIN");

      showToast("Pincode Registered", `PIN ${newPinCode} added to ${newPinTehsil}, ${newPinDistrict}.`);
      setIsAddPinOpen(false);
      setNewPinCode("");
      setNewPinName("");

      // Refresh entire tree in background
      const refreshRes = await fetch("/api/admin/geo/hierarchy");
      if (refreshRes.ok) {
        const freshData = await refreshRes.json();
        if (freshData.tree) {
          setTree(freshData.tree);
          setSummary(freshData.summary);
        }
      }
    } catch (err: any) {
      showToast("Error Registering PIN", err.message || "Could not register PIN", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAppointInstaller = async (citySlug: string, cityName: string) => {
    setActionLoading(citySlug);
    try {
      const res = await fetch("/api/admin/coverage-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cityName,
          slug: citySlug,
          type: "installer_hub",
          status: "pending_installer",
          created_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to create hub");

      setAppointedCity(cityName);
      setTimeout(() => setAppointedCity(null), 5000);
    } catch (error) {
      console.error("Appoint installer failed:", error);
      setAppointedCity(null);
    } finally {
      setActionLoading(null);
    }
  };

  // Hierarchy search filtering
  const filteredTree = tree
    .filter(state => selectedStateFilter === "all" || state.name.toLowerCase() === selectedStateFilter.toLowerCase())
    .map(state => {
      const matchingDistricts = state.districts.map(district => {
        const matchingTehsils = district.tehsils.map(tehsil => {
          const matchingPins = tehsil.pincodes.filter(pin => {
            const query = searchPin.toLowerCase().trim();
            const matchesQuery = 
              !query || 
              pin.pincode.includes(query) || 
              pin.name.toLowerCase().includes(query) ||
              tehsil.name.toLowerCase().includes(query) ||
              district.name.toLowerCase().includes(query);

            const matchesStatus = 
              statusFilter === "all" ||
              (statusFilter === "active" && pin.status === "active") ||
              (statusFilter === "inactive" && pin.status === "inactive") ||
              (statusFilter === "waitlist" && pin.waitlist_count > 0);

            return matchesQuery && matchesStatus;
          });

          return { ...tehsil, pincodes: matchingPins };
        }).filter(tehsil => tehsil.pincodes.length > 0 || !searchPin);

        return { ...district, tehsils: matchingTehsils };
      }).filter(district => district.tehsils.length > 0 || !searchPin);

      return { ...state, districts: matchingDistricts };
    }).filter(state => state.districts.length > 0 || !searchPin);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={`fixed bottom-6 right-6 z-[120] text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 ${
            toastMessage.type === "success" ? "bg-emerald-600 dark:bg-emerald-700" : "bg-red-600 dark:bg-red-700"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{toastMessage.title}</span>
            <span className="text-xs opacity-90">{toastMessage.desc}</span>
          </div>
        </div>
      )}

      {/* Appointed Notification Toast */}
      {appointedCity && (
        <div className="fixed bottom-6 right-6 z-[100] bg-success text-success-foreground px-5 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Installer Hub Created</span>
            <span className="text-xs opacity-90">Installer hub setup initiated for {appointedCity}.</span>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Active Coverage PINs</div>
          <div className="kpi-value text-emerald-600 dark:text-emerald-400">
            {summary.active_pincodes}
          </div>
          <div className="kpi-delta positive">
            {summary.total_pincodes > 0 
              ? `${Math.round((summary.active_pincodes / summary.total_pincodes) * 100)}% of tracked territory served`
              : "Active hubs"}
          </div>
          <div className="kpi-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-label">Expansion Target PINs</div>
          <div className="kpi-value text-amber-600 dark:text-amber-400">
            {summary.inactive_pincodes}
          </div>
          <div className="kpi-delta neutral">Unserved / Inactive waitlist pipeline</div>
          <div className="kpi-icon" style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-label">Total Waitlist Prospects</div>
          <div className="kpi-value">{initialLeads.length}</div>
          <div className="kpi-delta neutral">Enrolled across unserved regions</div>
          <div className="kpi-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-label">Top Demand Hub</div>
          <div className="kpi-value">{topCity !== "None" ? topCity : "N/A"}</div>
          <div className="kpi-delta neutral">Highest demand score ({topScore.toFixed(1)})</div>
          <div className="kpi-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Top Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("hierarchy")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "hierarchy"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]"
            }`}
          >
            <Layers className="w-4 h-4" />
            Administrative Geo Hierarchy
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold">
              {summary.total_pincodes} PINs
            </span>
          </button>

          <button
            onClick={() => setActiveTab("crm")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "crm"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]"
            }`}
          >
            <Users className="w-4 h-4" />
            Waitlist CRM & Regional Hubs
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-[var(--surface2)] text-[var(--text)] font-bold">
              {initialLeads.length} Leads
            </span>
          </button>
        </div>

        {activeTab === "hierarchy" && (
          <button
            onClick={() => setIsAddPinOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Add PIN Code
          </button>
        )}
      </div>

      {/* TAB 1: ADMINISTRATIVE GEO HIERARCHY */}
      {activeTab === "hierarchy" && (
        <div className="space-y-6">
          {/* Hierarchy Filter Bar */}
          <div className="panel p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by PINCODE (e.g. 302001), Locality, Tehsil, District..."
                value={searchPin}
                onChange={(e) => setSearchPin(e.target.value)}
                className="pl-9 bg-background border-border shadow-sm text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full appearance-none h-10 bg-background border border-border text-foreground rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring shadow-sm font-medium"
              >
                <option value="all">All Statuses ({summary.total_pincodes})</option>
                <option value="active">Active Only ({summary.active_pincodes})</option>
                <option value="inactive">Inactive Only ({summary.inactive_pincodes})</option>
                <option value="waitlist">With Waitlist Demand</option>
              </select>
            </div>

            {/* State Filter */}
            <div className="w-full sm:w-44">
              <select
                value={selectedStateFilter}
                onChange={(e) => setSelectedStateFilter(e.target.value)}
                className="w-full appearance-none h-10 bg-background border border-border text-foreground rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring shadow-sm font-medium"
              >
                <option value="all">All States ({tree.length})</option>
                {tree.map(s => (
                  <option key={s.name} value={s.name}>{s.name} ({s.total_count})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tree Explorer */}
          <div className="space-y-4">
            {filteredTree.map(state => {
              const isStateExpanded = expandedStates.has(state.name);

              return (
                <div key={state.name} className="panel p-0 overflow-hidden border border-[var(--border)]">
                  {/* State Header Accordion */}
                  <div 
                    onClick={() => toggleStateExpand(state.name)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--surface2)] transition-colors select-none bg-[var(--surface)]"
                  >
                    <div className="flex items-center gap-3">
                      {isStateExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--text)] tracking-tight">
                          {state.name}
                        </span>
                        <span className="text-[11px] text-[var(--muted)]">
                          ({state.districts.length} Districts, {state.total_count} PINs)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                        {state.active_count} Active
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-500/10 px-2.5 py-1 rounded-md">
                        {state.total_count - state.active_count} Inactive
                      </span>
                      {state.waitlist_count > 0 && (
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                          <Bell className="w-3 h-3" /> {state.waitlist_count} Waitlist
                        </span>
                      )}
                    </div>
                  </div>

                  {/* District & Tehsil Nested Content */}
                  {isStateExpanded && (
                    <div className="p-4 pt-2 space-y-4 border-t border-[var(--border)] bg-[var(--surface2)]/30">
                      {state.districts.map(district => {
                        const distKey = `${state.name}__${district.name}`;
                        const isDistrictExpanded = expandedDistricts.has(distKey);
                        const progress = district.total_count > 0 ? (district.active_count / district.total_count) * 100 : 0;

                        return (
                          <div key={district.name} className="panel p-4 bg-[var(--surface)] border border-[var(--border)]">
                            {/* District Header */}
                            <div 
                              onClick={() => toggleDistrictExpand(distKey)}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none pb-3 border-b border-[var(--border)]"
                            >
                              <div className="flex items-center gap-2.5">
                                {isDistrictExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-[var(--text)]">
                                      District: {district.name}
                                    </h4>
                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[var(--surface3)] text-[var(--muted)]">
                                      {district.tehsils.length} Tehsils
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-[var(--muted)] mt-1">
                                    <span>Coverage: {district.active_count}/{district.total_count} PINs Active ({Math.round(progress)}%)</span>
                                    {district.waitlist_count > 0 && (
                                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                        • {district.waitlist_count} Waitlisted Prospects
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="w-44 flex flex-col gap-1">
                                <div className="w-full bg-[var(--surface3)] rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" 
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-[9px] text-[var(--muted)] text-right font-mono">
                                  {district.active_count} of {district.total_count} Active
                                </span>
                              </div>
                            </div>

                            {/* Tehsils List */}
                            {isDistrictExpanded && (
                              <div className="mt-4 space-y-4">
                                {district.tehsils.map(tehsil => {
                                  const isBulkLoading = actionLoading === `tehsil_${district.name}_${tehsil.name}`;
                                  const allActive = tehsil.active_count === tehsil.total_count;

                                  return (
                                    <div 
                                      key={tehsil.name} 
                                      className="rounded-xl border border-[var(--border)] p-4 bg-[var(--surface2)]/40 space-y-3"
                                    >
                                      {/* Tehsil Header & Bulk Actions */}
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                          <div className="p-1.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
                                            <Building2 className="w-4 h-4" />
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold text-[var(--text)]">
                                                Tehsil: {tehsil.name}
                                              </span>
                                              <span 
                                                className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                                  tehsil.status === "active"
                                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                    : tehsil.status === "partial"
                                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                                    : "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400"
                                                }`}
                                              >
                                                {tehsil.status.toUpperCase()} ({tehsil.active_count}/{tehsil.total_count})
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-[10px] text-[var(--muted)] mt-0.5 font-medium">
                                              <span>Demand Score: {tehsil.demand_score}</span>
                                              {tehsil.waitlist_count > 0 && (
                                                <span className="text-amber-600 dark:text-amber-400 font-bold">
                                                  • {tehsil.waitlist_count} Prospects Enrolled
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Bulk Activate / Deactivate Button */}
                                        <button
                                          onClick={() => handleToggleTehsil(
                                            tehsil,
                                            district.name,
                                            state.name,
                                            allActive ? "inactive" : "active"
                                          )}
                                          disabled={isBulkLoading}
                                          className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 ${
                                            allActive
                                              ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                          }`}
                                        >
                                          {isBulkLoading ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Power className="w-3.5 h-3.5" />
                                          )}
                                          {allActive ? "Deactivate Entire Tehsil" : "Bulk Activate Entire Tehsil"}
                                        </button>
                                      </div>

                                      {/* PINCODE Grid */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                                        {tehsil.pincodes.map(pin => {
                                          const isPinLoading = actionLoading === `pin_${pin.pincode}`;
                                          const isActive = pin.status === "active";

                                          return (
                                            <div 
                                              key={pin.pincode}
                                              className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-2.5 ${
                                                isActive
                                                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30 text-[var(--text)]"
                                                  : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted)]"
                                              }`}
                                            >
                                              <div className="flex flex-col min-w-0 pr-1">
                                                <div className="flex items-center gap-1.5">
                                                  <span className="font-mono font-bold text-xs tracking-wider text-[var(--text)]">
                                                    {pin.pincode}
                                                  </span>
                                                  <span 
                                                    className={`text-[8px] uppercase font-bold px-1.5 py-0.2 rounded ${
                                                      isActive 
                                                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" 
                                                        : "bg-zinc-500/20 text-zinc-600 dark:text-zinc-400"
                                                    }`}
                                                  >
                                                    {isActive ? "Active" : "Inactive"}
                                                  </span>
                                                </div>
                                                <span className="text-[11px] truncate text-[var(--muted)] mt-0.5" title={pin.name}>
                                                  {pin.name}
                                                </span>
                                                {pin.waitlist_count > 0 && (
                                                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                                    <Bell className="w-2.5 h-2.5" /> {pin.waitlist_count} Waiting
                                                  </span>
                                                )}
                                              </div>

                                              {/* Toggle Action Switch */}
                                              <button
                                                onClick={() => handleTogglePin(pin, isActive ? "inactive" : "active")}
                                                disabled={isPinLoading}
                                                title={isActive ? "Click to Deactivate PIN" : "Click to Activate PIN"}
                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                                                  isActive ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700"
                                                }`}
                                              >
                                                <span
                                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    isActive ? "translate-x-4" : "translate-x-0"
                                                  }`}
                                                />
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredTree.length === 0 && (
              <div className="panel p-12 text-center text-[var(--muted)]">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold">No PIN codes found matching "{searchPin}"</p>
                <p className="text-xs mt-1">Try clearing your search query or status filter.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WAITLIST CRM DATABASE & REGIONAL HUBS */}
      {activeTab === "crm" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* City Waitlist Density Hub */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex flex-col gap-1 px-1">
              <h3 className="text-lg font-semibold text-foreground tracking-tight">Density Tracker</h3>
              <p className="text-xs text-muted-foreground">Aggregate lead metrics by expansion target.</p>
            </div>

            <div className="space-y-4">
              {["jodhpur", "kota", "ajmer", "udaipur"].map((citySlug) => {
                const cityName = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
                const score = cityScores[cityName] || 0;
                const threshold = 15;
                const progress = Math.min((score / threshold) * 100, 100);

                const impressions = impressionGroups[cityName] || 0;
                const intent = cityIntentGroups[cityName]?.intent || 0;
                const confirmed = cityIntentGroups[cityName]?.confirmed || 0;

                return (
                  <div key={citySlug} className="panel p-4 group">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[var(--primary)]" />
                        <span className="text-[13px] font-semibold text-[var(--text)]">{cityName}</span>
                      </div>
                      <span className="status-pill sp-waitlist text-[10px] uppercase font-semibold">
                        Score: {score.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-1 mb-4 text-[10px] font-semibold text-[var(--muted)]">
                      <span title="Impressions (0.2x)">👁 {impressions}</span>
                      <span title="Intent Leads (0.5x)">⚡ {intent}</span>
                      <span title="Confirmed (0.8x)">✅ {confirmed}</span>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <div className="w-full bg-[var(--surface3)] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-[var(--blue)] h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                        <span>Expansion Goal</span>
                        <span>{score.toFixed(1)}/{threshold} Score</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAppointInstaller(citySlug, cityName)}
                      disabled={actionLoading !== null}
                      className="w-full py-2 bg-[var(--blue)] text-white hover:bg-[#1C5BB8] disabled:bg-[var(--blue-dim)] disabled:text-[var(--blue)] text-[11px] font-semibold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                    >
                      {actionLoading === citySlug ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Building2 className="w-4 h-4" /> Appoint Installer
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Waitlist Leads Interactive CRM */}
          <div className="lg:col-span-2 space-y-4 flex flex-col h-[650px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text)] tracking-tight">Waitlist CRM Database</h3>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">Manage individual unserved territory inquiries.</p>
              </div>
              <span className="status-pill sp-site font-semibold">
                {filteredLeads.length} Matches
              </span>
            </div>

            {/* Dynamic Filters Hub */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search name, phone, PIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background border-border shadow-sm text-sm"
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full appearance-none h-10 bg-background border border-border text-foreground rounded-md pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm font-medium"
                >
                  <option value="all">All Regions</option>
                  <option value="jodhpur">Jodhpur</option>
                  <option value="kota">Kota</option>
                  <option value="ajmer">Ajmer</option>
                  <option value="udaipur">Udaipur</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              <div className="relative">
                <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={notifyFilter}
                  onChange={(e) => setNotifyFilter(e.target.value)}
                  className="w-full appearance-none h-10 bg-background border border-border text-foreground rounded-md pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm font-medium"
                >
                  <option value="all">All Notifications</option>
                  <option value="confirmed">Confirmed Alert</option>
                  <option value="pending">Alert Pending</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* CRM Leads Table */}
            <div className="panel flex-1 overflow-hidden flex flex-col">
              <div className="overflow-y-auto flex-1">
                <div className="overflow-x-auto w-full">
                  <table className="lead-table w-full">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        <th>Prospect</th>
                        <th>Hierarchy & Location</th>
                        <th>PINCODE</th>
                        <th>Notification Alert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.length > 0 ? (
                        filteredLeads.map((lead) => (
                          <tr key={lead.id}>
                            <td>
                              <div className="flex flex-col gap-1">
                                <span className="cell-name">{lead.customer_name}</span>
                                <span className="cell-phone">{lead.mobile_number}</span>
                              </div>
                            </td>
                            <td>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text)]">
                                  <MapPin className="w-3.5 h-3.5 text-[var(--blue)]" />
                                  {lead.detected_city}
                                </div>
                                <span className="text-[10px] text-[var(--muted)] font-medium">
                                  Tehsil: {lead.detected_tehsil || "General"} • {lead.detected_state || "Rajasthan"}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)]">
                                {lead.detected_pincode}
                              </span>
                            </td>
                            <td>
                              {lead.waitlist_confirmed ? (
                                <span className="status-pill sp-won gap-1.5 uppercase font-semibold">
                                  <CheckCircle2 className="w-3 h-3" /> Confirmed
                                </span>
                              ) : (
                                <span className="status-pill sp-lost gap-1.5 uppercase font-semibold">
                                  <AlertCircle className="w-3 h-3" /> Inactive
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="h-48 text-center">
                            <div className="flex flex-col items-center justify-center text-[var(--muted)]">
                              <Search className="w-8 h-8 mb-4 opacity-50" />
                              <p className="text-[12px] font-medium">No waitlist leads found</p>
                              <p className="text-[10px] mt-1">Adjust filters or check back later.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Pincode Modal */}
      {isAddPinOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="text-base font-bold text-[var(--text)]">Add PIN Code</h3>
              </div>
              <button 
                onClick={() => setIsAddPinOpen(false)}
                className="p-1 rounded-md hover:bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPinSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">State</label>
                <Input
                  type="text"
                  required
                  value={newPinState}
                  onChange={(e) => setNewPinState(e.target.value)}
                  placeholder="e.g. Rajasthan, Delhi, Maharashtra"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">District</label>
                <Input
                  type="text"
                  required
                  value={newPinDistrict}
                  onChange={(e) => setNewPinDistrict(e.target.value)}
                  placeholder="e.g. Jaipur, Jodhpur, New Delhi"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">Tehsil / Sub-district</label>
                <Input
                  type="text"
                  required
                  value={newPinTehsil}
                  onChange={(e) => setNewPinTehsil(e.target.value)}
                  placeholder="e.g. Jaipur Urban, Sanganer, Amer"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text)] block mb-1">6-Digit PIN Code</label>
                  <Input
                    type="text"
                    required
                    maxLength={6}
                    value={newPinCode}
                    onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 302029"
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text)] block mb-1">Initial Status</label>
                  <select
                    value={newPinStatus}
                    onChange={(e) => setNewPinStatus(e.target.value as PincodeStatus)}
                    className="w-full appearance-none h-10 bg-background border border-border text-foreground rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring font-medium"
                  >
                    <option value="inactive">Inactive (Waitlist)</option>
                    <option value="active">Active (Immediate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">Locality / Post Office Name</label>
                <Input
                  type="text"
                  value={newPinName}
                  onChange={(e) => setNewPinName(e.target.value)}
                  placeholder="e.g. Sanganer Town / Airport Area"
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsAddPinOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] hover:bg-[var(--surface2)] text-[var(--muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "add_pin"}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] flex items-center gap-1.5"
                >
                  {actionLoading === "add_pin" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Register Pincode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
