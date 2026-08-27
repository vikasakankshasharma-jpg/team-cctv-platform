"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function OperationsDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/operations/jobs");
      const data = await res.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading Operations Center...</div>;

  const pendingJobs = jobs.filter(j => j.status === "PENDING_SCHEDULE");
  const scheduledJobs = jobs.filter(j => j.status === "SCHEDULED"); // Today's Jobs conceptually
  const activeJobs = jobs.filter(j => j.status === "IN_PROGRESS");
  const testingJobs = jobs.filter(j => j.status === "TESTING");
  const completedJobs = jobs.filter(j => j.status === "COMPLETED");
  
  // Mock overdue (e.g. scheduled date is in the past and status is not completed)
  const overdueJobs = jobs.filter(j => j.status !== "COMPLETED" && j.scheduledDate && new Date(j.scheduledDate) < new Date());
  const pendingIssues = jobs.filter(j => j.pendingIssues && j.status !== "COMPLETED");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Operations & Dispatch</h1>
        <p className="text-muted-foreground mt-1">Manage installation jobs, testing, and handover</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-orange-800">Pending</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-orange-900">{pendingJobs.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-blue-800">Scheduled</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-blue-900">{scheduledJobs.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-purple-800">In Progress</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-purple-900">{activeJobs.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-yellow-800">Testing</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-yellow-900">{testingJobs.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-red-800">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-red-900">{overdueJobs.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-100 border-gray-300">
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-800">Issues</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-gray-900">{pendingIssues.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-green-800">Completed</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-green-900">{completedJobs.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Needs Attention (Pending Dispatch)</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingJobs.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No pending jobs. Great work!</p>
              ) : (
                <div className="space-y-4">
                  {pendingJobs.map(job => (
                    <div key={job.id} className="flex justify-between items-center border p-4 rounded-md hover:bg-gray-50">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">{job.id}</Badge>
                          <span className="font-bold">{job.customerName}</span>
                        </div>
                        <p className="text-sm text-gray-600">{job.cameraCount} Cameras • Generated {format(new Date(job.createdAt), "MMM d")}</p>
                      </div>
                      <Link href={`/admin/operations/jobs/${job.id}`}>
                        <Button variant="default" className="bg-blue-600 hover:bg-blue-700">Assign Technician</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Field Operations</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  {[...scheduledJobs, ...activeJobs, ...testingJobs].length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No active field jobs.</p>
                  ) : (
                    [...scheduledJobs, ...activeJobs, ...testingJobs].map(job => (
                      <div key={job.id} className="flex justify-between items-center border p-4 rounded-md">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <Badge variant="outline" className="bg-blue-100 text-blue-800">
                               {job.status}
                             </Badge>
                             <span className="font-bold">{job.customerName}</span>
                          </div>
                          <p className="text-sm text-gray-600">
                             Tech: {job.technicianId || "Unassigned"} • Scheduled: {job.scheduledDate ? format(new Date(job.scheduledDate), "MMM d") : "TBD"}
                          </p>
                        </div>
                        <Link href={`/admin/operations/jobs/${job.id}`}>
                           <Button variant="outline">View Workspace</Button>
                        </Link>
                      </div>
                    ))
                  )}
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technician Roster</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Availability for the week.</p>
              <div className="space-y-3">
                 <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-sm">Tech Team Alpha</span>
                    <Badge className="bg-green-100 text-green-800">Available</Badge>
                 </div>
                 <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-sm">Tech Team Bravo</span>
                    <Badge className="bg-purple-100 text-purple-800">On Site</Badge>
                 </div>
                 <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-sm">Tech Charlie</span>
                    <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
