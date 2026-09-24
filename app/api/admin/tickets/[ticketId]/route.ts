import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";

export async function PATCH(req: Request, { params }: { params: any }) {
  try {
    const session = await requireAdmin();
    // Verify admin has operations permissions
    if (session.role !== "super_admin" && !session.permissions?.operations?.manage_hubs) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status, assigned_installer_id, is_third_party, third_party_name, third_party_phone } = await req.json();
    const { ticketId } = params;

    const ticketRef = adminDb.collection("support_tickets").doc(ticketId);
    const ticketSnap = await ticketRef.get();
    
    if (!ticketSnap.exists) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticket = ticketSnap.data()!;
    const updateData: any = { status, updated_at: new Date() };

    // If assigning an installer
    if (assigned_installer_id !== undefined) {
      updateData.assigned_installer_id = assigned_installer_id;
    }

    await ticketRef.update(updateData);

    // If resolving a ticket, and it was a free AMC visit, we MUST increment the amc_visits_used on the Warranty!
    if (status === "resolved" && ticket.status !== "resolved" && ticket.warranty_id) {
       if (ticket.payment_status === "free_amc") {
          const wRef = adminDb.collection("warranties").doc(ticket.warranty_id);
          const wSnap = await wRef.get();
          if (wSnap.exists) {
             const wData = wSnap.data()!;
             await wRef.update({
                amc_visits_used: (wData.amc_visits_used || 0) + 1,
                updated_at: new Date()
             });
          }
       }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Update Ticket Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
