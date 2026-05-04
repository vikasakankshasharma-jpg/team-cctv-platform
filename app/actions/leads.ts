"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/lib/constants";
import type { Lead, Promoter } from "@/types";

/**
 * Updates the status of a lead.
 * Transitioning to "won" will trigger commission calculation logic.
 */
export async function updateLeadStatus(leadId: string, status: string) {
  await requireAdmin();

  // If status is won, calculate and create commission
  if (status === "won") {
    const existingComms = await adminDb
      .collection(COLLECTIONS.COMMISSION_RECORDS)
      .where("lead_id", "==", leadId)
      .get();
      
    if (existingComms.empty) {
      const leadDoc = await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).get();
      const leadData = leadDoc.data() as Lead;
      
      if (leadData?.promoter_id) {
        // fetch latest quote
        const quotesSnap = await leadDoc.ref
          .collection(SUBCOLLECTIONS.QUOTES)
          .orderBy("created_at", "desc")
          .limit(1)
          .get();
          
        if (!quotesSnap.empty) {
          const quoteData = quotesSnap.docs[0].data();
          const netTaxable = quoteData.net_taxable_amount || quoteData.total_payable || 0;
          const quoteId = quotesSnap.docs[0].id;
          
          const promoterDoc = await adminDb.collection(COLLECTIONS.PROMOTERS).doc(leadData.promoter_id).get();
          if (promoterDoc.exists) {
            const promoter = promoterDoc.data() as Promoter;
            
            let commissionAmount = 0;
            if (promoter.use_global_commission && promoter.commission_slabs) {
              const slab = promoter.commission_slabs.find(s => 
                netTaxable >= s.from && (s.to === null || netTaxable <= s.to)
              );
              if (slab) {
                commissionAmount = slab.type === "percent" 
                  ? netTaxable * (slab.value / 100) 
                  : slab.value;
              }
            } else if (promoter.discount_type === "percent") {
              commissionAmount = netTaxable * ((promoter.discount_value || 0) / 100);
            } else if (promoter.discount_type === "flat") {
              commissionAmount = promoter.discount_value || 0;
            }

            if (commissionAmount > 0) {
              await adminDb.collection(COLLECTIONS.COMMISSION_RECORDS).add({
                lead_id: leadId,
                quote_id: quoteId,
                promoter_id: leadData.promoter_id,
                ex_tax_amount: netTaxable,
                commission_amount: commissionAmount,
                status: "pending",
                created_at: new Date(),
                updated_at: new Date()
              });

              await promoterDoc.ref.update({
                total_ex_tax_business: (promoter.total_ex_tax_business || 0) + netTaxable,
                total_won_leads: (promoter.total_won_leads || 0) + 1
              });
            }
          }
        }
      }
    }
  }

  await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
    status,
    updated_at: new Date()
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/commission");
  return { success: true };
}

/**
 * Fetches all quotes associated with a specific lead
 */
export async function getLeadQuotes(leadId: string) {
  await requireAdmin();

  const snapshot = await adminDb
    .collection(COLLECTIONS.LEADS)
    .doc(leadId)
    .collection(SUBCOLLECTIONS.QUOTES)
    .orderBy("created_at", "desc")
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at || null,
    };
  });
}

