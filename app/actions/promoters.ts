"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { COLLECTIONS } from "@/lib/constants";
import type { Promoter, PreprintedBatch, PreprintedToken, PartnerType } from "@/types";

export interface CreatePromoterInput {
  name: string;
  email: string;
  mobile_number: string;
  referral_code: string;
  is_active: boolean;
  partner_type?: PartnerType;
  promoter_incentive_type?: "percent" | "flat";
  promoter_incentive_value?: number;
  discount_type?: "flat" | "percent";
  discount_value?: number;
  min_order_value?: number;
  custom_layout_id?: string | null;
  batch_id?: string;
}

export interface UpdatePromoterInput {
  name?: string;
  email?: string;
  mobile_number?: string;
  is_active?: boolean;
  partner_type?: PartnerType;
  promoter_incentive_type?: "percent" | "flat";
  promoter_incentive_value?: number;
  discount_type?: "flat" | "percent";
  discount_value?: number;
  min_order_value?: number;
  custom_layout_id?: string | null;
}

/**
 * Automatically predicts / finds the next sequential referral code to assign.
 * 1. Checks if there is an unassigned pre-printed card in the preprinted_tokens pool.
 * 2. If found, returns that code, its batch ID, and the number of unassigned cards remaining.
 * 3. If no pre-printed cards are left in stock, scans existing promoters and returns the next sequential TEAM-XXXX code.
 */
