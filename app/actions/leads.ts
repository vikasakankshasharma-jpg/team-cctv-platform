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

      if (existingComms.empty && (leadData?.promoter_id || leadData?.assigned_to_salesperson_id || leadData?.assigned_salesperson_id)) {
        const quotesSnap = await transaction.get(
          leadRef.collection(SUBCOLLECTIONS.QUOTES).orderBy("created_at", "desc").limit(1)
        );
          
        if (!quotesSnap.empty) {
          const quoteData = quotesSnap.docs[0].data();
          const netTaxable = quoteData.net_taxable_amount || quoteData.total_payable || 0;
          const quoteId = quotesSnap.docs[0].id;
          
          // Helper to calculate and generate commission
          const generateCommission = async (userId: string, userType: "promoter" | "salesperson", collectionName: string) => {
            const userRef = adminDb.collection(collectionName).doc(userId);
            const userDoc = await transaction.get(userRef);
            
            if (userDoc.exists) {
              const user = userDoc.data() as import("@/types").Promoter | import("@/types").Salesperson;
              
              let commissionAmount = 0;
              if (user.use_global_commission && user.commission_slabs) {
                const slab = user.commission_slabs.find(s => 
                  netTaxable >= s.from && (s.to === null || netTaxable <= s.to)
                );
                if (slab) {
                  commissionAmount = slab.type === "percent" 
                    ? netTaxable * (slab.value / 100) 
                    : slab.value;
                }
              } else if (user.discount_type === "percent") {
                commissionAmount = netTaxable * ((user.discount_value || 0) / 100);
              } else if (user.discount_type === "flat") {
                commissionAmount = user.discount_value || 0;
              }

              if (commissionAmount > 0) {
                const newCommRef = adminDb.collection(COLLECTIONS.COMMISSION_RECORDS).doc();
                transaction.set(newCommRef, {
                  lead_id: leadId,
                  quote_id: quoteId,
                  user_id: userId,
                  user_type: userType,
                  promoter_id: userType === "promoter" ? userId : undefined, // Legacy support
                  ex_tax_amount: netTaxable,
                  commission_amount: commissionAmount,
                  status: "pending",
                  created_at: new Date(),
                  updated_at: new Date()
                });

                transaction.update(userRef, {
                  total_ex_tax_business: (user.total_ex_tax_business || 0) + netTaxable,
                  total_won_leads: (user.total_won_leads || 0) + 1
                });
              }
            }
          };

          // Generate for Promoter if exists
          if (leadData?.promoter_id) {
            await generateCommission(leadData.promoter_id, "promoter", COLLECTIONS.PROMOTERS);
          }

          // Generate for Salesperson if exists
          const salespersonId = leadData?.assigned_to_salesperson_id || leadData?.assigned_salesperson_id;
          if (salespersonId) {
            await generateCommission(salespersonId, "salesperson", "salespersons");
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
 * Requires the customer's Completion PIN for verification.
 */
export async function updateLeadInstallationProof(leadId: string, photoUrl: string, status: string, note?: string, pin?: string) {
  const { verifySession } = await import("@/lib/auth-server");
  const { verifyInstallerSession } = await import("@/lib/auth-installer");
  
  const adminSession = await verifySession();
  const installerSession = await verifyInstallerSession();
  
  const isAuthorized = 
    (adminSession.isAuthenticated && adminSession.role === "super_admin") || 
    installerSession.isAuthenticated;

  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  // Verify PIN
  const leadDoc = await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).get();
  if (!leadDoc.exists) throw new Error("Lead not found");
  
  const leadData = leadDoc.data();
  if (leadData?.completion_pin && leadData.completion_pin !== pin) {
    throw new Error("Invalid Completion PIN. Please check with the customer.");
  }

  const updatePayload: any = {
    updated_at: new Date(),
    installation_proof_url: photoUrl
  };
  
  if (note) {
    updatePayload.installation_note = note;
  }
  
  await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update(updatePayload);

  // Trigger commission calculation & status update seamlessly
  await updateLeadStatus(leadId, "won", note);
  
  // Find associated job and mark completed
  const jobsSnap = await adminDb.collection("jobs").where("lead_id", "==", leadId).get();
  for (const job of jobsSnap.docs) {
    await adminDb.collection("jobs").doc(job.id).update({
      status: "completed",
      completed_at: new Date()
    });
  }
  
  revalidatePath("/admin/dispatch");
  revalidatePath("/installer/jobs");
  revalidatePath("/installer/ledger");
  return { success: true };
}

/**
 * Resends the Completion PIN to the customer via WhatsApp
 */
export async function resendCompletionPin(leadId: string) {
  const { verifyInstallerSession } = await import("@/lib/auth-installer");
  const { sendCustomerWhatsApp } = await import("@/lib/notification-service");
  
  const session = await verifyInstallerSession();
  if (!session.isAuthenticated) throw new Error("Unauthorized");

  const leadDoc = await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).get();
  if (!leadDoc.exists) throw new Error("Lead not found");
  
  const leadData = leadDoc.data();
  if (!leadData?.completion_pin || !leadData?.mobile_number) {
    throw new Error("No PIN or mobile number found for this customer.");
  }

  await sendCustomerWhatsApp(
    leadData.mobile_number,
    `🔔 *Installation Reminder*\n\nHi ${leadData.customer_name || 'Customer'},\nYour installer is currently at your site.\nOnce the installation is fully complete to your satisfaction, please provide them with this secure Completion PIN: *${leadData.completion_pin}* to officially close the job.\n\nThank you for choosing TEAM CCTV! 🛡️`
  );

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
    
    const leadRef = adminDb.collection("leads").doc(leadId);
    const leadDoc = await leadRef.get();
    
    const updatePayload: any = {
      updated_at: serverTimestamp()
    };

    let newStatus = "";

    if (leadDoc.exists) {
      const currentStatus = leadDoc.data()?.status;
      // Auto-update status to "contacted" if it's new or attempted and we logged a successful call or note
      if ((activityData.type === "call" || activityData.type === "note") && ["new", "attempted"].includes(currentStatus)) {
        updatePayload.status = "contacted";
        newStatus = "contacted";
      } 
      // Auto-update status to "attempted" if we logged an attempted call and it's new
      else if (activityData.type === "call_attempted" && currentStatus === "new") {
        updatePayload.status = "attempted";
        newStatus = "attempted";
      }
      // Auto-update status to "site_visit" if we logged a site visit and it's in an earlier stage
      else if (activityData.type === "site_visit" && ["new", "attempted", "contacted"].includes(currentStatus)) {
        updatePayload.status = "site_visit";
        newStatus = "site_visit";
        updatePayload.sla_breach_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
        updatePayload.is_escalated = false;
      }
    }
    
    await leadRef.update(updatePayload);
    
    revalidatePath("/admin/leads");
    return { success: true, newStatus };
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
