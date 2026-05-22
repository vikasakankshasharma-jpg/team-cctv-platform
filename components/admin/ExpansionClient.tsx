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

interface ExpansionClientProps {
  initialLeads: WaitlistLead[];
  initialServiceAreas: ServiceArea[];
}

export default function ExpansionClient({ initialLeads, initialServiceAreas }: ExpansionClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [notifyFilter, setNotifyFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [appointedCity, setAppointedCity] = useState<string | null>(null);

  // Group leads by city
  const cityGroups = initialLeads.reduce((acc, lead) => {
    const city = lead.detected_city;
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Determine top waitlisted city
  let topCity = "None";
  let topCount = 0;
  Object.entries(cityGroups).forEach(([city, count]) => {
    if (count > topCount) {
      topCity = city;
      topCount = count;
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

  const handleAppointFranchise = async (citySlug: string, cityName: string) => {
    setActionLoading(citySlug);
    // Simulate API call to appoint franchise
    setTimeout(() => {
      setActionLoading(null);
      setAppointedCity(cityName);
      setTimeout(() => setAppointedCity(null), 5000);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Appointed Notification Toast */}
      {appointedCity && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-md flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-black text-sm uppercase tracking-wider">Franchise Appointed</p>
            <p className="text-xs opacity-90">Franchise setup initiated for {appointedCity}. Notification dispatch in progress.</p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 relative overflow-hidden group shadow-lg dark:shadow-md transition-all hover:border-blue-500/20 shadow-blue-500/5">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Total Waitlist Leads</span>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2">
            {initialLeads.length}
          </div>
          <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
            Captured across unserved regions
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 relative overflow-hidden group shadow-lg dark:shadow-md transition-all hover:border-amber-500/20 shadow-amber-500/5">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Top Target Region</span>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2">
            {topCity !== "None" ? topCity : "N/A"}
          </div>
          <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
            Highest concentration ({topCount} prospects)
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 relative overflow-hidden group shadow-lg dark:shadow-md transition-all hover:border-emerald-500/20 shadow-emerald-500/5">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Prospects To Notify</span>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-inner">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2">
            {totalConfirmedWaitlist}
          </div>
          <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
            Confirmed launch alert registrations
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      </div>

      {/* Grid: City Density Tracker & Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* City Waitlist Density Hub */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-lg dark:shadow-md space-y-6">
          <div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase">Waitlist Density Tracker</h3>
            <p className="text-xs text-zinc-400 mt-1">Aggregate lead metrics by expansion target.</p>
          </div>

          <div className="space-y-6">
            {["jodhpur", "kota", "ajmer", "udaipur"].map((citySlug) => {
              const cityName = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
              const count = cityGroups[cityName] || 0;
              const threshold = 10; // Target leads before franchise activation
              const progress = Math.min((count / threshold) * 100, 100);

              return (
                <div key={citySlug} className="space-y-2.5 p-4 rounded-2xl border border-zinc-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-black uppercase text-zinc-800 dark:text-zinc-200">{cityName}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md">
                      {count} Leads
                    </span>
                  </div>

                  {/* Progress bar toward active threshold */}
                  <div className="space-y-1">
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-black uppercase text-zinc-400">
                      <span>Expansion Goal</span>
                      <span>{count}/{threshold} Leads</span>
                    </div>
                  </div>

                  {/* Appoint Franchise Button */}
                  <button
                    onClick={() => handleAppointFranchise(citySlug, cityName)}
                    disabled={actionLoading !== null}
                    className="w-full mt-2 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-zinc-800/50 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {actionLoading === citySlug ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Building2 className="w-3.5 h-3.5" /> Appoint Franchise
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Waitlist Leads Interactive CRM */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-lg dark:shadow-md space-y-6 flex flex-col h-[600px] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase">Waitlist CRM Database</h3>
              <p className="text-xs text-zinc-400 mt-1">Manage individual unserved city inquiries.</p>
            </div>

            {/* Total Filter count indicator */}
            <div className="text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl self-start sm:self-center">
              {filteredLeads.length} Matches
            </div>
          </div>

          {/* Dynamic Filters Hub */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-blue-500/40 dark:focus:border-blue-500/40 font-medium transition-all"
              />
            </div>

            {/* City Filter */}
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-blue-500/40 dark:focus:border-blue-500/40 font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 appearance-none"
              >
                <option value="all">All Cities</option>
                <option value="jodhpur">Jodhpur</option>
                <option value="kota">Kota</option>
                <option value="ajmer">Ajmer</option>
                <option value="udaipur">Udaipur</option>
              </select>
              <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 rotate-90 pointer-events-none" />
            </div>

            {/* Notification Filter */}
            <div className="relative">
              <Bell className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select
                value={notifyFilter}
                onChange={(e) => setNotifyFilter(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-blue-500/40 dark:focus:border-blue-500/40 font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 appearance-none"
              >
                <option value="all">All Notifications</option>
                <option value="confirmed">Confirmed Alert</option>
                <option value="pending">Alert Pending</option>
              </select>
              <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 rotate-90 pointer-events-none" />
            </div>
          </div>

          {/* CRM Leads Table / Scroll Area */}
          <div className="flex-1 overflow-y-auto border border-zinc-50 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900 rounded-2xl">
            {filteredLeads.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 sticky top-0 z-10">
                    <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">Prospect</th>
                    <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">Region & Pincode</th>
                    <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">Notification Alert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-black text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">
                          {lead.customer_name}
                        </div>
                        <div className="text-[10px] font-bold text-zinc-400 mt-0.5">
                          {lead.mobile_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="font-bold text-xs text-zinc-700 dark:text-zinc-300 uppercase">{lead.detected_city}</span>
                        </div>
                        <div className="text-[10px] font-bold text-zinc-400 mt-0.5">
                          PIN: {lead.detected_pincode}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lead.waitlist_confirmed ? (
                          <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> Confirmed
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-zinc-500/10 text-zinc-500 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                            <AlertCircle className="w-3 h-3" /> Inactive
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <Search className="w-8 h-8 text-zinc-300 mb-2" />
                <h4 className="text-xs font-black uppercase text-zinc-400">No matching waitlist leads found</h4>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px]">Refine your filter metrics or check back later.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
