import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { AuditLogger } from "@/lib/audit-logger";
import crypto from "crypto";
import { checkRole } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const [invSnap, quotesSnap] = await Promise.all([
      adminDb.collection("invoices").orderBy("issueDate", "desc").limit(50).get().catch(() => ({ docs: [] })),
      adminDb.collection("quotes").where("status", "in", ["PAID", "BOOKED"]).limit(50).get().catch(() => ({ docs: [] }))
    ]);

    const invoiceList: any[] = [];
    const seenIds = new Set<string>();

    // 1. Direct Invoice Docs
    for (const doc of invSnap.docs) {
      const data = doc.data();
      seenIds.add(doc.id);
      if (data.dealId) seenIds.add(data.dealId);
      invoiceList.push({
        id: doc.id,
        dealId: data.dealId || data.quoteId || null,
        quoteId: data.quoteId || data.dealId || doc.id,
        customerId: data.customerId || "customer",
        customerName: data.customerName || data.billing_details?.company_name || "Client",
        customerMobile: data.customerMobile || data.billing_details?.contact_mobile || "",
        is_business: !!data.billing_details?.is_business,
        companyName: data.billing_details?.company_name || null,
        gstin: data.billing_details?.gstin || null,
        subTotal: data.subTotal || Math.round(data.grandTotal / 1.18),
        taxAmount: data.taxAmount || (data.grandTotal - Math.round(data.grandTotal / 1.18)),
        grandTotal: data.grandTotal || 0,
        amountPaid: data.amountPaid || data.grandTotal || 0,
        amountDue: data.amountDue || 0,
        status: data.status || "PAID",
        issueDate: data.issueDate || new Date().toISOString()
      });
    }

    // 2. Paid Quotes
    for (const doc of quotesSnap.docs) {
      const q = doc.data();
      if (seenIds.has(doc.id)) continue;
      seenIds.add(doc.id);

      const total = q.total_payable || q.pricingSnapshot?.total_payable || 0;
      const advance = q.advance_paid || 3000;
      const due = Math.max(0, total - advance);
      const subTotal = Math.round(total / 1.18);
      const tax = total - subTotal;
      const billing = q.billing_details;

      invoiceList.push({
        id: `INV-Q-${doc.id.slice(0, 8).toUpperCase()}`,
        dealId: doc.id,
        quoteId: doc.id,
        customerId: q.customer_mobile || "customer",
        customerName: billing?.company_name || billing?.contact_name || q.customer_name || "Client",
        customerMobile: q.customer_mobile || billing?.contact_mobile || "",
        is_business: !!billing?.is_business,
        companyName: billing?.company_name || null,
        gstin: billing?.gstin || null,
        subTotal,
        taxAmount: tax,
        grandTotal: total,
        amountPaid: advance,
        amountDue: due,
        status: due === 0 ? "PAID" : "PARTIAL",
        issueDate: q.paid_at || q.createdAt || q.created_at || new Date().toISOString()
      });
    }

    // Sort descending
    invoiceList.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

    return NextResponse.json({ success: true, data: invoiceList });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "SALES"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const requestId = crypto.randomUUID();
    const actorRole = "FINANCE";
    const actorUid = "system_generated";
    const { dealId, ticketId } = body;
    
    if (!dealId && !ticketId) {
       return NextResponse.json({ success: false, message: "Deal ID or Ticket ID required" }, { status: 400 });
    }

    let invoiceId = "";

    await adminDb.runTransaction(async (transaction) => {
       let grandTotal = 0;
       let customerId = "";
       let customerName = "Unknown";
       
       if (dealId) {
           const dealRef = adminDb.collection("deals").doc(dealId);
           const dealDoc = await transaction.get(dealRef);
           if (!dealDoc.exists) throw new Error("Deal not found");
           const deal = dealDoc.data()!;
           
           const existingInvoices = await transaction.get(adminDb.collection("invoices").where("dealId", "==", dealId));
           if (!existingInvoices.empty) {
              throw new Error("Invoice already exists for this Deal");
           }

           grandTotal = deal.finalPrice || 0;
           customerId = deal.customerId || "walk-in";
           customerName = deal.customerName || "Unknown";
           
           invoiceId = `INV-D-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
           
           transaction.update(dealRef, { invoiceId });
       } else if (ticketId) {
           const ticketRef = adminDb.collection("service_tickets").doc(ticketId);
           const ticketDoc = await transaction.get(ticketRef);
           if (!ticketDoc.exists) throw new Error("Ticket not found");
           const ticket = ticketDoc.data()!;
           
           if (ticket.billingType !== "CHARGEABLE") {
              throw new Error("Cannot generate invoice for non-chargeable ticket");
           }
           if (ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") {
              throw new Error("Ticket must be resolved before generating an invoice");
           }
           
           const existingInvoices = await transaction.get(adminDb.collection("invoices").where("ticketId", "==", ticketId));
           if (!existingInvoices.empty) {
              throw new Error("Invoice already exists for this Ticket");
           }

           grandTotal = ticket.serviceCharge || body.serviceCharge || 0; // Default or passed in body
           customerId = ticket.customerId;
           
           invoiceId = `INV-S-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
           
           transaction.update(ticketRef, { invoiceId });
       }

       // Phase 9.5: Dynamic Taxation
       const defaultTaxRate = 18; 
       
       // Float Rounding Strategy
       const taxDivisor = 1 + (defaultTaxRate / 100);
       const subTotalRaw = grandTotal / taxDivisor;
       
       const subTotal = Math.round((subTotalRaw + Number.EPSILON) * 100) / 100;
       const taxAmount = Math.round(((grandTotal - subTotal) + Number.EPSILON) * 100) / 100;
       
       const issueDate = new Date().toISOString();
       const dueDate = new Date();
       dueDate.setDate(dueDate.getDate() + 7); // Default Net 7

       const newInvoice = {
          id: invoiceId,
          dealId: dealId || null,
          ticketId: ticketId || null,
          customerId,
          customerName,
          subTotal,
          taxAmount,
          grandTotal,
          amountPaid: 0,
          amountDue: grandTotal,
          status: grandTotal > 0 ? "UNPAID" : "PAID",
          issueDate,
          dueDate: dueDate.toISOString()
       };
       
       const invRef = adminDb.collection("invoices").doc(invoiceId);
       transaction.set(invRef, newInvoice);
    });

    return NextResponse.json({ success: true, invoiceId });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
