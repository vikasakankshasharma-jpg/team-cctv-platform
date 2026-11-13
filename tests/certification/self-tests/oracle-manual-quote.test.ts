import test from "node:test";
import assert from "node:assert/strict";
import { classifyManualQuote, classifyRawCameraCount } from "../oracle/manual-quote-oracle.ts";

test("raw camera boundary is INVALID above 128", () => {
  assert.equal(classifyRawCameraCount(129).classification, "INVALID");
  assert.deepEqual(classifyRawCameraCount(129).issue_codes, ["CAMERA_COUNT_EXCEEDS_CERTIFICATION_BOUND"]);
});

test("65..128 is manual quote", () => {
  assert.equal(classifyRawCameraCount(65).classification, "MANUAL_QUOTE");
  assert.equal(classifyRawCameraCount(128).classification, "MANUAL_QUOTE");
});

test("1..64 is valid", () => {
  assert.equal(classifyRawCameraCount(1).classification, "VALID");
  assert.equal(classifyRawCameraCount(64).classification, "VALID");
});

test("zero and negative counts are invalid", () => {
  assert.equal(classifyRawCameraCount(0).classification, "INVALID");
  assert.equal(classifyRawCameraCount(-1).classification, "INVALID");
});


test("impossible-combination manual flag wins when camera array is empty", () => {
  // This case is intentionally not parsed through Zod here; it verifies the oracle boundary against the detector.
  const result = classifyManualQuote({ camera_count: 20, cameras: [], technology: "HD" });
  assert.equal(result.classification, "MANUAL_QUOTE");
  assert.equal(result.requires_manual_quote, true);
});
