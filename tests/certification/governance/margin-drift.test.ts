import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildSkuCrosswalk } from "../fixtures/sku-crosswalk.ts";

test("Phase 5.3 Catalog Governance - Margin Drift Register Verification", async (t) => {
  const registerPath = join(process.cwd(), "tests/certification/governance/MARGIN_DRIFT_REGISTER.json");
  assert.ok(existsSync(registerPath), "MARGIN_DRIFT_REGISTER.json must exist");

  const register = JSON.parse(readFileSync(registerPath, "utf8"));
  assert.equal(register.governance_version, "TEAM-CCTV-GOV-V1");
  assert.equal(register.total_records, 21, "Register must account for exactly 21 records");
  assert.equal(register.records.length, 21);

  const snapshotPath = join(process.cwd(), "tests/certification/fixtures/CERTIFICATION_SNAPSHOT_BUNDLE.json");
  const bundle = JSON.parse(readFileSync(snapshotPath, "utf8"));
  const products = bundle.context?.products ?? bundle.products ?? [];

  const crosswalk = buildSkuCrosswalk(products, products, 0);
  assert.equal(crosswalk.margin_drift_skus.length, 21, "Crosswalk must produce exactly 21 margin drift SKUs");

  const registerSkus = new Set(register.records.map((r: any) => r.sku));

  await t.test("Every crosswalk drift SKU is present in the governance register", () => {
    for (const sku of crosswalk.margin_drift_skus) {
      assert.ok(registerSkus.has(sku), `SKU ${sku} must be in the governance register`);
    }
  });

  await t.test("Every register entry reconciles with snapshot base cost and actual unit price", () => {
    for (const record of register.records) {
      const prod = products.find((p: any) => (p.sku || p.id) === record.sku);
      assert.ok(prod, `Product ${record.sku} must exist in snapshot`);
      assert.equal(record.actual_unit_price, prod.unit_price, `Unit price for ${record.sku} must match snapshot`);
      assert.equal(record.base_cost, prod.base_cost, `Base cost for ${record.sku} must match snapshot`);

      const expected = Math.round((prod.base_cost * (100 + record.margin_percent)) / 100);
      assert.equal(record.expected_unit_price, expected, `Expected price for ${record.sku} must match formula`);
      assert.equal(record.drift_rupees, prod.unit_price - expected, `Drift for ${record.sku} must match`);
    }
  });

  await t.test("Drift classification structure: 19 rounding artifacts (±₹1) and 2 strategic overrides (+₹120)", () => {
    const roundingRecords = register.records.filter((r: any) => Math.abs(r.drift_rupees) === 1);
    const strategicRecords = register.records.filter((r: any) => r.drift_rupees === 120);

    assert.equal(roundingRecords.length, 19, "Must have exactly 19 ±₹1 rounding artifacts");
    assert.equal(strategicRecords.length, 2, "Must have exactly 2 +₹120 strategic overrides");

    const strategicSkus = strategicRecords.map((r: any) => r.sku).sort();
    assert.deepEqual(strategicSkus, ["HDD-BUD-500GB", "hdd_1tb_wd_purple"].sort());
  });

  await t.test("All 21 records have approved action KEEP_CURRENT_UNIT_PRICE", () => {
    for (const record of register.records) {
      assert.equal(record.action, "KEEP_CURRENT_UNIT_PRICE");
      assert.equal(record.review_status, "APPROVED");
      assert.equal(record.certification_impact, "NONE");
    }
  });
});
