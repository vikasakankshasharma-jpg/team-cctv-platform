import { strict as assert } from "node:assert";
import { test } from "node:test";
import { buildSkuCrosswalk } from "../fixtures/sku-crosswalk.ts";

test("exact SKU is MATCHED", () => {
  const result = buildSkuCrosswalk(
    [
      {
        sku: "CAM-IP-4MP-001",
        base_cost: 1000,
        unit_price: 1200,
      },
    ],
    [
      {
        sku: "CAM-IP-4MP-001",
        base_cost: 1000,
        unit_price: 1200,
        margin_percent: 20,
        is_active: true,
      },
    ],
  );

  assert.equal(result.entries[0]?.status, "MATCHED");
});

test("margin calculation uses rounded whole rupees", () => {
  const result = buildSkuCrosswalk(
    [{ sku: "CAM-001", base_cost: 999 }],
    [
      {
        sku: "CAM-001",
        base_cost: 999,
        margin_percent: 20,
        unit_price: 1199,
        is_active: true,
      },
    ],
  );

  assert.equal(result.entries[0]?.expected_unit_price, 1199);
  assert.equal(result.entries[0]?.status, "MATCHED");
});

test("unmapped source SKU and missing active catalog SKU are detected", () => {
  const unmapped = buildSkuCrosswalk([{ sku: "SOURCE-001", base_cost: 100 }], []);
  assert.equal(unmapped.entries[0]?.status, "UNMAPPED");
  assert.deepEqual(unmapped.unmapped_source_skus, ["SOURCE-001"]);

  const missing = buildSkuCrosswalk([], [{ sku: "CAT-001", is_active: true, is_deleted: false }]);
  assert.deepEqual(missing.missing_active_catalog_skus, ["CAT-001"]);
});

test("duplicate normalized catalog SKUs are AMBIGUOUS while duplicate source rows track separately", () => {
  const ambiguousCatalog = buildSkuCrosswalk(
    [{ sku: "CAM-001", base_cost: 100 }],
    [
      { sku: "CAM-001", is_active: true },
      { sku: "CAM_001", is_active: true },
    ],
  );
  assert.equal(ambiguousCatalog.entries[0]?.status, "AMBIGUOUS");
  assert.deepEqual(ambiguousCatalog.ambiguous_source_skus, ["CAM-001"]);

  const duplicateSource = buildSkuCrosswalk(
    [
      { sku: "CAM-001", base_cost: 100 },
      { sku: "CAM-001", base_cost: 110 },
    ],
    [{ sku: "CAM-001", is_active: true }],
  );
  assert.deepEqual(duplicateSource.duplicate_source_skus, ["CAM001"]);
  assert.equal(duplicateSource.entries[0]?.status, "MATCHED");
});

test("cost drift and margin drift are detected", () => {
  const costDrift = buildSkuCrosswalk(
    [{ sku: "CAM-001", base_cost: 1000 }],
    [
      {
        sku: "CAM-001",
        base_cost: 1100,
        margin_percent: 20,
        unit_price: 1320,
        is_active: true,
      },
    ],
  );
  assert.equal(costDrift.entries[0]?.status, "COST_DRIFT");

  const marginDrift = buildSkuCrosswalk(
    [{ sku: "CAM-001", base_cost: 1000 }],
    [
      {
        sku: "CAM-001",
        base_cost: 1000,
        margin_percent: 20,
        unit_price: 1150,
        is_active: true,
      },
    ],
  );
  assert.equal(marginDrift.entries[0]?.status, "MARGIN_DRIFT");
});
