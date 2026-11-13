import test from "node:test";
import assert from "node:assert/strict";
import { calculateOracleSurcharges } from "../oracle/surcharge-oracle.ts";
import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";

test("site surcharges use zero-margin pass-through defaults", () => {
  const requirement: CanonicalRequirement = { camera_count: 1, cameras: [{ technology: "HD", count: 1 }] };
  const result = calculateOracleSurcharges(requirement, { requiresLadderFee: true, requiresMarbleSurcharge: true, requiresHeavyDrillingSurcharge: true });
  assert.equal(result.total, 1500);
  assert.equal(result.margin_percent, 0);
});

test("schema remains strict: surcharge flags are supplied separately", () => {
  const requirement: CanonicalRequirement = { camera_count: 1, cameras: [{ technology: "HD", count: 1 }] };
  assert.equal(calculateOracleSurcharges(requirement, { requiresMetalSurcharge: true }).total, 200);
});
