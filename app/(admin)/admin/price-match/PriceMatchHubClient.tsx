"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ExternalLink, Clock, CheckCircle2, XCircle, AlertCircle, FileText, ArrowRight } from "lucide-react";
import type { PriceMatchRequest } from "@/types";

type RequestWithLead = PriceMatchRequest & { created_at?: string; reviewed_at?: string };

export default function PriceMatchHubClient() {
  const [requests, setRequests] = useState<RequestWithLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"pending" | "under_review" | "resolved">("pending");
  const [search, setSearch] = useState("");
  const [selectedReq, setSelectedReq] = useState<RequestWithLead | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [reviewNotes, setReviewNotes] = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState("");

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/admin/price-match?_t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredReqs = useMemo(() => {
    return requests.filter(r => {
      // Tab filter
      if (activeTab === "pending" && r.status !== "pending") return false;
      if (activeTab === "under_review" && r.status !== "under_review") return false;
      if (activeTab === "resolved" && (r.status === "pending" || r.status === "under_review")) return false;
      
      // Search filter
      if (search) {
        const term = search.toLowerCase();
        return r.competitor_name?.toLowerCase().includes(term) || 
               r.uploaded_by_name?.toLowerCase().includes(term);
      }
      return true;
    });
  }, [requests, activeTab, search]);

  const handleAction = async (status: "approved" | "rejected" | "counter_offered" | "under_review") => {
    if (!selectedReq) return;
    setActionLoading(true);

    const payload: any = { status, review_notes: reviewNotes, lead_id: selectedReq.lead_id };
    
    if (status === "approved" || status === "counter_offered") {
      const val = Number(discountValue);
      if (discountType === "flat") payload.approved_discount_flat = val;
      if (discountType === "percent") payload.approved_discount_percent = val;
      if (status === "counter_offered") payload.counter_offer_amount = val;
    }

    try {
      const res = await fetch(`/api/admin/price-match/${selectedReq.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      // Refresh
      await fetchRequests();
      setSelectedReq(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-warning/20 text-warning rounded-lg"><Clock className="w-3 h-3"/> Pending</span>;
      case "under_review": return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-primary/20 text-primary rounded-lg"><AlertCircle className="w-3 h-3"/> Reviewing</span>;
      case "approved": return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-success/20 text-success rounded-lg"><CheckCircle2 className="w-3 h-3"/> Approved</span>;
      case "rejected": return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-destructive/20 text-destructive rounded-lg"><XCircle className="w-3 h-3"/> Rejected</span>;
      case "counter_offered": return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-[#8b5cf6]/20 text-[#8b5cf6] rounded-lg"><FileText className="w-3 h-3"/> Countered</span>;
      default: return null;
    }
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-muted-foreground font-bold text-lg">Loading Requests...</div>;
  if (error) return <div className="text-center py-20 text-destructive font-bold">{error}</div>;

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[600px] relative">
      
      {/* LEFT PANE - List */}
      <div className={`flex-1 flex flex-col ${selectedReq ? "hidden md:flex md:max-w-md border-r border-border" : ""}`}>
        {/* Header & Tabs */}
        <div className="p-4 border-b border-border bg-muted/20 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-3.5 text-muted-foreground" />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search competitor or salesperson..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>
          
          <div className="flex bg-background rounded-xl p-1 border border-border">
            <button onClick={() => setActiveTab("pending")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "pending" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"}`}>Pending</button>
            <button onClick={() => setActiveTab("under_review")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "under_review" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"}`}>Reviewing</button>
            <button onClick={() => setActiveTab("resolved")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "resolved" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"}`}>Resolved</button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
          {filteredReqs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No requests found.</div>
          ) : (
            filteredReqs.map(req => (
              <div 
                key={req.id} 
                onClick={() => { setSelectedReq(req); setReviewNotes(req.review_notes || ""); setDiscountValue(req.approved_discount_flat?.toString() || req.approved_discount_percent?.toString() || ""); }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all hover:border-primary/50 ${selectedReq?.id === req.id ? "bg-primary/5 border-primary shadow-sm" : "bg-background border-border hover:shadow-md"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">{new Date(req.created_at || "").toLocaleDateString()}</span>
                  {getStatusBadge(req.status)}
                </div>
                <h4 className="font-bold text-foreground text-lg mb-1">{req.competitor_name || "Unknown Competitor"}</h4>
                <p className="text-sm text-muted-foreground">Requested by: <span className="font-semibold text-foreground">{req.uploaded_by_name}</span></p>
                {req.competitor_total && (
                  <div className="mt-3 inline-block bg-muted px-3 py-1.5 rounded-lg text-sm font-bold">
                    Competitor Total: <span className="text-primary">₹{req.competitor_total.toLocaleString()}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANE - Details */}
      {selectedReq ? (
        <div className="flex-1 flex flex-col bg-background animate-in slide-in-from-right-8 md:animate-none">
          {/* Mobile Back Button */}
          <div className="md:hidden p-4 border-b border-border">
            <button onClick={() => setSelectedReq(null)} className="text-sm font-bold text-primary flex items-center gap-2">
               ← Back to List
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 lg:p-10">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-black text-foreground">{selectedReq.competitor_name || "Competitor Quote"}</h2>
                  {getStatusBadge(selectedReq.status)}
                </div>
                <p className="text-muted-foreground font-medium">Salesperson: {selectedReq.uploaded_by_name}</p>
              </div>
              
              <a 
                href={selectedReq.competitor_quote_url} 
                target="_blank" 
                rel="noreferrer"
                className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-3 rounded-2xl font-bold flex items-center gap-2 transition-colors"
              >
                View Quote <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="bg-muted/30 border border-border p-5 rounded-2xl">
                 <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Competitor Price</p>
                 <p className="text-3xl font-black text-destructive">
                   {selectedReq.competitor_total ? `₹${selectedReq.competitor_total.toLocaleString()}` : "Not Specified"}
                 </p>
               </div>
               <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl">
                 <p className="text-sm font-bold text-primary/70 uppercase mb-1">Lead ID</p>
                 <p className="text-lg font-bold text-primary font-mono">{selectedReq.lead_id.slice(-6).toUpperCase()}</p>
               </div>
            </div>

            {selectedReq.notes && (
              <div className="mb-8 p-4 bg-muted/30 rounded-2xl border border-border">
                <p className="text-sm font-bold text-muted-foreground uppercase mb-2">Salesperson Notes</p>
                <p className="text-foreground">{selectedReq.notes}</p>
              </div>
            )}

            {/* Action Area */}
            {selectedReq.status === "pending" || selectedReq.status === "under_review" ? (
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Review & Decide</h3>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-bold text-muted-foreground mb-1.5 block">Review Notes (Sent to Salesperson)</label>
                    <textarea 
                      value={reviewNotes} 
                      onChange={e => setReviewNotes(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
                      placeholder="e.g., We can't match 100%, but offer them 10% off."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-bold text-muted-foreground mb-1.5 block">Discount Type</label>
                      <select 
                        value={discountType} 
                        onChange={e => setDiscountType(e.target.value as "flat" | "percent")}
                        className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="flat">Flat Amount (₹)</option>
                        <option value="percent">Percentage (%)</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-bold text-muted-foreground mb-1.5 block">Value</label>
                      <input 
                        type="number"
                        value={discountValue} 
                        onChange={e => setDiscountValue(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
                        placeholder="e.g., 5000 or 15"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction("approved")}
                    className="flex-1 bg-success text-success-foreground font-bold py-3.5 rounded-2xl hover:bg-success/90 transition-all flex justify-center items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5"/> Approve Request
                  </button>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction("counter_offered")}
                    className="flex-1 bg-[#8b5cf6] text-white font-bold py-3.5 rounded-2xl hover:bg-[#8b5cf6]/90 transition-all flex justify-center items-center gap-2"
                  >
                    <FileText className="w-5 h-5"/> Send Counter-Offer
                  </button>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction("rejected")}
                    className="px-6 bg-destructive/10 text-destructive font-bold py-3.5 rounded-2xl hover:bg-destructive/20 transition-all flex justify-center items-center gap-2"
                  >
                    <XCircle className="w-5 h-5"/> Reject
                  </button>
                </div>

                {selectedReq.status === "pending" && (
                  <button 
                    onClick={() => handleAction("under_review")}
                    className="w-full mt-3 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Mark as "Under Review" for later
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-muted/20 border border-border rounded-3xl p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success opacity-50" />
                </div>
                <h3 className="text-xl font-bold text-foreground">This request has been {selectedReq.status.replace("_", " ")}</h3>
                <p className="text-muted-foreground mt-2">No further actions can be taken.</p>
                {selectedReq.review_notes && (
                  <div className="mt-6 p-4 bg-background rounded-2xl border border-border text-left">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Your Notes</p>
                    <p>{selectedReq.review_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-muted-foreground p-10">
          <FileText className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">Select a request from the list to review it.</p>
        </div>
      )}

    </div>
  );
}
