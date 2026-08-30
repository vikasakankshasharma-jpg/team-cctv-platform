"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Job } from "@/types";

export default function OperationsDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`/api/operations/jobs`);
      if (!res.ok) throw new Error("Failed to load assigned jobs");
      const json = await res.json();
      setJobs(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white px-2">Assigned Jobs</h2>

      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-700 mx-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-gray-800 p-8 text-center rounded-lg shadow-sm border border-gray-700 text-gray-400 mx-2">
          No jobs currently assigned to you.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
          {jobs.map((job) => {
            const isAlert = job.status === "BACKORDERED" || job.status === "MATERIAL_SHORTAGE";
            
            return (
              <div key={job.id} className={`p-5 rounded-lg border shadow-sm flex flex-col justify-between ${
                isAlert ? "bg-orange-900/20 border-orange-700" : "bg-gray-800 border-gray-700"
              }`}>
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-sm text-gray-400">#{job.id?.substring(0,8)}</span>
                    <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                      job.status === "ASSIGNED" ? "bg-blue-900 text-blue-200" :
                      job.status === "IN_PROGRESS" ? "bg-teal-900 text-teal-200" :
                      job.status === "COMPLETED" ? "bg-green-900 text-green-200" :
                      "bg-orange-900 text-orange-200"
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  
                  {isAlert && (
                    <div className="text-xs font-semibold text-orange-400 mb-3 bg-orange-900/30 p-2 rounded">
                      ⚠️ INVENTORY ALERT: Check Backorder Status
                    </div>
                  )}

                  <div className="text-sm text-gray-300 space-y-1 mb-4">
                    <p>📍 {(job.address as any)?.city || (job.address as any)?.full_address || 'Location unavailable'}</p>
                    <p>🗓️ {job.scheduled_at ? new Date(job.scheduled_at as string).toLocaleDateString() : 'Unscheduled'}</p>
                  </div>
                </div>

                <Link 
                  href={`/operations/jobs/${job.id}`}
                  className="block text-center w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md transition-colors text-sm font-medium"
                >
                  View Job Card &rarr;
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
