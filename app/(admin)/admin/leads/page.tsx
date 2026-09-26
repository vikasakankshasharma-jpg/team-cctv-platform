import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";

type LeadListRow = {
  id: string;
  leadId?: string;
  customer_name: string;
  customer_mobile: string;
  source: string;
  total_payable: number;
  selectedPlan: string;
  status: string;
  leadStatus: string;
  isPaid?: boolean;
  is_business?: boolean;
  company_name?: string | null;
  gstin?: string | null;
  site_visit_date?: string | null;
  site_visit_slot?: string | null;
  createdAt: string;
};

export default async function LeadsPage() {
  await requireAdmin();

  const snapshot = await adminDb.collection("quotes").orderBy("createdAt", "desc").limit(50).get();
  const leads: LeadListRow[] = snapshot.docs.map(doc => {
    const data = doc.data();
    const isPaid = data.status === "PAID" || data.status === "BOOKED" || !!data.payment_id || !!data.advance_paid;
    const isSiteVisit = data.status === "site_visit" || data.leadStatus === "SITE_VISIT" || !!data.site_visit_date;
    
    let computedLeadStatus = data.leadStatus || "NEW";
    if (isPaid && computedLeadStatus !== "WON") computedLeadStatus = "WON";
    else if (isSiteVisit && computedLeadStatus === "NEW") computedLeadStatus = "SITE_VISIT";

    return {
      id: data.id || doc.id,
      leadId: data.leadId || data.lead_id || data.id || doc.id,
      customer_name: data.customer_name || data.billing_details?.contact_name || data.billing_details?.company_name || "Unknown",
      customer_mobile: data.customer_mobile || data.billing_details?.contact_mobile || "",
      source: data.source || "wizard",
      total_payable: data.pricingSnapshot?.total_payable || data.total_payable || 0,
      selectedPlan: data.selectedPlan || data.pricingSnapshot?.selectedPlan || "Standard",
      status: data.status || (isPaid ? "PAID" : "GENERATED"),
      leadStatus: computedLeadStatus,
      isPaid,
      is_business: !!data.billing_details?.is_business,
      company_name: data.billing_details?.company_name || null,
      gstin: data.billing_details?.gstin || null,
      site_visit_date: data.site_visit_date || null,
      site_visit_slot: data.site_visit_slot || null,
      createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    };
  });

  const getStatusBadge = (status: string, isPaid?: boolean) => {
    if (isPaid || status === "WON" || status === "PAID" || status === "BOOKED") {
      return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white">Won / Paid</Badge>;
    }
    switch (status?.toUpperCase()) {
      case "NEW": return <Badge variant="secondary">New</Badge>;
      case "CONTACTED": return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Contacted</Badge>;
      case "SITE_VISIT": return <Badge variant="default" className="bg-purple-600 hover:bg-purple-700 text-white">Site Survey</Badge>;
      case "QUOTATION_SENT": return <Badge variant="outline" className="border-blue-400 text-blue-700 bg-blue-50">Quote Sent</Badge>;
      case "NEGOTIATION": return <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">Negotiation</Badge>;
      case "LOST": return <Badge variant="destructive">Lost</Badge>;
      default: return <Badge variant="outline">{status || "New"}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
          <p className="text-muted-foreground mt-1">Track quotations, site survey bookings, and B2B GST tax invoices</p>
        </div>
        <Link href="/admin/wizard">
          <Button>+ Create Manual Quote</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Leads & Inquiries ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-muted-foreground py-4 md:py-8 text-center">No leads found.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Quote ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer / Firm</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Type / Entity</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const hasSurvey = !!lead.site_visit_date;
                    const isB2B = lead.is_business || !!lead.gstin || !!lead.company_name;

                    return (
                      <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {lead.id}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {lead.createdAt ? format(new Date(lead.createdAt), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-foreground">
                              {lead.customer_name}
                            </span>
                            {lead.company_name && lead.company_name !== lead.customer_name && (
                              <span className="text-xs text-muted-foreground font-semibold">
                                {lead.company_name}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {lead.customer_mobile || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            {isB2B ? (
                              <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-800 text-[10px] font-bold">
                                🏢 B2B {lead.gstin ? `(${lead.gstin.slice(0, 2)}...)` : ""}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">👤 Personal</span>
                            )}
                            {hasSurvey && (
                              <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-800 text-[10px] font-bold">
                                📅 Survey: {format(new Date(lead.site_visit_date!), "dd MMM")}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-sm">
                          ₹{lead.total_payable.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>{getStatusBadge(lead.leadStatus, lead.isPaid)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/admin/leads/${lead.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold">
                                Details
                              </Button>
                            </Link>
                            <a
                              href={`/api/quote/${lead.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Download Quotation PDF"
                            >
                              Quote
                            </a>
                            {lead.isPaid && (
                              <a
                                href={`/api/invoice/${lead.id}/download`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                                title={((lead as any).amount_due ?? 0) > 0 ? "Download Booking Receipt" : "Download GST Tax Invoice"}
                              >
                                {((lead as any).amount_due ?? 0) > 0 ? "Receipt" : "Invoice"}
                              </a>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
