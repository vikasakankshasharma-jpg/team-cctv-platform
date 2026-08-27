import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { ApiResponse } from "@/lib/api-response";
import { checkRole } from "@/lib/rbac";
import { validateReportDateRange } from "@/lib/report-utils";

export async function GET(request: NextRequest) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "SALES"]);
    if (!isAllowed) {
       return ApiResponse.forbidden("Insufficient permissions for Sales analytics.");
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    // const salespersonId = searchParams.get("salespersonId"); // Future filtering
    
    if (startDate && endDate) {
        const dateCheck = validateReportDateRange({ startDate, endDate }, 180); 
        if (!dateCheck.success) return ApiResponse.badRequest(dateCheck.message!);
        if (dateCheck.isAsyncRequired) return ApiResponse.error(dateCheck.message!, "VALIDATION_ERROR", 400); 
    }

    // 1. Leads
    let leadsQuery = adminDb.collection("leads") as FirebaseFirestore.Query;
    if (startDate) leadsQuery = leadsQuery.where("createdAt", ">=", startDate);
    if (endDate) leadsQuery = leadsQuery.where("createdAt", "<=", endDate + "T23:59:59.999Z");
    const leadsSnap = await leadsQuery.get();

    // 2. Quotes
    let quotesQuery = adminDb.collection("quotes") as FirebaseFirestore.Query;
    if (startDate) quotesQuery = quotesQuery.where("createdAt", ">=", startDate);
    if (endDate) quotesQuery = quotesQuery.where("createdAt", "<=", endDate + "T23:59:59.999Z");
    const quotesSnap = await quotesQuery.get();

    // 3. Deals (Won)
    let dealsQuery = adminDb.collection("deals") as FirebaseFirestore.Query;
    if (startDate) dealsQuery = dealsQuery.where("createdAt", ">=", startDate);
    if (endDate) dealsQuery = dealsQuery.where("createdAt", "<=", endDate + "T23:59:59.999Z");
    const dealsSnap = await dealsQuery.get();

    let totalPipelineValue = 0;
    const monthlyTrends: Record<string, { quotes: number, deals: number }> = {};

    quotesSnap.docs.forEach(doc => {
        const q = doc.data();
        if (q.status === "GENERATED" || q.status === "SENT") {
            // Estimate pipeline value from active quotes
            totalPipelineValue += q.pricingSnapshot?.total_payable || 0;
        }
        
        // Trend calculation
        const month = q.createdAt.slice(0, 7); // YYYY-MM
        if (!monthlyTrends[month]) monthlyTrends[month] = { quotes: 0, deals: 0 };
        monthlyTrends[month].quotes += 1;
    });

    let totalWonValue = 0;
    dealsSnap.docs.forEach(doc => {
        const d = doc.data();
        totalWonValue += d.finalAmount || 0;
        
        const month = d.createdAt.slice(0, 7);
        if (!monthlyTrends[month]) monthlyTrends[month] = { quotes: 0, deals: 0 };
        monthlyTrends[month].deals += 1;
    });

    // Formatting trends for Recharts
    const trendData = Object.keys(monthlyTrends).sort().map(month => ({
        month,
        quotesGenerated: monthlyTrends[month].quotes,
        dealsWon: monthlyTrends[month].deals
    }));

    const totalLeads = leadsSnap.size;
    const totalQuotes = quotesSnap.size;
    const totalDeals = dealsSnap.size;
    
    // Funnel Conversion
    const leadToQuotePercent = totalLeads > 0 ? (totalQuotes / totalLeads) * 100 : 0;
    const quoteToDealPercent = totalQuotes > 0 ? (totalDeals / totalQuotes) * 100 : 0;

    return ApiResponse.success({
        summary: {
            totalLeads,
            totalQuotes,
            totalDeals,
            leadToQuotePercent,
            quoteToDealPercent,
            totalPipelineValue,
            totalWonValue,
            averageDealSize: totalDeals > 0 ? totalWonValue / totalDeals : 0
        },
        trendData
    });

  } catch (error: any) {
    return ApiResponse.error(error.message);
  }
}
