import { adminDb } from "./firebase-admin";
import type { Salesperson } from "@/types";

/**
 * Robust Salesperson Resolver
 * Unifies both "salespeople" and "salespersons" collection queries into a single resilient access layer.
 */

export async function findSalespersonByUid(firebaseUid: string): Promise<(Salesperson & { id: string }) | null> {
  if (!firebaseUid) return null;

  try {
    // 1. Check primary "salespeople" collection
    const snap = await adminDb
      .collection("salespeople")
      .where("firebase_uid", "==", firebaseUid)
      .limit(1)
      .get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      return { id: doc.id, ...(doc.data() as Salesperson) };
    }

    // 2. Fallback check "salespersons" collection
    const fallbackSnap = await adminDb
      .collection("salespersons")
      .where("firebase_uid", "==", firebaseUid)
      .limit(1)
      .get();

    if (!fallbackSnap.empty) {
      const doc = fallbackSnap.docs[0];
      return { id: doc.id, ...(doc.data() as Salesperson) };
    }

    return null;
  } catch (error) {
    console.error("[findSalespersonByUid Error]:", error);
    return null;
  }
}

export async function findSalespersonById(id: string): Promise<(Salesperson & { id: string }) | null> {
  if (!id) return null;

  try {
    // 1. Check primary "salespeople" collection
    const docSnap = await adminDb.collection("salespeople").doc(id).get();
    if (docSnap.exists) {
      return { id: docSnap.id, ...(docSnap.data() as Salesperson) };
    }

    // 2. Fallback check "salespersons" collection
    const fallbackSnap = await adminDb.collection("salespersons").doc(id).get();
    if (fallbackSnap.exists) {
      return { id: fallbackSnap.id, ...(fallbackSnap.data() as Salesperson) };
    }

    return null;
  } catch (error) {
    console.error("[findSalespersonById Error]:", error);
    return null;
  }
}

export async function getAllActiveSalespersons(): Promise<Array<Salesperson & { id: string }>> {
  try {
    // Primary collection
    const snap = await adminDb
      .collection("salespeople")
      .where("is_active", "==", true)
      .get();

    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as Salesperson) }));
    }

    // Fallback collection
    const fallbackSnap = await adminDb
      .collection("salespersons")
      .where("is_active", "==", true)
      .get();

    return fallbackSnap.docs.map(d => ({ id: d.id, ...(d.data() as Salesperson) }));
  } catch (error) {
    console.error("[getAllActiveSalespersons Error]:", error);
    return [];
  }
}

/**
 * Returns a normalized lead assignment payload containing BOTH legacy and standard keys
 * to guarantee 100% sync across Admin Leads, Salesperson Portal, and CRM APIs.
 */
export function buildSalespersonLeadAssignmentPayload(salespersonId: string | null, salespersonName: string | null) {
  return {
    assigned_salesperson_id: salespersonId,
    assigned_to_salesperson_id: salespersonId,
    assigned_salesperson_name: salespersonName,
    assigned_to_salesperson_name: salespersonName,
  };
}
