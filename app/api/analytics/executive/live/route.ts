import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { ApiResponse } from "@/lib/api-response";
import { checkRole } from "@/lib/rbac";
import { validateReportDateRange } from "@/lib/report-utils";

export async function GET(request: NextRequest) {
  try {
    // 1. RBAC (Only Admins)
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN"]);
    if (!isAllowed) {
       return ApiResponse.forbidden("Insufficient permissions to view executive analytics.");
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    // 2. Date Range Validation
    if (startDate && endDate) {
        const dateCheck = validateReportDateRange({ startDate, endDate }, 180); // 6-month interactive limit
        if (!dateCheck.success) {
            return ApiResponse.badRequest(dateCheck.message!);
        }
        if (dateCheck.isAsyncRequired) {
            return ApiResponse.error(dateCheck.message!, "VALIDATION_ERROR", 400); // For now, reject large sync queries
        }
    }

    // 3. Layer 1 (Live) Calculations
    // Note: In production with high scale, we use Firebase Aggregation queries (count(), sum()) 
    // to avoid reading all documents.

    // A. Open Tickets Count
    const openTicketsSnap = await adminDb.collection("service_tickets")
        .where("status", "in", ["OPEN", "IN_PROGRESS", "ESCALATED"])
        .count().get();
    
    // B. Pending Jobs Count
    const pendingJobsSnap = await adminDb.collection("jobs")
        .where("status", "in", ["PENDING_SCHEDULE", "SCHEDULED"])
        .count().get();
        
    // C. Low Stock Alerts (Requires reading, usually a small dataset)
    const lowStockSnap = await adminDb.collection("inventory").where("availableQty", "<=", 5).get();

    // D. Active AMC Contracts (Valid as of today)
    const today = new Date().toISOString();
    const activeAmcSnap = await adminDb.collection("amc_contracts")
        .where("endDate", ">=", today)
        .count().get();

    // KPI Dictionary Alignment:
    // Total Sales: Sum of all non-cancelled invoices
    // Paid Revenue: Sum of all posted receipts
    // * Since sum() is not fully exposed in standard client SDK without a specific config, 
    //   we calculate it manually for this localized demo, or rely on a snapshot.
    
    return ApiResponse.success({
        openTickets: openTicketsSnap.data().count,
        pendingJobs: pendingJobsSnap.data().count,
        lowStockItems: lowStockSnap.size,
        activeAmcContracts: activeAmcSnap.data().count,
        // Sales and Finance are pulled from separate specific finance APIs 
        // to keep module boundaries clean.
    });

  } catch (error: any) {
    return ApiResponse.error(error.message);
  }
}
