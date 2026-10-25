import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { quoteId, paymentId } = await request.json();
    if (!quoteId || !paymentId) {
      return NextResponse.json({ success: false, error: "Missing payload" }, { status: 400 });
    }

    // Fallback Verification for preview environments where webhooks fail to reach localhost/vercel preview branches
    let quoteRef = adminDb.collection("quotes").doc(quoteId);
    let docSnap = await quoteRef.get();

    // Check case variations or nested subcollection if not found in root quotes
    if (!docSnap.exists) {
      const upperSnap = await adminDb.collection("quotes").doc(quoteId.toUpperCase()).get();
      if (upperSnap.exists) {
        quoteRef = adminDb.collection("quotes").doc(quoteId.toUpperCase());
        docSnap = upperSnap;
      }
    }

    if (!docSnap.exists) {
      try {
        const cgSnap = await adminDb.collectionGroup("quotes").where("id", "==", quoteId).limit(1).get();
        if (!cgSnap.empty) {
          docSnap = cgSnap.docs[0];
          quoteRef = docSnap.ref as any;
        }
      } catch (err) {
        console.warn("CollectionGroup lookup failed:", err);
      }
    }

    if (!docSnap.exists) {
      // Check change_orders collection
      const coRef = adminDb.collection("change_orders").doc(quoteId);
      const coSnap = await coRef.get();
      if (coSnap.exists) {
        const coData = coSnap.data() as any;
        await coRef.update({
          status: "approved",
          payment_status: "paid",
          payment_id: paymentId,
          paid_at: new Date().toISOString(),
          updated_at: serverTimestamp ? serverTimestamp() : new Date().toISOString()
        });

        // Also update supplementary invoice
        const suppInvSnap = await adminDb.collection("invoices").where("change_order_id", "==", quoteId).limit(1).get();
        if (!suppInvSnap.empty) {
          await suppInvSnap.docs[0].ref.update({
            payment_status: "paid",
            amount_paid: coData.total_payable,
            amount_due: 0,
            payment_references: [paymentId],
            updated_at: serverTimestamp ? serverTimestamp() : new Date().toISOString()
          });
        }

        return NextResponse.json({ success: true, is_change_order: true });
      }
    }

    if (docSnap.exists) {
      const data = docSnap.data() as any;
      const isAlreadyPaid = data?.status === "PAID" || data?.payment_status === "paid" || data?.payment_status === "captured";

      // Calculate totals
      const totalAmount = Number(
        data?.total_payable_after_discount ??
        data?.total_amount ??
        data?.pricingSnapshot?.total_payable ??
        data?.total_payable ??
        data?.total ??
        0
      );

      const isFullPayment = 
        data?.payment_type === "full" || 
        data?.payment_type === "full_discount" || 
        (Number(data?.razorpay_order_amount) > 500);

      const amountPaid = isFullPayment 
        ? Number(data?.razorpay_order_amount || totalAmount) 
        : 500;

      const amountDue = isFullPayment 
        ? 0 
        : Math.max(0, totalAmount - amountPaid);

      if (!isAlreadyPaid) {
        const updateData: any = {
          status: isFullPayment ? "PAID" : "BOOKED",
          payment_status: isFullPayment ? "paid" : "advance_paid",
          is_advance: !isFullPayment,
          amount_paid: amountPaid,
          amount_due: amountDue,
          payment_id: paymentId,
          paid_at: new Date().toISOString(),
          updated_at: serverTimestamp ? serverTimestamp() : new Date().toISOString(),
        };

        if (!isFullPayment) {
          updateData.booking_amount = 500;
        }

        await quoteRef.update(updateData);
      }

      const leadId = data?.lead_id || data?.leadId;
      if (leadId) {
        const leadRef = adminDb.collection("leads").doc(leadId);
        const leadSnap = await leadRef.get();
        if (leadSnap.exists) {
          await leadRef.update({
            status: isFullPayment ? "converted" : "booked",
            payment_status: isFullPayment ? "paid" : "advance_paid",
            amount_paid: amountPaid,
            amount_due: amountDue,
            payment_id: paymentId,
            paid_at: new Date().toISOString(),
            updated_at: serverTimestamp ? serverTimestamp() : new Date().toISOString(),
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Fallback verify error", e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
