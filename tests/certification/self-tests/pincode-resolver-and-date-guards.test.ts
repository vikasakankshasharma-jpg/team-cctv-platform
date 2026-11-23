import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolvePincodeHierarchy, formatLocationDisplay } from "../../../lib/geo/pincode-resolver";
import { getTodayIST, getTomorrowIST, isPastDateIST, isPastSlotIST } from "../../../lib/date-utils";

describe("Indian Postal Hierarchy Resolver (Zero-Cost, Zero-Latency)", () => {
  test("resolves 508001 (Nalgonda, Telangana) correctly", () => {
    const res = resolvePincodeHierarchy("508001");
    assert.equal(res.state, "Telangana");
    assert.equal(res.district, "Nalgonda");
    assert.equal(res.isRecognized, true);
  });

  test("resolves 331024 (Churu, Rajasthan) correctly", () => {
    const res = resolvePincodeHierarchy("331024");
    assert.equal(res.state, "Rajasthan");
    assert.equal(res.district, "Churu");
    assert.equal(res.isRecognized, true);
  });

  test("resolves major metropolitan centers across India", () => {
    assert.equal(resolvePincodeHierarchy("110001").state, "Delhi");
    assert.equal(resolvePincodeHierarchy("400001").state, "Maharashtra");
    assert.equal(resolvePincodeHierarchy("560001").state, "Karnataka");
    assert.equal(resolvePincodeHierarchy("600001").state, "Tamil Nadu");
    assert.equal(resolvePincodeHierarchy("700001").state, "West Bengal");
    assert.equal(resolvePincodeHierarchy("380001").state, "Gujarat");
  });

  test("formatLocationDisplay completely bans and eliminates 'Unknown'", () => {
    const formatted = formatLocationDisplay({
      city: "Unknown",
      pincode: "508001"
    });
    assert.ok(!formatted.includes("Unknown"), "Must not contain 'Unknown'");
    assert.equal(formatted, "Nalgonda, Telangana (508001)");
  });

  test("formatLocationDisplay with clean area, city and pincode", () => {
    const formatted = formatLocationDisplay({
      area: "Miryalguda",
      city: "Nalgonda",
      state: "Telangana",
      pincode: "508001"
    });
    assert.equal(formatted, "Miryalguda, Nalgonda, Telangana (508001)");
  });
});

describe("IST Timezone Date & Slot Boundary Guards", () => {
  test("getTodayIST returns valid YYYY-MM-DD", () => {
    const today = getTodayIST();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  });

  test("getTomorrowIST is strictly greater than getTodayIST", () => {
    const today = getTodayIST();
    const tomorrow = getTomorrowIST();
    assert.ok(tomorrow > today, "Tomorrow must be chronologically after today");
  });

  test("isPastDateIST accurately detects past dates", () => {
    // 23 October 2026 is strictly in the past relative to November 2026
    assert.equal(isPastDateIST("2026-10-23"), true);
    assert.equal(isPastDateIST("2020-01-01"), true);
  });

  test("isPastDateIST rejects today and future dates", () => {
    const today = getTodayIST();
    const tomorrow = getTomorrowIST();
    assert.equal(isPastDateIST(today), false);
    assert.equal(isPastDateIST(tomorrow), false);
    assert.equal(isPastDateIST("2099-12-31"), false);
  });

  test("isPastSlotIST validates past slots on current day", () => {
    // A past date is always a past slot
    assert.equal(isPastSlotIST("2026-10-23", "morning"), true);
    // A future date is never a past slot
    assert.equal(isPastSlotIST("2099-12-31", "morning"), false);
  });
});
