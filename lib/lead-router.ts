/**
 * @file lib/lead-router.ts
 * @description Enterprise Pincode-based Lead Routing Engine with Load Balancing.
 *
 * Automatically routes leads to FranchiseDealers or Salespeople based on:
 * 1. Geographic Territory (Pincode > Zone > City > State)
 * 2. Load Balancing (Least leads assigned)
 * 3. Territory Exclusivity Rules
 */

import { adminDb } from "@/lib/firebase-admin";
import type { FranchiseDealer } from "@/types";

export interface LeadRoutingResult {
  franchise_dealer_id: string | null;
  franchise_dealer_name: string | null;
  match_type: "pincode" | "zone" | "city" | "state" | "internal" | null;
}

/**
 * Determines the best franchise dealer for a lead using hierarchical 
 * territory matching and least-connection load balancing.
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

  // Helper to pick the best dealer from a pool (Load Balancing)
  const pickBestDealer = (docs: FirebaseFirestore.QueryDocumentSnapshot[]): LeadRoutingResult | null => {
    if (docs.length === 0) return null;
    
    // LOAD BALANCING: Sort by total_leads_received to pick the one with least work
    const sorted = [...docs].sort((a, b) => {
      const aData = a.data() as FranchiseDealer;
      const bData = b.data() as FranchiseDealer;
      return (aData.total_leads_received || 0) - (bData.total_leads_received || 0);
    });

    const best = sorted[0];
    const data = best.data() as FranchiseDealer;

    return {
      franchise_dealer_id: best.id,
      franchise_dealer_name: data.company_name,
      match_type: null, // To be set by caller
    };
  };

  // 1. Exact Pincode Match (Exclusive or Shared)
  if (pincode && pincode.length === 6) {
    const snap = await adminDb
      .collection("franchise_dealers")
      .where("is_active", "==", true)
      .where("assigned_pincodes", "array-contains", pincode)
      .get();

    const best = pickBestDealer(snap.docs);
    if (best) return { ...best, match_type: "pincode" };
  }

  // 2. Zone Match (Pincode inside a CoverageZone)
  if (pincode && pincode.length === 6) {
    const zonesSnap = await adminDb
      .collection("coverage_zones")
      .where("pincodes", "array-contains", pincode)
      .where("is_active", "==", true)
      .get();

    if (!zonesSnap.empty) {
      const zoneIds = zonesSnap.docs.map(d => d.id);
      const snap = await adminDb
        .collection("franchise_dealers")
        .where("is_active", "==", true)
        .where("assigned_zone_ids", "array-contains-any", zoneIds)
        .get();

      const best = pickBestDealer(snap.docs);
      if (best) return { ...best, match_type: "zone" };
    }
  }

  // 3. City Match
  if (city) {
    const snap = await adminDb
      .collection("franchise_dealers")
      .where("is_active", "==", true)
      .where("assigned_cities", "array-contains", city)
      .get();

    const best = pickBestDealer(snap.docs);
    if (best) return { ...best, match_type: "city" };
  }

  // 4. State Match
  if (state) {
    const snap = await adminDb
      .collection("franchise_dealers")
      .where("is_active", "==", true)
      .where("assigned_states", "array-contains", state)
      .get();

    const best = pickBestDealer(snap.docs);
    if (best) return { ...best, match_type: "state" };
  }

  return unmatched;
}

/**
 * Increments the lead counter and updates last_assigned_at for a dealer.
 */
export async function incrementFranchiseLeadCount(id: string): Promise<void> {
  const { FieldValue } = await import("firebase-admin/firestore");
  await adminDb.collection("franchise_dealers").doc(id).update({
    total_leads_received: FieldValue.increment(1),
    last_lead_assigned_at: FieldValue.serverTimestamp()
  });
}
