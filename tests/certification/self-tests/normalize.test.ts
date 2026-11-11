import { strict as assert } from "node:assert";
import { test } from "node:test";
import { normalizeRequirement, normalizeTechnology } from "../schema/normalize.ts";

test("normalizeTechnology maps Analog, Network, WiFi and 4G aliases cleanly", () => {
  assert.equal(normalizeTechnology("WiFi"), "Wireless");
  assert.equal(normalizeTechnology("4G"), "Wireless");
  assert.equal(normalizeTechnology("Wi-Fi"), "Wireless");
  assert.equal(normalizeTechnology("Network"), "IP");
  assert.equal(normalizeTechnology("Network IP"), "IP");
  assert.equal(normalizeTechnology("Analog HD"), "HD");
});

test("normalizeRequirement preserves nested recording, cabling and wireless power values", () => {
  const result = normalizeRequirement({
    camera_count: 4,
    cameras: [
      {
        technology: "4G",
        count: 4,
        resolution: "4MP",
        family: "4g_solar",
      },
    ],
    recording: {
      mode: "smart",
      days: 15,
    },
    installation_type: "new",
    cabling: {
      mode: "mixed",
      wiring_type: "conduit",
      cable_type: "CAT6",
      cabling_needed_cameras: 2,
      cable_length_meters: 80,
    },
    wireless_power: {
      option: "wire_needed",
      cable_length_meters: 25,
    },
    installation_preference: "pro",
    location: {
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
    },
  });

  assert.equal(result.requirement.recording_mode, "smart");
  assert.equal(result.requirement.recording_days, 15);
  assert.equal(result.requirement.wiring_type, "conduit");
  assert.equal(result.requirement.cabling_mode, "mixed");
  assert.equal(result.requirement.cable_type, "CAT6");
  assert.equal(result.requirement.cabling_needed_cameras, 2);
  assert.equal(result.requirement.cable_length_meters, 80);
  assert.equal(result.requirement.power_wiring_option, "wire_needed");
  assert.equal(result.requirement.total_power_cable_meters, 25);
  assert.equal(result.requirement.wireless_power?.power_wiring_option, "wire_needed");
  assert.equal(result.requirement.wireless_power?.total_power_cable_meters, 25);
  assert.equal(result.requirement.installation_preference, "pro");
  assert.equal(result.requirement.cameras[0]?.technology, "Wireless");
  assert.equal(result.requirement.cameras[0]?.wireless_family, "4g_solar");
  assert.deepEqual(result.requirement.location, {
    city: "Jaipur",
    state: "Rajasthan",
    pincode: "302001",
  });
});

test("normalizeRequirement sanitizes recorder/storage aliases and preserves brands", () => {
  const result = normalizeRequirement({
    camera_count: 4,
    cameras: [
      {
        technology: "IP",
        count: 4,
        resolution: "4MP",
      },
    ],
    recording: {
      mode: "continuous",
      days: 15,
    },
    installation_type: "replacement",
    cabling: {
      mode: "all_new",
      wiring_type: "open",
      cable_type: "CAT6",
      cabling_needed_cameras: 4,
      cable_length_meters: 100,
    },
    recorder: {
      brand: "Hikvision",
      technology: "IP",
      channels: 8,
    },
    storage: {
      brand: "Seagate",
      selected: true,
    },
    location: {
      pincode: "302001",
    },
  });

  assert.equal(result.requirement.recorder_brand, "Hikvision");
  assert.equal(result.requirement.recorder_technology, "IP");
  assert.equal(result.requirement.recorder_channels, 8);
  assert.equal(result.requirement.recorder?.channel_capacity, 8);
  assert.equal(result.requirement.storage_brand, "Seagate");
  assert.equal(result.requirement.storage_selected, true);
  assert.equal(result.requirement.storage?.brand, "Seagate");
  assert.equal(result.requirement.location?.pincode, "302001");
  assert.equal(result.requirement.existing_system, undefined);
});

test("normalizeRequirement preserves ceiling_height string enum and emits LEGACY_PLAN_DRIFT", () => {
  const result = normalizeRequirement({
    camera_count: 2,
    cameras: [
      {
        technology: "IP",
        count: 2,
        resolution: "4MP",
      },
    ],
    plan_type: "recommended",
    ceiling_height: "very_high",
    location: {
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
    },
  });

  assert.equal(result.requirement.ceiling_height, "very_high");
  assert.equal(result.requirement.legacy_plan_type, "recommended");
  assert.ok(result.warnings.some((warning) => warning.code === "LEGACY_PLAN_DRIFT"));
});
