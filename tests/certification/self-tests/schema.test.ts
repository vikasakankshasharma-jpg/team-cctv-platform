import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  CanonicalRequirementSchema,
  type ExistingSystemRequirement,
} from "../types/certification.ts";

function createValidRequirement(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    camera_count: 4,
    cameras: [
      {
        technology: "IP",
        count: 4,
        resolution: "4MP",
      },
    ],
    recording_mode: "smart",
    recording_days: 15,
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

test("canonical schema accepts recording smart mode and open wiring", () => {
  const result = CanonicalRequirementSchema.safeParse(
    createValidRequirement({
      wiring_type: "open",
    }),
  );

  assert.ok(result.success);
  if (result.success) {
    assert.equal(result.data.recording_mode, "smart");
    assert.equal(result.data.wiring_type, "open");
    assert.equal(result.data.cameras[0]?.resolution, "4MP");
  }
});

test("canonical schema accepts conduit wiring and string ceiling height", () => {
  const result = CanonicalRequirementSchema.safeParse(
    createValidRequirement({
      wiring_type: "conduit",
      ceiling_height: "very_high",
      location: { pincode: "302001" },
    }),
  );

  assert.ok(result.success);
  if (result.success) {
    assert.equal(result.data.wiring_type, "conduit");
    assert.equal(result.data.ceiling_height, "very_high");
    assert.equal(result.data.location?.pincode, "302001");
  }
});

test("canonical schema rejects invalid wiring type", () => {
  const result = CanonicalRequirementSchema.safeParse(
    createValidRequirement({
      wiring_type: "new",
    }),
  );

  assert.equal(result.success, false);
});

test("canonical schema rejects recording days above 365", () => {
  const result = CanonicalRequirementSchema.safeParse(
    createValidRequirement({
      recording_days: 366,
    }),
  );

  assert.equal(result.success, false);
});

test("canonical schema enforces camera_count max of 128 and exports ExistingSystemRequirement", () => {
  const overMax = CanonicalRequirementSchema.safeParse(
    createValidRequirement({
      camera_count: 129,
    }),
  );
  assert.equal(overMax.success, false);

  const existing: ExistingSystemRequirement = {
    existing_system_known: true,
    existing_technology: "HD",
    existing_recorder_channels: 8,
    retain_existing_storage: true,
  };
  const validWithExisting = CanonicalRequirementSchema.safeParse(
    createValidRequirement({ existing_system: existing }),
  );
  assert.equal(validWithExisting.success, true);
});
