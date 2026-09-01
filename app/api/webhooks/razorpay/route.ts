import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { InventoryEngine } from "@/lib/inventory-engine";

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.NEXT_PUBLIC_RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || "CCTV_Staging_Secret_2026_Secure";

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyText)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid Razorpay signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(bodyText);
    
    if (payload.event === "payment.captured" || payload.event === "order.paid") {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      
      const quoteId = paymentEntity.notes?.quote_id || paymentEntity.receipt;
      
      if (quoteId) {
        // Run as a Transaction to safely deduct inventory and generate Jobs
        await adminDb.runTransaction(async (transaction) => {
          const quoteRef = adminDb.collection("quotes").doc(quoteId);
          const quoteDoc = await transaction.get(quoteRef);
          
          if (!quoteDoc.exists) {
            console.error(`Quote ${quoteId} not found`);
            return;
          }
          
          const quoteData = quoteDoc.data() as any;
          
          if (quoteData.status === "PAID") {
             console.log("Quote already paid (Idempotency skip)");
             return; // Already processed
          }
          
          // 1. DEDUCT INVENTORY
          const items = quoteData.pricingSnapshot?.items || quoteData.configuration_snapshot || [];
          const inventoryItems = items.map((i: any) => ({ product_id: i.product_id || i.id, qty: i.qty }));
          
          let inventoryResult: { success: boolean; insufficientItems?: string[] } = { success: true, insufficientItems: [] };
          if (inventoryItems.length > 0) {
             inventoryResult = await InventoryEngine.attemptDeduction(
               transaction,
               inventoryItems,
               quoteId,
               "invoice"
             );
          }

          // 2. CREATE JOB
          const jobId = `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const jobRef = adminDb.collection("jobs").doc(jobId);
          const jobStatus = inventoryResult.success ? "PENDING_DISPATCH" : "BACKORDERED";
          
          const newJob = {
            id: jobId,
            lead_id: quoteData.lead_id || "N/A",
            quote_id: quoteId,
            invoice_ids: [quoteId], // Quote serves as invoice here
            change_order_ids: [],
            address: { pincode: quoteData.pincode || "000000", landmark1: "", landmark2: "", full_address: "", coordinates: { lat: 0, lng: 0 } },
            type: "installation",
            status: jobStatus,
            created_at: new Date().toISOString()
          };
          transaction.set(jobRef, newJob);

          // 3. CREATE AUDIT LOG
          const auditRef = adminDb.collection("audit_logs").doc();
          transaction.set(auditRef, {
            id: auditRef.id, 
            entity_type: "job", 
            entity_id: jobId, 
            action: "created", 
            actor: "system_webhook", 
            details: { quote_id: quoteId, inventory_status: inventoryResult.success ? "cleared" : "backordered" }, 
            created_at: new Date().toISOString()
          });

          // 4. UPDATE QUOTE TO PAID
          transaction.update(quoteRef, {
            status: "PAID",
            payment_id: paymentId,
            order_id: orderId,
            payment_method: paymentEntity.method,
            paid_at: new Date().toISOString(),
            job_id: jobId
          });
        });
        
        console.log(`Successfully processed ERP logic and marked Quote ${quoteId} as PAID`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
