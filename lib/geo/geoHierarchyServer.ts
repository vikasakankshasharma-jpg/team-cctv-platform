/**
 * @file lib/geo/geoHierarchyServer.ts
 * @description Server-side aggregator for the 4-tier Indian Geo Hierarchy:
 * State -> District -> Tehsil -> PINCODE (Active vs Inactive).
 */

import { adminDb } from "@/lib/firebase-admin";
import {
  BASELINE_GEO_HIERARCHY,
  CORE_ACTIVE_PINCODES,
  computeAggregateStatus,
  calculateDemandScore,
  type StateItem,
  type DistrictItem,
  type TehsilItem,
  type PincodeItem,
  type HierarchySummary,
  type PincodeStatus,
} from "./geoHierarchy";

export async function getGeoHierarchyData(): Promise<{
  tree: StateItem[];
  summary: HierarchySummary;
}> {
  // 1. Fetch overrides from geo_pincodes collection
  const overridesSnap = await adminDb.collection("geo_pincodes").get();
  const overridesMap = new Map<string, {
    status?: PincodeStatus;
    name?: string;
    tehsil?: string;
    district?: string;
    state?: string;
    updated_at?: string;
    updated_by?: string;
  }>();

  overridesSnap.docs.forEach((doc) => {
    const data = doc.data();
    overridesMap.set(doc.id, {
      status: data.status,
      name: data.name,
      tehsil: data.tehsil,
      district: data.district,
      state: data.state,
      updated_at: data.updated_at?.toDate?.()?.toISOString() || null,
      updated_by: data.updated_by || null,
    });
  });

  // 2. Fetch unserved waitlist leads to cluster metrics by PIN & Tehsil
  const waitlistSnap = await adminDb
    .collection("leads")
    .where("service_status", "==", "waitlist")
    .get();

  const waitlistCountByPin = new Map<string, number>();
  const waitlistConfirmedByPin = new Map<string, number>();

  waitlistSnap.docs.forEach((doc) => {
    const data = doc.data();
    const pin = data.detected_pincode;
    if (pin) {
      waitlistCountByPin.set(pin, (waitlistCountByPin.get(pin) || 0) + 1);
      if (data.waitlist_confirmed) {
        waitlistConfirmedByPin.set(pin, (waitlistConfirmedByPin.get(pin) || 0) + 1);
      }
    }
  });

  // 3. Fetch impressions for demand score weighting
  const impressionsSnap = await adminDb.collection("demand_impressions").get();
  const impressionsByPin = new Map<string, number>();

  impressionsSnap.docs.forEach((doc) => {
    const data = doc.data();
    const pin = data.pincode;
    if (pin) {
      impressionsByPin.set(pin, (impressionsByPin.get(pin) || 0) + 1);
    }
  });

  // 4. Assemble the 4-level Tree
  const tree: StateItem[] = [];
  let grandTotalActivePins = 0;
  let grandTotalInactivePins = 0;
  let grandTotalWaitlistLeads = 0;
  let grandTotalTehsils = 0;
  let grandTotalDistricts = 0;

  const processedPins = new Set<string>();

  for (const baseState of BASELINE_GEO_HIERARCHY) {
    const districtItems: DistrictItem[] = [];

    for (const baseDistrict of baseState.districts) {
      const tehsilItems: TehsilItem[] = [];

      for (const baseTehsil of baseDistrict.tehsils) {
        const pincodeItems: PincodeItem[] = [];

        for (const basePin of baseTehsil.pincodes) {
          processedPins.add(basePin.pincode);

          const override = overridesMap.get(basePin.pincode);
          let status: PincodeStatus = basePin.defaultStatus;

          if (override?.status) {
            status = override.status;
          } else if (CORE_ACTIVE_PINCODES.has(basePin.pincode)) {
            status = "active";
          }

          const pinWaitlistTotal = waitlistCountByPin.get(basePin.pincode) || 0;
          const pinConfirmedTotal = waitlistConfirmedByPin.get(basePin.pincode) || 0;
          const pinImpressions = impressionsByPin.get(basePin.pincode) || 0;
          const intentCount = Math.max(0, pinWaitlistTotal - pinConfirmedTotal);
          const demandScore = calculateDemandScore(pinImpressions, intentCount, pinConfirmedTotal);

          if (status === "active") grandTotalActivePins++;
          else grandTotalInactivePins++;
          grandTotalWaitlistLeads += pinWaitlistTotal;

          pincodeItems.push({
            pincode: basePin.pincode,
            name: override?.name || basePin.name,
            status,
            tehsil: baseTehsil.name,
            district: baseDistrict.name,
            state: baseState.name,
            waitlist_count: pinWaitlistTotal,
            demand_score: demandScore,
            last_updated: override?.updated_at,
            updated_by: override?.updated_by,
          });
        }

        const tehsilActiveCount = pincodeItems.filter((p) => p.status === "active").length;
        const tehsilTotalCount = pincodeItems.length;
        const tehsilWaitlistCount = pincodeItems.reduce((acc, p) => acc + p.waitlist_count, 0);
        const tehsilDemandScore = Math.round(pincodeItems.reduce((acc, p) => acc + p.demand_score, 0) * 10) / 10;

        grandTotalTehsils++;

        tehsilItems.push({
          name: baseTehsil.name,
          status: computeAggregateStatus(tehsilActiveCount, tehsilTotalCount),
          active_count: tehsilActiveCount,
          total_count: tehsilTotalCount,
          waitlist_count: tehsilWaitlistCount,
          demand_score: tehsilDemandScore,
          pincodes: pincodeItems,
        });
      }

      const districtActiveCount = tehsilItems.reduce((acc, t) => acc + t.active_count, 0);
      const districtTotalCount = tehsilItems.reduce((acc, t) => acc + t.total_count, 0);
      const districtWaitlistCount = tehsilItems.reduce((acc, t) => acc + t.waitlist_count, 0);
      const districtDemandScore = Math.round(tehsilItems.reduce((acc, t) => acc + t.demand_score, 0) * 10) / 10;

      grandTotalDistricts++;

      districtItems.push({
        name: baseDistrict.name,
        state: baseState.name,
        status: computeAggregateStatus(districtActiveCount, districtTotalCount),
        active_count: districtActiveCount,
        total_count: districtTotalCount,
        waitlist_count: districtWaitlistCount,
        demand_score: districtDemandScore,
        tehsils: tehsilItems,
      });
    }

    const stateActiveCount = districtItems.reduce((acc, d) => acc + d.active_count, 0);
    const stateTotalCount = districtItems.reduce((acc, d) => acc + d.total_count, 0);
    const stateWaitlistCount = districtItems.reduce((acc, d) => acc + d.waitlist_count, 0);
    const stateDemandScore = Math.round(districtItems.reduce((acc, d) => acc + d.demand_score, 0) * 10) / 10;

    tree.push({
      name: baseState.name,
      status: computeAggregateStatus(stateActiveCount, stateTotalCount),
      active_count: stateActiveCount,
      total_count: stateTotalCount,
      waitlist_count: stateWaitlistCount,
      demand_score: stateDemandScore,
      districts: districtItems,
    });
  }

  // 5. Attach any custom user-added PINs from overridesMap that weren't in BASELINE
  for (const [overridePin, overrideData] of overridesMap.entries()) {
    if (!processedPins.has(overridePin) && overrideData.state && overrideData.district && overrideData.tehsil) {
      let stateNode = tree.find((s) => s.name.toLowerCase() === overrideData.state!.toLowerCase());
      if (!stateNode) {
        stateNode = {
          name: overrideData.state!,
          status: "inactive",
          active_count: 0,
          total_count: 0,
          waitlist_count: 0,
          demand_score: 0,
          districts: [],
        };
        tree.push(stateNode);
      }

      let districtNode = stateNode.districts.find(
        (d) => d.name.toLowerCase() === overrideData.district!.toLowerCase()
      );
      if (!districtNode) {
        districtNode = {
          name: overrideData.district!,
          state: stateNode.name,
          status: "inactive",
          active_count: 0,
          total_count: 0,
          waitlist_count: 0,
          demand_score: 0,
          tehsils: [],
        };
        stateNode.districts.push(districtNode);
        grandTotalDistricts++;
      }

      let tehsilNode = districtNode.tehsils.find(
        (t) => t.name.toLowerCase() === overrideData.tehsil!.toLowerCase()
      );
      if (!tehsilNode) {
        tehsilNode = {
          name: overrideData.tehsil!,
          status: "inactive",
          active_count: 0,
          total_count: 0,
          waitlist_count: 0,
          demand_score: 0,
          pincodes: [],
        };
        districtNode.tehsils.push(tehsilNode);
        grandTotalTehsils++;
      }

      const status: PincodeStatus = overrideData.status || "inactive";
      const waitlistTotal = waitlistCountByPin.get(overridePin) || 0;
      const confirmedTotal = waitlistConfirmedByPin.get(overridePin) || 0;
      const impressions = impressionsByPin.get(overridePin) || 0;
      const demand = calculateDemandScore(impressions, Math.max(0, waitlistTotal - confirmedTotal), confirmedTotal);

      if (status === "active") grandTotalActivePins++;
      else grandTotalInactivePins++;
      grandTotalWaitlistLeads += waitlistTotal;

      tehsilNode.pincodes.push({
        pincode: overridePin,
        name: overrideData.name || `Pincode ${overridePin}`,
        status,
        tehsil: tehsilNode.name,
        district: districtNode.name,
        state: stateNode.name,
        waitlist_count: waitlistTotal,
        demand_score: demand,
        last_updated: overrideData.updated_at,
        updated_by: overrideData.updated_by,
      });

      tehsilNode.total_count = tehsilNode.pincodes.length;
      tehsilNode.active_count = tehsilNode.pincodes.filter((p) => p.status === "active").length;
      tehsilNode.status = computeAggregateStatus(tehsilNode.active_count, tehsilNode.total_count);
      districtNode.total_count = districtNode.tehsils.reduce((a, b) => a + b.total_count, 0);
      districtNode.active_count = districtNode.tehsils.reduce((a, b) => a + b.active_count, 0);
      districtNode.status = computeAggregateStatus(districtNode.active_count, districtNode.total_count);
      stateNode.total_count = stateNode.districts.reduce((a, b) => a + b.total_count, 0);
      stateNode.active_count = stateNode.districts.reduce((a, b) => a + b.active_count, 0);
      stateNode.status = computeAggregateStatus(stateNode.active_count, stateNode.total_count);
    }
  }

  const summary: HierarchySummary = {
    total_states: tree.length,
    total_districts: grandTotalDistricts,
    total_tehsils: grandTotalTehsils,
    total_pincodes: grandTotalActivePins + grandTotalInactivePins,
    active_pincodes: grandTotalActivePins,
    inactive_pincodes: grandTotalInactivePins,
    total_waitlist_leads: grandTotalWaitlistLeads,
  };

  return { tree, summary };
}
