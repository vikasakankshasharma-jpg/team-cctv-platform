import test from "node:test";
import assert from "node:assert/strict";
import { validateOracleInvariants } from "../oracle/invariants.ts";
import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";

const base: CanonicalRequirement = {
  camera_count: 1,
  cameras: [{ technology: "HD", count: 1, resolution: "2MP" }],
};

test("forbidden mock SKU is critical", () => {
  const result = validateOracleInvariants(base, [{ sku: "mock-bnc", is_active: true }]);
  assert.equal(result.valid, false);
  assert.ok(result.failures.some((failure) => failure.code === "FORBIDDEN_PRODUCTION_SKU"));
});

test("active out-of-stock product remains quotable", () => {
  const result = validateOracleInvariants(base, [{ sku: "X", is_active: true, is_deleted: false, is_quotation_eligible: true, stock_status: "out_of_stock" }]);
  assert.equal(result.failures.some((failure) => failure.code === "QUOTABILITY_INVARIANT_FAILED"), false);
});
