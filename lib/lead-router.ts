/**
 * @file lib/lead-router.ts
 * @description Pincode-based franchise lead routing engine.
 *
 * When a lead is created, this module determines which FranchiseDealer
 * should receive it based on their assigned pincodes, zones, cities, or states.
 * Falls back to TEAM CCTV's own team (returns null) if no franchise matches.
 *
 * Resolution priority (highest → lowest):
 *   1. Exact pincode match in franchise.assigned_pincodes
 *   2. Zone match — franchise.assigned_zone_ids → CoverageZone.pincodes
 *   3. City match in franchise.assigned_cities
 *   4. State match in franchise.assigned_states
 *   5. null → TEAM CCTV handles internally
 */

import { adminDb } from "@/lib/firebase-admin";
import type { FranchiseDealer } from "@/types";

export interface LeadRoutingResult {
  franchise_dealer_id: string | null;
  franchise_dealer_name: string | null;
  match_type: "pincode" | "zone" | "city" | "state" | "internal" | null;
}

/**
 * Determines which active franchise dealer should receive a lead
 * based on the customer's pincode and city.
 *
 * @param pincode  - Customer's 6-digit pincode (e.g., "302001")
 * @param city     - Customer's city name (e.g., "Jaipur")
 * @param state    - Customer's state name (e.g., "Rajasthan")
 * @returns        - Routing result with franchise ID, name, and match type
 */
export async function routeLeadToFranchise(
  pincode?: string,
  city?: string,
  state?: string
): Promise<LeadRoutingResult> {
  const unmatched: LeadRoutingResult = {
    franchise_dealer_id: null,
    franchise_dealer_name: null,
    match_type: "internal",
  };

  // ── STEP 1: Exact pincode match ─────────────────────────────────────────────
  if (pincode && pincode.length === 6) {
    try {
      const pincodeSnap = await adminDb
        .collection("franchise_dealers")
        .where("is_active", "==", true)
        .where("territory_exclusivity", "==", true)
        .where("assigned_pincodes", "array-contains", pincode)
        .limit(1)
        .get();

      if (!pincodeSnap.empty) {
        const doc = pincodeSnap.docs[0];
        const dealer = doc.data() as FranchiseDealer;
        return {
          franchise_dealer_id: doc.id,
          franchise_dealer_name: dealer.company_name,
          match_type: "pincode",
        };
      }
    } catch (err) {
      console.warn("[LeadRouter] Pincode query failed:", err);
    }
  }

  // ── STEP 2: Zone match (pincode inside a CoverageZone assigned to a franchise) ─
  if (pincode && pincode.length === 6) {
    try {
      const zonesSnap = await adminDb
        .collection("coverage_zones")
        .where("pincodes", "array-contains", pincode)
        .where("is_active", "==", true)
        .get();

      for (const zoneDoc of zonesSnap.docs) {
        const franchiseSnap = await adminDb
          .collection("franchise_dealers")
          .where("is_active", "==", true)
          .where("assigned_zone_ids", "array-contains", zoneDoc.id)
          .limit(1)
          .get();

        if (!franchiseSnap.empty) {
          const doc = franchiseSnap.docs[0];
          const dealer = doc.data() as FranchiseDealer;
          return {
            franchise_dealer_id: doc.id,
            franchise_dealer_name: dealer.company_name,
            match_type: "zone",
          };
        }
      }
    } catch (err) {
      console.warn("[LeadRouter] Zone query failed:", err);
    }
  }

  // ── STEP 3: City match ──────────────────────────────────────────────────────
  if (city) {
    try {
      const citySnap = await adminDb
        .collection("franchise_dealers")
        .where("is_active", "==", true)
        .where("assigned_cities", "array-contains", city)
        .limit(1)
        .get();

      if (!citySnap.empty) {
        const doc = citySnap.docs[0];
        const dealer = doc.data() as FranchiseDealer;
        return {
          franchise_dealer_id: doc.id,
          franchise_dealer_name: dealer.company_name,
          match_type: "city",
        };
      }
    } catch (err) {
      console.warn("[LeadRouter] City query failed:", err);
    }
  }

  // ── STEP 4: State match ─────────────────────────────────────────────────────
  if (state) {
    try {
      const stateSnap = await adminDb
        .collection("franchise_dealers")
        .where("is_active", "==", true)
        .where("assigned_states", "array-contains", state)
        .limit(1)
        .get();

      if (!stateSnap.empty) {
        const doc = stateSnap.docs[0];
        const dealer = doc.data() as FranchiseDealer;
        return {
          franchise_dealer_id: doc.id,
          franchise_dealer_name: dealer.company_name,
          match_type: "state",
        };
      }
    } catch (err) {
      console.warn("[LeadRouter] State query failed:", err);
    }
  }

  // ── STEP 5: No match → TEAM CCTV internal team ─────────────────────────────
  return unmatched;
}

/**
 * Increments the leads received counter on the matched franchise dealer.
 * Call this after a lead is successfully created and routed.
 */
export async function incrementFranchiseLeadCount(franchiseDealerId: string): Promise<void> {
  try {
    const { FieldValue } = await import("firebase-admin/firestore");
    await adminDb
      .collection("franchise_dealers")
      .doc(franchiseDealerId)
      .update({
        total_leads_received: FieldValue.increment(1),
      });
  } catch (err) {
    // Non-critical — counter will be off by 1 but lead is already assigned
    console.error("[LeadRouter] Failed to increment lead count:", err);
  }
}
