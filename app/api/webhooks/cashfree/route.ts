import { NextRequest, NextResponse } from "next/server";
import { adminDb, serverTimestamp, increment } from "@/lib/firebase-admin";
import { sendCustomerWhatsApp, sendAdminNotification } from "@/lib/notification-service";
import { COLLECTIONS } from "@/lib/constants";
import { verifyWebhookSignature } from "@/lib/cashfree";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature") || "";
    
    // 1. Verify Signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type || payload.event;

    console.log(`[Cashfree Webhook] Received ${eventType}`, payload);

    // 2. Handle Payment Success (Customer EMI)
    if (eventType === "PAYMENT_SUCCESS_WEBHOOK") {
      const { order_id, payment_amount } = payload.data.order;
      const { lead_id, quote_id } = payload.data.order.order_tags || {};

      if (lead_id) {
        const leadRef = adminDb.collection(COLLECTIONS.LEADS).doc(lead_id);
        
        // Generate a 6-digit completion PIN
        const completionPin = Math.floor(100000 + Math.random() * 900000).toString();

        // Update Lead status to won and save PIN
        await leadRef.update({
          status: "won",
          payment_status: "paid",
          paid_amount: payment_amount,
          quote_accepted_id: quote_id,
          completion_pin: completionPin,
          updated_at: serverTimestamp()
        });

        // Update Quote status to accepted
        if (quote_id) {
          const quoteRef = leadRef.collection("quotes").doc(quote_id);
          await quoteRef.update({
            status: "accepted",
            accepted_at: serverTimestamp(),
            accepted_by_uid: "system_webhook"
          });
        }

        // Trigger Commission Logic if routed to a dealer
        const leadDoc = await leadRef.get();
        const leadData = leadDoc.data();
        const dealerId = leadData?.franchise_dealer_id;
        
        if (dealerId) {
          await adminDb.collection(COLLECTIONS.FRANCHISE_DEALERS).doc(dealerId).update({
            total_leads_won: increment(1),
            total_ex_tax_business: increment(payment_amount / 1.18), // Rough estimate
            updated_at: serverTimestamp()
          });

          // Create Commission Record
          await adminDb.collection(COLLECTIONS.COMMISSION_RECORDS).add({
            lead_id,
            dealer_id: dealerId,
            amount: payment_amount * 0.05, // 5% commission example
            status: "pending",
            created_at: serverTimestamp()
          });
        }

        // --- CUSTOMER PAYMENT RECEIPT ---
        if (leadData?.mobile_number) {
          await sendCustomerWhatsApp(
            leadData.mobile_number,
            `🎉 *Payment Successful!*\n\nHi ${leadData.customer_name || 'Customer'},\nWe have received your payment of ₹${payment_amount}.\n\nYour order is confirmed! Our installation team will contact you shortly to schedule your setup.\n\n*Important:* Once the installer finishes the work to your satisfaction, please provide them with this secure Completion PIN: *${completionPin}* to officially close the job.\n\nThank you for choosing TEAM CCTV! 🛡️`
          );
        }

        // --- AUTOMATED JOB CREATION & DISPATCH ---
        if (leadData) {
          const installerId = leadData.assigned_installer_id || null;
          
          const newJobRef = adminDb.collection("jobs").doc();
          await newJobRef.set({
            lead_id,
            quote_id: quote_id || null,
            address: {
              pincode: leadData.detected_pincode || "",
              city: leadData.detected_city || "",
              state: leadData.detected_state || "",
              full_address: leadData.wizard_answers?.full_address || `${leadData.detected_city} ${leadData.detected_state} ${leadData.detected_pincode}`,
            },
            installer_id: installerId,
            hub_id: null,
            type: "installation",
            status: installerId ? "dispatched" : "pending_dispatch",
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });

          // Notify Installer if Auto-Assigned
          if (installerId) {
            const installerDoc = await adminDb.collection("installers").doc(installerId).get();
            if (installerDoc.exists) {
              const installer = installerDoc.data();
              if (installer?.mobile_number) {
                await sendCustomerWhatsApp(
                  installer.mobile_number,
                  `🚀 *New Job Dispatched!*\nJob ID: ${newJobRef.id}\nCustomer: ${leadData.customer_name}\nLocation: ${leadData.detected_pincode}\nPlease check your Installer App for details.`
                );
              }
            }
          } else {
            // Escalate to Admin
            await sendAdminNotification(`🚨 *URGENT: Unassigned Paid Job*\nJob ID: ${newJobRef.id}\nCustomer: ${leadData.customer_name} has paid the advance, but no Installer covers Pincode ${leadData.detected_pincode}.\nPlease dispatch immediately via the Admin Dispatch Center.`);
          }
        }
      }
    }

    // 3. Handle Subscription Status Change (Franchise Fee)
    if (eventType === "SUBSCRIPTION_STATUS_CHANGE_WEBHOOK") {
      const { subscription_id, status } = payload.data.subscription;
      const dealerId = payload.data.subscription.customer_details?.customer_id;

      if (dealerId) {
        await adminDb.collection(COLLECTIONS.FRANCHISE_DEALERS).doc(dealerId).update({
          subscription_status: status,
          is_active: status === "ACTIVE",
          updated_at: serverTimestamp()
        });
      }
    }

    // 4. Handle Payout Success
    if (eventType === "TRANSFER_SUCCESS") {
      const transferId = payload.transferId || payload.data?.transfer?.transferId || payload.data?.transferId;
      if (transferId) {
        const payoutId = transferId.replace("transfer_", "");
        const payoutRef = adminDb.collection("payout_requests").doc(payoutId);
        const payoutDoc = await payoutRef.get();
        
        if (payoutDoc.exists) {
          const payoutData = payoutDoc.data() as any;
          if (payoutData.status === "processing") {
            await payoutRef.update({
              status: "success",
              updated_at: serverTimestamp()
            });

            // Update user wallet balance
            const userRef = adminDb.collection(payoutData.user_type + "s").doc(payoutData.user_id);
            await userRef.update({
              wallet_balance: increment(-payoutData.gross_amount),
              updated_at: serverTimestamp()
            });

            // Create ledger entry
            await adminDb.collection("ledger_transactions").add({
              user_id: payoutData.user_id,
              user_type: payoutData.user_type,
              amount: -payoutData.gross_amount,
              type: "payout",
              description: `Payout processed successfully (Net: Rs ${payoutData.net_amount}, TDS: Rs ${payoutData.tds_amount})`,
              created_at: serverTimestamp(),
              payout_id: payoutId,
            });
          }
        }
      }
    }

    // 5. Handle Payout Failure
    if (eventType === "TRANSFER_FAILED" || eventType === "TRANSFER_REJECTED") {
      const transferId = payload.transferId || payload.data?.transfer?.transferId || payload.data?.transferId;
      if (transferId) {
        const payoutId = transferId.replace("transfer_", "");
        const payoutRef = adminDb.collection("payout_requests").doc(payoutId);
        const payoutDoc = await payoutRef.get();
        
        if (payoutDoc.exists) {
          const payoutData = payoutDoc.data() as any;
          if (payoutData.status === "processing") {
            await payoutRef.update({
              status: "failed",
              failure_reason: payload.reason || payload.data?.transfer?.reason || "Transfer failed",
              updated_at: serverTimestamp()
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Cashfree Webhook Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
