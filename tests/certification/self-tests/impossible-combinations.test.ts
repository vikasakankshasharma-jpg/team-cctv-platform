import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import { detectImpossibleCombinations } from "../schema/impossible-combinations.ts";

function createRequirement(
  overrides: Partial<CanonicalRequirement> = {},
): CanonicalRequirement {
  return {
    camera_count: 4,
    cameras: [
      {
        technology: "IP",
        count: 4,
        resolution: "4MP",
      },
    ],
    recording_mode: "continuous",
    recording_days: 7,
    installation_type: "new",
    installation_preference: "pro",
    cabling_mode: "all_new",
    wiring_type: "open",
    cable_type: "CAT6",
    cabling_needed_cameras: 4,
    cable_length_meters: 100,
    location: {
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
    },
    ...overrides,
  };
}

test("camera_count 0 and negative camera_count are INVALID", () => {
  const zeroResult = detectImpossibleCombinations(
    createRequirement({ camera_count: 0, cameras: [] }),
  );
  assert.equal(zeroResult.valid, false);
  assert.ok(zeroResult.issues.some((issue) => issue.code === "INVALID_CAMERA_COUNT"));

  const negativeResult = detectImpossibleCombinations(
    createRequirement({ camera_count: -1, cameras: [] }),
  );
  assert.equal(negativeResult.valid, false);
  assert.ok(negativeResult.issues.some((issue) => issue.code === "INVALID_CAMERA_COUNT"));
});

test("camera array count mismatch is INVALID", () => {
  const result = detectImpossibleCombinations(
    createRequirement({
      camera_count: 5,
      cameras: [{ technology: "IP", count: 4, resolution: "4MP" }],
    }),
  );

  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === "CAMERA_COUNT_MISMATCH"));
});

test("mixed cabling with zero or excess required cameras is INVALID", () => {
  const zeroCabling = detectImpossibleCombinations(
    createRequirement({
      cabling_mode: "mixed",
      cabling_needed_cameras: 0,
    }),
  );
  assert.equal(zeroCabling.valid, false);
  assert.ok(
    zeroCabling.issues.some((issue) => issue.code === "MIXED_CABLING_REQUIRES_NEW_CAMERAS"),
  );

  const excessCabling = detectImpossibleCombinations(
    createRequirement({
      camera_count: 4,
      cabling_mode: "mixed",
      cabling_needed_cameras: 5,
    }),
  );
  assert.equal(excessCabling.valid, false);
  assert.ok(excessCabling.issues.some((issue) => issue.code === "CABLING_CAMERA_COUNT_EXCEEDED"));
});

test("zero cameras with selected storage or recorder channels is INVALID", () => {
  const storageResult = detectImpossibleCombinations(
    createRequirement({ camera_count: 0, cameras: [], storage_selected: true }),
  );
  assert.equal(storageResult.valid, false);
  assert.ok(
    storageResult.issues.some((issue) => issue.code === "ZERO_CAMERAS_WITH_RECORDER_OR_STORAGE"),
  );

  const recorderResult = detectImpossibleCombinations(
    createRequirement({ camera_count: 0, cameras: [], recorder_channels: 8 }),
  );
  assert.equal(recorderResult.valid, false);
  assert.ok(
    recorderResult.issues.some((issue) => issue.code === "ZERO_CAMERAS_WITH_RECORDER_OR_STORAGE"),
  );
});

test("catalog caps classify >16 HD, >16 Wireless, >32 IP and >64 total as MANUAL_QUOTE", () => {
  const hd20Fallback = detectImpossibleCombinations(
    createRequirement({
      camera_count: 20,
      technology: "HD",
      cameras: [],
      cabling_needed_cameras: 20,
    }),
  );
  assert.equal(hd20Fallback.valid, true);
  assert.equal(hd20Fallback.requires_manual_quote, true);
  assert.ok(hd20Fallback.issues.some((issue) => issue.code === "HD_CAMERA_CAP_EXCEEDED"));

  const wireless17 = detectImpossibleCombinations(
    createRequirement({
      camera_count: 17,
      cameras: [{ technology: "Wireless", count: 17, resolution: "4MP" }],
    }),
  );
  assert.equal(wireless17.valid, true);
  assert.equal(wireless17.requires_manual_quote, true);
  assert.ok(wireless17.issues.some((issue) => issue.code === "WIRELESS_CAMERA_CAP_EXCEEDED"));

  const ip33 = detectImpossibleCombinations(
    createRequirement({
      camera_count: 33,
      cameras: [{ technology: "IP", count: 33, resolution: "4MP" }],
      cabling_needed_cameras: 33,
    }),
  );
  assert.equal(ip33.valid, true);
  assert.equal(ip33.requires_manual_quote, true);
  assert.ok(ip33.issues.some((issue) => issue.code === "IP_CAMERA_CAP_EXCEEDED"));

  const over64NoTech = detectImpossibleCombinations(
    createRequirement({
      camera_count: 65,
      cameras: [],
      cabling_needed_cameras: 65,
    }),
  );
  assert.equal(over64NoTech.valid, true);
  assert.equal(over64NoTech.requires_manual_quote, true);
  assert.ok(over64NoTech.issues.some((issue) => issue.code === "CAMERA_COUNT_OVER_64"));
});

test("wireless + analog recorder and IP + analog SMPS (including empty cameras[]) are INVALID", () => {
  const wirelessAnalog = detectImpossibleCombinations(
    createRequirement({
      camera_count: 4,
      cameras: [{ technology: "Wireless", count: 4, resolution: "4MP" }],
      recorder_technology: "Analog",
      recorder_channels: 4,
    }),
  );
  assert.equal(wirelessAnalog.valid, false);
  assert.ok(wirelessAnalog.issues.some((issue) => issue.code === "WIRELESS_WITH_ANALOG_RECORDER"));

  const ipAnalogArray = detectImpossibleCombinations(
    createRequirement({
      power_supply_technology: "Analog",
    }),
  );
  assert.equal(ipAnalogArray.valid, false);
  assert.ok(ipAnalogArray.issues.some((issue) => issue.code === "IP_WITH_ANALOG_POWER_SUPPLY"));

  const ipAnalogTopLevel = detectImpossibleCombinations(
    createRequirement({
      camera_count: 4,
      cameras: [],
      technology: "IP",
      power_supply_technology: "Analog",
    }),
  );
  assert.equal(ipAnalogTopLevel.valid, false);
  assert.ok(
    ipAnalogTopLevel.issues.some((issue) => issue.code === "IP_WITH_ANALOG_POWER_SUPPLY"),
  );
});

test("recorder above 64 channels requires manual quote and legacy plan warns", () => {
  const recorderOver64 = detectImpossibleCombinations(
    createRequirement({
      recorder_technology: "IP",
      recorder_channels: 65,
    }),
  );
  assert.equal(recorderOver64.valid, true);
  assert.equal(recorderOver64.requires_manual_quote, true);
  assert.ok(recorderOver64.issues.some((issue) => issue.code === "UI_RECORDER_CAP_EXCEEDED"));

  const legacyWarn = detectImpossibleCombinations(
    createRequirement({
      legacy_plan_type: "premium",
    }),
  );
  assert.equal(legacyWarn.valid, true);
  assert.ok(legacyWarn.issues.some((issue) => issue.code === "LEGACY_PLAN_DRIFT"));
});
