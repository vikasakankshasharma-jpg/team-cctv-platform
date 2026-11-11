import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  calculateApprovedUnitPrice,
  isQuotableProduct,
  productChannelCapacity,
  resolveProductTechnology,
} from "../types/oracle.ts";

test("oracle resolves technology from top-level technology or technologies array", () => {
  assert.equal(resolveProductTechnology({ sku: "CAM-001", technology: "WiFi" }), "Wireless");
  assert.equal(resolveProductTechnology({ sku: "CAM-002", technologies: ["Network"] }), "IP");
  assert.equal(
    resolveProductTechnology({ sku: "CAM-003", technologies: ["IP", "WiFi"] }),
    undefined,
  );
});

test("quotable product invariant is independent of stock and blocks deleted products", () => {
  assert.equal(
    isQuotableProduct({
      sku: "CAM-001",
      is_active: true,
      is_deleted: false,
      is_quotation_eligible: true,
      stock_status: "out_of_stock",
    }),
    true,
  );

  assert.equal(
    isQuotableProduct({
      sku: "CAM-002",
      is_active: true,
      is_deleted: true,
    }),
    false,
  );
});

test("channel capacity and approved GST-inclusive unit price follow repository conventions", () => {
  assert.equal(productChannelCapacity({ sku: "NVR-016", channels: 16 }), 16);

  const result = calculateApprovedUnitPrice({
    sku: "CAM-001",
    base_cost: 999,
    margin_percent: 20,
  });
  assert.equal(result?.expected_unit_price, 1199);
});
