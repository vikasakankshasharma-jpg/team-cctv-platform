import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { ApiResponse } from "@/lib/api-response";
import { checkRole } from "@/lib/rbac";
import { validateReportDateRange } from "@/lib/report-utils";
import { differenceInHours, differenceInDays, parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "OPERATIONS", "TECHNICIAN"]);
    if (!isAllowed) {
       return ApiResponse.forbidden("Insufficient permissions for Service analytics.");
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    if (startDate && endDate) {
        const dateCheck = validateReportDateRange({ startDate, endDate }, 180); 
        if (!dateCheck.success) return ApiResponse.badRequest(dateCheck.message!);
        if (dateCheck.isAsyncRequired) return ApiResponse.error(dateCheck.message!, "VALIDATION_ERROR", 400); 
    }

    // 1. Service Tickets
    let ticketsQuery = adminDb.collection("service_tickets") as FirebaseFirestore.Query;
    if (startDate) ticketsQuery = ticketsQuery.where("createdAt", ">=", startDate);
    if (endDate) ticketsQuery = ticketsQuery.where("createdAt", "<=", endDate + "T23:59:59.999Z");
    const ticketsSnap = await ticketsQuery.get();

    // 2. Jobs
    let jobsQuery = adminDb.collection("jobs") as FirebaseFirestore.Query;
    if (startDate) jobsQuery = jobsQuery.where("createdAt", ">=", startDate);
    if (endDate) jobsQuery = jobsQuery.where("createdAt", "<=", endDate + "T23:59:59.999Z");
    const jobsSnap = await jobsQuery.get();

    // 3. AMC Contracts (Fetch all active or created in period)
    const amcSnap = await adminDb.collection("amc_contracts").get();

    // Variables for aggregations
    const ticketStatus = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0, ESCALATED: 0 };
    const jobStatus = { PENDING_SCHEDULE: 0, SCHEDULED: 0, COMPLETED: 0, CANCELLED: 0 };
    
    let totalSlaTargetHours = 24; // Default SLA target
    let ticketsBreachedSla = 0;
    let totalResolutionHours = 0;
    let resolvedTicketCount = 0;

    ticketsSnap.docs.forEach(doc => {
        const t = doc.data();
        const status = t.status as keyof typeof ticketStatus;
        if (ticketStatus[status] !== undefined) ticketStatus[status]++;

        if (status === "RESOLVED" || status === "CLOSED") {
            const created = parseISO(t.createdAt);
            const resolved = parseISO(t.resolvedAt || t.updatedAt);
            const diffHours = differenceInHours(resolved, created);
            
            totalResolutionHours += diffHours;
            resolvedTicketCount++;
            
            if (diffHours > totalSlaTargetHours) {
                ticketsBreachedSla++;
            }
        } else {
            // Check if open ticket has breached SLA
            const created = parseISO(t.createdAt);
            const diffHours = differenceInHours(new Date(), created);
            if (diffHours > totalSlaTargetHours) {
                ticketsBreachedSla++;
            }
        }
    });

    const technicianMetrics: Record<string, { assigned: number, completed: number }> = {};
    
    jobsSnap.docs.forEach(doc => {
        const j = doc.data();
        const status = j.status as keyof typeof jobStatus;
        if (jobStatus[status] !== undefined) jobStatus[status]++;
        
        if (status !== "CANCELLED" && j.technicianId) {
            const tech = j.technicianId;
            if (!technicianMetrics[tech]) technicianMetrics[tech] = { assigned: 0, completed: 0 };
            
            technicianMetrics[tech].assigned++;
            if (status === "COMPLETED") technicianMetrics[tech].completed++;
        }
    });

    let activeAmcCount = 0;
    const amcUtilization = { includedVisits: 0, usedVisits: 0, remainingVisits: 0 };
    let expiringSoonCount = 0; // next 30 days
    const now = new Date();

    amcSnap.docs.forEach(doc => {
        const amc = doc.data();
        const endDate = parseISO(amc.endDate);
        
        if (amc.status === "ACTIVE" && endDate > now) {
            activeAmcCount++;
            amcUtilization.includedVisits += (amc.includedVisits || 0);
            amcUtilization.usedVisits += (amc.usedVisits || 0);
            
            // Critical Data integrity block, this is validated later in reconciliation script
            const remaining = (amc.includedVisits || 0) - (amc.usedVisits || 0);
            amcUtilization.remainingVisits += remaining;

            const daysLeft = differenceInDays(endDate, now);
            if (daysLeft <= 30 && daysLeft >= 0) {
                expiringSoonCount++;
            }
        }
    });

    const techDataArray = Object.keys(technicianMetrics).map(tech => ({
        technicianId: tech,
        assigned: technicianMetrics[tech].assigned,
        completed: technicianMetrics[tech].completed
    })).sort((a, b) => b.completed - a.completed);

    const totalTickets = ticketsSnap.size;
    const slaBreachPercent = totalTickets > 0 ? (ticketsBreachedSla / totalTickets) * 100 : 0;
    const avgResolutionTime = resolvedTicketCount > 0 ? totalResolutionHours / resolvedTicketCount : 0;

    return ApiResponse.success({
        summary: {
            totalTickets,
            avgResolutionTimeHours: avgResolutionTime,
            ticketsBreachedSla,
            slaBreachPercent,
            activeAmcCount,
            expiringSoonCount
        },
        ticketStatus,
        jobStatus,
        technicianPerformance: techDataArray,
        amcUtilization
    });

  } catch (error: any) {
    return ApiResponse.error(error.message);
  }
}
