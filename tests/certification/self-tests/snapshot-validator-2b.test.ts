import { strict as assert } from "node:assert";
import test from "node:test";
import { validateFrozenSnapshot } from "../snapshots/snapshot-validator.ts";
import { classifyCameraCount, isQuotableDespiteStock } from "../production/certification-rules.ts";

const base = {
  products: [],
  addons: [],
  addon_rules: [],
  geo_rules: [],
  promoters: [],
  app_settings: {},
  sku_crosswalk: {},
  manifest: {},
};

test("snapshot validator blocks mockSettings and synthetic catalog SKUs", () => {
  const context = {
    ...base,
    products: [
      { sku: "mockSettings", is_active: true },
      { sku: "mock-camera", is_active: true },
      { sku: "__calculated_RJ45__", is_active: true },
    ],
  } as never;
  const report = validateFrozenSnapshot(context);
  assert.equal(report.valid, false);
  assert.equal(report.findings.filter((f) => f.code === "FORBIDDEN_SKU").length, 3);
});

test("snapshot validator permits active out-of-stock quotable products", () => {
  const product = { sku: "CAM-001", is_active: true, is_deleted: false, is_quotation_eligible: true, stock_status: "out_of_stock" };
  const report = validateFrozenSnapshot({ ...base, products: [product] } as never);
  assert.equal(report.findings.some((f) => f.code === "OUT_OF_STOCK_BLOCKED"), false);
  assert.equal(isQuotableDespiteStock(product), true);
});

test("camera-count boundary policy is locked", () => {
  assert.equal(classifyCameraCount(0, "HD"), "INVALID");
  assert.equal(classifyCameraCount(16, "HD"), "VALID");
  assert.equal(classifyCameraCount(17, "HD"), "MANUAL_QUOTE");
  assert.equal(classifyCameraCount(128, "HD"), "MANUAL_QUOTE");
  assert.equal(classifyCameraCount(1, "IP"), "VALID");
  assert.equal(classifyCameraCount(32, "IP"), "VALID");
  assert.equal(classifyCameraCount(33, "IP"), "MANUAL_QUOTE");
  assert.equal(classifyCameraCount(128, "IP"), "MANUAL_QUOTE");
  assert.equal(classifyCameraCount(1, "Wireless"), "VALID");
  assert.equal(classifyCameraCount(16, "Wireless"), "VALID");
  assert.equal(classifyCameraCount(17, "Wireless"), "MANUAL_QUOTE");
  assert.equal(classifyCameraCount(128, "Wireless"), "MANUAL_QUOTE");
  assert.equal(classifyCameraCount(129, "IP"), "INVALID");
});
