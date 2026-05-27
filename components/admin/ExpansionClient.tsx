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
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Appointed Notification Toast */}
      {appointedCity && (
        <div className="fixed bottom-6 right-6 z-[100] bg-success text-success-foreground px-5 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Franchise Appointed</span>
            <span className="text-xs opacity-90">Franchise setup initiated for {appointedCity}.</span>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-all border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Waitlist Leads</span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {initialLeads.length}
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            Captured across unserved regions
          </div>
        </Card>

        <Card className="p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-all border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Target Region</span>
            <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shadow-sm">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {topCity !== "None" ? topCity : "N/A"}
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            Highest concentration ({topCount} prospects)
          </div>
        </Card>

        <Card className="p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-all border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prospects To Notify</span>
            <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {totalConfirmedWaitlist}
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            Confirmed launch alert registrations
          </div>
        </Card>
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
              const count = cityGroups[cityName] || 0;
              const threshold = 10; // Target leads before franchise activation
              const progress = Math.min((count / threshold) * 100, 100);

              return (
                <Card key={citySlug} className="p-4 shadow-sm border-border bg-card group">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">{cityName}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                      {count} Leads
                    </Badge>
                  </div>

                  {/* Progress bar toward active threshold */}
                  <div className="space-y-1.5 mb-4">
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>Expansion Goal</span>
                      <span>{count}/{threshold} Leads</span>
                    </div>
                  </div>

                  {/* Appoint Franchise Button */}
                  <button
                    onClick={() => handleAppointFranchise(citySlug, cityName)}
                    disabled={actionLoading !== null}
                    className="w-full py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/50 text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                  >
                    {actionLoading === citySlug ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Building2 className="w-4 h-4" /> Appoint Franchise
                      </>
                    )}
                  </button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Waitlist Leads Interactive CRM */}
        <div className="lg:col-span-2 space-y-4 flex flex-col h-[650px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
            <div>
              <h3 className="text-lg font-semibold text-foreground tracking-tight">Waitlist CRM Database</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Manage individual unserved city inquiries.</p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
              {filteredLeads.length} Matches
            </Badge>
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
          <Card className="flex-1 overflow-hidden shadow-sm border-border bg-card flex flex-col">
            <div className="overflow-y-auto flex-1">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="font-semibold text-xs tracking-wider">Prospect</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider">Region & Pincode</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider">Notification Alert</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-sm text-foreground tracking-tight">{lead.customer_name}</span>
                            <span className="text-xs font-medium text-muted-foreground">{lead.mobile_number}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              {lead.detected_city}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">PIN: {lead.detected_pincode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {lead.waitlist_confirmed ? (
                            <Badge variant="secondary" className="bg-success/10 text-success border border-success/20 gap-1.5 text-[10px] uppercase font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Confirmed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1.5 text-[10px] uppercase font-semibold">
                              <AlertCircle className="w-3 h-3" /> Inactive
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Search className="w-8 h-8 mb-4 opacity-50" />
                          <p className="text-sm font-medium">No waitlist leads found</p>
                          <p className="text-xs mt-1">Adjust filters or check back later.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
