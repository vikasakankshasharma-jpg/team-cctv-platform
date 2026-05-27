"use client";

import { useState } from "react";
import type { GeoPricingRule } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

export function GeoRulesClient({ data }: { data: GeoPricingRule[] }) {
  const [rules, setRules] = useState(data);
  const [search, setSearch] = useState("");

  const filtered = rules.filter(r => 
    r.target_value.toLowerCase().includes(search.toLowerCase()) ||
    r.level.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search rules by target (e.g., 302001, Jaipur)..." 
            className="pl-9 bg-black/20 border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="w-full sm:w-auto gap-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20">
          <PlusCircle className="w-4 h-4" />
          New Pricing Rule
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden bg-black/40">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-16 text-center">Priority</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Target Value</TableHead>
              <TableHead>Labor Multiplier</TableHead>
              <TableHead>Travel Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-border/50">
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No pricing rules found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((rule) => (
                <TableRow key={rule.id} className="border-border/50 hover:bg-muted/20">
                  <TableCell className="text-center font-mono">{rule.priority}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`
                      ${rule.level === "surge" ? "border-rose-500/50 text-rose-400" : ""}
                      ${rule.level === "pincode" ? "border-amber-500/50 text-amber-400" : ""}
                      ${rule.level === "city" ? "border-blue-500/50 text-blue-400" : ""}
                      ${rule.level === "state" ? "border-emerald-500/50 text-emerald-400" : ""}
                    `}>
                      {rule.level.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{rule.target_value}</TableCell>
                  <TableCell>
                    {rule.labor_multiplier ? (
                      <span className={rule.labor_multiplier > 1.0 ? "text-rose-400" : "text-emerald-400"}>
                        {rule.labor_multiplier}x
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {rule.flat_travel_fee ? (
                      <span className="text-muted-foreground font-mono">+₹{rule.flat_travel_fee}</span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={rule.is_active ? "border-emerald-500/50 text-emerald-400" : "border-zinc-500/50 text-zinc-400"}>
                      {rule.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8">Edit</Button>
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
