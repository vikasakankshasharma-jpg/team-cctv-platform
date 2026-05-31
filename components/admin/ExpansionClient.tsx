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
  TrendingUp,
  Building2,
  Mail,
  CheckCircle2,
  Loader2,
  Calendar,
  AlertCircle
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface WaitlistLead {
  id: string;
  customer_name: string;
  mobile_number: string;
  detected_pincode: string;
  detected_city: string;
  detected_city_slug: string;
  waitlist_confirmed: boolean;
  created_at: string | null;
}

interface ServiceArea {
  id: string;
  city: string;
  waitlist_count: number;
  served: boolean;
}

interface Impression {
  city: string;
  pincode: string;
}

interface ExpansionClientProps {
  initialLeads: WaitlistLead[];
  initialServiceAreas: ServiceArea[];
  initialImpressions?: Impression[];
}

export default function ExpansionClient({ initialLeads, initialServiceAreas, initialImpressions = [] }: ExpansionClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [notifyFilter, setNotifyFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [appointedCity, setAppointedCity] = useState<string | null>(null);

  // Group impressions by city
  const impressionGroups = initialImpressions.reduce((acc, imp) => {
    // Normalizing city name to match lead groupings
    const city = imp.city.charAt(0).toUpperCase() + imp.city.slice(1).toLowerCase();
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group leads by city and status
  const cityIntentGroups = initialLeads.reduce((acc, lead) => {
    const city = lead.detected_city;
    if (!acc[city]) acc[city] = { intent: 0, confirmed: 0 };
    
    if (lead.waitlist_confirmed) {
      acc[city].confirmed += 1;
    } else {
      acc[city].intent += 1;
    }
    return acc;
  }, {} as Record<string, { intent: number, confirmed: number }>);

  // Calculate Demand Score for each city
  const cityScores: Record<string, number> = {};
  const allCities = new Set([...Object.keys(cityIntentGroups), ...Object.keys(impressionGroups)]);
  
  allCities.forEach(city => {
    const impressions = impressionGroups[city] || 0;
    const intent = cityIntentGroups[city]?.intent || 0;
    const confirmed = cityIntentGroups[city]?.confirmed || 0;
    
    cityScores[city] = (impressions * 0.2) + (intent * 0.5) + (confirmed * 0.8);
  });

  // Determine top waitlisted city by score
  let topCity = "None";
  let topScore = 0;
  Object.entries(cityScores).forEach(([city, score]) => {
    if (score > topScore) {
      topCity = city;
      topScore = score;
    }
  });

  const totalConfirmedWaitlist = initialLeads.filter(l => l.waitlist_confirmed).length;

  // Filtered Leads
  const filteredLeads = initialLeads.filter(lead => {
    const matchesSearch = 
      lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.mobile_number.includes(searchTerm) ||
      lead.detected_pincode.includes(searchTerm);
    
    const matchesCity = cityFilter === "all" || lead.detected_city_slug === cityFilter;
    
    const matchesNotify = 
      notifyFilter === "all" || 
      (notifyFilter === "confirmed" && lead.waitlist_confirmed) ||
      (notifyFilter === "pending" && !lead.waitlist_confirmed);

    return matchesSearch && matchesCity && matchesNotify;
  });

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
          <div className="kpi-label">Total Waitlist Leads</div>
          <div className="kpi-value">{initialLeads.length}</div>
          <div className="kpi-delta neutral">Captured across unserved regions</div>
          <div className="kpi-icon" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-label">Top Target Region</div>
          <div className="kpi-value">{topCity !== "None" ? topCity : "N/A"}</div>
          <div className="kpi-delta neutral">Highest demand score ({topScore.toFixed(1)})</div>
          <div className="kpi-icon" style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-label">Prospects To Notify</div>
          <div className="kpi-value">{totalConfirmedWaitlist}</div>
          <div className="kpi-delta neutral">Confirmed launch alert registrations</div>
          <div className="kpi-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
            <Bell className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid: City Density Tracker & Management */}
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
              const threshold = 15; // Target Score before franchise activation
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

                  {/* Progress bar toward active threshold */}
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

                  {/* Appoint Installer Button */}
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
              <p className="text-[11px] text-[var(--muted)] mt-0.5">Manage individual unserved city inquiries.</p>
            </div>
            <span className="status-pill sp-site font-semibold">
              {filteredLeads.length} Matches
            </span>
          </div>

          {/* Dynamic Filters Hub */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background border-border shadow-sm text-sm"
              />
            </div>

            {/* City Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full appearance-none h-10 bg-background border border-border text-foreground rounded-md pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm font-medium"
              >
                <option value="all">All Cities</option>
                <option value="jodhpur">Jodhpur</option>
                <option value="kota">Kota</option>
                <option value="ajmer">Ajmer</option>
                <option value="udaipur">Udaipur</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Notification Filter */}
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

          {/* CRM Leads Table / Scroll Area */}
          <div className="panel flex-1 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              <table className="lead-table w-full">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th>Prospect</th>
                    <th>Region & Pincode</th>
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
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--text)]">
                              <MapPin className="w-3.5 h-3.5 text-[var(--blue)]" />
                              {lead.detected_city}
                            </div>
                            <span className="text-[10px] font-medium text-[var(--muted)]">PIN: {lead.detected_pincode}</span>
                          </div>
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
                      <td colSpan={3} className="h-48 text-center">
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
  );
}
