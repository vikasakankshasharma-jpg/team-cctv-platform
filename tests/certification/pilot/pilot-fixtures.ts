/**
 * @file tests/certification/pilot/pilot-fixtures.ts
 * @description Phase 7.4 Pilot Test Fixtures & Synthetic Pilot Customer Contexts.
 * Separates synthetic pilot test traffic from real production customer obligations.
 */

import { type PilotTrafficMode } from "../../../lib/pilot/pilot-controller";
import { canonicalFrozenQuote } from "../commercial/commercial-fixtures";

export const TEST_PILOT_BATCH_ID = "PILOT_JAIPUR_2026_B1";
export const TEST_TRAFFIC_MODE: PilotTrafficMode = "SYNTHETIC_PILOT";

export const syntheticPilotCustomer = Object.freeze({
  customer_name: "Synthetic Pilot Customer (Jaipur)",
  mobile_number: "919876543210",
  traffic_mode: TEST_TRAFFIC_MODE,
  pilot_batch_id: TEST_PILOT_BATCH_ID,
  city: "Jaipur",
  authorized_pincode: "302001",
  unauthorized_pincode: "110001", // New Delhi (outside Jaipur pilot)
  boundary_pincode: "302039", // VKI Industrial Area (boundary Jaipur)
  invalid_pincode: "30200", // 5 digits (invalid format)
});

export const syntheticPilotQuote = Object.freeze({
  ...canonicalFrozenQuote,
  id: "quote_pilot_jaipur_01",
  lead_id: "lead_pilot_jaipur_01",
  calculation_fingerprint: "cf_jaipur_pilot_sample_fingerprint_sha256",
  catalog_snapshot_hash: "ch_jaipur_pilot_catalog_hash_sha256",
  traffic_mode: TEST_TRAFFIC_MODE,
  pilot_batch_id: TEST_PILOT_BATCH_ID,
});
