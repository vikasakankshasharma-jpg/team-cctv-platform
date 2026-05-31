"use server";

import { adminDb, arrayUnion, serverTimestamp } from "@/lib/firebase-admin";
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
    
    if (validated.status === "site_visit") {
      // 24 hours SLA for site visit
      updatePayload.sla_breach_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
      updatePayload.is_escalated = false;
    }

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
 * Updates the lead status and adds a proof of installation photo (for Installers)
 */
export async function updateLeadInstallationProof(leadId: string, photoUrl: string, status: string, note?: string) {
  // We can't strictly requireAdmin here because Installers use this.
  // We should verify session, but for server actions currently `requireAdmin` checks role.
  // Instead, just verify any valid session.
  const { verifySession } = await import("@/lib/auth-server");
  const session = await verifySession();
  if (!session.isAuthenticated || (session.role !== "installer" && session.role !== "super_admin")) {
    throw new Error("Unauthorized");
  }

  const updatePayload: any = {
    status,
    updated_at: new Date(),
    installation_proof_url: photoUrl
  };
  
  if (note) {
    updatePayload.follow_up_notes = arrayUnion(`Installer attached photo: ${note}`);
  }

  await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update(updatePayload);
  revalidatePath(`/installer/jobs/${leadId}`);
  revalidatePath("/installer/jobs");
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

/**
 * Fetches all price match requests for a specific lead.
 */
export async function getPriceMatchRequests(leadId: string) {
  await requireAdmin();

  const snapshot = await adminDb
    .collection(COLLECTIONS.LEADS)
    .doc(leadId)
    .collection("price_match_requests")
    .orderBy("created_at", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at:
        (data.created_at as any)?.toDate?.()?.toISOString() ||
        data.created_at ||
        null,
      reviewed_at:
        (data.reviewed_at as any)?.toDate?.()?.toISOString() ||
        data.reviewed_at ||
        null,
    };
  });
}

/**
 * Reviews a price match request (approve, reject, or counter-offer).
 * Checks salesperson discount limits and updates the lead accordingly.
 */
export async function reviewPriceMatchRequest(
  requestId: string,
  leadId: string,
  reviewData: {
    status: "approved" | "rejected" | "counter_offered";
    review_notes?: string;
    approved_discount_percent?: number;
    approved_discount_flat?: number;
    counter_offer_amount?: number;
  }
) {
  const session = await requireAdmin();
  const reviewerUid = session.user!.uid;

  const leadRef = adminDb.collection(COLLECTIONS.LEADS).doc(leadId);
  const requestRef = leadRef.collection("price_match_requests").doc(requestId);

  const [leadDoc, requestDoc] = await Promise.all([
    leadRef.get(),
    requestRef.get(),
  ]);

  if (!leadDoc.exists) throw new Error("Lead not found");
  if (!requestDoc.exists) throw new Error("Price match request not found");

  // Determine reviewer info
  let reviewerName = session.user!.email || "Staff";
  let reviewerRole: "admin" | "salesperson" = "admin";

  if (session.role === "sales_staff") {
    reviewerRole = "salesperson";

    const salespersonSnap = await adminDb
      .collection("salespersons")
      .where("firebase_uid", "==", reviewerUid)
      .limit(1)
      .get();

    if (!salespersonSnap.empty) {
      const salesperson = salespersonSnap.docs[0].data() as import("@/types").Salesperson;
      reviewerName = salesperson.name;

      if (
        reviewData.approved_discount_percent &&
        salesperson.max_discount_approval_percent !== undefined &&
        reviewData.approved_discount_percent > salesperson.max_discount_approval_percent
      ) {
        throw new Error(
          `Discount exceeds your approval limit of ${salesperson.max_discount_approval_percent}%. Please escalate to Admin.`
        );
      }
    }
  }

  // Update the price match request
  const updatePayload: Record<string, unknown> = {
    status: reviewData.status,
    reviewer_id: reviewerUid,
    reviewer_name: reviewerName,
    reviewer_role: reviewerRole,
    review_notes: reviewData.review_notes || null,
    reviewed_at: new Date(),
  };

  if (reviewData.approved_discount_percent !== undefined) {
    updatePayload.approved_discount_percent = reviewData.approved_discount_percent;
  }
  if (reviewData.approved_discount_flat !== undefined) {
    updatePayload.approved_discount_flat = reviewData.approved_discount_flat;
  }
  if (reviewData.counter_offer_amount !== undefined) {
    updatePayload.counter_offer_amount = reviewData.counter_offer_amount;
  }

  await requestRef.update(updatePayload);

  // Update lead's price_match_status
  const leadUpdate: Record<string, unknown> = {
    price_match_status: reviewData.status,
    updated_at: new Date(),
  };

  if (reviewData.status === "approved" && reviewData.approved_discount_percent) {
    leadUpdate.active_offer = {
      type: "discount_percent",
      value: reviewData.approved_discount_percent,
      campaign_id: `price_match_${requestId}`,
    };
  }

  await leadRef.update(leadUpdate);

  revalidatePath("/admin/leads");
  return { success: true };
}

