import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Ensure admin app is initialized once
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Triggered whenever a Lead document is updated.
 * We track when status changes to "won". When it does, and there is a promoter attached,
 * we generate the commission record for this lead automatically using an atomic transaction.
 */
export const onLeadStatusWon = functions.firestore
  .document("leads/{leadId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const leadId = context.params.leadId;

    // 1. Filter for status transitions to 'won'
    if (beforeData.status === "won" || afterData.status !== "won") {
      return null;
    }

    const promoterId = afterData.promoter_id;
    if (!promoterId) {
      console.log(`[Elite Intelligence] Lead ${leadId} won. No promoter attached. Payout bypassed.`);
      return null;
    }

    try {
      // 2. Atomic Transaction Orchestration
      await admin.firestore().runTransaction(async (transaction) => {
        // A. Identify the Accepted Quote
        const quotesSnapshot = await admin.firestore()
          .collection(`leads/${leadId}/quotes`)
          .orderBy("created_at", "desc")
          .limit(1)
          .get();

        if (quotesSnapshot.empty) {
          throw new Error(`Critical Fault: Won lead ${leadId} has no quote history.`);
        }

        const quoteDoc = quotesSnapshot.docs[0];
        const quoteData = quoteDoc.data();
        const exTaxAmount = quoteData.net_taxable_amount || 0;

        if (exTaxAmount <= 0) {
          console.warn(`[Audit] Lead ${leadId} has Zero-Value ex-tax business. Skipping record.`);
          return;
        }

        // B. Fetch Promoter Context
        const promoterRef = admin.firestore().collection("promoters").doc(promoterId);
        const promoterDoc = await transaction.get(promoterRef);

        if (!promoterDoc.exists) {
          throw new Error(`Reference Error: Promoter ${promoterId} not found.`);
        }

        const promoterData = promoterDoc.data()!;
        let slabsToUse: { from: number; to: number | null; type: string; value: number }[] = [];

        if (promoterData.use_global_commission) {
          const globalRules = await admin.firestore()
            .collection("commission_rules")
            .where("scope", "==", "global")
            .limit(1)
            .get();
          if (!globalRules.empty) {
            slabsToUse = globalRules.docs[0].data().slabs || [];
          }
        } else {
          slabsToUse = promoterData.commission_slabs || [];
        }

        // C. Precision Calculation
        let commissionValue = 0;
        const matchingSlab = slabsToUse.find((slab: { from: number; to: number | null; type: string; value: number }) => {
          const isAboveOrEqual = exTaxAmount >= slab.from;
          const isBelowLimit = slab.to === null || exTaxAmount < slab.to;
          return isAboveOrEqual && isBelowLimit;
        });

        if (matchingSlab) {
          if (matchingSlab.type === "flat") {
            commissionValue = matchingSlab.value;
          } else if (matchingSlab.type === "percent") {
            commissionValue = exTaxAmount * (matchingSlab.value / 100);
          }
        }

        commissionValue = Math.round(commissionValue * 100) / 100;

        if (commissionValue <= 0) {
          console.log(`[Audit] Calculation yielded zero commission for Lead ${leadId}.`);
          return;
        }

        // D. Atomic Commit
        const recordRef = admin.firestore().collection("commission_records").doc();
        transaction.set(recordRef, {
          lead_id: leadId,
          quote_id: quoteDoc.id,
          promoter_id: promoterId,
          ex_tax_amount: exTaxAmount,
          commission_amount: commissionValue,
          status: "pending",
          payout_id: null,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        transaction.update(promoterRef, {
          total_leads_referred: admin.firestore.FieldValue.increment(1),
          total_ex_tax_business: admin.firestore.FieldValue.increment(exTaxAmount),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`[Elite Sync] Atomic payout created: ${recordRef.id} for Promoter ${promoterId}`);
      });
    } catch (error) {
      const err = error as Error;
      console.error(`[CRITICAL FAULT] Commission Orchestration Failed: ${err.message}`);
      // In production, you might trigger a dead-letter record here or notify staff via WhatsApp/Email.
    }

    return null;
  });
