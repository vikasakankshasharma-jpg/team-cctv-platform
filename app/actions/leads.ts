"use server";

import { adminDb, arrayUnion } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/lib/constants";
import { UpdateLeadStatusSchema } from "@/lib/validators";
import type { Lead, Promoter } from "@/types";

/**
 * Updates the status of a lead.
 * Transitioning to "won" will trigger commission calculation logic.
 */
export async function updateLeadStatus(leadId: string, status: string, note?: string) {
  await requireAdmin();

  // Enforce schema validation
  const validated = UpdateLeadStatusSchema.parse({ lead_id: leadId, status, note });

  if (validated.status === "won") {
    await adminDb.runTransaction(async (transaction) => {
      // 1. Check existing comms
      const existingComms = await transaction.get(
        adminDb.collection(COLLECTIONS.COMMISSION_RECORDS).where("lead_id", "==", leadId)
      );
      
      const leadRef = adminDb.collection(COLLECTIONS.LEADS).doc(leadId);
      const leadDoc = await transaction.get(leadRef);
      const leadData = leadDoc.data() as Lead | undefined;

      // Prepare payload for lead update
      const updatePayload: any = {
        status: validated.status,
        updated_at: new Date()
      };
      if (validated.note) {
        updatePayload.follow_up_notes = arrayUnion(validated.note);
      }

      if (existingComms.empty && leadData?.promoter_id) {
        const quotesSnap = await transaction.get(
          leadRef.collection(SUBCOLLECTIONS.QUOTES).orderBy("created_at", "desc").limit(1)
        );
          
        if (!quotesSnap.empty) {
          const quoteData = quotesSnap.docs[0].data();
          const netTaxable = quoteData.net_taxable_amount || quoteData.total_payable || 0;
          const quoteId = quotesSnap.docs[0].id;
          
          const promoterRef = adminDb.collection(COLLECTIONS.PROMOTERS).doc(leadData.promoter_id);
          const promoterDoc = await transaction.get(promoterRef);
          
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
              const newCommRef = adminDb.collection(COLLECTIONS.COMMISSION_RECORDS).doc();
              transaction.set(newCommRef, {
                lead_id: leadId,
                quote_id: quoteId,
                promoter_id: leadData.promoter_id,
                ex_tax_amount: netTaxable,
                commission_amount: commissionAmount,
                status: "pending",
                created_at: new Date(),
                updated_at: new Date()
              });

              transaction.update(promoterRef, {
                total_ex_tax_business: (promoter.total_ex_tax_business || 0) + netTaxable,
                total_won_leads: (promoter.total_won_leads || 0) + 1
              });
            }
          }
        }
      }

      // Always update lead status within the transaction
      transaction.update(leadRef, updatePayload);
    });
  } else {
    // If not "won", just do a standard update
    const updatePayload: any = {
      status: validated.status,
      updated_at: new Date()
    };
    
    if (validated.note) {
      updatePayload.follow_up_notes = arrayUnion(validated.note);
    }
  
    await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update(updatePayload);
  }

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

/**
 * Assigns a lead to a salesperson
 */
export async function assignLeadToSalesperson(leadId: string, salespersonId: string | null, salespersonName: string | null) {
  await requireAdmin();

  const updatePayload: any = {
    assigned_to_salesperson_id: salespersonId,
    assigned_to_salesperson_name: salespersonName,
    updated_at: new Date()
  };

  await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update(updatePayload);
  
  revalidatePath("/admin/leads");
  return { success: true };
}
