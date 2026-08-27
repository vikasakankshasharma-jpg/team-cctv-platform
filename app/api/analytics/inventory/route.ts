import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { ApiResponse } from "@/lib/api-response";
import { checkRole } from "@/lib/rbac";
import { validateReportDateRange } from "@/lib/report-utils";

export async function GET(request: NextRequest) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "OPERATIONS"]);
    if (!isAllowed) {
       return ApiResponse.forbidden("Insufficient permissions for Inventory analytics.");
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const branchId = searchParams.get("branchId"); // Future
    
    if (startDate && endDate) {
        const dateCheck = validateReportDateRange({ startDate, endDate }, 180); 
        if (!dateCheck.success) return ApiResponse.badRequest(dateCheck.message!);
        if (dateCheck.isAsyncRequired) return ApiResponse.error(dateCheck.message!, "VALIDATION_ERROR", 400); 
    }

    // 1. MASTER INVENTORY (Current Stock & Valuation)
    const inventorySnap = await adminDb.collection("inventory").get();
    
    let totalValuation = 0;
    let totalItemsInStock = 0;
    let totalReserved = 0;
    let lowStockCount = 0;
    
    const skuMaster: Record<string, { name: string, stock: number, cost: number, threshold: number }> = {};

    inventorySnap.docs.forEach(doc => {
        const item = doc.data();
        const available = item.availableQty || 0;
        const reserved = item.reservedQty || 0;
        const unitCost = item.unitPurchaseCost || 0; // Standard cost from master
        
        totalItemsInStock += available;
        totalReserved += reserved;
        totalValuation += (available + reserved) * unitCost;
        
        if (available <= (item.reorderThreshold || 5)) {
            lowStockCount++;
        }

        skuMaster[doc.id] = {
            name: item.name || doc.id,
            stock: available + reserved,
            cost: unitCost,
            threshold: item.reorderThreshold || 5
        };
    });

    // 2. STOCK LEDGER (Movements & Fast/Slow calculation)
    let ledgerQuery = adminDb.collection("stock_ledger") as FirebaseFirestore.Query;
    if (startDate) ledgerQuery = ledgerQuery.where("createdAt", ">=", startDate);
    if (endDate) ledgerQuery = ledgerQuery.where("createdAt", "<=", endDate + "T23:59:59.999Z");
    const ledgerSnap = await ledgerQuery.get();

    const movementSummary = { IN: 0, OUT: 0, ADJUST: 0 };
    const skuConsumption: Record<string, number> = {};
    const monthlyTrends: Record<string, { IN: number, OUT: number }> = {};

    ledgerSnap.docs.forEach(doc => {
        const l = doc.data();
        const type = l.type as "IN" | "OUT" | "ADJUST";
        const qty = l.quantity || 0;
        
        movementSummary[type] += qty;
        
        if (type === "OUT") {
            if (!skuConsumption[l.skuId]) skuConsumption[l.skuId] = 0;
            skuConsumption[l.skuId] += qty;
        }

        const month = l.createdAt.slice(0, 7);
        if (!monthlyTrends[month]) monthlyTrends[month] = { IN: 0, OUT: 0 };
        if (type === "IN") monthlyTrends[month].IN += qty;
        if (type === "OUT") monthlyTrends[month].OUT += qty;
    });

    // Determine Fast and Slow moving (Definition: Quantity consumed 'OUT' in period)
    const sortedConsumption = Object.entries(skuConsumption)
        .sort((a, b) => b[1] - a[1]); // Descending

    const fastMoving = sortedConsumption.slice(0, 5).map(([skuId, qty]) => ({
        skuId,
        name: skuMaster[skuId]?.name || skuId,
        consumedQty: qty
    }));

    // Find slow moving: items with zero OUT movement in this period, or lowest > 0
    const slowMoving = [];
    for (const skuId of Object.keys(skuMaster)) {
        if (!skuConsumption[skuId] && skuMaster[skuId].stock > 0) {
            slowMoving.push({
                skuId,
                name: skuMaster[skuId].name,
                stock: skuMaster[skuId].stock
            });
        }
    }
    // Limit to 5
    const slowMovingLimited = slowMoving.slice(0, 5);

    // 3. SERIAL ASSETS (Breakdown)
    const serialSnap = await adminDb.collection("serial_assets").get();
    const serialStatus = { IN_STOCK: 0, RESERVED: 0, INSTALLED: 0, RMA: 0, RETIRED: 0 };
    
    serialSnap.docs.forEach(doc => {
        const status = doc.data().status as keyof typeof serialStatus;
        if (serialStatus[status] !== undefined) serialStatus[status]++;
    });

    const trendData = Object.keys(monthlyTrends).sort().map(month => ({
        month,
        ...monthlyTrends[month]
    }));

    return ApiResponse.success({
        summary: {
            totalValuation,
            totalItemsInStock,
            totalReserved,
            lowStockCount
        },
        movementSummary,
        serialStatus,
        fastMoving,
        slowMoving: slowMovingLimited,
        trendData
    });

  } catch (error: any) {
    return ApiResponse.error(error.message);
  }
}
