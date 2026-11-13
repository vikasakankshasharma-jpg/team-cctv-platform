import test from "node:test";
import assert from "node:assert/strict";
import { calculateReverseInclusiveTax } from "../oracle/tax-oracle.ts";

test("reverse-inclusive GST reconciles to gross", () => {
  for (const gross of [0, 1, 118, 1180, 11800, 99999.99]) {
    const result = calculateReverseInclusiveTax(gross);
    assert.equal(result.reconciled, true);
    assert.equal(result.reconciliation_delta, 0);
  }
});

test("₹118 inclusive contains ₹100 taxable + ₹18 GST", () => {
  const result = calculateReverseInclusiveTax(118);
  assert.equal(result.taxable, 100);
  assert.equal(result.gst, 18);
});
