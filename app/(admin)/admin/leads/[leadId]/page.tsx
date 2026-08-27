"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FollowUpManager } from "@/components/admin/leads/FollowUpManager";
import { QuoteVersionHistory } from "@/components/admin/leads/QuoteVersionHistory";
import LeadIntelligencePanel from "@/components/admin/leads/LeadIntelligencePanel";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  if (loading) return <div className="p-8">Loading lead details...</div>;
  if (!lead) return <div className="p-8">Lead not found.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{lead.customer_name || "Unknown Customer"}</h1>
          <p className="text-muted-foreground mt-1">{lead.customer_mobile} • Source: {lead.source} • ID: {quoteId}</p>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-sm font-medium">Status:</span>
          <Select value={lead.leadStatus || "NEW"} onValueChange={updateLeadStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="CONTACTED">Contacted</SelectItem>
              <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
              <SelectItem value="SITE_VISIT">Site Visit</SelectItem>
              <SelectItem value="QUOTATION_SENT">Quotation Sent</SelectItem>
              <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
              <SelectItem value="WON">Won</SelectItem>
              <SelectItem value="LOST">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <LeadIntelligencePanel lead={lead} onUpdate={fetchLead} />

          <Card>
            <CardHeader>
              <CardTitle>Requirement Context</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cameras</p>
                  <p className="font-medium">{lead.requirementSnapshot?.camera_count || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Recording Days</p>
                  <p className="font-medium">{lead.requirementSnapshot?.recording_days || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Technology</p>
                  <p className="font-medium">{lead.requirementSnapshot?.technology || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quote Value</p>
                  <p className="font-medium">₹{lead.pricingSnapshot?.finalPrice?.toLocaleString("en-IN") || lead.pricingSnapshot?.total_payable?.toLocaleString("en-IN")}</p>
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

        <div className="space-y-6">
          {lead.leadStatus === "WON" ? (
            <Card className="border-green-500 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700">Deal Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-800 mb-4">This lead has been marked as WON. Proceed to finalize the deal and collect payment.</p>
                <Link href={`/admin/leads/${quoteId}/deal`}>
                  <button className="w-full bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700">Finalize Deal</button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-700">Negotiate & Win</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-800 mb-4">Start formal negotiation to convert this quote into a Deal. Discounts require approval if below margin.</p>
                <Link href={`/admin/leads/${quoteId}/deal`}>
                  <button className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700">Convert to Deal</button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Lifecycle Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <p className="text-sm">Quote Generated</p>
                </div>
                {lead.status === "PDF_GENERATED" && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <p className="text-sm">PDF Downloaded</p>
                  </div>
                )}
                {lead.status === "SENT" && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-600" />
                    <p className="text-sm">WhatsApp Sent</p>
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
