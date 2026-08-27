"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type LeadListRow = {
  id: string;
  customer_name: string;
  customer_mobile: string;
  source: string;
  total_payable: number;
  selectedPlan: string;
  status: string;
  leadStatus: string;
  createdAt: string;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadListRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/crm/quotes");
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW": return <Badge variant="secondary">New</Badge>;
      case "CONTACTED": return <Badge variant="default" className="bg-blue-500">Contacted</Badge>;
      case "WON": return <Badge variant="default" className="bg-green-500">Won</Badge>;
      case "LOST": return <Badge variant="destructive">Lost</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage generated quotations</p>
        </div>
        <Link href="/admin/quote/new">
          <Button>+ Create Manual Quote</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading leads...</p>
          ) : leads.length === 0 ? (
            <p className="text-muted-foreground">No leads found.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Lead Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.id}</TableCell>
                      <TableCell>{format(new Date(lead.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>{lead.customer_name}</TableCell>
                      <TableCell>{lead.customer_mobile}</TableCell>
                      <TableCell className="capitalize">{lead.source}</TableCell>
                      <TableCell>₹{lead.total_payable.toLocaleString("en-IN")}</TableCell>
                      <TableCell>{getStatusBadge(lead.leadStatus)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/leads/${lead.id}`}>
                          <Button variant="ghost" size="sm">View Details</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
