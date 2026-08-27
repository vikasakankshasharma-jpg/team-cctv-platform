"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function JobWorkspacePage() {
  const params = useParams();
  const jobId = params.jobId as string;
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/operations/jobs/${jobId}`);
      const data = await res.json();
      if (data.success) {
        setJob(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklist = async (key: string) => {
    if (!job) return;
    const newChecklist = { ...job.checklist, [key]: !job.checklist[key] };
    
    // Optimistic update
    setJob({ ...job, checklist: newChecklist });
    
    try {
      await fetch(`/api/operations/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: newChecklist })
      });
    } catch (e) {
      console.error(e);
      // Revert on error
      setJob({ ...job });
    }
  };

  const updateStatus = async (newStatus: string) => {
    setSaving(true);
    try {
      await fetch(`/api/operations/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      fetchJob();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading Job Workspace...</div>;
  if (!job) return <div className="p-8">Job not found.</div>;

  const checklistKeys = Object.keys(job.checklist);
  const totalChecks = checklistKeys.length;
  const completedChecks = checklistKeys.filter(k => job.checklist[k]).length;
  const progressPercent = totalChecks === 0 ? 0 : (completedChecks / totalChecks) * 100;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{job.id}</h1>
          <p className="text-muted-foreground mt-1">{job.customerName} • {job.customerMobile}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="text-sm px-3 py-1 bg-blue-100 text-blue-800">{job.status}</Badge>
          {job.status !== "COMPLETED" && (
            <Button onClick={() => updateStatus("COMPLETED")} disabled={saving || completedChecks !== totalChecks} className="bg-green-600 hover:bg-green-700">
              {saving ? "Processing..." : "Complete Handover"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill of Materials (BOM)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">Cameras ({job.cameraCount})</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1 text-gray-700">
                    {job.bomCameras?.map((c: any, i: number) => (
                      <li key={i}>{c.product?.display_name || "Camera"} (Qty: {c.quantity || 1})</li>
                    ))}
                  </ul>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-4 bg-gray-50">
                    <h4 className="font-semibold mb-2">Recorder</h4>
                    <p className="text-sm text-gray-700">{job.bomRecorder?.product?.display_name || "None"}</p>
                  </div>
                  <div className="border rounded-md p-4 bg-gray-50">
                    <h4 className="font-semibold mb-2">Storage</h4>
                    <p className="text-sm text-gray-700">{job.bomStorage?.product?.display_name || "None"}</p>
                  </div>
                </div>
                
                <div className="border rounded-md p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">Accessories & Cables</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1 text-gray-700">
                    {job.bomAccessories?.map((a: any, i: number) => (
                      <li key={i}>{a.product?.display_name || "Accessory"} (Qty: {a.quantity || 1})</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
             <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Operational Handover Checklist</CardTitle>
                <div className="text-sm font-bold text-gray-500">{completedChecks} / {totalChecks}</div>
             </CardHeader>
             <CardContent>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                   <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                   {checklistKeys.map((key) => {
                     // Format key to readable text
                     const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                     return (
                       <label key={key} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-200 transition-colors">
                         <input 
                           type="checkbox" 
                           checked={job.checklist[key]} 
                           onChange={() => toggleChecklist(key)}
                           className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                           disabled={job.status === "COMPLETED"}
                         />
                         <span className={`text-sm font-medium ${job.checklist[key] ? 'text-gray-900 line-through opacity-70' : 'text-gray-700'}`}>
                           {label}
                         </span>
                       </label>
                     )
                   })}
                </div>
             </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <label className="text-xs text-gray-500">Scheduled Date</label>
                  <p className="font-medium">{job.scheduledDate ? format(new Date(job.scheduledDate), "MMM d, yyyy") : "Not Scheduled"}</p>
               </div>
               <div>
                  <label className="text-xs text-gray-500">Technician Assigned</label>
                  <p className="font-medium">{job.technicianId || "Unassigned"}</p>
               </div>
               <div>
                  <label className="text-xs text-gray-500">Site Address</label>
                  <p className="font-medium text-sm">{job.siteAddress || "Address not provided."}</p>
               </div>
               <div>
                  <label className="text-xs text-gray-500">Created From Deal</label>
                  <p className="font-medium text-sm text-blue-600 hover:underline cursor-pointer">{job.dealId}</p>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
