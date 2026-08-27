import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "SALES", "OPERATIONS", "TECHNICIAN"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { ticketId } = await params;
    const doc = await adminDb.collection("service_tickets").doc(ticketId).get();
    
    if (!doc.exists) {
       return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: doc.data() });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "OPERATIONS"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { ticketId } = await params;
    const body = await request.json();
    
    const updates: any = { ...body };
    const timestamp = new Date().toISOString();
    
    if (updates.status === "ASSIGNED" && !updates.assignedAt) {
       updates.assignedAt = timestamp;
    }
    if (updates.status === "RESOLVED" && !updates.resolvedAt) {
       updates.resolvedAt = timestamp;
    }
    if (updates.status === "CLOSED" && !updates.closedAt) {
       updates.closedAt = timestamp;
    }

    const ref = adminDb.collection("service_tickets").doc(ticketId);
    
    // If the status is ASSIGNED, create a Service Job linked to this ticket automatically
    if (updates.status === "ASSIGNED" && updates.technicianId) {
        await adminDb.runTransaction(async (transaction) => {
            const ticketDoc = await transaction.get(ref);
            if (!ticketDoc.exists) throw new Error("Ticket not found");
            
            // Check if a job already exists for this ticket to maintain idempotency
            const jobSnapshot = await transaction.get(
               adminDb.collection("jobs").where("serviceTicketId", "==", ticketId)
            );
            
            if (jobSnapshot.empty) {
               const jobRef = adminDb.collection("jobs").doc();
               const ticket = ticketDoc.data()!;
               
               transaction.set(jobRef, {
                  id: jobRef.id,
                  type: "service", 
                  serviceTicketId: ticketId,
                  lead_id: ticket.customerId, // Assuming customerId maps to lead_id here, or just store it.
                  installer_id: updates.installer_id || updates.technicianId || null,
                  status: "pending_dispatch",
                  scheduled_at: updates.scheduledDate || null,
                  created_at: timestamp,
                  description: `Service Job for Ticket ${ticket.ticketNo}: ${ticket.description}`
               });
            }
            
            transaction.update(ref, updates);
        });
        return NextResponse.json({ success: true, message: "Ticket updated and Service Job created" });
    }

    await ref.update(updates);

    return NextResponse.json({ success: true, message: "Ticket updated" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
