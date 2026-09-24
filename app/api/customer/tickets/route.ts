import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";
import { SupportTicketSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    // Assuming customer portal passes a standard verified session
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    
    // Parse and validate the input
    const parsed = SupportTicketSchema.omit({ 
      id: true, status: true, payment_status: true, created_at: true, updated_at: true 
    }).parse(payload);

    // 1. Check Warranty Status dynamically to determine the Payment Status
    let ticketPaymentStatus = "fully_chargeable";
    
    if (parsed.warranty_id) {
      const wDoc = await adminDb.collection("warranties").doc(parsed.warranty_id).get();
      if (wDoc.exists) {
        const warranty = wDoc.data()!;
        const now = new Date();
        const expiresAt = new Date(warranty.expires_at);

        if (warranty.status === "active" && now <= expiresAt) {
           if (warranty.amc_visits_used < warranty.total_amc_visits_allowed) {
             ticketPaymentStatus = "free_amc";
           } else {
             ticketPaymentStatus = "chargeable_labor"; // Hardward free, but visit used up
           }
        }
      }
    }

    // 2. Generate a readable Ticket Number (e.g., TKT-10492)
    const ticketCountSnap = await adminDb.collection("metadata").doc("counters").get();
    let ticketCount = 1000;
    if (ticketCountSnap.exists) {
       ticketCount = ticketCountSnap.data()?.ticket_counter || 1000;
    }
    const ticketNumber = `TKT-${ticketCount + 1}`;
    
    // 3. Save Ticket
    const ticketRef = adminDb.collection("support_tickets").doc();
    await ticketRef.set({
      ...parsed,
      id: ticketRef.id,
      ticket_number: ticketNumber,
      status: "open",
      payment_status: ticketPaymentStatus,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    // 4. Update Counter
    await adminDb.collection("metadata").doc("counters").set({
      ticket_counter: ticketCount + 1
    }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      ticketId: ticketRef.id,
      ticketNumber,
      paymentStatus: ticketPaymentStatus
    });

  } catch (error: any) {
    console.error("Create Ticket Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create ticket" }, { status: 500 });
  }
}
