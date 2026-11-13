import test from "node:test";
import assert from "node:assert/strict";
import { calculateOraclePricing } from "../oracle/pricing-oracle.ts";
import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import type { FrozenContext } from "../types/certification.ts";

const context = {
  products: [
    { sku: "CAM", display_name: "2MP HD Camera", technology: "HD", unit_price: 118, base_cost: 100, is_active: true, is_deleted: false, is_quotation_eligible: true },
    { sku: "CAM-WIFI", display_name: "2MP Wi-Fi Camera", technology: "Wireless", wireless_family: "wifi", unit_price: 118, base_cost: 100, is_active: true, is_deleted: false, is_quotation_eligible: true },
  ],
  addons: [], addon_rules: [], geo_rules: [], promoters: [], app_settings: {}, sku_crosswalk: {}, manifest: {} as never,
} as FrozenContext;

test("pricing oracle keeps GST-paid gross as gross", () => {
  const requirement: CanonicalRequirement = { camera_count: 1, cameras: [{ technology: "Wireless", count: 1, resolution: "2MP" }], installation_preference: "diy" };
  const result = calculateOraclePricing(requirement, context);
  assert.equal(result.subtotal_gross, 118);
  assert.equal(result.gst_total, 18);
  assert.equal(result.grand_total, 118);
});


test("pricing oracle defaults to pro installation labor and enforces it on wired DIY", () => {
  const proRequirement: CanonicalRequirement = { camera_count: 1, cameras: [{ technology: "HD", count: 1, resolution: "2MP" }] };
  const proResult = calculateOraclePricing(proRequirement, context);
  assert.equal(proResult.subtotal_gross, 578);
  assert.equal(proResult.gst_total, 88.17);

  const wiredDiyRequirement: CanonicalRequirement = { camera_count: 1, cameras: [{ technology: "HD", count: 1, resolution: "2MP" }], installation_preference: "diy" };
  const wiredDiyResult = calculateOraclePricing(wiredDiyRequirement, context);
  assert.equal(wiredDiyResult.subtotal_gross, 578);
});
