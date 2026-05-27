"use client";

import { useState } from "react";
import type { Installer } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";

export function InstallersClient({ data }: { data: Installer[] }) {
  const [installers, setInstallers] = useState(data);
  const [search, setSearch] = useState("");

  const filtered = installers.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.mobile_number.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search installers by name or phone..." 
            className="pl-9 bg-black/20 border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden bg-black/40">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Installer Info</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>Wallet / Cash</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-border/50">
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No installers found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((installer) => (
                <TableRow key={installer.id} className="border-border/50 hover:bg-muted/20">
                  <TableCell>
                    <div className="font-medium text-emerald-400">{installer.name}</div>
                    <div className="text-xs text-muted-foreground">{installer.mobile_number}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {installer.serviceable_pincodes?.slice(0, 3).map(pin => (
                        <Badge key={pin} variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">{pin}</Badge>
                      ))}
                      {(installer.serviceable_pincodes?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-[10px]">+{installer.serviceable_pincodes.length - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">SLA Score: <span className={installer.sla_score > 90 ? "text-emerald-400" : "text-amber-400"}>{installer.sla_score}/100</span></span>
                      <span className="text-xs text-muted-foreground">Jobs: {installer.jobs_completed}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`font-mono text-sm ${installer.wallet_balance < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                      ₹ {installer.wallet_balance?.toLocaleString() || "0"}
                    </div>
                    {installer.wallet_balance < 0 && <span className="text-[10px] text-rose-500/80">Owes Platform</span>}
                  </TableCell>
                  <TableCell>
                    {installer.kyc_status === "verified" ? (
                      <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 gap-1"><ShieldCheck className="w-3 h-3"/> Verified</Badge>
                    ) : installer.kyc_status === "suspended" ? (
                      <Badge variant="outline" className="border-rose-500/50 text-rose-400 gap-1"><ShieldAlert className="w-3 h-3"/> Suspended</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500/50 text-amber-400 gap-1">Pending KYC</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8">Audit</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
