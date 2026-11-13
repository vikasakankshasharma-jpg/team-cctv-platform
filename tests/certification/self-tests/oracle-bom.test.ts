import test from "node:test";
import assert from "node:assert/strict";
import { calculateOracleBom } from "../oracle/bom-oracle.ts";
import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import type { FrozenContext } from "../types/certification.ts";

function context(): FrozenContext {
  const product = (sku: string, text: string, price: number, extra: Record<string, unknown> = {}) => ({ sku, display_name: text, technical_name: text, unit_price: price, is_active: true, is_deleted: false, is_quotation_eligible: true, ...extra });
  return {
    products: [
      product("HD-CAM-2", "2MP HD Camera", 100, { technology: "HD" }),
      product("IP-CAM-4", "4MP IP Camera", 200, { technology: "IP" }),
      product("SMPS-8", "8 Channel SMPS", 50, { technology: "HD", max_cameras: 8 }),
      product("POE-8", "8 Port PoE Switch", 100, { technology: "IP", max_cameras: 8 }),
      product("DVR-4-5MP", "4 Channel 5MP DVR", 300, { technology: "HD", channels: 4 }),
      product("NVR-4-5MP", "4 Channel 5MP NVR", 400, { technology: "IP", channels: 4 }),
      product("HDD-1TB", "1TB Surveillance HDD", 250),
    ],
    addons: [], addon_rules: [], geo_rules: [], promoters: [], app_settings: {}, sku_crosswalk: {}, manifest: {} as never,
  };
}

test("HD connector rule is one BNC+DC set per camera", () => {
  const requirement: CanonicalRequirement = { camera_count: 2, cameras: [{ technology: "HD", count: 2, resolution: "2MP" }], cable_length_meters: 20 };
  const bom = calculateOracleBom(requirement, context());
  assert.equal(bom.connectors[0]?.quantity, 2);
  assert.equal(bom.junction_boxes?.quantity, 2);
});

test("IP connector rule adds two uplink RJ45 per PoE switch", () => {
  const requirement: CanonicalRequirement = { camera_count: 8, cameras: [{ technology: "IP", count: 8, resolution: "4MP" }] };
  const bom = calculateOracleBom(requirement, context());
  assert.equal(bom.connectors[0]?.quantity, 18);
});