export async function getNextSequentialReferralCode(): Promise<{
  code: string;
  isPreprinted: boolean;
  batchId?: string;
  remainingUnassigned: number;
}> {
  await requireAdmin();

  try {
    // 1. Look for unassigned token from preprinted pool
    const unassignedSnap = await adminDb
      .collection(COLLECTIONS.PREPRINTED_TOKENS)
      .where("status", "==", "unassigned")
      .orderBy("sequence_num", "asc")
      .limit(1)
      .get();

    // Count remaining unassigned
    const totalUnassignedSnap = await adminDb
      .collection(COLLECTIONS.PREPRINTED_TOKENS)
      .where("status", "==", "unassigned")
      .get();
    const remainingCount = totalUnassignedSnap.size;

    if (!unassignedSnap.empty) {
      const doc = unassignedSnap.docs[0];
      const data = doc.data() as PreprintedToken;
      return {
        code: data.code,
        isPreprinted: true,
        batchId: data.batch_id,
        remainingUnassigned: remainingCount,
      };
    }

    // 2. Fallback: calculate next sequential code from existing promoters & tokens
    const promotersSnap = await adminDb.collection(COLLECTIONS.PROMOTERS).get();
    let maxNumber = 1000;

    promotersSnap.forEach((doc) => {
      const code = (doc.data().referral_code || "").toUpperCase();
      const match = code.match(/^(?:TEAM-?|P-?|REF-?)(d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    // Also check max from preprinted batches
    const batchesSnap = await adminDb.collection(COLLECTIONS.PREPRINTED_BATCHES).get();
    batchesSnap.forEach((doc) => {
      const bData = doc.data() as PreprintedBatch;
      if (bData.end_number && bData.end_number > maxNumber) {
        maxNumber = bData.end_number;
      }
    });

    const nextCode = `TEAM-${maxNumber + 1}`;
    return {
      code: nextCode,
      isPreprinted: false,
      remainingUnassigned: 0,
    };
  } catch (error) {
    console.error("[getNextSequentialReferralCode] Error:", error);
    return {
      code: "TEAM-1001",
      isPreprinted: false,
      remainingUnassigned: 0,
    };
  }
}

/**
 * Retrieves available unassigned pre-printed tokens for dropdown / pick selection
 */
export async function getUnassignedTokens(limitCount = 50): Promise<PreprintedToken[]> {
  await requireAdmin();

  try {
    const snap = await adminDb
      .collection(COLLECTIONS.PREPRINTED_TOKENS)
      .where("status", "==", "unassigned")
      .orderBy("sequence_num", "asc")
      .limit(limitCount)
      .get();

    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PreprintedToken[];
  } catch (err) {
    console.error("[getUnassignedTokens] Error:", err);
    return [];
  }
}

/**
 * Creates a new Promoter in Firestore with sequential token attribution
 */
export async function createPromoter(data: CreatePromoterInput) {
  await requireAdmin();

  const cleanCode = data.referral_code.toUpperCase().replace(/\s+/g, "");

  // Prevent duplicate referral codes
  const existingSnap = await adminDb
    .collection(COLLECTIONS.PROMOTERS)
    .where("referral_code", "==", cleanCode)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    throw new Error(`Referral code ${cleanCode} is already assigned to another partner.`);
  }

  // Check if this code corresponds to a pre-printed token
  const tokenSnap = await adminDb
    .collection(COLLECTIONS.PREPRINTED_TOKENS)
    .where("code", "==", cleanCode)
    .limit(1)
    .get();

  const isPreprinted = !tokenSnap.empty;
  let batchId = data.batch_id;

  const promoterData = {
    name: data.name.trim(),
    email: data.email.trim(),
    mobile_number: data.mobile_number.trim(),
    referral_code: cleanCode,
    is_active: data.is_active ?? true,
    partner_type: data.partner_type || "percent",
    promoter_incentive_type: data.promoter_incentive_type || (data.partner_type === "flat" ? "flat" : "percent"),
    promoter_incentive_value: Number(data.promoter_incentive_value) || 0,
    discount_type: data.discount_type || (data.partner_type === "flat" ? "flat" : "percent"),
    discount_value: Number(data.discount_value) || 0,
    min_order_value: Number(data.min_order_value) || 0,
    custom_layout_id: data.custom_layout_id || null,
    is_preprinted: isPreprinted,
    batch_id: batchId || (isPreprinted ? tokenSnap.docs[0].data().batch_id : null),
    total_won_leads: 0,
    total_ex_tax_business: 0,
    total_qr_scans: 0,
    use_global_commission: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const docRef = await adminDb.collection(COLLECTIONS.PROMOTERS).add(promoterData);

  // If bound to a pre-printed token, update token state & batch counter
  if (isPreprinted) {
    const tokenDoc = tokenSnap.docs[0];
    const tokenData = tokenDoc.data();
    batchId = batchId || tokenData.batch_id;

    await tokenDoc.ref.update({
      status: "assigned",
      assigned_to_promoter_id: docRef.id,
      assigned_to_promoter_name: data.name,
      assigned_at: new Date(),
    });

    if (batchId) {
      try {
        const batchRef = adminDb.collection(COLLECTIONS.PREPRINTED_BATCHES).doc(batchId);
        const batchDoc = await batchRef.get();
        if (batchDoc.exists) {
          const currentAssigned = batchDoc.data()?.assigned_cards || 0;
          await batchRef.update({ assigned_cards: currentAssigned + 1 });
        }
      } catch (e) {
        console.warn("[createPromoter] Failed to increment batch assigned counter:", e);
      }
    }
  }

  revalidatePath("/admin/promoters");
  return { id: docRef.id, ...promoterData };
}

/**
 * Updates an existing Promoter
 */
export async function updatePromoter(id: string, data: UpdatePromoterInput) {
  await requireAdmin();

  const updateData: any = {
    updated_at: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.email !== undefined) updateData.email = data.email.trim();
  if (data.mobile_number !== undefined) updateData.mobile_number = data.mobile_number.trim();
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  if (data.partner_type !== undefined) updateData.partner_type = data.partner_type;
  if (data.promoter_incentive_type !== undefined) updateData.promoter_incentive_type = data.promoter_incentive_type;
  if (data.promoter_incentive_value !== undefined) updateData.promoter_incentive_value = Number(data.promoter_incentive_value);
  if (data.discount_type !== undefined) updateData.discount_type = data.discount_type;
  if (data.discount_value !== undefined) updateData.discount_value = Number(data.discount_value);
  if (data.min_order_value !== undefined) updateData.min_order_value = Number(data.min_order_value);
  if (data.custom_layout_id !== undefined) updateData.custom_layout_id = data.custom_layout_id || null;

  await adminDb.collection(COLLECTIONS.PROMOTERS).doc(id).update(updateData);
  revalidatePath("/admin/promoters");
  return { id, ...updateData };
}

/**
 * Bans a promoter by setting `is_active` to false instead of deleting
 * them, to maintain foreign key integrity across commissions.
 */
export async function banPromoter(id: string) {
  await requireAdmin();

  await adminDb.collection(COLLECTIONS.PROMOTERS).doc(id).update({
    is_active: false,
    updated_at: new Date(),
  });
  revalidatePath("/admin/promoters");
  return { success: true };
}

/**
 * Generates a pre-printed sequential batch of QR card tokens in advance.
 * Example: Prefix 'TEAM-', Start 1001, Count 50 -> TEAM-1001 to TEAM-1050.
 */
export async function generatePreprintedBatch(input: {
  prefix?: string;
  startNumber: number;
  count: number;
  batchName?: string;
}): Promise<{
  success: boolean;
  batchId: string;
  totalCards: number;
  startCode: string;
  endCode: string;
}> {
  await requireAdmin();

  const prefix = (input.prefix || "TEAM-").toUpperCase().trim();
  const startNumber = Math.max(1, input.startNumber);
  const count = Math.min(500, Math.max(1, input.count));
  const endNumber = startNumber + count - 1;

  const startCode = `${prefix}${startNumber}`;
  const endCode = `${prefix}${endNumber}`;

  const batchName = input.batchName?.trim() || `Bulk QR Batch (${startCode} - ${endCode})`;

  // Check for collision with existing tokens
  const existingTokensSnap = await adminDb
    .collection(COLLECTIONS.PREPRINTED_TOKENS)
    .where("sequence_num", ">=", startNumber)
    .where("sequence_num", "<=", endNumber)
    .get();

  const existingCodes = new Set(existingTokensSnap.docs.map((d) => d.data().code));
  for (let num = startNumber; num <= endNumber; num++) {
    const code = `${prefix}${num}`;
    if (existingCodes.has(code)) {
      throw new Error(`Token ${code} already exists in a previous batch. Please use a higher starting number.`);
    }
  }

  // Create Batch Record
  const batchRef = adminDb.collection(COLLECTIONS.PREPRINTED_BATCHES).doc();
  const batchData = {
    batch_name: batchName,
    prefix,
    start_number: startNumber,
    end_number: endNumber,
    total_cards: count,
    assigned_cards: 0,
    created_at: new Date(),
  };

  await batchRef.set(batchData);

  // Bulk create tokens in chunks of 450 (Firestore transaction/batch limit is 500)
  const chunkSize = 400;
  for (let i = startNumber; i <= endNumber; i += chunkSize) {
    const writeBatch = adminDb.batch();
    const chunkEnd = Math.min(i + chunkSize - 1, endNumber);

    for (let seq = i; seq <= chunkEnd; seq++) {
      const code = `${prefix}${seq}`;
      const tokenRef = adminDb.collection(COLLECTIONS.PREPRINTED_TOKENS).doc();
      writeBatch.set(tokenRef, {
        code,
        batch_id: batchRef.id,
        sequence_num: seq,
        status: "unassigned",
        assigned_to_promoter_id: null,
        assigned_to_promoter_name: null,
        assigned_at: null,
        created_at: new Date(),
      });
    }

    await writeBatch.commit();
  }

  revalidatePath("/admin/promoters");

  return {
    success: true,
    batchId: batchRef.id,
    totalCards: count,
    startCode,
    endCode,
  };
}

/**
 * Fetches all pre-printed batches with card counts and assignment stats
 */
export async function getPreprintedBatches(): Promise<(PreprintedBatch & { available_cards: number })[]> {
  await requireAdmin();

  try {
    const batchesSnap = await adminDb
      .collection(COLLECTIONS.PREPRINTED_BATCHES)
      .orderBy("created_at", "desc")
      .get();

    return batchesSnap.docs.map((doc) => {
      const data = doc.data();
      const total = data.total_cards || 0;
      const assigned = data.assigned_cards || 0;
      return {
        id: doc.id,
        batch_name: data.batch_name,
        prefix: data.prefix,
        start_number: data.start_number,
        end_number: data.end_number,
        total_cards: total,
        assigned_cards: assigned,
        available_cards: Math.max(0, total - assigned),
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error("[getPreprintedBatches] Error:", err);
    return [];
  }
}

/**
 * Fetches all tokens in a batch for print sheet rendering
 */
export async function getTokensForBatch(batchId: string): Promise<PreprintedToken[]> {
  await requireAdmin();

  try {
    const snap = await adminDb
      .collection(COLLECTIONS.PREPRINTED_TOKENS)
      .where("batch_id", "==", batchId)
      .orderBy("sequence_num", "asc")
      .get();

    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        code: data.code,
        batch_id: data.batch_id,
        sequence_num: data.sequence_num,
        status: data.status,
        assigned_to_promoter_id: data.assigned_to_promoter_id || null,
        assigned_to_promoter_name: data.assigned_to_promoter_name || null,
        assigned_at: data.assigned_at?.toDate?.()?.toISOString() || null,
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error("[getTokensForBatch] Error:", err);
    return [];
  }
}
