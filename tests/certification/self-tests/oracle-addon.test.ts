import test from "node:test";
import assert from "node:assert/strict";
import { calculateOracleAddons } from "../oracle/addon-oracle.ts";
import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import type { FrozenContext } from "../types/certification.ts";

test("junction boxes remain BOM-owned and are not emitted by addon oracle", () => {
  const requirement: CanonicalRequirement = { camera_count: 3, cameras: [{ technology: "HD", count: 3 }] };
  const context = { products: [], addons: [{ sku: "JB", display_name: "Weatherproof Junction Box", is_active: true, is_deleted: false, is_quotation_eligible: true }], addon_rules: [], geo_rules: [], promoters: [], app_settings: {}, sku_crosswalk: {}, manifest: {} as never } as FrozenContext;
  const result = calculateOracleAddons(requirement, context);
  assert.equal(result.lines.some((line) => line.sku === "JB"), false);
});


test("structured addon condition and broadband triggers are evaluated without junction duplication", () => {
  const requirement: CanonicalRequirement = { camera_count: 2, cameras: [{ technology: "IP", count: 2 }], ceiling_height: "very_high", broadband_status: "sim_router" };
  const context = {
    products: [],
    addons: [
      { sku: "SIM", display_name: "4G SIM Router", is_active: true, is_deleted: false, is_quotation_eligible: true },
      { sku: "LAD", display_name: "Ladder", is_active: true, is_deleted: false, is_quotation_eligible: true },
      { sku: "JB", display_name: "Weatherproof Junction Box", is_active: true, is_deleted: false, is_quotation_eligible: true },
    ],
    addon_rules: [{ addon_sku: "LAD", condition: { ceiling_height: "very_high" }, quantity_formula: "1" }],
    geo_rules: [], promoters: [], app_settings: {}, sku_crosswalk: {}, manifest: {} as never,
  } as FrozenContext;
  const result = calculateOracleAddons(requirement, context);
  assert.equal(result.lines.some((line) => line.sku === "SIM"), true);
  assert.equal(result.lines.some((line) => line.sku === "LAD"), true);
  assert.equal(result.lines.some((line) => line.sku === "JB"), false);
});
