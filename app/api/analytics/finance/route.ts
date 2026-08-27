import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { ApiResponse } from "@/lib/api-response";
import { checkRole } from "@/lib/rbac";
import { validateReportDateRange } from "@/lib/report-utils";
import { differenceInDays, parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN"]); // explicitly excludes SALES/OPERATIONS
    if (!isAllowed) {
       return ApiResponse.forbidden("Insufficient permissions for Finance analytics.");
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    if (startDate && endDate) {
        const dateCheck = validateReportDateRange({ startDate, endDate }, 180); 
        if (!dateCheck.success) return ApiResponse.badRequest(dateCheck.message!);
        if (dateCheck.isAsyncRequired) return ApiResponse.error(dateCheck.message!, "VALIDATION_ERROR", 400); 
    }

    // 1. Fetch Invoices
    let invoicesQuery = adminDb.collection("invoices") as FirebaseFirestore.Query;
    if (startDate) invoicesQuery = invoicesQuery.where("createdAt", ">=", startDate);
    if (endDate) invoicesQuery = invoicesQuery.where("createdAt", "<=", endDate + "T23:59:59.999Z");
    const invoicesSnap = await invoicesQuery.get();

    // 2. Fetch Receipts
    let receiptsQuery = adminDb.collection("receipts") as FirebaseFirestore.Query;
    if (startDate) receiptsQuery = receiptsQuery.where("createdAt", ">=", startDate);
    if (endDate) receiptsQuery = receiptsQuery.where("createdAt", "<=", endDate + "T23:59:59.999Z");
    const receiptsSnap = await receiptsQuery.get();

    let totalRevenue = 0;
    let totalOutstanding = 0;
    let totalCashCollected = 0;
    
    const monthlyTrends: Record<string, { revenue: number, cashCollected: number }> = {};
    const agingBuckets = { current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    const statusBreakdown = { DRAFT: 0, SENT: 0, PARTIAL: 0, PAID: 0, OVERDUE: 0 };
    
    // Process Receipts (Cash Collected)
    receiptsSnap.docs.forEach(doc => {
        const r = doc.data();
        if (r.status !== "CANCELLED") {
            const rAmt = r.amount || 0;
            totalCashCollected += rAmt;
            
            const month = r.createdAt.slice(0, 7);
            if (!monthlyTrends[month]) monthlyTrends[month] = { revenue: 0, cashCollected: 0 };
            monthlyTrends[month].cashCollected += rAmt;
        }
    });

    const now = new Date();
    const customerOutstanding: Record<string, number> = {};

    // Process Invoices (Revenue and Outstanding)
    invoicesSnap.docs.forEach(doc => {
        const inv = doc.data();
        
        if (inv.status === "CANCELLED") return;

        const invAmt = inv.totalAmount || 0;
        const paidAmt = inv.paidAmount || 0;
        const outstanding = invAmt - paidAmt;
        
        // Revenue is recognized when invoice is issued (excluding drafts in real accrual, but we'll include sent/paid here)
        if (inv.status !== "DRAFT") {
            totalRevenue += invAmt;
            const month = inv.createdAt.slice(0, 7);
            if (!monthlyTrends[month]) monthlyTrends[month] = { revenue: 0, cashCollected: 0 };
            monthlyTrends[month].revenue += invAmt;
        }

        // Status Breakdown
        const status = inv.status;
        if (statusBreakdown[status as keyof typeof statusBreakdown] !== undefined) {
             statusBreakdown[status as keyof typeof statusBreakdown]++;
        }

        // Outstanding & Aging
        if (outstanding > 0 && inv.status !== "DRAFT") {
            totalOutstanding += outstanding;
            
            // Top outstanding aggregation
            const cId = inv.customerId || "Unknown";
            if(!customerOutstanding[cId]) customerOutstanding[cId] = 0;
            customerOutstanding[cId] += outstanding;

            const dueDate = inv.dueDate ? parseISO(inv.dueDate) : parseISO(inv.createdAt);
            const daysOverdue = differenceInDays(now, dueDate);

            if (daysOverdue <= 0) agingBuckets.current += outstanding;
            else if (daysOverdue <= 30) agingBuckets["1-30"] += outstanding;
            else if (daysOverdue <= 60) agingBuckets["31-60"] += outstanding;
            else if (daysOverdue <= 90) agingBuckets["61-90"] += outstanding;
            else agingBuckets["90+"] += outstanding;
        }
    });

    // Formatting trends for Recharts
    const trendData = Object.keys(monthlyTrends).sort().map(month => ({
        month,
        revenue: monthlyTrends[month].revenue,
        cashCollected: monthlyTrends[month].cashCollected
    }));

    // Top Outstanding Customers
    const topOutstanding = Object.entries(customerOutstanding)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([customerId, amount]) => ({ customerId, amount }));

    return ApiResponse.success({
        summary: {
            totalRevenue,
            totalCashCollected,
            totalOutstanding
        },
        trendData,
        agingBuckets,
        statusBreakdown,
        topOutstanding
    });

  } catch (error: any) {
    return ApiResponse.error(error.message);
  }
}
