import test from "node:test";
import assert from "node:assert/strict";
import { calculateOracleMargin, DEFAULT_COMPONENT_MARGINS } from "../oracle/margin-oracle.ts";

test("component margins use independent non-tiered policy", () => {
  assert.equal(DEFAULT_COMPONENT_MARGINS.margin_cctv_camera, 15);
  assert.equal(DEFAULT_COMPONENT_MARGINS.margin_recorder, 15);
  assert.equal(DEFAULT_COMPONENT_MARGINS.margin_hdd, 5);
  assert.equal(DEFAULT_COMPONENT_MARGINS.cable_margin, 40);
});

test("nearest_1 and nearest_10 are configurable", () => {
  const product = { sku: "X", category: "camera", base_cost: 101, unit_price: 0 };
  assert.equal(calculateOracleMargin(product, { rounding_mode: "nearest_1" })?.selling_price_gross_inclusive, 116);
  assert.equal(calculateOracleMargin(product, { rounding_mode: "nearest_10" })?.selling_price_gross_inclusive, 120);
});


test("budget brand overrides use 30% camera and 10% HDD margins", () => {
  assert.equal(calculateOracleMargin({ sku: "BC", category: "camera", brand: "Budget Brand", base_cost: 100 })?.margin_percent, 30);
  assert.equal(calculateOracleMargin({ sku: "BH", category: "hdd", brand: "Budget Brand", base_cost: 100 })?.margin_percent, 10);
});

test("unknown component does not inherit a 20% markup", () => {
  assert.equal(calculateOracleMargin({ sku: "X", category: "mystery", base_cost: 100 })?.margin_percent, 0);
});