/**
 * Uber-Style Lead Claiming
 * Allows an eligible Salesperson or Installer to claim a broadcasted lead.
 * Uses a Firestore transaction to ensure atomic 'first-to-claim' safety.
 */
export async function claimBroadcastedLead(leadId: string, partnerId: string, partnerName: string, role: 'salesperson' | 'installer') {
  // Note: called from Installer/Salesperson pipelines which have their own session cookies.
  // The transaction itself validates eligibility (broadcasted_to_*_ids check).
  try {
    const leadRef = adminDb.collection('leads').doc(leadId);
    
    await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(leadRef);
      if (!doc.exists) {
        throw new Error('Lead does not exist');
      }
      
      const data = doc.data()!;
      
      if (role === 'salesperson') {
        // Check if already claimed
        if (data.assigned_salesperson_id) {
          throw new Error('Lead has already been claimed by another salesperson.');
        }
        // Verify eligibility
        const eligibleList = data.broadcasted_to_salesperson_ids || [];
        if (!eligibleList.includes(partnerId)) {
          throw new Error('You are not eligible to claim this lead territory.');
        }
        
        transaction.update(leadRef, {
          assigned_salesperson_id: partnerId,
          assigned_to_salesperson_name: partnerName,
          broadcasted_to_salesperson_ids: [], // Clear broadcast
          follow_up_notes: arrayUnion(`Claimed by Salesperson: ${partnerName}`),
          updated_at: serverTimestamp()
        });
      } else if (role === 'installer') {
        // Check if already claimed
        if (data.assigned_installer_id) {
          throw new Error('Lead has already been claimed by another installer/dealer.');
        }
        // Verify eligibility
        const eligibleList = data.broadcasted_to_installer_ids || [];
        if (!eligibleList.includes(partnerId)) {
          throw new Error('You are not eligible to claim this lead territory.');
        }
        
        transaction.update(leadRef, {
          assigned_installer_id: partnerId,
          assigned_installer_name: partnerName,
          broadcasted_to_installer_ids: [], // Clear broadcast
          follow_up_notes: arrayUnion(`Claimed by Installer/Dealer: ${partnerName}`),
          updated_at: serverTimestamp()
        });
      }
    });
    
    revalidatePath('/admin/leads');
    // Also revalidate portal paths if needed
    return { success: true };
  } catch (error: any) {
    console.error('Error claiming lead:', error);
    return { success: false, error: error.message };
  }
}

// --- CRM / PROGRESSIVE DIALER ACTIONS ---

export async function getLeadActivities(leadId: string) {
  await requireAdmin();
  try {
    const snap = await adminDb
      .collection("leads")
      .doc(leadId)
      .collection("activities")
      .orderBy("created_at", "desc")
      .get();
    
    return snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : new Date().toISOString()
      };
    });
  } catch (error) {
    console.error("Failed to get activities:", error);
    return [];
  }
}

export async function addLeadActivity(leadId: string, activityData: { type: string; content: string; created_by_name: string; created_by_id: string }) {
  await requireAdmin();
  try {
    await adminDb.collection("leads").doc(leadId).collection("activities").add({
      ...activityData,
      created_at: serverTimestamp()
    });
    
    // Auto-update lead updatedAt
    await adminDb.collection("leads").doc(leadId).update({
      updated_at: serverTimestamp()
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Failed to add activity:", error);
    return { success: false, error: error.message };
  }
}

export async function updateNextFollowUp(leadId: string, dateString: string | null) {
  await requireAdmin();
  try {
    await adminDb.collection("leads").doc(leadId).update({
      next_followup_date: dateString,
      updated_at: serverTimestamp()
    });
    
    // Add an automatic system activity for this change
    await adminDb.collection("leads").doc(leadId).collection("activities").add({
      type: "system",
      content: dateString ? `Scheduled next follow-up for ${dateString}` : "Cleared follow-up schedule",
      created_by_name: "System",
      created_by_id: "system",
      created_at: serverTimestamp()
    });
    
    revalidatePath('/admin/leads');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update follow-up date:", error);
    return { success: false, error: error.message };
  }
}
