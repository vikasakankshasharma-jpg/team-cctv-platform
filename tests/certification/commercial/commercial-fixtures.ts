/**
 * @file tests/certification/commercial/commercial-fixtures.ts
 * @description Phase 7.2 Commercial Test Fixtures & Reference Contexts.
 * Provides frozen quote snapshot, HMAC generation helpers, and adversarial contexts.
 */

import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { StoredQuoteLike } from "../../../lib/commercial/order-service";

export const TEST_WEBHOOK_SECRET = "whsec_test_secret_cctv_commercial_2026";

// Load certified snapshot to construct canonical frozen quote fixture
const snapshotPath = fileURLToPath(
  new URL("../fixtures/CERTIFICATION_SNAPSHOT_BUNDLE.json", import.meta.url)
);
const rawBundle = JSON.parse(readFileSync(snapshotPath, "utf8"));
export const certifiedProducts = Object.freeze(rawBundle.context.products || []);

/**
 * Fixture: Standard Frozen 4-Camera CP PLUS Quote Snapshot
 * Gross Total = ₹35,590. Net Taxable = ₹30,161.02. GST = ₹5,428.98.
 */
export const canonicalFrozenQuote: StoredQuoteLike = Object.freeze({
  id: "quote_cert_comm_01",
  lead_id: "lead_comm_01",
  status: "ACTIVE",
  total_payable: 35590,
  pricingSnapshot: {
    total_payable: 35590,
    net_taxable_amount: 30161.02,
    gst_amount: 5428.98,
    items: [
      {
        product_id: "CAM-CP-IP-4MP-BULLET",
        display_name: "CP-Plus 4MP IP Bullet Camera",
        qty: 4,
        unit_price: 4246,
      },
      {
        product_id: "REC-CP-NVR-104F1",
        display_name: "CP-Plus 4ch NVR",
        qty: 1,
        unit_price: 5308,
      },
    ],
  },
  payment_history: [],
  orders: [],
});

/**
 * Helper to generate valid HMAC SHA-256 signature for test webhooks
 */
export function generateTestHmacSignature(payload: string, secret = TEST_WEBHOOK_SECRET): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}
