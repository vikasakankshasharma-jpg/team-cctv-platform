import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { verifySession } = await import("@/lib/auth-server");
    const session = await verifySession();
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "SALES", "OPERATIONS", "TECHNICIAN", "CUSTOMER"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    
    
    const { customerId } = await params;
    // Server-Side Customer Access Control
    if (session.role === "CUSTOMER") {
       const customerDoc = await adminDb.collection("customers").doc(customerId).get();
       if (!customerDoc.exists || customerDoc.data()?.authUid !== session.user?.uid) {
           return NextResponse.json({ success: false, message: "Forbidden: Cross-Customer Access Denied" }, { status: 403 });
       }
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination (Basic implementation for History)
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    // 1. Fetch Assets & Calculate Warranty (10.9)
    const assetsSnapshot = await adminDb.collection("serial_assets")
      .where("customerId", "==", customerId)
      .where("status", "in", ["INSTALLED", "RMA", "RETIRED"])
      .get();
      
    const now = new Date();
    
    const assets = assetsSnapshot.docs.map(doc => {
       const a = doc.data();
       let warrantyStatus = "EXPIRED";
       let daysRemaining = 0;
       
       if (a.warrantyEndDate) {
          const end = new Date(a.warrantyEndDate);
          if (end > now) {
             warrantyStatus = "ACTIVE";
             daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          }
       }
       
       return {
          serialNumber: a.serialNumber,
          skuId: a.skuId,
          productName: a.productName,
          status: a.status,
          installedAt: a.installedAt,
          warrantyStartDate: a.warrantyStartDate,
          warrantyEndDate: a.warrantyEndDate,
          warrantyStatus,
          daysRemaining,
          replacementOf: a.replacementOf
       };
    });

    // 2. Fetch Service Tickets (10.10)
    const ticketsSnapshot = await adminDb.collection("service_tickets")
       .where("customerId", "==", customerId)
       .get();
       
    // 3. Fetch RMA Tickets (10.10)
    const rmasSnapshot = await adminDb.collection("rma_tickets")
       .where("customerId", "==", customerId)
       .get();
       
    // 4. Build Unified History
    const history: any[] = [];
    
    ticketsSnapshot.docs.forEach(doc => {
       const t = doc.data();
       history.push({
          type: "TICKET",
          referenceId: t.id,
          ticketNo: t.ticketNo,
          date: t.createdAt,
          title: `Service Ticket - ${t.category}`,
          description: t.description,
          status: t.status,
          resolutionCode: t.resolutionCode
       });
       
       // Optionally add resolution events as distinct entries if needed, but grouping is fine.
       if (t.resolvedAt) {
          history.push({
             type: "SERVICE_RESOLUTION",
             referenceId: t.id,
             ticketNo: t.ticketNo,
             date: t.resolvedAt,
             title: `Ticket Resolved`,
             description: t.resolutionNotes || "No notes provided",
             status: "COMPLETED",
             resolutionCode: t.resolutionCode
          });
       }
    });
    
    rmasSnapshot.docs.forEach(doc => {
       const rma = doc.data();
       history.push({
          type: "RMA",
          referenceId: rma.id,
          date: rma.createdAt,
          title: `Warranty Replacement`,
          description: `Replaced ${rma.oldSerialNumber} with ${rma.newSerialNumber}. Reason: ${rma.reason}`,
          status: rma.status
       });
    });
    
    // Sort History Chronologically (Newest First)
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Apply Pagination to History
    const paginatedHistory = history.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({ 
       success: true, 
       data: {
          assets,
          history: paginatedHistory,
          historyPagination: {
             page,
             pageSize,
             totalItems: history.length,
             totalPages: Math.ceil(history.length / pageSize)
          }
       } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

