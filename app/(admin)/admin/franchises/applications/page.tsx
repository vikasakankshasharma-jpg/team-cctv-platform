"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Building2, CheckCircle2, XCircle, Clock, MapPin, Mail, Phone, FileText, User } from "lucide-react";
import Link from "next/link";
import { FranchiseDealer } from "@/types";

export default function FranchiseApplicationsPage() {
  const [applications, setApplications] = useState<(FranchiseDealer & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/admin/franchises/applications");
      if (!res.ok) throw new Error("Failed to load applications");
      const data = await res.json();
      setApplications(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (!confirm(`Are you sure you want to ${action} this application?`)) return;

    try {
      const res = await fetch(`/api/admin/franchises/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "approve" ? "approved" : "rejected",
          is_active: action === "approve", // Active only if approved
        }),
      });

      if (!res.ok) throw new Error(`Failed to ${action}`);
      
      // Update local state
      setApplications((prev) => prev.filter((app) => app.id !== id));
      
      // Optionally redirect to the edit page to set pricing/terms if approved
      if (action === "approve") {
        window.location.href = `/admin/franchises/${id}`;
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-10 pb-20 font-sans">
      <PageHeader
        icon={Clock}
        title="Pending Partner Applications"
        description="Review and approve onboarding requests from prospective franchise dealers."
        badge={`${applications.length} Pending`}
      />

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl font-medium border border-rose-200">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-zinc-500 font-medium mt-4">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-32 border border-zinc-100 dark:border-zinc-800 rounded-[32px] bg-zinc-50 dark:bg-zinc-900/50">
          <Building2 className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-6" />
          <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">Inbox Zero</h3>
          <p className="text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
            There are no pending franchise applications to review at this time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                
                {/* Details */}
                <div className="flex-1 space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{app.company_name}</h3>
                      <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 font-black text-[10px] uppercase tracking-widest rounded-full">
                        Pending Review
                      </span>
                    </div>
                    <p className="text-zinc-500 font-medium flex items-center gap-2">
                      <User className="w-4 h-4" /> {app.owner_name}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Contact</p>
                      <p className="text-sm font-medium flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-zinc-400" /> {app.mobile_number}</p>
                      <p className="text-sm font-medium flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-zinc-400" /> {app.email}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Territory Request</p>
                      <p className="text-sm font-medium flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-blue-500" /> {app.assigned_cities?.join(", ")}</p>
                      <p className="text-xs text-zinc-500 font-medium mt-1">
                        Pincodes: {app.assigned_pincodes?.slice(0, 3).join(", ")}
                        {(app.assigned_pincodes?.length || 0) > 3 ? ` +${app.assigned_pincodes!.length - 3} more` : ""}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Business Details</p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-zinc-400" /> GST: {app.gst_number || "Not Provided"}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">Applied: {new Date(app.created_at as string).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-4 w-full lg:w-48 shrink-0">
                  <button 
                    onClick={() => handleAction(app.id, "approve")}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button 
                    onClick={() => handleAction(app.id, "reject")}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 font-black uppercase tracking-widest text-xs rounded-xl transition-all"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
