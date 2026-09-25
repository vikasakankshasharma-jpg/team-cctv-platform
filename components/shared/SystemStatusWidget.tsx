"use client";
import React from "react";
import { CheckCircle2, Package, Truck, Wrench, ShieldCheck, Clock } from "lucide-react";

export function SystemStatusWidget({ lead, job }: { lead: any, job: any }) {
  // Determine current step index (matches TrackingClient logic)
  let currentStep = 1; // 1: Order Confirmed
  if (job || lead.delivery_status === "DISPATCHED" || lead.delivery_status === "DELIVERED") currentStep = 2; // 2: Equipment Ready
  if (job?.status === "dispatched" || job?.status === "in_progress" || lead.assigned_to_installer_id || lead.status === "site_visit") currentStep = 3; // 3: Installer En-Route
  if (lead.status === "won" && (lead.installation_proof_url || lead.install_status === "COMPLETED")) currentStep = 4; // 4: Completed

  return (
    <div className="w-full py-4 overflow-x-auto scrollbar-hide">
      <div className="flex items-center min-w-[300px] w-full max-w-lg mx-auto">
        
        {/* Step 1 */}
        <div className={`flex flex-col items-center flex-1 ${currentStep >= 1 ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-400 dark:text-zinc-600'}`}>
           <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep > 1 ? 'bg-emerald-500 text-white' : currentStep === 1 ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-zinc-100 text-zinc-400'}`}>
             {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-3.5 h-3.5" />}
           </div>
           <span className="text-[9px] font-black mt-1.5 uppercase tracking-widest text-center leading-tight">Confirmed</span>
        </div>

        <div className={`flex-1 h-0.5 ${currentStep >= 2 ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />

        {/* Step 2 */}
        <div className={`flex flex-col items-center flex-1 ${currentStep >= 2 ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-400 dark:text-zinc-600'}`}>
           <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep > 2 ? 'bg-emerald-500 text-white' : currentStep === 2 ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
             {currentStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : <Package className="w-3.5 h-3.5" />}
           </div>
           <span className="text-[9px] font-black mt-1.5 uppercase tracking-widest text-center leading-tight">Hardware<br/>Ready</span>
        </div>

        <div className={`flex-1 h-0.5 ${currentStep >= 3 ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />

        {/* Step 3 */}
        <div className={`flex flex-col items-center flex-1 ${currentStep >= 3 ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-400 dark:text-zinc-600'}`}>
           <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep > 3 ? 'bg-emerald-500 text-white' : currentStep === 3 ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
             {currentStep > 3 ? <CheckCircle2 className="w-4 h-4" /> : <Truck className="w-3.5 h-3.5" />}
           </div>
           <span className="text-[9px] font-black mt-1.5 uppercase tracking-widest text-center leading-tight">Installer<br/>Dispatched</span>
        </div>

        <div className={`flex-1 h-0.5 ${currentStep >= 4 ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />

        {/* Step 4 */}
        <div className={`flex flex-col items-center flex-1 ${currentStep >= 4 ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-400 dark:text-zinc-600'}`}>
           <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep === 4 ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
             {currentStep === 4 ? <CheckCircle2 className="w-4 h-4" /> : <Wrench className="w-3.5 h-3.5" />}
           </div>
           <span className="text-[9px] font-black mt-1.5 uppercase tracking-widest text-center leading-tight">Installed</span>
        </div>

      </div>
    </div>
  );
}
