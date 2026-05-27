"use client";

import { useState } from "react";
import type { Hub } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function HubsClient({ data }: { data: Hub[] }) {
  const [hubs, setHubs] = useState(data);
  const [search, setSearch] = useState("");

  const filtered = hubs.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    h.manager_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search hubs or managers..." 
            className="pl-9 bg-black/20 border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="w-full sm:w-auto gap-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20">
          <PlusCircle className="w-4 h-4" />
          Onboard New Hub
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden bg-black/40">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Hub Name</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Pincode Coverage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-border/50">
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No City Hubs found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((hub) => (
                <TableRow key={hub.id} className="border-border/50 hover:bg-muted/20">
                  <TableCell className="font-medium">{hub.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{hub.manager_name}</div>
                    <div className="text-xs text-muted-foreground">{hub.mobile_number}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {hub.pincode_coverage?.slice(0, 3).map(pin => (
                        <Badge key={pin} variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">{pin}</Badge>
                      ))}
                      {(hub.pincode_coverage?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-[10px]">+{hub.pincode_coverage.length - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={hub.is_active ? "border-emerald-500/50 text-emerald-400" : "border-rose-500/50 text-rose-400"}>
                      {hub.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8">Manage</Button>
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
