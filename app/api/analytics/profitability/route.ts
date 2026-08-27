import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { ApiResponse } from "@/lib/api-response";
import { checkRole } from "@/lib/rbac";
import { validateReportDateRange } from "@/lib/report-utils";
import { getLiveProfitability } from "@/lib/profitability-engine";

export async function GET(request: NextRequest) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN"]);
    if (!isAllowed) {
       return ApiResponse.forbidden("Insufficient permissions for Profitability metrics.");
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    if (startDate && endDate) {
        const dateCheck = validateReportDateRange({ startDate, endDate }, 180); 
        if (!dateCheck.success) return ApiResponse.badRequest(dateCheck.message!);
        if (dateCheck.isAsyncRequired) return ApiResponse.error(dateCheck.message!, "VALIDATION_ERROR", 400); 
    }

    // Phase 12 MVP: Fetch all active deals in the date range, then aggregate their Live Profitability
    // Note: 'createdAt' on deals is used to filter by date range
    let dealsQuery = adminDb.collection("deals") as FirebaseFirestore.Query;
    if (startDate) dealsQuery = dealsQuery.where("createdAt", ">=", startDate);
    if (endDate) dealsQuery = dealsQuery.where("createdAt", "<=", endDate + "T23:59:59.999Z");
    
    const dealsSnap = await dealsQuery.get();
    
    const period = new Date().toISOString().slice(0, 7);
    const results = [];
    
    let totalRevenue = 0;
    let totalGrossProfit = 0;

    for (const doc of dealsSnap.docs) {
        const dealId = doc.id;
        const profitData = await getLiveProfitability(dealId, period);
        results.push(profitData);
        
        totalRevenue += profitData.revenue;
        totalGrossProfit += profitData.grossProfit;
    }

    return ApiResponse.success({
        summary: {
            totalDeals: results.length,
            totalRevenue,
            totalGrossProfit,
            averageMargin: totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0
        },
        deals: results // Drill-down data for TanStack Table
    });

  } catch (error: any) {
    return ApiResponse.error(error.message);
  }
}
