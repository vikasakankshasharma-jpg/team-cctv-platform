import React from "react";
import { CheckCircle2, Clock, Calendar, Package, Wrench, ShieldCheck, User } from "lucide-react";

interface LeadStatusBadgeProps {
  lead: any;
  quote?: any;
  className?: string;
}

export function LeadStatusBadge({ lead, quote, className = "" }: LeadStatusBadgeProps) {
  // 1. Determine the unified status
  let status = "NEW PROSPECT";
  let colorClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900";
  let Icon = User;

  const rawStatus = String(lead?.status || "").toLowerCase();
  const deliveryStatus = String(lead?.delivery_status || quote?.delivery_status || "").toUpperCase();
  const installStatus = String(lead?.install_status || quote?.install_status || "").toUpperCase();
  
  const isPaid = 
    ["advance_paid", "delivery_paid", "paid", "captured"].includes(lead?.payment_status) ||
    ["advance_paid", "delivery_paid", "paid", "captured"].includes(quote?.payment_status) ||
    ["booked", "won", "dispatched", "delivered"].includes(rawStatus);

  if (installStatus === "COMPLETED" || rawStatus === "completed") {
    status = "COMPLETED";
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900";
    Icon = CheckCircle2;
  } else if (lead?.assigned_to_installer_id || installStatus === "IN_PROGRESS" || rawStatus === "in_progress") {
    status = "WORK IN PROGRESS";
    colorClass = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-900";
    Icon = Wrench;
  } else if (deliveryStatus === "DISPATCHED" || deliveryStatus === "DELIVERED") {
    status = "HARDWARE DISPATCHED";
    colorClass = "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-900";
    Icon = Package;
  } else if (isPaid || rawStatus === "won") {
    status = "BOOKED (ADVANCE PAID)";
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900";
    Icon = ShieldCheck;
  } else if (rawStatus === "site_visit" || rawStatus === "survey_booked") {
    status = "SITE SURVEY SCHEDULED";
    colorClass = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900";
    Icon = Calendar;
  } else if (rawStatus === "quoted" || quote || lead?.quotes?.length > 0) {
    status = "ESTIMATE GENERATED";
    colorClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900";
    Icon = Clock;
  } else if (rawStatus === "lost") {
    status = "LOST / CANCELLED";
    colorClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900";
    Icon = Clock; // could use XCircle if imported
  }

  return (
    <span className={`inline-flex items-center gap-1.5 border text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${colorClass} ${className}`}>
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
      {status}
    </span>
  );
}
