"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FollowUpManager } from "@/components/admin/leads/FollowUpManager";
import { QuoteVersionHistory } from "@/components/admin/leads/QuoteVersionHistory";
import LeadIntelligencePanel from "@/components/admin/leads/LeadIntelligencePanel";
import DispatchPanel from "@/components/admin/leads/DispatchPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar, MapPin, Building2, Phone, MessageSquare, ShieldCheck, CheckCircle2, Clock, Truck } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function LeadDetailPage() {
  const params = useParams();
  const quoteId = params.leadId as string;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLead();
  }, [quoteId]);

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/crm/quotes/${quoteId}`);
      const data = await res.json();
      if (data.success) {
        setLead(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (newStatus: string) => {
    try {
      await fetch(`/api/crm/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadStatus: newStatus })
      });
      fetchLead(); // refresh
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-4 md:p-8 text-center text-muted-foreground">Loading lead details...</div>;
  if (!lead) return <div className="p-4 md:p-8 text-center text-muted-foreground">Lead not found.</div>;

  const billing = lead.billing_details;
  const isB2B = billing?.is_business || !!billing?.gstin || !!billing?.company_name;
  const isPaid = lead.isPaid || lead.leadStatus === "WON" || lead.status === "PAID" || lead.status === "BOOKED";
  const hasSiteVisit = !!lead.site_visit_date || lead.leadStatus === "SITE_VISIT" || lead.status === "site_visit";

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              {lead.customer_name || billing?.contact_name || "Unknown Customer"}
            </h1>
            {isPaid ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                ✓ WON / PAID
              </Badge>
            ) : hasSiteVisit ? (
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
                📅 SITE SURVEY
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-bold">
                {lead.leadStatus || "NEW"}
              </Badge>
            )}
            {isB2B && (
              <Badge variant="outline" className="border-blue-400 bg-blue-50 text-blue-800 font-bold text-xs">
                🏢 GST Firm (B2B)
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
            <span>📞 {lead.customer_mobile || "No Mobile"}</span>
            <span>•</span>
            <span>Source: <strong className="capitalize">{lead.source}</strong></span>
            <span>•</span>
            <span className="font-mono">ID: {quoteId}</span>
          </p>
        </div>

        {/* Action Buttons & Status Selector */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          
          {/* Quick PDF Actions */}
          <a
            href={`/api/quote/${quoteId}/download`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Quote PDF</span>
          </a>

          {isPaid && (
            <a
              href={`/api/invoice/${quoteId}/download`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{(lead.amount_due ?? 0) > 0 ? "Booking Receipt" : "Tax Invoice"}</span>
            </a>
          )}

          {lead.customer_mobile && (
            <a
              href={`https://wa.me/91${lead.customer_mobile.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${lead.customer_name || "Customer"}, this is regarding your CCTV quotation (ID: ${quoteId}) with TEAM CCTV.`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          )}

          {/* Status Dropdown */}
          <div className="flex items-center gap-2 ml-auto lg:ml-0">
            <span className="text-xs font-bold text-muted-foreground">Status:</span>
            <Select value={lead.leadStatus || "NEW"} onValueChange={updateLeadStatus}>
              <SelectTrigger className="w-[150px] h-9 text-xs font-semibold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="SITE_VISIT">Site Survey</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                <SelectItem value="QUOTATION_SENT">Quote Sent</SelectItem>
                <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                <SelectItem value="WON">Won / Paid</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Site Visit Schedule Card (if booked) */}
          {hasSiteVisit && (
            <Card className="border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/60 to-white dark:from-purple-950/20 dark:to-zinc-900 shadow-sm">
              <CardHeader className="pb-3 border-b border-purple-100 dark:border-purple-900/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-black text-purple-900 dark:text-purple-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>Physical Site Survey Scheduled</span>
                  </CardTitle>
                  <Badge className="bg-purple-600 text-white text-[10px] font-black uppercase">
                    Zero Advance Booking
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-purple-100 dark:border-purple-900/30">
                    <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] block mb-1">
                      Preferred Date & Slot
                    </span>
                    <p className="font-bold text-zinc-900 dark:text-white text-sm">
                      {lead.site_visit_date ? format(new Date(lead.site_visit_date), "EEEE, dd MMMM yyyy") : "Date TBD"}
                    </p>
                    <p className="text-purple-700 dark:text-purple-400 font-bold mt-0.5">
                      ⏰ {lead.site_visit_slot || "10:00 AM - 01:00 PM"}
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-purple-100 dark:border-purple-900/30">
                    <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] block mb-1">
                      Survey Location & Address
                    </span>
                    <p className="font-medium text-zinc-900 dark:text-white line-clamp-2">
                      {typeof lead.address === "string" 
                        ? lead.address 
                        : lead.address?.full_address || lead.address?.street || billing?.address_line1 || "Customer address on record"}
                    </p>
                    {lead.address?.pincode && (
                      <p className="text-zinc-500 font-bold mt-1">PIN: {lead.address.pincode}</p>
                    )}
                  </div>
                </div>

                {lead.special_notes && (
                  <div className="p-3 bg-purple-50/80 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900/50 text-xs">
                    <span className="font-bold text-purple-900 dark:text-purple-300 block mb-0.5">
                      Customer Special Instructions:
                    </span>
                    <p className="text-purple-800 dark:text-purple-200 italic">"{lead.special_notes}"</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Link href="/admin/dispatch">
                    <Button size="sm" variant="outline" className="text-xs font-bold border-purple-300 text-purple-800 hover:bg-purple-100 dark:text-purple-300">
                      <Truck className="w-3.5 h-3.5 mr-1" />
                      View in Dispatch Center
                    </Button>
                  </Link>
                  <Link href="/admin/bookings">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold">
                      Manage Bookings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing & GST Firm Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Billing & Tax Details</span>
                </CardTitle>
                {isB2B ? (
                  <Badge className="bg-blue-600 text-white text-xs font-bold">
                    🏢 Registered GST Firm (B2B)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs font-bold text-zinc-600">
                    👤 Personal Consumer (B2C)
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {billing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground font-semibold block mb-0.5">
                      {isB2B ? "Company / Firm Legal Name" : "Billed Customer Name"}
                    </span>
                    <p className="font-bold text-sm text-foreground">
                      {billing.company_name || billing.contact_name || lead.customer_name}
                    </p>
                  </div>

                  {isB2B && (
                    <div>
                      <span className="text-muted-foreground font-semibold block mb-0.5">
                        GSTIN (Buyer Tax ID)
                      </span>
                      <p className="font-mono font-black text-sm text-blue-700 dark:text-blue-400">
                        {billing.gstin || "—"}
                      </p>
                      {billing.state_code && (
                        <p className="text-[11px] text-zinc-500 font-semibold">
                          State Code: {billing.state_code} ({billing.state || "Rajasthan"})
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <span className="text-muted-foreground font-semibold block mb-0.5">
                      Billing Address
                    </span>
                    <p className="font-medium text-foreground">
                      {[billing.address_line1, billing.address_line2, billing.city, billing.state, billing.pincode]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground font-semibold block mb-0.5">
                      Primary Contact & Mobile
                    </span>
                    <p className="font-medium text-foreground">
                      {billing.contact_name || lead.customer_name} • {billing.contact_mobile || lead.customer_mobile}
                    </p>
                    {billing.email && (
                      <p className="text-zinc-500 font-medium">{billing.email}</p>
                    )}
                  </div>

                  {billing.pan && (
                    <div>
                      <span className="text-muted-foreground font-semibold block mb-0.5">PAN Number</span>
                      <p className="font-mono font-bold">{billing.pan}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-muted-foreground bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-dashed">
                  <p className="font-medium">No formal GST firm details provided yet.</p>
                  <p className="text-[11px] mt-0.5">Customer will fill B2B/B2C billing overview before final payment checkout.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Intelligence */}
          <LeadIntelligencePanel lead={lead} onUpdate={fetchLead} />

          {/* Requirement Context */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">CCTV Requirement Context</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <p className="text-muted-foreground font-semibold">Cameras</p>
                  <p className="text-base font-black text-foreground mt-0.5">
                    {lead.requirementSnapshot?.camera_count || "4"} Units
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <p className="text-muted-foreground font-semibold">Recording Days</p>
                  <p className="text-base font-black text-foreground mt-0.5">
                    {lead.requirementSnapshot?.recording_days || "15"} Days
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <p className="text-muted-foreground font-semibold">Technology</p>
                  <p className="text-base font-black text-foreground mt-0.5">
                    {lead.requirementSnapshot?.technology_preference || lead.requirementSnapshot?.existing_technology || "IP / HD"}
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <p className="text-muted-foreground font-semibold">Total Quote Value</p>
                  <p className="text-base font-black text-emerald-600 mt-0.5">
                    ₹{(lead.pricingSnapshot?.finalPrice || lead.pricingSnapshot?.total_payable || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <QuoteVersionHistory currentQuote={lead} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FollowUpManager 
                quoteId={quoteId} 
                followUps={lead.follow_ups || []} 
                onAdded={fetchLead}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {isPaid ? (
            <Card className="border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-base font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Order Confirmed & Paid</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-emerald-900 dark:text-emerald-200 space-y-3">
                <p>This quotation has been booked with advance payment. Equipment allocation is active.</p>
                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href={`/api/invoice/${quoteId}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition-all shadow-sm"
                  >
                    {(lead.amount_due ?? 0) > 0 ? "Download Booking Receipt PDF" : "Download Tax Invoice PDF"}
                  </a>
                  <Link href={`/track/${lead.leadId || quoteId}`}>
                    <Button variant="outline" className="w-full text-xs font-bold border-emerald-300">
                      View Customer Tracker
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-800 dark:text-blue-300 text-base font-bold">Negotiate & Close Deal</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-blue-900 dark:text-blue-200 space-y-3">
                <p>Convert this active quote into a deal with commercial margin controls and custom discounts.</p>
                <Link href={`/admin/leads/${quoteId}/deal`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
                    Convert to Deal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {isPaid && (
            <DispatchPanel lead={lead} onUpdate={fetchLead} />
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Lifecycle Milestone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                  <p>Quotation Generated</p>
                </div>
                {hasSiteVisit && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                    <p className="font-bold text-purple-700 dark:text-purple-400">
                      Site Survey Booked ({lead.site_visit_date || "Pending"})
                    </p>
                  </div>
                )}
                {isPaid && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">Advance Paid & Invoice Issued</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
