import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { AuditLogger } from "@/lib/audit-logger";
import crypto from "crypto";
import { checkRole } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    if (!(await checkRole())) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const requestId = crypto.randomUUID();
    const actorRole = "FINANCE";
    const actorUid = "system_generated";
    const { invoiceId, amount, paymentMethod, referenceNumber, notes, recordedBy = "Admin" } = body;
    
    if (!invoiceId || !amount) {
       return NextResponse.json({ success: false, message: "Invoice ID and Amount required" }, { status: 400 });
    }

    let receiptId = "";

    await adminDb.runTransaction(async (transaction) => {
       const invRef = adminDb.collection("invoices").doc(invoiceId);
       const invDoc = await transaction.get(invRef);
       
       if (!invDoc.exists) throw new Error("Invoice not found");
       const invoice = invDoc.data()!;
       
       if (invoice.status === "PAID") {
          throw new Error("Invoice is already fully paid");
       }
       
       const newAmountPaid = invoice.amountPaid + amount;
       const newAmountDue = Math.max(0, invoice.grandTotal - newAmountPaid);
       
       let newStatus = invoice.status;
       if (newAmountDue <= 0) {
          newStatus = "PAID";
       } else if (newAmountPaid > 0) {
          newStatus = "PARTIAL";
       }

       receiptId = `RCPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
       
       const newReceipt = {
          id: receiptId,
          invoiceId: invoiceId,
          dealId: invoice.dealId,
          amount,
          paymentMethod: paymentMethod || "CASH",
          referenceNumber: referenceNumber || "",
          notes: notes || "",
          date: new Date().toISOString(),
          recordedBy
       };
       
       // 1. Create Receipt
       transaction.set(adminDb.collection("receipts").doc(receiptId), newReceipt);
       
       // 2. Update Invoice
       transaction.update(invRef, {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus
       });
       
       // 3. Update Deal to CLOSED_WON if Paid
       if (newStatus === "PAID") {
          const dealRef = adminDb.collection("deals").doc(invoice.dealId);
          // Phase 9.4: Deal Closure
          transaction.update(dealRef, {
             status: "CLOSED_WON",
             closedDate: new Date().toISOString()
          });
       }
    });

    return NextResponse.json({ success: true, receiptId, message: "Payment logged successfully" });
  } catch (error: any) {
    console.error("Receipt Creation Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

