"use client";

import { useState, useEffect } from "react";
import { Users, Eye, Phone, MapPin, Search, Filter, Loader2, Target, Waves, ChevronRight, History, Download, Shield } from "lucide-react";
import type { Lead } from "@/types";
import { updateLeadStatus, assignLeadToSalesperson, getPriceMatchRequests, getLeadQuotes } from "@/app/actions/leads";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuoteHistoryModal } from "./QuoteHistoryModal";
import { PriceMatchReviewModal } from "./PriceMatchReviewModal";
import { LeadDetailsDrawer } from "./LeadDetailsDrawer";
import { ProgressiveDialer } from "./ProgressiveDialer";
import { toast } from "sonner";
import { db } from "@/lib/firebase-client";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { KanbanBoard } from "./kanban/KanbanBoard";

interface LeadsClientProps {
  initialLeads: Lead[];
  industrialLeads: any[];
  nextCursor?: string | null;
  salespeople?: { id: string; name: string }[];
  isAdmin?: boolean;
  isSalesStaff?: boolean;
  allowedPincodes?: string[];
}

export function LeadsClient({ initialLeads, industrialLeads, nextCursor, salespeople = [], isAdmin = false, isSalesStaff = false, allowedPincodes = [] }: LeadsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"standard" | "industrial">("standard");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [historyLead, setHistoryLead] = useState<{ id: string, name: string } | null>(null);

  const [localLeads, setLocalLeads] = useState<Lead[]>(initialLeads);
  const [localIndLeads, setLocalIndLeads] = useState<any[]>(industrialLeads);
  const [priceMatchLead, setPriceMatchLead] = useState<{ lead: Lead; request: any } | null>(null);
  
  const [selectedLeadForDrawer, setSelectedLeadForDrawer] = useState<Lead | null>(null);
  const [isDialerOpen, setIsDialerOpen] = useState(false);

  const handleOpenPriceMatch = async (lead: Lead) => {
    if (!lead.price_match_request_id) return;
    try {
      const requests = await getPriceMatchRequests(lead.id!);
      const request = requests.find((r: any) => r.id === lead.price_match_request_id) || requests[0];
      if (request) {
        const quotes = await getLeadQuotes(lead.id!);
        const latestQuote = quotes[0] as any;
        const originalTotal = latestQuote?.net_taxable_amount || latestQuote?.total_payable || 0;
        
        setPriceMatchLead({
          lead,
          request: {
            ...request,
            our_original_total: originalTotal
          }
        });
      } else {
        toast.error("No active price match request found");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading price match details");
    }
  };

  useEffect(() => {
    // Standard Leads Listener
    let q = query(collection(db, "leads"), orderBy("created_at", "desc"), limit(25));
    if (isSalesStaff) {
      if (allowedPincodes.length > 0) {
        q = query(collection(db, "leads"), where("address.pincode", "in", allowedPincodes.slice(0, 30)), orderBy("created_at", "desc"), limit(25));
      } else {
        q = query(collection(db, "leads"), where("address.pincode", "==", "NONE_ASSIGNED"), orderBy("created_at", "desc"), limit(25));
      }
    }

    const unsubStandard = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      const fetched = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          ...data,
          id: doc.id,
          created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
          updated_at: data.updated_at?.toDate ? data.updated_at.toDate().toISOString() : data.updated_at,
        } as Lead;
      });
      
      // Merge: take fetched (which has latest), append any from localLeads that are older and not in fetched
      setLocalLeads(prev => {
        const fetchedIds = new Set(fetched.map(l => l.id));
        const older = prev.filter(l => !fetchedIds.has(l.id));
        return [...fetched, ...older];
      });
    });

    // Industrial Leads Listener
    const indQ = query(collection(db, "industrial_leads"), orderBy("created_at", "desc"), limit(25));
    const unsubInd = onSnapshot(indQ, (snapshot) => {
      if (snapshot.empty) return;
      const fetched = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          ...data,
          id: doc.id,
          status: data.status || "new",
          created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
        };
      });
      setLocalIndLeads(prev => {
        const fetchedIds = new Set(fetched.map(l => l.id));
        const older = prev.filter(l => !fetchedIds.has(l.id));
        return [...fetched, ...older];
      });
    });

    return () => {
      unsubStandard();
      unsubInd();
    };
  }, [isSalesStaff, allowedPincodes]);

  const currentDataset = activeTab === "standard" ? localLeads : localIndLeads;

  const filteredLeads = currentDataset.filter(lead => {
    const searchStr = activeTab === "standard" 
      ? String((lead as Lead).customer_name || "") + String(lead.mobile_number || "")
      : String((lead as any).phone || "") + String((lead as any).company_name || "") + String((lead as any).contact_person || "");
      
    const matchesSearch = searchStr.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Sort escalated leads to the top
    const aEscalated = (a as Lead).is_escalated ? 1 : 0;
    const bEscalated = (b as Lead).is_escalated ? 1 : 0;
    if (aEscalated !== bEscalated) {
      return bEscalated - aEscalated;
    }
    // Then sort by date (newest first)
    const dateA = (a.created_at as any)?.toMillis?.() || 0;
    const dateB = (b.created_at as any)?.toMillis?.() || 0;
    return dateB - dateA;
  });

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setIsUpdating(leadId);
    try {
      await updateLeadStatus(leadId, newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleAssignSalesperson = async (leadId: string, spId: string) => {
    setIsAssigning(leadId);
    try {
      let spName = null;
      if (spId !== "unassigned") {
        const sp = salespeople.find(s => s.id === spId);
        if (sp) spName = sp.name;
      }
      
      await assignLeadToSalesperson(leadId, spId === "unassigned" ? null : spId, spName);
    } catch (error) {
      console.error("Failed to assign salesperson:", error);
    } finally {
      setIsAssigning(null);
    }
  };

  const exportToCSV = () => {
    const dataToExport = filteredLeads.map(lead => {
      if (activeTab === "standard") {
        const l = lead as Lead;
        return {
          "ID": l.id,
          "Customer Name": l.customer_name,
          "Mobile": l.mobile_number,
          "Property Type": l.property_type,
          "Technology": l.technology_choice,
          "Pincode": l.address?.pincode || "",
          "Status": l.status,
          "Promoter": l.promoter_name || "Organic",
          "Salesperson": l.assigned_to_salesperson_name || "Unassigned",
          "Created At": new Date(l.created_at as string | number).toLocaleString('en-IN')
        };
      } else {
        const l = lead as any;
        return {
          "ID": l.id,
          "Contact Person": l.contact_person,
          "Company": l.company_name,
          "Phone": l.phone,
          "Property Type": l.property_type,
          "Camera Count": l.requested_camera_count,
          "Technology": l.technology,
          "Status": l.status,
          "Created At": new Date(l.created_at as string | number).toLocaleString('en-IN')
        };
      }
    });

    if (dataToExport.length === 0) return;

    const headers = Object.keys(dataToExport[0]).join(",");
    const rows = dataToExport.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
    );
    
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Leads_Export_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'partial': return "bg-muted text-muted-foreground border-transparent";
      case 'new': return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400";
      case 'contacted': return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400";
      case 'site_visit': return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400";
      case 'quoted': return "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400";
      case 'won': return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400";
      case 'lost': return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400";
      default: return "bg-muted text-muted-foreground border-transparent";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Filters and Tabs */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Tabs and Dialer */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-1 p-1 bg-secondary/50 border border-border rounded-lg shadow-sm">
            <button
              onClick={() => setActiveTab("standard")}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${activeTab === "standard" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
            >
              Standard Matrix
            </button>
            <button
              onClick={() => setActiveTab("industrial")}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${activeTab === "industrial" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
            >
              Industrial Inquiries
            </button>
          </div>

          {activeTab === "standard" && (
            <div className="flex items-center gap-1 p-1 bg-secondary/50 border border-border rounded-lg shadow-sm">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === "table" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === "kanban" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
              >
                Kanban Board
              </button>
            </div>
          )}

          {isAdmin && (
            <button
              onClick={exportToCSV}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}

          {activeTab === "standard" && (
            <button
              onClick={() => setIsDialerOpen(true)}
              className="px-4 py-1.5 rounded-md text-xs font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm flex items-center gap-2 border border-green-600/50"
            >
              🚀 Launch Dialer
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder={activeTab === "standard" ? "Search Name, Mobile..." : "Search Mobile, Company..."}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 h-10 w-full bg-background border-border shadow-sm text-sm"
            />
          </div>
          <div className="relative w-full md:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full appearance-none bg-background border border-border text-foreground rounded-md pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="partial">Partial / Cart</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="site_visit">Site Visit</option>
              <option value="quoted">Quoted</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {activeTab === "standard" && viewMode === "kanban" ? (
        <KanbanBoard 
          leads={filteredLeads as Lead[]} 
          onStatusChange={handleStatusChange} 
          isAdmin={isAdmin}
          onLeadClick={(lead) => setSelectedLeadForDrawer(lead)}
        />
      ) : (
        <Card className="shadow-sm border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold text-xs tracking-wider">{activeTab === "standard" ? "Customer" : "Contact"}</TableHead>
                <TableHead className="font-semibold text-xs tracking-wider">{activeTab === "standard" ? "System" : "Volume"}</TableHead>
                <TableHead className="font-semibold text-xs tracking-wider">{activeTab === "standard" ? "Location" : "Site Type"}</TableHead>
                <TableHead className="font-semibold text-xs tracking-wider">{activeTab === "standard" ? "Source" : "Captured At"}</TableHead>
                <TableHead className="font-semibold text-xs tracking-wider text-center">Lifecycle Status</TableHead>
                <TableHead className="font-semibold text-xs tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Users className="w-8 h-8 mb-4 opacity-50" />
                      <p className="text-sm font-medium">No results found</p>
                      <p className="text-xs">Adjust your search or filters to find leads.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="group/row hover:bg-muted/30 cursor-pointer" onClick={() => { if(activeTab === "standard") setSelectedLeadForDrawer(lead as Lead) }}>
                    <TableCell className="align-top py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm tracking-tight group-hover/row:text-primary transition-colors">
                            {activeTab === "standard" ? (lead as Lead).customer_name : "Industrial Lead"}
                          </span>
                          {(lead as Lead).price_match_status === 'pending' && (
                            <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 animate-pulse flex items-center gap-1">
                              <Shield className="w-2.5 h-2.5" /> Price Match
                            </Badge>
                          )}
                          {(lead as Lead).is_escalated && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[9px] font-black uppercase animate-pulse flex items-center gap-1">
                              Escalated
                            </Badge>
                          )}
                          {(lead as Lead).wizard_answers?.q_timeline === 'asap' && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[9px] uppercase">Urgent</Badge>
                          )}
                          {(lead as Lead).next_followup_date === new Date().toISOString().split("T")[0] && (
                            <Badge variant="outline" className="h-5 px-1.5 text-[9px] uppercase bg-blue-500/10 text-blue-500 border-blue-500/20">Follow-up Today</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Phone className="w-3 h-3" /> 
                          {activeTab === "standard" ? (lead as Lead).mobile_number : (lead as any).phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      {activeTab === "standard" ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="capitalize font-medium text-xs">
                               {(lead as Lead).property_type}
                            </Badge>
                            <Badge variant="outline" className={`font-semibold text-[10px] uppercase ${(lead as Lead).technology_choice === 'IP' ? 'text-primary border-primary/50' : 'text-muted-foreground'}`}>
                              {(lead as Lead).technology_choice}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-primary">
                             {(lead as any).requested_camera_count} Units
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {(lead as any).technology}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top py-4">
                      {activeTab === "standard" ? (
                        (lead as Lead).address ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                              <MapPin className="w-3.5 h-3.5 text-primary" /> 
                              {(lead as Lead).address!.pincode}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[160px]" title={(lead as Lead).address!.landmark1}>
                                {(lead as Lead).address!.landmark1 || "No Landmark"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground italic">No Location</span>
                        )
                      ) : (
                        <span className="capitalize text-xs font-medium text-muted-foreground">
                          {(lead as any).property_type}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="align-top py-4">
                      {activeTab === "standard" ? (
                        (lead as Lead).referral_code ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="w-fit text-[10px] uppercase border-warning/50 text-warning bg-warning/10">
                              {(lead as Lead).referral_code}
                            </Badge>
                            <span className="text-xs font-medium text-foreground truncate max-w-[120px]" title={(lead as Lead).promoter_name || "Unknown"}>
                              {(lead as Lead).promoter_name || "Unknown Agent"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                             <Waves className="w-3 h-3" /> Organic
                          </div>
                        )
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="align-top py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative inline-block w-32">
                           <select 
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id!, e.target.value)}
                            disabled={isUpdating === lead.id}
                            className={`appearance-none font-semibold text-[11px] uppercase px-3 py-1.5 rounded-full border cursor-pointer transition-all outline-none text-center w-full shadow-sm ${getStatusColor(lead.status)} ${isUpdating === lead.id ? 'opacity-50' : ''}`}
                           >
                             <option value="partial">Partial</option>
                             <option value="new">Incoming</option>
                             <option value="contacted">Contacted</option>
                             <option value="site_visit">Site Visit</option>
                             <option value="quoted">Quoted</option>
                             <option value="won">Won</option>
                             <option value="lost">Lost</option>
                           </select>
                           {isUpdating === lead.id && (
                             <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                           )}
                         </div>
                         
                         {/* Salesperson Assignment Dropdown */}
                         {activeTab === "standard" && isAdmin && (
                           <div className="relative w-32">
                              <select
                                value={(lead as Lead).assigned_to_salesperson_id || "unassigned"}
                                onChange={(e) => handleAssignSalesperson(lead.id!, e.target.value)}
                                disabled={isAssigning === lead.id}
                                className={`appearance-none bg-secondary/50 border ${(lead as Lead).assigned_to_salesperson_id ? 'border-primary/30 text-primary' : 'border-border text-muted-foreground'} font-medium text-[10px] px-2 py-1 rounded-md w-full outline-none cursor-pointer text-center truncate ${isAssigning === lead.id ? 'opacity-50' : ''}`}
                              >
                                <option value="unassigned">Unassigned</option>
                                {salespeople.map(sp => (
                                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                                ))}
                              </select>
                              {isAssigning === lead.id && (
                                <Loader2 className="w-2.5 h-2.5 animate-spin absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              )}
                           </div>
                         )}
                         {activeTab === "standard" && !isAdmin && (lead as Lead).assigned_to_salesperson_name && (
                           <div className="text-[10px] font-semibold text-primary truncate max-w-[120px]">
                             {(lead as Lead).assigned_to_salesperson_name}
                           </div>
                         )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {activeTab === "standard" ? (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center justify-end gap-2">
                            {lead.price_match_status === 'pending' && (
                              <button 
                                onClick={() => handleOpenPriceMatch(lead)}
                                className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-600 hover:text-white hover:border-transparent transition-colors shadow-sm border border-amber-200 dark:border-amber-500/20"
                                title="Review Price Match"
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                            )}
                            <Link 
                              href={`/quote/${lead.id}`} 
                              target="_blank"
                              className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
                              title="View Quote"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button 
                              onClick={() => setHistoryLead({ id: lead.id!, name: (lead as Lead).customer_name })}
                              className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary text-muted-foreground hover:bg-warning/20 hover:text-warning transition-colors shadow-sm"
                              title="View History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </div>
                          {(lead as Lead).competitor_quote_url && (
                            <a 
                              href={(lead as Lead).competitor_quote_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[9px] font-semibold text-warning hover:underline"
                            >
                              <Target className="w-3 h-3" /> Competitor Quote
                            </a>
                          )}
                        </div>
                      ) : (
                        <a 
                          href={`tel:+91${(lead as any).phone}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-success/10 text-success hover:bg-success hover:text-success-foreground transition-colors shadow-sm"
                          title="Call Lead"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      )}

      {/* Pagination Controller */}
      {nextCursor && activeTab === "standard" && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set("lastDate", nextCursor);
              router.push(url.pathname + url.search);
            }}
            className="group flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:bg-primary/90 shadow-md active:scale-95"
          >
            Load Next Batch
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {historyLead && (
        <QuoteHistoryModal
          isOpen={!!historyLead}
          onClose={() => setHistoryLead(null)}
          leadId={historyLead.id}
          customerName={historyLead.name}
        />
      )}

      {priceMatchLead && (
        <PriceMatchReviewModal
          leadId={priceMatchLead.lead.id!}
          leadName={priceMatchLead.lead.customer_name}
          request={priceMatchLead.request}
          onClose={() => setPriceMatchLead(null)}
          onReviewed={() => {
            setPriceMatchLead(null);
            router.refresh();
          }}
        />
      )}

      <LeadDetailsDrawer
        lead={selectedLeadForDrawer}
        isOpen={!!selectedLeadForDrawer}
        onClose={() => setSelectedLeadForDrawer(null)}
        currentUser={{ id: "admin", name: "Admin User", role: "admin" }} // In a real app, pass actual user
        onStatusChange={handleStatusChange}
      />

      <ProgressiveDialer
        leads={localLeads}
        isOpen={isDialerOpen}
        onClose={() => setIsDialerOpen(false)}
        currentUser={{ id: "admin", name: "Admin User", role: "admin" }} // In a real app, pass actual user
      />
    </div>
  );
}
