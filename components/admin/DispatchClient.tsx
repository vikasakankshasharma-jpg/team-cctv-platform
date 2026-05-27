"use client";

import { useState } from "react";
import type { Job, Hub, Installer } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Workflow, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DispatchClient({ jobs, hubs, installers }: { jobs: Job[], hubs: Hub[], installers: Installer[] }) {
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  const activeJobs = jobs.filter(j => !["completed", "audited", "cancelled"].includes(j.status));
  const completedJobs = jobs.filter(j => ["completed", "audited", "cancelled"].includes(j.status));
  const displayJobs = activeTab === "active" ? activeJobs : completedJobs;

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-0">
      <div className="flex gap-4 border-b border-border/50 pb-4">
        <Button 
          variant={activeTab === "active" ? "default" : "ghost"} 
          onClick={() => setActiveTab("active")}
          className={activeTab === "active" ? "bg-blue-600 hover:bg-blue-500" : ""}
        >
          Live Operations ({activeJobs.length})
        </Button>
        <Button 
          variant={activeTab === "completed" ? "default" : "ghost"} 
          onClick={() => setActiveTab("completed")}
        >
          Archived / Completed
        </Button>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-border/50 bg-black/40">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Job ID & Type</TableHead>
              <TableHead>Location (Pincode)</TableHead>
              <TableHead>Assigned Hub</TableHead>
              <TableHead>Assigned Installer</TableHead>
              <TableHead>Status (Strict)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayJobs.length === 0 ? (
              <TableRow className="border-border/50">
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Workflow className="w-8 h-8 opacity-20" />
                    <p>No jobs found in this view.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayJobs.map((job) => {
                const isBreaching = job.sla_deadline && new Date(job.sla_deadline) < new Date();
                return (
                  <TableRow key={job.id} className="border-border/50 hover:bg-muted/20">
                    <TableCell>
                      <div className="font-mono text-xs text-muted-foreground mb-1">{job.id?.slice(0, 8).toUpperCase()}</div>
                      <Badge variant="outline" className="border-blue-500/50 text-blue-400 uppercase tracking-wider text-[10px]">
                        {job.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {job.address?.pincode}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select defaultValue={job.hub_id || ""}>
                        <SelectTrigger className="h-8 w-40 text-xs bg-black/20 border-border/50">
                          <SelectValue placeholder="Assign Hub..." />
                        </SelectTrigger>
                        <SelectContent>
                          {hubs.map(h => <SelectItem key={h.id} value={h.id!}>{h.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select defaultValue={job.installer_id || ""}>
                        <SelectTrigger className="h-8 w-40 text-xs bg-black/20 border-border/50">
                          <SelectValue placeholder="Assign Installer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {installers.map(i => <SelectItem key={i.id} value={i.id!}>{i.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2 items-start">
                        <Badge className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                          {job.status.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                        {isBreaching && (
                          <span className="flex items-center gap-1 text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                            <AlertCircle className="w-3 h-3" /> SLA Breach
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 text-xs">Manage</Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
